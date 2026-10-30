import axios from 'axios'

import { API_HOST } from '../../utils/contants'

export type InventoryRecord = {
  id: string
  variantId: string
  physicalQuantity: number
  reservedQuantity: number
  soldQuantity: number
  availableQuantity: number
  reorderLevel: number
  createdAt: string
  updatedAt: string
}

type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

export type AdjustInventoryInput = {
  quantityDelta: number
  notes?: string
  referenceType?: string
  referenceId?: string
}

const api = axios.create({
  baseURL: `${API_HOST.trim().replace(/\/+$/, '')}/api/v1`,
  timeout: 20_000,
  headers: {
    Accept: 'application/json'
  }
})

function authorization(token: string): string {
  const value = token.trim()

  if (!value) {
    throw new Error('Please sign in to continue.')
  }

  return /^Bearer\s/i.test(value)
    ? value
    : `Bearer ${value}`
}

function unwrap<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data == null) {
    throw new Error(body.message || 'The inventory request failed.')
  }

  return body.data
}

export async function getVariantInventory(
  token: string,
  variantId: string,
  signal?: AbortSignal
): Promise<InventoryRecord> {
  const response = await api.get<ApiResponse<InventoryRecord>>(
    `/inventory/${encodeURIComponent(variantId)}`,
    {
      signal,
      headers: {
        Authorization: authorization(token)
      }
    }
  )

  return unwrap(response.data)
}

export async function adjustVariantInventory(
  token: string,
  variantId: string,
  input: AdjustInventoryInput
): Promise<InventoryRecord> {
  if (!Number.isSafeInteger(input.quantityDelta)) {
    throw new Error('Stock adjustment must be a whole number.')
  }

  if (input.quantityDelta === 0) {
    throw new Error('Enter a different available stock quantity.')
  }

  const response = await api.post<ApiResponse<InventoryRecord>>(
    `/inventory/${encodeURIComponent(variantId)}/adjust`,
    input,
    {
      headers: {
        Authorization: authorization(token)
      }
    }
  )

  return unwrap(response.data)
}