import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react'
import { RefreshCw, Save } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useAuthContext } from '../../../../context'
import { getCatalogueError } from '../../../../rest/api/productCatalogue'

import {
  adjustVariantInventory,
  getVariantInventory,
  type InventoryRecord
} from '../../../../rest/api/inventory'

const BLUE = '#008fff'
const BORDER = '#e3eaf3'
const MUTED = '#7183a0'
const MAX_QUANTITY = 2147483647

type Props = {
  productId: string
  variantId: string
  sku: string
}

type StockState = {
  key: string
  inventory: InventoryRecord | null
  loading: boolean
  error: string | null
  quantity: string
  notes: string
}

export default function VariantStockAdjustment({
  productId,
  variantId,
  sku
}: Props) {
  const { token, user } = useAuthContext()
  const toast = useToast()

  const [refresh, setRefresh] = useState(0)
  const [saving, setSaving] = useState(false)

  const [state, setState] = useState<StockState>({
    key: '',
    inventory: null,
    loading: false,
    error: null,
    quantity: '',
    notes: ''
  })

  const mounted = useRef(false)
  const pending = useRef(false)
  const identityRef = useRef('')

  const identity = JSON.stringify([token, variantId])
  const requestKey = JSON.stringify([token, variantId, refresh])

  identityRef.current = identity

  const current = state.key === requestKey

  const inventory = current ? state.inventory : null
  const loading = Boolean(token) && (!current || state.loading)
  const error = current ? state.error : null

  const canAdjust = Boolean(
    user?.isSuperAdmin ||
    user?.permissions?.includes('inventory.adjust')
  )

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!token) return

    const activeToken = token
    const controller = new AbortController()

    setState({
      key: requestKey,
      inventory: null,
      loading: true,
      error: null,
      quantity: '',
      notes: ''
    })

    async function load() {
      try {
        const result = await getVariantInventory(
          activeToken,
          variantId,
          controller.signal
        )

        if (controller.signal.aborted) return

        setState({
          key: requestKey,
          inventory: result,
          loading: false,
          error: null,
          quantity: String(result.availableQuantity),
          notes: ''
        })
      } catch (error) {
        if (controller.signal.aborted) return

        setState({
          key: requestKey,
          inventory: null,
          loading: false,
          error: getCatalogueError(error),
          quantity: '',
          notes: ''
        })
      }
    }

    void load()

    return () => controller.abort()
  }, [token, variantId, requestKey])

  function setError(message: string) {
    setState((previous) => ({
      ...previous,
      error: message
    }))
  }

  async function handleAdjust() {
    if (!token || !inventory || !canAdjust || pending.current) {
      return
    }

    const requestedText = state.quantity.trim()
    const requestedQuantity = Number(requestedText)

    if (
      !/^\d+$/.test(requestedText) ||
      !Number.isSafeInteger(requestedQuantity) ||
      requestedQuantity > MAX_QUANTITY
    ) {
      setError('Available stock must be a non-negative whole number.')
      return
    }

    const quantityDelta =
      requestedQuantity - inventory.availableQuantity

    if (quantityDelta === 0) {
      setError('Enter a different available stock quantity.')
      return
    }

    if (requestedQuantity + inventory.reservedQuantity > MAX_QUANTITY) {
      setError('The resulting physical stock quantity is too large.')
      return
    }

    const operationIdentity = identity
    const operationToken = token

    pending.current = true
    setSaving(true)
    setState((previous) => ({ ...previous, error: null }))

    try {
      const result = await adjustVariantInventory(
        operationToken,
        variantId,
        {
          quantityDelta,
          notes:
            state.notes.trim() ||
            'Stock adjusted from the product editor.',
          referenceType: 'PRODUCT_EDIT',
          referenceId: productId
        }
      )

      if (
        !mounted.current ||
        identityRef.current !== operationIdentity
      ) {
        return
      }

      setState({
        key: requestKey,
        inventory: result,
        loading: false,
        error: null,
        quantity: String(result.availableQuantity),
        notes: ''
      })

      toast({
        title: 'Stock adjusted',
        description: `${sku}: ${result.availableQuantity} available.`,
        status: 'success',
        duration: 3500,
        isClosable: true
      })
    } catch (error) {
      if (
        mounted.current &&
        identityRef.current === operationIdentity
      ) {
        setError(getCatalogueError(error))
      }
    } finally {
      pending.current = false

      if (mounted.current) {
        setSaving(false)
      }
    }
  }

  return (
    <Box
      p={5}
      border="1px solid"
      borderColor={BORDER}
      borderRadius="10px"
      bg="white"
    >
      <HStack justify="space-between" mb={4} spacing={3}>
        <Box minW={0}>
          <Text fontWeight="700">Inventory</Text>
          <Text color={MUTED} fontSize="xs" wordBreak="break-all">
            {sku}
          </Text>
        </Box>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          leftIcon={<RefreshCw size={14} />}
          isDisabled={saving || loading || !token}
          onClick={() => setRefresh((value) => value + 1)}
        >
          Refresh
        </Button>
      </HStack>

      {!token ? (
        <Text color={MUTED}>Please sign in to view inventory.</Text>
      ) : loading ? (
        <HStack py={5}>
          <Spinner size="sm" color={BLUE} />
          <Text color={MUTED}>Loading stock...</Text>
        </HStack>
      ) : (
        <Stack spacing={4}>
          {error && (
            <Alert status="error" borderRadius="8px">
              <AlertIcon />
              <Text fontSize="sm">{error}</Text>
            </Alert>
          )}

          {inventory && (
            <>
              <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                <Box bg="#f7f9fc" p={3} borderRadius="8px">
                  <Text color={MUTED} fontSize="xs">Physical</Text>
                  <Text fontWeight="800" fontSize="xl">
                    {inventory.physicalQuantity}
                  </Text>
                </Box>

                <Box bg="#f7f9fc" p={3} borderRadius="8px">
                  <Text color={MUTED} fontSize="xs">Reserved</Text>
                  <Text fontWeight="800" fontSize="xl">
                    {inventory.reservedQuantity}
                  </Text>
                </Box>

                <Box bg="#edf7ff" p={3} borderRadius="8px">
                  <Text color={MUTED} fontSize="xs">Available</Text>
                  <Text color={BLUE} fontWeight="800" fontSize="xl">
                    {inventory.availableQuantity}
                  </Text>
                </Box>
              </SimpleGrid>

              <Badge
                alignSelf="flex-start"
                colorScheme={
                  inventory.availableQuantity > 0 ? 'green' : 'red'
                }
              >
                {inventory.availableQuantity > 0
                  ? 'In stock'
                  : 'Out of stock'}
              </Badge>

              {canAdjust ? (
                <>
                  <FormControl>
                    <FormLabel>New available stock</FormLabel>

                    <Input
                      type="number"
                      min={0}
                      max={MAX_QUANTITY}
                      step={1}
                      value={state.quantity}
                      isDisabled={saving}
                      focusBorderColor={BLUE}
                      onChange={(event) => {
                        const quantity = event.target.value

                        setState((previous) => ({
                          ...previous,
                          quantity,
                          error: null
                        }))
                      }}
                    />

                    <FormHelperText>
                      Enter the available quantity after this adjustment.
                      Reserved stock is preserved.
                    </FormHelperText>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Adjustment notes</FormLabel>

                    <Input
                      value={state.notes}
                      isDisabled={saving}
                      placeholder="For example: stock received or stock correction"
                      focusBorderColor={BLUE}
                      onChange={(event) => {
                        const notes = event.target.value

                        setState((previous) => ({
                          ...previous,
                          notes
                        }))
                      }}
                    />
                  </FormControl>

                  <Button
                    type="button"
                    alignSelf="flex-start"
                    bg={BLUE}
                    color="white"
                    leftIcon={<Save size={16} />}
                    isLoading={saving}
                    loadingText="Adjusting"
                    isDisabled={
                      state.quantity.trim() ===
                      String(inventory.availableQuantity)
                    }
                    onClick={() => void handleAdjust()}
                    _hover={{ bg: '#007bdc' }}
                  >
                    Adjust Stock
                  </Button>

                  <Text color={MUTED} fontSize="xs">
                    Stock adjustments are saved immediately and recorded
                    in the stock movement history.
                  </Text>
                </>
              ) : (
                <Text color={MUTED} fontSize="sm">
                  You need inventory adjustment permission to change stock.
                </Text>
              )}
            </>
          )}
        </Stack>
      )}
    </Box>
  )
}