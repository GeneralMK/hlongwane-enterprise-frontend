import {
  Alert,
  AlertIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  IconButton,
  Progress,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import {
  Edit3,
  Star,
  Trash2
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
  type JSXElementConstructor,
  type Key,
  type ReactElement,
  type ReactNode,
  type ReactPortal
} from 'react'

import {
  EnumReviewStatus,
  useCreateCustomerReviewMutation,
  useDeleteCustomerReviewMutation,
  useItemReviewsQuery,
  useUpdateCustomerReviewMutation
} from '../../generated/graphql'

type ProductReviewsProps = {
  itemId: string
  isAuthenticated: boolean
}

function formatDate(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return ''
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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

function getDisplayName(
  user:
    | {
        fullName?: string | null
        firstName?: string | null
        lastName?: string | null
      }
    | null
    | undefined
) {
  return (
    user?.fullName?.trim() ||
    [
      user?.firstName,
      user?.lastName
    ]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    'Verified customer'
  )
}

function getInitials(
  name: string
) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(
      part =>
        part[0]?.toUpperCase()
    )
    .join('')
}

function statusColor(
  status:
    | EnumReviewStatus
    | null
    | undefined
) {
  switch (status) {
    case EnumReviewStatus.Approved:
      return 'green'

    case EnumReviewStatus.Rejected:
      return 'red'

    case EnumReviewStatus.Pending:
    default:
      return 'yellow'
  }
}

function ReviewStars({
  value,
  size = 18
}: {
  value: number
  size?: number
}) {
  return (
    <HStack spacing={1}>
      {[1, 2, 3, 4, 5].map(
        star => (
          <Star
            key={star}
            size={size}
            color={
              star <= value
                ? '#D69E2E'
                : '#CBD5E0'
            }
            fill={
              star <= value
                ? 'currentColor'
                : 'none'
            }
          />
        )
      )}
    </HStack>
  )
}

function RatingInput({
  value,
  onChange
}: {
  value: number
  onChange:
    (value: number) => void
}) {
  const [
    hoverRating,
    setHoverRating
  ] =
    useState(0)

  const displayedRating =
    hoverRating ||
    value

  return (
    <HStack spacing={1}>
      {[1, 2, 3, 4, 5].map(
        star => (
          <IconButton
            key={star}
            aria-label={`Rate ${star} out of 5`}
            icon={
              <Star
                size={30}
                fill={
                  star <=
                  displayedRating
                    ? 'currentColor'
                    : 'none'
                }
              />
            }
            variant="ghost"
            minW="40px"
            color={
              star <=
              displayedRating
                ? 'yellow.400'
                : 'gray.300'
            }
            onMouseEnter={() =>
              setHoverRating(
                star
              )
            }
            onMouseLeave={() =>
              setHoverRating(0)
            }
            onClick={() =>
              onChange(
                star
              )
            }
          />
        )
      )}
    </HStack>
  )
}

export default function ProductReviews({
  itemId,
  isAuthenticated
}: ProductReviewsProps) {
  const toast =
    useToast()

  const reviewForm =
    useDisclosure()

  const [
    rating,
    setRating
  ] =
    useState(0)

  const [
    comment,
    setComment
  ] =
    useState('')

  const [
    submitted,
    setSubmitted
  ] =
    useState(false)

  const {
    data,
    loading,
    error,
    refetch
  } =
    useItemReviewsQuery({
      variables: {
        itemId
      },

      skip:
        !itemId,

      fetchPolicy:
        'network-only',

      notifyOnNetworkStatusChange:
        true
    })

  const [
    createReview,
    {
      loading:
        creating
    }
  ] =
    useCreateCustomerReviewMutation()

  const [
    updateReview,
    {
      loading:
        updating
    }
  ] =
    useUpdateCustomerReviewMutation()

  const [
    deleteReview,
    {
      loading:
        deleting
    }
  ] =
    useDeleteCustomerReviewMutation()

  const summary =
    data?.itemReviewSummary

  const reviews =
    data?.itemReviews ??
    []

  const myReview =
    data?.itemReviews

  useEffect(
    () => {
      if (!myReview) {
        return
      }

      setRating(
        myReview.rating
      )

      setComment(
        myReview.comment ??
        ''
      )
    },
    [
      myReview
    ]
  )

  const ratingDistribution =
    useMemo(
      () => [
        {
          rating: 5,
          count:
            summary?.ratingFive ??
            0
        },
        {
          rating: 4,
          count:
            summary?.ratingFour ??
            0
        },
        {
          rating: 3,
          count:
            summary?.ratingThree ??
            0
        },
        {
          rating: 2,
          count:
            summary?.ratingTwo ??
            0
        },
        {
          rating: 1,
          count:
            summary?.ratingOne ??
            0
        }
      ],
      [
        summary
      ]
    )

  const ratingError =
    submitted &&
    (
      rating < 1 ||
      rating > 5
    )

  const commentError =
    submitted &&
    comment.trim().length > 0 &&
    comment.trim().length < 3

  const resetForm = () => {
    if (myReview) {
      setRating(
        myReview.rating
      )

      setComment(
        myReview.comment ??
        ''
      )
    } else {
      setRating(0)
      setComment('')
    }

    setSubmitted(false)
  }

  const submitReview =
    async () => {
      setSubmitted(true)

      if (
        rating < 1 ||
        rating > 5 ||
        (
          comment.trim().length >
            0 &&
          comment.trim().length <
            3
        )
      ) {
        return
      }

      try {
        if (myReview) {
          await updateReview({
            variables: {
              id:
                myReview.id,

              input: {
                rating,

                comment:
                  comment.trim() ||
                  null
              }
            }
          })
        } else {
          await createReview({
            variables: {
              input: {
                itemId,
                rating,

                comment:
                  comment.trim() ||
                  null
              }
            }
          })
        }

        toast({
          title:
            myReview
              ? 'Review updated'
              : 'Review submitted',

          description:
            'Your review has been submitted for moderation.',

          status:
            'success',

          duration:
            5000,

          isClosable:
            true
        })

        reviewForm.onClose()
        setSubmitted(false)

        await refetch()
      } catch (mutationError) {
        toast({
          title:
            'Unable to save review',

          description:
            mutationError instanceof
              Error
              ? mutationError.message
              : 'Please try again.',

          status:
            'error',

          duration:
            6000,

          isClosable:
            true
        })
      }
    }

  const removeReview =
    async () => {
      if (!myReview) {
        return
      }

      try {
        await deleteReview({
          variables: {
            id:
              myReview.id
          }
        })

        setRating(0)
        setComment('')
        setSubmitted(false)

        toast({
          title:
            'Review deleted',

          status:
            'success',

          duration:
            4000,

          isClosable:
            true
        })

        await refetch()
      } catch (mutationError) {
        toast({
          title:
            'Unable to delete review',

          description:
            mutationError instanceof
              Error
              ? mutationError.message
              : 'Please try again.',

          status:
            'error',

          duration:
            6000,

          isClosable:
            true
        })
      }
    }

  if (loading && !data) {
    return (
      <Center py={16}>
        <Spinner
          color="green.700"
        />
      </Center>
    )
  }

  if (error) {
    return (
      <Alert
        status="error"
        borderRadius="12px"
      >
        <AlertIcon />

        {error.message}
      </Alert>
    )
  }

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="18px"
      p={{
        base: 5,
        md: 8
      }}
    >
      <Flex
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
        gap={4}
        mb={8}
      >
        <Box>
          <Text
            fontSize="2xl"
            fontWeight="800"
            color="#173F1F"
          >
            Customer Reviews
          </Text>

          <Text
            color="gray.500"
            mt={1}
          >
            Ratings and feedback from customers who purchased or rented this item.
          </Text>
        </Box>

        {isAuthenticated ? (
          <Button
            bg="#173F1F"
            color="white"
            borderRadius="full"
            px={6}
            onClick={() => {
              resetForm()
              reviewForm.onToggle()
            }}
            _hover={{
              bg: '#102f17'
            }}
          >
            {myReview
              ? reviewForm.isOpen
                ? 'Close Review'
                : 'Edit My Review'
              : reviewForm.isOpen
                ? 'Close Review'
                : 'Write a Review'}
          </Button>
        ) : (
          <Text
            color="gray.500"
            fontSize="sm"
          >
            Sign in to write a review.
          </Text>
        )}
      </Flex>

      <SimpleGrid
        columns={{
          base: 1,
          lg: 2
        }}
        spacing={8}
        mb={8}
      >
        <VStack
          justify="center"
          spacing={3}
          py={5}
        >
          <Text
            fontSize="5xl"
            fontWeight="800"
            color="#173F1F"
          >
            {Number(
              summary?.averageRating ??
              0
            ).toFixed(1)}
          </Text>

          <ReviewStars
            value={Math.round(
              summary?.averageRating ??
              0
            )}
            size={24}
          />

          <Text
            color="gray.500"
          >
            Based on{' '}
            {summary?.totalReviews ??
              0}{' '}
            {summary?.totalReviews ===
            1
              ? 'review'
              : 'reviews'}
          </Text>
        </VStack>

        <VStack
          align="stretch"
          spacing={2}
        >
          {ratingDistribution.map(
            item => {
              const total =
                summary?.totalReviews ??
                0

              const percentage =
                total > 0
                  ? (
                      item.count /
                      total
                    ) *
                    100
                  : 0

              return (
                <HStack
                  key={item.rating}
                  spacing={3}
                >
                  <Text
                    minW="16px"
                    fontSize="sm"
                  >
                    {item.rating}
                  </Text>

                  <Star
                    size={15}
                    color="#D69E2E"
                    fill="currentColor"
                  />

                  <Progress
                    value={
                      percentage
                    }
                    flex="1"
                    size="sm"
                    colorScheme="yellow"
                    borderRadius="full"
                  />

                  <Text
                    minW="28px"
                    textAlign="right"
                    fontSize="sm"
                    color="gray.500"
                  >
                    {item.count}
                  </Text>
                </HStack>
              )
            }
          )}
        </VStack>
      </SimpleGrid>

      {myReview ? (
        <Alert
          status={
            myReview.status ===
            EnumReviewStatus.Rejected
              ? 'error'
              : myReview.status ===
                  EnumReviewStatus.Approved
                ? 'success'
                : 'warning'
          }
          borderRadius="12px"
          mb={6}
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
            <Box>
              <Text fontWeight="600">
                Your review
              </Text>

              <Text fontSize="sm">
                Status:{' '}
                {myReview.status
                  .toLowerCase()}
              </Text>
            </Box>

            <HStack>
              <Button
                size="sm"
                leftIcon={
                  <Edit3
                    size={15}
                  />
                }
                onClick={() => {
                  resetForm()
                  reviewForm.onOpen()
                }}
              >
                Edit
              </Button>

              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                leftIcon={
                  <Trash2
                    size={15}
                  />
                }
                isLoading={
                  deleting
                }
                onClick={() =>
                  void removeReview()
                }
              >
                Delete
              </Button>
            </HStack>
          </Flex>
        </Alert>
      ) : null}

      {reviewForm.isOpen &&
      isAuthenticated ? (
        <Box
          border="1px solid"
          borderColor="gray.200"
          borderRadius="14px"
          p={5}
          mb={8}
        >
          <VStack
            align="stretch"
            spacing={5}
          >
            <Box>
              <Text
                fontSize="lg"
                fontWeight="700"
              >
                {myReview
                  ? 'Edit your review'
                  : 'Write a review'}
              </Text>

              <Text
                color="gray.500"
                fontSize="sm"
              >
                Only customers who purchased or rented this item can submit a review.
              </Text>
            </Box>

            <FormControl
              isInvalid={
                ratingError
              }
            >
              <FormLabel>
                Your rating
              </FormLabel>

              <RatingInput
                value={rating}
                onChange={
                  setRating
                }
              />

              <FormErrorMessage>
                Select a rating between 1 and 5.
              </FormErrorMessage>
            </FormControl>

            <FormControl
              isInvalid={
                commentError
              }
            >
              <FormLabel>
                Your review
              </FormLabel>

              <Textarea
                value={comment}
                minH="130px"
                maxLength={2000}
                placeholder="Tell other customers about your experience..."
                onChange={
                  event =>
                    setComment(
                      event.target.value
                    )
                }
              />

              <Flex
                justify="space-between"
                mt={1}
              >
                <FormErrorMessage>
                  Comment must contain at least 3 characters.
                </FormErrorMessage>

                <Text
                  ml="auto"
                  color="gray.500"
                  fontSize="xs"
                >
                  {comment.length}/2000
                </Text>
              </Flex>
            </FormControl>

            <HStack justify="flex-end">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm()
                  reviewForm.onClose()
                }}
              >
                Cancel
              </Button>

              <Button
                bg="#173F1F"
                color="white"
                isLoading={
                  creating ||
                  updating
                }
                loadingText="Saving"
                onClick={() =>
                  void submitReview()
                }
                _hover={{
                  bg: '#102f17'
                }}
              >
                {myReview
                  ? 'Update Review'
                  : 'Submit Review'}
              </Button>
            </HStack>
          </VStack>
        </Box>
      ) : null}

      <Divider mb={6} />

      {reviews.length ===
      0 ? (
        <Center py={10}>
          <VStack spacing={2}>
            <Star
              size={34}
              color="#CBD5E0"
            />

            <Text
              fontWeight="600"
              color="#173F1F"
            >
              No reviews yet
            </Text>

            <Text
              color="gray.500"
              fontSize="sm"
            >
              Be the first verified customer to review this item.
            </Text>
          </VStack>
        </Center>
      ) : (
        <VStack
          align="stretch"
          spacing={0}
        >
          {reviews.map(
            (
              review: { user: { fullName?: string | null; firstName?: string | null; lastName?: string | null } | null | undefined; id: Key | null | undefined; rating: number; createdAt: string | null | undefined; comment: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined },
              index: number
            ) => {
              const name =
                getDisplayName(
                  review.user
                )

              return (
                <Box
                  key={review.id}
                  py={5}
                  borderBottom={
                    index <
                    reviews.length -
                      1
                      ? '1px solid'
                      : 'none'
                  }
                  borderColor="gray.200"
                >
                  <Flex
                    justify="space-between"
                    align="flex-start"
                    gap={4}
                  >
                    <HStack
                      align="flex-start"
                      spacing={3}
                    >
                      <Avatar
                        name={name}
                        size="sm"
                        bg="#173F1F"
                        color="white"
                      >
                        {getInitials(
                          name
                        )}
                      </Avatar>

                      <Box>
                        <HStack>
                          <Text fontWeight="700">
                            {name}
                          </Text>

                          <Badge
                            colorScheme="green"
                            borderRadius="full"
                            textTransform="none"
                          >
                            Verified
                          </Badge>
                        </HStack>

                        <ReviewStars
                          value={
                            review.rating
                          }
                        />
                      </Box>
                    </HStack>

                    <Text
                      color="gray.500"
                      fontSize="sm"
                    >
                      {formatDate(
                        review.createdAt
                      )}
                    </Text>
                  </Flex>

                  {review.comment ? (
                    <Text
                      mt={3}
                      color="gray.700"
                      lineHeight="1.7"
                    >
                      {review.comment}
                    </Text>
                  ) : null}
                </Box>
              )
            }
          )}
        </VStack>
      )}
    </Box>
  )
}