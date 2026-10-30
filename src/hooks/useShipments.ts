import { useCallback } from 'react'

import { request, requireToken } from '../rest/client'

import type {
  ApiResponse,
  CreateShipmentInput,
  Shipment,
  ShipmentDetails,
  UpdateShipmentInput
} from '../rest/types'

import { useRestMutation, useRestQuery } from './useRest'

export function useShipment(id?: string, token?: string | null) {
  const query = useRestQuery<ApiResponse<ShipmentDetails>>(
    id && token ? `/shipments/${encodeURIComponent(id)}` : null,
    token
  )

  return {
    shipment: query.data?.data ?? null,
    events: query.data?.data.events ?? [],
    loading: query.loading,
    error: query.error,
    refetch: query.refetch
  }
}

type ShipmentActionOptions = {
  onSuccess?: () => void
}

export function useShipmentActions(
  token?: string | null,
  { onSuccess }: ShipmentActionOptions = {}
) {
  const create = useCallback(
    async (input: CreateShipmentInput) => {
      const response = await request<ApiResponse<Shipment>>('/shipments', {
        method: 'POST',
        token: requireToken(token),
        body: input
      })

      onSuccess?.()

      return response.data
    },
    [token, onSuccess]
  )

  const update = useCallback(
    async (id: string, input: UpdateShipmentInput) => {
      const response = await request<ApiResponse<Shipment>>(
        `/shipments/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          token: requireToken(token),
          body: input
        }
      )

      onSuccess?.()

      return response.data
    },
    [token, onSuccess]
  )

  const creation = useRestMutation(create)
  const updating = useRestMutation(update)

  return {
    createShipment: creation.execute,
    creating: creation.loading,
    createError: creation.error,
    resetCreate: creation.reset,

    updateShipment: updating.execute,
    updating: updating.loading,
    updateError: updating.error,
    resetUpdate: updating.reset
  }
}
