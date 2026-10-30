import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Center,
  Flex,
  HStack,
  Icon,
  Spinner,
  Text,
  useToast,
  VStack
} from '@chakra-ui/react'
import { AlertTriangle, Eye, Mail, RefreshCcw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  EnumRentalStatus,
  useRentalsQuery,
  useSendOverdueRentalReminderMutation
} from '../../../generated/graphql'
import { PageWrap } from '../../../layout'

function formatDate(value?: string | null): string {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(date)
}

function formatCurrency(value?: string | number | null): string {
  const amount = Number(value ?? 0)

  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(Number.isFinite(amount) ? amount : 0)
}

function getCustomerName(
  user?: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  } | null
): string {
  const fullName = [user?.firstName, user?.lastName]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' ')

  return fullName || user?.email || 'Unknown customer'
}

function getDaysOverdue(endDate?: string | null): number {
  if (!endDate) {
    return 0
  }

  const dueDate = new Date(endDate)

  if (Number.isNaN(dueDate.getTime())) {
    return 0
  }

  const today = new Date()

  dueDate.setHours(0, 0, 0, 0)

  today.setHours(0, 0, 0, 0)

  const difference = today.getTime() - dueDate.getTime()

  return Math.max(0, Math.floor(difference / (1000 * 60 * 60 * 24)))
}

function getRentalReference(id: string): string {
  if (id.length <= 12) {
    return id
  }

  return `${id.slice(0, 8)}...`
}

export default function OverdueRentals() {
  const navigate = useNavigate()

  const toast = useToast()

  /**
   * Only show the loading state on the
   * reminder button that was clicked.
   */
  const [sendingRentalId, setSendingRentalId] = useState<string | null>(null)

  const { data, loading, error, refetch, networkStatus } = useRentalsQuery({
    variables: {
      input: {
        status: EnumRentalStatus.Overdue,
        page: 1,
        limit: 100
      }
    },

    fetchPolicy: 'cache-and-network',

    notifyOnNetworkStatusChange: true
  })

  const [sendOverdueRentalReminder] = useSendOverdueRentalReminderMutation()

  const rentals = data?.rentals?.rentals ?? []

  const isRefreshing = networkStatus === 4

  const handleRefresh = async () => {
    try {
      await refetch()

      toast({
        title: 'Overdue rentals refreshed',

        status: 'success',

        duration: 2500,

        isClosable: true
      })
    } catch (refetchError) {
      const message =
        refetchError instanceof Error ? refetchError.message : 'Unable to refresh overdue rentals'

      toast({
        title: 'Refresh failed',

        description: message,

        status: 'error',

        duration: 4000,

        isClosable: true
      })
    }
  }

  /**
   * Send the reminder through the backend.
   *
   * This no longer uses mailto:.
   */
  const handleSendReminder = async (rentalId: string) => {
    try {
      setSendingRentalId(rentalId)

      const result = await sendOverdueRentalReminder({
        variables: {
          rentalId
        }
      })

      if (!result.data?.sendOverdueRentalReminder) {
        throw new Error('The reminder could not be sent')
      }

      toast({
        title: 'Reminder sent',

        description: 'The overdue rental reminder was successfully emailed to the customer.',

        status: 'success',

        duration: 3500,

        isClosable: true
      })

      /**
       * Refresh the list so any reminder
       * metadata returned by future queries
       * stays current.
       */
      await refetch()
    } catch (sendError) {
      const message =
        sendError instanceof Error
          ? sendError.message
          : 'Unable to send the overdue rental reminder'

      toast({
        title: 'Unable to send reminder',

        description: message,

        status: 'error',

        duration: 5000,

        isClosable: true
      })
    } finally {
      setSendingRentalId(null)
    }
  }

  return (
    <PageWrap
      title="Overdue & Late Rentals"
      subtitle="Track and manage overdue equipment"
      rightElements={
        <Button
          leftIcon={<RefreshCcw size={16} />}
          variant="outline"
          isLoading={isRefreshing}
          loadingText="Refreshing"
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      }
    >
      <Card variant="outline" borderColor="red.400" borderRadius="12px">
        <CardBody>
          <Flex align="center" gap={2} mb={5}>
            <Icon as={AlertTriangle} color="red.500" />

            <Text fontWeight="600">Overdue Rentals ({rentals.length})</Text>
          </Flex>

          {error && (
            <Alert status="error" borderRadius="10px" mb={5}>
              <AlertIcon />

              <Box>
                <Text fontWeight="600">Unable to load overdue rentals</Text>

                <Text fontSize="sm">{error.message}</Text>
              </Box>
            </Alert>
          )}

          {loading && !data ? (
            <Center py={16}>
              <VStack spacing={3}>
                <Spinner size="lg" color="red.500" />

                <Text color="gray.500" fontSize="sm">
                  Loading overdue rentals...
                </Text>
              </VStack>
            </Center>
          ) : rentals.length === 0 ? (
            <Center py={16} flexDirection="column">
              <Icon as={AlertTriangle} boxSize={8} color="gray.300" mb={3} />

              <Text fontWeight="600">No overdue rentals</Text>

              <Text mt={1} color="gray.500" fontSize="sm" textAlign="center">
                All rentals are currently up to date.
              </Text>
            </Center>
          ) : (
            <VStack align="stretch" spacing={5}>
              {rentals.map((rental) => {
                const customerName = getCustomerName(rental.user)

                const daysOverdue = getDaysOverdue(rental.endDate)

                const isSending = sendingRentalId === rental.id

                const anotherReminderIsSending = Boolean(
                  sendingRentalId && sendingRentalId !== rental.id
                )

                const hasEmail = Boolean(rental.user?.email)

                return (
                  <Box key={rental.id} borderLeft="4px solid" borderColor="red.500" pl={4} py={3}>
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
                      gap={3}
                    >
                      <Box>
                        <Text fontWeight="600">
                          {getRentalReference(rental.id)} - {rental.item.name}
                        </Text>

                        <Text color="gray.500" fontSize="sm">
                          {customerName}
                        </Text>

                        {rental.user?.email && (
                          <Text color="gray.400" fontSize="xs" mt={1}>
                            {rental.user.email}
                          </Text>
                        )}
                      </Box>

                      <HStack spacing={2} flexWrap="wrap">
                        <Badge colorScheme="red" borderRadius="full" px={3} py={1}>
                          Overdue
                        </Badge>

                        {daysOverdue > 0 && (
                          <Badge colorScheme="orange" borderRadius="full" px={3} py={1}>
                            {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} late
                          </Badge>
                        )}
                      </HStack>
                    </Flex>

                    <Flex
                      mt={3}
                      justify="space-between"
                      direction={{
                        base: 'column',

                        md: 'row'
                      }}
                      gap={2}
                    >
                      <Text color="gray.500">
                        Due Date:{' '}
                        <Text as="span" color="red.600" fontWeight="600">
                          {formatDate(rental.endDate)}
                        </Text>
                      </Text>

                      <Text color="gray.500">
                        Daily Rate:{' '}
                        <Text as="span" color="gray.700" fontWeight="600">
                          {formatCurrency(rental.dailyRate)}
                        </Text>
                      </Text>
                    </Flex>

                    <HStack mt={4} flexWrap="wrap" spacing={3}>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Mail size={15} />}
                        isLoading={isSending}
                        loadingText="Sending"
                        isDisabled={!hasEmail || anotherReminderIsSending}
                        onClick={() => handleSendReminder(rental.id)}
                      >
                        Send Reminder
                      </Button>

                      {!hasEmail && (
                        <Text color="orange.500" fontSize="xs">
                          Customer has no email address
                        </Text>
                      )}

                      <Button
                        size="sm"
                        leftIcon={<Eye size={15} />}
                        variant="outline"
                        onClick={() => navigate(`/admin/rentals/${rental.id}`)}
                      >
                        View
                      </Button>

                      <Button
                        size="sm"
                        bg="#176526"
                        color="white"
                        onClick={() =>
                          navigate(
                            `/admin/rentals/manage?tab=return&rentalId=${encodeURIComponent(
                              rental.id
                            )}`
                          )
                        }
                        _hover={{
                          bg: '#12531e'
                        }}
                      >
                        Mark Returned
                      </Button>
                    </HStack>
                  </Box>
                )
              })}
            </VStack>
          )}
        </CardBody>
      </Card>
    </PageWrap>
  )
}
