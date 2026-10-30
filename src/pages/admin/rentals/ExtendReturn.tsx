import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  useToast,
  VStack
} from '@chakra-ui/react'
import {
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  useSearchParams
} from 'react-router-dom'

import {
  EnumProductCondition,
  EnumRentalStatus,
  useExtendRentalMutation,
  useProcessRentalReturnMutation,
  useRentalsQuery
} from '../../../generated/graphql'
import { PageWrap } from '../../../layout'

type Tab = 'extend' | 'return'

type RentalFormState = {
  newEndDate: string
  additionalCost: string
  condition: EnumProductCondition
  notes: string
}

type RentalFormErrors = Partial<
  Record<
    keyof RentalFormState,
    string
  >
>

type RentalAction = {
  rentalId: string
  action: Tab
}

const EMPTY_FORM: RentalFormState = {
  newEndDate: '',
  additionalCost: '',
  condition:
    EnumProductCondition.Good,
  notes: ''
}

const BRAND_GREEN = '#176526'
const BRAND_GREEN_HOVER = '#12531e'

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
      month: 'short',
      day: '2-digit'
    }
  ).format(date)
}

function formatEnum(
  value: string
): string {
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

function customerName(rental: {
  user?: {
    fullName?: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  } | null
}): string {
  const fullName =
    rental.user?.fullName?.trim()

  if (fullName) {
    return fullName
  }

  const combinedName = [
    rental.user?.firstName,
    rental.user?.lastName
  ]
    .filter(
      (value): value is string =>
        Boolean(value?.trim())
    )
    .join(' ')
    .trim()

  return (
    combinedName ||
    rental.user?.email ||
    'Unknown customer'
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

function toDateInputValue(
  value?: string | null
): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0')
  const day = String(
    date.getDate()
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function toEndOfDayIso(
  dateValue: string
): string {
  const date = new Date(
    `${dateValue}T23:59:59`
  )

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      'The selected end date is invalid.'
    )
  }

  return date.toISOString()
}

function isValidNonNegativeAmount(
  value: string
): boolean {
  if (!value.trim()) {
    return true
  }

  const amount = Number(value)

  return (
    Number.isFinite(amount) &&
    amount >= 0
  )
}

export default function ExtendReturn() {
  const toast = useToast()

  const [
    searchParams,
    setSearchParams
  ] = useSearchParams()

  const selectedRentalId =
    searchParams.get('rentalId') ??
    ''

  const selectedTab =
    searchParams.get('tab') ===
    'return'
      ? 'return'
      : 'extend'

  const [tab, setTab] =
    useState<Tab>(selectedTab)

  const [forms, setForms] =
    useState<
      Record<
        string,
        RentalFormState
      >
    >({})

  const [formErrors, setFormErrors] =
    useState<
      Record<
        string,
        RentalFormErrors
      >
    >({})

  const [
    currentAction,
    setCurrentAction
  ] = useState<RentalAction | null>(
    null
  )

  const {
    data,
    loading,
    error,
    refetch,
    networkStatus
  } = useRentalsQuery({
    variables: {
      input: {
        page: 1,
        limit: 100
      }
    },
    fetchPolicy:
      'cache-and-network',
    notifyOnNetworkStatusChange:
      true
  })

  const [
    extendRental,
    {
      loading:
        extendingRental
    }
  ] =
    useExtendRentalMutation()

  const [
    processRentalReturn,
    {
      loading:
        processingReturn
    }
  ] =
    useProcessRentalReturnMutation()

  const isRefreshing =
    networkStatus === 4

  const rentals = useMemo(() => {
    const allRentals =
      data?.rentals?.rentals ?? []

    return allRentals.filter(
      rental =>
        rental.status ===
          EnumRentalStatus.Active ||
        rental.status ===
          EnumRentalStatus.Upcoming ||
        rental.status ===
          EnumRentalStatus.Overdue
    )
  }, [data?.rentals?.rentals])

  useEffect(() => {
    setTab(selectedTab)
  }, [selectedTab])

  useEffect(() => {
    if (!selectedRentalId) {
      return
    }

    setForms(current => ({
      ...current,
      [selectedRentalId]:
        current[selectedRentalId] ??
        EMPTY_FORM
    }))
  }, [selectedRentalId])

  useEffect(() => {
    if (
      !selectedRentalId ||
      loading
    ) {
      return
    }

    const exists = rentals.some(
      rental =>
        rental.id ===
        selectedRentalId
    )

    if (!exists) {
      const params =
        new URLSearchParams(
          searchParams
        )

      params.delete('rentalId')

      setSearchParams(params, {
        replace: true
      })
    }
  }, [
    loading,
    rentals,
    searchParams,
    selectedRentalId,
    setSearchParams
  ])

  const updateForm = (
    rentalId: string,
    changes: Partial<
      RentalFormState
    >
  ) => {
    setForms(current => ({
      ...current,
      [rentalId]: {
        ...(current[rentalId] ??
          EMPTY_FORM),
        ...changes
      }
    }))

    setFormErrors(current => {
      const currentErrors =
        current[rentalId] ?? {}

      const nextErrors = {
        ...currentErrors
      }

      Object.keys(changes).forEach(
        field => {
          delete nextErrors[
            field as keyof RentalFormErrors
          ]
        }
      )

      return {
        ...current,
        [rentalId]:
          nextErrors
      }
    })
  }

  const resetRentalForm = (
    rentalId: string
  ) => {
    setForms(current => {
      const next = {
        ...current
      }

      delete next[rentalId]

      return next
    })

    setFormErrors(current => {
      const next = {
        ...current
      }

      delete next[rentalId]

      return next
    })
  }

  const changeTab = (
    nextTab: Tab
  ) => {
    setTab(nextTab)

    const params =
      new URLSearchParams(
        searchParams
      )

    params.set('tab', nextTab)

    setSearchParams(params, {
      replace: true
    })
  }

  const validateExtension = (
    rentalId: string,
    currentEndDate?: string | null
  ): boolean => {
    const form =
      forms[rentalId] ??
      EMPTY_FORM

    const errors:
      RentalFormErrors = {}

    if (!form.newEndDate) {
      errors.newEndDate =
        'New end date is required.'
    } else {
      const selectedDate =
        new Date(
          `${form.newEndDate}T23:59:59`
        )

      const currentDate =
        currentEndDate
          ? new Date(currentEndDate)
          : null

      if (
        Number.isNaN(
          selectedDate.getTime()
        )
      ) {
        errors.newEndDate =
          'Select a valid end date.'
      } else if (
        currentDate &&
        !Number.isNaN(
          currentDate.getTime()
        ) &&
        selectedDate <=
          currentDate
      ) {
        errors.newEndDate =
          'The new end date must be after the current end date.'
      }
    }

    if (
      !isValidNonNegativeAmount(
        form.additionalCost
      )
    ) {
      errors.additionalCost =
        'Additional cost must be zero or greater.'
    }

    setFormErrors(current => ({
      ...current,
      [rentalId]: errors
    }))

    if (
      Object.keys(errors).length >
      0
    ) {
      toast({
        title:
          'Check the highlighted fields',
        description:
          'Correct the extension details before continuing.',
        status: 'error',
        duration: 4000,
        isClosable: true
      })

      return false
    }

    return true
  }

  const handleExtend = async (
    rentalId: string,
    currentEndDate?: string | null
  ) => {
    if (
      currentAction ||
      extendingRental ||
      processingReturn
    ) {
      return
    }

    if (
      !validateExtension(
        rentalId,
        currentEndDate
      )
    ) {
      return
    }

    const form =
      forms[rentalId] ??
      EMPTY_FORM

    setCurrentAction({
      rentalId,
      action: 'extend'
    })

    try {
      await extendRental({
        variables: {
          input: {
            rentalId,
            newEndDate:
              toEndOfDayIso(
                form.newEndDate
              ),
            additionalCost:
              form.additionalCost.trim() ||
              undefined
          }
        },
        refetchQueries: [
          'Rentals'
        ],
        awaitRefetchQueries: true
      })

      toast({
        title: 'Rental extended',
        description:
          'The rental end date was updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      resetRentalForm(rentalId)
    } catch (mutationError) {
      toast({
        title:
          'Unable to extend rental',
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

  const handleReturn = async (
    rentalId: string
  ) => {
    if (
      currentAction ||
      processingReturn ||
      extendingRental
    ) {
      return
    }

    const form =
      forms[rentalId] ??
      EMPTY_FORM

    setCurrentAction({
      rentalId,
      action: 'return'
    })

    try {
      await processRentalReturn({
        variables: {
          input: {
            rentalId,
            condition:
              form.condition,
            notes:
              form.notes.trim() ||
              undefined
          }
        },
        refetchQueries: [
          'Rentals'
        ],
        awaitRefetchQueries: true
      })

      toast({
        title:
          'Rental return processed',
        description:
          'The equipment return was recorded successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      resetRentalForm(rentalId)
    } catch (mutationError) {
      toast({
        title:
          'Unable to process return',
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

  const handleRefresh = async () => {
    try {
      await refetch()

      toast({
        title: 'Rentals refreshed',
        status: 'success',
        duration: 2500,
        isClosable: true
      })
    } catch (refreshError) {
      toast({
        title:
          'Unable to refresh rentals',
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

  return (
    <PageWrap
      title="Extend & Return Management"
      subtitle="Manage rental extensions and returns"
      rightElements={
        <Button
          variant="outline"
          isLoading={isRefreshing}
          loadingText="Refreshing"
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      }
    >
      <Box
        display="grid"
        gridTemplateColumns="1fr 1fr"
        bg="gray.100"
        borderRadius="full"
        padding={1}
        maxW="420px"
      >
        <Button
          borderRadius="full"
          bg={
            tab === 'extend'
              ? BRAND_GREEN
              : 'gray.200'
          }
          color={
            tab === 'extend'
              ? 'white'
              : 'gray.700'
          }
          onClick={() =>
            changeTab('extend')
          }
          isDisabled={Boolean(
            currentAction
          )}
          _hover={{
            bg:
              tab === 'extend'
                ? BRAND_GREEN_HOVER
                : 'white'
          }}
        >
          Extend Rental
        </Button>

        <Button
          borderRadius="full"
          bg={
            tab === 'return'
              ? BRAND_GREEN
              : 'gray.200'
          }
          color={
            tab === 'return'
              ? 'white'
              : 'gray.700'
          }
          onClick={() =>
            changeTab('return')
          }
          isDisabled={Boolean(
            currentAction
          )}
          _hover={{
            bg:
              tab === 'return'
                ? BRAND_GREEN_HOVER
                : 'white'
          }}
        >
          Process Return
        </Button>
      </Box>

      <Card
        mt={3}
        variant="outline"
        borderRadius="12px"
      >
        <CardBody>
          <Text
            fontWeight="600"
            mb={4}
          >
            {tab === 'extend'
              ? 'Extend Rental Period'
              : 'Process Equipment Return'}
          </Text>

          {error && (
            <Alert
              status="error"
              borderRadius="10px"
              mb={5}
              alignItems="flex-start"
            >
              <AlertIcon mt={1} />

              <Box flex="1">
                <Text fontWeight="600">
                  Unable to load rentals
                </Text>

                <Text
                  mt={1}
                  fontSize="sm"
                >
                  {error.message}
                </Text>

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

          {loading && !data ? (
            <Center py={16}>
              <VStack spacing={3}>
                <Spinner
                  size="lg"
                  color="green.600"
                />

                <Text
                  color="gray.500"
                  fontSize="sm"
                >
                  Loading rentals...
                </Text>
              </VStack>
            </Center>
          ) : rentals.length === 0 ? (
            <Center
              py={16}
              flexDirection="column"
            >
              <Text fontWeight="600">
                No active rentals
              </Text>

              <Text
                mt={1}
                color="gray.500"
                fontSize="sm"
                textAlign="center"
              >
                There are no rentals
                available for this
                action.
              </Text>
            </Center>
          ) : (
            <VStack
              align="stretch"
              spacing={4}
            >
              {rentals.map(rental => {
                const form =
                  forms[rental.id] ??
                  EMPTY_FORM

                const errors =
                  formErrors[
                    rental.id
                  ] ?? {}

                const isExtending =
                  currentAction
                    ?.rentalId ===
                    rental.id &&
                  currentAction
                    .action ===
                    'extend'

                const isReturning =
                  currentAction
                    ?.rentalId ===
                    rental.id &&
                  currentAction
                    .action ===
                    'return'

                const anotherRentalBusy =
                  Boolean(
                    currentAction
                  ) &&
                  currentAction
                    ?.rentalId !==
                    rental.id

                return (
                  <Card
                    key={rental.id}
                    variant="outline"
                    borderRadius="10px"
                    borderColor={
                      selectedRentalId ===
                      rental.id
                        ? 'green.400'
                        : 'gray.200'
                    }
                    boxShadow={
                      selectedRentalId ===
                      rental.id
                        ? '0 0 0 1px var(--chakra-colors-green-400)'
                        : 'none'
                    }
                  >
                    <CardBody>
                      {tab ===
                      'extend' ? (
                        <>
                          <Box>
                            <Badge
                              float={{
                                base:
                                  'none',
                                md:
                                  'right'
                              }}
                              mb={{
                                base: 2,
                                md: 0
                              }}
                              colorScheme={
                                rental.status ===
                                EnumRentalStatus.Overdue
                                  ? 'red'
                                  : 'green'
                              }
                              borderRadius="full"
                              px={3}
                              py={1}
                            >
                              Current End:{' '}
                              {formatDate(
                                rental.endDate
                              )}
                            </Badge>

                            <Text fontWeight="600">
                              {rental.id}
                            </Text>

                            <Text
                              mt={1}
                              fontSize="sm"
                              color="gray.500"
                            >
                              {customerName(
                                rental
                              )}{' '}
                              ·{' '}
                              {rental.item
                                ?.name ??
                                'Unknown item'}
                            </Text>

                            <Badge
                              mt={2}
                              colorScheme={
                                rental.status ===
                                EnumRentalStatus.Overdue
                                  ? 'red'
                                  : rental.status ===
                                      EnumRentalStatus.Upcoming
                                    ? 'blue'
                                    : 'green'
                              }
                              borderRadius="full"
                            >
                              {formatEnum(
                                rental.status
                              )}
                            </Badge>
                          </Box>

                          <SimpleGrid
                            columns={{
                              base: 1,
                              md: 2
                            }}
                            spacing={4}
                            mt={4}
                          >
                            <FormControl
                              isRequired
                              isInvalid={Boolean(
                                errors.newEndDate
                              )}
                            >
                              <FormLabel>
                                New End Date
                              </FormLabel>

                              <Input
                                type="date"
                                value={
                                  form.newEndDate
                                }
                                min={
                                  toDateInputValue(
                                    rental.endDate
                                  )
                                }
                                bg="gray.100"
                                border="none"
                                isDisabled={
                                  anotherRentalBusy ||
                                  isExtending
                                }
                                onChange={event =>
                                  updateForm(
                                    rental.id,
                                    {
                                      newEndDate:
                                        event
                                          .target
                                          .value
                                    }
                                  )
                                }
                              />

                              <FormErrorMessage>
                                {
                                  errors.newEndDate
                                }
                              </FormErrorMessage>
                            </FormControl>

                            <FormControl
                              isInvalid={Boolean(
                                errors.additionalCost
                              )}
                            >
                              <FormLabel>
                                Additional Cost
                              </FormLabel>

                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={
                                  form.additionalCost
                                }
                                placeholder="Calculated automatically"
                                bg="gray.100"
                                border="none"
                                isDisabled={
                                  anotherRentalBusy ||
                                  isExtending
                                }
                                onChange={event =>
                                  updateForm(
                                    rental.id,
                                    {
                                      additionalCost:
                                        event
                                          .target
                                          .value
                                    }
                                  )
                                }
                              />

                              <FormErrorMessage>
                                {
                                  errors.additionalCost
                                }
                              </FormErrorMessage>
                            </FormControl>
                          </SimpleGrid>

                          <Button
                            mt={4}
                            width="100%"
                            bg={BRAND_GREEN}
                            color="white"
                            isLoading={
                              isExtending
                            }
                            loadingText="Extending"
                            isDisabled={
                              anotherRentalBusy ||
                              isReturning
                            }
                            onClick={() =>
                              handleExtend(
                                rental.id,
                                rental.endDate
                              )
                            }
                            _hover={{
                              bg:
                                BRAND_GREEN_HOVER
                            }}
                          >
                            Confirm Extension
                          </Button>
                        </>
                      ) : (
                        <>
                          <Text fontWeight="600">
                            {rental.id} ·{' '}
                            {rental.item
                              ?.name ??
                              'Unknown item'}
                          </Text>

                          <Text
                            mt={1}
                            fontSize="sm"
                            color="gray.500"
                          >
                            {customerName(
                              rental
                            )}
                          </Text>

                          <Badge
                            mt={2}
                            colorScheme={
                              rental.status ===
                              EnumRentalStatus.Overdue
                                ? 'red'
                                : rental.status ===
                                    EnumRentalStatus.Upcoming
                                  ? 'blue'
                                  : 'green'
                            }
                            borderRadius="full"
                          >
                            {formatEnum(
                              rental.status
                            )}
                          </Badge>

                          <SimpleGrid
                            mt={4}
                            columns={{
                              base: 1,
                              md: 2
                            }}
                            spacing={4}
                          >
                            <FormControl
                              isRequired
                            >
                              <FormLabel>
                                Equipment
                                Condition
                              </FormLabel>

                              <Select
                                value={
                                  form.condition
                                }
                                bg="gray.100"
                                border="none"
                                isDisabled={
                                  anotherRentalBusy ||
                                  isReturning
                                }
                                onChange={event =>
                                  updateForm(
                                    rental.id,
                                    {
                                      condition:
                                        event
                                          .target
                                          .value as EnumProductCondition
                                    }
                                  )
                                }
                              >
                                {Object.values(
                                  EnumProductCondition
                                ).map(
                                  condition => (
                                    <option
                                      key={
                                        condition
                                      }
                                      value={
                                        condition
                                      }
                                    >
                                      {formatEnum(
                                        condition
                                      )}
                                    </option>
                                  )
                                )}
                              </Select>
                            </FormControl>

                            <FormControl>
                              <FormLabel>
                                Return Notes
                              </FormLabel>

                              <Textarea
                                value={
                                  form.notes
                                }
                                placeholder="Notes on the equipment condition..."
                                bg="gray.100"
                                border="none"
                                resize="vertical"
                                isDisabled={
                                  anotherRentalBusy ||
                                  isReturning
                                }
                                onChange={event =>
                                  updateForm(
                                    rental.id,
                                    {
                                      notes:
                                        event
                                          .target
                                          .value
                                    }
                                  )
                                }
                              />
                            </FormControl>
                          </SimpleGrid>

                          <Button
                            mt={4}
                            width="100%"
                            bg={BRAND_GREEN}
                            color="white"
                            isLoading={
                              isReturning
                            }
                            loadingText="Processing"
                            isDisabled={
                              anotherRentalBusy ||
                              isExtending
                            }
                            onClick={() =>
                              handleReturn(
                                rental.id
                              )
                            }
                            _hover={{
                              bg:
                                BRAND_GREEN_HOVER
                            }}
                          >
                            Process Return
                          </Button>
                        </>
                      )}
                    </CardBody>
                  </Card>
                )
              })}
            </VStack>
          )}
        </CardBody>
      </Card>
    </PageWrap>
  )
}