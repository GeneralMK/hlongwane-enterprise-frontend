import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Skeleton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast
} from '@chakra-ui/react'
import { RefreshCcw, Search, UserCheck, UserX } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  gql,
  useMutation,
  useQuery
} from '@apollo/client'

import { PageWrap } from '../../../layout'

enum EnumSupportTicketPriority {
  Low = 'LOW',
  Normal = 'NORMAL',
  High = 'HIGH',
  Urgent = 'URGENT'
}

enum EnumSupportTicketStatus {
  Open = 'OPEN',
  InProgress = 'IN_PROGRESS',
  Resolved = 'RESOLVED',
  Closed = 'CLOSED'
}

type SupportPersonnel = {
  id: number
  firstName?: string | null
  lastName?: string | null
  email: string
  role: string
}

type SupportTicketUser = {
  id: string
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}

type SupportTicket = {
  id: string
  createdAt: string
  updatedAt: string
  subject: string
  message: string
  category: string
  status: EnumSupportTicketStatus
  priority: EnumSupportTicketPriority
  assignedAt?: string | null
  resolvedAt?: string | null
  closedAt?: string | null
  user?: SupportTicketUser | null
  item?: {
    id: string
    name: string
    imageUrl?: string | null
  } | null
  rental?: {
    id: string
    item?: {
      id: string
      name: string
      imageUrl?: string | null
    } | null
  } | null
  assignedToAdminUser?: SupportPersonnel | null
  assignedByAdminUser?: SupportPersonnel | null
}

type AdminSupportTicketsData = {
  adminSupportTickets: {
    tickets: SupportTicket[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

type AdminSupportTicketsVariables = {
  input?: {
    page?: number
    limit?: number
    search?: string | null
    status?: EnumSupportTicketStatus | null
    priority?: EnumSupportTicketPriority | null
    assignedToAdminUserId?: number | null
    unassignedOnly?: boolean | null
  } | null
}

type SupportPersonnelData = {
  supportPersonnel: SupportPersonnel[]
}

type AssignSupportTicketData = {
  assignSupportTicket: SupportTicket
}

type AssignSupportTicketVariables = {
  id: string
  input: {
    assignedToAdminUserId: number
    priority?: EnumSupportTicketPriority | null
  }
}

type UnassignSupportTicketData = {
  unassignSupportTicket: SupportTicket
}

type UnassignSupportTicketVariables = {
  id: string
}

type UpdateSupportTicketData = {
  updateSupportTicket: SupportTicket
}

type UpdateSupportTicketVariables = {
  id: string
  input: {
    status?: EnumSupportTicketStatus | null
    priority?: EnumSupportTicketPriority | null
  }
}

const ADMIN_SUPPORT_TICKETS_QUERY = gql`
  query AdminSupportTickets(
    $input: AdminSupportTicketsInput
  ) {
    adminSupportTickets(input: $input) {
      tickets {
        id
        createdAt
        updatedAt
        subject
        message
        category
        status
        priority
        assignedAt
        resolvedAt
        closedAt
        user {
          id
          fullName
          firstName
          lastName
          email
        }
        rental {
          id
          item {
            id
            name
            imageUrl
          }
        }
        item {
          id
          name
          imageUrl
        }
        assignedToAdminUser {
          id
          firstName
          lastName
          email
          role
        }
        assignedByAdminUser {
          id
          firstName
          lastName
          email
          role
        }
      }
      total
      page
      limit
      totalPages
    }
  }
`

const SUPPORT_PERSONNEL_QUERY = gql`
  query SupportPersonnel {
    supportPersonnel {
      id
      firstName
      lastName
      email
      role
    }
  }
`

const ASSIGN_SUPPORT_TICKET_MUTATION = gql`
  mutation AssignSupportTicket(
    $id: ID!
    $input: AssignSupportTicketInput!
  ) {
    assignSupportTicket(id: $id, input: $input) {
      id
      status
      priority
      assignedAt
      assignedToAdminUser {
        id
        firstName
        lastName
        email
        role
      }
    }
  }
`

const UNASSIGN_SUPPORT_TICKET_MUTATION = gql`
  mutation UnassignSupportTicket($id: ID!) {
    unassignSupportTicket(id: $id) {
      id
      status
      assignedAt
      assignedToAdminUser {
        id
      }
    }
  }
`

const UPDATE_SUPPORT_TICKET_MUTATION = gql`
  mutation UpdateSupportTicket(
    $id: ID!
    $input: UpdateSupportTicketInput!
  ) {
    updateSupportTicket(id: $id, input: $input) {
      id
      status
      priority
      resolvedAt
      closedAt
    }
  }
`

const PAGE_SIZE = 20

function displayName(
  person?: {
    firstName?: string | null
    lastName?: string | null
    fullName?: string | null
    email?: string | null
  } | null
): string {
  if (!person) {
    return 'Unassigned'
  }

  return (
    person.fullName?.trim() ||
    [person.firstName, person.lastName].filter(Boolean).join(' ').trim() ||
    person.email ||
    'Unknown'
  )
}

function formatDate(value?: string | null): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

function statusColour(status: EnumSupportTicketStatus): string {
  switch (status) {
    case EnumSupportTicketStatus.InProgress:
      return 'blue'
    case EnumSupportTicketStatus.Resolved:
      return 'green'
    case EnumSupportTicketStatus.Closed:
      return 'gray'
    default:
      return 'orange'
  }
}

function priorityColour(priority: EnumSupportTicketPriority): string {
  switch (priority) {
    case EnumSupportTicketPriority.Urgent:
      return 'red'
    case EnumSupportTicketPriority.High:
      return 'orange'
    case EnumSupportTicketPriority.Low:
      return 'gray'
    default:
      return 'blue'
  }
}

export default function SupportTicketsPage() {
  const toast = useToast()

  const [page, setPage] = useState(1)

  const [search, setSearch] = useState('')

  const [status, setStatus] = useState<EnumSupportTicketStatus | ''>('')

  const [priority, setPriority] = useState<EnumSupportTicketPriority | ''>('')

  const [unassignedOnly, setUnassignedOnly] = useState(false)

  const {
    data,
    loading,
    error,
    refetch,
    networkStatus
  } = useQuery<
    AdminSupportTicketsData,
    AdminSupportTicketsVariables
  >(
    ADMIN_SUPPORT_TICKETS_QUERY,
    {
      variables: {
        input: {
          page,
          limit: PAGE_SIZE,
          search:
            search.trim() || null,
          status:
            status || null,
          priority:
            priority || null,
          unassignedOnly
        }
      },
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true
    }
  )

  const {
    data: personnelData,
    error: personnelError
  } = useQuery<SupportPersonnelData>(
    SUPPORT_PERSONNEL_QUERY,
    {
      fetchPolicy: 'cache-and-network'
    }
  )

  const [
    assignSupportTicket,
    { loading: assigning }
  ] = useMutation<
    AssignSupportTicketData,
    AssignSupportTicketVariables
  >(ASSIGN_SUPPORT_TICKET_MUTATION)

  const [
    unassignSupportTicket,
    { loading: unassigning }
  ] = useMutation<
    UnassignSupportTicketData,
    UnassignSupportTicketVariables
  >(UNASSIGN_SUPPORT_TICKET_MUTATION)

  const [
    updateSupportTicket,
    { loading: updating }
  ] = useMutation<
    UpdateSupportTicketData,
    UpdateSupportTicketVariables
  >(UPDATE_SUPPORT_TICKET_MUTATION)

  const tickets = useMemo(
    () => data?.adminSupportTickets.tickets ?? [],
    [data?.adminSupportTickets.tickets]
  )

  const personnel = personnelData?.supportPersonnel ?? []

  const totalPages = Math.max(data?.adminSupportTickets.totalPages ?? 1, 1)

  const handleAssign = async (ticketId: string, adminUserId: number): Promise<void> => {
    try {
      await assignSupportTicket({
        variables: {
          id: ticketId,
          input: {
            assignedToAdminUserId: adminUserId
          }
        }
      })

      toast({
        title: 'Ticket assigned',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      await refetch()
    } catch (assignError) {
      toast({
        title: 'Unable to assign ticket',
        description: assignError instanceof Error ? assignError.message : undefined,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const handleUnassign = async (ticketId: string): Promise<void> => {
    try {
      await unassignSupportTicket({
        variables: {
          id: ticketId
        }
      })

      toast({
        title: 'Ticket unassigned',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      await refetch()
    } catch (unassignError) {
      toast({
        title: 'Unable to unassign ticket',
        description: unassignError instanceof Error ? unassignError.message : undefined,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const handleStatus = async (
    ticketId: string,
    nextStatus: EnumSupportTicketStatus
  ): Promise<void> => {
    try {
      await updateSupportTicket({
        variables: {
          id: ticketId,
          input: {
            status: nextStatus
          }
        }
      })

      toast({
        title: 'Ticket updated',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      await refetch()
    } catch (updateError) {
      toast({
        title: 'Unable to update ticket',
        description: updateError instanceof Error ? updateError.message : undefined,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const handlePriority = async (
    ticketId: string,
    nextPriority: EnumSupportTicketPriority
  ): Promise<void> => {
    try {
      await updateSupportTicket({
        variables: {
          id: ticketId,
          input: {
            priority: nextPriority
          }
        }
      })

      await refetch()
    } catch (updateError) {
      toast({
        title: 'Unable to update priority',
        description: updateError instanceof Error ? updateError.message : undefined,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  return (
    <PageWrap
      title="Support Tickets"
      subtitle="View customer tickets and assign them to support personnel"
    >
      <Card variant="outline">
        <CardBody>
          <Flex
            gap={3}
            mb={5}
            direction={{
              base: 'column',
              lg: 'row'
            }}
          >
            <InputGroup flex={1}>
              <InputLeftElement>
                <Search size={16} />
              </InputLeftElement>

              <Input
                value={search}
                placeholder="Search customer, subject, product, or message"
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
              />
            </InputGroup>

            <Select
              maxW={{
                base: '100%',
                lg: '190px'
              }}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as EnumSupportTicketStatus | '')
                setPage(1)
              }}
            >
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </Select>

            <Select
              maxW={{
                base: '100%',
                lg: '190px'
              }}
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value as EnumSupportTicketPriority | '')
                setPage(1)
              }}
            >
              <option value="">All priorities</option>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>

            <Button
              variant={unassignedOnly ? 'solid' : 'outline'}
              onClick={() => {
                setUnassignedOnly((current) => !current)
                setPage(1)
              }}
            >
              Unassigned only
            </Button>

            <Button
              leftIcon={<RefreshCcw size={16} />}
              variant="outline"
              isLoading={networkStatus === 4}
              onClick={() => {
                void refetch()
              }}
            >
              Refresh
            </Button>
          </Flex>

          {error ? (
            <Text mb={4} color="red.500">
              {error.message}
            </Text>
          ) : null}

          {personnelError ? (
            <Text mb={4} color="orange.500">
              Support personnel could not be loaded: {personnelError.message}
            </Text>
          ) : null}

          {loading && tickets.length === 0 ? (
            <Stack spacing={3}>
              {Array.from({
                length: 5
              }).map((_, index) => (
                <Skeleton key={index} h="120px" borderRadius="10px" />
              ))}
            </Stack>
          ) : tickets.length === 0 ? (
            <Box py={16} textAlign="center">
              <Text fontSize="xl" fontWeight="700">
                No support tickets found
              </Text>
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table minW="1450px">
                <Thead>
                  <Tr>
                    <Th>Ticket</Th>
                    <Th>Customer</Th>
                    <Th>Product</Th>
                    <Th>Priority</Th>
                    <Th>Status</Th>
                    <Th>Assigned To</Th>
                    <Th>Created</Th>
                  </Tr>
                </Thead>

                <Tbody>
                  {tickets.map((ticket) => (
                    <Tr key={ticket.id}>
                      <Td maxW="340px">
                        <Text fontWeight="700">{ticket.subject}</Text>

                        <Text
                          mt={1}
                          color="gray.600"
                          fontSize="sm"
                          noOfLines={3}
                          whiteSpace="normal"
                        >
                          {ticket.message}
                        </Text>

                        <Badge mt={2}>{ticket.category}</Badge>
                      </Td>

                      <Td>
                        <Text fontWeight="600">{displayName(ticket.user)}</Text>

                        <Text color="gray.500" fontSize="sm">
                          {ticket.user?.email}
                        </Text>
                      </Td>

                      <Td>
                        {ticket.item?.name ??
                          ticket.rental?.item?.name ??
                          'General support'}
                      </Td>

                      <Td minW="150px">
                        <Select
                          size="sm"
                          value={ticket.priority}
                          isDisabled={updating}
                          onChange={(event) => {
                            void handlePriority(
                              ticket.id,
                              event.target.value as EnumSupportTicketPriority
                            )
                          }}
                        >
                          <option value="LOW">Low</option>
                          <option value="NORMAL">Normal</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </Select>

                        <Badge mt={2} colorScheme={priorityColour(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </Td>

                      <Td minW="175px">
                        <Select
                          size="sm"
                          value={ticket.status}
                          isDisabled={updating}
                          onChange={(event) => {
                            void handleStatus(
                              ticket.id,
                              event.target.value as EnumSupportTicketStatus
                            )
                          }}
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </Select>

                        <Badge mt={2} colorScheme={statusColour(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </Td>

                      <Td minW="280px">
                        <FormControl>
                          <Select
                            size="sm"
                            value={ticket.assignedToAdminUser?.id ?? ''}
                            isDisabled={assigning || unassigning}
                            onChange={(event) => {
                              const value = Number(event.target.value)

                              if (value) {
                                void handleAssign(ticket.id, value)
                              }
                            }}
                          >
                            <option value="">Select support personnel</option>

                            {personnel.map((person) => (
                              <option key={person.id} value={person.id}>
                                {displayName(person)}
                              </option>
                            ))}
                          </Select>

                          <HStack mt={2}>
                            {ticket.assignedToAdminUser ? (
                              <>
                                <UserCheck size={15} />

                                <Text fontSize="xs" color="gray.600">
                                  {displayName(ticket.assignedToAdminUser)}
                                </Text>

                                <Button
                                  ml="auto"
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="red"
                                  leftIcon={<UserX size={13} />}
                                  isLoading={unassigning}
                                  onClick={() => {
                                    void handleUnassign(ticket.id)
                                  }}
                                >
                                  Unassign
                                </Button>
                              </>
                            ) : (
                              <Text fontSize="xs" color="gray.500">
                                Not assigned
                              </Text>
                            )}
                          </HStack>
                        </FormControl>
                      </Td>

                      <Td>{formatDate(ticket.createdAt)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}

          <Flex mt={6} justify="space-between" align="center">
            <Button
              variant="outline"
              isDisabled={page <= 1}
              onClick={() => {
                setPage((current) => Math.max(current - 1, 1))
              }}
            >
              Previous
            </Button>

            <Text color="gray.600" fontSize="sm">
              Page {page} of {totalPages}
            </Text>

            <Button
              variant="outline"
              isDisabled={page >= totalPages}
              onClick={() => {
                setPage((current) => Math.min(current + 1, totalPages))
              }}
            >
              Next
            </Button>
          </Flex>
        </CardBody>
      </Card>
    </PageWrap>
  )
}