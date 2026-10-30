import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Center,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr
} from '@chakra-ui/react'
import {
  gql,
  useQuery
} from '@apollo/client'
import {
  RefreshCcw,
  Search
} from 'lucide-react'
import {
  useMemo,
  useState
} from 'react'

import { PageWrap } from '../../../layout'

const PAGE_LIMIT = 20

enum EnumRentalStatus {
  Active = 'ACTIVE',
  Upcoming = 'UPCOMING',
  Overdue = 'OVERDUE',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED'
}

type RentalUser = {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}

type RentalItem = {
  id: string
  name: string
}

type RentalRecord = {
  id: string
  startDate: string
  endDate: string
  status: EnumRentalStatus
  user?: RentalUser | null
  item: RentalItem
}

type RentalsPagination = {
  rentals: RentalRecord[]
  page: number
  limit: number
  total: number
  totalPages: number
}

type RentalsQueryData = {
  rentals: RentalsPagination
}

type RentalsQueryVariables = {
  input: {
    page: number
    limit: number
    search?: string
    status?: EnumRentalStatus
  }
}

const RENTALS_QUERY = gql`
  query Rentals(
    $input: FindRentalsInput!
  ) {
    rentals(
      input: $input
    ) {
      rentals {
        id
        startDate
        endDate
        status

        user {
          firstName
          lastName
          email
        }

        item {
          id
          name
        }
      }

      page
      limit
      total
      totalPages
    }
  }
`

function formatDate(
  value?: string | null
) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat(
    'en-ZA',
    {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    }
  ).format(date)
}

function formatStatus(
  status?: EnumRentalStatus | null
) {
  if (!status) {
    return 'Unknown'
  }

  return status
    .toLowerCase()
    .split('_')
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ')
}

function getStatusColor(
  status?: EnumRentalStatus | null
) {
  switch (status) {
    case EnumRentalStatus.Active:
      return 'green'

    case EnumRentalStatus.Overdue:
      return 'red'

    case EnumRentalStatus.Upcoming:
      return 'blue'

    case EnumRentalStatus.Completed:
      return 'gray'

    case EnumRentalStatus.Cancelled:
      return 'orange'

    default:
      return 'gray'
  }
}

export default function RentalsDashboard() {
  const [
    search,
    setSearch
  ] = useState('')

  const [
    status,
    setStatus
  ] = useState<
    EnumRentalStatus | ''
  >('')

  const [
    page,
    setPage
  ] = useState(1)

  const {
    data,
    loading,
    error,
    refetch,
    networkStatus
  } = useQuery<
    RentalsQueryData,
    RentalsQueryVariables
  >(
    RENTALS_QUERY,
    {
      variables: {
        input: {
          page,
          limit: PAGE_LIMIT,
          search:
            search.trim() ||
            undefined,
          status:
            status ||
            undefined
        }
      },
      fetchPolicy:
        'cache-and-network',
      notifyOnNetworkStatusChange:
        true
    }
  )

  const pagination =
    data?.rentals

  const rentals =
    pagination?.rentals ?? []

  const counts = useMemo(() => {
    return rentals.reduce(
      (
        result,
        rental
      ) => {
        result[rental.status] =
          (
            result[
              rental.status
            ] ?? 0
          ) + 1

        return result
      },
      {} as Partial<
        Record<
          EnumRentalStatus,
          number
        >
      >
    )
  }, [rentals])

  const cards = [
    {
      label: 'Active Rentals',
      value:
        counts[
          EnumRentalStatus.Active
        ] ?? 0
    },
    {
      label: 'Upcoming',
      value:
        counts[
          EnumRentalStatus.Upcoming
        ] ?? 0
    },
    {
      label: 'Overdue',
      value:
        counts[
          EnumRentalStatus.Overdue
        ] ?? 0
    },
    {
      label: 'Completed',
      value:
        counts[
          EnumRentalStatus.Completed
        ] ?? 0
    }
  ]

  return (
    <PageWrap
      title="Rentals Dashboard"
      subtitle="Manage equipment rentals"
      rightElements={
        <Button
          leftIcon={
            <RefreshCcw size={16} />
          }
          variant="outline"
          isLoading={
            networkStatus === 4
          }
          onClick={() =>
            refetch()
          }
        >
          Refresh
        </Button>
      }
    >
      <SimpleGrid
        columns={{
          base: 1,
          sm: 2,
          md: 4
        }}
        spacing={4}
      >
        {cards.map(card => (
          <Card
            key={card.label}
            variant="outline"
            borderRadius="12px"
          >
            <CardBody>
              <Text
                color="gray.500"
                fontSize="sm"
              >
                {card.label}
              </Text>

              <Text
                mt={1}
                fontSize="2xl"
                fontWeight="700"
              >
                {card.value}
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
          <Flex
            mb={5}
            gap={3}
            direction={{
              base: 'column',
              md: 'row'
            }}
          >
            <InputGroup flex={1}>
              <InputLeftElement>
                <Search size={16} />
              </InputLeftElement>

              <Input
                value={search}
                placeholder="Search rentals..."
                bg="gray.100"
                border="none"
                onChange={event => {
                  setSearch(
                    event.target.value
                  )
                  setPage(1)
                }}
              />
            </InputGroup>

            <Select
              maxW={{
                base: '100%',
                md: '220px'
              }}
              value={status}
              onChange={event => {
                setStatus(
                  event.target.value as
                    | EnumRentalStatus
                    | ''
                )
                setPage(1)
              }}
            >
              <option value="">
                All statuses
              </option>

              {Object.values(
                EnumRentalStatus
              ).map(value => (
                <option
                  key={value}
                  value={value}
                >
                  {formatStatus(
                    value
                  )}
                </option>
              ))}
            </Select>
          </Flex>

          {error ? (
            <Alert
              status="error"
              borderRadius="10px"
              mb={4}
            >
              <AlertIcon />
              {error.message}
            </Alert>
          ) : null}

          {loading && !data ? (
            <Center py={16}>
              <Spinner
                size="lg"
                color="green.600"
              />
            </Center>
          ) : rentals.length === 0 ? (
            <Center
              py={16}
              flexDirection="column"
            >
              <Text
                fontSize="lg"
                fontWeight="600"
              >
                No rentals found
              </Text>

              <Text
                mt={1}
                color="gray.500"
                fontSize="sm"
              >
                Try changing the search
                or status filter.
              </Text>
            </Center>
          ) : (
            <>
              <Box overflowX="auto">
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Rental ID</Th>
                      <Th>Customer</Th>
                      <Th>Product</Th>
                      <Th>Period</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>

                  <Tbody>
                    {rentals.map(
                      rental => {
                        const fullName = [
                          rental.user
                            ?.firstName,
                          rental.user
                            ?.lastName
                        ]
                          .filter(Boolean)
                          .join(' ')
                          .trim()

                        const customer =
                          fullName ||
                          rental.user
                            ?.email ||
                          'Unknown customer'

                        return (
                          <Tr
                            key={
                              rental.id
                            }
                          >
                            <Td fontWeight="600">
                              {rental.id}
                            </Td>

                            <Td>
                              <Text fontWeight="500">
                                {customer}
                              </Text>

                              {rental.user
                                ?.email ? (
                                <Text
                                  color="gray.500"
                                  fontSize="xs"
                                >
                                  {
                                    rental
                                      .user
                                      .email
                                  }
                                </Text>
                              ) : null}
                            </Td>

                            <Td>
                              {
                                rental
                                  .item
                                  .name
                              }
                            </Td>

                            <Td>
                              {formatDate(
                                rental.startDate
                              )}{' '}
                              to{' '}
                              {formatDate(
                                rental.endDate
                              )}
                            </Td>

                            <Td>
                              <Badge
                                borderRadius="full"
                                colorScheme={getStatusColor(
                                  rental.status
                                )}
                                px={3}
                                py={1}
                              >
                                {formatStatus(
                                  rental.status
                                )}
                              </Badge>
                            </Td>
                          </Tr>
                        )
                      }
                    )}
                  </Tbody>
                </Table>
              </Box>

              <Flex
                mt={5}
                justify="space-between"
                align="center"
              >
                <Text
                  color="gray.500"
                  fontSize="sm"
                >
                  Page{' '}
                  {pagination?.page ??
                    page}{' '}
                  of{' '}
                  {Math.max(
                    pagination
                      ?.totalPages ??
                      1,
                    1
                  )}
                </Text>

                <Flex gap={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    isDisabled={
                      page <= 1
                    }
                    onClick={() =>
                      setPage(
                        current =>
                          Math.max(
                            1,
                            current - 1
                          )
                      )
                    }
                  >
                    Previous
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    isDisabled={
                      page >=
                      (
                        pagination
                          ?.totalPages ??
                        1
                      )
                    }
                    onClick={() =>
                      setPage(
                        current =>
                          current + 1
                      )
                    }
                  >
                    Next
                  </Button>
                </Flex>
              </Flex>
            </>
          )}
        </CardBody>
      </Card>
    </PageWrap>
  )
}