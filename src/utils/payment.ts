import axios from 'axios'

import { fetchJwt } from './index'
import { API_HOST } from './contants'

import type {
  InitializePaymentInput,
  Payment,
  PaymentDetails,
  Refund,
  RefundPaymentInput
} from '../rest/paymentTypes'

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
      (error?.response?.status === 401
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
