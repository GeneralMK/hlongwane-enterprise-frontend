import { useCallback } from 'react'

import { queryString, request, requireToken } from '../rest/client'

import type {
  ApiResponse,
  CreateProductInput,
  FindProductsInput,
  Product,
  ProductDetails,
  ProductsResult,
  UpdateProductInput
} from '../rest/types'

import { useRestMutation, useRestQuery } from './useRest'

export function useProducts(filters: FindProductsInput = {}) {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20

  const path = `/products${queryString({
    search: filters.search?.trim(),
    status: filters.status,
    brandId: filters.brandId,
    categoryId: filters.categoryId,

    // Preserve false as an explicit filter.
    isFeatured: filters.isFeatured === undefined ? undefined : String(filters.isFeatured),

    page,
    limit
  })}`

  const query = useRestQuery<ApiResponse<ProductsResult>>(path)

  const result = query.data?.data

  return {
    products: result?.items ?? [],

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

export function useProduct(id?: string) {
  const query = useRestQuery<ApiResponse<ProductDetails>>(
    id ? `/products/${encodeURIComponent(id)}` : null
  )

  return {
    product: query.data?.data ?? null,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch
  }
}

type ProductActionOptions = {
  onSuccess?: () => void
}

export function useProductActions(token?: string | null, { onSuccess }: ProductActionOptions = {}) {
  const create = useCallback(
    async (input: CreateProductInput) => {
      const response = await request<ApiResponse<Product>>('/products', {
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
    async (id: string, input: UpdateProductInput) => {
      const response = await request<ApiResponse<Product>>(`/products/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        token: requireToken(token),
        body: input
      })

      onSuccess?.()

      return response.data
    },
    [token, onSuccess]
  )

  const archive = useCallback(
    async (id: string) => {
      const response = await request<ApiResponse<Product>>(`/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        token: requireToken(token)
      })

      onSuccess?.()

      return response.data
    },
    [token, onSuccess]
  )

  const creation = useRestMutation(create)
  const updating = useRestMutation(update)
  const archiving = useRestMutation(archive)

  return {
    createProduct: creation.execute,
    creating: creation.loading,
    createError: creation.error,
    resetCreate: creation.reset,

    updateProduct: updating.execute,
    updating: updating.loading,
    updateError: updating.error,
    resetUpdate: updating.reset,

    archiveProduct: archiving.execute,
    archiving: archiving.loading,
    archiveError: archiving.error,
    resetArchive: archiving.reset
  }
}

export default useProducts
