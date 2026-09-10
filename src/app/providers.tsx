import type { PropsWithChildren } from 'react'
import { ApolloProvider } from '@apollo/client'
import { ChakraProvider } from '@chakra-ui/react'

import { apolloClient } from '../lib/apollo'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ApolloProvider client={apolloClient}>
      <ChakraProvider>{children}</ChakraProvider>
    </ApolloProvider>
  )
}
