import { ApolloProvider } from '@apollo/client'
import { ChakraProvider } from '@chakra-ui/react'
import { GoogleOAuthProvider } from '@react-oauth/google'

import {
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query'

import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import client from './apollo'
import InactivityLogout from './components/InactivityLogout'
import AppProvider from './context/App'
import AuthProvider from './context/Auth'
import { CartProvider } from './context/CartContext'

import './main.css'
import Navigation from './navigation'
import theme from './theme'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root element was not found.')
}

const queryClient = new QueryClient()

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

const application = (
  <QueryClientProvider client={queryClient}>
    <ApolloProvider client={client}>
      <BrowserRouter>
        <ChakraProvider theme={theme}>
          <AuthProvider>
            <CartProvider>
              <InactivityLogout
                timeout={3 * 60 * 1000}
                warningDuration={60 * 1000}
              >
                <AppProvider>
                  <Navigation />
                </AppProvider>
              </InactivityLogout>
            </CartProvider>
          </AuthProvider>
        </ChakraProvider>
      </BrowserRouter>
    </ApolloProvider>
  </QueryClientProvider>
)

createRoot(container).render(
  googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>
      {application}
    </GoogleOAuthProvider>
  ) : (
    application
  )
)