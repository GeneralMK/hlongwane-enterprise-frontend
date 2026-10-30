import {
  GetUserRolesDocument,
  useGetRolesQuery,
  useGetRoleQuery,
  useGetUserRolesQuery,
  useAssignUserRoleMutation,
  useRevokeUserRoleMutation
} from '../generated/graphql'

import type { AssignUserRoleInput, RevokeUserRoleInput } from '../generated/graphql'

export function useRolesGraphql(enabled: boolean) {
  const query = useGetRolesQuery({
    skip: !enabled,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true
  })

  return {
    roles: enabled ? query.data?.roles ?? [] : [],
    loading: enabled && query.loading,
    error: enabled ? query.error : undefined,
    refetch: query.refetch
  }
}

export function useRoleGraphql(id: string | undefined, enabled: boolean) {
  const canFetch = enabled && Boolean(id)

  const query = useGetRoleQuery({
    variables: {
      id: id ?? ''
    },
    skip: !canFetch,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true
  })

  return {
    role: canFetch ? query.data?.role ?? null : null,
    loading: canFetch && query.loading,
    error: canFetch ? query.error : undefined,
    refetch: query.refetch
  }
}

export function useUserRolesGraphql(userId: string | undefined, enabled: boolean) {
  const canFetch = enabled && Boolean(userId)

  const query = useGetUserRolesQuery({
    variables: {
      userId: userId ?? ''
    },
    skip: !canFetch,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true
  })

  return {
    userRoles: canFetch ? query.data?.userRoles ?? [] : [],
    loading: canFetch && query.loading,
    error: canFetch ? query.error : undefined,
    refetch: query.refetch
  }
}

export function useRoleActionsGraphql() {
  const [executeAssign, assignment] = useAssignUserRoleMutation({
    refetchQueries: [GetUserRolesDocument],
    awaitRefetchQueries: true
  })

  const [executeRevoke, revocation] = useRevokeUserRoleMutation({
    refetchQueries: [GetUserRolesDocument],
    awaitRefetchQueries: true
  })

  const assignUserRole = async (input: AssignUserRoleInput) => {
    const result = await executeAssign({
      variables: { input }
    })

    return result.data?.assignUserRole ?? null
  }

  const revokeUserRole = async (input: RevokeUserRoleInput) => {
    const result = await executeRevoke({
      variables: { input }
    })

    return result.data?.revokeUserRole ?? null
  }

  return {
    assignUserRole,
    assigning: assignment.loading,
    assignError: assignment.error,
    resetAssign: assignment.reset,

    revokeUserRole,
    revoking: revocation.loading,
    revokeError: revocation.error,
    resetRevoke: revocation.reset
  }
}

export default useRolesGraphql
