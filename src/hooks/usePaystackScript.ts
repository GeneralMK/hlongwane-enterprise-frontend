import {
  useEffect,
  useState
} from 'react'

const PAYSTACK_SCRIPT_ID =
  'paystack-inline-script'

const PAYSTACK_SCRIPT_URL =
  'https://js.paystack.co/v2/inline.js'

type ScriptStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'error'

export function usePaystackScript() {
  const [status, setStatus] =
    useState<ScriptStatus>(() => {
      if (
        typeof window !== 'undefined' &&
        window.PaystackPop
      ) {
        return 'ready'
      }

      return 'idle'
    })

  useEffect(() => {
    if (
      typeof window === 'undefined'
    ) {
      return
    }

    if (window.PaystackPop) {
      setStatus('ready')
      return
    }

    let script =
      document.getElementById(
        PAYSTACK_SCRIPT_ID
      ) as HTMLScriptElement | null

    const handleLoad = () => {
      if (window.PaystackPop) {
        setStatus('ready')
      } else {
        setStatus('error')
      }
    }

    const handleError = () => {
      setStatus('error')
    }

    if (!script) {
      setStatus('loading')

      script =
        document.createElement(
          'script'
        )

      script.id =
        PAYSTACK_SCRIPT_ID

      script.src =
        PAYSTACK_SCRIPT_URL

      script.async = true

      script.addEventListener(
        'load',
        handleLoad
      )

      script.addEventListener(
        'error',
        handleError
      )

      document.body.appendChild(
        script
      )
    } else {
      setStatus('loading')

      script.addEventListener(
        'load',
        handleLoad
      )

      script.addEventListener(
        'error',
        handleError
      )
    }

    const checkInterval =
      window.setInterval(() => {
        if (window.PaystackPop) {
          setStatus('ready')

          window.clearInterval(
            checkInterval
          )
        }
      }, 250)

    const timeout =
      window.setTimeout(() => {
        if (!window.PaystackPop) {
          setStatus('error')
        }

        window.clearInterval(
          checkInterval
        )
      }, 10000)

    return () => {
      script?.removeEventListener(
        'load',
        handleLoad
      )

      script?.removeEventListener(
        'error',
        handleError
      )

      window.clearInterval(
        checkInterval
      )

      window.clearTimeout(
        timeout
      )
    }
  }, [])

  return {
    isLoading:
      status === 'idle' ||
      status === 'loading',

    isReady:
      status === 'ready',

    hasError:
      status === 'error'
  }
}