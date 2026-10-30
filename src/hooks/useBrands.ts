import { useCallback } from 'react'

import {
  request,
  requireToken
} from '../rest/client'

import type {
  ApiResponse,
  Brand,
  CreateBrandInput,
  UpdateBrandInput
} from '../rest/types'

import {
  useRestMutation,
  useRestQuery
} from './useRest'

export function useBrands(token?: string | null) {
  const query = useRestQuery<ApiResponse<Brand[]>>('/brands')

  const create = useCallback(
    async (input: CreateBrandInput) => {
      const response = await request<ApiResponse<Brand>>(
        '/brands',
        {
          method: 'POST',
          token: requireToken(token),
          body: input
        }
      )

      query.refetch()
      return response.data
    },
    [token, query.refetch]
  )

  const update = useCallback(
    async (id: string, input: UpdateBrandInput) => {
      const response = await request<ApiResponse<Brand>>(
        `/brands/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          token: requireToken(token),
          body: input
        }
      )

      query.refetch()
      return response.data
    },
    [token, query.refetch]
  )

  const creation = useRestMutation(create)
  const updating = useRestMutation(update)

  return {
    brands: query.data?.data ?? [],
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,

    createBrand: creation.execute,
    creating: creation.loading,
    createError: creation.error,

    updateBrand: updating.execute,
    updating: updating.loading,
    updateError: updating.error
  }
}

export function useBrand(id?: string) {
  const query = useRestQuery<ApiResponse<Brand>>(
    id ? `/brands/${encodeURIComponent(id)}` : null
  )

  return {
    brand: query.data?.data ?? null,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch
  }
}

export default useBrands