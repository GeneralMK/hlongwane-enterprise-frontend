import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Image,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Select,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack
} from '@chakra-ui/react'
import type { ChangeEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  CreditCard,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  UploadCloud
} from 'lucide-react'

import { gql, useMutation, useQuery } from '@apollo/client'

enum EnumRentalStatus {
  Upcoming = 'UPCOMING',
  Active = 'ACTIVE',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
  Overdue = 'OVERDUE'
}

enum EnumReviewStatus {
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Rejected = 'REJECTED'
}

type RentalItemData = {
  id: string
  name: string
  imageUrl?: string | null
}

type RentalData = {
  id: string
  startDate: string
  endDate: string
  dailyRate: string | number
  totalAmount: string | number
  status: EnumRentalStatus
  returnedAt?: string | null
  item?: RentalItemData | null
}

type MyRentalsData = {
  myRentals:
    | RentalData[]
    | {
        rentals?: RentalData[] | null
        items?: RentalData[] | null
        total?: number | null
        page?: number | null
        limit?: number | null
        totalPages?: number | null
      }
}

type MyRentalsVariables = {
  page: number
  limit: number
}

type ReviewData = {
  id: string
  itemId?: string | null
  rating: number
  comment?: string | null
  status: EnumReviewStatus
}

type MyReviewsData = {
  myReviews: ReviewData[]
}

type CustomerReviewMutationResult = {
  id: string
  itemId?: string | null
  rating: number
  comment?: string | null
  status: EnumReviewStatus
}

type CreateCustomerReviewData = {
  createCustomerReview: CustomerReviewMutationResult
}

type CreateCustomerReviewVariables = {
  input: {
    itemId: string
    rating: number
    comment?: string | null
  }
}

type UpdateCustomerReviewData = {
  updateCustomerReview: CustomerReviewMutationResult
}

type UpdateCustomerReviewVariables = {
  id: string
  input: {
    rating?: number | null
    comment?: string | null
  }
}

type DeleteCustomerReviewData = {
  deleteCustomerReview: boolean
}

type DeleteCustomerReviewVariables = {
  id: string
}

type CreateSupportTicketData = {
  createSupportTicket: {
    id: string
    subject: string
    message: string
    category: string
    priority: string
    status: string
    rentalId?: string | null
    itemId?: string | null
    createdAt?: string | null
  }
}

type SupportTicketAttachmentInput = {
  fileName: string
  objectKey: string
  url: string
  contentType?: string | null
  size?: number | null
}

type UploadedSupportAttachment = SupportTicketAttachmentInput & {
  uploadId?: string | number
}

type CreateSupportTicketVariables = {
  input: {
    subject: string
    message: string
    category: string
    priority: string
    rentalId?: string | null
    itemId?: string | null
    attachments?: SupportTicketAttachmentInput[]
  }
}

type ExtendableRental = {
  id: string
  startDate: string
  endDate: string
  dailyRate: string | number
  totalAmount: string | number
  status: EnumRentalStatus
  item: RentalItemData
}

type InitiateRentalExtensionPaymentData = {
  initiateRentalExtensionPayment: {
    rentalId: string
    extensionId?: string | null
    currentEndDate: string
    requestedEndDate: string
    extensionDays: number
    dailyRate: string | number
    extensionAmount: string | number
    currency: string
    paymentReference: string
    authorizationUrl: string
  }
}

type InitiateRentalExtensionPaymentVariables = {
  input: {
    rentalId: string
    requestedEndDate: string
    callbackUrl: string
  }
}

type FileUploadApiRecord = {
  id?: string | number
  name?: string | null
  size?: number | null
  type?: string | null
  objectKey: string
  url: string
}

type FileUploadApiResponse = {
  success: boolean
  files: FileUploadApiRecord[]
}

const MY_RENTALS_QUERY = gql`
  query MyRentals($page: Int!, $limit: Int!) {
    myRentals(page: $page, limit: $limit) {
      rentals {
        id
        startDate
        endDate
        dailyRate
        totalAmount
        status
        returnedAt

        item {
          id
          name
          imageUrl
        }
      }

      total
      page
      limit
      totalPages
    }
  }
`

const MY_REVIEWS_QUERY = gql`
  query MyReviews {
    myReviews {
      id
      itemId
      rating
      comment
      status
    }
  }
`

const CREATE_CUSTOMER_REVIEW_MUTATION = gql`
  mutation CreateCustomerReview($input: CreateCustomerReviewInput!) {
    createCustomerReview(input: $input) {
      id
      itemId
      rating
      comment
      status
    }
  }
`

const UPDATE_CUSTOMER_REVIEW_MUTATION = gql`
  mutation UpdateCustomerReview($id: ID!, $input: UpdateCustomerReviewInput!) {
    updateCustomerReview(id: $id, input: $input) {
      id
      itemId
      rating
      comment
      status
    }
  }
`

const DELETE_CUSTOMER_REVIEW_MUTATION = gql`
  mutation DeleteCustomerReview($id: ID!) {
    deleteCustomerReview(id: $id)
  }
`

const CREATE_SUPPORT_TICKET_MUTATION = gql`
  mutation CreateSupportTicket($input: CreateSupportTicketInput!) {
    createSupportTicket(input: $input) {
      id
      subject
      message
      category
      priority
      status
      rentalId
      itemId
      createdAt
    }
  }
`

const INITIATE_RENTAL_EXTENSION_PAYMENT_MUTATION = gql`
  mutation InitiateRentalExtensionPayment(
    $input: InitiateRentalExtensionPaymentInput!
  ) {
    initiateRentalExtensionPayment(input: $input) {
      rentalId
      extensionId
      currentEndDate
      requestedEndDate
      extensionDays
      dailyRate
      extensionAmount
      currency
      paymentReference
      authorizationUrl
    }
  }
`
import { EmptyState, Info, SectionTitle } from '../components/AccountShared'
import { BRAND_GREEN, GOLD } from '../constants'
import type { AccountRental, ExistingReview, ReviewItemInput } from '../types'
import {
  formatCurrency,
  formatDate,
  formatStatus,
  getDaysRemaining,
  getRentalStatusColor,
  getReviewStatusColor,
  normaliseImage
} from '../utils'

type RentalsSectionProps = {
  /**
   * Optional legacy callback. The review modal is now handled
   * inside this component, so callers no longer need to provide it.
   */
  onReview?: (item: ReviewItemInput) => void
}

type RentalReview = {
  id: string
  itemId?: string | null
  rating: number
  comment?: string | null
  status: EnumReviewStatus
}

type SupportRental = {
  id: string
  item: {
    id: string
    name: string
    imageUrl?: string | null
  }
}

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normaliseRentals(value: unknown): AccountRental[] {
  if (Array.isArray(value)) {
    return value as AccountRental[]
  }

  if (!isRecord(value)) {
    return []
  }

  if (Array.isArray(value.rentals)) {
    return value.rentals as AccountRental[]
  }

  if (Array.isArray(value.items)) {
    return value.items as AccountRental[]
  }

  return []
}



function parseRentalDate(value: string): Date {
  const dateOnly = value.slice(0, 10)
  const parsed = new Date(`${dateOnly}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    throw new Error('The rental end date is invalid.')
  }

  return parsed
}

function toDateInputValue(value: string): string {
  return value.slice(0, 10)
}

function addCalendarDays(value: string, days: number): string {
  const date = parseRentalDate(value)
  date.setDate(date.getDate() + days)

  return date.toISOString().slice(0, 10)
}

function getCalendarDayDifference(fromDate: string, toDate: string): number {
  const from = parseRentalDate(fromDate)
  const to = parseRentalDate(toDate)

  return Math.round(
    (to.getTime() - from.getTime()) /
      (24 * 60 * 60 * 1000)
  )
}

function toNumericAmount(value: string | number): number {
  const amount =
    typeof value === 'number'
      ? value
      : Number(
          String(value)
            .replace(/[^0-9.-]/g, '')
            .trim()
        )

  return Number.isFinite(amount) ? amount : 0
}

function isRentalExtendable(rental: AccountRental): boolean {
  return (
    rental.status === EnumRentalStatus.Active ||
    rental.status === EnumRentalStatus.Upcoming
  )
}

function isNoDataError(error: unknown): boolean {
  if (!isRecord(error)) {
    return false
  }

  const message = typeof error.message === 'string' ? error.message.trim().toLowerCase() : ''

  const networkError = isRecord(error.networkError) ? error.networkError : null

  const statusCode = Number(networkError?.statusCode ?? networkError?.status ?? 0)

  return (
    statusCode === 204 ||
    statusCode === 404 ||
    (statusCode === 400 &&
      (message.includes('received status code 400') ||
        message.includes('no data') ||
        message.includes('not found') ||
        message.includes('no rentals') ||
        message.includes('no reviews')))
  )
}

export function RentalsSection(_props: RentalsSectionProps = {}) {
  const navigate = useNavigate()

  const supportModal = useDisclosure()
  const reviewModal = useDisclosure()
  const extensionModal = useDisclosure()

  const [selectedReviewItem, setSelectedReviewItem] = useState<ReviewItemInput | null>(null)

  const [selectedSupportRental, setSelectedSupportRental] = useState<SupportRental | null>(null)

  const [selectedExtensionRental, setSelectedExtensionRental] =
    useState<ExtendableRental | null>(null)

  const openExtensionModal = (rental: AccountRental): void => {
    if (!rental.item || !isRentalExtendable(rental)) {
      return
    }

    setSelectedExtensionRental({
      id: rental.id,
      startDate: rental.startDate,
      endDate: rental.endDate,
      dailyRate: Number(rental.dailyRate),
      totalAmount: Number(rental.totalAmount),
      status: rental.status,
      item: {
        id: rental.item.id,
        name: rental.item.name,
        imageUrl: rental.item.imageUrl
      }
    })

    extensionModal.onOpen()
  }

  const closeExtensionModal = (): void => {
    extensionModal.onClose()
    setSelectedExtensionRental(null)
  }

  const openSupportModal = (rental: AccountRental): void => {
    if (!rental.item) {
      return
    }

    setSelectedSupportRental({
      id: rental.id,
      item: {
        id: rental.item.id,
        name: rental.item.name,
        imageUrl: rental.item.imageUrl
      }
    })

    supportModal.onOpen()
  }

  const closeSupportModal = (): void => {
    supportModal.onClose()

    setSelectedSupportRental(null)
  }

  const openReviewModal = (item: ReviewItemInput): void => {
    setSelectedReviewItem(item)
    reviewModal.onOpen()
  }

  const closeReviewModal = (): void => {
    reviewModal.onClose()
    setSelectedReviewItem(null)
  }

  const { data, loading, error, refetch, networkStatus } = useQuery<
    MyRentalsData,
    MyRentalsVariables
  >(MY_RENTALS_QUERY, {
    variables: {
      page: 1,
      limit: 50
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'all'
  })

  const {
    data: reviewsData,
    loading: reviewsLoading,
    error: reviewsError,
    refetch: refetchReviews
  } = useQuery<MyReviewsData>(MY_REVIEWS_QUERY, {
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'all'
  })

  const rentals = useMemo<AccountRental[]>(
    () => normaliseRentals(data?.myRentals as unknown),
    [data?.myRentals]
  )

  const reviews = useMemo<RentalReview[]>(
    () => reviewsData?.myReviews ?? [],
    [reviewsData?.myReviews]
  )

  const reviewMap = useMemo(() => {
    const map = new Map<string, ExistingReview>()

    reviews.forEach((review) => {
      if (!review.itemId) {
        return
      }

      map.set(review.itemId, {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        status: review.status
      })
    })

    return map
  }, [reviews])

  const rentalsHaveNoData = isNoDataError(error)
  const reviewsHaveNoData = isNoDataError(reviewsError)

  const isRefreshing = networkStatus === 4

  const handleRefresh = async (): Promise<void> => {
    await Promise.allSettled([refetch(), refetchReviews()])
  }

  if (loading && rentals.length === 0) {
    return <RentalsLoadingState />
  }

  if (error && !rentalsHaveNoData && rentals.length === 0) {
    return (
      <RentalsErrorState
        message={error.message}
        isRetrying={isRefreshing}
        onRetry={() => {
          void handleRefresh()
        }}
      />
    )
  }

  return (
    <>
      <Box>
        <Flex
          align={{
            base: 'flex-start',
            md: 'center'
          }}
          justify="space-between"
          direction={{
            base: 'column',
            md: 'row'
          }}
          gap={4}
          mb="26px"
        >
          <Box>
            <SectionTitle>My Rentals</SectionTitle>

            <Text mt="-14px" color="#65745f" fontSize="14px">
              View and manage your equipment rentals.
            </Text>
          </Box>

          <Button
            variant="outline"
            color={BRAND_GREEN}
            borderColor={BRAND_GREEN}
            borderRadius="999px"
            isLoading={isRefreshing}
            loadingText="Refreshing"
            onClick={() => {
              void handleRefresh()
            }}
            _hover={{
              bg: '#edf4e5'
            }}
          >
            Refresh Rentals
          </Button>
        </Flex>

        {error && !rentalsHaveNoData && rentals.length > 0 ? (
          <Alert status="warning" mb={5} borderRadius="12px">
            <AlertIcon />

            <Box>
              <AlertTitle>Rentals may be out of date</AlertTitle>

              <AlertDescription>{error.message}</AlertDescription>
            </Box>
          </Alert>
        ) : null}

        {reviewsError && !reviewsHaveNoData && rentals.length > 0 ? (
          <Alert status="warning" mb={5} borderRadius="12px">
            <AlertIcon />

            <Box>
              <AlertTitle>Reviews may be out of date</AlertTitle>

              <AlertDescription>{reviewsError.message}</AlertDescription>
            </Box>
          </Alert>
        ) : null}

        {rentals.length === 0 ? (
          <EmptyState title="No rentals yet" message="Equipment you rent will appear here." />
        ) : (
          <VStack spacing="22px" align="stretch">
            {rentals.map((rental) => {
              const item = rental.item

              if (!item) {
                return null
              }

              const review = reviewMap.get(item.id)

              return (
                <RentalCard
                  key={rental.id}
                  rental={rental}
                  review={review}
                  reviewsLoading={reviewsLoading}
                  onReview={() => {
                    openReviewModal({
                      id: item.id,
                      name: item.name,
                      imageUrl: item.imageUrl,
                      existingReview: review ?? null
                    })
                  }}
                  onViewItem={() => {
                    navigate(`/equipment/${item.id}`)
                  }}
                  onExtend={() => {
                    openExtensionModal(rental)
                  }}
                  onSupport={() => {
                    openSupportModal(rental)
                  }}
                />
              )
            })}
          </VStack>
        )}
      </Box>

      <ReviewModal
        isOpen={reviewModal.isOpen}
        item={selectedReviewItem}
        onClose={closeReviewModal}
        onSaved={async () => {
          await refetchReviews()
        }}
      />

      <RentalExtensionModal
        isOpen={extensionModal.isOpen}
        rental={selectedExtensionRental}
        onClose={closeExtensionModal}
      />

      <SupportTicketModal
        isOpen={supportModal.isOpen}
        rental={selectedSupportRental}
        onClose={closeSupportModal}
      />
    </>
  )
}

type RentalCardProps = {
  rental: AccountRental
  review?: ExistingReview
  reviewsLoading: boolean
  onReview: () => void
  onViewItem: () => void
  onExtend: () => void
  onSupport: () => void
}

function RentalCard({
  rental,
  review,
  reviewsLoading,
  onReview,
  onViewItem,
  onExtend,
  onSupport
}: RentalCardProps) {
  const item = rental.item

  const isCompleted = rental.status === EnumRentalStatus.Completed

  const isActive =
    rental.status === EnumRentalStatus.Active || rental.status === EnumRentalStatus.Upcoming

  const isCancelled = rental.status === EnumRentalStatus.Cancelled

  const isOverdue = rental.status === EnumRentalStatus.Overdue

  const daysLeft = isActive ? getDaysRemaining(rental.endDate) : null

  const primaryActionLabel = isActive
    ? 'Extend Rental'
    : isCancelled
    ? 'View Equipment'
    : 'Rent Again'

  const handlePrimaryAction = isActive ? onExtend : onViewItem

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor={isOverdue ? 'red.200' : '#e8ece4'}
      borderRadius="18px"
      boxShadow="0 8px 24px rgba(0,0,0,0.06)"
      p={{
        base: '20px',
        md: '28px'
      }}
    >
      <Flex
        justify="space-between"
        align={{
          base: 'flex-start',
          md: 'center'
        }}
        direction={{
          base: 'column',
          md: 'row'
        }}
        gap={5}
      >
        <HStack spacing="22px" align="start">
          <Image
            src={normaliseImage(item.imageUrl)}
            alt={item.name}
            w={{
              base: '76px',
              md: '90px'
            }}
            h={{
              base: '76px',
              md: '90px'
            }}
            objectFit="contain"
            bg="#fafafa"
            borderRadius="14px"
            cursor="pointer"
            onClick={onViewItem}
          />

          <Box>
            <Text
              color={BRAND_GREEN}
              fontSize={{
                base: '18px',
                md: '22px'
              }}
              fontWeight="800"
              cursor="pointer"
              onClick={onViewItem}
              _hover={{
                textDecoration: 'underline'
              }}
            >
              {item.name}
            </Text>

            <Text mt={1} color="#53664b" fontSize="14px" wordBreak="break-all">
              Rental ID: {rental.id}
            </Text>

            <HStack mt="8px" spacing={2} flexWrap="wrap">
              <Badge
                colorScheme={getRentalStatusColor(rental.status)}
                borderRadius="999px"
                textTransform="none"
                px={3}
                py={1}
              >
                {formatStatus(rental.status)}
              </Badge>

              {review ? (
                <Badge
                  colorScheme={getReviewStatusColor(review.status)}
                  borderRadius="999px"
                  textTransform="none"
                  px={3}
                  py={1}
                >
                  Review {formatStatus(review.status)}
                </Badge>
              ) : null}
            </HStack>
          </Box>
        </HStack>

        {daysLeft !== null ? (
          <Box
            minW="90px"
            textAlign={{
              base: 'left',
              md: 'center'
            }}
          >
            <Text color={daysLeft <= 3 ? 'red.500' : GOLD} fontSize="26px" fontWeight="800">
              {Math.max(daysLeft, 0)}
            </Text>

            <Text color="#53664b" fontSize="14px">
              {daysLeft === 1 ? 'day left' : 'days left'}
            </Text>
          </Box>
        ) : null}
      </Flex>

      <SimpleGrid
        columns={{
          base: 1,
          sm: 2,
          lg: 4
        }}
        mt="22px"
        spacing="20px"
      >
        <Info label="Start Date" value={formatDate(rental.startDate)} />

        <Info label="End Date" value={formatDate(rental.endDate)} />

        <Info label="Daily Rate" value={formatCurrency(rental.dailyRate)} />

        <Info label="Total" value={formatCurrency(rental.totalAmount)} />
      </SimpleGrid>

      {rental.returnedAt ? (
        <Box mt={5} p={4} bg="#f5f8f2" borderRadius="12px">
          <Text color="#53664b" fontSize="13px">
            Returned on
          </Text>

          <Text color={BRAND_GREEN} fontWeight="700">
            {formatDate(rental.returnedAt)}
          </Text>
        </Box>
      ) : null}

      <Flex
        mt="22px"
        align={{
          base: 'flex-start',
          md: 'center'
        }}
        justify="space-between"
        direction={{
          base: 'column',
          md: 'row'
        }}
        gap={4}
      >
        <HStack spacing={3} flexWrap="wrap">
          <Button
            bg="white"
            color={BRAND_GREEN}
            border="2px solid"
            borderColor={BRAND_GREEN}
            borderRadius="999px"
            onClick={handlePrimaryAction}
            _hover={{
              bg: '#edf4e5'
            }}
          >
            {primaryActionLabel}
          </Button>

          {!isCompleted ? (
            <Button
              variant="ghost"
              color={BRAND_GREEN}
              borderRadius="999px"
              onClick={onSupport}
              _hover={{
                bg: '#edf4e5'
              }}
            >
              Contact Support
            </Button>
          ) : null}
        </HStack>

        <Button
          type="button"
          variant="link"
          color={BRAND_GREEN}
          fontSize="14px"
          fontWeight="700"
          textDecoration="underline"
          textUnderlineOffset="4px"
          isDisabled={reviewsLoading}
          isLoading={reviewsLoading}
          loadingText="Loading review..."
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()

            onReview()
          }}
          _hover={{
            color: '#102f17'
          }}
          _focusVisible={{
            boxShadow: '0 0 0 2px var(--chakra-colors-green-400)',
            borderRadius: '4px'
          }}
        >
          {review ? 'Edit Review' : 'Submit Review'}
        </Button>
      </Flex>
    </Box>
  )
}


function RentalExtensionModal({
  isOpen,
  rental,
  onClose
}: {
  isOpen: boolean
  rental: ExtendableRental | null
  onClose: () => void
}) {
  const toast = useToast()

  const [requestedEndDate, setRequestedEndDate] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [initiateExtensionPayment, { loading }] = useMutation<
    InitiateRentalExtensionPaymentData,
    InitiateRentalExtensionPaymentVariables
  >(INITIATE_RENTAL_EXTENSION_PAYMENT_MUTATION)

  useEffect(() => {
    if (!isOpen || !rental) {
      return
    }

    setRequestedEndDate(
      addCalendarDays(
        rental.endDate,
        1
      )
    )
    setSubmitted(false)
  }, [isOpen, rental])

  const minimumExtensionDate = rental
    ? addCalendarDays(rental.endDate, 1)
    : ''

  const extensionDays = useMemo(() => {
    if (
      !rental ||
      !requestedEndDate
    ) {
      return 0
    }

    return Math.max(
      getCalendarDayDifference(
        rental.endDate,
        requestedEndDate
      ),
      0
    )
  }, [
    rental,
    requestedEndDate
  ])

  const dailyRate = rental
    ? toNumericAmount(rental.dailyRate)
    : 0

  const extensionAmount =
    extensionDays * dailyRate

  const invalidDate =
    submitted &&
    (
      !requestedEndDate ||
      extensionDays < 1
    )

  const handleClose = (): void => {
    if (loading) {
      return
    }

    setSubmitted(false)
    setRequestedEndDate('')
    onClose()
  }

  const handleProceedToPayment =
    async (): Promise<void> => {
      setSubmitted(true)

      if (
        !rental ||
        !requestedEndDate ||
        extensionDays < 1 ||
        loading
      ) {
        return
      }

      try {
         const callbackUrl =

        `${window.location.origin}/payment/callback` +

        `?extensionPayment=verify` +

        `&rentalId=${encodeURIComponent(rental.id)}`

        const result =
          await initiateExtensionPayment({
            variables: {
              input: {
                rentalId: rental.id,
                requestedEndDate,
                callbackUrl
              }
            }
          })

        const payment =
          result.data
            ?.initiateRentalExtensionPayment

        if (
          !payment?.authorizationUrl
        ) {
          throw new Error(
            'The payment provider did not return a payment URL.'
          )
        }

        window.location.assign(
          payment.authorizationUrl
        )
      } catch (error) {
        toast({
          title:
            'Unable to start extension payment',
          description:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred.',
          status: 'error',
          duration: 5000,
          isClosable: true
        })
      }
    }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isCentered
      size={{
        base: 'full',
        md: 'lg'
      }}
      closeOnEsc={!loading}
      closeOnOverlayClick={!loading}
    >
      <ModalOverlay
        bg="blackAlpha.600"
        backdropFilter="blur(8px)"
      />

      <ModalContent
        mx={{
          base: 0,
          md: 4
        }}
        borderRadius={{
          base: 0,
          md: '18px'
        }}
        overflow="hidden"
      >
        <ModalHeader
          color={BRAND_GREEN}
          fontSize="24px"
          fontWeight="800"
        >
          Extend Rental
        </ModalHeader>

        <ModalCloseButton
          isDisabled={loading}
        />

        <ModalBody>
          {rental ? (
            <VStack
              spacing={5}
              align="stretch"
            >
              <Box
                p={4}
                bg="#f5f8f2"
                border="1px solid"
                borderColor="#e1e8dc"
                borderRadius="12px"
              >
                <HStack
                  spacing={3}
                  align="center"
                >
                  <Image
                    src={normaliseImage(
                      rental.item.imageUrl
                    )}
                    alt={rental.item.name}
                    boxSize="68px"
                    objectFit="contain"
                    bg="white"
                    borderRadius="10px"
                  />

                  <Box minW={0}>
                    <Text
                      color={BRAND_GREEN}
                      fontWeight="800"
                      noOfLines={2}
                    >
                      {rental.item.name}
                    </Text>

                    <Text
                      color="#65745f"
                      fontSize="12px"
                      wordBreak="break-all"
                    >
                      Rental ID: {rental.id}
                    </Text>
                  </Box>
                </HStack>
              </Box>

              <Alert
                status="info"
                borderRadius="12px"
                alignItems="flex-start"
              >
                <AlertIcon mt={1} />

                <Box>
                  <AlertTitle>
                    Payment is required
                  </AlertTitle>

                  <AlertDescription>
                    Your rental will only be extended
                    after the extension payment has
                    been completed successfully.
                  </AlertDescription>
                </Box>
              </Alert>

              <SimpleGrid
                columns={{
                  base: 1,
                  sm: 2
                }}
                spacing={4}
              >
                <Info
                  label="Current End Date"
                  value={formatDate(
                    rental.endDate
                  )}
                />

                <Info
                  label="Daily Rate"
                  value={formatCurrency(
                    rental.dailyRate
                  )}
                />
              </SimpleGrid>

              <FormControl
                isRequired
                isInvalid={Boolean(
                  invalidDate
                )}
              >
                <FormLabel>
                  New End Date
                </FormLabel>

                <Input
                  type="date"
                  value={
                    requestedEndDate
                  }
                  min={
                    minimumExtensionDate
                  }
                  isDisabled={loading}
                  onChange={event => {
                    setRequestedEndDate(
                      event.target.value
                    )
                  }}
                />

                <FormHelperText>
                  Select a date after{' '}
                  {formatDate(
                    rental.endDate
                  )}.
                </FormHelperText>

                <FormErrorMessage>
                  The new end date must be after
                  the current rental end date.
                </FormErrorMessage>
              </FormControl>

              <Box
                p={5}
                bg="#fffaf0"
                border="1px solid"
                borderColor="orange.200"
                borderRadius="14px"
              >
                <HStack
                  justify="space-between"
                  align="start"
                  mb={3}
                >
                  <HStack
                    color={BRAND_GREEN}
                    spacing={2}
                  >
                    <CalendarDays
                      size={18}
                    />

                    <Text fontWeight="700">
                      Extension
                    </Text>
                  </HStack>

                  <Text
                    color={BRAND_GREEN}
                    fontWeight="800"
                  >
                    {extensionDays}{' '}
                    {extensionDays === 1
                      ? 'day'
                      : 'days'}
                  </Text>
                </HStack>

                <Flex
                  justify="space-between"
                  gap={4}
                  color="#53664b"
                  fontSize="14px"
                >
                  <Text>
                    {extensionDays} ×{' '}
                    {formatCurrency(
                      dailyRate
                    )}
                  </Text>

                  <Text fontWeight="700">
                    {formatCurrency(
                      extensionAmount
                    )}
                  </Text>
                </Flex>

                <Flex
                  mt={4}
                  pt={4}
                  borderTop="1px solid"
                  borderColor="orange.200"
                  justify="space-between"
                  align="center"
                >
                  <Text
                    color={BRAND_GREEN}
                    fontWeight="800"
                  >
                    Amount Due
                  </Text>

                  <Text
                    color={BRAND_GREEN}
                    fontSize="24px"
                    fontWeight="900"
                  >
                    {formatCurrency(
                      extensionAmount
                    )}
                  </Text>
                </Flex>
              </Box>

              <Text
                color="#65745f"
                fontSize="12px"
                lineHeight="1.6"
              >
                Availability will be validated
                again before payment. The new end
                date is confirmed only after the
                payment provider reports a
                successful transaction.
              </Text>
            </VStack>
          ) : null}
        </ModalBody>

        <ModalFooter
          gap={3}
          borderTop="1px solid"
          borderColor="#e1e8dc"
          flexWrap="wrap"
        >
          <Button
            variant="outline"
            borderRadius="full"
            isDisabled={loading}
            onClick={handleClose}
          >
            Cancel
          </Button>

          <Button
            bg={BRAND_GREEN}
            color="white"
            borderRadius="full"
            leftIcon={
              <CreditCard size={17} />
            }
            isLoading={loading}
            loadingText="Preparing payment"
            isDisabled={
              !rental ||
              extensionDays < 1 ||
              extensionAmount <= 0
            }
            onClick={() => {
              void handleProceedToPayment()
            }}
            _hover={{
              bg: '#102f17'
            }}
            _disabled={{
              bg: '#9AA392',
              cursor: 'not-allowed'
            }}
          >
            Pay {formatCurrency(
              extensionAmount
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

function ReviewModal({
  isOpen,
  item,
  onClose,
  onSaved
}: {
  isOpen: boolean
  item: ReviewItemInput | null
  onClose: () => void
  onSaved: () => Promise<unknown>
}) {
  const toast = useToast()

  const [rating, setRating] = useState(0)

  const [comment, setComment] = useState('')

  const [submitted, setSubmitted] = useState(false)

  const [createReview, { loading: creating }] = useMutation<
    CreateCustomerReviewData,
    CreateCustomerReviewVariables
  >(CREATE_CUSTOMER_REVIEW_MUTATION)

  const [updateReview, { loading: updating }] = useMutation<
    UpdateCustomerReviewData,
    UpdateCustomerReviewVariables
  >(UPDATE_CUSTOMER_REVIEW_MUTATION)

  const [deleteReview, { loading: deleting }] = useMutation<
    DeleteCustomerReviewData,
    DeleteCustomerReviewVariables
  >(DELETE_CUSTOMER_REVIEW_MUTATION)

  const existingReview = item?.existingReview ?? null

  const loading = creating || updating || deleting

  useEffect(() => {
    if (!isOpen || !item) {
      return
    }

    setRating(existingReview?.rating ?? 0)

    setComment(existingReview?.comment ?? '')

    setSubmitted(false)
  }, [isOpen, item, existingReview?.id, existingReview?.rating, existingReview?.comment])

  const ratingError = submitted && (rating < 1 || rating > 5)

  const commentError = submitted && comment.trim().length > 1000

  const handleClose = (): void => {
    if (loading) {
      return
    }

    setSubmitted(false)
    onClose()
  }

  const handleSave = async (): Promise<void> => {
    setSubmitted(true)

    if (!item || rating < 1 || rating > 5 || comment.trim().length > 1000) {
      return
    }

    try {
      if (existingReview) {
        await updateReview({
          variables: {
            id: existingReview.id,
            input: {
              rating,
              comment: comment.trim() || null
            }
          }
        })
      } else {
        await createReview({
          variables: {
            input: {
              itemId: item.id,
              rating,
              comment: comment.trim() || null
            }
          }
        })
      }

      await onSaved()

      toast({
        title: existingReview ? 'Review updated' : 'Review submitted',
        description: 'Your review has been saved and may require approval before it is displayed.',
        status: 'success',
        duration: 4000,
        isClosable: true
      })

      onClose()
    } catch (error) {
      toast({
        title: existingReview ? 'Unable to update review' : 'Unable to submit review',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (!existingReview) {
      return
    }

    try {
      await deleteReview({
        variables: {
          id: existingReview.id
        }
      })

      await onSaved()

      toast({
        title: 'Review deleted',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      onClose()
    } catch (error) {
      toast({
        title: 'Unable to delete review',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isCentered
      size={{
        base: 'full',
        md: 'lg'
      }}
      closeOnEsc={!loading}
      closeOnOverlayClick={!loading}
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(8px)" />

      <ModalContent
        mx={{
          base: 0,
          md: 4
        }}
        borderRadius={{
          base: 0,
          md: '18px'
        }}
        overflow="hidden"
      >
        <ModalHeader color={BRAND_GREEN} fontSize="24px" fontWeight="800">
          {existingReview ? 'Edit Review' : 'Submit Review'}
        </ModalHeader>

        <ModalCloseButton isDisabled={loading} />

        <ModalBody>
          {item ? (
            <Box
              mb={5}
              p={4}
              bg="#f5f8f2"
              border="1px solid"
              borderColor="#e1e8dc"
              borderRadius="12px"
            >
              <HStack spacing={3} align="center">
                <Image
                  src={normaliseImage(item.imageUrl)}
                  alt={item.name}
                  boxSize="68px"
                  objectFit="contain"
                  bg="white"
                  borderRadius="10px"
                />

                <Box minW={0}>
                  <Text color={BRAND_GREEN} fontWeight="800" noOfLines={2}>
                    {item.name}
                  </Text>

                  {existingReview ? (
                    <Badge
                      mt={2}
                      colorScheme={getReviewStatusColor(existingReview.status)}
                      borderRadius="full"
                      textTransform="none"
                    >
                      {formatStatus(existingReview.status)}
                    </Badge>
                  ) : null}
                </Box>
              </HStack>
            </Box>
          ) : null}

          <VStack spacing={5} align="stretch">
            <FormControl isRequired isInvalid={Boolean(ratingError)}>
              <FormLabel>Rating</FormLabel>

              <HStack spacing={2}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <Button
                    key={value}
                    type="button"
                    size="lg"
                    minW="48px"
                    px={0}
                    color={value <= rating ? GOLD : 'gray.300'}
                    bg={value <= rating ? '#fff8dc' : 'gray.50'}
                    border="1px solid"
                    borderColor={value <= rating ? GOLD : 'gray.200'}
                    aria-label={`${value} star rating`}
                    onClick={() => {
                      setRating(value)
                    }}
                    _hover={{
                      bg: '#fff8dc',
                      color: GOLD
                    }}
                  >
                    ★
                  </Button>
                ))}
              </HStack>

              <FormErrorMessage>Select a rating between 1 and 5.</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={Boolean(commentError)}>
              <FormLabel>Comment</FormLabel>

              <Textarea
                value={comment}
                minH="150px"
                maxLength={1000}
                resize="vertical"
                placeholder="Share your experience with this equipment"
                onChange={(event) => {
                  setComment(event.target.value)
                }}
              />

              <Flex mt={1} justify="space-between" gap={3}>
                <FormErrorMessage mt={0}>Comment cannot exceed 1000 characters.</FormErrorMessage>

                <Text ml="auto" color="gray.500" fontSize="11px">
                  {comment.length}/1000
                </Text>
              </Flex>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter gap={3} borderTop="1px solid" borderColor="#e1e8dc" flexWrap="wrap">
          {existingReview ? (
            <Button
              mr="auto"
              colorScheme="red"
              variant="ghost"
              isLoading={deleting}
              isDisabled={creating || updating}
              onClick={() => {
                void handleDelete()
              }}
            >
              Delete Review
            </Button>
          ) : null}

          <Button variant="outline" borderRadius="full" isDisabled={loading} onClick={handleClose}>
            Cancel
          </Button>

          <Button
            bg={BRAND_GREEN}
            color="white"
            borderRadius="full"
            isLoading={creating || updating}
            loadingText="Saving"
            isDisabled={deleting}
            onClick={() => {
              void handleSave()
            }}
            _hover={{
              bg: '#102f17'
            }}
          >
            {existingReview ? 'Save Changes' : 'Submit Review'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

type SupportTicketCategory =
  | 'RENTAL_SUPPORT'
  | 'EQUIPMENT_ISSUE'
  | 'DELIVERY'
  | 'EXTENSION'
  | 'RETURN'
  | 'BILLING'
  | 'OTHER'

const MAX_SUPPORT_ATTACHMENTS = 10
const MAX_SUPPORT_ATTACHMENT_SIZE = 10 * 1024 * 1024

const ALLOWED_SUPPORT_ATTACHMENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
])

function getApiBaseUrl(): string {
  return String(
    import.meta.env.VITE_APP_API_HOST ?? import.meta.env.VITE_BACKEND_URL ?? ''
  ).replace(/\/+$/, '')
}

type StoredAuthentication = {
  jwt?: unknown
  token?: unknown
  accessToken?: unknown
  authToken?: unknown
  userToken?: unknown
  user?: unknown
  authentication?: unknown
  auth?: unknown
  session?: unknown
}

function normaliseAccessToken(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const token = value.trim().replace(/^Bearer\s+/i, '')

  return token.length > 0 ? token : null
}

function findTokenInValue(value: unknown, depth = 0): string | null {
  if (depth > 4) {
    return null
  }

  const directToken = normaliseAccessToken(value)

  if (directToken && directToken.split('.').length === 3) {
    return directToken
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>

  const preferredKeys = ['jwt', 'accessToken', 'token', 'authToken', 'userToken']

  for (const key of preferredKeys) {
    const token = normaliseAccessToken(record[key])

    if (token) {
      return token
    }
  }

  const nestedKeys = ['user', 'authentication', 'auth', 'session', 'data', 'state']

  for (const key of nestedKeys) {
    const token = findTokenInValue(record[key], depth + 1)

    if (token) {
      return token
    }
  }

  return null
}

function readAccessToken(): string | null {
  const storageKeys = [
    'MFS_PORTAL',
    'accessToken',
    'token',
    'authToken',
    'userToken',
    'jwt',
    'auth',
    'user',
    'session',
    'persist:root'
  ]

  for (const key of storageKeys) {
    const rawValue = localStorage.getItem(key)

    if (!rawValue) {
      continue
    }

    const rawToken = normaliseAccessToken(rawValue)

    if (rawToken && rawToken.split('.').length === 3) {
      return rawToken
    }

    try {
      const parsed = JSON.parse(rawValue) as StoredAuthentication
      const token = findTokenInValue(parsed)

      if (token) {
        return token
      }
    } catch {
      // Ignore non-JSON legacy values and continue checking other keys.
    }
  }

  return null
}

function formatFileSize(size?: number | null): string {
  if (!size || size < 1) {
    return 'Unknown size'
  }

  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function validateSupportFiles(files: File[], existingCount: number): string | null {
  if (existingCount + files.length > MAX_SUPPORT_ATTACHMENTS) {
    return `A maximum of ${MAX_SUPPORT_ATTACHMENTS} attachments is allowed.`
  }

  for (const file of files) {
    const mimeType = file.type.trim().toLowerCase()

    if (!ALLOWED_SUPPORT_ATTACHMENT_TYPES.has(mimeType)) {
      return `${file.name} is not supported. Upload PDF, JPG, PNG or WebP files.`
    }

    if (file.size <= 0) {
      return `${file.name} is empty.`
    }

    if (file.size > MAX_SUPPORT_ATTACHMENT_SIZE) {
      return `${file.name} exceeds the 10 MB limit.`
    }
  }

  return null
}

async function uploadSupportFiles(files: File[]): Promise<UploadedSupportAttachment[]> {
  const token = readAccessToken()

  if (!token) {
    throw new Error('Authentication token was not found. Please sign in again.')
  }

  const apiBaseUrl = getApiBaseUrl()

  if (!apiBaseUrl) {
    throw new Error('The backend API URL is not configured.')
  }

  const formData = new FormData()

  files.forEach((file) => {
    formData.append('files', file, file.name)
  })

  formData.append('folder', 'support-ticket-attachments')

  const response = await fetch(`${apiBaseUrl}/files/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    credentials: 'include',
    body: formData
  })

  const responseText = await response.text()
  let payload: FileUploadApiResponse | { message?: string; error?: string } | null = null

  if (responseText) {
    try {
      payload = JSON.parse(responseText) as
        | FileUploadApiResponse
        | { message?: string; error?: string }
    } catch {
      payload = {
        message: responseText
      }
    }
  }

  if (!response.ok) {
    const failure = payload as { message?: string; error?: string } | null

    throw new Error(
      failure?.message ??
        failure?.error ??
        `Unable to upload attachments. The server returned ${response.status}.`
    )
  }

  const result = payload as FileUploadApiResponse | null

  if (!result?.success || !Array.isArray(result.files)) {
    throw new Error('The upload service did not return uploaded files.')
  }

  return result.files.map((file) => ({
    uploadId: file.id,
    fileName: file.name?.trim() || 'attachment',
    objectKey: file.objectKey,
    url: file.url,
    contentType: file.type?.trim() || null,
    size: file.size ?? null
  }))
}

function SupportTicketModal({
  isOpen,
  rental,
  onClose
}: {
  isOpen: boolean
  rental: SupportRental | null
  onClose: () => void
}) {
  const toast = useToast()

  const [category, setCategory] = useState<SupportTicketCategory>('RENTAL_SUPPORT')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<UploadedSupportAttachment[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [createSupportTicket, { loading: creatingTicket }] = useMutation<
    CreateSupportTicketData,
    CreateSupportTicketVariables
  >(CREATE_SUPPORT_TICKET_MUTATION)

  const loading = uploading || creatingTicket

  useEffect(() => {
    if (!isOpen || !rental) {
      return
    }

    setCategory('RENTAL_SUPPORT')
    setSubject(`Support required for ${rental.item.name}`)
    setMessage(`I need assistance with rental ${rental.id} for ${rental.item.name}.`)
    setAttachments([])
    setUploadError(null)
    setSubmitted(false)
  }, [isOpen, rental])

  const subjectError = submitted && subject.trim().length < 5
  const messageError = submitted && message.trim().length < 10

  const handleClose = (): void => {
    if (loading) {
      return
    }

    setSubmitted(false)
    setUploadError(null)
    setAttachments([])
    onClose()
  }

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const selectedFiles = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (selectedFiles.length === 0) {
      return
    }

    const validationError = validateSupportFiles(selectedFiles, attachments.length)

    if (validationError) {
      setUploadError(validationError)
      toast({
        title: 'Unable to add attachment',
        description: validationError,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
      return
    }

    setUploading(true)
    setUploadError(null)

    try {
      const uploadedFiles = await uploadSupportFiles(selectedFiles)

      setAttachments((current) => [...current, ...uploadedFiles])

      toast({
        title: uploadedFiles.length === 1 ? 'Attachment uploaded' : 'Attachments uploaded',
        description: `${uploadedFiles.length} file${uploadedFiles.length === 1 ? '' : 's'} added.`,
        status: 'success',
        duration: 2500,
        isClosable: true
      })
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Unable to upload attachments.'

      setUploadError(description)

      toast({
        title: 'Attachment upload failed',
        description,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = (objectKey: string): void => {
    if (loading) {
      return
    }

    setAttachments((current) => current.filter((attachment) => attachment.objectKey !== objectKey))
  }

  const handleSubmit = async (): Promise<void> => {
    setSubmitted(true)

    if (!rental || subject.trim().length < 5 || message.trim().length < 10 || uploading) {
      return
    }

    try {
      await createSupportTicket({
        variables: {
          input: {
            subject: subject.trim(),
            message: message.trim(),
            category,
            priority: category === 'EQUIPMENT_ISSUE' ? 'HIGH' : 'NORMAL',
            rentalId: rental.id,
            itemId: rental.item.id,
            attachments: attachments.map((attachment) => ({
              fileName: attachment.fileName,
              objectKey: attachment.objectKey,
              url: attachment.url,
              contentType: attachment.contentType ?? null,
              size: attachment.size ?? null
            }))
          }
        }
      })

      toast({
        title: 'Support ticket submitted',
        description:
          attachments.length > 0
            ? `Your ticket and ${attachments.length} attachment${
                attachments.length === 1 ? '' : 's'
              } were submitted successfully.`
            : 'Our support team will contact you regarding this rental.',
        status: 'success',
        duration: 4000,
        isClosable: true
      })

      setSubmitted(false)
      setAttachments([])
      setUploadError(null)
      onClose()
    } catch (error) {
      toast({
        title: 'Unable to submit ticket',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isCentered
      size={{
        base: 'full',
        md: 'lg'
      }}
      motionPreset="scale"
      closeOnOverlayClick={!loading}
      closeOnEsc={!loading}
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(8px)" />

      <ModalContent
        mx={{
          base: 0,
          md: 4
        }}
        borderRadius={{
          base: 0,
          md: '18px'
        }}
        overflow="hidden"
      >
        <ModalHeader color={BRAND_GREEN} fontSize="24px" fontWeight="800">
          Contact Support
        </ModalHeader>

        <ModalCloseButton isDisabled={loading} />

        <ModalBody overflowY="auto">
          {rental ? (
            <Box
              mb={5}
              p={4}
              bg="#f5f8f2"
              borderRadius="12px"
              border="1px solid"
              borderColor="#e1e8dc"
            >
              <HStack spacing={3} align="center">
                <Image
                  src={normaliseImage(rental.item.imageUrl)}
                  alt={rental.item.name}
                  boxSize="62px"
                  objectFit="contain"
                  bg="white"
                  borderRadius="10px"
                />

                <Box minW={0}>
                  <Text color={BRAND_GREEN} fontWeight="800" noOfLines={1}>
                    {rental.item.name}
                  </Text>

                  <Text color="#65745f" fontSize="12px" wordBreak="break-all">
                    Rental ID: {rental.id}
                  </Text>
                </Box>
              </HStack>
            </Box>
          ) : null}

          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Ticket Type</FormLabel>

              <Select
                value={category}
                isDisabled={loading}
                onChange={(event) => {
                  setCategory(event.target.value as SupportTicketCategory)
                }}
              >
                <option value="RENTAL_SUPPORT">Rental Support</option>
                <option value="EQUIPMENT_ISSUE">Equipment Issue</option>
                <option value="DELIVERY">Delivery</option>
                <option value="EXTENSION">Rental Extension</option>
                <option value="RETURN">Rental Return</option>
                <option value="BILLING">Billing</option>
                <option value="OTHER">Other</option>
              </Select>
            </FormControl>

            <FormControl isRequired isInvalid={Boolean(subjectError)}>
              <FormLabel>Subject</FormLabel>

              <Input
                value={subject}
                maxLength={150}
                isDisabled={loading}
                placeholder="Describe the issue briefly"
                onChange={(event) => {
                  setSubject(event.target.value)
                }}
              />

              <FormErrorMessage>Subject must contain at least 5 characters.</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={Boolean(messageError)}>
              <FormLabel>Message</FormLabel>

              <Textarea
                value={message}
                minH="150px"
                maxLength={3000}
                resize="vertical"
                isDisabled={loading}
                placeholder="Explain the issue you are experiencing"
                onChange={(event) => {
                  setMessage(event.target.value)
                }}
              />

              <Flex mt={1} justify="space-between" gap={3}>
                <FormErrorMessage mt={0}>
                  Message must contain at least 10 characters.
                </FormErrorMessage>

                <Text ml="auto" color="gray.500" fontSize="11px">
                  {message.length}/3000
                </Text>
              </Flex>
            </FormControl>

            <FormControl isInvalid={Boolean(uploadError)}>
              <FormLabel>Attachments</FormLabel>

              <Box
                position="relative"
                p={5}
                border="2px dashed"
                borderColor={uploadError ? 'red.300' : 'gray.300'}
                borderRadius="14px"
                bg={uploadError ? 'red.50' : 'gray.50'}
                textAlign="center"
                transition="all 0.2s"
                _hover={{
                  borderColor: loading ? undefined : BRAND_GREEN,
                  bg: loading ? undefined : '#f5f8f2'
                }}
              >
                <Input
                  position="absolute"
                  inset={0}
                  width="100%"
                  height="100%"
                  opacity={0}
                  cursor={loading ? 'not-allowed' : 'pointer'}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                  isDisabled={loading || attachments.length >= MAX_SUPPORT_ATTACHMENTS}
                  onChange={(event) => {
                    void handleFileSelection(event)
                  }}
                />

                <VStack spacing={2}>
                  <Flex
                    align="center"
                    justify="center"
                    boxSize="44px"
                    bg="white"
                    borderRadius="full"
                    border="1px solid"
                    borderColor="gray.200"
                    color={BRAND_GREEN}
                  >
                    <UploadCloud size={21} />
                  </Flex>

                  <Text color={BRAND_GREEN} fontWeight="700" fontSize="14px">
                    {uploading ? 'Uploading attachments...' : 'Choose files to upload'}
                  </Text>

                  <Text color="gray.500" fontSize="12px">
                    PDF, JPG, PNG or WebP. Maximum 10 MB per file.
                  </Text>

                  <Text color="gray.500" fontSize="11px">
                    {attachments.length}/{MAX_SUPPORT_ATTACHMENTS} files uploaded
                  </Text>
                </VStack>
              </Box>

              {uploading ? (
                <Progress
                  mt={3}
                  size="xs"
                  isIndeterminate
                  colorScheme="green"
                  borderRadius="full"
                />
              ) : null}

              <FormErrorMessage>{uploadError}</FormErrorMessage>

              {!uploadError ? <FormHelperText>Attachments are optional.</FormHelperText> : null}
            </FormControl>

            {attachments.length > 0 ? (
              <VStack spacing={2} align="stretch">
                {attachments.map((attachment) => {
                  const isImage = attachment.contentType?.startsWith('image/')

                  return (
                    <Flex
                      key={attachment.objectKey}
                      align="center"
                      gap={3}
                      p={3}
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="12px"
                      bg="white"
                    >
                      <Flex
                        align="center"
                        justify="center"
                        boxSize="40px"
                        flexShrink={0}
                        borderRadius="10px"
                        bg={isImage ? 'green.50' : 'blue.50'}
                        color={isImage ? 'green.600' : 'blue.600'}
                      >
                        {isImage ? <ImageIcon size={19} /> : <FileText size={19} />}
                      </Flex>

                      <Box minW={0} flex={1}>
                        <Text fontSize="13px" fontWeight="700" color="gray.700" noOfLines={1}>
                          {attachment.fileName}
                        </Text>

                        <Text fontSize="11px" color="gray.500">
                          {formatFileSize(attachment.size)}
                        </Text>
                      </Box>

                      <IconButton
                        aria-label={`Remove ${attachment.fileName}`}
                        icon={<Trash2 size={16} />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        isDisabled={loading}
                        onClick={() => {
                          removeAttachment(attachment.objectKey)
                        }}
                      />
                    </Flex>
                  )
                })}
              </VStack>
            ) : null}
          </VStack>
        </ModalBody>

        <ModalFooter gap={3} borderTop="1px solid" borderColor="#e1e8dc">
          <Button variant="outline" borderRadius="full" isDisabled={loading} onClick={handleClose}>
            Cancel
          </Button>

          <Button
            bg={BRAND_GREEN}
            color="white"
            borderRadius="full"
            leftIcon={<Paperclip size={16} />}
            isLoading={loading}
            loadingText={uploading ? 'Uploading' : 'Submitting'}
            onClick={() => {
              void handleSubmit()
            }}
            _hover={{
              bg: '#102f17'
            }}
          >
            Submit Ticket
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

function RentalsLoadingState() {
  return (
    <Box>
      <Skeleton height="32px" width="220px" mb={6} />

      <VStack spacing="22px" align="stretch">
        {[1, 2, 3].map((item) => (
          <Box
            key={item}
            bg="white"
            borderRadius="18px"
            boxShadow="0 8px 24px rgba(0,0,0,0.06)"
            p={{
              base: '20px',
              md: '28px'
            }}
          >
            <HStack spacing="22px">
              <Skeleton width="90px" height="90px" borderRadius="14px" />

              <Box flex="1">
                <Skeleton height="24px" maxW="280px" />

                <SkeletonText mt={4} noOfLines={2} spacing={3} skeletonHeight={3} />
              </Box>
            </HStack>

            <SimpleGrid
              columns={{
                base: 1,
                sm: 2,
                lg: 4
              }}
              mt={6}
              spacing={5}
            >
              {[1, 2, 3, 4].map((information) => (
                <Skeleton key={information} height="52px" />
              ))}
            </SimpleGrid>
          </Box>
        ))}
      </VStack>
    </Box>
  )
}

function RentalsErrorState({
  message,
  isRetrying,
  onRetry
}: {
  message: string
  isRetrying: boolean
  onRetry: () => void
}) {
  return (
    <Center minH="360px" px={5}>
      <Alert status="error" maxW="700px" borderRadius="14px" alignItems="flex-start" p={5}>
        <AlertIcon mt={1} />

        <Box flex="1">
          <AlertTitle>Unable to load your rentals</AlertTitle>

          <AlertDescription>{message}</AlertDescription>

          <Button
            mt={4}
            size="sm"
            variant="outline"
            colorScheme="red"
            isLoading={isRetrying}
            loadingText="Retrying"
            onClick={onRetry}
          >
            Try Again
          </Button>
        </Box>
      </Alert>
    </Center>
  )
}

export default RentalsSection