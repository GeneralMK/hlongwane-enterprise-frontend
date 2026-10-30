import {
  Center,
  Spinner
} from '@chakra-ui/react'
import {
  Navigate,
  Outlet,
  useLocation
} from 'react-router-dom'

import { useAuthContext } from '../context'

export default function Admin() {
  const location = useLocation()

  const {
    isAdmin,
    isAuthenticated,
    isAuthenticating
  } = useAuthContext()

  if (isAuthenticating) {
    return (
      <Center minH="100vh">
        <Spinner
          size="xl"
          color="#0f3034"
        />
      </Center>
    )
  }

  if (
    !isAuthenticated ||
    !isAdmin
  ) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: `${location.pathname}${location.search}`
        }}
      />
    )
  }

  return <Outlet />
}