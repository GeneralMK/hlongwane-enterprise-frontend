import { useCallback, useEffect, useState } from 'react'

import { API_HOST } from '../utils/contants'

export interface StorefrontCategory {
  id: string
  name: string
  slug: string
  description: string | null
  imageFile: {
    url?: string | null
    publicUrl?: string | null
  } | null
}

interface CategoriesResponse {
  success: boolean
  message?: string
  data?: StorefrontCategory[]
}

export default function useStorefrontCategories() {
  const [categories, setCategories] = useState<StorefrontCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refetch = useCallback(() => {
    setRefreshKey((current) => current + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const baseUrl = API_HOST.trim().replace(/\/+$/, '')

        const response = await fetch(`${baseUrl}/api/v1/categories/storefront`, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Unable to load categories (${response.status}).`)
        }

        const body = (await response.json()) as CategoriesResponse

        if (!body.success || !Array.isArray(body.data)) {
          throw new Error(body.message || 'Invalid categories response.')
        }

        if (!controller.signal.aborted) {
          setCategories(body.data)
        }
      } catch (cause) {
        if (controller.signal.aborted) return

        setError(cause instanceof Error ? cause.message : 'Unable to load categories.')
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
    categories,
    loading,
    error,
    refetch
  }
}
