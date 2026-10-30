import { useCallback } from 'react'

import {
  request,
  requireToken
} from '../rest/client'

import type {
  ApiResponse,
  Category,
  CreateCategoryInput,
  UpdateCategoryInput
} from '../rest/types'

import {
  useRestMutation,
  useRestQuery
} from './useRest'

export function useCategories(token?: string | null) {
  const query = useRestQuery<ApiResponse<Category[]>>(
    '/categories'
  )

  const create = useCallback(
    async (input: CreateCategoryInput) => {
      const response = await request<ApiResponse<Category>>(
        '/categories',
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
    async (id: string, input: UpdateCategoryInput) => {
      const response = await request<ApiResponse<Category>>(
        `/categories/${encodeURIComponent(id)}`,
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
    categories: query.data?.data ?? [],
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,

    createCategory: creation.execute,
    creating: creation.loading,
    createError: creation.error,

    updateCategory: updating.execute,
    updating: updating.loading,
    updateError: updating.error
  }
}

export function useCategory(id?: string) {
  const query = useRestQuery<ApiResponse<Category>>(
    id ? `/categories/${encodeURIComponent(id)}` : null
  )

  return {
    category: query.data?.data ?? null,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch
  }
}

export default useCategories