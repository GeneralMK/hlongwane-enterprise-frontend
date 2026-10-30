import { Box, Center, Flex, Grid, HStack, Spinner, VStack } from '@chakra-ui/react'
import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context'

import type { AccountTab } from '../pages/dashboard/types'
import Sidebar from '../pages/dashboard/components/Sidebar'

export default function Private() {
  const { user } = useAuthContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true })
    }
  }, [user])

  if (!user) {
    return (
      <Center height="100vh">
        <Spinner color="primary.500" size="xl" />
      </Center>
    )
  }

  return (
    <Flex align="flex-start">
      <Sidebar />

      <Box flex="1" px={8} py={8} maxW="1400px">
        <Outlet />
      </Box>
    </Flex>
  )
}
