import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Spinner,
  Text,
  VStack
} from '@chakra-ui/react'
import axios from 'axios'
import {
  ChevronLeft,
  ChevronRight,
  Package,
  RefreshCcw
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuthContext } from '../../../context'
import { API_HOST } from '../../../utils/contants'
import RequestOrderWhatsApp, {
  type WhatsAppOrder
} from '../../../components/RequestOrderWhatsApp'

import type { ReviewItemInput, ReviewMap } from '../types'

const BLUE = '#008fff'
const NAVY = '#07132b'
const MUTED = '#7183a0'
const BORDER = '#e3eaf3'
const PAGE_SIZE = 10

type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'PAID'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'

interface OrderItem {
  id: string
  productId?: string | null
  productNameSnapshot: string
  skuSnapshot: string
  quantity: number
  unitPrice: string
  lineTotal: string
}

interface StatusHistory {
  id: string
  status: OrderStatus
  note?: string | null
  createdAt: string
}

interface CustomerOrder extends WhatsAppOrder {
  status: OrderStatus
  createdAt: string
  items: OrderItem[]
  statusHistory?: StatusHistory[]
}

interface OrdersPage {
  items: CustomerOrder[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface ApiResponse<T> {
  success: boolean
  data: T
}

type OrdersSectionProps = {
  reviewMap?: ReviewMap
  onReview?: (item: ReviewItemInput) => void
}

const api = axios.create({
  baseURL: `${API_HOST.trim().replace(/\/+$/, '')}/api/v1`,
  timeout: 20_000,
  headers: {
    Accept: 'application/json'
  }
})

const statusDetails: Record<
  OrderStatus,
  { label: string; color: string; message: string }
> = {
  PENDING_PAYMENT: {
    label: 'Awaiting payment',
    color: 'orange',
    message:
      'Contact our team to confirm availability and arrange payment. A saved order does not confirm that a WhatsApp message was sent.'
  },
  PAYMENT_FAILED: {
    label: 'Payment failed',
    color: 'red',
    message: 'Payment was unsuccessful. Contact our team for assistance.'
  },
  PAID: {
    label: 'Paid',
    color: 'green',
    message: 'Payment has been recorded for your order.'
  },
  PROCESSING: {
    label: 'Processing',
    color: 'blue',
    message: 'Your order is being prepared.'
  },
  PACKED: {
    label: 'Packed',
    color: 'blue',
    message: 'Your order has been packed.'
  },
  SHIPPED: {
    label: 'Shipped',
    color: 'cyan',
    message: 'Your order has been shipped.'
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for delivery',
    color: 'cyan',
    message: 'Your order is out for delivery.'
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'green',
    message: 'Your order has been delivered.'
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'gray',
    message: 'This order has been cancelled.'
  },
  RETURN_REQUESTED: {
    label: 'Return requested',
    color: 'orange',
    message: 'A return has been requested for this order.'
  },
  RETURNED: {
    label: 'Returned',
    color: 'purple',
    message: 'This order has been marked as returned.'
  },
  REFUNDED: {
    label: 'Refunded',
    color: 'purple',
    message: 'This order has been marked as refunded.'
  },
  PARTIALLY_REFUNDED: {
    label: 'Partially refunded',
    color: 'purple',
    message: 'This order has been partially refunded.'
  }
}

function authorization(token: string) {
  const value = token.trim()

  return {
    Authorization: /^Bearer\s/i.test(value)
      ? value
      : `Bearer ${value}`
  }
}

function unwrap<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data == null) {
    throw new Error('Invalid response.')
  }

  return body.data
}

function money(value: string, currency: string) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency
  }).format(Number(value))
}

function dateLabel(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return 'Your session has expired. Please sign in again.'
    }

    if (error.response?.status === 404) {
      return 'The requested order could not be found.'
    }
  }

  return 'Unable to load your orders. Please try again.'
}

function OrderBadge({ status }: { status: OrderStatus }) {
  const details = statusDetails[status]

  return (
    <Badge
      colorScheme={details?.color || 'gray'}
      borderRadius="full"
      px={3}
      py={1}
      textTransform="none"
    >
      {details?.label || status}
    </Badge>
  )
}

export function OrdersSection(_props: OrdersSectionProps) {
  const { token, isAuthenticating } = useAuthContext()

  const [page, setPage] = useState(1)
  const [refresh, setRefresh] = useState(0)

  const [selection, setSelection] = useState<{
    token: string
    id: string
  } | null>(null)

  const key = JSON.stringify([token, page, refresh])

  const [state, setState] = useState<{
    key: string
    data: OrdersPage | null
    loading: boolean
    error: string | null
  }>({
    key: '',
    data: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    if (!token || isAuthenticating) return

    const controller = new AbortController()

    setState({
      key,
      data: null,
      loading: true,
      error: null
    })

    async function load() {
      try {
        const response = await api.get<ApiResponse<OrdersPage>>(
          '/orders/me',
          {
            signal: controller.signal,
            headers: authorization(token!),
            params: {
              page,
              limit: PAGE_SIZE
            }
          }
        )

        const data = unwrap(response.data)

        if (controller.signal.aborted) return

        // Recover when the final page disappears.
        if (page > 1 && data.items.length === 0) {
          setPage(Math.max(1, data.pagination.pages))
          return
        }

        setState({
          key,
          data,
          loading: false,
          error: null
        })
      } catch (error) {
        if (controller.signal.aborted) return

        setState({
          key,
          data: null,
          loading: false,
          error: errorMessage(error)
        })
      }
    }

    void load()

    return () => controller.abort()
  }, [token, isAuthenticating, page, refresh, key])

  const current = state.key === key
  const loading =
    isAuthenticating ||
    Boolean(token) && (!current || state.loading)

  const data = current ? state.data : null
  const error = current ? state.error : null
  const orders = data?.items || []

  const selectedId =
    token && selection?.token === token ? selection.id : null

  return (
    <Box color={NAVY} fontFamily="Arial, Helvetica, sans-serif">
      <Flex
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
        gap={4}
        mb={6}
      >
        <Box>
          <Heading
            as="h1"
            fontSize={{ base: '26px', md: '32px' }}
            letterSpacing="-0.04em"
          >
            My Orders
          </Heading>

          <Text mt={2} color={MUTED} fontSize="sm">
            View your saved orders and their latest status.
          </Text>
        </Box>

        <Button
          leftIcon={<RefreshCcw size={17} />}
          variant="outline"
          color={BLUE}
          borderColor="#b5dcff"
          borderRadius="10px"
          isLoading={loading && Boolean(token)}
          isDisabled={!token || Boolean(selectedId)}
          onClick={() => setRefresh((value) => value + 1)}
          _hover={{ bg: '#eaf6ff' }}
        >
          Refresh orders
        </Button>
      </Flex>

      {loading ? (
        <VStack align="stretch" spacing={5}>
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} h="200px" borderRadius="16px" />
          ))}
        </VStack>
      ) : !token ? (
        <Box bg="white" p={8} borderRadius="16px" textAlign="center">
          <Text color={MUTED}>Sign in to view your orders.</Text>
          <Button as={Link} to="/login" mt={4} colorScheme="blue">
            Sign in
          </Button>
        </Box>
      ) : error ? (
        <Alert status="error" borderRadius="12px" gap={3} flexWrap="wrap">
          <AlertIcon />
          <Text flex={1}>{error}</Text>
          <Button size="sm" onClick={() => setRefresh((value) => value + 1)}>
            Retry
          </Button>
        </Alert>
      ) : orders.length === 0 ? (
        <Box
          role="status"
          bg="white"
          border="1px solid"
          borderColor={BORDER}
          borderRadius="16px"
          textAlign="center"
          px={6}
          py={14}
        >
          <Flex
            mx="auto"
            boxSize="76px"
            align="center"
            justify="center"
            bg="#eaf6ff"
            color={BLUE}
            borderRadius="full"
          >
            <Package size={34} />
          </Flex>

          <Heading mt={5} size="md">No orders yet</Heading>
          <Text mt={3} color={MUTED}>
            Your saved orders will appear here.
          </Text>

          <Button
            as={Link}
            to="/shop"
            mt={6}
            bg={BLUE}
            color="white"
            _hover={{ bg: '#007ada' }}
          >
            Browse products
          </Button>
        </Box>
      ) : (
        <>
          <VStack align="stretch" spacing={5}>
            {orders.map((order) => (
              <Box
                key={order.id}
                bg="white"
                border="1px solid"
                borderColor={BORDER}
                borderRadius="16px"
                p={{ base: 4, md: 6 }}
              >
                <Flex justify="space-between" gap={4} flexWrap="wrap">
                  <Box>
                    <Text fontWeight="800">
                      Order {order.orderNumber}
                    </Text>
                    <Text mt={2} fontSize="xs" color={MUTED}>
                      Created {dateLabel(order.createdAt)}
                    </Text>
                  </Box>

                  <OrderBadge status={order.status} />
                </Flex>

                <Text
                  mt={4}
                  p={4}
                  bg="#f7f9fc"
                  borderRadius="10px"
                  color={MUTED}
                  fontSize="sm"
                  lineHeight="1.8"
                >
                  {statusDetails[order.status]?.message || 'View the order for details.'}
                </Text>

                <VStack align="stretch" spacing={4} mt={5}>
                  {order.items.map((item) => (
                    <Flex
                      key={item.id}
                      justify="space-between"
                      align="center"
                      gap={4}
                      flexWrap="wrap"
                    >
                      <Box flex={1} minW="150px">
                        {item.productId ? (
                          <Text
                            as={Link}
                            to={`/shop/${encodeURIComponent(item.productId)}`}
                            fontWeight="700"
                            fontSize="sm"
                            _hover={{ color: BLUE }}
                          >
                            {item.productNameSnapshot}
                          </Text>
                        ) : (
                          <Text fontWeight="700" fontSize="sm">
                            {item.productNameSnapshot}
                          </Text>
                        )}

                        <Text mt={1} color={MUTED} fontSize="xs">
                          Quantity: {item.quantity}
                        </Text>
                      </Box>

                      <Text fontSize="sm" fontWeight="700">
                        {money(item.lineTotal, order.currency)}
                      </Text>
                    </Flex>
                  ))}
                </VStack>

                <Divider my={5} borderColor={BORDER} />

                <Flex
                  justify="space-between"
                  align="center"
                  gap={4}
                  flexWrap="wrap"
                >
                  <Text fontWeight="800" fontSize="xl">
                    {money(order.total, order.currency)}
                  </Text>

                  <Button
                    variant="outline"
                    borderColor="#b5dcff"
                    color={BLUE}
                    borderRadius="10px"
                    onClick={() =>
                      setSelection({ token, id: order.id })
                    }
                  >
                    View Order
                  </Button>
                </Flex>
              </Box>
            ))}
          </VStack>

          {data && data.pagination.pages > 1 && (
            <Flex mt={7} justify="space-between" align="center" gap={3}>
              <Button
                leftIcon={<ChevronLeft size={17} />}
                isDisabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                variant="outline"
              >
                Previous
              </Button>

              <Text fontSize="sm" color={MUTED}>
                Page {page} of {data.pagination.pages}
              </Text>

              <Button
                rightIcon={<ChevronRight size={17} />}
                isDisabled={page >= data.pagination.pages}
                onClick={() => setPage((value) => value + 1)}
                variant="outline"
              >
                Next
              </Button>
            </Flex>
          )}
        </>
      )}

      {token && selectedId && (
        <OrderDetailsModal
          key={JSON.stringify([token, selectedId])}
          token={token}
          orderId={selectedId}
          onClose={() => setSelection(null)}
        />
      )}
    </Box>
  )
}

function OrderDetailsModal({
  token,
  orderId,
  onClose
}: {
  token: string
  orderId: string
  onClose: () => void
}) {
  const [order, setOrder] = useState<CustomerOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    setLoading(true)
    setError(null)

    async function load() {
      try {
        const response = await api.get<ApiResponse<CustomerOrder>>(
          `/orders/${encodeURIComponent(orderId)}`,
          {
            signal: controller.signal,
            headers: authorization(token)
          }
        )

        const data = unwrap(response.data)

        if (!controller.signal.aborted) setOrder(data)
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(errorMessage(error))
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()

    return () => controller.abort()
  }, [token, orderId, retry])

  const history = [...(order?.statusHistory || [])].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime()
  )

  return (
    <Modal isOpen onClose={onClose} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.600" />

      <ModalContent mx={4} borderRadius="16px" color={NAVY}>
        <ModalHeader pr={12}>
          Order details
          {order && (
            <Text mt={2} fontSize="sm" color={MUTED} fontWeight="400">
              {order.orderNumber}
            </Text>
          )}
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody pb={6}>
          {loading ? (
            <Flex justify="center" py={12}>
              <Spinner color={BLUE} />
            </Flex>
          ) : error ? (
            <Alert status="error" borderRadius="10px" gap={3} flexWrap="wrap">
              <AlertIcon />
              <Text flex={1}>{error}</Text>
              <Button size="sm" onClick={() => setRetry((value) => value + 1)}>
                Retry
              </Button>
            </Alert>
          ) : order ? (
            <>
              <OrderBadge status={order.status} />

              <Text mt={4} fontSize="sm" color={MUTED} lineHeight="1.8">
                {statusDetails[order.status]?.message}
              </Text>

              <Heading mt={6} size="sm">Status history</Heading>

              {history.length ? (
                <VStack mt={4} align="stretch" spacing={4}>
                  {history.map((entry) => (
                    <Box
                      key={entry.id}
                      borderLeft={`3px solid ${BLUE}`}
                      pl={4}
                      py={1}
                    >
                      <Text fontWeight="700" fontSize="sm">
                        {statusDetails[entry.status]?.label || entry.status}
                      </Text>
                      <Text mt={1} fontSize="xs" color={MUTED}>
                        {dateLabel(entry.createdAt)}
                      </Text>
                      {entry.note && (
                        <Text mt={2} fontSize="sm" color={MUTED}>
                          {entry.note}
                        </Text>
                      )}
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Text mt={3} color={MUTED} fontSize="sm">
                  No status history is available.
                </Text>
              )}

              <Divider my={6} />

              <Heading size="sm" mb={4}>Products</Heading>

              <VStack align="stretch" spacing={4}>
                {order.items.map((item) => (
                  <Flex key={item.id} justify="space-between" gap={4}>
                    <Text fontSize="sm">
                      {item.quantity} × {item.productNameSnapshot}
                    </Text>
                    <Text fontWeight="700" fontSize="sm">
                      {money(item.lineTotal, order.currency)}
                    </Text>
                  </Flex>
                ))}
              </VStack>

              <Divider my={5} />

              <Flex justify="space-between">
                <Text fontWeight="700">Recorded total</Text>
                <Text fontWeight="800">
                  {money(order.total, order.currency)}
                </Text>
              </Flex>

              {order.status === 'PENDING_PAYMENT' && (
                <RequestOrderWhatsApp order={order} />
              )}
            </>
          ) : null}
        </ModalBody>

        <ModalFooter>
          <Button bg={BLUE} color="white" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default OrdersSection