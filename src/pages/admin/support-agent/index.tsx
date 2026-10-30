import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Skeleton,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  Textarea,
  useToast,
  VStack
} from '@chakra-ui/react'
import { gql, useMutation, useQuery } from '@apollo/client'
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Inbox,
  MessageCircle,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  Ticket,
  UserRound
} from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useState } from 'react'

const SUPPORT_AGENT_DASHBOARD_QUERY = gql`
  query SupportAgentDashboard {
    supportAgentDashboard {
      totalAssigned
      open
      inProgress
      resolvedToday
      unread
      unassigned
    }
  }
`

const AGENT_SUPPORT_TICKETS_QUERY = gql`
  query AgentSupportTickets($input: AgentSupportTicketsInput) {
    agentSupportTickets(input: $input) {
      total
      page
      limit
      totalPages

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
        lastMessageAt
        lastCustomerMessageAt
        lastAgentMessageAt
        customerUnreadCount
        agentUnreadCount

        user {
          id
          fullName
          firstName
          lastName
          email
          phoneNumber
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
        }
      }
    }
  }
`

const AGENT_SUPPORT_TICKET_QUERY = gql`
  query AgentSupportTicket($id: ID!) {
    agentSupportTicket(id: $id) {
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
      agentUnreadCount
      customerUnreadCount

      user {
        id
        fullName
        firstName
        lastName
        email
        phoneNumber
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
      }

      messages {
        id
        createdAt
        senderType
        message
        readByAgentAt
        readByCustomerAt

        senderUser {
          id
          fullName
          firstName
          lastName
          email
        }

        senderAdminUser {
          id
          firstName
          lastName
          email
        }

        attachments {
          id
          fileName
          url
          contentType
          size
        }
      }

      notes {
        id
        note
        createdAt

        adminUser {
          id
          firstName
          lastName
          email
        }
      }

      activities {
        id
        type
        description
        createdAt
        metadata
      }
    }
  }
`

const SEND_AGENT_SUPPORT_MESSAGE_MUTATION = gql`
  mutation SendAgentSupportMessage($ticketId: ID!, $input: SendSupportTicketMessageInput!) {
    sendAgentSupportMessage(ticketId: $ticketId, input: $input) {
      id
      createdAt
      senderType
      message
      readByAgentAt
      readByCustomerAt

      senderAdminUser {
        id
        firstName
        lastName
        email
      }

      attachments {
        id
        fileName
        url
        contentType
        size
      }
    }
  }
`

const UPDATE_SUPPORT_TICKET_MUTATION = gql`
  mutation UpdateSupportTicket($id: ID!, $input: UpdateSupportTicketInput!) {
    updateSupportTicket(id: $id, input: $input) {
      id
      status
      priority
      resolvedAt
      closedAt
      updatedAt
    }
  }
`

const MARK_SUPPORT_TICKET_READ_MUTATION = gql`
  mutation MarkSupportTicketReadByAgent($ticketId: ID!) {
    markSupportTicketReadByAgent(ticketId: $ticketId) {
      id
      agentUnreadCount
    }
  }
`

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

type TicketCategory =
  | 'RENTAL_SUPPORT'
  | 'EQUIPMENT_ISSUE'
  | 'DELIVERY'
  | 'EXTENSION'
  | 'RETURN'
  | 'BILLING'
  | 'OTHER'

type SupportPersonnel = {
  id: number
  firstName?: string | null
  lastName?: string | null
  email: string
}

type TicketUser = {
  id: string
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
  email: string
  phoneNumber?: string | null
}

type TicketItem = {
  id: string
  name: string
  imageUrl?: string | null
}

type SupportTicketAttachment = {
  id: string
  fileName: string
  url: string
  contentType?: string | null
  size?: number | null
}

type SupportTicketMessage = {
  id: string
  createdAt: string
  senderType: 'CUSTOMER' | 'SUPPORT_AGENT' | 'SYSTEM'
  message: string
  readByAgentAt?: string | null
  readByCustomerAt?: string | null
  senderUser?: TicketUser | null
  senderAdminUser?: SupportPersonnel | null
  attachments?: SupportTicketAttachment[]
}

type SupportTicket = {
  id: string
  createdAt: string
  updatedAt: string
  subject: string
  message: string
  category: TicketCategory
  status: TicketStatus
  priority: TicketPriority
  assignedAt?: string | null
  resolvedAt?: string | null
  closedAt?: string | null
  lastMessageAt?: string | null
  lastCustomerMessageAt?: string | null
  lastAgentMessageAt?: string | null
  customerUnreadCount: number
  agentUnreadCount: number
  user?: TicketUser | null
  rental?: {
    id: string
    item?: TicketItem | null
  } | null
  item?: TicketItem | null
  assignedToAdminUser?: SupportPersonnel | null
  messages?: SupportTicketMessage[]
}

type DashboardData = {
  supportAgentDashboard: {
    totalAssigned: number
    open: number
    inProgress: number
    resolvedToday: number
    unread: number
    unassigned: number
  }
}

type TicketsData = {
  agentSupportTickets: {
    tickets: SupportTicket[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

type TicketDetailsData = {
  agentSupportTicket: SupportTicket
}

const PAGE_LIMIT = 10

function formatDate(value?: string | null): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function formatRelativeDate(value?: string | null): string {
  if (!value) {
    return 'No recent activity'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'No recent activity'
  }

  const difference = Date.now() - date.getTime()
  const minutes = Math.floor(difference / 60_000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) {
    return 'Just now'
  }

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  if (days < 7) {
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  return formatDate(value)
}

function getUserName(user?: TicketUser | null): string {
  if (!user) {
    return 'Unknown customer'
  }

  const fullName = user.fullName?.trim()

  if (fullName) {
    return fullName
  }

  const name = [user.firstName?.trim(), user.lastName?.trim()].filter(Boolean).join(' ')

  return name || user.email
}

function getAdminName(user?: SupportPersonnel | null): string {
  if (!user) {
    return 'Unassigned'
  }

  const name = [user.firstName?.trim(), user.lastName?.trim()].filter(Boolean).join(' ')

  return name || user.email
}

function humanise(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function statusColour(status: TicketStatus): string {
  switch (status) {
    case 'OPEN':
      return 'orange'
    case 'IN_PROGRESS':
      return 'blue'
    case 'RESOLVED':
      return 'green'
    case 'CLOSED':
      return 'gray'
    default:
      return 'gray'
  }
}

function priorityColour(priority: TicketPriority): string {
  switch (priority) {
    case 'URGENT':
      return 'red'
    case 'HIGH':
      return 'orange'
    case 'NORMAL':
      return 'blue'
    case 'LOW':
      return 'gray'
    default:
      return 'gray'
  }
}

function formatAttachmentSize(size?: number | null): string {
  if (!size || size <= 0) {
    return 'Unknown size'
  }

  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function isImageAttachment(attachment: SupportTicketAttachment): boolean {
  return Boolean(attachment.contentType?.trim().toLowerCase().startsWith('image/'))
}

function isPdfAttachment(attachment: SupportTicketAttachment): boolean {
  return attachment.contentType?.trim().toLowerCase() === 'application/pdf'
}

type MessageAttachmentsProps = {
  attachments?: SupportTicketAttachment[]
  isAgent: boolean
}

function MessageAttachments({ attachments = [], isAgent }: MessageAttachmentsProps) {
  if (attachments.length === 0) {
    return null
  }

  return (
    <VStack mt={3} spacing={2} align="stretch">
      <HStack spacing={1.5} color={isAgent ? 'whiteAlpha.800' : 'gray.500'}>
        <Paperclip size={13} />

        <Text fontSize="11px" fontWeight="semibold">
          {attachments.length} attachment{attachments.length === 1 ? '' : 's'}
        </Text>
      </HStack>

      {attachments.map((attachment) => {
        const isImage = isImageAttachment(attachment)
        const isPdf = isPdfAttachment(attachment)

        return (
          <Box
            key={attachment.id}
            overflow="hidden"
            borderWidth="1px"
            borderColor={isAgent ? 'whiteAlpha.400' : 'gray.200'}
            borderRadius="lg"
            bg={isAgent ? 'whiteAlpha.200' : 'white'}
          >
            {isImage ? (
              <Box
                as="a"
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                display="block"
              >
                <Box
                  as="img"
                  src={attachment.url}
                  alt={attachment.fileName}
                  display="block"
                  width="100%"
                  maxH="240px"
                  objectFit="cover"
                  bg="gray.100"
                  cursor="pointer"
                />
              </Box>
            ) : null}

            <Flex align="center" gap={3} p={3}>
              <Flex
                align="center"
                justify="center"
                boxSize="38px"
                flexShrink={0}
                borderRadius="md"
                bg={isAgent ? 'whiteAlpha.300' : isPdf ? 'red.50' : 'blue.50'}
                color={isAgent ? 'white' : isPdf ? 'red.500' : 'blue.500'}
              >
                {isImage ? <ImageIcon size={18} /> : <FileText size={18} />}
              </Flex>

              <Box flex={1} minW={0}>
                <Text
                  fontSize="12px"
                  fontWeight="semibold"
                  color={isAgent ? 'white' : 'gray.700'}
                  noOfLines={1}
                  title={attachment.fileName}
                >
                  {attachment.fileName}
                </Text>

                <Text
                  mt={0.5}
                  fontSize="10px"
                  color={isAgent ? 'whiteAlpha.700' : 'gray.500'}
                >
                  {formatAttachmentSize(attachment.size)}
                </Text>
              </Box>

              <HStack spacing={1}>
                <Button
                  as="a"
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  variant={isAgent ? 'outline' : 'ghost'}
                  color={isAgent ? 'white' : 'blue.600'}
                  borderColor={isAgent ? 'whiteAlpha.500' : undefined}
                  leftIcon={<ExternalLink size={13} />}
                  _hover={{
                    bg: isAgent ? 'whiteAlpha.300' : 'blue.50'
                  }}
                >
                  View
                </Button>

                <Button
                  as="a"
                  href={attachment.url}
                  download={attachment.fileName}
                  size="xs"
                  variant="ghost"
                  color={isAgent ? 'white' : 'gray.600'}
                  px={2}
                  aria-label={`Download ${attachment.fileName}`}
                  _hover={{
                    bg: isAgent ? 'whiteAlpha.300' : 'gray.100'
                  }}
                >
                  <Download size={14} />
                </Button>
              </HStack>
            </Flex>
          </Box>
        )
      })}
    </VStack>
  )
}

type MetricCardProps = {
  label: string
  value: number
  icon: typeof Ticket
  helper: string
  loading?: boolean
}

function MetricCard({ label, value, icon, helper, loading }: MetricCardProps) {
  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={5} boxShadow="sm">
      <Flex align="flex-start" justify="space-between" gap={4}>
        <Stat>
          <StatLabel color="gray.500" fontSize="sm" fontWeight="medium">
            {label}
          </StatLabel>

          <Skeleton isLoaded={!loading} display="inline-block" mt={1}>
            <StatNumber fontSize="2xl" color="gray.800">
              {value}
            </StatNumber>
          </Skeleton>

          <Text mt={1} color="gray.500" fontSize="xs">
            {helper}
          </Text>
        </Stat>

        <Flex
          align="center"
          justify="center"
          w="42px"
          h="42px"
          borderRadius="lg"
          bg="blue.50"
          color="blue.600"
          flexShrink={0}
        >
          <Icon as={icon} boxSize={5} />
        </Flex>
      </Flex>
    </Box>
  )
}

type TicketRowProps = {
  ticket: SupportTicket
  selected: boolean
  onClick: () => void
}

function TicketRow({ ticket, selected, onClick }: TicketRowProps) {
  const equipment = ticket.rental?.item ?? ticket.item

  return (
    <Box
      as="button"
      type="button"
      w="full"
      textAlign="left"
      p={4}
      bg={selected ? 'blue.50' : 'white'}
      borderBottomWidth="1px"
      borderColor="gray.100"
      borderLeftWidth="3px"
      borderLeftColor={selected ? 'blue.500' : 'transparent'}
      transition="all 0.2s"
      _hover={{
        bg: selected ? 'blue.50' : 'gray.50'
      }}
      onClick={onClick}
    >
      <Flex justify="space-between" align="flex-start" gap={3}>
        <HStack align="flex-start" spacing={3} minW={0}>
          <Box position="relative">
            <Avatar
              size="sm"
              name={getUserName(ticket.user)}
              src={equipment?.imageUrl ?? undefined}
            />

            {ticket.agentUnreadCount > 0 && (
              <Flex
                position="absolute"
                top="-5px"
                right="-7px"
                align="center"
                justify="center"
                minW="18px"
                h="18px"
                px={1}
                borderRadius="full"
                bg="red.500"
                color="white"
                fontSize="10px"
                fontWeight="bold"
              >
                {ticket.agentUnreadCount}
              </Flex>
            )}
          </Box>

          <Box minW={0}>
            <Text fontWeight="semibold" color="gray.800" noOfLines={1}>
              {ticket.subject}
            </Text>

            <Text mt={0.5} fontSize="sm" color="gray.600" noOfLines={1}>
              {getUserName(ticket.user)}
            </Text>

            <Text mt={1} color="gray.500" fontSize="xs" noOfLines={1}>
              {equipment?.name ?? humanise(ticket.category)}
            </Text>
          </Box>
        </HStack>

        <Text flexShrink={0} fontSize="xs" color="gray.500">
          {formatRelativeDate(ticket.lastMessageAt ?? ticket.updatedAt)}
        </Text>
      </Flex>

      <HStack mt={3} spacing={2} flexWrap="wrap">
        <Badge colorScheme={statusColour(ticket.status)} borderRadius="full" px={2} py={0.5}>
          {humanise(ticket.status)}
        </Badge>

        <Badge
          colorScheme={priorityColour(ticket.priority)}
          variant="subtle"
          borderRadius="full"
          px={2}
          py={0.5}
        >
          {humanise(ticket.priority)}
        </Badge>
      </HStack>
    </Box>
  )
}

export default function SupportAgentDashboard() {
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState<TicketStatus | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 400)

    return () => window.clearTimeout(timeout)
  }, [search])

  const {
    data: dashboardData,
    loading: dashboardLoading,
    refetch: refetchDashboard
  } = useQuery<DashboardData>(SUPPORT_AGENT_DASHBOARD_QUERY, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 10_000
  })

  const ticketVariables = useMemo(
    () => ({
      input: {
        page,
        limit: PAGE_LIMIT,
        ...(debouncedSearch
          ? {
              search: debouncedSearch
            }
          : {}),
        ...(status
          ? {
              status
            }
          : {}),
        ...(priority
          ? {
              priority
            }
          : {}),
        ...(unreadOnly
          ? {
              unreadOnly: true
            }
          : {})
      }
    }),
    [debouncedSearch, page, priority, status, unreadOnly]
  )

  const {
    data: ticketsData,
    loading: ticketsLoading,
    refetch: refetchTickets
  } = useQuery<TicketsData>(AGENT_SUPPORT_TICKETS_QUERY, {
    variables: ticketVariables,
    fetchPolicy: 'cache-and-network',
    pollInterval: 8_000
  })

  const {
    data: selectedTicketData,
    loading: selectedTicketLoading,
    refetch: refetchSelectedTicket
  } = useQuery<TicketDetailsData>(AGENT_SUPPORT_TICKET_QUERY, {
    variables: {
      id: selectedTicketId ?? ''
    },
    skip: !selectedTicketId,
    fetchPolicy: 'cache-and-network',
    pollInterval: selectedTicketId ? 5_000 : 0
  })

  const [sendMessage, { loading: sending }] = useMutation(SEND_AGENT_SUPPORT_MESSAGE_MUTATION)

  const [updateTicket] = useMutation(UPDATE_SUPPORT_TICKET_MUTATION)

  const [markTicketRead] = useMutation(MARK_SUPPORT_TICKET_READ_MUTATION)

  const tickets = ticketsData?.agentSupportTickets.tickets ?? []

  const pagination = ticketsData?.agentSupportTickets

  const selectedTicket = selectedTicketData?.agentSupportTicket

  const dashboard = dashboardData?.supportAgentDashboard

  useEffect(() => {
    if (!selectedTicketId && tickets.length > 0) {
      setSelectedTicketId(tickets[0].id)
    }
  }, [selectedTicketId, tickets])

  useEffect(() => {
    if (!selectedTicketId || !selectedTicket || selectedTicket.agentUnreadCount < 1) {
      return
    }

    void markTicketRead({
      variables: {
        ticketId: selectedTicketId
      }
    })
      .then(() => Promise.all([refetchTickets(), refetchDashboard()]))
      .catch(() => {
        // Polling will retry later.
      })
  }, [markTicketRead, refetchDashboard, refetchTickets, selectedTicket, selectedTicketId])

  async function refreshAll() {
    try {
      await Promise.all([
        refetchDashboard(),
        refetchTickets(),
        selectedTicketId ? refetchSelectedTicket() : Promise.resolve()
      ])

      toast({
        title: 'Dashboard refreshed',
        status: 'success',
        duration: 2000,
        isClosable: true
      })
    } catch {
      toast({
        title: 'Unable to refresh dashboard',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  async function handleSendMessage(event: FormEvent) {
    event.preventDefault()

    const message = reply.trim()

    if (!selectedTicketId || !message) {
      return
    }

    try {
      await sendMessage({
        variables: {
          ticketId: selectedTicketId,
          input: {
            message,
            attachments: []
          }
        }
      })

      setReply('')

      await Promise.all([refetchSelectedTicket(), refetchTickets(), refetchDashboard()])

      toast({
        title: 'Reply sent',
        status: 'success',
        duration: 2500,
        isClosable: true
      })
    } catch (error) {
      toast({
        title: 'Unable to send reply',
        description: error instanceof Error ? error.message : 'Please try again.',
        status: 'error',
        duration: 4000,
        isClosable: true
      })
    }
  }

  async function handleStatusChange(nextStatus: TicketStatus) {
    if (!selectedTicketId) {
      return
    }

    setUpdatingStatus(nextStatus)

    try {
      await updateTicket({
        variables: {
          id: selectedTicketId,
          input: {
            status: nextStatus
          }
        }
      })

      await Promise.all([refetchSelectedTicket(), refetchTickets(), refetchDashboard()])

      toast({
        title: `Ticket marked as ${humanise(nextStatus)}`,
        status: 'success',
        duration: 2500,
        isClosable: true
      })
    } catch (error) {
      toast({
        title: 'Unable to update ticket',
        description: error instanceof Error ? error.message : 'Please try again.',
        status: 'error',
        duration: 4000,
        isClosable: true
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  return (
    <Box
      minH="100vh"
      bg="gray.50"
      px={{
        base: 4,
        md: 6,
        xl: 8
      }}
      py={6}
    >
      <Flex
        align={{
          base: 'flex-start',
          md: 'center'
        }}
        justify="space-between"
        direction={{
          base: 'column',
          md: 'row'
        }}
        gap={4}
        mb={6}
      >
        <Box>
          <Text
            fontSize={{
              base: '2xl',
              md: '3xl'
            }}
            fontWeight="bold"
            color="gray.800"
          >
            Support Agent Dashboard
          </Text>

          <Text mt={1} color="gray.500">
            Manage assigned tickets and respond to customers.
          </Text>
        </Box>

        <Button
          leftIcon={<RefreshCw size={17} />}
          variant="outline"
          bg="white"
          onClick={() => void refreshAll()}
        >
          Refresh
        </Button>
      </Flex>

      <SimpleGrid
        columns={{
          base: 1,
          sm: 2,
          xl: 5
        }}
        spacing={4}
        mb={6}
      >
        <MetricCard
          label="Assigned to Me"
          value={dashboard?.totalAssigned ?? 0}
          helper="All tickets assigned to you"
          icon={Ticket}
          loading={dashboardLoading}
        />

        <MetricCard
          label="Open"
          value={dashboard?.open ?? 0}
          helper="Awaiting attention"
          icon={Inbox}
          loading={dashboardLoading}
        />

        <MetricCard
          label="In Progress"
          value={dashboard?.inProgress ?? 0}
          helper="Currently being handled"
          icon={Clock3}
          loading={dashboardLoading}
        />

        <MetricCard
          label="Unread"
          value={dashboard?.unread ?? 0}
          helper="New customer messages"
          icon={MessageCircle}
          loading={dashboardLoading}
        />

        <MetricCard
          label="Resolved Today"
          value={dashboard?.resolvedToday ?? 0}
          helper="Completed since midnight"
          icon={CheckCircle2}
          loading={dashboardLoading}
        />
      </SimpleGrid>

      <Box
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        p={4}
        mb={5}
        boxShadow="sm"
      >
        <Flex
          gap={3}
          direction={{
            base: 'column',
            lg: 'row'
          }}
        >
          <InputGroup flex={1}>
            <InputLeftElement pointerEvents="none">
              <Search size={17} color="#718096" />
            </InputLeftElement>

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ticket, customer or equipment"
              bg="white"
            />
          </InputGroup>

          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
            maxW={{
              base: 'full',
              lg: '210px'
            }}
          >
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </Select>

          <Select
            value={priority}
            onChange={(event) => {
              setPriority(event.target.value)
              setPage(1)
            }}
            maxW={{
              base: 'full',
              lg: '190px'
            }}
          >
            <option value="">All priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </Select>

          <Button
            variant={unreadOnly ? 'solid' : 'outline'}
            colorScheme={unreadOnly ? 'blue' : 'gray'}
            leftIcon={<MessageCircle size={17} />}
            onClick={() => {
              setUnreadOnly((current) => !current)
              setPage(1)
            }}
          >
            Unread only
          </Button>
        </Flex>
      </Box>

      <Grid
        templateColumns={{
          base: '1fr',
          xl: '390px minmax(0, 1fr)'
        }}
        gap={5}
        alignItems="stretch"
      >
        <GridItem>
          <Box
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="xl"
            overflow="hidden"
            boxShadow="sm"
          >
            <Flex
              px={4}
              py={3}
              justify="space-between"
              align="center"
              borderBottomWidth="1px"
              borderColor="gray.200"
            >
              <Box>
                <Text fontWeight="semibold" color="gray.800">
                  My Tickets
                </Text>

                <Text color="gray.500" fontSize="xs">
                  {pagination?.total ?? 0} ticket
                  {(pagination?.total ?? 0) === 1 ? '' : 's'}
                </Text>
              </Box>

              {ticketsLoading && <Spinner size="sm" color="blue.500" />}
            </Flex>

            <Box
              maxH={{
                base: '520px',
                xl: '710px'
              }}
              overflowY="auto"
            >
              {ticketsLoading && tickets.length === 0 ? (
                <VStack p={4} spacing={3}>
                  {Array.from({
                    length: 5
                  }).map((_, index) => (
                    <Skeleton key={index} w="full" h="100px" borderRadius="lg" />
                  ))}
                </VStack>
              ) : tickets.length === 0 ? (
                <VStack py={16} px={6} spacing={3}>
                  <Flex
                    align="center"
                    justify="center"
                    w="56px"
                    h="56px"
                    bg="gray.100"
                    borderRadius="full"
                  >
                    <Inbox size={25} color="#718096" />
                  </Flex>

                  <Text fontWeight="semibold" color="gray.700">
                    No tickets found
                  </Text>

                  <Text textAlign="center" color="gray.500" fontSize="sm">
                    No assigned tickets match your current filters.
                  </Text>
                </VStack>
              ) : (
                tickets.map((ticket) => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    selected={selectedTicketId === ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                  />
                ))
              )}
            </Box>

            <Flex
              px={4}
              py={3}
              align="center"
              justify="space-between"
              borderTopWidth="1px"
              borderColor="gray.200"
            >
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<ChevronLeft size={16} />}
                isDisabled={page <= 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
              >
                Previous
              </Button>

              <Text fontSize="sm" color="gray.600">
                Page {pagination?.page ?? page} of {pagination?.totalPages ?? 1}
              </Text>

              <Button
                size="sm"
                variant="ghost"
                rightIcon={<ChevronRight size={16} />}
                isDisabled={page >= (pagination?.totalPages ?? 1)}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </Flex>
          </Box>
        </GridItem>

        <GridItem minW={0}>
          <Box
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="xl"
            boxShadow="sm"
            overflow="hidden"
            minH="710px"
          >
            {!selectedTicketId ? (
              <VStack minH="710px" justify="center" spacing={3} px={6}>
                <Flex
                  align="center"
                  justify="center"
                  w="64px"
                  h="64px"
                  bg="blue.50"
                  borderRadius="full"
                  color="blue.500"
                >
                  <MessageCircle size={28} />
                </Flex>

                <Text fontWeight="semibold" color="gray.700">
                  Select a support ticket
                </Text>

                <Text color="gray.500" fontSize="sm" textAlign="center">
                  Select a ticket to view the conversation and customer details.
                </Text>
              </VStack>
            ) : selectedTicketLoading && !selectedTicket ? (
              <VStack p={6} align="stretch" spacing={4}>
                <Skeleton h="40px" />
                <Skeleton h="85px" />
                <Skeleton h="360px" />
                <Skeleton h="100px" />
              </VStack>
            ) : selectedTicket ? (
              <Flex direction="column" minH="710px">
                <Box
                  px={{
                    base: 4,
                    md: 6
                  }}
                  py={4}
                  borderBottomWidth="1px"
                  borderColor="gray.200"
                >
                  <Flex
                    justify="space-between"
                    align={{
                      base: 'flex-start',
                      md: 'center'
                    }}
                    direction={{
                      base: 'column',
                      md: 'row'
                    }}
                    gap={4}
                  >
                    <Box minW={0}>
                      <HStack spacing={2} mb={1} flexWrap="wrap">
                        <Badge
                          colorScheme={statusColour(selectedTicket.status)}
                          borderRadius="full"
                          px={2}
                        >
                          {humanise(selectedTicket.status)}
                        </Badge>

                        <Badge
                          colorScheme={priorityColour(selectedTicket.priority)}
                          variant="subtle"
                          borderRadius="full"
                          px={2}
                        >
                          {humanise(selectedTicket.priority)}
                        </Badge>

                        <Text color="gray.400" fontSize="xs">
                          #{selectedTicket.id.slice(-8)}
                        </Text>
                      </HStack>

                      <Text fontSize="xl" fontWeight="bold" color="gray.800" noOfLines={2}>
                        {selectedTicket.subject}
                      </Text>

                      <Text mt={1} color="gray.500" fontSize="sm">
                        Created {formatDate(selectedTicket.createdAt)}
                      </Text>
                    </Box>

                    <HStack spacing={2} flexWrap="wrap">
                      {selectedTicket.status !== 'IN_PROGRESS' &&
                        selectedTicket.status !== 'CLOSED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="blue"
                            isLoading={updatingStatus === 'IN_PROGRESS'}
                            onClick={() => void handleStatusChange('IN_PROGRESS')}
                          >
                            Start progress
                          </Button>
                        )}

                      {selectedTicket.status !== 'RESOLVED' &&
                        selectedTicket.status !== 'CLOSED' && (
                          <Button
                            size="sm"
                            colorScheme="green"
                            leftIcon={<CheckCircle2 size={16} />}
                            isLoading={updatingStatus === 'RESOLVED'}
                            onClick={() => void handleStatusChange('RESOLVED')}
                          >
                            Resolve
                          </Button>
                        )}

                      {(selectedTicket.status === 'RESOLVED' ||
                        selectedTicket.status === 'CLOSED') && (
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="orange"
                          isLoading={updatingStatus === 'OPEN'}
                          onClick={() => void handleStatusChange('OPEN')}
                        >
                          Reopen
                        </Button>
                      )}
                    </HStack>
                  </Flex>
                </Box>

                <SimpleGrid
                  columns={{
                    base: 1,
                    md: 3
                  }}
                  spacing={4}
                  px={{
                    base: 4,
                    md: 6
                  }}
                  py={4}
                  bg="gray.50"
                  borderBottomWidth="1px"
                  borderColor="gray.200"
                >
                  <HStack spacing={3}>
                    <Avatar size="sm" name={getUserName(selectedTicket.user)} />

                    <Box minW={0}>
                      <Text fontSize="xs" color="gray.500">
                        Customer
                      </Text>

                      <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                        {getUserName(selectedTicket.user)}
                      </Text>

                      <Text fontSize="xs" color="gray.500" noOfLines={1}>
                        {selectedTicket.user?.email ?? 'No email'}
                      </Text>
                    </Box>
                  </HStack>

                  {/* <HStack spacing={3}>
                    <Flex
                      align="center"
                      justify="center"
                      w="36px"
                      h="36px"
                      borderRadius="full"
                      bg="blue.100"
                      color="blue.600"
                    >
                      <UserRound size={17} />
                    </Flex>

                    <Box minW={0}>
                      <Text fontSize="xs" color="gray.500">
                        Assigned agent
                      </Text>

                      <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                        {getAdminName(selectedTicket.assignedToAdminUser)}
                      </Text>
                    </Box>
                  </HStack> */}

                  <HStack spacing={3}>
                    <Flex
                      align="center"
                      justify="center"
                      w="36px"
                      h="36px"
                      borderRadius="full"
                      bg="orange.100"
                      color="orange.600"
                    >
                      <AlertCircle size={17} />
                    </Flex>

                    <Box minW={0}>
                      <Text fontSize="xs" color="gray.500">
                        Category
                      </Text>

                      <Text fontSize="sm" fontWeight="semibold">
                        {humanise(selectedTicket.category)}
                      </Text>
                    </Box>
                  </HStack>
                </SimpleGrid>

                <VStack
                  flex={1}
                  align="stretch"
                  spacing={4}
                  px={{
                    base: 4,
                    md: 6
                  }}
                  py={5}
                  maxH="430px"
                  overflowY="auto"
                  bg="white"
                >
                  {(selectedTicket.messages ?? []).length === 0 ? (
                    <Box bg="gray.50" borderRadius="lg" p={4}>
                      <Text fontSize="sm" color="gray.700">
                        {selectedTicket.message}
                      </Text>
                    </Box>
                  ) : (
                    selectedTicket.messages?.map((message) => {
                      const isAgent = message.senderType === 'SUPPORT_AGENT'

                      return (
                        <Flex key={message.id} justify={isAgent ? 'flex-end' : 'flex-start'}>
                          <Box
                            maxW={{
                              base: '90%',
                              md: '72%'
                            }}
                          >
                            <Text
                              mb={1}
                              fontSize="xs"
                              color="gray.500"
                              textAlign={isAgent ? 'right' : 'left'}
                            >
                              {isAgent
                                ? getAdminName(message.senderAdminUser)
                                : getUserName(message.senderUser)}
                            </Text>

                            <Box
                              px={4}
                              py={3}
                              borderRadius="xl"
                              borderTopRightRadius={isAgent ? 'sm' : 'xl'}
                              borderTopLeftRadius={isAgent ? 'xl' : 'sm'}
                              bg={isAgent ? 'blue.500' : 'gray.100'}
                              color={isAgent ? 'white' : 'gray.800'}
                            >
                              <Text whiteSpace="pre-wrap" fontSize="sm">
                                {message.message}
                              </Text>

                              <MessageAttachments
                                attachments={message.attachments}
                                isAgent={isAgent}
                              />
                            </Box>

                            <Text
                              mt={1}
                              fontSize="10px"
                              color="gray.400"
                              textAlign={isAgent ? 'right' : 'left'}
                            >
                              {formatDate(message.createdAt)}
                              {isAgent && message.readByCustomerAt && ' • Read'}
                            </Text>
                          </Box>
                        </Flex>
                      )
                    })
                  )}
                </VStack>

                <Divider />

                <Box
                  as="form"
                  px={{
                    base: 4,
                    md: 6
                  }}
                  py={4}
                  onSubmit={handleSendMessage}
                >
                  <FormControl>
                    <FormLabel fontSize="sm" color="gray.700">
                      Reply to customer
                    </FormLabel>

                    <Textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder={
                        selectedTicket.status === 'CLOSED'
                          ? 'Reopen this ticket before replying.'
                          : 'Type your response...'
                      }
                      minH="90px"
                      resize="vertical"
                      isDisabled={selectedTicket.status === 'CLOSED'}
                    />
                  </FormControl>

                  <Flex mt={3} justify="space-between" align="center" gap={3}>
                    <Text fontSize="xs" color={reply.length > 3000 ? 'red.500' : 'gray.500'}>
                      {reply.length}/3000 characters
                    </Text>

                    <Button
                      type="submit"
                      colorScheme="blue"
                      leftIcon={<Send size={16} />}
                      isLoading={sending}
                      isDisabled={
                        !reply.trim() || reply.length > 3000 || selectedTicket.status === 'CLOSED'
                      }
                    >
                      Send reply
                    </Button>
                  </Flex>
                </Box>
              </Flex>
            ) : null}
          </Box>
        </GridItem>
      </Grid>
    </Box>
  )
}