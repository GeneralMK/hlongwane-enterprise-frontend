import type { PropsWithChildren } from 'react'
import { Box } from '@chakra-ui/react'

import Navbar from './NavigationBar'

import Footer from '../components/Footer'
import CartDrawer from '../components/CartDrawer'

export default function WebsiteLayout({ children }: PropsWithChildren) {
  return (
    <Box minH="100vh" bg="white">
      <Navbar />

      <Box as="main">{children}</Box>
 <CartDrawer />
      <Footer />
    </Box>
  )
}
