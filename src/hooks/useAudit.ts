import { queryString } from '../rest/client'

import type { ApiResponse, AuditResult } from '../rest/types'

import { useRestQuery } from './useRest'

export interface AuditFilters {
  actorUserId?: string
  entityType?: string
  action?: string
  page?: number
  limit?: number
}

export function useAudit(token: string | null | undefined, filters: AuditFilters = {}) {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20

  const path = `/audit${queryString({
    actorUserId: filters.actorUserId,
    entityType: filters.entityType,
    action: filters.action,
    page,
    limit
  })}`

  const query = useRestQuery<ApiResponse<AuditResult>>(token ? path : null, token)

  const result = query.data?.data

  return {
    auditLogs: result?.items ?? [],
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

export default useAudit
