import {
  GetShipmentDocument,
  useGetShipmentQuery,
  useCreateShipmentMutation,
  useUpdateShipmentMutation
} from '../generated/graphql'

import type {
  CreateShipmentInput,
  UpdateShipmentInput
} from '../generated/graphql'

export function useShipmentGraphql(
  id: string | undefined,
  enabled: boolean
) {
  const canFetch = enabled && Boolean(id)

  const query = useGetShipmentQuery({
    variables: {
      id: id ?? ''
    },
    skip: !canFetch,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true
  })

  const shipment = canFetch
    ? query.data?.shipment ?? null
    : null

  return {
    shipment,
    events: shipment?.events ?? [],
    loading: canFetch && query.loading,
    error: canFetch ? query.error : undefined,
    refetch: query.refetch
  }
}

export function useShipmentActionsGraphql() {
  const [executeCreate, creation] =
    useCreateShipmentMutation()

  const [executeUpdate, updating] =
    useUpdateShipmentMutation({
      refetchQueries: [GetShipmentDocument],
      awaitRefetchQueries: true
    })

  const createShipment = async (
    input: CreateShipmentInput
  ) => {
    const result = await executeCreate({
      variables: { input }
    })

    return result.data?.createShipment ?? null
  }

  const updateShipment = async (
    id: string,
    input: UpdateShipmentInput
  ) => {
    const result = await executeUpdate({
      variables: { id, input }
    })

    return result.data?.updateShipment ?? null
  }

  return {
    createShipment,
    creating: creation.loading,
    createError: creation.error,
    resetCreate: creation.reset,

    updateShipment,
    updating: updating.loading,
    updateError: updating.error,
    resetUpdate: updating.reset
  }
}