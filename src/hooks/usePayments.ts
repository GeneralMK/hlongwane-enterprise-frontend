import { useCallback, useEffect, useState } from 'react'

import {
  getPayment,
  getPaymentByReference,
  initializePayment,
  requestPaymentRefund
} from '../utils/payment'

import type { PaymentDetails } from '../rest/paymentTypes'

import { useRestMutation } from './useRest'

type PaymentLookup = {
  enabled: boolean
  // Change when the authenticated session changes.
  sessionKey: string | null
} & ({ id: string; reference?: never } | { reference: string; id?: never })

export function usePayment(options: PaymentLookup) {
  const { enabled, sessionKey, id, reference } = options

  const key =
    enabled && sessionKey && (id || reference) ? JSON.stringify([sessionKey, id, reference]) : null

  const [state, setState] = useState<{
    key: string | null
    data: PaymentDetails | null
    loading: boolean
    error: string | null
  }>({
    key: null,
    data: null,
    loading: false,
    error: null
  })

  const [revision, setRevision] = useState(0)

  const refetch = useCallback(() => {
    setRevision((current) => current + 1)
  }, [])

  useEffect(() => {
    if (!key) return

    const controller = new AbortController()

    setState({
      key,
      data: null,
      loading: true,
      error: null
    })

    async function load() {
      try {
        const payment = id
          ? await getPayment(id, controller.signal)
          : await getPaymentByReference(reference!, controller.signal)

        if (!controller.signal.aborted) {
          setState({
            key,
            data: payment,
            loading: false,
            error: null
          })
        }
      } catch (error) {
        if (controller.signal.aborted) return

        setState({
          key,
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unable to load payment.'
        })
      }
    }

    void load()

    return () => controller.abort()
  }, [key, id, reference, revision])

  const current = key !== null && state.key === key

  return {
    payment: current ? state.data : null,
    loading: key !== null && (!current || state.loading),
    error: current ? state.error : null,
    refetch
  }
}

export function usePayments() {
  const initialization = useRestMutation(initializePayment)
  const refund = useRestMutation(requestPaymentRefund)

  return {
    initializePayment: initialization.execute,
    initializing: initialization.loading,
    initializationError: initialization.error,
    resetInitialization: initialization.reset,

    requestRefund: refund.execute,
    refunding: refund.loading,
    refundError: refund.error,
    resetRefund: refund.reset
  }
}

export default usePayments
