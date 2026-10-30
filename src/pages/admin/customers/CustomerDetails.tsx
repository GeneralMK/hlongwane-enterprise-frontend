import {
  Badge,
  Box,
  Card,
  CardBody,
  Flex,
  IconButton,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack
} from '@chakra-ui/react'
import {
  ArrowLeft,
  Mail,
  MapPin,
  Phone
} from 'lucide-react'
import {
  useNavigate,
  useParams
} from 'react-router-dom'
import { PageWrap } from '../../../layout'

export default function CustomerDetails() {
  const navigate = useNavigate()
  useParams()

  return (
    <PageWrap
      title="John Smith"
      subtitle="Customer since 2025-03-15"
      rightElements={
        <IconButton
          aria-label="Back"
          icon={<ArrowLeft size={18} />}
          variant="ghost"
          onClick={() => navigate(-1)}
        />
      }
    >
      <SimpleGrid
        columns={{
          base: 1,
          xl: 3
        }}
        spacing={5}
        alignItems="start"
      >
        <Box gridColumn={{ xl: 'span 2' }}>
          <Tabs colorScheme="green">
            <TabList>
              <Tab>Orders</Tab>
              <Tab>Rentals</Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <Card
                  variant="outline"
                  borderRadius="12px"
                >
                  <CardBody>
                    <Text
                      fontWeight="600"
                      mb={4}
                    >
                      Order History
                    </Text>

                    <VStack
                      align="stretch"
                      spacing={0}
                    >
                      {[
                        [
                          'ORD-001',
                          '2026-06-08',
                          'R599.97'
                        ],
                        [
                          'ORD-005',
                          '2026-05-22',
                          'R149.99'
                        ]
                      ].map(
                        (
                          [id, date, total],
                          index
                        ) => (
                          <Flex
                            key={id}
                            justify="space-between"
                            py={4}
                            borderBottom={
                              index === 0
                                ? '1px solid'
                                : 'none'
                            }
                            borderColor="gray.200"
                          >
                            <Box>
                              <Text fontWeight="500">
                                {id}
                              </Text>

                              <Text
                                color="gray.500"
                                fontSize="sm"
                              >
                                {date}
                              </Text>
                            </Box>

                            <Box textAlign="right">
                              <Text fontWeight="600">
                                {total}
                              </Text>

                              <Badge
                                colorScheme="green"
                                borderRadius="full"
                              >
                                completed
                              </Badge>
                            </Box>
                          </Flex>
                        )
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>

              <TabPanel px={0}>
                <Card
                  variant="outline"
                  borderRadius="12px"
                >
                  <CardBody>
                    <Text color="gray.500">
                      No active rentals.
                    </Text>
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>

        <VStack
          align="stretch"
          spacing={5}
        >
          <Card
            variant="outline"
            borderRadius="12px"
          >
            <CardBody>
              <Text
                fontWeight="600"
                mb={4}
              >
                Contact Information
              </Text>

              <VStack
                align="stretch"
                spacing={3}
              >
                <Flex gap={2}>
                  <Mail size={16} />
                  <Text fontSize="sm">
                    john.smith@example.com
                  </Text>
                </Flex>

                <Flex gap={2}>
                  <Phone size={16} />
                  <Text fontSize="sm">
                    (555) 123-4567
                  </Text>
                </Flex>

                <Flex gap={2}>
                  <MapPin size={16} />
                  <Text fontSize="sm">
                    123 Main St, City, ST
                    12345
                  </Text>
                </Flex>
              </VStack>
            </CardBody>
          </Card>

          <Card
            variant="outline"
            borderRadius="12px"
          >
            <CardBody>
              <Text
                fontWeight="600"
                mb={4}
              >
                Customer Stats
              </Text>

              <Box mb={3}>
                <Text
                  color="gray.500"
                  fontSize="sm"
                >
                  Total Orders
                </Text>
                <Text fontWeight="600">
                  15
                </Text>
              </Box>

              <Box mb={3}>
                <Text
                  color="gray.500"
                  fontSize="sm"
                >
                  Total Spent
                </Text>
                <Text fontWeight="600">
                  R4599.85
                </Text>
              </Box>

              <Badge
                colorScheme="green"
                borderRadius="full"
              >
                VIP
              </Badge>
            </CardBody>
          </Card>
        </VStack>
      </SimpleGrid>
    </PageWrap>
  )
}
