import { Box, Flex } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'

import AdminSidebar from './AdminSidebar'

export default function AdminLayout() {
  return (
    <Flex minH="100vh" bg="gray.50">
      <AdminSidebar />

      <Box flex="1" overflow="auto">
        <Outlet />
      </Box>
    </Flex>
  )
}