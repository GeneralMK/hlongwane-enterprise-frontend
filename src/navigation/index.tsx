import { Center, Spinner } from '@chakra-ui/react'
import { Route, Routes } from 'react-router-dom'

import { Loadable } from '../components'
import { AdminLayout } from '../layout'

import PageNotFoundPage from './PageNotFound'

import { ADMIN_ROUTES, PRIVATE_ROUTES, PUBLIC_ROUTES, SUPPORT_AGENT_ROUTES } from './routes'

const routeFallback = (
  <Center height="100vh">
    <Spinner color="primary.500" size="xl" />
  </Center>
)

const Public = Loadable(() => import('./Public'), {
  fallback: routeFallback
})

const Private = Loadable(() => import('./Private'), {
  fallback: routeFallback
})

const Admin = Loadable(() => import('./Admin'), {
  fallback: routeFallback
})

const Navigation = () => {
  return (
    <Routes>
      <Route element={<Public />}>
        {PUBLIC_ROUTES.map(({ Element, path }) => (
          <Route key={path} path={path} element={<Element />} />
        ))}
      </Route>

      <Route element={<Private />}>
        {PRIVATE_ROUTES.map(({ Element, path }) => (
          <Route key={path} path={path} element={<Element />} />
        ))}
      </Route>

      <Route element={<Admin />}>
        <Route element={<AdminLayout />}>
          {ADMIN_ROUTES.map(({ Element, path }) => (
            <Route key={path} path={path} element={<Element />} />
          ))}
        </Route>
      </Route>

      <Route element={<Admin />}>
        <Route element={<AdminLayout />}>
          {SUPPORT_AGENT_ROUTES.map(({ Element, path }) => (
            <Route key={path} path={path} element={<Element />} />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<PageNotFoundPage />} />
    </Routes>
  )
}

export default Navigation
