import { useCallback } from 'react'

import { queryString, request, requireToken } from '../rest/client'

import type {
  ApiResponse,
  CheckoutInput,
  CheckoutResult,
  Order,
  OrderDetails,
  OrdersResult,
  OrderStatus,
  UpdateOrderStatusInput
} from '../rest/types'

import { useRestMutation, useRestQuery } from './useRest'

type OrderFilters = {
  page?: number
  limit?: number
  status?: OrderStatus
}

function useOrderList(path: string, token: string | null | undefined, page: number, limit: number) {
  const query = useRestQuery<ApiResponse<OrdersResult>>(token ? path : null, token)

  const result = query.data?.data

  return {
    orders: result?.items ?? [],
    pagination: result?.pagination ?? {
      page,
      limit,
      total: 0,
      pages: 0
    },
    loading: query.loading,
    error: query.error,
    refetch: query.refetch
  }
}

// Administrative listing.
export function useOrders(
  token?: string | null,
  { page = 1, limit = 20, status }: OrderFilters = {}
) {
  return useOrderList(`/orders${queryString({ page, limit, status })}`, token, page, limit)
}

// The REST /me controller currently supports pagination only.
export function useMyOrders(
  token?: string | null,
  { page = 1, limit = 20 }: { page?: number; limit?: number } = {}
) {
  return useOrderList(`/orders/me${queryString({ page, limit })}`, token, page, limit)
}

export function useOrder(id?: string, token?: string | null) {
  const query = useRestQuery<ApiResponse<OrderDetails>>(
    id && token ? `/orders/${encodeURIComponent(id)}` : null,
    token
  )

  return {
    order: query.data?.data ?? null,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch
  }
}

type OrderActionOptions = {
  // Refresh whichever REST list/detail/cart hooks the screen uses.
  onSuccess?: () => void
}

export function useOrderActions(token?: string | null, { onSuccess }: OrderActionOptions = {}) {
  const create = useCallback(
    async (input: CheckoutInput) => {
      const response = await request<ApiResponse<CheckoutResult>>('/orders/checkout', {
        method: 'POST',
        token: requireToken(token),
        body: input
      })

      onSuccess?.()

      return response.data
    },
    [token, onSuccess]
  )

  const update = useCallback(
    async (id: string, input: UpdateOrderStatusInput) => {
      const response = await request<ApiResponse<Order>>(
        `/orders/${encodeURIComponent(id)}/status`,
        {
          method: 'PATCH',
          token: requireToken(token),
          body: input
        }
      )

      onSuccess?.()

      return response.data
    },
    [token, onSuccess]
  )

  const cancel = useCallback(
    async (id: string) => {
      const response = await request<ApiResponse<Order>>(
        `/orders/${encodeURIComponent(id)}/cancel`,
        {
          method: 'POST',
          token: requireToken(token)
        }
      )

      onSuccess?.()

      return response.data
    },
    [token, onSuccess]
  )

  const checkout = useRestMutation(create)
  const updating = useRestMutation(update)
  const cancelling = useRestMutation(cancel)

  return {
    checkout: checkout.execute,
    checkingOut: checkout.loading,
    checkoutError: checkout.error,
    resetCheckout: checkout.reset,

    updateOrderStatus: updating.execute,
    updating: updating.loading,
    updateError: updating.error,
    resetUpdate: updating.reset,

    cancelOrder: cancelling.execute,
    cancelling: cancelling.loading,
    cancelError: cancelling.error,
    resetCancel: cancelling.reset
  }
}

export default useOrders
