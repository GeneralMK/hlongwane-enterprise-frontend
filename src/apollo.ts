import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

import { fetchJwt } from './utils'
import { API_HOST, USER_STORAGE_KEY } from './utils/contants'

const httpLink = createHttpLink({
  uri: API_HOST + '/graphql'
})
const authLink = setContext((_, { headers }) => {
  const token = fetchJwt()
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ''
    }
  }
})

const errorLink = onError(({ response }) => {
  if (response?.errors && response.errors[0].message === 'Invalid token.') {
    window.localStorage.removeItem(USER_STORAGE_KEY)
    window.sessionStorage.removeItem(USER_STORAGE_KEY)
    window.location.replace('/')
  }
})

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: authLink.concat(errorLink).concat(httpLink)
})

export default client
