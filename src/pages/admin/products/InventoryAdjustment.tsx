import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormErrorMessage,
  HStack,
  Icon,
  Input,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  useToast
} from '@chakra-ui/react'
import {
  Minus,
  Plus,
  RefreshCcw,
  RotateCcw,
  Save
} from 'lucide-react'
import {
  type ChangeEvent,
  useMemo,
  useState
} from 'react'

import {
  gql,
  useMutation,
  useQuery
} from '@apollo/client'

type InventoryAgricultureItem = {
  id: string
  name: string
  sku?: string | null
  category: string
  stockQuantity?: number | null
  condition: string
  availability: string
}

type InventoryAgricultureItemsData = {
  products: InventoryAgricultureItem[]
}

type InventoryAdjustmentRecord = {
  id: string
  quantityChange: number
  previousQuantity: number
  newQuantity: number
  reason: string
  note?: string | null
  createdAt: string
  agricultureItem: {
    id: string
    name: string
  }
  createdBy?: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  } | null
}

type AgricultureInventoryAdjustmentsData = {
  inventoryAdjustments: InventoryAdjustmentRecord[]
}

type AgricultureInventoryAdjustmentsVariables = {
  limit: number
}

type AdjustAgricultureInventoryInput = {
  adjustments: Array<{
    itemId: string
    quantityChange: number
    reason: string
    note?: string | null
  }>
}

type AdjustAgricultureInventoryData = {
  adjustAgricultureInventory: InventoryAdjustmentRecord[]
}

type AdjustAgricultureInventoryVariables = {
  input: AdjustAgricultureInventoryInput
}

const INVENTORY_AGRICULTURE_ITEMS_QUERY = gql`
  query InventoryAgricultureItems {
    products: agricultureItems {
      id
      name
      sku
      category
      stockQuantity
      condition
      availability
    }
  }
`

const AGRICULTURE_INVENTORY_ADJUSTMENTS_QUERY = gql`
  query AgricultureInventoryAdjustments(
    $limit: Int!
  ) {
    inventoryAdjustments(
      limit: $limit
    ) {
      id
      quantityChange
      previousQuantity
      newQuantity
      reason
      note
      createdAt

      agricultureItem {
        id
        name
      }

      createdBy {
        firstName
        lastName
        email
      }
    }
  }
`

const ADJUST_AGRICULTURE_INVENTORY_MUTATION = gql`
  mutation AdjustAgricultureInventory(
    $input: AdjustAgricultureInventoryInput!
  ) {
    adjustAgricultureInventory(
      input: $input
    ) {
      id
      quantityChange
      previousQuantity
      newQuantity
      reason
      note
      createdAt

      agricultureItem {
        id
        name
      }

      createdBy {
        firstName
        lastName
        email
      }
    }
  }
`
import { PageWrap } from '../../../layout'

type AdjustmentDraft = {
  quantityChange: number
  reason: string
}

type AdjustmentDraftMap = Record<
  string,
  AdjustmentDraft
>

type InventoryProduct = {
  id: string
  name: string
  sku?: string | null
  category: string
  stockQuantity: number
  condition: string
  availability: string
}

type PendingAdjustment = {
  product: InventoryProduct
  quantityChange: number
  reason: string
  previousQuantity: number
  newQuantity: number
}

const EMPTY_DRAFT: AdjustmentDraft = {
  quantityChange: 0,
  reason: ''
}

function formatEnumValue(
  value?: string | null
): string {
  if (!value) {
    return 'Not specified'
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

function formatDate(
  value: string | Date
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
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

function getStockStatus(
  quantity: number
): {
  label: string
  colorScheme: string
} {
  if (quantity <= 0) {
    return {
      label: 'Out of stock',
      colorScheme: 'red'
    }
  }

  if (quantity <= 5) {
    return {
      label: 'Low stock',
      colorScheme: 'orange'
    }
  }

  return {
    label: 'In stock',
    colorScheme: 'green'
  }
}

function getAvailabilityColor(
  availability?: string | null
): string {
  switch (availability) {
    case 'AVAILABLE':
      return 'green'

    case 'RENTED':
      return 'blue'

    case 'SOLD':
      return 'purple'

    case 'UNAVAILABLE':
      return 'red'

    default:
      return 'gray'
  }
}

function getAdjustmentColor(
  quantityChange: number
): string {
  if (quantityChange > 0) {
    return 'green.600'
  }

  if (quantityChange < 0) {
    return 'red.600'
  }

  return 'gray.600'
}

function formatAdjustment(
  quantityChange: number
): string {
  if (quantityChange > 0) {
    return `+${quantityChange}`
  }

  return String(quantityChange)
}

function getAdminName(
  admin?: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  } | null
): string {
  if (!admin) {
    return 'Admin user'
  }

  const fullName = [
    admin.firstName,
    admin.lastName
  ]
    .filter(Boolean)
    .join(' ')
    .trim()

  return (
    fullName ||
    admin.email ||
    'Admin user'
  )
}

export default function InventoryAdjustmentPage() {
  const toast = useToast()

  const [
    drafts,
    setDrafts
  ] =
    useState<AdjustmentDraftMap>({})

  const [
    attemptedSave,
    setAttemptedSave
  ] = useState(false)

  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useQuery<
    InventoryAgricultureItemsData
  >(
    INVENTORY_AGRICULTURE_ITEMS_QUERY,
    {
      fetchPolicy:
        'network-only'
    }
  )

  const {
    data: adjustmentsData,
    loading: adjustmentsLoading,
    error: adjustmentsError,
    refetch: refetchAdjustments
  } = useQuery<
    AgricultureInventoryAdjustmentsData,
    AgricultureInventoryAdjustmentsVariables
  >(
    AGRICULTURE_INVENTORY_ADJUSTMENTS_QUERY,
    {
      variables: {
        limit: 10
      },
      fetchPolicy:
        'network-only'
    }
  )

  const [
    adjustAgricultureInventory,
    {
      loading: saving
    }
  ] = useMutation<
    AdjustAgricultureInventoryData,
    AdjustAgricultureInventoryVariables
  >(
    ADJUST_AGRICULTURE_INVENTORY_MUTATION
  )

  /*
   * The GraphQL operation must use:
   *
   * products: agricultureItems
   *
   * This makes productsData.products valid.
   */
  const products =
    useMemo<InventoryProduct[]>(
      () =>
        productsData?.products?.map(
          product => ({
            id: product.id,
            name: product.name,
            sku: product.sku,
            category:
              product.category,
            stockQuantity:
              product.stockQuantity ??
              0,
            condition:
              product.condition,
            availability:
              product.availability
          })
        ) ?? [],
      [productsData?.products]
    )

  const recentAdjustments =
    adjustmentsData
      ?.inventoryAdjustments ?? []

  const getDraft = (
    productId: string
  ): AdjustmentDraft =>
    drafts[productId] ??
    EMPTY_DRAFT

  const updateQuantity = (
    productId: string,
    quantityChange: number
  ) => {
    if (
      !Number.isFinite(
        quantityChange
      )
    ) {
      return
    }

    setDrafts(current => ({
      ...current,

      [productId]: {
        quantityChange:
          Math.trunc(
            quantityChange
          ),

        reason:
          current[productId]
            ?.reason ?? ''
      }
    }))
  }

  const updateReason = (
    productId: string,
    reason: string
  ) => {
    setDrafts(current => ({
      ...current,

      [productId]: {
        quantityChange:
          current[productId]
            ?.quantityChange ?? 0,

        reason
      }
    }))
  }

  const pendingAdjustments =
    useMemo<
      PendingAdjustment[]
    >(
      () =>
        products
          .map(product => {
            const draft =
              drafts[product.id]

            if (
              !draft ||
              draft.quantityChange ===
                0
            ) {
              return null
            }

            return {
              product,

              quantityChange:
                draft.quantityChange,

              reason:
                draft.reason.trim(),

              previousQuantity:
                product.stockQuantity,

              newQuantity:
                product.stockQuantity +
                draft.quantityChange
            }
          })
          .filter(
            (
              adjustment
            ): adjustment is PendingAdjustment =>
              adjustment !== null
          ),
      [
        products,
        drafts
      ]
    )

  const invalidReasonIds =
    useMemo(
      () =>
        new Set(
          pendingAdjustments
            .filter(
              adjustment =>
                !adjustment.reason
            )
            .map(
              adjustment =>
                adjustment.product.id
            )
        ),
      [pendingAdjustments]
    )

  const negativeStockIds =
    useMemo(
      () =>
        new Set(
          pendingAdjustments
            .filter(
              adjustment =>
                adjustment.newQuantity <
                0
            )
            .map(
              adjustment =>
                adjustment.product.id
            )
        ),
      [pendingAdjustments]
    )

  const hasPendingChanges =
    pendingAdjustments.length > 0

  const handleQuantityInput = (
    productId: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value =
      event.target.value

    if (
      value === '' ||
      value === '-'
    ) {
      updateQuantity(
        productId,
        0
      )

      return
    }

    const parsedValue =
      Number(value)

    if (
      Number.isFinite(
        parsedValue
      )
    ) {
      updateQuantity(
        productId,
        parsedValue
      )
    }
  }

  const handleDiscard = () => {
    setDrafts({})
    setAttemptedSave(false)
  }

  const handleRefresh =
    async () => {
      try {
        await Promise.all([
          refetchProducts(),
          refetchAdjustments()
        ])

        toast({
          title:
            'Inventory refreshed',
          status: 'success',
          duration: 3000,
          isClosable: true
        })
      } catch (error) {
        toast({
          title:
            'Unable to refresh inventory',

          description:
            error instanceof Error
              ? error.message
              : 'Please try again.',

          status: 'error',
          duration: 5000,
          isClosable: true
        })
      }
    }

  const handleSaveAll =
    async () => {
      setAttemptedSave(true)

      if (!hasPendingChanges) {
        toast({
          title:
            'No inventory changes',

          description:
            'Adjust at least one product before saving.',

          status: 'info',
          duration: 4000,
          isClosable: true
        })

        return
      }

      if (
        negativeStockIds.size > 0
      ) {
        toast({
          title:
            'Invalid stock adjustment',

          description:
            'A product stock level cannot be lower than zero.',

          status: 'error',
          duration: 5000,
          isClosable: true
        })

        return
      }

      if (
        invalidReasonIds.size > 0
      ) {
        toast({
          title:
            'Reason required',

          description:
            'Enter a reason for every inventory adjustment.',

          status: 'error',
          duration: 5000,
          isClosable: true
        })

        return
      }

      try {
        await adjustAgricultureInventory({
          variables: {
            input: {
              adjustments:
                pendingAdjustments.map(
                  adjustment => ({
                    itemId:
                      adjustment
                        .product.id,

                    quantityChange:
                      adjustment
                        .quantityChange,

                    reason:
                      adjustment.reason,

                    note: null
                  })
                )
            }
          }
        })

        const updatedCount =
          pendingAdjustments.length

        setDrafts({})
        setAttemptedSave(false)

        await Promise.all([
          refetchProducts(),
          refetchAdjustments()
        ])

        toast({
          title:
            'Inventory updated',

          description:
            `${updatedCount} product${
              updatedCount === 1
                ? ''
                : 's'
            } updated successfully.`,

          status: 'success',
          duration: 5000,
          isClosable: true
        })
      } catch (error) {
        toast({
          title:
            'Inventory update failed',

          description:
            error instanceof Error
              ? error.message
              : 'Unable to update inventory.',

          status: 'error',
          duration: 6000,
          isClosable: true
        })
      }
    }

  const pageActions = (
    <HStack
      spacing={3}
      flexWrap="wrap"
    >
      <Button
        variant="outline"
        leftIcon={
          <Icon
            as={RefreshCcw}
          />
        }
        onClick={handleRefresh}
        isDisabled={saving}
      >
        Refresh
      </Button>

      {hasPendingChanges && (
        <Button
          variant="outline"
          leftIcon={
            <Icon
              as={RotateCcw}
            />
          }
          onClick={handleDiscard}
          isDisabled={saving}
        >
          Discard
        </Button>
      )}

      <Button
        leftIcon={
          <Icon as={Save} />
        }
        colorScheme="green"
        onClick={handleSaveAll}
        isLoading={saving}
        isDisabled={
          !hasPendingChanges ||
          saving
        }
      >
        Save All Changes
        {hasPendingChanges
          ? ` (${pendingAdjustments.length})`
          : ''}
      </Button>
    </HStack>
  )

  if (productsLoading) {
    return (
      <PageWrap
        title="Inventory Adjustment"
        subtitle="Adjust stock levels and track changes"
      >
        <Center minH="60vh">
          <Spinner
            size="xl"
            color="green.600"
          />
        </Center>
      </PageWrap>
    )
  }

  if (productsError) {
    return (
      <PageWrap
        title="Inventory Adjustment"
        subtitle="Adjust stock levels and track changes"
      >
        <Center minH="60vh">
          <VStack spacing={4}>
            <Text
              fontSize="xl"
              fontWeight="700"
              color="red.600"
            >
              Unable to load products
            </Text>

            <Text
              color="gray.600"
              textAlign="center"
            >
              {productsError.message}
            </Text>

            <Button
              colorScheme="green"
              onClick={() =>
                refetchProducts()
              }
            >
              Try Again
            </Button>
          </VStack>
        </Center>
      </PageWrap>
    )
  }

  return (
    <PageWrap
      title="Inventory Adjustment"
      subtitle="Adjust stock levels and track changes"
      rightElements={pageActions}
    >
      <Box py={2}>
        {products.length === 0 ? (
          <Center
            minH="300px"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="14px"
            bg="white"
          >
            <VStack spacing={2}>
              <Text
                fontSize="lg"
                fontWeight="700"
              >
                No products found
              </Text>

              <Text
                color="gray.500"
                textAlign="center"
              >
                Products will appear here
                after they are created.
              </Text>
            </VStack>
          </Center>
        ) : (
          <VStack
            spacing={4}
            align="stretch"
          >
            {products.map(product => {
              const draft =
                getDraft(product.id)

              const newQuantity =
                product.stockQuantity +
                draft.quantityChange

              const stockStatus =
                getStockStatus(
                  product.stockQuantity
                )

              const hasChanged =
                draft.quantityChange !==
                0

              const missingReason =
                attemptedSave &&
                hasChanged &&
                invalidReasonIds.has(
                  product.id
                )

              const wouldBeNegative =
                negativeStockIds.has(
                  product.id
                )

              return (
                <Box
                  key={product.id}
                  bg="white"
                  border="1px solid"
                  borderColor={
                    missingReason ||
                    wouldBeNegative
                      ? 'red.300'
                      : hasChanged
                        ? 'green.300'
                        : 'gray.200'
                  }
                  borderRadius="14px"
                  px={{
                    base: 4,
                    md: 5
                  }}
                  py={5}
                  boxShadow={
                    hasChanged
                      ? 'sm'
                      : 'none'
                  }
                >
                  <SimpleGrid
                    columns={{
                      base: 1,
                      lg: 12
                    }}
                    spacing={{
                      base: 5,
                      lg: 6
                    }}
                    alignItems="center"
                  >
                    <Box
                      gridColumn={{
                        lg: 'span 4'
                      }}
                    >
                      <Text
                        fontSize="md"
                        fontWeight="700"
                        color="gray.800"
                      >
                        {product.name}
                      </Text>

                      <Text
                        mt={1}
                        color="gray.500"
                        fontSize="sm"
                      >
                        {formatEnumValue(
                          product.category
                        )}

                        {product.sku
                          ? ` · ${product.sku}`
                          : ''}
                      </Text>

                      <Flex
                        mt={3}
                        gap={2}
                        wrap="wrap"
                      >
                        <Badge
                          colorScheme={
                            stockStatus
                              .colorScheme
                          }
                          borderRadius="full"
                          px={3}
                          py={1}
                        >
                          {
                            stockStatus.label
                          }
                        </Badge>

                        <Badge
                          colorScheme={getAvailabilityColor(
                            product.availability
                          )}
                          borderRadius="full"
                          px={3}
                          py={1}
                        >
                          {formatEnumValue(
                            product.availability
                          )}
                        </Badge>

                        <Badge
                          colorScheme="gray"
                          borderRadius="full"
                          px={3}
                          py={1}
                        >
                          Current:{' '}
                          {
                            product.stockQuantity
                          }{' '}
                          units
                        </Badge>

                        {hasChanged && (
                          <Badge
                            colorScheme={
                              newQuantity >
                              product.stockQuantity
                                ? 'green'
                                : 'red'
                            }
                            borderRadius="full"
                            px={3}
                            py={1}
                          >
                            New:{' '}
                            {newQuantity}{' '}
                            units
                          </Badge>
                        )}
                      </Flex>
                    </Box>

                    <FormControl
                      gridColumn={{
                        lg: 'span 3'
                      }}
                      isInvalid={
                        wouldBeNegative
                      }
                    >
                      <Text
                        mb={2}
                        fontSize="sm"
                        color="gray.600"
                      >
                        Adjustment
                      </Text>

                      <HStack spacing={2}>
                        <Button
                          variant="outline"
                          h="42px"
                          minW="58px"
                          onClick={() =>
                            updateQuantity(
                              product.id,
                              draft.quantityChange -
                                1
                            )
                          }
                          isDisabled={saving}
                          aria-label={`Decrease ${product.name} stock`}
                        >
                          <Icon
                            as={Minus}
                            boxSize={4}
                          />
                        </Button>

                        <Input
                          type="number"
                          value={
                            draft.quantityChange
                          }
                          onChange={event =>
                            handleQuantityInput(
                              product.id,
                              event
                            )
                          }
                          textAlign="center"
                          fontWeight="700"
                          color={getAdjustmentColor(
                            draft.quantityChange
                          )}
                          bg="gray.50"
                          isDisabled={saving}
                        />

                        <Button
                          variant="outline"
                          h="42px"
                          minW="58px"
                          onClick={() =>
                            updateQuantity(
                              product.id,
                              draft.quantityChange +
                                1
                            )
                          }
                          isDisabled={saving}
                          aria-label={`Increase ${product.name} stock`}
                        >
                          <Icon
                            as={Plus}
                            boxSize={4}
                          />
                        </Button>
                      </HStack>

                      {wouldBeNegative && (
                        <FormErrorMessage>
                          Stock cannot be
                          lower than zero.
                        </FormErrorMessage>
                      )}
                    </FormControl>

                    <Box
                      gridColumn={{
                        lg: 'span 1'
                      }}
                      textAlign={{
                        base: 'left',
                        lg: 'center'
                      }}
                    >
                      <Text
                        fontSize="sm"
                        color="gray.500"
                      >
                        Change
                      </Text>

                      <Text
                        mt={1}
                        fontSize="lg"
                        fontWeight="700"
                        color={getAdjustmentColor(
                          draft.quantityChange
                        )}
                      >
                        {formatAdjustment(
                          draft.quantityChange
                        )}
                      </Text>
                    </Box>

                    <FormControl
                      gridColumn={{
                        lg: 'span 4'
                      }}
                      isRequired={hasChanged}
                      isInvalid={
                        missingReason
                      }
                    >
                      <Text
                        mb={2}
                        fontSize="sm"
                        color="gray.600"
                      >
                        Reason
                      </Text>

                      <Input
                        value={draft.reason}
                        onChange={event =>
                          updateReason(
                            product.id,
                            event.target.value
                          )
                        }
                        placeholder="e.g. Received shipment"
                        isDisabled={
                          !hasChanged ||
                          saving
                        }
                        bg={
                          hasChanged
                            ? 'white'
                            : 'gray.50'
                        }
                      />

                      {missingReason && (
                        <FormErrorMessage>
                          Enter a reason for
                          this adjustment.
                        </FormErrorMessage>
                      )}
                    </FormControl>
                  </SimpleGrid>
                </Box>
              )
            })}
          </VStack>
        )}

        <Box
          mt={6}
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="14px"
          px={{
            base: 4,
            md: 5
          }}
          py={5}
        >
          <Flex
            align="center"
            justify="space-between"
            mb={5}
          >
            <Box>
              <Text
                fontSize="md"
                fontWeight="700"
                color="gray.800"
              >
                Recent Adjustments
              </Text>

              <Text
                mt={1}
                fontSize="sm"
                color="gray.500"
              >
                Latest inventory stock
                changes
              </Text>
            </Box>

            <Button
              size="sm"
              variant="ghost"
              leftIcon={
                <Icon
                  as={RefreshCcw}
                />
              }
              onClick={() =>
                refetchAdjustments()
              }
              isLoading={
                adjustmentsLoading
              }
            >
              Refresh
            </Button>
          </Flex>

          {adjustmentsLoading ? (
            <Center py={10}>
              <Spinner
                color="green.600"
              />
            </Center>
          ) : adjustmentsError ? (
            <Center py={10}>
              <VStack spacing={3}>
                <Text
                  color="red.500"
                  textAlign="center"
                >
                  {
                    adjustmentsError.message
                  }
                </Text>

                <Button
                  size="sm"
                  onClick={() =>
                    refetchAdjustments()
                  }
                >
                  Try Again
                </Button>
              </VStack>
            </Center>
          ) : recentAdjustments.length ===
            0 ? (
            <Center py={10}>
              <Text color="gray.500">
                No inventory adjustments
                have been recorded.
              </Text>
            </Center>
          ) : (
            <VStack
              spacing={0}
              align="stretch"
            >
              {recentAdjustments.map(
                (
                  adjustment,
                  index
                ) => (
                  <Flex
                    key={adjustment.id}
                    align={{
                      base: 'flex-start',
                      md: 'center'
                    }}
                    justify="space-between"
                    direction={{
                      base: 'column',
                      md: 'row'
                    }}
                    gap={3}
                    py={4}
                    borderTop={
                      index === 0
                        ? 'none'
                        : '1px solid'
                    }
                    borderColor="gray.100"
                  >
                    <Box>
                      <Text
                        fontWeight="600"
                        color="gray.800"
                      >
                        {
                          adjustment
                            .agricultureItem
                            .name
                        }
                      </Text>

                      <Text
                        mt={1}
                        color="gray.500"
                        fontSize="sm"
                      >
                        {
                          adjustment.reason
                        }{' '}
                        ·{' '}
                        {getAdminName(
                          adjustment.createdBy
                        )}
                      </Text>

                      <Text
                        mt={1}
                        color="gray.400"
                        fontSize="xs"
                      >
                        {
                          adjustment.previousQuantity
                        }{' '}
                        →{' '}
                        {
                          adjustment.newQuantity
                        }{' '}
                        units
                      </Text>
                    </Box>

                    <HStack spacing={5}>
                      <Badge
                        colorScheme={
                          adjustment.quantityChange >
                          0
                            ? 'green'
                            : adjustment.quantityChange <
                                0
                              ? 'red'
                              : 'gray'
                        }
                        borderRadius="full"
                        px={3}
                        py={1}
                      >
                        {formatAdjustment(
                          adjustment.quantityChange
                        )}
                      </Badge>

                      <Text
                        color="gray.500"
                        fontSize="sm"
                        minW="150px"
                        textAlign={{
                          base: 'left',
                          md: 'right'
                        }}
                      >
                        {formatDate(
                          adjustment.createdAt
                        )}
                      </Text>
                    </HStack>
                  </Flex>
                )
              )}
            </VStack>
          )}
        </Box>
      </Box>
    </PageWrap>
  )
}