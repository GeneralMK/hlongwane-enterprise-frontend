import { useCallback } from 'react'

import { queryString, request, requireToken } from '../rest/client'

import type {
  ApiResponse,
  FindUsersInput,
  UpdateUserInput,
  User,
  UserDetails,
  UsersResult
} from '../rest/types'

import { useRestMutation, useRestQuery } from './useRest'

export function useUsers(
  token?: string | null,
  { search, page = 1, limit = 20 }: FindUsersInput = {}
) {
  const path = `/users${queryString({
    search: search?.trim(),
    page,
    limit
  })}`

  const query = useRestQuery<ApiResponse<UsersResult>>(token ? path : null, token)

  const result = query.data?.data

  return {
    users: result?.items ?? [],

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

export function useUser(id?: string, token?: string | null) {
  const query = useRestQuery<ApiResponse<UserDetails>>(
    id && token ? `/users/${encodeURIComponent(id)}` : null,
    token
  )

  return {
    user: query.data?.data ?? null,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch
  }
}

type UserActionOptions = {
  onSuccess?: () => void
}

export function useUserActions(token?: string | null, { onSuccess }: UserActionOptions = {}) {
  const update = useCallback(
    async (id: string, input: UpdateUserInput) => {
      const response = await request<ApiResponse<User>>(`/users/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        token: requireToken(token),
        body: input
      })

      onSuccess?.()

      return response.data
    },
    [token, onSuccess]
  )

  const mutation = useRestMutation(update)

  return {
    updateUser: mutation.execute,
    updating: mutation.loading,
    updateError: mutation.error,
    resetUpdate: mutation.reset
  }
}

export default useUsers
