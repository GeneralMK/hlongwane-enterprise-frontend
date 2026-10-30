import { useCallback } from 'react'

import { request, requireToken } from '../rest/client'

import type {
  ApiResponse,
  CreateProductVariantInput,
  ProductVariant,
  ProductVariantDetails,
  UpdateProductVariantInput
} from '../rest/types'

import { useRestMutation, useRestQuery } from './useRest'

export function useProductVariants(productId?: string) {
  const query = useRestQuery<ApiResponse<ProductVariant[]>>(
    productId ? `/product-variants/products/${encodeURIComponent(productId)}` : null
  )

  return {
    variants: query.data?.data ?? [],
    loading: query.loading,
    error: query.error,
    refetch: query.refetch
  }
}

export function useProductVariant(id?: string) {
  const query = useRestQuery<ApiResponse<ProductVariantDetails>>(
    id ? `/product-variants/${encodeURIComponent(id)}` : null
  )

  return {
    variant: query.data?.data ?? null,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch
  }
}

type ActionOptions = {
  onSuccess?: () => void
}

export function useProductVariantActions(token?: string | null, { onSuccess }: ActionOptions = {}) {
  const create = useCallback(
    async (input: CreateProductVariantInput) => {
      const response = await request<ApiResponse<ProductVariant>>('/product-variants', {
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
    async (id: string, input: UpdateProductVariantInput) => {
      const response = await request<ApiResponse<ProductVariant>>(
        `/product-variants/${encodeURIComponent(id)}`,
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

  const creation = useRestMutation(create)
  const updating = useRestMutation(update)

  return {
    createVariant: creation.execute,
    creating: creation.loading,
    createError: creation.error,
    resetCreate: creation.reset,

    updateVariant: updating.execute,
    updating: updating.loading,
    updateError: updating.error,
    resetUpdate: updating.reset
  }
}

export default useProductVariants
