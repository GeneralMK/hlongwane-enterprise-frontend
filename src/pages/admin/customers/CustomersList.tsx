import {
  Badge,
  Box,
  Card,
  CardBody,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr
} from '@chakra-ui/react'
import { Eye, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageWrap } from '../../../layout'

const customers = [
  {
    id: 'john-smith',
    name: 'John Smith',
    email: 'john.smith@example.com',
    orders: 15,
    totalSpent: 'R4599.85',
    status: 'active'
  },
  {
    id: 'sarah-johnson',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    orders: 8,
    totalSpent: 'R1299.92',
    status: 'active'
  },
  {
    id: 'mike-davis',
    name: 'Mike Davis',
    email: 'mike.davis@example.com',
    orders: 3,
    totalSpent: 'R599.97',
    status: 'active'
  },
  {
    id: 'emily-brown',
    name: 'Emily Brown',
    email: 'emily.b@example.com',
    orders: 12,
    totalSpent: 'R3299.88',
    status: 'active'
  }
]

export default function CustomersList() {
  const navigate = useNavigate()

  return (
    <PageWrap
      title="Customers List"
      subtitle="Manage customer accounts"
    >
      <SimpleGrid
        columns={{
          base: 1,
          md: 4
        }}
        spacing={4}
      >
        {[
          ['Total Customers', '362'],
          ['Active', '342'],
          ['New This Month', '19'],
          ['VIP', '91']
        ].map(([label, value]) => (
          <Card
            key={label}
            variant="outline"
            borderRadius="12px"
          >
            <CardBody>
              <Text
                color="gray.500"
                fontSize="sm"
              >
                {label}
              </Text>

              <Text
                fontSize="2xl"
                fontWeight="700"
              >
                {value}
              </Text>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      <Card
        mt={5}
        variant="outline"
        borderRadius="12px"
      >
        <CardBody>
          <InputGroup mb={5}>
            <InputLeftElement>
              <Search size={16} />
            </InputLeftElement>

            <Input
              placeholder="Search customers..."
              bg="gray.100"
              border="none"
            />
          </InputGroup>

          <Box overflowX="auto">
            <Table>
              <Thead>
                <Tr>
                  <Th>Customer</Th>
                  <Th>Email</Th>
                  <Th>Orders</Th>
                  <Th>Total Spent</Th>
                  <Th>Status</Th>
                  <Th textAlign="right">
                    Actions
                  </Th>
                </Tr>
              </Thead>

              <Tbody>
                {customers.map((customer) => (
                  <Tr key={customer.id}>
                    <Td>{customer.name}</Td>
                    <Td>{customer.email}</Td>
                    <Td>{customer.orders}</Td>
                    <Td>
                      {customer.totalSpent}
                    </Td>
                    <Td>
                      <Badge
                        colorScheme="green"
                        borderRadius="full"
                      >
                        {customer.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Flex justify="flex-end">
                        <Icon
                          as={Eye}
                          cursor="pointer"
                          onClick={() =>
                            navigate(
                              `/admin/customers/${customer.id}`
                            )
                          }
                        />
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>
    </PageWrap>
  )
}
