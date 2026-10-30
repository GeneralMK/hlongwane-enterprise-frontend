import axios from 'axios'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthContext } from './Auth'
import { API_HOST } from '../utils/contants'

export interface CartItem {
  id: string
  cartId: string
  variantId: string
  quantity: number
  unitPriceSnapshot: string
  variant: {
    id: string
    sku: string
    price: string
    salePrice?: string | null
    isActive: boolean
    inventory?: {
      physicalQuantity: number
      reservedQuantity: number
    } | null
    product: {
      id: string
      name: string
      images?: Array<{
        id: string
        isPrimary: boolean
        position: number
        fileUpload?: {
          publicUrl?: string | null
          path?: string | null
        } | null
      }>
    }
  }
}

export interface Cart {
  id: string
  currency: string
  items: CartItem[]
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

interface CartContextValue {
  cart: Cart | null
  items: CartItem[]
  itemCount: number
  subtotal: number
  loading: boolean
  updating: boolean
  error: string | null

  refreshCart: () => Promise<void>
  addItem: (variantId: string, quantity: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  openCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const api = axios.create({
  baseURL: `${API_HOST.trim().replace(/\/+$/, '')}/api/v1`,
  timeout: 20_000,
  headers: {
    Accept: 'application/json'
  }
})

function headers(token: string) {
  const value = token.trim()

  return {
    Authorization: /^Bearer\s/i.test(value) ? value : `Bearer ${value}`
  }
}

function unwrap<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data == null) {
    throw new Error('Unable to retrieve your cart.')
  }

  return body.data
}

function getCartError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Unable to update your cart.'
  }

  if (!error.response) {
    return 'Unable to connect. Check your cart before trying again.'
  }

  if (error.response.status === 401) {
    return 'Your session has expired. Please sign in again.'
  }

  if (error.response.status >= 500) {
    return 'Unable to confirm the cart update. Please refresh your cart.'
  }

  const body = error.response.data as {
    message?: string
    error?: string | { message?: string }
  }

  const nested = typeof body?.error === 'string' ? body.error : body?.error?.message

  return nested || body?.message || 'Unable to update your cart.'
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticating } = useAuthContext()
  const navigate = useNavigate()

  const [state, setState] = useState<{
    identity: string | null
    cart: Cart | null
    loading: boolean
    error: string | null
  }>({
    identity: null,
    cart: null,
    loading: false,
    error: null
  })

  const [pending, setPending] = useState<{
    identity: string | null
    count: number
  }>({
    identity: null,
    count: 0
  })

  const identity = isAuthenticating ? null : token
  const identityRef = useRef(identity)
  identityRef.current = identity

  const mounted = useRef(false)
  const readVersion = useRef(0)
  const mutationLock = useRef<string | null>(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const refreshCart = useCallback(async () => {
    const requestToken = identity

    if (!requestToken) return

    const version = ++readVersion.current

    setState((previous) => ({
      identity: requestToken,
      cart: previous.identity === requestToken ? previous.cart : null,
      loading: true,
      error: null
    }))

    try {
      const response = await api.get<ApiResponse<Cart>>('/carts/me', {
        headers: headers(requestToken)
      })

      const cart = unwrap(response.data)

      if (
        !mounted.current ||
        identityRef.current !== requestToken ||
        version !== readVersion.current
      ) {
        return
      }

      setState({
        identity: requestToken,
        cart,
        loading: false,
        error: null
      })
    } catch (error) {
      if (
        mounted.current &&
        identityRef.current === requestToken &&
        version === readVersion.current
      ) {
        setState((previous) => ({
          identity: requestToken,
          cart: previous.identity === requestToken ? previous.cart : null,
          loading: false,
          error: getCartError(error)
        }))
      }
    }
  }, [identity])

  useEffect(() => {
    if (!identity) {
      readVersion.current++
      setState({
        identity: null,
        cart: null,
        loading: false,
        error: null
      })
      return
    }

    void refreshCart()

    const onFocus = () => {
      void refreshCart()
    }

    window.addEventListener('focus', onFocus)

    return () => {
      readVersion.current++
      window.removeEventListener('focus', onFocus)
    }
  }, [identity, refreshCart])

  const mutate = useCallback(
    async (operation: (requestToken: string) => Promise<unknown>) => {
      const requestToken = identity

      if (!requestToken) {
        throw new Error('Please sign in to use your cart.')
      }

      if (mutationLock.current === requestToken) {
        throw new Error('Please wait for your current cart update to finish.')
      }

      mutationLock.current = requestToken

      // Prevent a pending read from overwriting newer cart changes.
      readVersion.current++

      setPending({
        identity: requestToken,
        count: 1
      })

      setState((previous) => ({
        identity: requestToken,
        cart: previous.identity === requestToken ? previous.cart : null,
        loading: false,
        error: null
      }))

      try {
        await operation(requestToken)

        if (identityRef.current === requestToken && mounted.current) {
          // Re-read the complete cart so every consumer gets the same data.
          await refreshCart()
        }
      } catch (error) {
        const message = getCartError(error)

        if (identityRef.current === requestToken && mounted.current) {
          setState((previous) => ({
            identity: requestToken,
            cart: previous.identity === requestToken ? previous.cart : null,
            loading: false,
            error: message
          }))
        }

        throw new Error(message)
      } finally {
        if (mutationLock.current === requestToken) {
          mutationLock.current = null
        }

        if (identityRef.current === requestToken && mounted.current) {
          setPending({
            identity: requestToken,
            count: 0
          })
        }
      }
    },
    [identity, refreshCart]
  )

  const addItem = useCallback(
    async (variantId: string, quantity: number) => {
      if (!variantId || !Number.isSafeInteger(quantity) || quantity < 1) {
        throw new Error('Select a product and a valid quantity.')
      }

      await mutate(async (requestToken) => {
        const response = await api.post<ApiResponse<{ id: string }>>(
          '/carts/me/items',
          { variantId, quantity },
          { headers: headers(requestToken) }
        )

        unwrap(response.data)
      })
    },
    [mutate]
  )

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!Number.isSafeInteger(quantity) || quantity < 1) {
        throw new Error('Quantity must be a positive integer.')
      }

      await mutate(async (requestToken) => {
        const response = await api.patch<ApiResponse<{ id: string }>>(
          `/carts/me/items/${encodeURIComponent(itemId)}`,
          { quantity },
          { headers: headers(requestToken) }
        )

        unwrap(response.data)
      })
    },
    [mutate]
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      await mutate((requestToken) =>
        api.delete(`/carts/me/items/${encodeURIComponent(itemId)}`, {
          headers: headers(requestToken)
        })
      )
    },
    [mutate]
  )

  const openCart = useCallback(() => {
    navigate('/cart')
  }, [navigate])

  const current = Boolean(identity) && state.identity === identity
  const cart = current ? state.cart : null
  const items = cart?.items ?? []

  const itemCount = items.reduce((total, item) => total + item.quantity, 0)

  const subtotal = items.reduce(
    (total, item) => total + Number(item.unitPriceSnapshot) * item.quantity,
    0
  )

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      items,
      itemCount,
      subtotal,
      loading: Boolean(identity) && (!current || state.loading),
      updating: pending.identity === identity && pending.count > 0,
      error: current ? state.error : null,
      refreshCart,
      addItem,
      updateQuantity,
      removeItem,
      openCart
    }),
    [
      cart,
      items,
      itemCount,
      subtotal,
      identity,
      current,
      state.loading,
      state.error,
      pending,
      refreshCart,
      addItem,
      updateQuantity,
      removeItem,
      openCart
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used inside CartProvider.')
  }

  return context
}
