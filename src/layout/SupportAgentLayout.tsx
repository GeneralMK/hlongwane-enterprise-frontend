import { Box, Flex, Icon, Text, VStack } from '@chakra-ui/react'
import {
  Headphones,
  LayoutDashboard,
  LogOut,
  MessageSquare
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { useAuthContext } from '../context'

export default function SupportAgentSidebar() {
  const { signOut, user } = useAuthContext()

  return (
    <Flex
      as="aside"
      width="250px"
      minWidth="250px"
      h="100vh"
      direction="column"
      bg="#f7f7f7"
      borderRight="1px solid"
      borderColor="gray.200"
    >
      <Box
        px={7}
        py={7}
        borderBottom="1px solid"
        borderColor="gray.200"
      >
        <Text
          fontSize="xl"
          fontWeight="700"
        >
          Support Portal
        </Text>

        <Text
          mt={1}
          fontSize="sm"
          color="gray.500"
        >
          {user?.firstName} {user?.lastName}
        </Text>
      </Box>

      <VStack
        flex={1}
        align="stretch"
        spacing={2}
        p={4}
      >
        <Flex
          as={NavLink}
          to="/support-agent"
          gap={4}
          p={3}
          borderRadius="10px"
          sx={{
            '&.active': {
              background: '#176526',
              color: 'white'
            }
          }}
        >
          <Icon as={LayoutDashboard} />
          <Text>Dashboard</Text>
        </Flex>

        <Flex
          as={NavLink}
          to="/support-agent/tickets"
          gap={4}
          p={3}
          borderRadius="10px"
          sx={{
            '&.active': {
              background: '#176526',
              color: 'white'
            }
          }}
        >
          <Icon as={MessageSquare} />
          <Text>My Tickets</Text>
        </Flex>
      </VStack>

      <Box p={4}>
        <Flex
          as="button"
          w="100%"
          gap={4}
          p={3}
          borderRadius="10px"
          onClick={signOut}
        >
          <Icon as={LogOut} />
          <Text>Logout</Text>
        </Flex>
      </Box>
    </Flex>
  )
}