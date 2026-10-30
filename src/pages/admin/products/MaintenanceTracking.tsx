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
  FormControl,
  FormErrorMessage,
  FormLabel,
  Icon,
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
  Spinner,
  Text,
  Textarea,
  VStack,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import {
  AlertTriangle,
  CalendarDays,
  History,
  RefreshCcw,
  Wrench
} from 'lucide-react'
import {
  useMemo,
  useRef,
  useState
} from 'react'

import {
  type EnumProductCondition,
  useCreateEquipmentMaintenanceMutation,
  useEquipmentMaintenanceRecordsQuery,
  useMaintenanceAgricultureItemsQuery
} from '../../../generated/graphql'
import { PageWrap } from '../../../layout'

type MaintenanceForm = {
  itemId: string
  lastMaintenanceDate: string
  nextMaintenanceDate: string
  condition: string
  notes: string
}

type MaintenanceFormErrors = {
  itemId?: string
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  condition?: string
  notes?: string
}

type SelectedHistory = {
  itemId: string
  itemName: string
}

const EMPTY_FORM: MaintenanceForm = {
  itemId: '',
  lastMaintenanceDate: '',
  nextMaintenanceDate: '',
  condition: 'GOOD',
  notes: ''
}

const MILLISECONDS_PER_DAY =
  1000 * 60 * 60 * 24

function formatEnum(
  value?: string | null
): string {
  if (!value) {
    return 'Not specified'
  }

  return value
    .toLowerCase()
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ')
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return 'Not scheduled'
  }

  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Not scheduled'
  }

  return new Intl.DateTimeFormat(
    'en-ZA',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  ).format(date)
}

function toDateInputValue(
  value?: string | null
): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return ''
  }

  const year =
    date.getUTCFullYear()

  const month =
    String(
      date.getUTCMonth() + 1
    ).padStart(2, '0')

  const day =
    String(
      date.getUTCDate()
    ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function dateInputToIso(
  value: string
): string {
  const parts =
    value.split('-')

  if (parts.length !== 3) {
    throw new Error(
      `Invalid date: ${value}`
    )
  }

  const year =
    Number(parts[0])

  const month =
    Number(parts[1])

  const day =
    Number(parts[2])

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    throw new Error(
      `Invalid date: ${value}`
    )
  }

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      0,
      0,
      0,
      0
    )
  )

  const dateMatchesInput =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() ===
      month - 1 &&
    date.getUTCDate() === day

  if (!dateMatchesInput) {
    throw new Error(
      `Invalid date: ${value}`
    )
  }

  return date.toISOString()
}

function startOfDay(
  value: Date
): Date {
  const date = new Date(value)

  date.setHours(
    0,
    0,
    0,
    0
  )

  return date
}

function getDaysUntilMaintenance(
  value?: string | null
): number | null {
  if (!value) {
    return null
  }

  const maintenanceDate =
    startOfDay(
      new Date(value)
    )

  const today =
    startOfDay(
      new Date()
    )

  if (
    Number.isNaN(
      maintenanceDate.getTime()
    )
  ) {
    return null
  }

  return Math.ceil(
    (
      maintenanceDate.getTime() -
      today.getTime()
    ) /
      MILLISECONDS_PER_DAY
  )
}

function getMaintenanceStatus(
  value?: string | null
): {
  label: string
  colorScheme: string
  textColor: string
} {
  const days =
    getDaysUntilMaintenance(
      value
    )

  if (days === null) {
    return {
      label: 'Not scheduled',
      colorScheme: 'gray',
      textColor: 'gray.600'
    }
  }

  if (days < 0) {
    const overdueDays =
      Math.abs(days)

    return {
      label:
        `${overdueDays} day${
          overdueDays === 1
            ? ''
            : 's'
        } overdue`,
      colorScheme: 'red',
      textColor: 'red.600'
    }
  }

  if (days === 0) {
    return {
      label: 'Due today',
      colorScheme: 'orange',
      textColor: 'orange.600'
    }
  }

  if (days <= 30) {
    return {
      label:
        `${days} day${
          days === 1
            ? ''
            : 's'
        } remaining`,
      colorScheme: 'orange',
      textColor: 'orange.600'
    }
  }

  return {
    label:
      `${days} day${
        days === 1
          ? ''
          : 's'
      } remaining`,
    colorScheme: 'green',
    textColor: 'green.700'
  }
}

function getMaintenanceProgress(
  lastMaintenanceDate?: string | null,
  nextMaintenanceDate?: string | null
): number {
  if (
    !lastMaintenanceDate ||
    !nextMaintenanceDate
  ) {
    return 0
  }

  const lastDate =
    new Date(
      lastMaintenanceDate
    ).getTime()

  const nextDate =
    new Date(
      nextMaintenanceDate
    ).getTime()

  const now =
    Date.now()

  if (
    Number.isNaN(lastDate) ||
    Number.isNaN(nextDate) ||
    nextDate <= lastDate
  ) {
    return 0
  }

  const elapsed =
    now - lastDate

  const total =
    nextDate - lastDate

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (elapsed / total) *
          100
      )
    )
  )
}

function getConditionColor(
  condition?: string | null
): string {
  switch (condition) {
    case 'EXCELLENT':
      return 'green'

    case 'GOOD':
      return 'blue'

    case 'FAIR':
      return 'yellow'

    case 'POOR':
      return 'orange'

    case 'NEEDS_REPAIR':
      return 'red'

    default:
      return 'gray'
  }
}

function getProgressColor(
  days: number | null
): string {
  if (days === null) {
    return 'gray'
  }

  if (days < 0) {
    return 'red'
  }

  if (days <= 30) {
    return 'orange'
  }

  return 'green'
}

function getErrorMessage(
  error: unknown
): string {
  if (
    error instanceof Error
  ) {
    return error.message
      .replace(
        /^ApolloError:\s*/i,
        ''
      )
      .replace(
        /^GraphQL error:\s*/i,
        ''
      )
  }

  return 'Please try again.'
}

export default function MaintenanceTracking() {
  const toast =
    useToast()

  const scheduleModal =
    useDisclosure()

  const historyModal =
    useDisclosure()

  const nextMaintenanceRef =
    useRef<HTMLInputElement | null>(
      null
    )

  const historyCloseRef =
    useRef<HTMLButtonElement | null>(
      null
    )

  const [
    form,
    setForm
  ] = useState<MaintenanceForm>(
    EMPTY_FORM
  )

  const [
    formErrors,
    setFormErrors
  ] =
    useState<MaintenanceFormErrors>(
      {}
    )

  const [
    selectedHistory,
    setSelectedHistory
  ] =
    useState<SelectedHistory | null>(
      null
    )

  const {
    data: itemsData,
    loading: itemsLoading,
    error: itemsError,
    refetch: refetchItems
  } =
    useMaintenanceAgricultureItemsQuery(
      {
        fetchPolicy:
          'network-only'
      }
    )

  const {
    data: maintenanceData,
    loading:
      maintenanceLoading,
    error:
      maintenanceError,
    refetch:
      refetchMaintenance
  } =
    useEquipmentMaintenanceRecordsQuery(
      {
        variables: {
          limit: 500
        },
        fetchPolicy:
          'network-only'
      }
    )

  const [
    createMaintenance,
    {
      loading:
        creatingMaintenance
    }
  ] =
    useCreateEquipmentMaintenanceMutation()

  const agricultureItems =
    useMemo(
      () =>
        itemsData
          ?.agricultureItems ??
        [],
      [itemsData]
    )

  const maintenanceRecords =
    useMemo(
      () =>
        maintenanceData
          ?.equipmentMaintenanceRecords ??
        [],
      [maintenanceData]
    )

  const equipment =
    useMemo(() => {
      const latestRecordByItem =
        new Map<
          string,
          (typeof maintenanceRecords)[number]
        >()

      const sortedRecords =
        [
          ...maintenanceRecords
        ].sort(
          (
            first,
            second
          ) =>
            new Date(
              second.createdAt
            ).getTime() -
            new Date(
              first.createdAt
            ).getTime()
        )

      sortedRecords.forEach(
        (record) => {
          if (
            !latestRecordByItem.has(
              record.item.id
            )
          ) {
            latestRecordByItem.set(
              record.item.id,
              record
            )
          }
        }
      )

      return agricultureItems.map(
        (item) => {
          const latestRecord =
            latestRecordByItem.get(
              item.id
            )

          return {
            item,
            maintenanceId:
              latestRecord?.id,
            condition:
              latestRecord
                ?.condition ??
              item.condition,
            lastMaintenanceDate:
              latestRecord
                ?.lastMaintenanceDate,
            nextMaintenanceDate:
              latestRecord
                ?.nextMaintenanceDate,
            notes:
              latestRecord
                ?.notes
          }
        }
      )
    }, [
      agricultureItems,
      maintenanceRecords
    ])

  const excellentCount =
    equipment.filter(
      (record) =>
        record.condition ===
        'EXCELLENT'
    ).length

  const upcomingCount =
    equipment.filter(
      (record) => {
        const days =
          getDaysUntilMaintenance(
            record.nextMaintenanceDate
          )

        return (
          days !== null &&
          days >= 0 &&
          days <= 30
        )
      }
    ).length

  const overdueCount =
    equipment.filter(
      (record) => {
        const days =
          getDaysUntilMaintenance(
            record.nextMaintenanceDate
          )

        return (
          days !== null &&
          days < 0
        )
      }
    ).length

  const selectedItemHistory =
    useMemo(() => {
      if (!selectedHistory) {
        return []
      }

      return maintenanceRecords
        .filter(
          (record) =>
            record.item.id ===
            selectedHistory.itemId
        )
        .sort(
          (
            first,
            second
          ) =>
            new Date(
              second.createdAt
            ).getTime() -
            new Date(
              first.createdAt
            ).getTime()
        )
    }, [
      maintenanceRecords,
      selectedHistory
    ])

  const selectedEquipmentName =
    useMemo(
      () =>
        agricultureItems.find(
          (item) =>
            item.id ===
            form.itemId
        )?.name ?? '',
      [
        agricultureItems,
        form.itemId
      ]
    )

  const openScheduleModal = (
    record:
      (typeof equipment)[number]
  ) => {
    setFormErrors({})

    setForm({
      itemId:
        record.item.id,

      lastMaintenanceDate:
        toDateInputValue(
          record.lastMaintenanceDate
        ),

      nextMaintenanceDate:
        toDateInputValue(
          record.nextMaintenanceDate
        ),

      condition:
        record.condition ??
        'GOOD',

      notes:
        record.notes ?? ''
    })

    scheduleModal.onOpen()
  }

  const closeScheduleModal =
    () => {
      if (creatingMaintenance) {
        return
      }

      setForm(
        EMPTY_FORM
      )

      setFormErrors({})

      scheduleModal.onClose()
    }

  const openHistoryModal = (
    itemId: string,
    itemName: string
  ) => {
    setSelectedHistory({
      itemId,
      itemName
    })

    historyModal.onOpen()
  }

  const closeHistoryModal =
    () => {
      setSelectedHistory(
        null
      )

      historyModal.onClose()
    }

  const handleRefresh =
    async () => {
      try {
        await Promise.all([
          refetchItems(),
          refetchMaintenance()
        ])

        toast({
          title:
            'Maintenance data refreshed',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position:
            'bottom-right'
        })
      } catch (error) {
        toast({
          title:
            'Unable to refresh data',
          description:
            getErrorMessage(
              error
            ),
          status: 'error',
          duration: 5000,
          isClosable: true,
          position:
            'bottom-right'
        })
      }
    }

  const validateForm =
    (): MaintenanceFormErrors => {
      const errors:
        MaintenanceFormErrors =
        {}

      if (!form.itemId) {
        errors.itemId =
          'Equipment is required.'
      }

      if (
        !form.nextMaintenanceDate
      ) {
        errors.nextMaintenanceDate =
          'Next maintenance date is required.'
      }

      if (!form.condition) {
        errors.condition =
          'Condition is required.'
      }

      if (
        form.notes.length >
        1000
      ) {
        errors.notes =
          'Notes cannot exceed 1,000 characters.'
      }

      if (
        form.lastMaintenanceDate &&
        form.nextMaintenanceDate
      ) {
        const lastDate =
          new Date(
            `${form.lastMaintenanceDate}T00:00:00Z`
          )

        const nextDate =
          new Date(
            `${form.nextMaintenanceDate}T00:00:00Z`
          )

        if (
          nextDate.getTime() <
          lastDate.getTime()
        ) {
          errors.nextMaintenanceDate =
            'Next maintenance cannot be before the last maintenance date.'
        }
      }

      return errors
    }

  const handleScheduleMaintenance =
    async () => {
      const validationErrors =
        validateForm()

      setFormErrors(
        validationErrors
      )

      if (
        Object.keys(
          validationErrors
        ).length > 0
      ) {
        return
      }

      try {
        const lastMaintenanceDate =
          form.lastMaintenanceDate
            ? dateInputToIso(
                form.lastMaintenanceDate
              )
            : null

        const nextMaintenanceDate =
          dateInputToIso(
            form.nextMaintenanceDate
          )

        await createMaintenance({
          variables: {
            input: {
              itemId:
                form.itemId,

              lastMaintenanceDate,

              nextMaintenanceDate,

              condition:
                form.condition as EnumProductCondition,

              notes:
                form.notes.trim() ||
                null
            }
          }
        })

        await Promise.all([
          refetchItems(),
          refetchMaintenance()
        ])

        toast({
          title:
            'Maintenance scheduled',
          description:
            'The maintenance schedule has been saved.',
          status: 'success',
          duration: 4000,
          isClosable: true,
          position:
            'bottom-right'
        })

        setForm(
          EMPTY_FORM
        )

        setFormErrors({})

        scheduleModal.onClose()
      } catch (error) {
        toast({
          title:
            'Unable to schedule maintenance',
          description:
            getErrorMessage(
              error
            ),
          status: 'error',
          duration: 7000,
          isClosable: true,
          position:
            'bottom-right'
        })
      }
    }

  const loading =
    itemsLoading ||
    maintenanceLoading

  const error =
    itemsError ||
    maintenanceError

  return (
    <>
      <PageWrap
        title="Maintenance & Equipment Health"
        subtitle="Track equipment condition and maintenance schedules"
      >
        <VStack
          align="stretch"
          spacing={5}
        >
          <Flex justify="flex-end">
            <Button
              size="sm"
              variant="outline"
              leftIcon={
                <RefreshCcw
                  size={16}
                />
              }
              onClick={
                handleRefresh
              }
              isLoading={
                loading
              }
            >
              Refresh
            </Button>
          </Flex>

          {error && (
            <Alert
              status="error"
              borderRadius="8px"
            >
              <AlertIcon />

              {error.message}
            </Alert>
          )}

          <SimpleGrid
            columns={{
              base: 1,
              md: 3
            }}
            spacing={4}
          >
            <Card
              variant="outline"
              borderRadius="12px"
            >
              <CardBody>
                <Flex justify="space-between">
                  <Text fontSize="sm">
                    Equipment in Excellent
                    Condition
                  </Text>

                  <Icon
                    as={Wrench}
                    color="green.700"
                  />
                </Flex>

                <Text
                  mt={8}
                  fontSize="2xl"
                  fontWeight="700"
                >
                  {excellentCount}
                </Text>
              </CardBody>
            </Card>

            <Card
              variant="outline"
              borderRadius="12px"
            >
              <CardBody>
                <Flex justify="space-between">
                  <Text fontSize="sm">
                    Upcoming Maintenance
                  </Text>

                  <Icon
                    as={CalendarDays}
                    color="gray.500"
                  />
                </Flex>

                <Text
                  mt={8}
                  fontSize="2xl"
                  fontWeight="700"
                >
                  {upcomingCount}
                </Text>

                <Text
                  fontSize="sm"
                  color="gray.500"
                >
                  Within 30 days
                </Text>
              </CardBody>
            </Card>

            <Card
              variant="outline"
              borderRadius="12px"
            >
              <CardBody>
                <Flex justify="space-between">
                  <Text fontSize="sm">
                    Overdue Maintenance
                  </Text>

                  <Icon
                    as={AlertTriangle}
                    color="orange.500"
                  />
                </Flex>

                <Text
                  mt={8}
                  fontSize="2xl"
                  fontWeight="700"
                >
                  {overdueCount}
                </Text>

                <Text
                  fontSize="sm"
                  color="orange.500"
                >
                  Needs immediate attention
                </Text>
              </CardBody>
            </Card>
          </SimpleGrid>

          <Card
            variant="outline"
            borderRadius="12px"
          >
            <CardBody>
              <Text
                fontWeight="600"
                mb={4}
              >
                Equipment Maintenance
                Schedule
              </Text>

              {loading ? (
                <Center py={16}>
                  <Spinner
                    size="lg"
                    color="green.600"
                  />
                </Center>
              ) : equipment.length ===
                0 ? (
                <Center py={16}>
                  <VStack spacing={2}>
                    <Icon
                      as={Wrench}
                      boxSize={8}
                      color="gray.400"
                    />

                    <Text fontWeight="600">
                      No equipment found
                    </Text>

                    <Text
                      fontSize="sm"
                      color="gray.500"
                    >
                      Add agriculture
                      equipment to start
                      tracking maintenance.
                    </Text>
                  </VStack>
                </Center>
              ) : (
                <VStack
                  align="stretch"
                  spacing={0}
                >
                  {equipment.map(
                    (
                      record,
                      index
                    ) => {
                      const days =
                        getDaysUntilMaintenance(
                          record.nextMaintenanceDate
                        )

                      const status =
                        getMaintenanceStatus(
                          record.nextMaintenanceDate
                        )

                      const progress =
                        getMaintenanceProgress(
                          record.lastMaintenanceDate,
                          record.nextMaintenanceDate
                        )

                      return (
                        <Box
                          key={
                            record
                              .item.id
                          }
                          py={5}
                          borderBottom={
                            index <
                            equipment.length -
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
                            <Box>
                              <Text fontWeight="600">
                                {
                                  record
                                    .item
                                    .name
                                }
                              </Text>

                              <Text
                                fontSize="sm"
                                color="gray.500"
                              >
                                {formatEnum(
                                  record
                                    .item
                                    .category
                                )}

                                {record
                                  .item
                                  .sku
                                  ? ` · ${record.item.sku}`
                                  : ''}
                              </Text>
                            </Box>

                            <Badge
                              colorScheme={getConditionColor(
                                record.condition
                              )}
                              borderRadius="full"
                              px={3}
                              py={1}
                            >
                              {formatEnum(
                                record.condition
                              )}
                            </Badge>
                          </Flex>

                          <SimpleGrid
                            columns={{
                              base: 1,
                              md: 3
                            }}
                            spacing={4}
                            mt={4}
                          >
                            <Box>
                              <Text
                                color="gray.500"
                                fontSize="sm"
                              >
                                Last
                                Maintenance
                              </Text>

                              <Text>
                                {formatDate(
                                  record.lastMaintenanceDate
                                )}
                              </Text>
                            </Box>

                            <Box>
                              <Text
                                color="gray.500"
                                fontSize="sm"
                              >
                                Next
                                Maintenance
                              </Text>

                              <Text>
                                {formatDate(
                                  record.nextMaintenanceDate
                                )}
                              </Text>
                            </Box>

                            <Box>
                              <Text
                                color="gray.500"
                                fontSize="sm"
                              >
                                Status
                              </Text>

                              <Text
                                color={
                                  status.textColor
                                }
                              >
                                {
                                  status.label
                                }
                              </Text>
                            </Box>
                          </SimpleGrid>

                          <Flex
                            justify="space-between"
                            mt={4}
                            mb={2}
                          >
                            <Text
                              color="gray.500"
                              fontSize="sm"
                            >
                              Maintenance
                              Progress
                            </Text>

                            <Text fontSize="sm">
                              {progress}%
                            </Text>
                          </Flex>

                          <Progress
                            value={progress}
                            colorScheme={getProgressColor(
                              days
                            )}
                            borderRadius="full"
                          />

                          <Flex
                            gap={2}
                            mt={4}
                            wrap="wrap"
                          >
                            <Button
                              size="sm"
                              leftIcon={
                                <Wrench
                                  size={
                                    15
                                  }
                                />
                              }
                              variant="outline"
                              onClick={() =>
                                openScheduleModal(
                                  record
                                )
                              }
                            >
                              Schedule
                              Maintenance
                            </Button>

                            <Button
                              size="sm"
                              leftIcon={
                                <History
                                  size={
                                    15
                                  }
                                />
                              }
                              variant="outline"
                              onClick={() =>
                                openHistoryModal(
                                  record
                                    .item
                                    .id,
                                  record
                                    .item
                                    .name
                                )
                              }
                            >
                              View History
                            </Button>
                          </Flex>
                        </Box>
                      )
                    }
                  )}
                </VStack>
              )}
            </CardBody>
          </Card>
        </VStack>
      </PageWrap>

      <Modal
        isOpen={
          scheduleModal.isOpen
        }
        onClose={
          closeScheduleModal
        }
        size="lg"
        isCentered
        initialFocusRef={
          nextMaintenanceRef
        }
        closeOnOverlayClick={
          !creatingMaintenance
        }
        closeOnEsc={
          !creatingMaintenance
        }
        blockScrollOnMount
        preserveScrollBarGap
        motionPreset="scale"
      >
        <ModalOverlay
          bg="blackAlpha.600"
          backdropFilter="blur(8px)"
          backdropBlur="8px"
        />

        <ModalContent
          mx={4}
          maxH="calc(100vh - 40px)"
          overflow="hidden"
          borderRadius="16px"
          boxShadow="2xl"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <ModalHeader
            fontSize="xl"
            fontWeight="700"
            borderBottomWidth="1px"
            borderColor="gray.100"
            pr={14}
          >
            Schedule Maintenance
          </ModalHeader>

          <ModalCloseButton
            isDisabled={
              creatingMaintenance
            }
            top={4}
            right={4}
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="10px"
            _focusVisible={{
              boxShadow:
                '0 0 0 3px var(--chakra-colors-blue-200)'
            }}
          />

          <ModalBody
            py={5}
            overflowY="auto"
          >
            <VStack
              align="stretch"
              spacing={4}
            >
              <FormControl
                isInvalid={
                  Boolean(
                    formErrors.itemId
                  )
                }
              >
                <FormLabel>
                  Equipment
                </FormLabel>

                <Input
                  value={
                    selectedEquipmentName
                  }
                  isReadOnly
                  bg="gray.50"
                  cursor="not-allowed"
                  tabIndex={-1}
                />

                <FormErrorMessage>
                  {
                    formErrors.itemId
                  }
                </FormErrorMessage>
              </FormControl>

              <SimpleGrid
                columns={{
                  base: 1,
                  md: 2
                }}
                spacing={4}
              >
                <FormControl
                  isInvalid={
                    Boolean(
                      formErrors.lastMaintenanceDate
                    )
                  }
                >
                  <FormLabel>
                    Last Maintenance
                  </FormLabel>

                  <Input
                    type="date"
                    value={
                      form.lastMaintenanceDate
                    }
                    max={
                      form.nextMaintenanceDate ||
                      undefined
                    }
                    onChange={(
                      event
                    ) => {
                      const value =
                        event.target
                          .value

                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          lastMaintenanceDate:
                            value
                        })
                      )

                      setFormErrors(
                        (
                          current
                        ) => ({
                          ...current,
                          lastMaintenanceDate:
                            undefined,
                          nextMaintenanceDate:
                            undefined
                        })
                      )
                    }}
                  />

                  <FormErrorMessage>
                    {
                      formErrors.lastMaintenanceDate
                    }
                  </FormErrorMessage>
                </FormControl>

                <FormControl
                  isRequired
                  isInvalid={
                    Boolean(
                      formErrors.nextMaintenanceDate
                    )
                  }
                >
                  <FormLabel>
                    Next Maintenance
                  </FormLabel>

                  <Input
                    ref={
                      nextMaintenanceRef
                    }
                    type="date"
                    value={
                      form.nextMaintenanceDate
                    }
                    min={
                      form.lastMaintenanceDate ||
                      undefined
                    }
                    onChange={(
                      event
                    ) => {
                      const value =
                        event.target
                          .value

                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          nextMaintenanceDate:
                            value
                        })
                      )

                      setFormErrors(
                        (
                          current
                        ) => ({
                          ...current,
                          nextMaintenanceDate:
                            undefined
                        })
                      )
                    }}
                  />

                  <FormErrorMessage>
                    {
                      formErrors.nextMaintenanceDate
                    }
                  </FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <FormControl
                isRequired
                isInvalid={
                  Boolean(
                    formErrors.condition
                  )
                }
              >
                <FormLabel>
                  Condition
                </FormLabel>

                <Select
                  value={
                    form.condition
                  }
                  onChange={(
                    event
                  ) => {
                    const value =
                      event.target
                        .value

                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        condition:
                          value
                      })
                    )

                    setFormErrors(
                      (
                        current
                      ) => ({
                        ...current,
                        condition:
                          undefined
                      })
                    )
                  }}
                >
                  <option value="EXCELLENT">
                    Excellent
                  </option>

                  <option value="GOOD">
                    Good
                  </option>

                  <option value="FAIR">
                    Fair
                  </option>

                  <option value="POOR">
                    Poor
                  </option>

                  <option value="NEEDS_REPAIR">
                    Needs Repair
                  </option>
                </Select>

                <FormErrorMessage>
                  {
                    formErrors.condition
                  }
                </FormErrorMessage>
              </FormControl>

              <FormControl
                isInvalid={
                  Boolean(
                    formErrors.notes
                  )
                }
              >
                <Flex
                  justify="space-between"
                  align="center"
                >
                  <FormLabel mb={2}>
                    Notes
                  </FormLabel>

                  <Text
                    fontSize="xs"
                    color={
                      form.notes.length >
                      1000
                        ? 'red.500'
                        : 'gray.500'
                    }
                  >
                    {
                      form.notes
                        .length
                    }
                    /1000
                  </Text>
                </Flex>

                <Textarea
                  value={
                    form.notes
                  }
                  placeholder="Add maintenance notes"
                  resize="vertical"
                  minH="110px"
                  maxLength={1100}
                  onChange={(
                    event
                  ) => {
                    const value =
                      event.target
                        .value

                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        notes: value
                      })
                    )

                    setFormErrors(
                      (
                        current
                      ) => ({
                        ...current,
                        notes:
                          undefined
                      })
                    )
                  }}
                />

                <FormErrorMessage>
                  {
                    formErrors.notes
                  }
                </FormErrorMessage>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter
            borderTopWidth="1px"
            borderColor="gray.100"
            gap={3}
          >
            <Button
              variant="ghost"
              onClick={
                closeScheduleModal
              }
              isDisabled={
                creatingMaintenance
              }
            >
              Cancel
            </Button>

            <Button
              colorScheme="green"
              leftIcon={
                <Wrench
                  size={16}
                />
              }
              onClick={
                handleScheduleMaintenance
              }
              isLoading={
                creatingMaintenance
              }
              loadingText="Saving"
            >
              Save Schedule
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={
          historyModal.isOpen
        }
        onClose={
          closeHistoryModal
        }
        size="xl"
        isCentered
        finalFocusRef={
          historyCloseRef
        }
        blockScrollOnMount
        preserveScrollBarGap
        motionPreset="scale"
      >
        <ModalOverlay
          bg="blackAlpha.600"
          backdropFilter="blur(8px)"
          backdropBlur="8px"
        />

        <ModalContent
          mx={4}
          maxH="calc(100vh - 40px)"
          overflow="hidden"
          borderRadius="16px"
          boxShadow="2xl"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <ModalHeader
            fontSize="xl"
            fontWeight="700"
            borderBottomWidth="1px"
            borderColor="gray.100"
            pr={14}
          >
            {selectedHistory
              ? `${selectedHistory.itemName} Maintenance History`
              : 'Maintenance History'}
          </ModalHeader>

          <ModalCloseButton
            ref={
              historyCloseRef
            }
            top={4}
            right={4}
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="10px"
          />

          <ModalBody
            py={5}
            overflowY="auto"
          >
            {selectedItemHistory.length ===
            0 ? (
              <Center py={10}>
                <VStack spacing={2}>
                  <History
                    size={30}
                  />

                  <Text fontWeight="600">
                    No maintenance history
                  </Text>

                  <Text
                    color="gray.500"
                    fontSize="sm"
                    textAlign="center"
                  >
                    No maintenance records
                    have been captured.
                  </Text>
                </VStack>
              </Center>
            ) : (
              <VStack
                align="stretch"
                spacing={3}
              >
                {selectedItemHistory.map(
                  (record) => (
                    <Card
                      key={
                        record.id
                      }
                      variant="outline"
                      borderRadius="12px"
                    >
                      <CardBody>
                        <Flex
                          justify="space-between"
                          align="flex-start"
                          gap={3}
                        >
                          <Box>
                            <Text
                              fontSize="sm"
                              color="gray.500"
                            >
                              Last
                              Maintenance
                            </Text>

                            <Text fontWeight="600">
                              {formatDate(
                                record.lastMaintenanceDate
                              )}
                            </Text>
                          </Box>

                          <Badge
                            colorScheme={getConditionColor(
                              record.condition
                            )}
                            borderRadius="full"
                            px={3}
                            py={1}
                          >
                            {formatEnum(
                              record.condition
                            )}
                          </Badge>
                        </Flex>

                        <SimpleGrid
                          columns={{
                            base: 1,
                            md: 2
                          }}
                          spacing={4}
                          mt={4}
                        >
                          <Box>
                            <Text
                              fontSize="sm"
                              color="gray.500"
                            >
                              Next
                              Maintenance
                            </Text>

                            <Text>
                              {formatDate(
                                record.nextMaintenanceDate
                              )}
                            </Text>
                          </Box>

                          <Box>
                            <Text
                              fontSize="sm"
                              color="gray.500"
                            >
                              Record Created
                            </Text>

                            <Text>
                              {formatDate(
                                record.createdAt
                              )}
                            </Text>
                          </Box>
                        </SimpleGrid>

                        {record.notes && (
                          <Box mt={4}>
                            <Text
                              fontSize="sm"
                              color="gray.500"
                            >
                              Notes
                            </Text>

                            <Text
                              whiteSpace="pre-wrap"
                              wordBreak="break-word"
                            >
                              {
                                record.notes
                              }
                            </Text>
                          </Box>
                        )}
                      </CardBody>
                    </Card>
                  )
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}