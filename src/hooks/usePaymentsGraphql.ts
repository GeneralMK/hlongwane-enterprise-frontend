import {
  GetPaymentDocument,
  GetPaymentByReferenceDocument,
  useGetPaymentQuery,
  useGetPaymentByReferenceQuery,
  useInitializePaymentMutation,
  useRefundPaymentMutation
} from '../generated/graphql'

import type {
  InitializePaymentInput,
  RefundPaymentInput
} from '../generated/graphql'

export function usePaymentGraphql(
  id: string | undefined,
  enabled: boolean
) {
  const canFetch = enabled && Boolean(id)

  const query = useGetPaymentQuery({
    variables: { id: id ?? '' },
    skip: !canFetch,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true
  })

  return {
    payment: canFetch ? query.data?.payment ?? null : null,
    loading: canFetch && query.loading,
    error: canFetch ? query.error : undefined,
    refetch: query.refetch
  }
}

export function usePaymentByReferenceGraphql(
  reference: string | undefined,
  enabled: boolean
) {
  const canFetch = enabled && Boolean(reference)

  const query = useGetPaymentByReferenceQuery({
    variables: {
      reference: reference ?? ''
    },
    skip: !canFetch,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true
  })

  return {
    payment: canFetch
      ? query.data?.paymentByReference ?? null
      : null,
    loading: canFetch && query.loading,
    error: canFetch ? query.error : undefined,
    refetch: query.refetch
  }
}

export function usePaymentsGraphql() {
  const [executeInitialize, initialization] =
    useInitializePaymentMutation()

  const [executeRefund, refund] =
    useRefundPaymentMutation({
      refetchQueries: [
        GetPaymentDocument,
        GetPaymentByReferenceDocument
      ],
      awaitRefetchQueries: true
    })

  const initializePayment = async (
    input: InitializePaymentInput
  ) => {
    const result = await executeInitialize({
      variables: { input }
    })

    return result.data?.initializePayment ?? null
  }

  const requestRefund = async (
    paymentId: string,
    input: RefundPaymentInput
  ) => {
    const result = await executeRefund({
      variables: {
        paymentId,
        input
      }
    })

    return result.data?.refundPayment ?? null
  }

  return {
    initializePayment,
    initializing: initialization.loading,
    initializationError: initialization.error,
    resetInitialization: initialization.reset,

    requestRefund,
    refunding: refund.loading,
    refundError: refund.error,
    resetRefund: refund.reset
  }
}

export default usePaymentsGraphql