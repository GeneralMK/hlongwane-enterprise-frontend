import { useCallback, useEffect, useState } from 'react'

import { API_HOST } from '../utils/contants'

interface UploadedImage {
  url?: string | null
  publicUrl?: string | null
}

export interface StorefrontCategory {
  id: string
  name: string
  slug: string
  description: string | null
  imageFile: UploadedImage | null
}

export interface StorefrontProduct {
  id: string
  name: string
  slug: string
  status: string
  isFeatured: boolean
  images: Array<{
    id: string
    isPrimary?: boolean
    position?: number
    fileUpload: UploadedImage | null
  }>
}

interface ProductsPage {
  items: StorefrontProduct[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}

const API_BASE = `${API_HOST.trim().replace(/\/+$/, '')}/api/v1`

async function getData<T>(
  path: string,
  signal: AbortSignal
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    signal,
    headers: {
      Accept: 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Unable to load store data (${response.status}).`)
  }

  const body = (await response.json()) as ApiResponse<T>

  if (!body.success || body.data == null) {
    throw new Error(body.message || 'Invalid store response.')
  }

  return body.data
}

function messageFrom(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Unable to load store data.'
}

export function getProductImage(
  product: StorefrontProduct
): string | undefined {
  const images = [...(product.images ?? [])].sort(
    (a, b) =>
      Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)) ||
      (a.position ?? 0) - (b.position ?? 0)
  )

  for (const image of images) {
    const url =
      image.fileUpload?.publicUrl?.trim() ||
      image.fileUpload?.url?.trim()

    if (url) return url
  }

  return undefined
}

export default function useStorefront() {
  const [categories, setCategories] = useState<StorefrontCategory[]>([])
  const [products, setProducts] = useState<StorefrontProduct[]>([])

  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)

  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [productsError, setProductsError] = useState<string | null>(null)

  const [refreshKey, setRefreshKey] = useState(0)

  const refetch = useCallback(() => {
    setRefreshKey((current) => current + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function loadCategories() {
      setCategoriesLoading(true)
      setCategoriesError(null)

      try {
        const result = await getData<StorefrontCategory[]>(
          '/categories/storefront',
          signal
        )

        if (!Array.isArray(result)) {
          throw new Error('Invalid categories response.')
        }

        if (!signal.aborted) {
          setCategories(result)
        }
      } catch (error) {
        if (!signal.aborted) {
          setCategoriesError(messageFrom(error))
        }
      } finally {
        if (!signal.aborted) {
          setCategoriesLoading(false)
        }
      }
    }

    async function loadProducts() {
      setProductsLoading(true)
      setProductsError(null)

      try {
        const params = new URLSearchParams({
          status: 'ACTIVE',
          isFeatured: 'true',
          page: '1',
          limit: '12'
        })

        const result = await getData<ProductsPage>(
          `/products?${params}`,
          signal
        )

        if (!Array.isArray(result.items)) {
          throw new Error('Invalid products response.')
        }

        if (!signal.aborted) {
          setProducts(result.items)
        }
      } catch (error) {
        if (!signal.aborted) {
          setProductsError(messageFrom(error))
        }
      } finally {
        if (!signal.aborted) {
          setProductsLoading(false)
        }
      }
    }

    void loadCategories()
    void loadProducts()

    // Retrieve newly published products when returning to this tab.
    function onFocus() {
      if (document.visibilityState === 'visible') {
        refetch()
      }
    }

    window.addEventListener('focus', onFocus)

    return () => {
      controller.abort()
      window.removeEventListener('focus', onFocus)
    }
  }, [refreshKey, refetch])

  return {
    categories,
    products,
    categoriesLoading,
    productsLoading,
    categoriesError,
    productsError,
    refetch
  }
}