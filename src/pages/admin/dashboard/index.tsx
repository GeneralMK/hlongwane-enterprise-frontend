import {
  Alert,
  AlertIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  SimpleGrid,
  Skeleton,
  Stack,
  Text
} from '@chakra-ui/react'
import {
  ArrowRight,
  Banknote,
  ClipboardList,
  Clock3,
  LogOut,
  Package,
  Plus,
  RefreshCw
} from 'lucide-react'
import {
  useEffect,
  useState,
  type ElementType
} from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthContext } from '../../../context'
import { API_HOST } from '../../../utils/contants'

const BLUE = '#008fff'
const NAVY = '#07132b'
const PAGE_BG = '#f7f9fc'
const BORDER = '#e3eaf3'
const MUTED = '#7183a0'

const DASHBOARD_URL =
  `${API_HOST.trim().replace(/\/+$/, '')}/api/v1/dashboard`

type UnknownRecord = Record<string, unknown>

type RecentOrder = {
  id: string
  orderNumber: string
  customerName: string
  total: number | null
  status: string
}

type InventoryItem = {
  label: string
  count: number
}

type DashboardData = {
  totalProducts: number | null
  totalOrders: number | null
  pendingOrders: number | null
  totalRevenue: number | null
  recentOrders: RecentOrder[]
  inventory: InventoryItem[]
}

type DashboardState = {
  key: string
  data: DashboardData | null
  loading: boolean
  error: string | null
}

function asRecord(value: unknown): UnknownRecord {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
    ? value as UnknownRecord
    : {}
}

function asNumber(value: unknown): number | null {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    (typeof value !== 'string' && typeof value !== 'number')
  ) {
    return null
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

function metric(
  data: UnknownRecord,
  metrics: UnknownRecord,
  name: string
): number | null {
  const value = metrics[name]

  return asNumber(
    data[name] ?? asRecord(value).value ?? value
  )
}

function adaptDashboard(payload: unknown): DashboardData {
  const response = asRecord(payload)
  const data = asRecord(response.data ?? response)
  const metrics = asRecord(data.metrics)
  const attention = asRecord(data.attention)

  const inventorySource = Array.isArray(data.inventoryBreakdown)
    ? data.inventoryBreakdown
    : Array.isArray(data.inventory)
      ? data.inventory
      : []

  const orderSource = Array.isArray(data.recentOrders)
    ? data.recentOrders
    : []

  return {
    totalProducts: metric(data, metrics, 'totalProducts'),
    totalOrders: metric(data, metrics, 'totalOrders'),

    pendingOrders:
      metric(data, metrics, 'pendingOrders') ??
      asNumber(attention.pendingOrders),

    totalRevenue: metric(data, metrics, 'totalRevenue'),

    recentOrders: orderSource.flatMap((entry) => {
      const order = asRecord(entry)

      if (typeof order.id !== 'string') return []

      return [{
        id: order.id,
        orderNumber: String(order.orderNumber ?? order.id),
        customerName: String(order.customerName ?? 'Customer'),
        total: asNumber(order.totalAmount ?? order.total),
        status: String(order.status ?? '')
      }]
    }),

    inventory: inventorySource.map((entry) => {
      const item = asRecord(entry)
      const category = asRecord(item.category)

      return {
        label: String(
          item.label ??
          category.name ??
          item.category ??
          item.name ??
          'Other'
        ),
        count: Math.max(
          0,
          asNumber(item.count ?? item.total ?? item.value) ?? 0
        )
      }
    })
  }
}

function formatCurrency(value: number | null): string {
  if (value === null) return '—'

  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 2
  }).format(value)
}

function statusColor(status: string): string {
  if (['PAID', 'DELIVERED'].includes(status)) return 'green'
  if (['CANCELLED', 'PAYMENT_FAILED'].includes(status)) return 'red'
  if (status === 'PENDING_PAYMENT') return 'orange'

  return 'blue'
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  loading
}: {
  label: string
  value: string
  detail: string
  icon: ElementType
  loading: boolean
}) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor={BORDER}
      borderRadius="12px"
      p={6}
      minW={0}
    >
      <Flex justify="space-between" align="flex-start" gap={3}>
        <Box minW={0}>
          <Text color={MUTED} fontSize="sm" fontWeight="600">
            {label}
          </Text>

          <Skeleton isLoaded={!loading} mt={4} borderRadius="5px">
            <Text
              color={NAVY}
              fontSize={{ base: '28px', xl: '32px' }}
              fontWeight="800"
              letterSpacing="-0.04em"
              overflowWrap="anywhere"
            >
              {value}
            </Text>
          </Skeleton>

          <Text mt={2} color={MUTED} fontSize="xs">
            {detail}
          </Text>
        </Box>

        <Flex
          w="44px"
          h="44px"
          flexShrink={0}
          align="center"
          justify="center"
          bg="#edf7ff"
          borderRadius="10px"
        >
          <Icon as={icon} color={BLUE} boxSize={5} />
        </Flex>
      </Flex>
    </Box>
  )
}

function PanelHeader({
  title,
  action,
  onClick
}: {
  title: string
  action: string
  onClick: () => void
}) {
  return (
    <Flex
      px={6}
      py={5}
      gap={3}
      align="center"
      justify="space-between"
      borderBottom="1px solid"
      borderColor={BORDER}
    >
      <Text fontWeight="800" fontSize="16px">
        {title}
      </Text>

      <Button
        type="button"
        variant="link"
        color={BLUE}
        fontSize="sm"
        rightIcon={<ArrowRight size={15} />}
        onClick={onClick}
      >
        {action}
      </Button>
    </Flex>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, token, signOut } = useAuthContext()

  const [refresh, setRefresh] = useState(0)

  const [state, setState] = useState<DashboardState>({
    key: '',
    data: null,
    loading: false,
    error: null
  })

  const requestKey = JSON.stringify([token, refresh])
  const current = state.key === requestKey

  const dashboard = current ? state.data : null
  const loading = Boolean(token) && (!current || state.loading)
  const error = current ? state.error : null

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    'Administrator'

  const roleLabel = user?.isSuperAdmin
    ? 'SuperAdmin'
    : user?.roles?.map((role) => role.name).join(', ') ||
      'Administrator'

  const canCreateProducts = Boolean(
    user?.isSuperAdmin ||
    user?.permissions?.includes('products.create')
  )

  useEffect(() => {
    if (!token) return

    const activeToken = token
    const controller = new AbortController()

    setState({
      key: requestKey,
      data: null,
      loading: true,
      error: null
    })

    async function load() {
      try {
        const bearer = /^Bearer\s/i.test(activeToken)
          ? activeToken
          : `Bearer ${activeToken}`

        const response = await fetch(DASHBOARD_URL, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            Authorization: bearer
          }
        })

        const payload: unknown = await response.json()
        const body = asRecord(payload)

        if (!response.ok || body.success === false) {
          const nested = asRecord(body.error)

          const message =
            nested.message ??
            body.message ??
            (typeof body.error === 'string' ? body.error : null) ??
            `Unable to load dashboard (${response.status}).`

          throw new Error(String(message))
        }

        if (controller.signal.aborted) return

        setState({
          key: requestKey,
          data: adaptDashboard(payload),
          loading: false,
          error: null
        })
      } catch (error) {
        if (controller.signal.aborted) return

        setState({
          key: requestKey,
          data: null,
          loading: false,
          error: error instanceof Error
            ? error.message
            : 'Unable to load the dashboard.'
        })
      }
    }

    void load()

    return () => controller.abort()
  }, [token, requestKey])

  const inventory = dashboard?.inventory ?? []

  const maximumInventory = Math.max(
    1,
    ...inventory.map((item) => item.count)
  )

  const metrics = [
    {
      label: 'Total Products',
      value: dashboard?.totalProducts?.toLocaleString('en-ZA') ?? '—',
      detail: 'Products in your catalogue',
      icon: Package
    },
    {
      label: 'Total Orders',
      value: dashboard?.totalOrders?.toLocaleString('en-ZA') ?? '—',
      detail: 'Orders received',
      icon: ClipboardList
    },
    {
      label: 'Pending Orders',
      value: dashboard?.pendingOrders?.toLocaleString('en-ZA') ?? '—',
      detail: 'Awaiting processing',
      icon: Clock3
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(dashboard?.totalRevenue ?? null),
      detail: 'Reported by your dashboard API',
      icon: Banknote
    }
  ]

  function refetch() {
    setRefresh((value) => value + 1)
  }

  return (
    <Box minH="100dvh" bg={PAGE_BG} color={NAVY}>
      <Flex
        minH="72px"
        px={{ base: 4, md: 8 }}
        align="center"
        justify="space-between"
        gap={4}
        bg="white"
        borderBottom="1px solid"
        borderColor={BORDER}
      >
        <Text as="h1" fontSize="21px" fontWeight="800">
          Dashboard
        </Text>

        <HStack spacing={3}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            borderColor={BORDER}
            leftIcon={<RefreshCw size={15} />}
            isDisabled={!token}
            isLoading={loading}
            onClick={refetch}
          >
            Refresh
          </Button>

          <Menu placement="bottom-end">
            <MenuButton
              as={Button}
              variant="ghost"
              p={0}
              minW="40px"
              borderRadius="full"
              aria-label="Open account menu"
            >
              <Avatar
                size="sm"
                name={displayName}
                bg="#e0f0ff"
                color="#007bdc"
              />
            </MenuButton>

            <MenuList
              bg="white"
              color={NAVY}
              borderColor={BORDER}
              borderRadius="10px"
              boxShadow="lg"
              p={2}
            >
              <Box px={3} py={2} maxW="270px">
                <Text fontWeight="700" noOfLines={1}>
                  {displayName}
                </Text>

                <Text mt={1} color={MUTED} fontSize="xs" noOfLines={1}>
                  {user?.email}
                </Text>

                <Badge mt={3} colorScheme="blue">
                  {roleLabel}
                </Badge>
              </Box>

              <MenuDivider borderColor={BORDER} />

              <MenuItem
                icon={<LogOut size={16} />}
                bg="white"
                borderRadius="6px"
                _hover={{ bg: '#edf7ff' }}
                _focus={{ bg: '#edf7ff' }}
                onClick={signOut}
              >
                Sign out
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      <Box
        maxW="1600px"
        mx="auto"
        px={{ base: 4, md: 8 }}
        py={8}
      >
        <Flex
          mb={7}
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', md: 'center' }}
          gap={4}
        >
          <Box>
            <Text
              as="h2"
              fontSize={{ base: '25px', md: '30px' }}
              fontWeight="800"
              letterSpacing="-0.04em"
            >
              Welcome back, {user?.firstName || 'Administrator'}
            </Text>

            <Text mt={2} color={MUTED} fontSize="sm">
              An overview of your DLinkUp catalogue and orders.
            </Text>
          </Box>

          {canCreateProducts && (
            <Button
              leftIcon={<Plus size={18} />}
              bg={BLUE}
              color="white"
              alignSelf={{ base: 'flex-start', md: 'center' }}
              _hover={{ bg: '#007bdc' }}
              onClick={() => navigate('/admin/products/new')}
            >
              Add Product
            </Button>
          )}
        </Flex>

        {(!token || error) && (
          <Alert status="error" borderRadius="8px" mb={6}>
            <AlertIcon />

            <Text flex={1} fontSize="sm">
              {!token
                ? 'Please sign in to view your dashboard.'
                : error}
            </Text>

            {token && (
              <Button size="sm" onClick={refetch}>
                Retry
              </Button>
            )}
          </Alert>
        )}

        <SimpleGrid
          columns={{ base: 1, sm: 2, xl: 4 }}
          spacing={5}
        >
          {metrics.map((item) => (
            <MetricCard
              key={item.label}
              {...item}
              loading={loading}
            />
          ))}
        </SimpleGrid>

        <SimpleGrid
          columns={{ base: 1, xl: 2 }}
          spacing={6}
          mt={7}
          alignItems="start"
        >
          <Box
            bg="white"
            border="1px solid"
            borderColor={BORDER}
            borderRadius="12px"
            overflow="hidden"
          >
            <PanelHeader
              title="Recent Orders"
              action="View all"
              onClick={() => navigate('/admin/orders')}
            />

            {loading ? (
              <Stack p={6} spacing={4}>
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} h="60px" borderRadius="8px" />
                ))}
              </Stack>
            ) : !dashboard ? (
              <Flex minH="280px" align="center" justify="center" p={6}>
                <Text color={MUTED}>Order information is unavailable.</Text>
              </Flex>
            ) : dashboard.recentOrders.length === 0 ? (
              <Flex
                minH="280px"
                align="center"
                justify="center"
                direction="column"
                gap={3}
              >
                <Icon as={ClipboardList} color="#b0bfd2" boxSize={9} />
                <Text color={MUTED}>No recent orders.</Text>
              </Flex>
            ) : (
              <Stack spacing={0}>
                {dashboard.recentOrders.slice(0, 6).map((order) => (
                  <Flex
                    key={order.id}
                    px={6}
                    py={4}
                    justify="space-between"
                    align="center"
                    gap={4}
                    borderBottom="1px solid"
                    borderColor={BORDER}
                  >
                    <Box minW={0}>
                      <Text fontWeight="700" fontSize="sm" noOfLines={1}>
                        {order.orderNumber}
                      </Text>

                      <Text mt={1} color={MUTED} fontSize="xs">
                        {order.customerName}
                      </Text>

                      {order.status && (
                        <Badge
                          mt={2}
                          colorScheme={statusColor(order.status)}
                          fontSize="10px"
                        >
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </Box>

                    <Text
                      fontWeight="700"
                      fontSize="sm"
                      whiteSpace="nowrap"
                    >
                      {formatCurrency(order.total)}
                    </Text>
                  </Flex>
                ))}
              </Stack>
            )}
          </Box>

          <Box
            bg="white"
            border="1px solid"
            borderColor={BORDER}
            borderRadius="12px"
            overflow="hidden"
          >
            <PanelHeader
              title="Inventory Breakdown"
              action="Manage"
              onClick={() => navigate('/admin/products')}
            />

            {loading ? (
              <Stack p={6} spacing={5}>
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} h="35px" borderRadius="6px" />
                ))}
              </Stack>
            ) : inventory.length === 0 ? (
              <Flex minH="220px" align="center" justify="center" p={6}>
                <Text color={MUTED} textAlign="center">
                  {dashboard
                    ? 'No inventory breakdown available.'
                    : 'Inventory information is unavailable.'}
                </Text>
              </Flex>
            ) : (
              <Stack p={6} spacing={5}>
                {inventory.map((item, index) => (
                  <Box key={`${item.label}-${index}`}>
                    <Flex justify="space-between" gap={3} mb={2}>
                      <Text fontSize="sm" fontWeight="600">
                        {item.label}
                      </Text>

                      <Text color={MUTED} fontSize="sm">
                        {item.count.toLocaleString('en-ZA')}
                      </Text>
                    </Flex>

                    <Box
                      h="8px"
                      bg="#edf2f8"
                      borderRadius="full"
                      overflow="hidden"
                      role="meter"
                      aria-label={item.label}
                      aria-valuemin={0}
                      aria-valuemax={maximumInventory}
                      aria-valuenow={item.count}
                    >
                      <Box
                        h="full"
                        w={`${item.count / maximumInventory * 100}%`}
                        bg={BLUE}
                        borderRadius="full"
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}

            <Box p={6} borderTop="1px solid" borderColor={BORDER}>
              <Text fontWeight="700" fontSize="sm" mb={4}>
                Quick Actions
              </Text>

              <Flex gap={3} wrap="wrap">
                {canCreateProducts && (
                  <Button
                    size="sm"
                    leftIcon={<Plus size={15} />}
                    bg={BLUE}
                    color="white"
                    _hover={{ bg: '#007bdc' }}
                    onClick={() => navigate('/admin/products/new')}
                  >
                    Add Product
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  borderColor={BORDER}
                  onClick={() => navigate('/admin/products')}
                >
                  Manage Products
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  borderColor={BORDER}
                  onClick={() => navigate('/admin/orders')}
                >
                  View Orders
                </Button>
              </Flex>
            </Box>
          </Box>
        </SimpleGrid>
      </Box>
    </Box>
  )
}