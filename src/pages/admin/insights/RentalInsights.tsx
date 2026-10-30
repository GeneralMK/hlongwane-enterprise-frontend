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
  CalendarDays,
  DollarSign,
  Package,
  RefreshCcw,
  TrendingUp
} from 'lucide-react'

import {
  useMemo,
  useState
} from 'react'

import {
  useRentalInsights
} from '../../../hooks/useRentalInsights'

import {
  PageWrap
} from '../../../layout'

import {
  BarChart,
  LineChart,
  Panel,
  ProgressItem,
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
  const date =
    new Date()

  date.setMonth(
    date.getMonth() - 5
  )

  date.setDate(1)

  return formatDateInput(
    date
  )
}

function getToday(): string {
  return formatDateInput(
    new Date()
  )
}

function toStartOfDayIso(
  value: string
): string {
  return new Date(
    `${value}T00:00:00.000`
  ).toISOString()
}

function toEndOfDayIso(
  value: string
): string {
  return new Date(
    `${value}T23:59:59.999`
  ).toISOString()
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
      'en-ZA'
    )}`
  }
}

function formatGrowth(
  percentage: number | null,
  fallback: string
): string {
  if (
    percentage === null
  ) {
    return fallback
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
          md: 2,
          xl: 4
        }}
        spacing={4}
      >
        {[1, 2, 3, 4].map(
          (item) => (
            <Skeleton
              key={item}
              h="132px"
              borderRadius="16px"
            />
          )
        )}
      </SimpleGrid>

      <SimpleGrid
        columns={{
          base: 1,
          xl: 2
        }}
        spacing={4}
      >
        <Skeleton
          h="330px"
          borderRadius="16px"
        />

        <Skeleton
          h="330px"
          borderRadius="16px"
        />
      </SimpleGrid>

      <Skeleton
        h="360px"
        borderRadius="16px"
      />

      <Skeleton
        h="220px"
        borderRadius="16px"
      />
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
      textAlign="center"
      px={5}
    >
      <Text color="gray.500">
        {text}
      </Text>
    </HStack>
  )
}

export default function RentalInsights() {
  const [
    from,
    setFrom
  ] =
    useState(
      getSixMonthsAgo
    )

  const [
    to,
    setTo
  ] =
    useState(
      getToday
    )

  const dateRangeIsValid =
    Boolean(from) &&
    Boolean(to) &&
    from <= to

  const analyticsFrom =
    dateRangeIsValid
      ? toStartOfDayIso(
          from
        )
      : new Date().toISOString()

  const analyticsTo =
    dateRangeIsValid
      ? toEndOfDayIso(
          to
        )
      : new Date().toISOString()

  const {
    data,
    error,
    isLoading,
    isRefreshing,
    refetch
  } =
    useRentalInsights({
      from:
        analyticsFrom,

      to:
        analyticsTo
    })

  const rentalValues =
    useMemo(
      () =>
        data?.rentalTrend.map(
          (item) =>
            item.rentals
        ) ?? [],
      [data]
    )

  const rentalLabels =
    useMemo(
      () =>
        data?.rentalTrend.map(
          (item) =>
            item.label
        ) ?? [],
      [data]
    )

  const revenueValues =
    useMemo(
      () =>
        data?.revenueTrend.map(
          (item) =>
            item.revenue
        ) ?? [],
      [data]
    )

  const revenueLabels =
    useMemo(
      () =>
        data?.revenueTrend.map(
          (item) =>
            item.label
        ) ?? [],
      [data]
    )

  const maximumRentals =
    useMemo(() => {
      const largest =
        Math.max(
          ...rentalValues,
          0
        )

      return largest > 0
        ? Math.ceil(
            largest / 10
          ) * 10
        : 10
    }, [rentalValues])

  const maximumRevenue =
    useMemo(() => {
      const largest =
        Math.max(
          ...revenueValues,
          0
        )

      if (largest <= 0) {
        return 1000
      }

      const magnitude =
        10 **
        Math.floor(
          Math.log10(
            largest
          )
        )

      return (
        Math.ceil(
          largest /
            magnitude
        ) * magnitude
      )
    }, [revenueValues])

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
      title="Rental Insights"
      subtitle="Track live rental performance, utilization and revenue"
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
                max={
                  to ||
                  getToday()
                }
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
                title="Active Rentals"
                value={data.activeRentals.toLocaleString(
                  'en-ZA'
                )}
                helper={`${data.overdueRentals.toLocaleString(
                  'en-ZA'
                )} overdue`}
                icon={
                  CalendarDays
                }
              />

              <StatCard
                title="Rental Revenue"
                value={formatCurrency(
                  data.rentalRevenue,
                  data.currency
                )}
                helper={formatGrowth(
                  data.revenueGrowthPercentage,
                  'No previous revenue baseline'
                )}
                icon={
                  DollarSign
                }
              />

              <StatCard
                title="Avg Utilization"
                value={`${data.averageUtilization}%`}
                helper="Across rented equipment"
                icon={
                  TrendingUp
                }
              />

              <StatCard
                title="Total Rentals"
                value={data.totalRentals.toLocaleString(
                  'en-ZA'
                )}
                helper={formatGrowth(
                  data.rentalGrowthPercentage,
                  'No previous rental baseline'
                )}
                icon={
                  Package
                }
              />
            </StatGrid>

            <SimpleGrid
              columns={{
                base: 1,
                xl: 2
              }}
              spacing={4}
            >
              <Panel title="Rental Activity Trend">
                {rentalValues.some(
                  (value) =>
                    value > 0
                ) ? (
                  <LineChart
                    values={
                      rentalValues
                    }
                    labels={
                      rentalLabels
                    }
                    max={
                      maximumRentals
                    }
                  />
                ) : (
                  <EmptyMessage text="No rental activity was recorded for this period." />
                )}
              </Panel>

              <Panel title="Rental Revenue by Month">
                {revenueValues.some(
                  (value) =>
                    value > 0
                ) ? (
                  <BarChart
                    values={
                      revenueValues
                    }
                    labels={
                      revenueLabels
                    }
                    max={
                      maximumRevenue
                    }
                  />
                ) : (
                  <EmptyMessage text="No rental revenue was recorded for this period." />
                )}
              </Panel>
            </SimpleGrid>

            <Panel title="Equipment Utilization Rate">
              {data
                .equipmentUtilization
                .length === 0 ? (
                <EmptyMessage text="No equipment utilization data is available for this period." />
              ) : (
                <VStack
                  align="stretch"
                  spacing={5}
                >
                  {data.equipmentUtilization.map(
                    (item) => (
                      <ProgressItem
                        key={
                          item.itemId
                        }
                        name={
                          item.itemName
                        }
                        helper={`${item.rentals.toLocaleString(
                          'en-ZA'
                        )} rental${
                          item.rentals ===
                          1
                            ? ''
                            : 's'
                        } · ${item.rentedDays.toLocaleString(
                          'en-ZA'
                        )} rented days · ${formatCurrency(
                          item.revenue,
                          data.currency
                        )}`}
                        value={
                          item.utilization
                        }
                      />
                    )
                  )}
                </VStack>
              )}
            </Panel>

            <Panel title="Popular Rental Durations">
              <SimpleGrid
                columns={{
                  base: 1,
                  md: 3
                }}
                spacing={4}
              >
                {data.popularDurations.map(
                  (item) => (
                    <Box
                      key={
                        item.key
                      }
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
                        {item.percentage}%
                      </Text>

                      <Text
                        fontSize="sm"
                        color="gray.500"
                      >
                        {item.count.toLocaleString(
                          'en-ZA'
                        )}{' '}
                        rental
                        {item.count ===
                        1
                          ? ''
                          : 's'}
                      </Text>
                    </Box>
                  )
                )}
              </SimpleGrid>
            </Panel>

            <Panel title="Rental Status Breakdown">
              {data.statusBreakdown
                .length === 0 ? (
                <EmptyMessage text="No rental status information is available." />
              ) : (
                <SimpleGrid
                  columns={{
                    base: 1,
                    md: 2,
                    xl: 4
                  }}
                  spacing={4}
                >
                  {data.statusBreakdown.map(
                    (item) => (
                      <Box
                        key={
                          item.status
                        }
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="10px"
                        p={4}
                      >
                        <Text
                          color="gray.500"
                          fontSize="sm"
                        >
                          {item.label}
                        </Text>

                        <Text
                          mt={1}
                          fontSize="2xl"
                          fontWeight="700"
                        >
                          {item.count.toLocaleString(
                            'en-ZA'
                          )}
                        </Text>

                        <Text
                          fontSize="sm"
                          color="gray.500"
                        >
                          {item.percentage}% of
                          rentals
                        </Text>
                      </Box>
                    )
                  )}
                </SimpleGrid>
              )}
            </Panel>
          </>
        ) : (
          <EmptyMessage text="No rental analytics information is available." />
        )}
      </VStack>
    </PageWrap>
  )
}