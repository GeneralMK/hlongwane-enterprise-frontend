import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  HStack,
  Icon,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast
} from '@chakra-ui/react'
import {
  Check,
  RefreshCcw,
  Search,
  Star,
  X
} from 'lucide-react'
import {
  useMemo,
  useState
} from 'react'

import {
  EnumReviewStatus,
  useAdminReviewsQuery,
  useUpdateAdminReviewStatusMutation
} from '../../../generated/graphql'
import { PageWrap } from '../../../layout'

const BRAND_GREEN = '#176526'
const BRAND_GREEN_HOVER = '#104b1c'
const PAGE_SIZE = 20

type ReviewAction = {
  reviewId: string
  status: EnumReviewStatus
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
      dateStyle: 'medium',
      timeStyle: 'short'
    }
  ).format(date)
}

function formatStatus(
  status: EnumReviewStatus
): string {
  return String(status)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter =>
      letter.toUpperCase()
    )
}

function statusColour(
  status: EnumReviewStatus
): string {
  switch (status) {
    case EnumReviewStatus.Approved:
      return 'green'

    case EnumReviewStatus.Rejected:
      return 'red'

    case EnumReviewStatus.Pending:
    default:
      return 'orange'
  }
}

function customerName(review: {
  user?: {
    fullName?: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  } | null
}): string {
  const fullName =
    review.user?.fullName?.trim()

  if (fullName) {
    return fullName
  }

  const combinedName = [
    review.user?.firstName,
    review.user?.lastName
  ]
    .filter(
      (value): value is string =>
        Boolean(value?.trim())
    )
    .join(' ')
    .trim()

  return (
    combinedName ||
    review.user?.email ||
    'Customer'
  )
}

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred.'
}

function RatingStars({
  rating
}: {
  rating: number
}) {
  const safeRating = Math.min(
    Math.max(
      Number.isFinite(rating)
        ? Math.round(rating)
        : 0,
      0
    ),
    5
  )

  return (
    <HStack
      spacing={1}
      aria-label={`${safeRating} out of 5 stars`}
    >
      {Array.from({
        length: 5
      }).map((_, index) => (
        <Icon
          key={index}
          as={Star}
          boxSize={4}
          fill={
            index < safeRating
              ? 'currentColor'
              : 'none'
          }
          color={
            index < safeRating
              ? 'yellow.400'
              : 'gray.300'
          }
        />
      ))}

      <Text
        ml={1}
        fontSize="sm"
        fontWeight="700"
      >
        {safeRating}/5
      </Text>
    </HStack>
  )
}

function SummaryCard({
  label,
  value
}: {
  label: string
  value: number
}) {
  return (
    <Card
      variant="outline"
      borderRadius="12px"
    >
      <CardBody>
        <Text
          color="gray.500"
          fontSize="sm"
        >
          {label}
        </Text>

        <Text
          mt={1}
          fontSize="2xl"
          fontWeight="800"
        >
          {value}
        </Text>
      </CardBody>
    </Card>
  )
}

export default function ReviewsList() {
  const toast = useToast()

  const [search, setSearch] =
    useState('')

  const [status, setStatus] =
    useState<
      EnumReviewStatus | ''
    >('')

  const [page, setPage] =
    useState(1)

  const [
    currentAction,
    setCurrentAction
  ] = useState<ReviewAction | null>(
    null
  )

  const {
    data,
    loading,
    error,
    refetch,
    networkStatus
  } = useAdminReviewsQuery({
    variables: {
      input: {
        search:
          search.trim() || null,
        status: status || null,
        page,
        limit: PAGE_SIZE
      }
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true
  })

  const [
    updateStatus,
    {
      loading: updatingStatus
    }
  ] =
    useUpdateAdminReviewStatusMutation()

  const pagination =
    data?.adminReviews

  const reviews = useMemo(
    () =>
      pagination?.reviews ?? [],
    [pagination?.reviews]
  )

  const summary =
    pagination?.summary

  const totalPages = Math.max(
    pagination?.totalPages ?? 1,
    1
  )

  const isRefreshing =
    networkStatus === 4

  const handleRefresh = async () => {
    try {
      await refetch()

      toast({
        title: 'Reviews refreshed',
        status: 'success',
        duration: 2500,
        isClosable: true
      })
    } catch (refreshError) {
      toast({
        title:
          'Unable to refresh reviews',
        description:
          getErrorMessage(
            refreshError
          ),
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const handleStatusUpdate =
    async (
      reviewId: string,
      nextStatus:
        EnumReviewStatus
    ) => {
      if (
        updatingStatus ||
        currentAction
      ) {
        return
      }

      setCurrentAction({
        reviewId,
        status: nextStatus
      })

      try {
        await updateStatus({
          variables: {
            id: reviewId,
            status: nextStatus
          },
          refetchQueries: [
            'AdminReviews'
          ],
          awaitRefetchQueries: true
        })

        toast({
          title:
            nextStatus ===
            EnumReviewStatus.Approved
              ? 'Review approved'
              : 'Review rejected',
          description:
            nextStatus ===
            EnumReviewStatus.Approved
              ? 'The review is now visible to customers.'
              : 'The review has been rejected.',
          status: 'success',
          duration: 3000,
          isClosable: true
        })
      } catch (mutationError) {
        toast({
          title:
            'Unable to update review',
          description:
            getErrorMessage(
              mutationError
            ),
          status: 'error',
          duration: 5000,
          isClosable: true
        })
      } finally {
        setCurrentAction(null)
      }
    }

  const handleSearchChange = (
    value: string
  ) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusFilterChange = (
    value:
      | EnumReviewStatus
      | ''
  ) => {
    setStatus(value)
    setPage(1)
  }

  return (
    <PageWrap
      title="Customer Reviews"
      subtitle="View, approve, and reject customer feedback"
    >
      <SimpleGrid
        columns={{
          base: 1,
          sm: 2,
          md: 4
        }}
        spacing={4}
      >
        <SummaryCard
          label="Total Reviews"
          value={
            summary?.total ?? 0
          }
        />

        <SummaryCard
          label="Pending"
          value={
            summary?.pending ?? 0
          }
        />

        <SummaryCard
          label="Approved"
          value={
            summary?.approved ?? 0
          }
        />

        <SummaryCard
          label="Rejected"
          value={
            summary?.rejected ?? 0
          }
        />
      </SimpleGrid>

      <Card
        mt={5}
        variant="outline"
        borderRadius="12px"
      >
        <CardBody>
          <Flex
            gap={3}
            direction={{
              base: 'column',
              md: 'row'
            }}
            mb={5}
          >
            <InputGroup flex={1}>
              <InputLeftElement
                pointerEvents="none"
              >
                <Search size={16} />
              </InputLeftElement>

              <Input
                value={search}
                placeholder="Search customer, email, product, or comment..."
                bg="gray.50"
                onChange={event =>
                  handleSearchChange(
                    event.target.value
                  )
                }
              />
            </InputGroup>

            <Select
              maxW={{
                base: '100%',
                md: '220px'
              }}
              value={status}
              bg="gray.50"
              onChange={event =>
                handleStatusFilterChange(
                  event.target
                    .value as
                    | EnumReviewStatus
                    | ''
                )
              }
            >
              <option value="">
                All statuses
              </option>

              <option
                value={
                  EnumReviewStatus.Pending
                }
              >
                Pending
              </option>

              <option
                value={
                  EnumReviewStatus.Approved
                }
              >
                Approved
              </option>

              <option
                value={
                  EnumReviewStatus.Rejected
                }
              >
                Rejected
              </option>
            </Select>

            <Button
              leftIcon={
                <RefreshCcw
                  size={16}
                />
              }
              variant="outline"
              isLoading={isRefreshing}
              loadingText="Refreshing"
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </Flex>

          {error && (
            <Alert
              status="error"
              mb={5}
              borderRadius="10px"
              alignItems="flex-start"
            >
              <AlertIcon mt={1} />

              <Box flex={1}>
                <AlertDescription>
                  {error.message}
                </AlertDescription>

                <Button
                  mt={3}
                  size="sm"
                  variant="outline"
                  isLoading={
                    isRefreshing
                  }
                  onClick={
                    handleRefresh
                  }
                >
                  Try Again
                </Button>
              </Box>
            </Alert>
          )}

          {loading &&
          reviews.length === 0 ? (
            <Stack spacing={3}>
              {Array.from({
                length: 5
              }).map((_, index) => (
                <Skeleton
                  key={index}
                  height="110px"
                  borderRadius="10px"
                />
              ))}
            </Stack>
          ) : reviews.length === 0 ? (
            <Box
              py={16}
              textAlign="center"
            >
              <Text
                fontSize="xl"
                fontWeight="700"
              >
                No reviews found
              </Text>

              <Text
                mt={2}
                color="gray.500"
              >
                Adjust the filters or
                wait for customers to
                submit feedback.
              </Text>
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table
                variant="simple"
                minW="1100px"
              >
                <Thead>
                  <Tr>
                    <Th>Customer</Th>
                    <Th>Product</Th>
                    <Th>Rating</Th>
                    <Th>Comment</Th>
                    <Th>Status</Th>
                    <Th>Submitted</Th>
                    <Th textAlign="right">
                      Actions
                    </Th>
                  </Tr>
                </Thead>

                <Tbody>
                  {reviews.map(review => {
                    const isApproving =
                      currentAction
                        ?.reviewId ===
                        review.id &&
                      currentAction
                        .status ===
                        EnumReviewStatus.Approved

                    const isRejecting =
                      currentAction
                        ?.reviewId ===
                        review.id &&
                      currentAction
                        .status ===
                        EnumReviewStatus.Rejected

                    const anotherReviewUpdating =
                      Boolean(
                        currentAction
                      ) &&
                      currentAction
                        ?.reviewId !==
                        review.id

                    return (
                      <Tr key={review.id}>
                        <Td>
                          <Box>
                            <Text fontWeight="700">
                              {customerName(
                                review
                              )}
                            </Text>

                            {review.user
                              ?.email && (
                              <Text
                                color="gray.500"
                                fontSize="sm"
                              >
                                {
                                  review
                                    .user
                                    .email
                                }
                              </Text>
                            )}
                          </Box>
                        </Td>

                        <Td>
                          <HStack>
                            <Image
                              src={
                                review.item
                                  ?.imageUrl ??
                                undefined
                              }
                              alt={
                                review.item
                                  ?.name ??
                                'Equipment'
                              }
                              boxSize="48px"
                              objectFit="contain"
                              bg="gray.50"
                              borderRadius="8px"
                              fallback={
                                <Flex
                                  boxSize="48px"
                                  bg="gray.100"
                                  borderRadius="8px"
                                  align="center"
                                  justify="center"
                                >
                                  <Star
                                    size={
                                      18
                                    }
                                  />
                                </Flex>
                              }
                            />

                            <Text fontWeight="600">
                              {review.item
                                ?.name ??
                                'Deleted item'}
                            </Text>
                          </HStack>
                        </Td>

                        <Td>
                          <RatingStars
                            rating={
                              review.rating
                            }
                          />
                        </Td>

                        <Td maxW="360px">
                          <Text
                            noOfLines={3}
                            whiteSpace="normal"
                          >
                            {review.comment?.trim() ||
                              'No written comment'}
                          </Text>
                        </Td>

                        <Td>
                          <Badge
                            colorScheme={statusColour(
                              review.status
                            )}
                            borderRadius="full"
                            px={3}
                            py={1}
                          >
                            {formatStatus(
                              review.status
                            )}
                          </Badge>
                        </Td>

                        <Td>
                          {formatDate(
                            review.createdAt
                          )}
                        </Td>

                        <Td>
                          <Flex
                            justify="flex-end"
                            gap={2}
                          >
                            <Button
                              size="sm"
                              leftIcon={
                                <Check
                                  size={
                                    15
                                  }
                                />
                              }
                              bg={
                                BRAND_GREEN
                              }
                              color="white"
                              isDisabled={
                                review.status ===
                                  EnumReviewStatus.Approved ||
                                anotherReviewUpdating ||
                                isRejecting
                              }
                              isLoading={
                                isApproving
                              }
                              loadingText="Approving"
                              onClick={() =>
                                handleStatusUpdate(
                                  review.id,
                                  EnumReviewStatus.Approved
                                )
                              }
                              _hover={{
                                bg:
                                  BRAND_GREEN_HOVER
                              }}
                            >
                              Approve
                            </Button>

                            <Button
                              size="sm"
                              leftIcon={
                                <X
                                  size={
                                    15
                                  }
                                />
                              }
                              variant="outline"
                              colorScheme="red"
                              isDisabled={
                                review.status ===
                                  EnumReviewStatus.Rejected ||
                                anotherReviewUpdating ||
                                isApproving
                              }
                              isLoading={
                                isRejecting
                              }
                              loadingText="Rejecting"
                              onClick={() =>
                                handleStatusUpdate(
                                  review.id,
                                  EnumReviewStatus.Rejected
                                )
                              }
                            >
                              Reject
                            </Button>
                          </Flex>
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </Box>
          )}

          {totalPages > 1 && (
            <Flex
              mt={6}
              justify="space-between"
              align="center"
              gap={3}
            >
              <Button
                variant="outline"
                isDisabled={
                  page <= 1 ||
                  loading
                }
                onClick={() =>
                  setPage(current =>
                    Math.max(
                      current - 1,
                      1
                    )
                  )
                }
              >
                Previous
              </Button>

              <Text
                color="gray.600"
                fontSize="sm"
              >
                Page {page} of{' '}
                {totalPages}
              </Text>

              <Button
                variant="outline"
                isDisabled={
                  page >= totalPages ||
                  loading
                }
                onClick={() =>
                  setPage(current =>
                    Math.min(
                      current + 1,
                      totalPages
                    )
                  )
                }
              >
                Next
              </Button>
            </Flex>
          )}
        </CardBody>
      </Card>
    </PageWrap>
  )
}