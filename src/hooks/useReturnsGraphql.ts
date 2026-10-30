import {
  GetReturnRequestDocument,
  useGetReturnRequestQuery,
  useCreateReturnMutation,
  useApproveReturnMutation,
  useRejectReturnMutation
} from '../generated/graphql'

import type { CreateReturnInput } from '../generated/graphql'

export function useReturnGraphql(id: string | undefined, enabled: boolean) {
  const canFetch = enabled && Boolean(id)

  const { data, loading, error, refetch } = useGetReturnRequestQuery({
    variables: {
      id: id ?? ''
    },
    skip: !canFetch,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true
  })

  return {
    returnRequest: canFetch ? data?.returnRequest ?? null : null,
    loading: canFetch && loading,
    error: canFetch ? error : undefined,
    refetch
  }
}

export function useReturnActionsGraphql() {
  const [executeCreate, creation] = useCreateReturnMutation()

  const [executeApprove, approval] = useApproveReturnMutation({
    refetchQueries: [GetReturnRequestDocument],
    awaitRefetchQueries: true
  })

  const [executeReject, rejection] = useRejectReturnMutation({
    refetchQueries: [GetReturnRequestDocument],
    awaitRefetchQueries: true
  })

  const createReturn = async (input: CreateReturnInput) => {
    const result = await executeCreate({
      variables: { input }
    })

    return result.data?.createReturn ?? null
  }

  const approveReturn = async (id: string) => {
    const result = await executeApprove({
      variables: { id }
    })

    return result.data?.approveReturn ?? null
  }

  const rejectReturn = async (id: string) => {
    const result = await executeReject({
      variables: { id }
    })

    return result.data?.rejectReturn ?? null
  }

  return {
    createReturn,
    creating: creation.loading,
    createError: creation.error,
    resetCreate: creation.reset,

    approveReturn,
    approving: approval.loading,
    approveError: approval.error,
    resetApprove: approval.reset,

    rejectReturn,
    rejecting: rejection.loading,
    rejectError: rejection.error,
    resetReject: rejection.reset
  }
}
