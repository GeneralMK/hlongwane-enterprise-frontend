import {
  useGetMyNotificationsQuery
} from '../generated/graphql'

import type {
  NotificationFieldsFragment
} from '../generated/graphql'

export type GraphqlNotification =
  NotificationFieldsFragment

type NotificationOptions = {
  enabled: boolean
  page?: number
  limit?: number
}

export function useNotificationsGraphql({
  enabled,
  page = 1,
  limit = 20
}: NotificationOptions) {
  const {
    data,
    loading,
    error,
    refetch,
    networkStatus
  } = useGetMyNotificationsQuery({
    variables: {
      page,
      limit
    },
    skip: !enabled,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true
  })

  const result = enabled
    ? data?.myNotifications
    : undefined

  return {
    notifications: result?.notifications ?? [],

    // Normalize the pagination shape to match the REST hook.
    pagination: {
      page: result?.page ?? page,
      limit: result?.limit ?? limit,
      total: result?.total ?? 0,
      pages: result?.totalPages ?? 0
    },

    loading: enabled && loading,
    error: enabled ? error : undefined,
    refetch,
    networkStatus
  }
}

export default useNotificationsGraphql