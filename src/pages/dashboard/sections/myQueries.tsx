import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Progress,
  Select,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Spinner,
  Text,
  Textarea,
  useToast,
  VStack
} from '@chakra-ui/react'
import { gql, useMutation, useQuery } from '@apollo/client'
import {
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
  Trash2,
  UploadCloud
} from 'lucide-react'
import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'

const MY_SUPPORT_TICKETS_QUERY = gql`
  query MySupportTickets($input: SupportTicketPaginationInput) {
    mySupportTickets(input: $input) {
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
        lastMessageAt
        lastCustomerMessageAt
        lastAgentMessageAt
        customerUnreadCount
        agentUnreadCount

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

const CUSTOMER_SUPPORT_TICKET_QUERY = gql`
  query CustomerSupportTicket($id: ID!) {
    customerSupportTicket(id: $id) {
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
          objectKey
          url
          contentType
          size
        }
      }
    }
  }
`

const SEND_CUSTOMER_SUPPORT_MESSAGE_MUTATION = gql`
  mutation SendCustomerSupportMessage($ticketId: ID!, $input: SendSupportTicketMessageInput!) {
    sendCustomerSupportMessage(ticketId: $ticketId, input: $input) {
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

      attachments {
        id
        fileName
        objectKey
        url
        contentType
        size
      }
    }
  }
`

const MARK_SUPPORT_TICKET_READ_BY_CUSTOMER_MUTATION = gql`
  mutation MarkSupportTicketReadByCustomer($ticketId: ID!) {
    markSupportTicketReadByCustomer(ticketId: $ticketId) {
      id
      customerUnreadCount
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
}

type TicketItem = {
  id: string
  name: string
  imageUrl?: string | null
}

type SupportAttachment = {
  id?: string
  fileName: string
  objectKey: string
  url: string
  contentType?: string | null
  size?: number | null
}

type SupportMessage = {
  id: string
  createdAt: string
  senderType: 'CUSTOMER' | 'SUPPORT_AGENT' | 'SYSTEM'
  message: string
  readByAgentAt?: string | null
  readByCustomerAt?: string | null
  senderUser?: TicketUser | null
  senderAdminUser?: SupportPersonnel | null
  attachments: SupportAttachment[]
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
  rental?: {
    id: string
    item?: TicketItem | null
  } | null
  item?: TicketItem | null
  assignedToAdminUser?: SupportPersonnel | null
  messages?: SupportMessage[]
}

type TicketsData = {
  mySupportTickets: {
    tickets: SupportTicket[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

type TicketDetailsData = {
  customerSupportTicket: SupportTicket
}

type TicketDetailsVariables = {
  id: string
}

type UploadedFileRecord = {
  id?: string | number
  name?: string | null
  size?: number | null
  type?: string | null
  objectKey: string
  url: string
}

type UploadResponse = {
  success: boolean
  files: UploadedFileRecord[]
}

const PAGE_LIMIT = 10
const MAX_ATTACHMENTS = 10
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024

const ALLOWED_ATTACHMENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
])

function humanise(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
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

  const milliseconds = Date.now() - date.getTime()
  const minutes = Math.floor(milliseconds / 60_000)
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

function formatFileSize(size?: number | null): string {
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

function getAgentName(agent?: SupportPersonnel | null): string {
  if (!agent) {
    return 'Support team'
  }

  const name = [agent.firstName?.trim(), agent.lastName?.trim()].filter(Boolean).join(' ')

  return name || agent.email
}

function isImageAttachment(attachment: SupportAttachment): boolean {
  return Boolean(attachment.contentType?.trim().toLowerCase().startsWith('image/'))
}

function getApiBaseUrl(): string {
  return String(
    import.meta.env.VITE_APP_API_HOST ??
      import.meta.env.VITE_API_URL ??
      import.meta.env.VITE_BACKEND_URL ??
      ''
  ).replace(/\/+$/, '')
}

function normaliseToken(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  const token = value.trim().replace(/^Bearer\s+/i, '')

  return token || null
}

function readAccessToken(): string | null {
  const portalValue = localStorage.getItem('MFS_PORTAL')

  if (portalValue) {
    try {
      const parsed = JSON.parse(portalValue) as {
        jwt?: string
        token?: string
        accessToken?: string
        user?: {
          jwt?: string
          token?: string
          accessToken?: string
        }
      }

      const token = normaliseToken(
        parsed.jwt ??
          parsed.accessToken ??
          parsed.token ??
          parsed.user?.jwt ??
          parsed.user?.accessToken ??
          parsed.user?.token
      )

      if (token) {
        return token
      }
    } catch {
      const rawToken = normaliseToken(portalValue)

      if (rawToken?.split('.').length === 3) {
        return rawToken
      }
    }
  }

  for (const key of ['accessToken', 'token', 'authToken', 'userToken', 'jwt']) {
    const token = normaliseToken(localStorage.getItem(key))

    if (token) {
      return token
    }
  }

  return null
}

function validateFiles(files: File[], existingCount: number): string | null {
  if (existingCount + files.length > MAX_ATTACHMENTS) {
    return `A maximum of ${MAX_ATTACHMENTS} attachments is allowed.`
  }

  for (const file of files) {
    const mimeType = file.type.trim().toLowerCase()

    if (!ALLOWED_ATTACHMENT_TYPES.has(mimeType)) {
      return `${file.name} is not supported. Upload PDF, JPG, PNG or WebP files.`
    }

    if (file.size <= 0) {
      return `${file.name} is empty.`
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      return `${file.name} exceeds the 10 MB limit.`
    }
  }

  return null
}

async function uploadFiles(files: File[]): Promise<SupportAttachment[]> {
  const token = readAccessToken()

  if (!token) {
    throw new Error('Authentication token was not found. Please sign in again.')
  }

  const formData = new FormData()

  files.forEach((file) => {
    formData.append('files', file, file.name)
  })

  formData.append('folder', 'support-ticket-attachments')

  const response = await fetch(`${getApiBaseUrl()}/files/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    credentials: 'include',
    body: formData
  })

  const responseText = await response.text()

  let payload: UploadResponse | { message?: string; error?: string }

  try {
    payload = responseText ? JSON.parse(responseText) : {}
  } catch {
    throw new Error(responseText || 'The upload service returned an invalid response.')
  }

  if (!response.ok) {
    const failure = payload as {
      message?: string
      error?: string
    }

    throw new Error(
      failure.message ?? failure.error ?? `Attachment upload failed with status ${response.status}.`
    )
  }

  const result = payload as UploadResponse

  if (!result.success || !Array.isArray(result.files)) {
    throw new Error('The upload service did not return uploaded files.')
  }

  return result.files.map((file) => ({
    fileName: file.name?.trim() || 'attachment',
    objectKey: file.objectKey,
    url: file.url,
    contentType: file.type?.trim() || null,
    size: file.size ?? null
  }))
}

function TicketStatusProgress({ status }: { status: TicketStatus }) {
  const stages = [
    {
      key: 'OPEN',
      label: 'Open',
      helper: 'Your request was submitted.'
    },
    {
      key: 'IN_PROGRESS',
      label: 'In progress',
      helper: 'A support agent is working on it.'
    },
    {
      key: 'RESOLVED',
      label: 'Resolved',
      helper: 'The issue has been resolved.'
    }
  ] as const

  const currentIndex = status === 'OPEN' ? 0 : status === 'IN_PROGRESS' ? 1 : 2

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
      {stages.map((stage, index) => {
        const complete = index <= currentIndex
        const active = index === currentIndex

        return (
          <Box
            key={stage.key}
            p={3}
            borderWidth="1px"
            borderColor={active ? 'blue.300' : complete ? 'green.200' : 'gray.200'}
            borderRadius="lg"
            bg={active ? 'blue.50' : complete ? 'green.50' : 'white'}
          >
            <HStack align="flex-start" spacing={3}>
              <Flex
                align="center"
                justify="center"
                boxSize="32px"
                borderRadius="full"
                bg={complete ? 'green.500' : 'gray.200'}
                color={complete ? 'white' : 'gray.500'}
                flexShrink={0}
              >
                {complete ? <CheckCircle2 size={17} /> : <Clock3 size={16} />}
              </Flex>

              <Box minW={0}>
                <Text fontSize="sm" fontWeight="semibold">
                  {stage.label}
                </Text>

                <Text mt={0.5} color="gray.500" fontSize="xs">
                  {stage.helper}
                </Text>
              </Box>
            </HStack>
          </Box>
        )
      })}
    </SimpleGrid>
  )
}

function AttachmentCards({
  attachments = [],
  isCustomer
}: {
  attachments?: SupportAttachment[]
  isCustomer: boolean
}) {
  if (attachments.length === 0) {
    return null
  }

  return (
    <VStack mt={3} spacing={2} align="stretch">
      <HStack spacing={1.5} color={isCustomer ? 'whiteAlpha.800' : 'gray.500'}>
        <Paperclip size={13} />

        <Text fontSize="11px" fontWeight="semibold">
          {attachments.length} attachment{attachments.length === 1 ? '' : 's'}
        </Text>
      </HStack>

      {attachments.map((attachment) => {
        const isImage = isImageAttachment(attachment)

        return (
          <Box
            key={attachment.id ?? attachment.objectKey}
            overflow="hidden"
            borderWidth="1px"
            borderColor={isCustomer ? 'whiteAlpha.400' : 'gray.200'}
            borderRadius="lg"
            bg={isCustomer ? 'whiteAlpha.200' : 'white'}
          >
            {isImage ? (
              <Box
                as="a"
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                display="block"
              >
                <Image
                  src={attachment.url}
                  alt={attachment.fileName}
                  width="100%"
                  maxH="230px"
                  objectFit="cover"
                  bg="gray.100"
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
                bg={isCustomer ? 'whiteAlpha.300' : 'blue.50'}
                color={isCustomer ? 'white' : 'blue.500'}
              >
                {isImage ? <ImageIcon size={18} /> : <FileText size={18} />}
              </Flex>

              <Box flex={1} minW={0}>
                <Text
                  fontSize="12px"
                  fontWeight="semibold"
                  color={isCustomer ? 'white' : 'gray.700'}
                  noOfLines={1}
                >
                  {attachment.fileName}
                </Text>

                <Text mt={0.5} fontSize="10px" color={isCustomer ? 'whiteAlpha.700' : 'gray.500'}>
                  {formatFileSize(attachment.size)}
                </Text>
              </Box>

              <HStack spacing={1}>
                <IconButton
                  as="a"
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${attachment.fileName}`}
                  icon={<ExternalLink size={14} />}
                  size="xs"
                  variant="ghost"
                  color={isCustomer ? 'white' : 'blue.600'}
                />

                <IconButton
                  as="a"
                  href={attachment.url}
                  download={attachment.fileName}
                  aria-label={`Download ${attachment.fileName}`}
                  icon={<Download size={14} />}
                  size="xs"
                  variant="ghost"
                  color={isCustomer ? 'white' : 'gray.600'}
                />
              </HStack>
            </Flex>
          </Box>
        )
      })}
    </VStack>
  )
}

function TicketRow({
  ticket,
  selected,
  onClick
}: {
  ticket: SupportTicket
  selected: boolean
  onClick: () => void
}) {
  const equipment = ticket.rental?.item ?? ticket.item

  return (
    <Box
      as="button"
      type="button"
      w="full"
      p={4}
      textAlign="left"
      bg={selected ? 'green.50' : 'white'}
      borderBottomWidth="1px"
      borderBottomColor="gray.100"
      borderLeftWidth="3px"
      borderLeftColor={selected ? 'green.500' : 'transparent'}
      transition="all 0.2s"
      _hover={{ bg: selected ? 'green.50' : 'gray.50' }}
      onClick={onClick}
    >
      <Flex justify="space-between" align="flex-start" gap={3}>
        <HStack align="flex-start" spacing={3} minW={0}>
          <Box position="relative">
            <Avatar
              size="sm"
              name={equipment?.name ?? ticket.subject}
              src={equipment?.imageUrl ?? undefined}
            />

            {ticket.customerUnreadCount > 0 ? (
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
                {ticket.customerUnreadCount}
              </Flex>
            ) : null}
          </Box>

          <Box minW={0}>
            <Text fontWeight="semibold" color="gray.800" noOfLines={1}>
              {ticket.subject}
            </Text>

            <Text mt={0.5} color="gray.500" fontSize="xs" noOfLines={1}>
              {equipment?.name ?? humanise(ticket.category)}
            </Text>

            <HStack mt={2} spacing={2} flexWrap="wrap">
              <Badge
                colorScheme={statusColour(ticket.status)}
                borderRadius="full"
                textTransform="none"
              >
                {humanise(ticket.status)}
              </Badge>

              <Badge
                colorScheme={priorityColour(ticket.priority)}
                variant="subtle"
                borderRadius="full"
                textTransform="none"
              >
                {humanise(ticket.priority)}
              </Badge>
            </HStack>
          </Box>
        </HStack>

        <Text flexShrink={0} color="gray.500" fontSize="xs">
          {formatRelativeDate(ticket.lastMessageAt ?? ticket.updatedAt)}
        </Text>
      </Flex>
    </Box>
  )
}

export default function MyQueries() {
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [attachments, setAttachments] = useState<SupportAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [search])

  const ticketVariables = useMemo(
    () => ({
      input: {
        page,
        limit: PAGE_LIMIT
      }
    }),
    [page]
  )

  const {
    data: ticketsData,
    loading: ticketsLoading,
    error: ticketsError,
    refetch: refetchTickets,
    networkStatus
  } = useQuery<TicketsData>(MY_SUPPORT_TICKETS_QUERY, {
    variables: ticketVariables,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    pollInterval: 8_000
  })

  const {
    data: selectedTicketData,
    loading: selectedTicketLoading,
    error: selectedTicketError,
    refetch: refetchSelectedTicket
  } = useQuery<TicketDetailsData, TicketDetailsVariables>(CUSTOMER_SUPPORT_TICKET_QUERY, {
    variables: {
      id: selectedTicketId ?? ''
    },
    skip: !selectedTicketId,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    pollInterval: selectedTicketId ? 5_000 : 0
  })

  const [sendMessage, { loading: sending }] = useMutation(SEND_CUSTOMER_SUPPORT_MESSAGE_MUTATION)

  const [markTicketRead] = useMutation(MARK_SUPPORT_TICKET_READ_BY_CUSTOMER_MUTATION)

  const allTickets = ticketsData?.mySupportTickets.tickets ?? []

  const tickets = useMemo(() => {
    const normalisedSearch = debouncedSearch.toLowerCase()

    return allTickets.filter((ticket) => {
      if (status && ticket.status !== status) {
        return false
      }

      if (!normalisedSearch) {
        return true
      }

      const equipment = ticket.rental?.item ?? ticket.item

      return [ticket.id, ticket.subject, ticket.message, ticket.category, equipment?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalisedSearch))
    })
  }, [allTickets, debouncedSearch, status])

  const pagination = ticketsData?.mySupportTickets
  const selectedTicket = selectedTicketData?.customerSupportTicket
  const isRefreshing = networkStatus === 4

  useEffect(() => {
    if (!selectedTicketId && tickets.length > 0) {
      setSelectedTicketId(tickets[0].id)
    }
  }, [selectedTicketId, tickets])

  useEffect(() => {
    setReply('')
    setAttachments([])
    setUploadError(null)
  }, [selectedTicketId])

  useEffect(() => {
    if (!selectedTicketId || !selectedTicket || selectedTicket.customerUnreadCount < 1) {
      return
    }

    void markTicketRead({
      variables: {
        ticketId: selectedTicketId
      }
    })
      .then(() => refetchTickets())
      .catch(() => {
        console.error('Unable to mark ticket as read. Please try again later.')
      })
  }, [markTicketRead, refetchTickets, selectedTicket, selectedTicketId])

  async function refreshAll(): Promise<void> {
    try {
      await Promise.all([
        refetchTickets(),
        selectedTicketId ? refetchSelectedTicket() : Promise.resolve()
      ])

      toast({
        title: 'Support tickets refreshed',
        status: 'success',
        duration: 2000,
        isClosable: true
      })
    } catch {
      toast({
        title: 'Unable to refresh support tickets',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const selectedFiles = Array.from(event.target.files ?? [])

    event.target.value = ''

    if (selectedFiles.length === 0) {
      return
    }

    const validationError = validateFiles(selectedFiles, attachments.length)

    if (validationError) {
      setUploadError(validationError)

      toast({
        title: 'Unable to add attachment',
        description: validationError,
        status: 'error',
        duration: 4000,
        isClosable: true
      })

      return
    }

    setUploading(true)
    setUploadError(null)

    try {
      const uploadedFiles = await uploadFiles(selectedFiles)

      setAttachments((current) => [...current, ...uploadedFiles])

      toast({
        title: uploadedFiles.length === 1 ? 'Attachment uploaded' : 'Attachments uploaded',
        status: 'success',
        duration: 2000,
        isClosable: true
      })
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Unable to upload attachment.'

      setUploadError(description)

      toast({
        title: 'Attachment upload failed',
        description,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setUploading(false)
    }
  }

  function removeAttachment(objectKey: string): void {
    setAttachments((current) => current.filter((attachment) => attachment.objectKey !== objectKey))
  }

  async function handleSendMessage(event: FormEvent): Promise<void> {
    event.preventDefault()

    const message = reply.trim()

    if (!selectedTicketId || !message || message.length > 3000 || uploading) {
      return
    }

    try {
      await sendMessage({
        variables: {
          ticketId: selectedTicketId,
          input: {
            message,
            attachments: attachments.map((attachment) => ({
              fileName: attachment.fileName,
              objectKey: attachment.objectKey,
              url: attachment.url,
              contentType: attachment.contentType ?? null,
              size: attachment.size ?? null
            }))
          }
        }
      })

      setReply('')
      setAttachments([])
      setUploadError(null)

      await Promise.all([refetchSelectedTicket(), refetchTickets()])

      toast({
        title: 'Message sent',
        status: 'success',
        duration: 2500,
        isClosable: true
      })
    } catch (error) {
      toast({
        title: 'Unable to send message',
        description: error instanceof Error ? error.message : 'Please try again.',
        status: 'error',
        duration: 4000,
        isClosable: true
      })
    }
  }

  return (
    <Box minH="100vh" bg="gray.50" px={{ base: 4, md: 6, xl: 8 }} py={6}>
      <Flex
        mb={6}
        align={{ base: 'flex-start', md: 'center' }}
        justify="space-between"
        direction={{ base: 'column', md: 'row' }}
        gap={4}
      >
        
        <Box>
          <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color="gray.800">
            My Support Queries
          </Text>

          <Text mt={1} color="gray.500">
            Track your ticket status and chat with the support team.
          </Text>
        </Box>

        <Button
          leftIcon={<RefreshCw size={17} />}
          variant="outline"
          bg="white"
          isLoading={isRefreshing}
          loadingText="Refreshing"
          onClick={() => void refreshAll()}
        >
          Refresh
        </Button>
      </Flex>

      {ticketsError ? (
        <Alert status="error" mb={5} borderRadius="lg">
          <AlertIcon />

          <Box>
            <AlertTitle>Unable to load support tickets</AlertTitle>
            <AlertDescription>{ticketsError.message}</AlertDescription>
          </Box>
        </Alert>
      ) : null}

      <Grid
        templateColumns={{
          base: '1fr',
          xl: '380px minmax(0, 1fr)'
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
            <Box p={4} borderBottomWidth="1px" borderColor="gray.200">
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Search size={17} color="#718096" />
                </InputLeftElement>

                <Input
                  value={search}
                  placeholder="Search your tickets"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </InputGroup>

              <Select
                mt={3}
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </Select>
            </Box>

            <Flex
              px={4}
              py={3}
              justify="space-between"
              align="center"
              borderBottomWidth="1px"
              borderColor="gray.200"
            >
              <Box>
                <Text fontWeight="semibold">My tickets</Text>

                <Text color="gray.500" fontSize="xs">
                  {pagination?.total ?? 0} ticket
                  {(pagination?.total ?? 0) === 1 ? '' : 's'}
                </Text>
              </Box>

              {ticketsLoading ? <Spinner size="sm" color="green.500" /> : null}
            </Flex>

            <Box maxH={{ base: '480px', xl: '720px' }} overflowY="auto">
              {ticketsLoading && allTickets.length === 0 ? (
                <VStack p={4} spacing={3}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} w="full" h="100px" borderRadius="lg" />
                  ))}
                </VStack>
              ) : tickets.length === 0 ? (
                <Center minH="300px" px={6}>
                  <VStack spacing={3}>
                    <Flex
                      align="center"
                      justify="center"
                      boxSize="56px"
                      borderRadius="full"
                      bg="gray.100"
                      color="gray.500"
                    >
                      <Inbox size={24} />
                    </Flex>

                    <Text fontWeight="semibold">No support tickets found</Text>

                    <Text color="gray.500" fontSize="sm" textAlign="center">
                      Tickets you submit will appear here.
                    </Text>
                  </VStack>
                </Center>
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

              <Text color="gray.600" fontSize="sm">
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
            minH="760px"
          >
            {!selectedTicketId ? (
              <Center minH="760px" px={6}>
                <VStack spacing={3}>
                  <Flex
                    align="center"
                    justify="center"
                    boxSize="64px"
                    borderRadius="full"
                    bg="green.50"
                    color="green.600"
                  >
                    <MessageCircle size={28} />
                  </Flex>

                  <Text fontWeight="semibold">Select a support ticket</Text>

                  <Text color="gray.500" fontSize="sm" textAlign="center">
                    Select a ticket to view its current state and conversation.
                  </Text>
                </VStack>
              </Center>
            ) : selectedTicketLoading && !selectedTicket ? (
              <VStack p={6} align="stretch" spacing={4}>
                <Skeleton h="48px" />
                <Skeleton h="120px" />
                <SkeletonText noOfLines={8} spacing={4} />
              </VStack>
            ) : selectedTicketError ? (
              <Alert status="error" m={5} borderRadius="lg">
                <AlertIcon />

                <Box>
                  <AlertTitle>Unable to load this ticket</AlertTitle>
                  <AlertDescription>{selectedTicketError.message}</AlertDescription>
                </Box>
              </Alert>
            ) : selectedTicket ? (
              <Flex direction="column" minH="760px">
                <Box px={{ base: 4, md: 6 }} py={4} borderBottomWidth="1px" borderColor="gray.200">
                  <Flex
                    align={{ base: 'flex-start', md: 'center' }}
                    justify="space-between"
                    direction={{ base: 'column', md: 'row' }}
                    gap={4}
                  >
                    <Box minW={0}>
                      <HStack mb={1} spacing={2} flexWrap="wrap">
                        <Badge
                          colorScheme={statusColour(selectedTicket.status)}
                          borderRadius="full"
                          px={2}
                          textTransform="none"
                        >
                          {humanise(selectedTicket.status)}
                        </Badge>

                        <Badge
                          colorScheme={priorityColour(selectedTicket.priority)}
                          variant="subtle"
                          borderRadius="full"
                          px={2}
                          textTransform="none"
                        >
                          {humanise(selectedTicket.priority)}
                        </Badge>

                        <Text color="gray.400" fontSize="xs">
                          #{selectedTicket.id.slice(-8)}
                        </Text>
                      </HStack>

                      <Text fontSize="xl" fontWeight="bold" color="gray.800">
                        {selectedTicket.subject}
                      </Text>

                      <Text mt={1} color="gray.500" fontSize="sm">
                        Created {formatDate(selectedTicket.createdAt)}
                      </Text>
                    </Box>

                    <Box textAlign={{ base: 'left', md: 'right' }}>
                      <Text color="gray.500" fontSize="xs">
                        Assigned support agent
                      </Text>

                      <Text fontWeight="semibold" color="gray.700">
                        {getAgentName(selectedTicket.assignedToAdminUser)}
                      </Text>
                    </Box>
                  </Flex>
                </Box>

                <Box
                  px={{ base: 4, md: 6 }}
                  py={4}
                  bg="gray.50"
                  borderBottomWidth="1px"
                  borderColor="gray.200"
                >
                  <TicketStatusProgress status={selectedTicket.status} />

                  {selectedTicket.status === 'CLOSED' ? (
                    <Alert status="info" mt={4} borderRadius="lg">
                      <AlertIcon />
                      This ticket is closed and cannot receive new messages.
                    </Alert>
                  ) : null}
                </Box>

                <VStack
                  flex={1}
                  align="stretch"
                  spacing={4}
                  px={{ base: 4, md: 6 }}
                  py={5}
                  maxH="440px"
                  overflowY="auto"
                >
                  {(selectedTicket.messages ?? []).map((message) => {
                    const isCustomer = message.senderType === 'CUSTOMER'

                    return (
                      <Flex key={message.id} justify={isCustomer ? 'flex-end' : 'flex-start'}>
                        <Box maxW={{ base: '95%', md: '78%' }}>
                          <Text
                            mb={1}
                            color="gray.500"
                            fontSize="xs"
                            textAlign={isCustomer ? 'right' : 'left'}
                          >
                            {isCustomer ? 'You' : getAgentName(message.senderAdminUser)}
                          </Text>

                          <Box
                            px={4}
                            py={3}
                            borderRadius="xl"
                            borderTopRightRadius={isCustomer ? 'sm' : 'xl'}
                            borderTopLeftRadius={isCustomer ? 'xl' : 'sm'}
                            bg={isCustomer ? 'green.600' : 'gray.100'}
                            color={isCustomer ? 'white' : 'gray.800'}
                          >
                            <Text whiteSpace="pre-wrap" fontSize="sm">
                              {message.message}
                            </Text>

                            <AttachmentCards
                              attachments={message.attachments}
                              isCustomer={isCustomer}
                            />
                          </Box>

                          <Text
                            mt={1}
                            color="gray.400"
                            fontSize="10px"
                            textAlign={isCustomer ? 'right' : 'left'}
                          >
                            {formatDate(message.createdAt)}
                            {isCustomer && message.readByAgentAt ? ' • Read' : ''}
                          </Text>
                        </Box>
                      </Flex>
                    )
                  })}
                </VStack>

                <Divider />

                <Box
                  as="form"
                  px={{ base: 4, md: 6 }}
                  py={4}
                  onSubmit={(event: FormEvent<Element>) => void handleSendMessage(event)}
                >
                  <FormControl
                    isInvalid={reply.length > 3000}
                    isDisabled={selectedTicket.status === 'CLOSED'}
                  >
                    <FormLabel fontSize="sm" color="gray.700">
                      Reply to support
                    </FormLabel>

                    <Textarea
                      value={reply}
                      minH="90px"
                      resize="vertical"
                      maxLength={3000}
                      placeholder={
                        selectedTicket.status === 'CLOSED'
                          ? 'This ticket is closed.'
                          : 'Type your message...'
                      }
                      onChange={(event) => setReply(event.target.value)}
                    />

                    <FormErrorMessage>Message cannot exceed 3000 characters.</FormErrorMessage>
                  </FormControl>

                  <FormControl
                    mt={4}
                    isInvalid={Boolean(uploadError)}
                    isDisabled={selectedTicket.status === 'CLOSED'}
                  >
                    <FormLabel fontSize="sm">Attachments</FormLabel>

                    <Box
                      position="relative"
                      p={4}
                      border="2px dashed"
                      borderColor={uploadError ? 'red.300' : 'gray.300'}
                      borderRadius="lg"
                      bg={uploadError ? 'red.50' : 'gray.50'}
                      textAlign="center"
                    >
                      <Input
                        position="absolute"
                        inset={0}
                        width="100%"
                        height="100%"
                        opacity={0}
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                        cursor={uploading ? 'not-allowed' : 'pointer'}
                        isDisabled={
                          uploading ||
                          sending ||
                          attachments.length >= MAX_ATTACHMENTS ||
                          selectedTicket.status === 'CLOSED'
                        }
                        onChange={(event) => void handleFileSelection(event)}
                      />

                      <VStack spacing={1.5}>
                        <UploadCloud size={21} />

                        <Text fontSize="sm" fontWeight="semibold">
                          {uploading ? 'Uploading...' : 'Add attachments'}
                        </Text>

                        <Text color="gray.500" fontSize="xs">
                          PDF, JPG, PNG or WebP. Maximum 10 MB per file.
                        </Text>
                      </VStack>
                    </Box>

                    {uploading ? (
                      <Progress mt={2} size="xs" isIndeterminate colorScheme="green" />
                    ) : null}

                    <FormErrorMessage>{uploadError}</FormErrorMessage>

                    {!uploadError ? (
                      <FormHelperText>
                        {attachments.length}/{MAX_ATTACHMENTS} files added
                      </FormHelperText>
                    ) : null}
                  </FormControl>

                  {attachments.length > 0 ? (
                    <VStack mt={3} spacing={2} align="stretch">
                      {attachments.map((attachment) => (
                        <Flex
                          key={attachment.objectKey}
                          align="center"
                          gap={3}
                          p={3}
                          borderWidth="1px"
                          borderColor="gray.200"
                          borderRadius="lg"
                        >
                          <FileText size={18} />

                          <Box flex={1} minW={0}>
                            <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                              {attachment.fileName}
                            </Text>

                            <Text color="gray.500" fontSize="xs">
                              {formatFileSize(attachment.size)}
                            </Text>
                          </Box>

                          <IconButton
                            aria-label={`Remove ${attachment.fileName}`}
                            icon={<Trash2 size={15} />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            isDisabled={uploading || sending}
                            onClick={() => removeAttachment(attachment.objectKey)}
                          />
                        </Flex>
                      ))}
                    </VStack>
                  ) : null}

                  <Flex mt={4} justify="space-between" align="center" gap={3}>
                    <Text color={reply.length > 3000 ? 'red.500' : 'gray.500'} fontSize="xs">
                      {reply.length}/3000 characters
                    </Text>

                    <Button
                      type="submit"
                      colorScheme="green"
                      leftIcon={<Send size={16} />}
                      isLoading={sending}
                      loadingText="Sending"
                      isDisabled={
                        !reply.trim() ||
                        reply.length > 3000 ||
                        uploading ||
                        selectedTicket.status === 'CLOSED'
                      }
                    >
                      Send message
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
