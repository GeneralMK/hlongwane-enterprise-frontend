import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  VStack
} from '@chakra-ui/react'
import {
  DollarSign,
  RefreshCcw,
  Star,
  TrendingUp,
  Users
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
  BarChart,
  DataRow,
  Panel,
  PieChart,
  StatCard,
  StatGrid
} from '../components'

type CustomerSegment =
  | 'VIP'
  | 'REGULAR'
  | 'NEW'

type CustomerSummary = {
  totalCustomers: number
  customersThisMonth: number

  averageCustomerValue: number

  repeatRate: number
  repeatRateChange: number

  averageRating: number
  totalReviews: number
}

type CustomerGrowthPoint = {
  month: string
  value: number
}

type CustomerSegmentData = {
  vip: number
  regular: number
  new: number
}

type TopCustomer = {
  id: string
  name: string
  email: string | null
  orderCount: number
  totalSpent: number
  segment: CustomerSegment
}

type CustomerInsightsData = {
  summary: CustomerSummary

  customerGrowth:
    CustomerGrowthPoint[]

  customerSegments:
    CustomerSegmentData

  topCustomers:
    TopCustomer[]

  generatedAt?: string
}

type CustomerInsightsResponse = {
  ok?: boolean
  message?: string
  error?: string
  data?: CustomerInsightsData
}

const EMPTY_DATA:
  CustomerInsightsData = {
    summary: {
      totalCustomers: 0,
      customersThisMonth: 0,
      averageCustomerValue: 0,
      repeatRate: 0,
      repeatRateChange: 0,
      averageRating: 0,
      totalReviews: 0
    },

    customerGrowth: [],

    customerSegments: {
      vip: 0,
      regular: 0,
      new: 0
    },

    topCustomers: []
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

function getJwt():
  string | null {
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

function formatPercentage(
  value:
    | number
    | null
    | undefined
) {
  const percentage =
    Number(
      value ?? 0
    )

  return `${Number.isFinite(percentage)
    ? percentage.toFixed(1)
    : '0.0'}%`
}

function formatRating(
  value:
    | number
    | null
    | undefined
) {
  const rating =
    Number(
      value ?? 0
    )

  return Number.isFinite(rating)
    ? rating.toFixed(1)
    : '0.0'
}

function getSegmentColor(
  segment: CustomerSegment
) {
  switch (segment) {
    case 'VIP':
      return 'green'

    case 'REGULAR':
      return 'blue'

    case 'NEW':
      return 'purple'

    default:
      return 'gray'
  }
}

function getRepeatRateHelper(
  change: number
) {
  if (change > 0) {
    return `+${change.toFixed(1)}% from last month`
  }

  if (change < 0) {
    return `${change.toFixed(1)}% from last month`
  }

  return 'No change from last month'
}

export default function CustomerInsights() {
  const [
    insights,
    setInsights
  ] =
    useState<CustomerInsightsData>(
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

  const loadInsights =
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
              `${API_BASE_URL}/api/admin/analytics/customer-insights`,
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
            CustomerInsightsResponse =
              {}

          if (
            responseText.trim()
          ) {
            try {
              payload =
                JSON.parse(
                  responseText
                ) as CustomerInsightsResponse
            } catch {
              throw new Error(
                `The customer insights API returned an invalid response with status ${response.status}.`
              )
            }
          }

          if (!response.ok) {
            throw new Error(
              payload.message ||
              payload.error ||
              `Unable to load customer insights. Status ${response.status}.`
            )
          }

          if (!payload.data) {
            throw new Error(
              'The customer insights API returned an incomplete response.'
            )
          }

          setInsights({
            summary: {
              ...EMPTY_DATA.summary,
              ...payload.data.summary
            },

            customerGrowth:
              Array.isArray(
                payload.data
                  .customerGrowth
              )
                ? payload.data
                    .customerGrowth
                : [],

            customerSegments: {
              ...EMPTY_DATA
                .customerSegments,

              ...payload.data
                .customerSegments
            },

            topCustomers:
              Array.isArray(
                payload.data
                  .topCustomers
              )
                ? payload.data
                    .topCustomers
                : [],

            generatedAt:
              payload.data
                .generatedAt
          })
        } catch (
          requestError
        ) {
          setError(
            requestError instanceof
              Error
              ? requestError.message
              : 'Unable to load customer insights.'
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
      void loadInsights()
    },
    [
      loadInsights
    ]
  )

  const customerGrowthValues =
    useMemo(
      () =>
        insights.customerGrowth.map(
          point =>
            point.value
        ),
      [
        insights.customerGrowth
      ]
    )

  const customerGrowthMaximum =
    useMemo(
      () =>
        Math.max(
          ...customerGrowthValues,
          1
        ),
      [
        customerGrowthValues
      ]
    )

  const customerSegmentValues =
    useMemo(
      () => [
        insights.customerSegments.vip,
        insights.customerSegments.regular,
        insights.customerSegments.new
      ],
      [
        insights.customerSegments
      ]
    )

  return (
    <PageWrap
      title="Customer Insights"
      subtitle="Understand your customer base and behavior"
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
            void loadInsights(
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
                base: 'flex-start',
                md: 'center'
              }}
              direction={{
                base: 'column',
                md: 'row'
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
                  void loadInsights()
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
                Loading customer insights...
              </Text>
            </VStack>
          </Center>
        ) : (
          <>
            <StatGrid>
              <StatCard
                title="Total Customers"
                value={String(
                  insights.summary
                    .totalCustomers
                )}
                helper={`+${
                  insights.summary
                    .customersThisMonth
                } this month`}
                icon={Users}
              />

              <StatCard
                title="Avg Customer Value"
                value={formatCurrency(
                  insights.summary
                    .averageCustomerValue
                )}
                helper="Lifetime value"
                icon={DollarSign}
              />

              <StatCard
                title="Repeat Rate"
                value={formatPercentage(
                  insights.summary
                    .repeatRate
                )}
                helper={getRepeatRateHelper(
                  insights.summary
                    .repeatRateChange
                )}
                helperColor={
                  insights.summary
                    .repeatRateChange <
                  0
                    ? 'red.500'
                    : 'green.600'
                }
                icon={TrendingUp}
              />

              <StatCard
                title="Avg Rating"
                value={formatRating(
                  insights.summary
                    .averageRating
                )}
                helper={`Based on ${
                  insights.summary
                    .totalReviews
                } reviews`}
                icon={Star}
              />
            </StatGrid>

            <SimpleGrid
              columns={{
                base: 1,
                xl: 2
              }}
              spacing={4}
            >
              <Panel title="Customer Growth">
                {insights
                  .customerGrowth
                  .length === 0 ? (
                  <Center py={16}>
                    <Text
                      color="gray.500"
                      fontSize="sm"
                    >
                      No customer growth data is available.
                    </Text>
                  </Center>
                ) : (
                  <VStack
                    align="stretch"
                    spacing={4}
                  >
                    <BarChart
                      values={
                        customerGrowthValues
                      }
                      max={
                        customerGrowthMaximum
                      }
                    />

                    <SimpleGrid
                      columns={
                        insights
                          .customerGrowth
                          .length
                      }
                      spacing={1}
                    >
                      {insights
                        .customerGrowth
                        .map(
                          point => (
                            <Text
                              key={
                                point.month
                              }
                              textAlign="center"
                              fontSize="xs"
                              color="gray.500"
                            >
                              {point.month}
                            </Text>
                          )
                        )}
                    </SimpleGrid>
                  </VStack>
                )}
              </Panel>

              <Panel title="Customer Segments">
                {customerSegmentValues.every(
                  value =>
                    value === 0
                ) ? (
                  <Center py={16}>
                    <Text
                      color="gray.500"
                      fontSize="sm"
                    >
                      No customer segment data is available.
                    </Text>
                  </Center>
                ) : (
                  <VStack
                    align="stretch"
                    spacing={5}
                  >
                    <PieChart
                      values={
                        customerSegmentValues
                      }
                    />

                    <HStack
                      justify="center"
                      spacing={5}
                      flexWrap="wrap"
                    >
                      <HStack spacing={2}>
                        <Box
                          boxSize="10px"
                          borderRadius="full"
                          bg="green.500"
                        />

                        <Text fontSize="sm">
                          VIP (
                          {
                            insights
                              .customerSegments
                              .vip
                          }
                          )
                        </Text>
                      </HStack>

                      <HStack spacing={2}>
                        <Box
                          boxSize="10px"
                          borderRadius="full"
                          bg="blue.500"
                        />

                        <Text fontSize="sm">
                          Regular (
                          {
                            insights
                              .customerSegments
                              .regular
                          }
                          )
                        </Text>
                      </HStack>

                      <HStack spacing={2}>
                        <Box
                          boxSize="10px"
                          borderRadius="full"
                          bg="purple.500"
                        />

                        <Text fontSize="sm">
                          New (
                          {
                            insights
                              .customerSegments
                              .new
                          }
                          )
                        </Text>
                      </HStack>
                    </HStack>
                  </VStack>
                )}
              </Panel>
            </SimpleGrid>

            <Panel title="Top Customers by Spending">
              {insights
                .topCustomers
                .length === 0 ? (
                <Center py={12}>
                  <Text
                    color="gray.500"
                    fontSize="sm"
                  >
                    No customer spending data is available.
                  </Text>
                </Center>
              ) : (
                insights
                  .topCustomers
                  .map(
                    (
                      customer,
                      index
                    ) => (
                      <DataRow
                        key={
                          customer.id
                        }
                        border={
                          index <
                          insights
                            .topCustomers
                            .length -
                            1
                        }
                        left={
                          <Box>
                            <Text fontWeight="600">
                              #{index + 1}{' '}
                              {customer.name}
                            </Text>

                            <Text
                              fontSize="sm"
                              color="gray.500"
                            >
                              {customer.orderCount}{' '}
                              {customer.orderCount ===
                              1
                                ? 'order'
                                : 'orders'}
                            </Text>
                          </Box>
                        }
                        right={
                          <Box textAlign="right">
                            <Text fontWeight="600">
                              {formatCurrency(
                                customer.totalSpent
                              )}
                            </Text>

                            <Badge
                              mt={1}
                              colorScheme={getSegmentColor(
                                customer.segment
                              )}
                              borderRadius="full"
                              textTransform="none"
                            >
                              {customer.segment ===
                              'REGULAR'
                                ? 'Regular'
                                : customer.segment ===
                                    'NEW'
                                  ? 'New'
                                  : 'VIP'}
                            </Badge>
                          </Box>
                        }
                      />
                    )
                  )
              )}
            </Panel>
          </>
        )}
      </VStack>
    </PageWrap>
  )
}