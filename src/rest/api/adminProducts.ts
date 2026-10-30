import axios from 'axios'

import { API_HOST } from '../../utils/contants'

const api = axios.create({
  baseURL: `${API_HOST.trim().replace(/\/+$/, '')}/api/v1`,
  timeout: 20_000
})

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface CatalogueOption {
  id: string
  name: string
  isActive: boolean
}

export interface UploadedProductImage {
  id: string
  publicUrl?: string | null
  path: string
  originalName: string
}

export interface CreateProductInput {
  name: string
  shortDescription?: string
  description?: string
  brandId: string
  categoryId: string
  warrantyMonths?: number
  isFeatured: boolean
  publish: boolean
  price: string
  quantity: number
  imageFileIds: string[]
}

function headers(token: string) {
  const value = token.trim()

  if (!value) {
    throw new Error('Please sign in before managing products.')
  }

  return {
    Authorization: /^Bearer\s/i.test(value) ? value : `Bearer ${value}`
  }
}

function unwrap<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data == null) {
    throw new Error(body.message || 'Request failed.')
  }

  return body.data
}

export function getProductError(cause: unknown): string {
  if (
    axios.isAxiosError<{
      message?: string
      error?: string | { message?: string }
    }>(cause)
  ) {
    const body = cause.response?.data

    const message = typeof body?.error === 'string' ? body.error : body?.error?.message

    if (cause.response?.status === 401) {
      return 'Your session has expired. Please sign in again.'
    }

    if (cause.response?.status === 403) {
      return 'Your account does not have permission to manage products.'
    }

    return (
      message ||
      body?.message ||
      (cause.response ? 'Unable to complete the request.' : 'Unable to connect to the server.')
    )
  }

  return cause instanceof Error ? cause.message : 'Request failed.'
}

export async function getProductOptions(token: string, signal?: AbortSignal) {
  const [brandResponse, categoryResponse] = await Promise.all([
    api.get<ApiResponse<CatalogueOption[]>>('/brands', {
      headers: headers(token),
      signal
    }),
    api.get<ApiResponse<CatalogueOption[]>>('/categories', {
      headers: headers(token),
      signal
    })
  ])

  return {
    brands: unwrap(brandResponse.data).filter((brand) => brand.isActive),
    categories: unwrap(categoryResponse.data).filter((category) => category.isActive)
  }
}

export async function uploadProductImage(file: File, token: string): Promise<UploadedProductImage> {
  const form = new FormData()

  form.append('file', file, file.name)
  form.append('purpose', 'PRODUCT_IMAGE')

  // Matches the upload response used by your current AuthService.
  const response = await api.post<{
    success: boolean
    message?: string
    file?: UploadedProductImage
  }>('/files/upload', form, {
    headers: headers(token),
    timeout: 120_000
  })

  if (!response.data.success || !response.data.file?.id) {
    throw new Error(response.data.message || 'Image upload failed.')
  }

  return response.data.file
}

export async function createProduct(
  input: CreateProductInput,
  token: string
): Promise<{ id: string; name: string }> {
  const response = await api.post<ApiResponse<{ id: string; name: string }>>('/products', input, {
    headers: headers(token)
  })

  return unwrap(response.data)
}
