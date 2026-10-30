import { useEffect, useState } from 'react'

import { API_HOST } from '../utils/contants'

interface ProductImage {
  id: string
  isPrimary?: boolean
  position?: number
  fileUpload: {
    url?: string | null
    publicUrl?: string | null
  } | null
}

export interface StorefrontProduct {
  id: string
  name: string
  slug: string
  status: string
  isFeatured: boolean
  images: ProductImage[]
}

interface ProductsResponse {
  success: boolean
  message?: string
  data: {
    items: StorefrontProduct[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

export function getProductImage(product: StorefrontProduct): string | undefined {
  const sorted = [...product.images].sort(
    (a, b) =>
      Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)) ||
      (a.position ?? 0) - (b.position ?? 0)
  )

  for (const image of sorted) {
    const url = image.fileUpload?.publicUrl || image.fileUpload?.url
    if (url) return url
  }

  return undefined
}

export default function useStorefrontProducts() {
  const [products, setProducts] = useState<StorefrontProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          status: 'ACTIVE',
          isFeatured: 'true',
          page: '1',
          limit: '12'
        })

        const baseUrl = API_HOST.trim().replace(/\/+$/, '')

        const response = await fetch(`${baseUrl}/api/v1/products?${params}`, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Unable to load products (${response.status}).`)
        }

        const body = (await response.json()) as ProductsResponse

        if (!body.success || !Array.isArray(body.data?.items)) {
          throw new Error(body.message || 'Invalid products response.')
        }

        if (!controller.signal.aborted) {
          setProducts(body.data.items)
        }
      } catch (cause) {
        if (controller.signal.aborted) return

        setError(cause instanceof Error ? cause.message : 'Unable to load products.')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => controller.abort()
  }, [refreshKey])

  return {
    products,
    loading,
    error,
    refetch: () => setRefreshKey((current) => current + 1)
  }
}
