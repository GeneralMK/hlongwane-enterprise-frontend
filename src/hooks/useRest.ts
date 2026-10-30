import { useCallback, useEffect, useRef, useState } from 'react'

import { getErrorMessage, request } from '../rest/client'

export function useRestQuery<T>(path: string | null, token?: string | null) {
  const [state, setState] = useState<{
    key: string | null
    data: T | null
    loading: boolean
    error: string | null
  }>({
    key: null,
    data: null,
    loading: false,
    error: null
  })

  const [refreshKey, setRefreshKey] = useState(0)

  // Include authentication in request identity so previous users'
  // results are not exposed when a session changes.
  const key = path === null ? null : JSON.stringify([path, token ?? null])

  const refetch = useCallback(() => {
    setRefreshKey((current) => current + 1)
  }, [])

  useEffect(() => {
    if (path === null) return

    const controller = new AbortController()

    setState((previous) => ({
      key,
      data: previous.key === key ? previous.data : null,
      loading: true,
      error: null
    }))

    async function load() {
      try {
        const result = await request<T>(path!, {
          token,
          signal: controller.signal
        })

        if (!controller.signal.aborted) {
          setState({
            key,
            data: result,
            loading: false,
            error: null
          })
        }
      } catch (error) {
        if (controller.signal.aborted) return

        setState((previous) => ({
          key,
          data: previous.key === key ? previous.data : null,
          loading: false,
          error: getErrorMessage(error)
        }))
      }
    }

    void load()

    return () => controller.abort()
  }, [path, token, key, refreshKey])

  const current = key !== null && state.key === key

  return {
    data: current ? state.data : null,
    loading: key !== null && (!current || state.loading),
    error: current ? state.error : null,
    refetch
  }
}

export function useRestMutation<TArgs extends unknown[], TResult>(
  operation: (...args: TArgs) => Promise<TResult>
) {
  const [pending, setPending] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mounted = useRef(false)
  const latestCall = useRef(0)

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult> => {
      const callId = ++latestCall.current

      if (mounted.current) {
        setPending((current) => current + 1)
        setError(null)
      }

      try {
        return await operation(...args)
      } catch (error) {
        if (mounted.current && callId === latestCall.current) {
          setError(getErrorMessage(error))
        }

        throw error
      } finally {
        if (mounted.current) {
          setPending((current) => Math.max(0, current - 1))
        }
      }
    },
    [operation]
  )

  const reset = useCallback(() => {
    latestCall.current++
    setError(null)
  }, [])

  return {
    execute,
    loading: pending > 0,
    error,
    reset
  }
}
