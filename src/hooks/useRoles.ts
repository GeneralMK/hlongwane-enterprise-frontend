import { useCallback } from 'react'

import { request, requireToken } from '../rest/client'

import type {
  ApiResponse,
  AssignUserRoleInput,
  RevokeUserRoleInput,
  RoleDetails,
  UserRoleAssignment
} from '../rest/types'

import { useRestMutation, useRestQuery } from './useRest'

export function useRoles(token?: string | null) {
  const query = useRestQuery<ApiResponse<RoleDetails[]>>(token ? '/roles' : null, token)

  return {
    roles: query.data?.data ?? [],
    loading: query.loading,
    error: query.error,
    refetch: query.refetch
  }
}

type RoleActionOptions = {
  onSuccess?: () => void
}

export function useRoleActions(token?: string | null, { onSuccess }: RoleActionOptions = {}) {
  const assign = useCallback(
    async ({ userId, roleId }: AssignUserRoleInput) => {
      const response = await request<ApiResponse<UserRoleAssignment>>(
        `/roles/users/${encodeURIComponent(userId)}`,
        {
          method: 'POST',
          token: requireToken(token),
          body: { roleId }
        }
      )

      onSuccess?.()

      return response.data
    },
    [token, onSuccess]
  )

  const revoke = useCallback(
    async ({ userId, roleId }: RevokeUserRoleInput) => {
      const response = await request<ApiResponse<UserRoleAssignment>>(
        `/roles/users/${encodeURIComponent(userId)}/${encodeURIComponent(roleId)}`,
        {
          method: 'DELETE',
          token: requireToken(token)
        }
      )

      onSuccess?.()

      return response.data
    },
    [token, onSuccess]
  )

  const assignment = useRestMutation(assign)
  const revocation = useRestMutation(revoke)

  return {
    assignUserRole: assignment.execute,
    assigning: assignment.loading,
    assignError: assignment.error,
    resetAssign: assignment.reset,

    revokeUserRole: revocation.execute,
    revoking: revocation.loading,
    revokeError: revocation.error,
    resetRevoke: revocation.reset
  }
}

export default useRoles
