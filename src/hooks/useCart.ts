import { useCallback } from 'react'

import { request, requireToken } from '../rest/client'

import type { AddCartItemInput, ApiResponse, Cart, CartItem } from '../rest/types'

import { useRestMutation, useRestQuery } from './useRest'

export function useCart(token?: string | null) {
  const query = useRestQuery<ApiResponse<Cart>>(token ? '/carts/me' : null, token)

  const add = useCallback(
    async (input: AddCartItemInput) => {
      const response = await request<ApiResponse<CartItem>>('/carts/me/items', {
        method: 'POST',
        token: requireToken(token),
        body: input
      })

      query.refetch()
      return response.data
    },
    [token, query.refetch]
  )

  const update = useCallback(
    async (itemId: string, quantity: number) => {
      const response = await request<ApiResponse<CartItem>>(
        `/carts/me/items/${encodeURIComponent(itemId)}`,
        {
          method: 'PATCH',
          token: requireToken(token),
          body: { quantity }
        }
      )

      query.refetch()
      return response.data
    },
    [token, query.refetch]
  )

  const remove = useCallback(
    async (itemId: string) => {
      await request<void>(`/carts/me/items/${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
        token: requireToken(token)
      })

      query.refetch()
    },
    [token, query.refetch]
  )

  const adding = useRestMutation(add)
  const updating = useRestMutation(update)
  const removing = useRestMutation(remove)

  const cart = query.data?.data ?? null
  const items = cart?.items ?? []

  return {
    cart,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    lineCount: items.length,

    loading: query.loading,
    error: query.error,
    refetch: query.refetch,

    addItem: adding.execute,
    updateItem: updating.execute,
    removeItem: removing.execute,

    adding: adding.loading,
    updating: updating.loading,
    removing: removing.loading,
    saving: adding.loading || updating.loading || removing.loading,

    addError: adding.error,
    updateError: updating.error,
    removeError: removing.error
  }
}

export default useCart
