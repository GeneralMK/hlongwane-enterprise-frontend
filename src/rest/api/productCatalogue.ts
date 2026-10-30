import axios from 'axios'
import { API_HOST } from '../../utils/contants'

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

export type CatalogueCategory = {
  id: string
  name: string
  slug: string
  description?: string | null
  isActive: boolean
}

export type CatalogueProduct = {
  id: string
  name: string
  slug: string
  shortDescription?: string | null
  description?: string | null
  status: ProductStatus
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  warrantyMonths?: number | null
  brand?: {
    id: string
    name: string
    slug: string
  } | null

  category?: {
    id: string
    name: string
    slug: string
  } | null

  images: Array<{
    id: string
    position: number
    isPrimary: boolean
    altText?: string | null

    fileUpload?: {
      id: string
      publicUrl?: string | null
      path?: string | null
      originalName?: string
    } | null
  }>

  variants: Array<{
    id: string
    sku: string
    price: string
    salePrice?: string | null
    isActive: boolean
    availableQuantity?: number

    inventory?: {
      physicalQuantity: number
      reservedQuantity: number
      soldQuantity: number
      reorderLevel: number
    } | null
  }>
}

export type ProductPage = {
  items: CatalogueProduct[]

  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export type FindCatalogueProductsInput = {
  page?: number
  limit?: number
  search?: string
  brandId?: string
  categoryId?: string
  status?: ProductStatus
  isFeatured?: boolean
}

type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

type ApiErrorResponse = {
  message?: string
  error?:
    | string
    | {
        code?: string
        message?: string
      }
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

  return /^Bearer\s/i.test(value) ? value : `Bearer ${value}`
}

function unwrap<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data == null) {
    throw new Error(body.message || 'The request failed.')
  }

  return body.data
}

export function getCatalogueError(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const body = error.response?.data

    const nestedMessage = typeof body?.error === 'string' ? body.error : body?.error?.message

    if (nestedMessage || body?.message) {
      return nestedMessage || body!.message!
    }

    switch (error.response?.status) {
      case 401:
        return 'Your session has expired. Please sign in again.'

      case 403:
        return 'You do not have permission to perform this action.'

      case 404:
        return 'The requested product or resource was not found.'

      case 409:
        return 'This product conflicts with an existing record.'

      case 429:
        return 'Too many requests. Please try again shortly.'

      default:
        if (!error.response) {
          return error.code === 'ECONNABORTED'
            ? 'The request timed out. Please try again.'
            : 'Unable to connect to the server. Please try again.'
        }

        return 'Unable to complete the request. Please try again.'
    }
  }

  return error instanceof Error ? error.message : 'The request failed.'
}

export async function fetchCatalogueProducts(
  token: string,
  input: FindCatalogueProductsInput = {},
  signal?: AbortSignal
): Promise<ProductPage> {
  const response = await api.get<ApiResponse<ProductPage>>('/products', {
    signal,

    headers: {
      Authorization: authorization(token)
    },

    params: {
      page: input.page ?? 1,
      limit: input.limit ?? 20,
      search: input.search?.trim() || undefined,
      brandId: input.brandId || undefined,
      categoryId: input.categoryId || undefined,
      status: input.status || undefined,
      isFeatured: input.isFeatured
    }
  })

  return unwrap(response.data)
}

export async function fetchCatalogueCategories(
  token: string,
  signal?: AbortSignal
): Promise<CatalogueCategory[]> {
  const response = await api.get<ApiResponse<CatalogueCategory[]>>('/categories', {
    signal,

    headers: {
      Authorization: authorization(token)
    }
  })

  return unwrap(response.data)
}

export async function fetchCatalogueProduct(
  token: string,
  id: string,
  signal?: AbortSignal
): Promise<CatalogueProduct> {
  const productId = id.trim()

  if (!productId) {
    throw new Error('Product ID is required.')
  }

  const response = await api.get<ApiResponse<CatalogueProduct>>(
    `/products/${encodeURIComponent(productId)}`,
    {
      signal,

      headers: {
        Authorization: authorization(token)
      }
    }
  )

  return unwrap(response.data)
}

export async function archiveCatalogueProduct(token: string, id: string): Promise<void> {
  const productId = id.trim()

  if (!productId) {
    throw new Error('Product ID is required.')
  }

  const response = await api.delete<ApiResponse<unknown>>(
    `/products/${encodeURIComponent(productId)}`,
    {
      headers: {
        Authorization: authorization(token)
      }
    }
  )

  unwrap(response.data)
}

function resolveImageUrl(
  publicUrl?: string | null,
  storagePath?: string | null
): string | undefined {
  const storedUrl = publicUrl?.trim()
  const storedPath = storagePath?.trim()

  if (storedUrl && /^https?:\/\//i.test(storedUrl)) {
    return storedUrl
  }

  const key = storedPath || storedUrl

  if (!key) return undefined

  if (/^https?:\/\//i.test(key)) {
    return key
  }

  const baseUrl = import.meta.env.VITE_SPACES_PUBLIC_URL?.trim().replace(/\/+$/, '')

  if (!baseUrl) return undefined

  return `${baseUrl}/${key.replace(/^\/+/, '')}`
}

export function getCatalogueImage(product: CatalogueProduct): string | undefined {
  const orderedImages = [...(product.images ?? [])].sort(
    (first, second) =>
      Number(second.isPrimary) - Number(first.isPrimary) || first.position - second.position
  )

  for (const image of orderedImages) {
    const url = resolveImageUrl(image.fileUpload?.publicUrl, image.fileUpload?.path)

    if (url) return url
  }

  return undefined
}

export type UpdateCatalogueProductInput = {
  name?: string
  shortDescription?: string | null
  description?: string | null
  brandId?: string
  categoryId?: string
  status?: ProductStatus
  warrantyMonths?: number | null
  isFeatured?: boolean
}

export type CatalogueBrand = {
  id: string
  name: string
  slug: string
  isActive: boolean
}

export async function fetchCatalogueBrands(
  token: string,
  signal?: AbortSignal
): Promise<CatalogueBrand[]> {
  const response = await api.get<ApiResponse<CatalogueBrand[]>>('/brands', {
    signal,
    headers: {
      Authorization: authorization(token)
    }
  })

  return unwrap(response.data)
}

export async function updateCatalogueProduct(
  token: string,
  id: string,
  input: UpdateCatalogueProductInput
): Promise<void> {
  const productId = id.trim()

  if (!productId) {
    throw new Error('Product ID is required.')
  }

  const response = await api.patch<ApiResponse<unknown>>(
    `/products/${encodeURIComponent(productId)}`,
    input,
    {
      headers: {
        Authorization: authorization(token)
      }
    }
  )

  unwrap(response.data)
}
