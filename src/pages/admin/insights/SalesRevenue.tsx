import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  SimpleGrid,
  Skeleton,
  Text,
  VStack
} from '@chakra-ui/react'

import {
  DollarSign,
  RefreshCcw,
  ShoppingCart,
  TrendingUp
} from 'lucide-react'

import {
  useMemo,
  useState
} from 'react'

import PieChart from '../../../components/PieChart'

import {
  useSalesRevenueAnalytics
} from '../../../hooks/useSalesRevenueAnalytics'

import {
  PageWrap
} from '../../../layout'

import {
  BarChart,
  DataRow,
  LineChart,
  Panel,
  StatCard,
  StatGrid
} from '../components'

function formatDateInput(
  date: Date
): string {
  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0')

  const day =
    String(
      date.getDate()
    ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getSixMonthsAgo(): string {
  const date = new Date()

  date.setMonth(
    date.getMonth() - 5
  )

  date.setDate(1)

  return formatDateInput(date)
}

function getToday(): string {
  return formatDateInput(
    new Date()
  )
}

function getStartOfDayISOString(
  value: string
): string {
  const date =
    new Date(
      `${value}T00:00:00`
    )

  return date.toISOString()
}

function getEndOfDayISOString(
  value: string
): string {
  const date =
    new Date(
      `${value}T23:59:59.999`
    )

  return date.toISOString()
}

function formatCurrency(
  amount: number,
  currency = 'ZAR'
): string {
  try {
    return new Intl.NumberFormat(
      'en-ZA',
      {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    ).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString(
      'en-ZA',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    )}`
  }
}

function formatGrowth(
  percentage: number | null
): string {
  if (percentage === null) {
    return (
      'No previous-period baseline'
    )
  }

  const prefix =
    percentage > 0
      ? '+'
      : ''

  return `${prefix}${percentage.toFixed(
    1
  )}% vs previous period`
}

function LoadingState() {
  return (
    <VStack
      align="stretch"
      spacing={5}
    >
      <SimpleGrid
        columns={{
          base: 1,
          md: 3
        }}
        spacing={4}
      >
        {[1, 2, 3].map(
          (item) => (
            <Skeleton
              key={item}
              h="132px"
              borderRadius="16px"
            />
          )
        )}
      </SimpleGrid>

      <Skeleton
        h="340px"
        borderRadius="16px"
      />

      <SimpleGrid
        columns={{
          base: 1,
          xl: 2
        }}
        spacing={4}
      >
        <Skeleton
          h="300px"
          borderRadius="16px"
        />

        <Skeleton
          h="300px"
          borderRadius="16px"
        />
      </SimpleGrid>
    </VStack>
  )
}

function EmptyMessage({
  text
}: {
  text: string
}) {
  return (
    <HStack
      minH="180px"
      justify="center"
      px={5}
      textAlign="center"
    >
      <Text color="gray.500">
        {text}
      </Text>
    </HStack>
  )
}

export default function SalesRevenue() {
  const [from, setFrom] =
    useState(
      getSixMonthsAgo
    )

  const [to, setTo] =
    useState(getToday)

  const dateRangeIsValid =
    Boolean(from) &&
    Boolean(to) &&
    from <= to

  const analyticsFrom =
    dateRangeIsValid
      ? getStartOfDayISOString(
          from
        )
      : new Date().toISOString()

  const analyticsTo =
    dateRangeIsValid
      ? getEndOfDayISOString(to)
      : new Date().toISOString()

  const {
    data,
    error,
    isLoading,
    isRefreshing,
    refetch
  } = useSalesRevenueAnalytics({
    from: analyticsFrom,
    to: analyticsTo
  })

  const revenueValues =
    useMemo(
      () =>
        data?.revenueTrend.map(
          (item) => item.revenue
        ) ?? [],
      [data]
    )

  const revenueLabels =
    useMemo(
      () =>
        data?.revenueTrend.map(
          (item) => item.label
        ) ?? [],
      [data]
    )

  const orderValues =
    useMemo(
      () =>
        data?.ordersByMonth.map(
          (item) => item.orders
        ) ?? [],
      [data]
    )

  const orderLabels =
    useMemo(
      () =>
        data?.ordersByMonth.map(
          (item) => item.label
        ) ?? [],
      [data]
    )

  const maximumOrders =
    useMemo(() => {
      const largest =
        Math.max(
          ...orderValues,
          0
        )

      return largest > 0
        ? Math.ceil(
            largest / 10
          ) * 10
        : 10
    }, [orderValues])

  const handleRefresh =
    async () => {
      if (
        !dateRangeIsValid
      ) {
        return
      }

      await refetch()
    }

  return (
    <PageWrap
      title="Sales & Revenue Insights"
      subtitle="Live sales analytics generated from successful Paystack transactions"
    >
      <VStack
        align="stretch"
        spacing={5}
      >
        <Panel title="Analytics Period">
          <Flex
            gap={4}
            align={{
              base: 'stretch',
              md: 'end'
            }}
            direction={{
              base: 'column',
              md: 'row'
            }}
          >
            <FormControl
              maxW={{
                md: '220px'
              }}
              isInvalid={
                Boolean(from) &&
                Boolean(to) &&
                from > to
              }
            >
              <FormLabel fontSize="sm">
                From
              </FormLabel>

              <Input
                type="date"
                value={from}
                max={to || getToday()}
                onChange={(
                  event
                ) =>
                  setFrom(
                    event.target
                      .value
                  )
                }
              />
            </FormControl>

            <FormControl
              maxW={{
                md: '220px'
              }}
              isInvalid={
                Boolean(from) &&
                Boolean(to) &&
                from > to
              }
            >
              <FormLabel fontSize="sm">
                To
              </FormLabel>

              <Input
                type="date"
                value={to}
                min={from}
                max={getToday()}
                onChange={(
                  event
                ) =>
                  setTo(
                    event.target
                      .value
                  )
                }
              />
            </FormControl>

            <Button
              leftIcon={
                <RefreshCcw
                  size={17}
                />
              }
              onClick={
                handleRefresh
              }
              isLoading={
                isRefreshing
              }
              loadingText="Refreshing"
              isDisabled={
                !dateRangeIsValid
              }
              colorScheme="blue"
            >
              Refresh
            </Button>

            {data && (
              <Text
                ml={{
                  md: 'auto'
                }}
                fontSize="sm"
                color="gray.500"
              >
                Updated{' '}
                {new Intl.DateTimeFormat(
                  'en-ZA',
                  {
                    dateStyle:
                      'medium',
                    timeStyle:
                      'short'
                  }
                ).format(
                  new Date(
                    data.generatedAt
                  )
                )}
              </Text>
            )}
          </Flex>
        </Panel>

        {!dateRangeIsValid && (
          <Alert
            status="warning"
            borderRadius="12px"
          >
            <AlertIcon />

            <AlertDescription>
              The start date
              cannot be after
              the end date.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert
            status="error"
            borderRadius="12px"
          >
            <AlertIcon />

            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <LoadingState />
        ) : data ? (
          <>
            <StatGrid>
              <StatCard
                title="Total Revenue"
                value={formatCurrency(
                  data.totalRevenue,
                  data.currency
                )}
                helper={formatGrowth(
                  data.revenueGrowthPercentage
                )}
                icon={
                  DollarSign
                }
              />

              <StatCard
                title="Total Orders"
                value={data.totalOrders.toLocaleString(
                  'en-ZA'
                )}
                helper={formatGrowth(
                  data.orderGrowthPercentage
                )}
                icon={
                  ShoppingCart
                }
              />

              <StatCard
                title="Average Order Value"
                value={formatCurrency(
                  data.averageOrderValue,
                  data.currency
                )}
                helper={formatGrowth(
                  data.averageOrderValueGrowthPercentage
                )}
                icon={
                  TrendingUp
                }
              />
            </StatGrid>

            <Panel title="Revenue Trend">
              {revenueValues.some(
                (value) =>
                  value > 0
              ) ? (
                <LineChart
                  values={
                    revenueValues
                  }
                  labels={
                    revenueLabels
                  }
                  fill
                />
              ) : (
                <EmptyMessage text="No revenue was recorded for this period." />
              )}
            </Panel>

            <SimpleGrid
              columns={{
                base: 1,
                xl: 2
              }}
              spacing={4}
            >
              <Panel title="Orders by Month">
                {orderValues.some(
                  (value) =>
                    value > 0
                ) ? (
                  <BarChart
                    values={
                      orderValues
                    }
                    labels={
                      orderLabels
                    }
                    max={
                      maximumOrders
                    }
                  />
                ) : (
                  <EmptyMessage text="No orders were recorded for this period." />
                )}
              </Panel>

              <Panel title="Sales by Category">
                {data
                  .salesByCategory
                  .length > 0 ? (
                  <PieChart
                    data={data.salesByCategory.map(
                      (
                        category
                      ) => ({
                        label:
                          category.category,
                        value:
                          category.revenue
                      })
                    )}
                  />
                ) : (
                  <EmptyMessage text="Paystack transactions do not contain category metadata yet." />
                )}
              </Panel>
            </SimpleGrid>

            <Panel title="Top Selling Products">
              {data.topProducts
                .length === 0 ? (
                <EmptyMessage text="Paystack transactions do not contain product metadata yet." />
              ) : (
                data.topProducts.map(
                  (
                    product,
                    index
                  ) => (
                    <DataRow
                      key={
                        product.productId
                      }
                      border={
                        index <
                        data
                          .topProducts
                          .length -
                          1
                      }
                      left={
                        <Box>
                          <Text fontWeight="600">
                            #
                            {index +
                              1}{' '}
                            {
                              product.productName
                            }
                          </Text>

                          <Text
                            fontSize="sm"
                            color="gray.500"
                          >
                            {product.quantity.toLocaleString(
                              'en-ZA'
                            )}{' '}
                            units
                            sold
                          </Text>
                        </Box>
                      }
                      right={
                        <Text fontWeight="600">
                          {formatCurrency(
                            product.revenue,
                            data.currency
                          )}
                        </Text>
                      }
                    />
                  )
                )
              )}
            </Panel>
          </>
        ) : (
          <EmptyMessage text="No analytics information is available." />
        )}
      </VStack>
    </PageWrap>
  )
}