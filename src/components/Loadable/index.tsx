import { Center, Spinner } from '@chakra-ui/react'
import { lazy, Suspense } from 'react'

type TLoadableOptions = {
  fallback?: React.ReactNode
}

export type LoadableComponentType = React.LazyExoticComponent<React.ComponentType<unknown>> & {
  preload: () => void
}

const Loadable = (factory: typeof lazy['arguments']['factory'], options: TLoadableOptions = {}) => {
  const fallback = options.fallback || (
    <Center height="100vh">
      <Spinner color="primary.500" size="xl" />
    </Center>
  )

  const LazyComponent = lazy(factory) as LoadableComponentType
  LazyComponent.preload = factory

  return (props: Record<string, unknown>) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  )
}

export default Loadable
