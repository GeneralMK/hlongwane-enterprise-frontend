import axios from 'axios'

import { API_HOST } from '../../utils/contants'

export const ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PAYMENT_FAILED',
  'PAID',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURN_REQUESTED',
  'RETURNED',
  'REFUNDED',
  'PARTIALLY_REFUNDED'
] as const

export type OrderStatus = typeof ORDER_STATUSES[number]

export type AdminOrderItem = {
  id: string
  productNameSnapshot: string
  skuSnapshot: string
  quantity: number
  unitPrice: string
  lineTotal: string
}

export type AdminOrder = {
  id: string
  orderNumber: string
  userId: string | null
  guestEmail: string | null
  status: OrderStatus
  currency: string
  subtotal: string
  discountTotal: string
  deliveryFee: string
  taxTotal: string
  total: string
  deliveryAddress: unknown
  billingAddress?: unknown
  notes: string | null
  placedAt: string
  createdAt: string
  items: AdminOrderItem[]
}

export type OrdersPage = {
  items: AdminOrder[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

type ErrorResponse = {
  message?: string
  error?:
    | string
    | {
        message?: string
      }
}

const api = axios.create({
  baseURL: `${API_HOST.trim().replace(/\/+$/, '')}/api/v1`,
  timeout: 20_000,
  headers: {
    Accept: 'application/json'
  }
})

function authorization(token: string): string {
  const value = token.trim()

  if (!value) {
    throw new Error('Please sign in to continue.')
  }

  return /^Bearer\s/i.test(value) ? value : `Bearer ${value}`
}

function unwrap<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data == null) {
    throw new Error(body.message || 'The order request failed.')
  }

  return body.data
}

export function getOrderError(error: unknown): string {
  if (axios.isAxiosError<ErrorResponse>(error)) {
    const body = error.response?.data

    const message = typeof body?.error === 'string' ? body.error : body?.error?.message

    return (
      message ||
      body?.message ||
      (error.response?.status === 401
        ? 'Your session has expired. Please sign in again.'
        : error.response?.status === 403
        ? 'You do not have permission to manage orders.'
        : 'Unable to complete the order request.')
    )
  }

  return error instanceof Error ? error.message : 'The order request failed.'
}

export async function fetchAdminOrders(
  token: string,
  input: {
    page: number
    limit: number
    status?: OrderStatus
  },
  signal?: AbortSignal
): Promise<OrdersPage> {
  const response = await api.get<ApiResponse<OrdersPage>>('/orders', {
    params: input,
    signal,
    headers: {
      Authorization: authorization(token)
    }
  })

  return unwrap(response.data)
}

export async function fetchAdminOrder(
  token: string,
  id: string,
  signal?: AbortSignal
): Promise<AdminOrder> {
  const response = await api.get<ApiResponse<AdminOrder>>(`/orders/${encodeURIComponent(id)}`, {
    signal,
    headers: {
      Authorization: authorization(token)
    }
  })

  return unwrap(response.data)
}

export async function updateAdminOrderStatus(
  token: string,
  id: string,
  input: {
    status: OrderStatus
    note?: string
  }
): Promise<void> {
  const response = await api.patch<ApiResponse<unknown>>(
    `/orders/${encodeURIComponent(id)}/status`,
    input,
    {
      headers: {
        Authorization: authorization(token)
      }
    }
  )

  unwrap(response.data)
}

export function formatOrderStatus(status: OrderStatus): string {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function getNextOrderStatus(status: OrderStatus): OrderStatus | null {
  switch (status) {
    case 'PAID':
      return 'PROCESSING'
    case 'PROCESSING':
      return 'PACKED'
    case 'PACKED':
      return 'SHIPPED'
    case 'SHIPPED':
      return 'OUT_FOR_DELIVERY'
    case 'OUT_FOR_DELIVERY':
      return 'DELIVERED'
    default:
      return null
  }
}

export function getOrderActionLabel(status: OrderStatus): string {
  switch (status) {
    case 'PAID':
      return 'Start Processing'
    case 'PROCESSING':
      return 'Mark Packed'
    case 'PACKED':
      return 'Mark Shipped'
    case 'SHIPPED':
      return 'Out for Delivery'
    case 'OUT_FOR_DELIVERY':
      return 'Mark Delivered'
    default:
      return 'No action available'
  }
}

export function getOrderStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'PAYMENT_FAILED':
    case 'CANCELLED':
      return 'red'
    case 'PENDING_PAYMENT':
    case 'OUT_FOR_DELIVERY':
      return 'orange'
    case 'PAID':
      return 'cyan'
    case 'PROCESSING':
      return 'blue'
    case 'PACKED':
    case 'RETURN_REQUESTED':
    case 'RETURNED':
      return 'purple'
    case 'SHIPPED':
      return 'teal'
    case 'DELIVERED':
      return 'green'
    default:
      return 'gray'
  }
}

export function formatOrderMoney(value: string, currency: string): string {
  const amount = Number(value)

  if (!Number.isFinite(amount)) return '—'

  try {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}
