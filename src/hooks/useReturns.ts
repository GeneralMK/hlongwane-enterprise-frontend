import { useCallback } from 'react'

import {
  request,
  requireToken
} from '../rest/client'

import type {
  ApiResponse,
  CreatedReturn,
  CreateReturnInput,
  ReturnDetails,
  ReturnRequest
} from '../rest/types'

import {
  useRestMutation,
  useRestQuery
} from './useRest'

export function useReturn(
  id?: string,
  token?: string | null
) {
  const query = useRestQuery<ApiResponse<ReturnDetails>>(
    id && token
      ? `/returns/${encodeURIComponent(id)}`
      : null,
    token
  )

  return {
    returnRequest: query.data?.data ?? null,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch
  }
}

type ReturnActionOptions = {
  onSuccess?: () => void
}

export function useReturnActions(
  token?: string | null,
  { onSuccess }: ReturnActionOptions = {}
) {
  const create = useCallback(
    async (input: CreateReturnInput) => {
      const response = await request<
        ApiResponse<CreatedReturn>
      >('/returns', {
        method: 'POST',
        token: requireToken(token),
        body: input
      })

      onSuccess?.()

      return response.data
    },
    [token, onSuccess]
  )

  const approve = useCallback(
    async (id: string) => {
      const response = await request<
        ApiResponse<ReturnRequest>
      >(`/returns/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
        token: requireToken(token)
      })

      onSuccess?.()

      return response.data
    },
    [token, onSuccess]
  )

  const reject = useCallback(
    async (id: string) => {
      const response = await request<
        ApiResponse<ReturnRequest>
      >(`/returns/${encodeURIComponent(id)}/reject`, {
        method: 'POST',
        token: requireToken(token)
      })

      onSuccess?.()

      return response.data
    },
    [token, onSuccess]
  )

  const creation = useRestMutation(create)
  const approval = useRestMutation(approve)
  const rejection = useRestMutation(reject)

  return {
    createReturn: creation.execute,
    creating: creation.loading,
    createError: creation.error,
    resetCreate: creation.reset,

    approveReturn: approval.execute,
    approving: approval.loading,
    approveError: approval.error,
    resetApprove: approval.reset,

    rejectReturn: rejection.execute,
    rejecting: rejection.loading,
    rejectError: rejection.error,
    resetReject: rejection.reset
  }
}