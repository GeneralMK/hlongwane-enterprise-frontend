import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  SimpleGrid,
  Spinner,
  Text,
  VStack
} from '@chakra-ui/react'
import {
  AlertTriangle,
  CheckCircle,
  Package,
  RefreshCcw,
  TrendingDown
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  PageWrap
} from '../../../layout'
import {
  DataRow,
  Panel,
  ProgressItem,
  StatCard,
  StatGrid
} from '../components'

type InventorySummary = {
  totalItems: number
  productsAvailable: number
  lowStock: number
  outOfStock: number
}

type StockLevel = {
  id: string
  name: string
  category: string
  stockQuantity: number
  maximumStock: number
  stockPercentage: number
  availability: string
}

type MaintenanceItem = {
  id: string
  itemId: string
  itemName: string
  lastMaintenanceDate: string | null
  nextMaintenanceDate: string | null
  condition: string
  status: string
}

type InventoryValue = {
  totalValue: number
  availableValue: number
  averageProductValue: number
}

type InventoryStatusData = {
  summary: InventorySummary
  stockLevels: StockLevel[]
  upcomingMaintenance: MaintenanceItem[]
  inventoryValue: InventoryValue
}

type InventoryApiResponse = {
  ok?: boolean
  data?: InventoryStatusData
  message?: string
  error?: string
}

const EMPTY_DATA: InventoryStatusData = {
  summary: {
    totalItems: 0,
    productsAvailable: 0,
    lowStock: 0,
    outOfStock: 0
  },

  stockLevels: [],

  upcomingMaintenance: [],

  inventoryValue: {
    totalValue: 0,
    availableValue: 0,
    averageProductValue: 0
  }
}

const API_BASE_URL =
  (
    import.meta.env
      .VITE_APP_API_HOST ??
    ''
  ).replace(
    /\/+$/,
    ''
  )

function getJwt(): string | null {
  const directJwt =
    localStorage.getItem(
      'MFS_PORTAL.jwt'
    )

  if (directJwt) {
    return directJwt
  }

  const portalValue =
    localStorage.getItem(
      'MFS_PORTAL'
    )

  if (!portalValue) {
    return null
  }

  try {
    const parsed =
      JSON.parse(
        portalValue
      ) as {
        jwt?: string
        token?: string
        accessToken?: string
      }

    return (
      parsed.jwt ??
      parsed.token ??
      parsed.accessToken ??
      null
    )
  } catch {
    return null
  }
}

function formatCurrency(
  value:
    | number
    | string
    | null
    | undefined
) {
  const amount =
    Number(
      value ?? 0
    )

  return new Intl.NumberFormat(
    'en-ZA',
    {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  ).format(
    Number.isFinite(amount)
      ? amount
      : 0
  )
}

function formatDate(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return 'Not recorded'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Not recorded'
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

function formatLabel(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return 'Unknown'
  }

  return value
    .toLowerCase()
    .split('_')
    .map(
      word =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(' ')
}

function getConditionColor(
  condition: string
) {
  switch (
    condition.toUpperCase()
  ) {
    case 'EXCELLENT':
      return 'green'

    case 'GOOD':
      return 'blue'

    case 'FAIR':
      return 'yellow'

    case 'POOR':
      return 'orange'

    case 'DAMAGED':
      return 'red'

    default:
      return 'gray'
  }
}

function getProgressColor(
  percentage: number
) {
  if (
    percentage === 0
  ) {
    return 'red'
  }

  if (
    percentage <= 25
  ) {
    return 'orange'
  }

  if (
    percentage <= 50
  ) {
    return 'yellow'
  }

  return 'green'
}

export default function InventoryStatus() {
  const [
    inventory,
    setInventory
  ] =
    useState<InventoryStatusData>(
      EMPTY_DATA
    )

  const [
    loading,
    setLoading
  ] =
    useState(true)

  const [
    refreshing,
    setRefreshing
  ] =
    useState(false)

  const [
    error,
    setError
  ] =
    useState<string | null>(
      null
    )

  const loadInventory =
    useCallback(
      async (
        isRefresh = false
      ) => {
        if (isRefresh) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }

        setError(null)

        try {
          const token =
            getJwt()

          if (!token) {
            throw new Error(
              'Your administrator session could not be found.'
            )
          }

          const response =
            await fetch(
              `${API_BASE_URL}/api/admin/analytics/inventory-status`,
              {
                method: 'GET',

                headers: {
                  Accept:
                    'application/json',

                  Authorization:
                    `Bearer ${token}`,

                  'ngrok-skip-browser-warning':
                    'true'
                },

                credentials:
                  'include'
              }
            )

          const responseText =
            await response.text()

          let payload:
            InventoryApiResponse =
              {}

          if (
            responseText.trim()
          ) {
            try {
              payload =
                JSON.parse(
                  responseText
                ) as InventoryApiResponse
            } catch {
              throw new Error(
                `The inventory API returned an invalid response with status ${response.status}.`
              )
            }
          }

          if (!response.ok) {
            throw new Error(
              payload.message ||
              payload.error ||
              `Unable to load inventory. Status ${response.status}.`
            )
          }

          if (!payload.data) {
            throw new Error(
              'The inventory API returned an incomplete response.'
            )
          }

          setInventory({
            summary: {
              ...EMPTY_DATA.summary,
              ...payload.data.summary
            },

            stockLevels:
              Array.isArray(
                payload.data
                  .stockLevels
              )
                ? payload.data
                    .stockLevels
                : [],

            upcomingMaintenance:
              Array.isArray(
                payload.data
                  .upcomingMaintenance
              )
                ? payload.data
                    .upcomingMaintenance
                : [],

            inventoryValue: {
              ...EMPTY_DATA
                .inventoryValue,

              ...payload.data
                .inventoryValue
            }
          })
        } catch (
          requestError
        ) {
          setError(
            requestError instanceof
              Error
              ? requestError.message
              : 'Unable to load inventory status.'
          )
        } finally {
          setLoading(false)
          setRefreshing(false)
        }
      },
      []
    )

  useEffect(
    () => {
      void loadInventory()
    },
    [
      loadInventory
    ]
  )

  const stockLevels =
    useMemo(
      () =>
        [...inventory.stockLevels]
          .sort(
            (
              first,
              second
            ) =>
              first.stockPercentage -
              second.stockPercentage
          ),
      [
        inventory.stockLevels
      ]
    )

  return (
    <PageWrap
      title="Inventory Status Overview"
      subtitle="Monitor stock levels and product availability"
      rightElements={
        <Button
          size="sm"
          variant="outline"
          leftIcon={
            <RefreshCcw
              size={16}
            />
          }
          isLoading={
            refreshing
          }
          loadingText="Refreshing"
          onClick={() =>
            void loadInventory(
              true
            )
          }
        >
          Refresh
        </Button>
      }
    >
      <VStack
        align="stretch"
        spacing={5}
      >
        {error ? (
          <Alert
            status="error"
            borderRadius="10px"
          >
            <AlertIcon />

            <Flex
              flex="1"
              justify="space-between"
              align={{
                base:
                  'flex-start',
                md:
                  'center'
              }}
              direction={{
                base:
                  'column',
                md:
                  'row'
              }}
              gap={3}
            >
              <Text>
                {error}
              </Text>

              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void loadInventory()
                }
              >
                Try Again
              </Button>
            </Flex>
          </Alert>
        ) : null}

        {loading ? (
          <Center py={20}>
            <VStack spacing={4}>
              <Spinner
                size="lg"
                color="green.600"
              />

              <Text
                color="gray.500"
                fontSize="sm"
              >
                Loading inventory status...
              </Text>
            </VStack>
          </Center>
        ) : (
          <>
            <StatGrid>
              <StatCard
                title="Total Items"
                value={String(
                  inventory.summary
                    .totalItems
                )}
                helper="Units currently recorded"
                icon={Package}
              />

              <StatCard
                title="Products Available"
                value={String(
                  inventory.summary
                    .productsAvailable
                )}
                helper="Ready to sell or rent"
                icon={CheckCircle}
              />

              <StatCard
                title="Low Stock"
                value={String(
                  inventory.summary
                    .lowStock
                )}
                helper="Needs attention"
                icon={AlertTriangle}
                helperColor="orange.500"
              />

              <StatCard
                title="Out of Stock"
                value={String(
                  inventory.summary
                    .outOfStock
                )}
                helper="Immediate action"
                icon={TrendingDown}
                helperColor="red.500"
              />
            </StatGrid>

            <Panel title="Current Stock Levels">
              {stockLevels.length ===
              0 ? (
                <Center py={10}>
                  <Text
                    color="gray.500"
                    fontSize="sm"
                  >
                    No inventory items were found.
                  </Text>
                </Center>
              ) : (
                <VStack
                  align="stretch"
                  spacing={5}
                >
                  {stockLevels.map(
                    item => (
                      <Box
                        key={item.id}
                      >
                        <ProgressItem
                          name={item.name}
                          helper={
                            item.category ||
                            'Uncategorised'
                          }
                          value={
                            item.stockPercentage
                          }
                          badge={`${item.stockQuantity} ${
                            item.stockQuantity ===
                            1
                              ? 'unit'
                              : 'units'
                          }`}
                        />

                        <Flex
                          mt={1}
                          justify="space-between"
                          align="center"
                        >
                          <Badge
                            colorScheme={getProgressColor(
                              item.stockPercentage
                            )}
                            borderRadius="full"
                            textTransform="none"
                          >
                            {formatLabel(
                              item.availability
                            )}
                          </Badge>

                          <Text
                            fontSize="xs"
                            color="gray.500"
                          >
                            Target capacity:{' '}
                            {item.maximumStock}
                          </Text>
                        </Flex>
                      </Box>
                    )
                  )}
                </VStack>
              )}
            </Panel>

            <Panel title="Upcoming Maintenance">
              {inventory
                .upcomingMaintenance
                .length === 0 ? (
                <Center py={10}>
                  <Text
                    color="gray.500"
                    fontSize="sm"
                  >
                    No upcoming maintenance is scheduled.
                  </Text>
                </Center>
              ) : (
                inventory
                  .upcomingMaintenance
                  .map(
                    (
                      item,
                      index
                    ) => (
                      <DataRow
                        key={item.id}
                        border={
                          index <
                          inventory
                            .upcomingMaintenance
                            .length -
                            1
                        }
                        left={
                          <Box>
                            <Text fontWeight="500">
                              {item.itemName}
                            </Text>

                            <Text
                              fontSize="sm"
                              color="gray.500"
                            >
                              Last:{' '}
                              {formatDate(
                                item.lastMaintenanceDate
                              )}
                            </Text>
                          </Box>
                        }
                        right={
                          <Box textAlign="right">
                            <Text fontSize="sm">
                              Next:{' '}
                              {formatDate(
                                item.nextMaintenanceDate
                              )}
                            </Text>

                            <Badge
                              mt={1}
                              borderRadius="full"
                              colorScheme={getConditionColor(
                                item.condition
                              )}
                              textTransform="none"
                            >
                              {formatLabel(
                                item.condition
                              )}
                            </Badge>
                          </Box>
                        }
                      />
                    )
                  )
              )}
            </Panel>

            <Panel title="Inventory Value">
              <SimpleGrid
                columns={{
                  base: 1,
                  md: 3
                }}
                spacing={4}
              >
                {[
                  {
                    label:
                      'Total Value',

                    value:
                      inventory
                        .inventoryValue
                        .totalValue
                  },
                  {
                    label:
                      'Available Value',

                    value:
                      inventory
                        .inventoryValue
                        .availableValue
                  },
                  {
                    label:
                      'Average Product Value',

                    value:
                      inventory
                        .inventoryValue
                        .averageProductValue
                  }
                ].map(
                  item => (
                    <Box
                      key={item.label}
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="10px"
                      p={4}
                    >
                      <Text color="gray.500">
                        {item.label}
                      </Text>

                      <Text
                        fontSize="2xl"
                        fontWeight="700"
                      >
                        {formatCurrency(
                          item.value
                        )}
                      </Text>
                    </Box>
                  )
                )}
              </SimpleGrid>
            </Panel>
          </>
        )}
      </VStack>
    </PageWrap>
  )
}