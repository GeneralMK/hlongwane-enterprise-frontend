import axios from 'axios'
import type {
  InitializePaymentInput,
  Payment,
  PaymentDetails,
  Refund,
  RefundPaymentInput
} from '../rest/paymentTypes'
import { fetchJwt } from '.'
export const API_HOST = import.meta.env.VITE_APP_API_HOST

type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

type ApiErrorResponse = {
  message?: string
  error?:
    | string
    | {
        code?: string
        message?: string
      }
}

const paymentApi = axios.create({
  baseURL: `${API_HOST.replace(/\/+$/, '')}/api/v1/payments`,
  timeout: 20_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
})

function authorization(): string {
  const token = fetchJwt()?.trim()

  if (!token) {
    throw new Error('Authentication is required. Please sign in again.')
  }

  return /^Bearer\s/i.test(token) ? token : `Bearer ${token}`
}

function requestError(error: unknown): Error {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return error instanceof Error ? error : new Error('Payment request failed.')
  }

  const body = error.response?.data

  const nestedMessage = typeof body?.error === 'string' ? body.error : body?.error?.message

  return new Error(
    nestedMessage ||
      body?.message ||
      (error.response?.status === 401
        ? 'Your session has expired. Please sign in again.'
        : error.response
        ? `Payment request failed (${error.response.status}).`
        : 'Unable to connect to the payment server.')
  )
}

async function paymentRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
  signal?: AbortSignal
): Promise<T> {
  try {
    const response = await paymentApi.request<ApiResponse<T>>({
      method,
      url: path,
      data: body,
      signal,
      headers: {
        Authorization: authorization()
      }
    })

    if (!response.data.success || response.data.data == null) {
      throw new Error(response.data.message || 'Payment request failed.')
    }

    return response.data.data
  } catch (error) {
    throw requestError(error)
  }
}

export function initializePayment(input: InitializePaymentInput): Promise<Payment> {
  return paymentRequest('POST', '/checkout', input)
}

export function initializePaystackCheckout(
  orderId: string,
  callbackUrl?: string
): Promise<Payment> {
  return initializePayment({
    orderId,
    provider: 'PAYSTACK',
    ...(callbackUrl ? { callbackUrl } : {})
  })
}

export function getPayment(id: string, signal?: AbortSignal): Promise<PaymentDetails> {
  return paymentRequest('GET', `/${encodeURIComponent(id)}`, undefined, signal)
}

export function getPaymentByReference(
  reference: string,
  signal?: AbortSignal
): Promise<PaymentDetails> {
  return paymentRequest('GET', `/reference/${encodeURIComponent(reference)}`, undefined, signal)
}

export function requestPaymentRefund(
  paymentId: string,
  input: RefundPaymentInput
): Promise<Refund> {
  return paymentRequest('POST', `/${encodeURIComponent(paymentId)}/refund`, input)
}

export const USER_STORAGE_KEY = 'dlinkup_WEB'
export const GRAPHQL_SECRET = import.meta.env.VITE_APP_GRAPHQL_SECRET

export const STRONG_PASSWORD_REGEX = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])(?=.{8,})/g
export const MEDIUM_PASSWORD_REGEX =
  /((?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])(?=.{6,}))|((?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=.{8,}))/g

export const ID_NUMBER_REGEX = {
  pattern: /^([0-9])(?=.{12}$)/,
  message: 'ID number should be 13 digits long'
}

export const SIGNATURE_FONTS = [
  { value: "'Dancing Script', cursive", label: 'Dancing Script' },
  { value: "'Great Vibes', cursive", label: 'Great Vibes' },
  { value: "'Caveat', cursive", label: 'Caveat' },
  { value: "'Sacramento', cursive", label: 'Sacramento' }
] as const

export const DEFAULT_SIGNATURE_FONT = SIGNATURE_FONTS[0].value

export const PIN_ERROR = {
  INVALID: 'INVALID_PIN',
  EXPIRED: 'EXPIRED',
  LOCKED: 'LOCKED'
} as const
export type PinErrorCode = typeof PIN_ERROR[keyof typeof PIN_ERROR]

export const SIGNATURE_INK_COLOR = '#0F4880'

// Canvas font sizes used by the typed-signature and date-stamp generators.
export const SIGNATURE_FONT_SIZE_PX = 40
export const INITIALS_FONT_SIZE_PX = 32
export const DATE_STAMP_FONT_SIZE_PX = 18

// PDF user-space points; preserves the 5:1 aspect of the source canvas.
export const DATE_STAMP_SIZE = { width: 100, height: 20 } as const

// Free-form `Notification.type` values.
export const NOTIFICATION_TYPE = {
  GUEST_SIGNED: 'GUEST_SIGNED'
} as const
export type NotificationTypeCode = typeof NOTIFICATION_TYPE[keyof typeof NOTIFICATION_TYPE]
