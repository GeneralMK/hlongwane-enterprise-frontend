import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Center,
  Divider,
  Flex,
  HStack,
  IconButton,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useToast,
  VStack
} from '@chakra-ui/react'
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Package,
  RefreshCcw,
  RotateCcw,
  UserRound
} from 'lucide-react'
import {
  useNavigate,
  useParams
} from 'react-router-dom'

import {
  EnumRentalStatus,
  useRentalQuery
} from '../../../generated/graphql'
import { PageWrap } from '../../../layout'

const BRAND_GREEN = '#176526'
const BRAND_GREEN_HOVER = '#12531e'

type DetailItemProps = {
  label: string
  value: string
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat(
    'en-ZA',
    {
      year: 'numeric',
      month: 'long',
      day: '2-digit'
    }
  ).format(date)
}

function formatDateTime(
  value?: string | null
): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat(
    'en-ZA',
    {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }
  ).format(date)
}

function formatCurrency(
  value?: string | number | null
): string {
  const amount = Number(value ?? 0)

  return new Intl.NumberFormat(
    'en-ZA',
    {
      style: 'currency',
      currency: 'ZAR'
    }
  ).format(
    Number.isFinite(amount)
      ? amount
      : 0
  )
}

function formatEnum(
  value?: string | null
): string {
  if (!value) {
    return ''
  }

  return value
    .toLowerCase()
    .split('_')
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ')
}

function formatStatus(
  status?: EnumRentalStatus | null
): string {
  return formatEnum(status)
}

function getStatusColor(
  status?: EnumRentalStatus | null
): string {
  switch (status) {
    case EnumRentalStatus.Active:
      return 'green'

    case EnumRentalStatus.Overdue:
      return 'red'

    case EnumRentalStatus.Upcoming:
      return 'blue'

    case EnumRentalStatus.Completed:
      return 'gray'

    case EnumRentalStatus.Cancelled:
      return 'orange'

    default:
      return 'gray'
  }
}

function getCustomerName(user?: {
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
} | null): string {
  const fullName =
    user?.fullName?.trim()

  if (fullName) {
    return fullName
  }

  const combinedName = [
    user?.firstName,
    user?.lastName
  ]
    .filter(
      (value): value is string =>
        Boolean(value?.trim())
    )
    .join(' ')
    .trim()

  return (
    combinedName ||
    user?.email ||
    'Unknown customer'
  )
}

function DetailItem({
  label,
  value
}: DetailItemProps) {
  return (
    <Box>
      <Text
        color="gray.500"
        fontSize="sm"
        mb={1}
      >
        {label}
      </Text>

      <Text
        fontWeight="500"
        wordBreak="break-word"
      >
        {value}
      </Text>
    </Box>
  )
}

function RentalDetailsSkeleton() {
  return (
    <PageWrap
      title="Rental Details"
      subtitle="Rental details and management"
    >
      <SimpleGrid
        columns={{
          base: 1,
          xl: 3
        }}
        spacing={5}
        alignItems="start"
      >
        <VStack
          align="stretch"
          spacing={5}
          gridColumn={{
            xl: 'span 2'
          }}
        >
          <Card
            variant="outline"
            borderRadius="12px"
          >
            <CardBody>
              <Skeleton
                height="24px"
                width="180px"
                mb={6}
              />

              <SimpleGrid
                columns={{
                  base: 1,
                  md: 2
                }}
                spacing={6}
              >
                {Array.from({
                  length: 8
                }).map((_, index) => (
                  <Box key={index}>
                    <Skeleton
                      height="14px"
                      width="90px"
                      mb={2}
                    />

                    <Skeleton
                      height="20px"
                      width="170px"
                    />
                  </Box>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>

          <Card
            variant="outline"
            borderRadius="12px"
          >
            <CardBody>
              <Skeleton
                height="24px"
                width="150px"
                mb={5}
              />

              <VStack
                align="stretch"
                spacing={4}
              >
                {Array.from({
                  length: 4
                }).map((_, index) => (
                  <Skeleton
                    key={index}
                    height="20px"
                  />
                ))}
              </VStack>
            </CardBody>
          </Card>
        </VStack>

        <Card
          variant="outline"
          borderRadius="12px"
        >
          <CardBody>
            <Skeleton
              height="24px"
              width="80px"
              mb={5}
            />

            <Skeleton
              height="42px"
              mb={4}
            />

            <Skeleton
              height="42px"
              mb={3}
            />

            <Skeleton height="42px" />
          </CardBody>
        </Card>
      </SimpleGrid>
    </PageWrap>
  )
}

export default function RentalDetails() {
  const navigate = useNavigate()
  const toast = useToast()

  const { rentalId = '' } =
    useParams<{
      rentalId: string
    }>()

  const {
    data,
    loading,
    error,
    refetch,
    networkStatus
  } = useRentalQuery({
    variables: {
      id: rentalId
    },
    skip: !rentalId,
    fetchPolicy:
      'cache-and-network',
    notifyOnNetworkStatusChange:
      true
  })

  const rental = data?.rental

  const isRefreshing =
    networkStatus === 4

  const handleRefresh = async () => {
    try {
      await refetch()

      toast({
        title:
          'Rental details refreshed',
        status: 'success',
        duration: 2500,
        isClosable: true
      })
    } catch (
      refreshError
    ) {
      toast({
        title:
          'Unable to refresh rental',
        description:
          refreshError instanceof Error
            ? refreshError.message
            : 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  if (!rentalId) {
    return (
      <PageWrap
        title="Rental Details"
        subtitle="Rental details and management"
      >
        <Alert
          status="error"
          borderRadius="10px"
          alignItems="flex-start"
        >
          <AlertIcon mt={1} />

          <Box flex="1">
            <Text fontWeight="600">
              Rental ID is missing
            </Text>

            <Text
              mt={1}
              fontSize="sm"
            >
              Open the rental from the
              rentals list and try again.
            </Text>

            <Button
              mt={4}
              size="sm"
              leftIcon={
                <ArrowLeft size={16} />
              }
              onClick={() =>
                navigate(
                  '/admin/rentals'
                )
              }
            >
              Back to Rentals
            </Button>
          </Box>
        </Alert>
      </PageWrap>
    )
  }

  if (
    loading &&
    !rental
  ) {
    return (
      <RentalDetailsSkeleton />
    )
  }

  if (
    error &&
    !rental
  ) {
    return (
      <PageWrap
        title="Rental Details"
        subtitle="Rental details and management"
      >
        <Alert
          status="error"
          borderRadius="10px"
          alignItems="flex-start"
        >
          <AlertIcon mt={1} />

          <Box flex="1">
            <Text fontWeight="600">
              Unable to load rental
            </Text>

            <Text
              mt={1}
              fontSize="sm"
            >
              {error.message}
            </Text>

            <HStack mt={4}>
              <Button
                size="sm"
                leftIcon={
                  <RefreshCcw
                    size={15}
                  />
                }
                isLoading={
                  isRefreshing
                }
                onClick={
                  handleRefresh
                }
              >
                Try Again
              </Button>

              <Button
                size="sm"
                variant="outline"
                leftIcon={
                  <ArrowLeft
                    size={15}
                  />
                }
                onClick={() =>
                  navigate(
                    '/admin/rentals'
                  )
                }
              >
                Back
              </Button>
            </HStack>
          </Box>
        </Alert>
      </PageWrap>
    )
  }

  if (!rental) {
    return (
      <PageWrap
        title="Rental Details"
        subtitle="Rental details and management"
      >
        <Alert
          status="warning"
          borderRadius="10px"
          alignItems="flex-start"
        >
          <AlertIcon mt={1} />

          <Box flex="1">
            <Text fontWeight="600">
              Rental not found
            </Text>

            <Text
              mt={1}
              fontSize="sm"
            >
              The rental may have been
              removed or the URL is
              incorrect.
            </Text>

            <Button
              mt={4}
              size="sm"
              leftIcon={
                <ArrowLeft size={15} />
              }
              onClick={() =>
                navigate(
                  '/admin/rentals'
                )
              }
            >
              Back to Rentals
            </Button>
          </Box>
        </Alert>
      </PageWrap>
    )
  }

  const customerName =
    getCustomerName(
      rental.user
    )

  const customerEmail =
    rental.user?.email || ''

  const itemName =
    rental.item?.name ||
    'Unknown product'

  const equipmentCondition =
    rental.return?.condition ??
    rental.item?.condition

  const returnNotes =
    rental.return?.notes?.trim() ||
    'No return notes recorded.'

  const extensions =
    rental.extensions ?? []

  const canProcessReturn =
    rental.status ===
      EnumRentalStatus.Active ||
    rental.status ===
      EnumRentalStatus.Overdue

  const canExtend =
    rental.status ===
      EnumRentalStatus.Active ||
    rental.status ===
      EnumRentalStatus.Upcoming ||
    rental.status ===
      EnumRentalStatus.Overdue

  const canManage =
    canProcessReturn ||
    canExtend

  return (
    <PageWrap
      title={`Rental ${rental.id}`}
      subtitle="Rental details and management"
      rightElements={
        <HStack>
          <Button
            display={{
              base: 'none',
              md: 'inline-flex'
            }}
            variant="outline"
            leftIcon={
              <RefreshCcw
                size={16}
              />
            }
            isLoading={
              isRefreshing
            }
            loadingText="Refreshing"
            onClick={handleRefresh}
          >
            Refresh
          </Button>

          <IconButton
            aria-label="Back to rentals"
            icon={
              <ArrowLeft size={18} />
            }
            variant="ghost"
            onClick={() =>
              navigate(-1)
            }
          />
        </HStack>
      }
    >
      {error && rental ? (
        <Alert
          status="warning"
          mb={5}
          borderRadius="10px"
        >
          <AlertIcon />

          <Text fontSize="sm">
            The latest rental data could
            not be loaded. The information
            below may be cached.
          </Text>
        </Alert>
      ) : null}

      <SimpleGrid
        columns={{
          base: 1,
          xl: 3
        }}
        spacing={5}
        alignItems="start"
      >
        <VStack
          align="stretch"
          spacing={5}
          gridColumn={{
            xl: 'span 2'
          }}
        >
          <Card
            variant="outline"
            borderRadius="12px"
          >
            <CardBody>
              <HStack
                justify="space-between"
                align="flex-start"
                mb={6}
              >
                <Box>
                  <Text
                    fontWeight="700"
                    fontSize="lg"
                  >
                    Rental Information
                  </Text>

                  <Text
                    mt={1}
                    color="gray.500"
                    fontSize="sm"
                  >
                    Product, customer and
                    rental period details
                  </Text>
                </Box>

                <Badge
                  colorScheme={
                    getStatusColor(
                      rental.status
                    )
                  }
                  borderRadius="full"
                  px={3}
                  py={1}
                >
                  {formatStatus(
                    rental.status
                  )}
                </Badge>
              </HStack>

              <SimpleGrid
                columns={{
                  base: 1,
                  md: 2
                }}
                spacing={6}
              >
                <DetailItem
                  label="Product"
                  value={itemName}
                />

                <DetailItem
                  label="Customer"
                  value={customerName}
                />

                <DetailItem
                  label="Customer Email"
                  value={customerEmail}
                />

                <DetailItem
                  label="Rental Reference"
                  value={rental.id}
                />

                <DetailItem
                  label="Start Date"
                  value={formatDate(
                    rental.startDate
                  )}
                />

                <DetailItem
                  label="End Date"
                  value={formatDate(
                    rental.endDate
                  )}
                />

                <DetailItem
                  label="Returned At"
                  value={formatDateTime(
                    rental.returnedAt
                  )}
                />

                <DetailItem
                  label="Equipment Condition"
                  value={formatEnum(
                    equipmentCondition
                  )}
                />
              </SimpleGrid>
            </CardBody>
          </Card>

          <Card
            variant="outline"
            borderRadius="12px"
          >
            <CardBody>
              <HStack
                mb={5}
                spacing={3}
              >
                <CircleDollarSign
                  size={20}
                />

                <Box>
                  <Text
                    fontWeight="700"
                    fontSize="lg"
                  >
                    Payment Details
                  </Text>

                  <Text
                    color="gray.500"
                    fontSize="sm"
                  >
                    Rental charges and
                    deposit information
                  </Text>
                </Box>
              </HStack>

              <Stack
                spacing={0}
                divider={
                  <Divider />
                }
              >
                <Flex
                  justify="space-between"
                  gap={4}
                  py={3}
                >
                  <Text color="gray.500">
                    Daily Rate
                  </Text>

                  <Text fontWeight="600">
                    {formatCurrency(
                      rental.dailyRate
                    )}
                  </Text>
                </Flex>

                <Flex
                  justify="space-between"
                  gap={4}
                  py={3}
                >
                  <Text color="gray.500">
                    Deposit
                  </Text>

                  <Text fontWeight="600">
                    {formatCurrency(
                      rental.deposit
                    )}
                  </Text>
                </Flex>

                <Flex
                  justify="space-between"
                  gap={4}
                  py={3}
                >
                  <Text color="gray.500">
                    Rental Cost
                  </Text>

                  <Text fontWeight="600">
                    {formatCurrency(
                      rental.totalAmount
                    )}
                  </Text>
                </Flex>

                <Flex
                  justify="space-between"
                  gap={4}
                  pt={4}
                >
                  <Text
                    fontWeight="700"
                    fontSize="lg"
                  >
                    Total
                  </Text>

                  <Text
                    fontWeight="700"
                    fontSize="lg"
                    color="green.700"
                  >
                    {formatCurrency(
                      rental.totalAmount
                    )}
                  </Text>
                </Flex>
              </Stack>
            </CardBody>
          </Card>

          {extensions.length > 0 ? (
            <Card
              variant="outline"
              borderRadius="12px"
            >
              <CardBody>
                <HStack
                  mb={5}
                  spacing={3}
                >
                  <Clock3 size={20} />

                  <Box>
                    <Text
                      fontWeight="700"
                      fontSize="lg"
                    >
                      Extension History
                    </Text>

                    <Text
                      color="gray.500"
                      fontSize="sm"
                    >
                      Previous changes to
                      the rental end date
                    </Text>
                  </Box>
                </HStack>

                <VStack
                  align="stretch"
                  spacing={3}
                >
                  {extensions.map(
                    (
                      extension,
                      index
                    ) => (
                      <Box
                        key={
                          extension.id
                        }
                        p={4}
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="10px"
                      >
                        <Flex
                          justify="space-between"
                          align={{
                            base:
                              'flex-start',
                            md: 'center'
                          }}
                          direction={{
                            base: 'column',
                            md: 'row'
                          }}
                          gap={3}
                        >
                          <Box>
                            <Text
                              fontSize="sm"
                              color="gray.500"
                            >
                              Extension{' '}
                              {index + 1}
                            </Text>

                            <HStack
                              mt={1}
                              spacing={2}
                              flexWrap="wrap"
                            >
                              <Text fontWeight="600">
                                {formatDate(
                                  extension.oldEndDate
                                )}
                              </Text>

                              <Text color="gray.400">
                                →
                              </Text>

                              <Text fontWeight="600">
                                {formatDate(
                                  extension.newEndDate
                                )}
                              </Text>
                            </HStack>
                          </Box>

                          <Box
                            textAlign={{
                              base: 'left',
                              md: 'right'
                            }}
                          >
                            <Text
                              fontSize="sm"
                              color="gray.500"
                            >
                              Additional Cost
                            </Text>

                            <Text
                              fontWeight="700"
                              color="green.700"
                            >
                              {formatCurrency(
                                extension.additionalCost
                              )}
                            </Text>
                          </Box>
                        </Flex>
                      </Box>
                    )
                  )}
                </VStack>
              </CardBody>
            </Card>
          ) : null}

          {rental.return ? (
            <Card
              variant="outline"
              borderRadius="12px"
            >
              <CardBody>
                <HStack
                  mb={5}
                  spacing={3}
                >
                  <RotateCcw size={20} />

                  <Box>
                    <Text
                      fontWeight="700"
                      fontSize="lg"
                    >
                      Return Information
                    </Text>

                    <Text
                      color="gray.500"
                      fontSize="sm"
                    >
                      Recorded equipment
                      condition and notes
                    </Text>
                  </Box>
                </HStack>

                <SimpleGrid
                  columns={{
                    base: 1,
                    md: 2
                  }}
                  spacing={5}
                >
                  <DetailItem
                    label="Return Condition"
                    value={formatEnum(
                      rental.return
                        .condition
                    )}
                  />

                  <DetailItem
                    label="Returned At"
                    value={formatDateTime(
                      rental.returnedAt
                    )}
                  />
                </SimpleGrid>

                <Box
                  mt={5}
                  p={4}
                  bg="gray.50"
                  borderRadius="10px"
                >
                  <Text
                    color="gray.500"
                    fontSize="sm"
                    mb={1}
                  >
                    Return Notes
                  </Text>

                  <Text
                    whiteSpace="pre-wrap"
                  >
                    {returnNotes}
                  </Text>
                </Box>
              </CardBody>
            </Card>
          ) : null}
        </VStack>

        <VStack
          align="stretch"
          spacing={5}
          position={{
            base: 'static',
            xl: 'sticky'
          }}
          top="24px"
        >
          <Card
            variant="outline"
            borderRadius="12px"
          >
            <CardBody>
              <Text
                fontWeight="700"
                fontSize="lg"
                mb={4}
              >
                Rental Status
              </Text>

              <Badge
                display="block"
                colorScheme={
                  getStatusColor(
                    rental.status
                  )
                }
                textAlign="center"
                py={3}
                px={4}
                borderRadius="8px"
                fontSize="sm"
              >
                {formatStatus(
                  rental.status
                )}
              </Badge>

              <Divider my={5} />

              <VStack
                align="stretch"
                spacing={3}
              >
                {canProcessReturn ? (
                  <Button
                    bg={BRAND_GREEN}
                    color="white"
                    leftIcon={
                      <RotateCcw
                        size={16}
                      />
                    }
                    onClick={() =>
                      navigate(
                        `/admin/rentals/manage?tab=return&rentalId=${encodeURIComponent(
                          rental.id
                        )}`
                      )
                    }
                    _hover={{
                      bg:
                        BRAND_GREEN_HOVER
                    }}
                  >
                    Process Return
                  </Button>
                ) : null}

                {canExtend ? (
                  <Button
                    variant="outline"
                    leftIcon={
                      <CalendarDays
                        size={16}
                      />
                    }
                    onClick={() =>
                      navigate(
                        `/admin/rentals/manage?tab=extend&rentalId=${encodeURIComponent(
                          rental.id
                        )}`
                      )
                    }
                  >
                    Extend Rental
                  </Button>
                ) : null}

                {!canManage ? (
                  <Alert
                    status={
                      rental.status ===
                      EnumRentalStatus.Completed
                        ? 'success'
                        : 'info'
                    }
                    borderRadius="8px"
                    fontSize="sm"
                    alignItems="flex-start"
                  >
                    <AlertIcon mt={1} />

                    <Text>
                      {rental.status ===
                      EnumRentalStatus.Completed
                        ? 'This rental has been completed.'
                        : rental.status ===
                            EnumRentalStatus.Cancelled
                          ? 'This rental has been cancelled.'
                          : 'No management actions are available for this rental.'}
                    </Text>
                  </Alert>
                ) : null}
              </VStack>
            </CardBody>
          </Card>

          <Card
            variant="outline"
            borderRadius="12px"
          >
            <CardBody>
              <Text
                fontWeight="700"
                mb={4}
              >
                Summary
              </Text>

              <VStack
                align="stretch"
                spacing={4}
              >
                <HStack
                  align="flex-start"
                  spacing={3}
                >
                  <Box
                    color="green.600"
                    mt={0.5}
                  >
                    <Package
                      size={18}
                    />
                  </Box>

                  <Box>
                    <Text
                      fontSize="sm"
                      color="gray.500"
                    >
                      Equipment
                    </Text>

                    <Text fontWeight="600">
                      {itemName}
                    </Text>
                  </Box>
                </HStack>

                <HStack
                  align="flex-start"
                  spacing={3}
                >
                  <Box
                    color="green.600"
                    mt={0.5}
                  >
                    <UserRound
                      size={18}
                    />
                  </Box>

                  <Box>
                    <Text
                      fontSize="sm"
                      color="gray.500"
                    >
                      Customer
                    </Text>

                    <Text fontWeight="600">
                      {customerName}
                    </Text>
                  </Box>
                </HStack>

                <HStack
                  align="flex-start"
                  spacing={3}
                >
                  <Box
                    color="green.600"
                    mt={0.5}
                  >
                    <CalendarDays
                      size={18}
                    />
                  </Box>

                  <Box>
                    <Text
                      fontSize="sm"
                      color="gray.500"
                    >
                      Rental Period
                    </Text>

                    <Text fontWeight="600">
                      {formatDate(
                        rental.startDate
                      )}{' '}
                      –{' '}
                      {formatDate(
                        rental.endDate
                      )}
                    </Text>
                  </Box>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          <Button
            variant="ghost"
            leftIcon={
              <ArrowLeft size={16} />
            }
            onClick={() =>
              navigate(
                '/admin/rentals'
              )
            }
          >
            Back to Rentals
          </Button>
        </VStack>
      </SimpleGrid>
    </PageWrap>
  )
}