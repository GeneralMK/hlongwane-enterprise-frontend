import axios, { type AxiosError, type AxiosResponse } from 'axios'

import { fetchJwt } from '../utils'
import { API_HOST } from '../utils/contants'

export type InitializeCheckoutItem = {
  itemId: string
  mode: 'buy'
  quantity: number
  rentalStartDate?: string | null
  rentalEndDate?: string | null
}

export type InitializeDeliveryAddress = {
  recipientName: string
  phoneNumber: string

  addressLine1: string
  addressLine2?: string | null

  city: string
  province: string
  postalCode: string
  country: string

  formattedAddress?: string | null
  latitude?: number | null
  longitude?: number | null
  placeId?: string | null
  deliveryNotes?: string | null

  saveAddress?: boolean
  makeDefault?: boolean
}

export type InitializeCartCheckoutInput = {
  item: InitializeCheckoutItem
  deliveryAddress: InitializeDeliveryAddress
}

export type InitializeCartCheckoutResult = {
  checkoutId: string
  itemTransactionId: string
  deliveryAddressId?: string | null

  reference: string
  accessCode: string
  authorizationUrl: string

  amount: number
  currency: string
  purpose: string

  item?: {
    id: string
    name: string
    transactionType: string
    quantity: number
    unitPrice: number
    totalAmount: number
    rentalStartDate?: string | null
    rentalEndDate?: string | null
  }
}

type InitializeCartCheckoutResponse = {
  ok: boolean
  message: string
  data?: InitializeCartCheckoutResult
}

type ApiErrorResponse = {
  ok?: boolean
  code?: string
  message?: string
  error?:
    | string
    | {
        message?: string
      }
}

function getAuthorizationHeader(): string {
  const token = fetchJwt()

  if (!token) {
    throw new Error('Authentication is required. Please sign in again.')
  }

  return token.startsWith('Bearer ') ? token : `Bearer ${token}`
}

function getRequestError(error: unknown): Error {
  const axiosError = error as AxiosError<ApiErrorResponse>

  if (!axiosError.response) {
    return new Error(axiosError.message || 'Unable to connect to the payment server.')
  }

  const responseData = axiosError.response.data

  const nestedMessage =
    typeof responseData?.error === 'object' ? responseData.error?.message : responseData?.error

  const message =
    responseData?.message ||
    nestedMessage ||
    (axiosError.response.status === 401
      ? 'Your session is invalid or has expired. Please sign in again.'
      : `Unable to initialize payment (${axiosError.response.status}).`)

  return new Error(message)
}

export async function initializeCartPaystackCheckout(
  input: InitializeCartCheckoutInput
): Promise<InitializeCartCheckoutResult> {
  try {
    const response: AxiosResponse<InitializeCartCheckoutResponse> = await axios.post(
      `${API_HOST}/payments/paystack/checkout/initialize`,
      input,
      {
        headers: {
          Authorization: getAuthorizationHeader(),

          Accept: 'application/json',

          'Content-Type': 'application/json',

          'ngrok-skip-browser-warning': 'true'
        },

        /*
         * This may remain enabled for cookie-based
         * authentication, although this request now
         * also sends the JWT explicitly.
         */
        withCredentials: true,

        timeout: 20_000
      }
    )

    if (!response.data.ok || !response.data.data) {
      throw new Error(response.data.message || 'Unable to initialize Paystack payment.')
    }

    if (!response.data.data.authorizationUrl) {
      throw new Error('Paystack authorization URL was not returned.')
    }

    return response.data.data
  } catch (error) {
    if (error instanceof Error && !axios.isAxiosError(error)) {
      throw error
    }

    throw getRequestError(error)
  }
}
