import axios from 'axios'
import { useEffect, useState } from 'react'

import { useAuthContext } from '../context'
import { API_HOST } from '../utils/contants'

export const CART_UPDATED_EVENT = 'dlinkup:cart-updated'

interface CartResponse {
  success: boolean
  data: {
    id: string
    items: Array<{
      id: string
      quantity: number
    }>
  }
}

export default function useCartCount() {
  const { token, isAuthenticating } = useAuthContext()
  const [refresh, setRefresh] = useState(0)

  const [state, setState] = useState<{
    token: string | null
    count: number
    loading: boolean
    error: string | null
  }>({
    token: null,
    count: 0,
    loading: false,
    error: null
  })

  useEffect(() => {
    function refreshCart() {
      setRefresh((value) => value + 1)
    }

    window.addEventListener(CART_UPDATED_EVENT, refreshCart)
    window.addEventListener('focus', refreshCart)

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, refreshCart)
      window.removeEventListener('focus', refreshCart)
    }
  }, [])

  useEffect(() => {
    if (!token || isAuthenticating) return

    const controller = new AbortController()
    const requestToken = token

    setState((previous) => ({
      token: requestToken,
      count: previous.token === requestToken ? previous.count : 0,
      loading: true,
      error: null
    }))

    async function loadCart() {
      try {
        const normalizedToken = requestToken.trim()

        const response = await axios.get<CartResponse>(
          `${API_HOST.trim().replace(/\/+$/, '')}/api/v1/carts/me`,
          {
            signal: controller.signal,
            timeout: 20_000,
            headers: {
              Accept: 'application/json',
              Authorization: /^Bearer\s/i.test(normalizedToken)
                ? normalizedToken
                : `Bearer ${normalizedToken}`
            }
          }
        )

        if (!response.data.success || !response.data.data) {
          throw new Error('Unable to load cart.')
        }

        const count = response.data.data.items.reduce((total, item) => total + item.quantity, 0)

        if (controller.signal.aborted) return

        setState({
          token: requestToken,
          count,
          loading: false,
          error: null
        })
      } catch {
        if (controller.signal.aborted) return

        setState((previous) => ({
          token: requestToken,
          count: previous.token === requestToken ? previous.count : 0,
          loading: false,
          error: 'Unable to refresh your cart.'
        }))
      }
    }

    void loadCart()

    return () => controller.abort()
  }, [token, isAuthenticating, refresh])

  const current = Boolean(token) && !isAuthenticating && state.token === token

  return {
    itemCount: current ? state.count : 0,
    loading: Boolean(token) && !isAuthenticating && (!current || state.loading),
    error: current ? state.error : null
  }
}
