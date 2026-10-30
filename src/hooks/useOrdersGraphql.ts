import {
  GetOrdersDocument,
  GetMyOrdersDocument,
  GetOrderDocument,
  useGetOrdersQuery,
  useGetMyOrdersQuery,
  useGetOrderQuery,
  useCheckoutMutation,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation
} from '../generated/graphql'

import type { CheckoutInput, FindOrdersInput, UpdateOrderStatusInput } from '../generated/graphql'

type ListOptions = {
  enabled: boolean
  input?: FindOrdersInput
}

type MyOrdersInput = Pick<FindOrdersInput, 'page' | 'limit' | 'status'>

type MyListOptions = {
  enabled: boolean
  input?: MyOrdersInput
}

export function useOrdersGraphql({ enabled, input = {} }: ListOptions) {
  const { data, loading, error, refetch } = useGetOrdersQuery({
    variables: { input },
    skip: !enabled,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true
  })

  const result = enabled ? data?.orders : undefined

  return {
    orders: result?.orders ?? [],
    pagination: {
      page: result?.page ?? input.page ?? 1,
      limit: result?.limit ?? input.limit ?? 20,
      total: result?.total ?? 0,
      pages: result?.totalPages ?? 0
    },
    loading: enabled && loading,
    error: enabled ? error : undefined,
    refetch
  }
}

export function useMyOrdersGraphql({ enabled, input = {} }: MyListOptions) {
  const { data, loading, error, refetch } = useGetMyOrdersQuery({
    variables: { input },
    skip: !enabled,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true
  })

  const result = enabled ? data?.myOrders : undefined

  return {
    orders: result?.orders ?? [],
    pagination: {
      page: result?.page ?? input.page ?? 1,
      limit: result?.limit ?? input.limit ?? 20,
      total: result?.total ?? 0,
      pages: result?.totalPages ?? 0
    },
    loading: enabled && loading,
    error: enabled ? error : undefined,
    refetch
  }
}

export function useOrderGraphql(id: string | undefined, { enabled }: { enabled: boolean }) {
  const canFetch = enabled && Boolean(id)

  const { data, loading, error, refetch } = useGetOrderQuery({
    variables: { id: id ?? '' },
    skip: !canFetch,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true
  })

  return {
    order: canFetch ? data?.order ?? null : null,
    loading: canFetch && loading,
    error: canFetch ? error : undefined,
    refetch
  }
}

const orderRefetchQueries = [GetOrdersDocument, GetMyOrdersDocument, GetOrderDocument]

export function useOrderActionsGraphql() {
  const [executeCheckout, checkoutState] = useCheckoutMutation({
    refetchQueries: orderRefetchQueries,
    awaitRefetchQueries: true
  })

  const [executeUpdate, updateState] = useUpdateOrderStatusMutation({
    refetchQueries: orderRefetchQueries,
    awaitRefetchQueries: true
  })

  const [executeCancel, cancelState] = useCancelOrderMutation({
    refetchQueries: orderRefetchQueries,
    awaitRefetchQueries: true
  })

  const checkout = async (input: CheckoutInput) => {
    const result = await executeCheckout({
      variables: { input }
    })

    return result.data?.checkout ?? null
  }

  const updateOrderStatus = async (id: string, input: UpdateOrderStatusInput) => {
    const result = await executeUpdate({
      variables: { id, input }
    })

    return result.data?.updateOrderStatus ?? null
  }

  const cancelOrder = async (id: string) => {
    const result = await executeCancel({
      variables: { id }
    })

    return result.data?.cancelOrder ?? null
  }

  return {
    checkout,
    checkingOut: checkoutState.loading,
    checkoutError: checkoutState.error,
    resetCheckout: checkoutState.reset,

    updateOrderStatus,
    updating: updateState.loading,
    updateError: updateState.error,
    resetUpdate: updateState.reset,

    cancelOrder,
    cancelling: cancelState.loading,
    cancelError: cancelState.error,
    resetCancel: cancelState.reset
  }
}

export default useOrdersGraphql
