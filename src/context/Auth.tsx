import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import AuthService from '../auth'
import type { AuthUser, LoginPayload, RegisterInput } from '../auth'
import { UNAUTHORIZED_EVENT, SESSION_CHANGED_EVENT } from '../rest/api/session'
import { USER_STORAGE_KEY } from '../utils/contants'

type Props = {
  children?: React.ReactNode
}

type AuthContextValue = {
  user: AuthUser | undefined
  token: string | null
  isAdmin: boolean
  isSuperAdmin: boolean
  isAuthenticated: boolean
  isAuthenticating: boolean

  signIn: (
    email: string | null,
    mobileNumber: string | null,
    isAuthValueEmail: boolean,
    password: string,
    isAdmin?: boolean,
    platform?: string,
    rememberMe?: boolean,
    redirectToDashboard?: boolean
  ) => Promise<void>

  signUp: (input: RegisterInput, redirectToDashboard?: boolean) => Promise<void>

  signOut: () => void
  refreshUser: () => Promise<void>
}

type StoredAuthentication = {
  session: LoginPayload
  rememberMe: boolean
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

export function useAuthContext(): AuthContextValue {
  const context = React.useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider.')
  }

  return context
}

function dashboardFor(user: AuthUser): string {
  return user.isSuperAdmin ? '/admin/dashboard' : '/dashboard'
}

function readAuthentication(storage: Storage): LoginPayload | null {
  try {
    const raw = storage.getItem(USER_STORAGE_KEY)

    if (!raw) return null

    const value = JSON.parse(raw) as Partial<LoginPayload>

    if (
      typeof value.jwt !== 'string' ||
      !value.jwt.trim() ||
      !value.user ||
      typeof value.user.id !== 'string'
    ) {
      return null
    }

    return {
      jwt: value.jwt.trim(),
      user: value.user
    }
  } catch {
    return null
  }
}

function storedAuthentication(): StoredAuthentication | null {
  const session = readAuthentication(sessionStorage)

  if (session) {
    return {
      session,
      rememberMe: false
    }
  }

  const local = readAuthentication(localStorage)

  return local
    ? {
        session: local,
        rememberMe: true
      }
    : null
}

function writeAuthentication(session: LoginPayload, rememberMe: boolean): void {
  const target = rememberMe ? localStorage : sessionStorage
  const other = rememberMe ? sessionStorage : localStorage

  target.setItem(USER_STORAGE_KEY, JSON.stringify(session))
  other.removeItem(USER_STORAGE_KEY)
}

function removeAuthentication(): void {
  for (const getStorage of [() => window.localStorage, () => window.sessionStorage]) {
    try {
      getStorage().removeItem(USER_STORAGE_KEY)
    } catch {
      // The provider also clears its in-memory session.
    }
  }
}

function notifySessionChanged(): void {
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT))
}

export default function AuthProvider({ children }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [session, setSession] = React.useState<LoginPayload | null>(null)

  const [isAuthenticating, setIsAuthenticating] = React.useState(true)

  const sessionRef = React.useRef<LoginPayload | null>(null)
  const generation = React.useRef(0)
  const mounted = React.useRef(false)

  React.useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
      generation.current++
    }
  }, [])

  const clearQueryCache = React.useCallback(() => {
    void queryClient.cancelQueries()
    queryClient.clear()
  }, [queryClient])

  const clearAuthentication = React.useCallback(() => {
    generation.current++
    sessionRef.current = null

    removeAuthentication()
    clearQueryCache()

    if (mounted.current) {
      setSession(null)
      setIsAuthenticating(false)
    }

    notifySessionChanged()
  }, [clearQueryCache])

  const persistAuthentication = React.useCallback(
    (next: LoginPayload, rememberMe: boolean): void => {
      if (!next.jwt?.trim() || !next.user || !next.user.isActive) {
        throw new Error('The server returned an invalid authentication response.')
      }

      const normalized: LoginPayload = {
        jwt: next.jwt.trim(),
        user: next.user
      }

      writeAuthentication(normalized, rememberMe)

      generation.current++
      sessionRef.current = normalized

      clearQueryCache()

      if (mounted.current) {
        setSession(normalized)
        setIsAuthenticating(false)
      }

      notifySessionChanged()
    },
    [clearQueryCache]
  )

  React.useEffect(() => {
    const controller = new AbortController()
    const requestGeneration = generation.current

    async function restoreSession(): Promise<void> {
      try {
        const stored = storedAuthentication()

        if (!stored) return

        const user = await AuthService.me(stored.session.jwt, controller.signal)

        if (
          controller.signal.aborted ||
          !mounted.current ||
          generation.current !== requestGeneration
        ) {
          return
        }

        if (!user.isActive) {
          clearAuthentication()
          return
        }

        const restored: LoginPayload = {
          jwt: stored.session.jwt,
          user
        }

        writeAuthentication(restored, stored.rememberMe)

        sessionRef.current = restored
        setSession(restored)

        notifySessionChanged()
      } catch {
        if (
          !controller.signal.aborted &&
          mounted.current &&
          generation.current === requestGeneration
        ) {
          clearAuthentication()
        }
      } finally {
        if (
          !controller.signal.aborted &&
          mounted.current &&
          generation.current === requestGeneration
        ) {
          setIsAuthenticating(false)
        }
      }
    }

    void restoreSession()

    return () => controller.abort()
  }, [clearAuthentication])

  React.useEffect(() => {
    const handleUnauthorized = () => clearAuthentication()

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)

    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    }
  }, [clearAuthentication])

  const signIn = React.useCallback(
    async (
      email: string | null,
      _mobileNumber: string | null,
      isAuthValueEmail: boolean,
      password: string,
      adminLogin = false,
      _platform?: string,
      rememberMe = false,
      redirectToDashboard = true
    ): Promise<void> => {
      if (!isAuthValueEmail || !email?.trim()) {
        throw new Error('Please sign in using your email address.')
      }

      if (!password) {
        throw new Error('Password is required.')
      }

      const operationGeneration = ++generation.current
      setIsAuthenticating(true)

      try {
        const next = await AuthService.login(email, password)

        if (!mounted.current || generation.current !== operationGeneration) {
          throw new Error('This sign-in attempt is no longer active. Please try again.')
        }

        if (adminLogin && !next.user.isSuperAdmin) {
          throw new Error('This account does not have SuperAdmin access.')
        }

        persistAuthentication(next, rememberMe)

        if (redirectToDashboard || adminLogin) {
          navigate(dashboardFor(next.user), {
            replace: true
          })
        }
      } finally {
        if (mounted.current && generation.current === operationGeneration) {
          setIsAuthenticating(false)
        }
      }
    },
    [navigate, persistAuthentication]
  )

  const signUp = React.useCallback(
    async (input: RegisterInput, redirectToDashboard = true): Promise<void> => {
      const operationGeneration = ++generation.current
      setIsAuthenticating(true)

      try {
        const next = await AuthService.register(input)

        if (!mounted.current || generation.current !== operationGeneration) {
          throw new Error('This registration attempt is no longer active. Please sign in.')
        }

        persistAuthentication(next, false)

        if (redirectToDashboard) {
          navigate(dashboardFor(next.user), {
            replace: true
          })
        }
      } finally {
        if (mounted.current && generation.current === operationGeneration) {
          setIsAuthenticating(false)
        }
      }
    },
    [navigate, persistAuthentication]
  )

  const signOut = React.useCallback(() => {
    clearAuthentication()
    navigate('/login', { replace: true })
  }, [clearAuthentication, navigate])

  const refreshUser = React.useCallback(async () => {
    const current = sessionRef.current

    if (!current) return

    const requestGeneration = generation.current
    const user = await AuthService.me(current.jwt)

    if (
      !mounted.current ||
      generation.current !== requestGeneration ||
      sessionRef.current?.jwt !== current.jwt
    ) {
      return
    }

    if (!user.isActive) {
      clearAuthentication()
      return
    }

    const stored = storedAuthentication()

    if (stored?.session.jwt !== current.jwt) {
      clearAuthentication()
      return
    }

    const next: LoginPayload = {
      jwt: current.jwt,
      user
    }

    writeAuthentication(next, stored.rememberMe)

    sessionRef.current = next
    setSession(next)

    notifySessionChanged()
  }, [clearAuthentication])

  const user = session?.user

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      token: session?.jwt ?? null,
      isAdmin: user?.isAdmin === true || user?.isSuperAdmin === true,
      isSuperAdmin: user?.isSuperAdmin === true,
      isAuthenticated: Boolean(session?.jwt && user?.isActive),
      isAuthenticating,
      signIn,
      signUp,
      signOut,
      refreshUser
    }),
    [user, session, isAuthenticating, signIn, signUp, signOut, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
