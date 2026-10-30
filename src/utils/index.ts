import DateFnsFormatDate from 'date-fns/format'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'

import { version } from '../../package.json'
import { USER_STORAGE_KEY } from './contants'

export const APP_VERSION = `V${version}`

type StoredAuthentication = {
  jwt?: unknown
  token?: unknown
  user?: unknown
}

export const formatDate = (date?: string | null): string => {
  if (date) {
    return DateFnsFormatDate(new Date(date), 'dd LLLL yyyy')
  }

  return DateFnsFormatDate(new Date(), 'dd LLLL yyyy')
}

export const thenToNow = (date?: string | null): string => {
  if (date) {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true
    })
  }

  return 'Unknown'
}

export const formatAmount = (amount: unknown, currency?: string | null): string => {
  const symbol = currency ?? 'R'

  const numericAmount = Number(amount)

  if (Number.isFinite(numericAmount)) {
    return `${symbol} ` + numericAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')
  }

  return `${symbol} 0.00`
}

function readStoredAuthentication(value: string | null): StoredAuthentication | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as unknown

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null
    }

    return parsed as StoredAuthentication
  } catch {
    return null
  }
}

function normalizeJwt(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const token = value.replace(/^Bearer\s+/i, '').trim()

  return token || null
}

/**
 * Returns the authenticated user's JWT.
 *
 * Session storage is checked before remembered local-storage authentication.
 */
export function fetchJwt(): string | null {
  if (typeof window === 'undefined') return null
  try {
    for (const storage of [window.sessionStorage, window.localStorage]) {
      const authentication = readStoredAuthentication(storage.getItem(USER_STORAGE_KEY))
      const token = normalizeJwt(authentication?.jwt) ?? normalizeJwt(authentication?.token)
      if (token) return token
    }
  } catch { return null }
  return null
}

export function hasValidStoredAuthentication(): boolean {
  return Boolean(fetchJwt())
}

export function clearStoredAuthentication(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(USER_STORAGE_KEY)

  /*
   * Remove a possible legacy session login
   * without affecting checkout session data.
   */
  window.sessionStorage.removeItem(USER_STORAGE_KEY)
}

export const formatEnum = (enumValue: unknown): string => {
  return typeof enumValue === 'string' ? enumValue.replace(/_/g, ' ') : ''
}

export const convertToSentenceCase = (input: string): string => {
  const spacedString = input.replace(/([a-z])([A-Z])/g, '$1 $2')

  return spacedString.charAt(0).toUpperCase() + spacedString.slice(1)
}
