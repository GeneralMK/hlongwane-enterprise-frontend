import { useCallback } from 'react'

import {
  request,
  requireToken
} from '../rest/client'

import type {
  AdjustInventoryInput,
  ApiResponse,
  Inventory,
  InventoryDetails
} from '../rest/types'

import {
  useRestMutation,
  useRestQuery
} from './useRest'

function useInventoryAdjustment(
  token: string | null | undefined,
  onSuccess: () => void
) {
  const adjust = useCallback(
    async (
      variantId: string,
      input: AdjustInventoryInput
    ): Promise<Inventory> => {
      const accessToken = requireToken(token)

      if (!variantId.trim()) {
        throw new Error('A variant ID is required.')
      }

      if (!Number.isSafeInteger(input.quantityDelta)) {
        throw new Error('Quantity adjustment must be a safe integer.')
      }

      const response = await request<ApiResponse<Inventory>>(
        `/inventory/${encodeURIComponent(variantId)}/adjust`,
        {
          method: 'POST',
          token: accessToken,
          body: input
        }
      )

      onSuccess()

      return response.data
    },
    [token, onSuccess]
  )

  return useRestMutation(adjust)
}

export function useInventory(token?: string | null) {
  const query = useRestQuery<ApiResponse<InventoryDetails[]>>(
    token ? '/inventory' : null,
    token
  )

  const adjustment = useInventoryAdjustment(
    token,
    query.refetch
  )

  return {
    inventory: query.data?.data ?? [],
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,

    adjustInventory: adjustment.execute,
    adjusting: adjustment.loading,
    adjustmentError: adjustment.error,
    resetAdjustment: adjustment.reset
  }
}

export function useInventoryByVariant(
  variantId?: string,
  token?: string | null
) {
  const query = useRestQuery<ApiResponse<InventoryDetails>>(
    variantId && token
      ? `/inventory/${encodeURIComponent(variantId)}`
      : null,
    token
  )

  const adjustment = useInventoryAdjustment(
    token,
    query.refetch
  )

  const adjustInventory = useCallback(
    async (input: AdjustInventoryInput) => {
      // ID validation occurs inside the mutation so its error
      // is also exposed through adjustmentError.
      return adjustment.execute(variantId ?? '', input)
    },
    [variantId, adjustment.execute]
  )

  return {
    inventory: query.data?.data ?? null,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,

    adjustInventory,
    adjusting: adjustment.loading,
    adjustmentError: adjustment.error,
    resetAdjustment: adjustment.reset
  }
}

export default useInventory