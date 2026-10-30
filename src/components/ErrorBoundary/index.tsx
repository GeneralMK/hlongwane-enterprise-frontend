import { Flex, Heading } from '@chakra-ui/react'
import * as React from 'react'
import { FiAlertTriangle } from 'react-icons/fi'
import { ScrollView } from '../../components'
import theme from '../../theme'

const changedArray = (
  a: Array<unknown> = [],
  b: Array<unknown> = []
) =>
  a.length !== b.length ||
  a.some((item, index) => !Object.is(item, b[index]))

interface FallbackProps {
  error: Error
  resetErrorBoundary: (...args: Array<unknown>) => void
}

interface ErrorBoundaryPropsWithComponent {
  onResetKeysChange?: (
    prevResetKeys: Array<unknown> | undefined,
    resetKeys: Array<unknown> | undefined
  ) => void

  onReset?: (...args: Array<unknown>) => void

  onError?: (
    error: Error,
    info: { componentStack: string }
  ) => void

  resetKeys?: Array<unknown>

  fallback?: never

  FallbackComponent: React.ComponentType<FallbackProps>

  fallbackRender?: never
}

declare function FallbackRender(
  props: FallbackProps
):
  | React.ReactElement<
      unknown,
      string | React.FunctionComponent | typeof React.Component
    >
  | null

interface ErrorBoundaryPropsWithRender {
  onResetKeysChange?: (
    prevResetKeys: Array<unknown> | undefined,
    resetKeys: Array<unknown> | undefined
  ) => void

  onReset?: (...args: Array<unknown>) => void

  onError?: (
    error: Error,
    info: { componentStack: string }
  ) => void

  resetKeys?: Array<unknown>

  fallback?: never

  FallbackComponent?: never

  fallbackRender: typeof FallbackRender
}

interface ErrorBoundaryPropsWithFallback {
  onResetKeysChange?: (
    prevResetKeys: Array<unknown> | undefined,
    resetKeys: Array<unknown> | undefined
  ) => void

  onReset?: (...args: Array<unknown>) => void

  onError?: (
    error: Error,
    info: { componentStack: string }
  ) => void

  resetKeys?: Array<unknown>

  fallback?:
    | React.ReactElement<
        unknown,
        string | React.FunctionComponent | typeof React.Component
      >
    | null

  FallbackComponent?: never

  fallbackRender?: never
}

type ErrorBoundaryProps =
  | ErrorBoundaryPropsWithFallback
  | ErrorBoundaryPropsWithComponent
  | ErrorBoundaryPropsWithRender

type ErrorBoundaryState = {
  error: Error | null
}

const initialState: ErrorBoundaryState = {
  error: null,
}

class ErrorBoundary extends React.Component<
  React.PropsWithRef<
    React.PropsWithChildren<ErrorBoundaryProps>
  >,
  ErrorBoundaryState
> {
  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  state = initialState

  updatedWithError = false

  resetErrorBoundary = (...args: Array<unknown>) => {
    this.props.onReset?.(...args)
    this.reset()
  }

  reset() {
    this.updatedWithError = false
    this.setState(initialState)
  }

  componentDidCatch(
    error: Error,
    info: React.ErrorInfo
  ) {
    this.props.onError?.(error, {
      componentStack: info.componentStack ?? '',
    })
  }

  componentDidMount() {
    const { error } = this.state

    if (error !== null) {
      this.updatedWithError = true
    }
  }

  componentDidUpdate(
    prevProps: ErrorBoundaryProps
  ) {
    const { error } = this.state
    const { resetKeys } = this.props

    if (
      error !== null &&
      !this.updatedWithError
    ) {
      this.updatedWithError = true
      return
    }

    if (
      error !== null &&
      changedArray(
        prevProps.resetKeys,
        resetKeys
      )
    ) {
      this.props.onResetKeysChange?.(
        prevProps.resetKeys,
        resetKeys
      )

      this.reset()
    }
  }

  render() {
    const { error } = this.state

    const {
      fallbackRender,
      FallbackComponent,
      fallback,
    } = this.props

    if (error !== null) {
      const props = {
        error,
        resetErrorBoundary:
          this.resetErrorBoundary,
      }

      if (React.isValidElement(fallback)) {
        return fallback
      }

      if (
        typeof fallbackRender === 'function'
      ) {
        return fallbackRender(props)
      }

      if (FallbackComponent) {
        return <FallbackComponent {...props} />
      }

      return (
        <ScrollView justifyContent="center">
          <Flex
            alignItems="center"
            flexDirection="column"
            justifyContent="center"
            margin="0 auto"
            width="100%"
            maxWidth="320px"
            textAlign="center"
          >
            <FiAlertTriangle
              color={theme.colors.red[500]}
              size="56px"
              strokeWidth={1.5}
            />

            <Heading
              as="h2"
              color="gray.500"
              fontSize="xl"
              marginTop={4}
              textAlign="center"
            >
              An error has occurred
            </Heading>
          </Flex>
        </ScrollView>
      )
    }

    return this.props.children
  }
}

function withErrorBoundary<P>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: ErrorBoundaryProps
): React.ComponentType<P> {
  const Wrapped: React.ComponentType<P> = (
    props
  ) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        {/* @ts-ignore */}
        <Component {...props} />
      </ErrorBoundary>
    )
  }

  const name =
    Component.displayName ||
    Component.name ||
    'Unknown'

  Wrapped.displayName = `withErrorBoundary(${name})`

  return Wrapped
}

function useErrorHandler(
  givenError?: unknown
): (error: unknown) => void {
  const [error, setError] =
    React.useState<unknown>(null)

  if (givenError != null) {
    throw givenError
  }

  if (error != null) {
    throw error
  }

  return setError
}

export default ErrorBoundary

export {
  ErrorBoundary,
  withErrorBoundary,
  useErrorHandler,
}

export type {
  FallbackProps,
  ErrorBoundaryPropsWithComponent,
  ErrorBoundaryPropsWithRender,
  ErrorBoundaryPropsWithFallback,
  ErrorBoundaryProps,
}