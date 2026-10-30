import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useToast
} from '@chakra-ui/react'
import { ArrowRight, Eye, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useAuthContext } from '../../../../context'

import {
  ORDER_STATUSES,
  fetchAdminOrder,
  fetchAdminOrders,
  formatOrderMoney,
  formatOrderStatus,
  getNextOrderStatus,
  getOrderActionLabel,
  getOrderError,
  getOrderStatusColor,
  updateAdminOrderStatus,
  type AdminOrder,
  type OrderStatus,
  type OrdersPage
} from '../../../../rest/api/dminOrders'

const BLUE = '#008fff'
const NAVY = '#07132b'
const BORDER = '#e3eaf3'
const MUTED = '#7183a0'
const LIMIT = 20

const PROCESSING_STATUSES: OrderStatus[] = [
  'PAID',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY'
]

type ListState = {
  key: string
  loading: boolean
  data: OrdersPage | null
  error: string | null
}

function formatDate(value: string): string {
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
}

function addressText(value: unknown): string {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return 'Not provided'

  return JSON.stringify(value, null, 2)
}

function OrderDetails({
  id,
  token,
  onClose
}: {
  id: string
  token: string
  onClose: () => void
}) {
  const [state, setState] = useState<{
    order: AdminOrder | null
    error: string | null
    loading: boolean
  }>({
    order: null,
    error: null,
    loading: true
  })

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const order = await fetchAdminOrder(
          token,
          id,
          controller.signal
        )

        if (!controller.signal.aborted) {
          setState({ order, error: null, loading: false })
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            order: null,
            error: getOrderError(error),
            loading: false
          })
        }
      }
    }

    void load()

    return () => controller.abort()
  }, [id, token])

  const { order, loading, error } = state

  return (
    <Modal isOpen onClose={onClose} size="3xl" isCentered>
      <ModalOverlay />

      <ModalContent
        mx={4}
        bg="white"
        color={NAVY}
        borderRadius="12px"
        maxH="90dvh"
        overflow="hidden"
      >
        <ModalHeader borderBottom="1px solid" borderColor={BORDER}>
          {order?.orderNumber || 'Order Details'}
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody py={6} overflowY="auto">
          {loading ? (
            <Center minH="180px">
              <Spinner color={BLUE} />
            </Center>
          ) : error ? (
            <Alert status="error" borderRadius="8px">
              <AlertIcon />
              {error}
            </Alert>
          ) : order ? (
            <Stack spacing={5}>
              <HStack justify="space-between" wrap="wrap">
                <Badge colorScheme={getOrderStatusColor(order.status)}>
                  {formatOrderStatus(order.status)}
                </Badge>

                <Text color={MUTED} fontSize="sm">
                  {formatDate(order.placedAt || order.createdAt)}
                </Text>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box>
                  <Text fontSize="xs" color={MUTED}>Customer</Text>
                  <Text mt={1}>
                    {order.guestEmail ||
                      (order.userId ? 'Registered customer' : 'Guest')}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="xs" color={MUTED}>Order total</Text>
                  <Text mt={1} fontSize="xl" fontWeight="800" color={BLUE}>
                    {formatOrderMoney(order.total, order.currency)}
                  </Text>
                </Box>
              </SimpleGrid>

              <Box overflowX="auto">
                <Table size="sm" minW="500px">
                  <Thead bg="#f7f9fc">
                    <Tr>
                      <Th>Product</Th>
                      <Th isNumeric>Quantity</Th>
                      <Th isNumeric>Total</Th>
                    </Tr>
                  </Thead>

                  <Tbody>
                    {order.items.map((item) => (
                      <Tr key={item.id}>
                        <Td>
                          <Text fontWeight="600">
                            {item.productNameSnapshot}
                          </Text>
                          <Text fontSize="xs" color={MUTED} mt={1}>
                            {item.skuSnapshot}
                          </Text>
                        </Td>

                        <Td isNumeric>{item.quantity}</Td>

                        <Td isNumeric whiteSpace="nowrap">
                          {formatOrderMoney(item.lineTotal, order.currency)}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              <Stack spacing={2}>
                {[
                  ['Subtotal', order.subtotal],
                  ['Discount', order.discountTotal],
                  ['Delivery', order.deliveryFee],
                  ['Tax', order.taxTotal]
                ].map(([label, amount]) => (
                  <Flex key={label} justify="space-between">
                    <Text color={MUTED} fontSize="sm">{label}</Text>
                    <Text fontSize="sm">
                      {formatOrderMoney(amount!, order.currency)}
                    </Text>
                  </Flex>
                ))}
              </Stack>

              <Box>
                <Text fontWeight="700" mb={2}>Delivery address</Text>

                <Box
                  as="pre"
                  p={4}
                  bg="#f7f9fc"
                  borderRadius="8px"
                  whiteSpace="pre-wrap"
                  overflowWrap="anywhere"
                  fontFamily="inherit"
                  fontSize="sm"
                >
                  {addressText(order.deliveryAddress)}
                </Box>
              </Box>

              {order.notes && (
                <Box>
                  <Text fontWeight="700" mb={2}>Notes</Text>
                  <Text color={MUTED}>{order.notes}</Text>
                </Box>
              )}
            </Stack>
          ) : null}
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={BORDER}>
          <Button
            bg={BLUE}
            color="white"
            _hover={{ bg: '#007bdc' }}
            onClick={onClose}
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default function AdminOrdersScreen({
  processing = false
}: {
  processing?: boolean
}) {
  const { token, user } = useAuthContext()
  const toast = useToast()

  const [status, setStatus] = useState<OrderStatus | ''>(
    processing ? 'PAID' : ''
  )
  const [page, setPage] = useState(1)
  const [refresh, setRefresh] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [advancing, setAdvancing] = useState<AdminOrder | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const pending = useRef(false)
  const mounted = useRef(false)
  const currentToken = useRef(token)

  currentToken.current = token

  const [state, setState] = useState<ListState>({
    key: '',
    loading: false,
    data: null,
    error: null
  })

  const requestKey = JSON.stringify([
    token,
    page,
    status,
    refresh,
    processing
  ])

  const current = state.key === requestKey
  const data = current ? state.data : null
  const error = current ? state.error : null
  const loading = Boolean(token) && (!current || state.loading)

  const canUpdate = Boolean(
    user?.isSuperAdmin ||
    user?.permissions?.includes('orders.update')
  )

  const statuses = processing
    ? PROCESSING_STATUSES
    : ORDER_STATUSES

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    setSelectedId(null)
    setAdvancing(null)
    setUpdateError(null)
  }, [token])

  useEffect(() => {
    if (!token) return

    const activeToken = token
    const controller = new AbortController()

    setState({
      key: requestKey,
      loading: true,
      data: null,
      error: null
    })

    async function load() {
      try {
        const result = await fetchAdminOrders(
          activeToken,
          {
            page,
            limit: LIMIT,
            status: status || undefined
          },
          controller.signal
        )

        if (controller.signal.aborted) return

        const lastPage = Math.max(1, result.pagination.pages)

        if (page > lastPage) {
          setPage(lastPage)
          return
        }

        setState({
          key: requestKey,
          loading: false,
          data: result,
          error: null
        })
      } catch (error) {
        if (controller.signal.aborted) return

        setState({
          key: requestKey,
          loading: false,
          data: null,
          error: getOrderError(error)
        })
      }
    }

    void load()

    return () => controller.abort()
  }, [token, page, status, requestKey])

  function closeAdvanceModal() {
    if (pending.current) return

    setAdvancing(null)
    setUpdateError(null)
    setNote('')
  }

  async function confirmAdvance() {
    if (!advancing || !token || !canUpdate || pending.current) {
      return
    }

    const next = getNextOrderStatus(advancing.status)

    if (!next) return

    const operationToken = token

    pending.current = true
    setSaving(true)
    setUpdateError(null)

    try {
      await updateAdminOrderStatus(token, advancing.id, {
        status: next,
        note: note.trim() || undefined
      })

      if (
        !mounted.current ||
        currentToken.current !== operationToken
      ) {
        return
      }

      setAdvancing(null)
      setNote('')
      setRefresh((value) => value + 1)

      toast({
        title: 'Order updated',
        description: `Order moved to ${formatOrderStatus(next)}.`,
        status: 'success',
        duration: 3500,
        isClosable: true
      })
    } catch (error) {
      if (
        mounted.current &&
        currentToken.current === operationToken
      ) {
        setUpdateError(getOrderError(error))
      }
    } finally {
      pending.current = false

      if (mounted.current) {
        setSaving(false)
      }
    }
  }

  return (
    <Box minH="100dvh" bg="#f7f9fc" color={NAVY}>
      <Flex
        minH="72px"
        px={{ base: 4, md: 8 }}
        align="center"
        justify="space-between"
        bg="white"
        borderBottom="1px solid"
        borderColor={BORDER}
      >
        <Text as="h1" fontSize="21px" fontWeight="800">
          {processing ? 'Order Processing' : 'Orders'}
        </Text>

        <Button
          variant="outline"
          borderColor={BORDER}
          leftIcon={<RefreshCw size={16} />}
          isDisabled={!token || loading}
          onClick={() => setRefresh((value) => value + 1)}
        >
          Refresh
        </Button>
      </Flex>

      <Box
        maxW="1600px"
        mx="auto"
        px={{ base: 4, md: 8 }}
        py={8}
      >
        <Text
          as="h2"
          fontSize={{ base: '25px', md: '30px' }}
          fontWeight="800"
          letterSpacing="-0.04em"
        >
          {processing ? 'Manage fulfilment' : 'Customer orders'}
        </Text>

        <Text mt={2} mb={6} color={MUTED} fontSize="sm">
          {processing
            ? 'Review paid orders and advance them through fulfilment.'
            : 'Review and manage DLinkUp customer orders.'}
        </Text>

        <Box
          bg="white"
          border="1px solid"
          borderColor={BORDER}
          borderRadius="12px"
          overflow="hidden"
        >
          <Flex
            p={5}
            align="center"
            justify="space-between"
            gap={4}
            wrap="wrap"
            borderBottom="1px solid"
            borderColor={BORDER}
          >
            <Box>
              <Text fontWeight="700">
                {processing ? 'Fulfilment queue' : 'Order catalogue'}
              </Text>

              <Text mt={1} color={MUTED} fontSize="xs">
                {data
                  ? `${data.pagination.total} matching orders`
                  : 'Filter orders by status'}
              </Text>
            </Box>

            <Select
              aria-label="Filter orders by status"
              w={{ base: 'full', sm: '250px' }}
              value={status}
              borderColor={BORDER}
              focusBorderColor={BLUE}
              onChange={(event) => {
                setStatus(event.target.value as OrderStatus | '')
                setPage(1)
              }}
            >
              {!processing && <option value="">All statuses</option>}

              {statuses.map((value) => (
                <option key={value} value={value}>
                  {formatOrderStatus(value)}
                </option>
              ))}
            </Select>
          </Flex>

          {!token ? (
            <Center minH="250px">
              <Text color={MUTED}>Please sign in to view orders.</Text>
            </Center>
          ) : loading ? (
            <Center minH="300px">
              <Spinner color={BLUE} size="lg" />
            </Center>
          ) : error ? (
            <Alert status="error" m={5} w="auto" borderRadius="8px">
              <AlertIcon />
              {error}
            </Alert>
          ) : !data?.items.length ? (
            <Center minH="280px" flexDirection="column" gap={2}>
              <Text fontWeight="700">No orders found</Text>
              <Text color={MUTED} fontSize="sm">
                There are no orders matching this status.
              </Text>
            </Center>
          ) : (
            <Box overflowX="auto">
              <Table minW="1050px" size="sm">
                <Thead bg="#f8fafd">
                  <Tr>
                    {[
                      'Order',
                      'Customer',
                      'Date',
                      'Total',
                      'Status',
                      'Actions'
                    ].map((label) => (
                      <Th
                        key={label}
                        py={4}
                        color={MUTED}
                        borderColor={BORDER}
                      >
                        {label}
                      </Th>
                    ))}
                  </Tr>
                </Thead>

                <Tbody>
                  {data.items.map((order) => {
                    const next = getNextOrderStatus(order.status)

                    return (
                      <Tr key={order.id} _hover={{ bg: '#fbfdff' }}>
                        <Td py={5} borderColor={BORDER}>
                          <Text fontWeight="700">
                            {order.orderNumber}
                          </Text>
                          <Text mt={1} color={MUTED} fontSize="xs">
                            {order.items.length} order lines
                          </Text>
                        </Td>

                        <Td borderColor={BORDER}>
                          {order.guestEmail ||
                            (order.userId ? 'Registered customer' : 'Guest')}
                        </Td>

                        <Td borderColor={BORDER} whiteSpace="nowrap">
                          {formatDate(order.placedAt || order.createdAt)}
                        </Td>

                        <Td borderColor={BORDER} whiteSpace="nowrap">
                          <Text color="#007bdc" fontWeight="700">
                            {formatOrderMoney(order.total, order.currency)}
                          </Text>
                        </Td>

                        <Td borderColor={BORDER}>
                          <Badge
                            colorScheme={getOrderStatusColor(order.status)}
                            px={2}
                            py={1}
                            borderRadius="5px"
                          >
                            {formatOrderStatus(order.status)}
                          </Badge>
                        </Td>

                        <Td borderColor={BORDER}>
                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              variant="outline"
                              borderColor={BORDER}
                              leftIcon={<Eye size={15} />}
                              onClick={() => setSelectedId(order.id)}
                            >
                              View
                            </Button>

                            {processing && canUpdate && next && (
                              <Button
                                size="sm"
                                bg={BLUE}
                                color="white"
                                rightIcon={<ArrowRight size={14} />}
                                _hover={{ bg: '#007bdc' }}
                                onClick={() => {
                                  setAdvancing(order)
                                  setNote('')
                                  setUpdateError(null)
                                }}
                              >
                                {getOrderActionLabel(order.status)}
                              </Button>
                            )}
                          </HStack>
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </Box>
          )}

          {data && (
            <Flex
              p={5}
              justify="space-between"
              align="center"
              gap={3}
              wrap="wrap"
              borderTop="1px solid"
              borderColor={BORDER}
            >
              <Text color={MUTED} fontSize="sm">
                Page {data.pagination.page} of{' '}
                {Math.max(1, data.pagination.pages)}
              </Text>

              <HStack>
                <Button
                  size="sm"
                  variant="outline"
                  isDisabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  Previous
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  isDisabled={page >= data.pagination.pages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </HStack>
            </Flex>
          )}
        </Box>
      </Box>

      {selectedId && token && (
        <OrderDetails
          key={`${token}-${selectedId}`}
          id={selectedId}
          token={token}
          onClose={() => setSelectedId(null)}
        />
      )}

      <Modal
        isOpen={advancing !== null}
        onClose={closeAdvanceModal}
        closeOnOverlayClick={!saving}
        closeOnEsc={!saving}
        isCentered
      >
        <ModalOverlay />

        <ModalContent mx={4} bg="white" color={NAVY} borderRadius="12px">
          <ModalHeader>Update order status</ModalHeader>
          <ModalCloseButton isDisabled={saving} />

          <ModalBody>
            <Stack spacing={4}>
              <Text>
                Move {advancing?.orderNumber} to{' '}
                <Text as="span" fontWeight="700">
                  {advancing &&
                    getNextOrderStatus(advancing.status) &&
                    formatOrderStatus(getNextOrderStatus(advancing.status)!)}
                </Text>
                ?
              </Text>

              {updateError && (
                <Alert status="error" borderRadius="8px">
                  <AlertIcon />
                  {updateError}
                </Alert>
              )}

              <FormControl>
                <FormLabel>Note (optional)</FormLabel>
                <Textarea
                  value={note}
                  isDisabled={saving}
                  focusBorderColor={BLUE}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add a fulfilment note"
                />
              </FormControl>
            </Stack>
          </ModalBody>

          <ModalFooter gap={3}>
            <Button
              isDisabled={saving}
              onClick={closeAdvanceModal}
            >
              Cancel
            </Button>

            <Button
              bg={BLUE}
              color="white"
              isLoading={saving}
              loadingText="Updating"
              _hover={{ bg: '#007bdc' }}
              onClick={() => void confirmAdvance()}
            >
              Confirm Update
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}