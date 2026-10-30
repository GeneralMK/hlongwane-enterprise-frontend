import { queryString } from '../rest/client'

import type { ApiResponse, NotificationsResult } from '../rest/types'

import { useRestQuery } from './useRest'

type NotificationOptions = {
  page?: number
  limit?: number
}

export function useNotifications(
  token?: string | null,
  { page = 1, limit = 20 }: NotificationOptions = {}
) {
  const path = `/notifications/me${queryString({
    page,
    limit
  })}`

  const query = useRestQuery<ApiResponse<NotificationsResult>>(token ? path : null, token)

  const result = query.data?.data

  return {
    notifications: result?.items ?? [],

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

export default useNotifications
