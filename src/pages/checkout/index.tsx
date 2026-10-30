import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack
} from '@chakra-ui/react'
import axios from 'axios'
import {
  useEffect,
  useRef,
  useState,
  type FormEvent
} from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import RequestOrderWhatsApp, {
  type WhatsAppOrder
} from '../../components/RequestOrderWhatsApp'
import { useAuthContext } from '../../context'
import { useCart } from '../../context/CartContext'
import WebsiteLayout from '../../layout/WebsiteLayout'
import { API_HOST } from '../../utils/contants'

const BLUE = '#008fff'
const NAVY = '#07132b'
const MUTED = '#7183a0'
const BORDER = '#e3eaf3'

const api = axios.create({
  baseURL: `${API_HOST.trim().replace(/\/+$/, '')}/api/v1`,
  timeout: 20_000,
  headers: {
    Accept: 'application/json'
  }
})

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

interface DeliveryAddress {
  recipientName: string
  phoneNumber: string
  addressLine1: string
  addressLine2: string
  city: string
  province: string
  postalCode: string
  country: string
}

interface OrderState {
  id: string
  data: WhatsAppOrder | null
  loading: boolean
  error: string | null
}

const provinces = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape'
]

const deliveryFields: Array<{
  name: keyof DeliveryAddress
  label: string
  required: boolean
  autoComplete: string
  type?: string
}> = [
  {
    name: 'recipientName',
    label: 'Recipient name',
    required: true,
    autoComplete: 'name'
  },
  {
    name: 'phoneNumber',
    label: 'Phone number',
    required: true,
    autoComplete: 'tel',
    type: 'tel'
  },
  {
    name: 'addressLine1',
    label: 'Street address',
    required: true,
    autoComplete: 'address-line1'
  },
  {
    name: 'addressLine2',
    label: 'Apartment, complex or unit',
    required: false,
    autoComplete: 'address-line2'
  },
  {
    name: 'city',
    label: 'City',
    required: true,
    autoComplete: 'address-level2'
  }
]

function authorization(token: string) {
  const value = token.trim()

  return {
    Authorization: /^Bearer\s/i.test(value)
      ? value
      : `Bearer ${value}`
  }
}

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data == null) {
    throw new Error('The server could not complete this request.')
  }

  return response.data
}

function requestError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'The request could not be confirmed. Please check your orders.'
  }

  if (!error.response || error.response.status >= 500) {
    return 'The request could not be confirmed. Please check your orders before trying again.'
  }

  if (error.response.status === 401) {
    return 'Your session has expired. Please sign in again.'
  }

  if (error.response.status === 404) {
    return 'The requested order or active cart could not be found.'
  }

  const body = error.response.data as {
    message?: string
    error?: string | { message?: string }
  }

  const nested =
    typeof body?.error === 'string'
      ? body.error
      : body?.error?.message

  return nested || body?.message || 'Unable to complete your request.'
}

function money(value: string | number, currency = 'ZAR') {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency
  }).format(Number(value))
}

export default function CheckoutPage() {
  const { user, token, isAuthenticating } = useAuthContext()

  return (
    <WebsiteLayout>
      <Box
        minH="75vh"
        bg="#f7f9fc"
        color={NAVY}
        fontFamily="Arial, Helvetica, sans-serif"
      >
        <Container
          maxW="1200px"
          px={{ base: 5, md: 8 }}
          py={{ base: 8, md: 12 }}
        >
          {isAuthenticating ? (
            <Flex justify="center" py={16}>
              <Spinner color={BLUE} size="xl" />
            </Flex>
          ) : !token || !user ? (
            <Box textAlign="center" py={16}>
              <Heading size="lg">Sign in to continue</Heading>

              <Text mt={3} color={MUTED}>
                Sign in to prepare your order request.
              </Text>

              <Button
                as={Link}
                to="/login"
                mt={6}
                bg={BLUE}
                color="white"
                _hover={{ bg: '#007ada' }}
              >
                Sign in
              </Button>
            </Box>
          ) : (
            <CheckoutContent
              key={JSON.stringify([user.id, token])}
              token={token}
              initialName={[user.firstName, user.lastName]
                .filter(Boolean)
                .join(' ')}
              initialPhone={user.phone || ''}
            />
          )}
        </Container>
      </Box>
    </WebsiteLayout>
  )
}

function CheckoutContent({
  token,
  initialName,
  initialPhone
}: {
  token: string
  initialName: string
  initialPhone: string
}) {
  const [params, setParams] = useSearchParams()

  const {
    cart,
    items,
    subtotal,
    loading: cartLoading,
    updating,
    error: cartError,
    refreshCart
  } = useCart()

  const orderId = params.get('orderId')?.trim() || ''

  const [address, setAddress] = useState<DeliveryAddress>({
    recipientName: initialName,
    phoneNumber: initialPhone,
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa'
  })

  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uncertainOrder, setUncertainOrder] = useState(false)
  const [reload, setReload] = useState(0)

  const [orderState, setOrderState] = useState<OrderState>({
    id: '',
    data: null,
    loading: false,
    error: null
  })

  const locked = useRef(false)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!orderId) return

    const controller = new AbortController()

    setOrderState({
      id: orderId,
      data: null,
      loading: true,
      error: null
    })

    async function loadOrder() {
      try {
        const response = await api.get<ApiResponse<WhatsAppOrder>>(
          `/orders/${encodeURIComponent(orderId)}`,
          {
            signal: controller.signal,
            headers: authorization(token)
          }
        )

        const order = unwrap(response.data)

        if (controller.signal.aborted) return

        setOrderState({
          id: orderId,
          data: order,
          loading: false,
          error: null
        })
      } catch (error) {
        if (controller.signal.aborted) return

        setOrderState({
          id: orderId,
          data: null,
          loading: false,
          error: requestError(error)
        })
      }
    }

    void loadOrder()

    return () => controller.abort()
  }, [orderId, token, reload])

  const order =
    orderState.id === orderId ? orderState.data : null

  const loadingOrder =
    Boolean(orderId) &&
    (orderState.id !== orderId || orderState.loading)

  const hasUnavailableItems = items.some((item) => {
    const available =
      (item.variant.inventory?.physicalQuantity ?? 0) -
      (item.variant.inventory?.reservedQuantity ?? 0)

    return !item.variant.isActive || item.quantity > available
  })

  function updateAddress(
    field: keyof DeliveryAddress,
    value: string
  ) {
    setAddress((previous) => ({
      ...previous,
      [field]: value
    }))

    setError(null)
  }

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (
      locked.current ||
      uncertainOrder ||
      orderId ||
      cartLoading ||
      updating
    ) {
      return
    }

    if (!cart || items.length === 0) {
      setError('Your cart is empty.')
      return
    }

    if (cartError || hasUnavailableItems) {
      setError('Refresh your cart and resolve unavailable items first.')
      return
    }

    const deliveryAddress: DeliveryAddress = {
      recipientName: address.recipientName.trim(),
      phoneNumber: address.phoneNumber.trim(),
      addressLine1: address.addressLine1.trim(),
      addressLine2: address.addressLine2.trim(),
      city: address.city.trim(),
      province: address.province.trim(),
      postalCode: address.postalCode.trim(),
      country: 'South Africa'
    }

    const phoneDigits = deliveryAddress.phoneNumber.replace(/\D/g, '')

    if (
      !deliveryAddress.recipientName ||
      phoneDigits.length < 10 ||
      phoneDigits.length > 15 ||
      !deliveryAddress.addressLine1 ||
      !deliveryAddress.city ||
      !provinces.includes(deliveryAddress.province) ||
      !/^\d{4}$/.test(deliveryAddress.postalCode)
    ) {
      setError(
        'Complete your delivery details, including a valid phone number and four-digit postal code.'
      )
      return
    }

    locked.current = true
    setSubmitting(true)
    setError(null)

    try {
      const response = await api.post<ApiResponse<WhatsAppOrder>>(
        '/orders/checkout',
        {
          cartId: cart.id,
          deliveryAddress,
          ...(notes.trim() ? { notes: notes.trim() } : {})
        },
        {
          headers: authorization(token)
        }
      )

      const created = unwrap(response.data)

      if (!created.id) {
        throw new Error('The order response did not contain an order ID.')
      }

      if (!mounted.current) return

      setOrderState({
        id: created.id,
        data: created,
        loading: false,
        error: null
      })

      setParams(
        { orderId: created.id },
        { replace: true }
      )

      // Checkout converts the previous cart.
      // Refresh the shared context and Navbar count.
      void refreshCart()
    } catch (error) {
      if (!mounted.current) return

      setError(requestError(error))

      // Do not automatically create another order after an
      // unconfirmed response.
      setUncertainOrder(
        !axios.isAxiosError(error) ||
        !error.response ||
        error.response.status >= 500
      )
    } finally {
      locked.current = false

      if (mounted.current) {
        setSubmitting(false)
      }
    }
  }

  const inputStyles = {
    bg: 'white',
    borderColor: BORDER,
    borderRadius: '10px',
    focusBorderColor: BLUE
  }

  return (
    <>
      <Button
        as={Link}
        to="/cart"
        variant="link"
        color={BLUE}
        mb={6}
      >
        Back to cart
      </Button>

      <Heading
        as="h1"
        fontSize={{ base: '30px', md: '42px' }}
        letterSpacing="-0.04em"
      >
        Order Request
      </Heading>

      <Text mt={3} mb={7} color={MUTED} lineHeight="1.8">
        {orderId
          ? 'Review your saved order and contact our team via WhatsApp.'
          : 'Complete your delivery information, then review your order before requesting it via WhatsApp.'}
      </Text>

      {error && (
        <Alert status="error" mb={6} borderRadius="12px">
          <AlertIcon />
          <Text>{error}</Text>
        </Alert>
      )}

      {loadingOrder || (!orderId && cartLoading && !cart) ? (
        <Flex justify="center" py={16}>
          <Spinner color={BLUE} size="xl" />
        </Flex>
      ) : orderId ? (
        !order ? (
          <Box
            bg="white"
            border="1px solid"
            borderColor={BORDER}
            borderRadius="16px"
            p={7}
          >
            <Text color={MUTED}>
              {orderState.error || 'Unable to retrieve this order.'}
            </Text>

            <Flex mt={5} gap={3} flexWrap="wrap">
              <Button
                onClick={() => setReload((value) => value + 1)}
              >
                Retry
              </Button>

              <Button
                as={Link}
                to="/dashboard"
                variant="outline"
              >
                My orders
              </Button>
            </Flex>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={7}>
            <Box
              bg="white"
              border="1px solid"
              borderColor={BORDER}
              borderRadius="16px"
              p={7}
              alignSelf="start"
            >
              <Heading size="md">
                Order {order.orderNumber}
              </Heading>

              <Text mt={3} color={MUTED} fontSize="sm">
                Order status: {order.status.replace(/_/g, ' ')}
              </Text>

              <RequestOrderWhatsApp order={order} />

              <Button
                as={Link}
                to="/dashboard"
                mt={4}
                w="full"
                variant="outline"
                borderColor={BORDER}
                color={NAVY}
                borderRadius="10px"
              >
                View my orders
              </Button>
            </Box>

            <OrderSummary order={order} />
          </SimpleGrid>
        )
      ) : !items.length ? (
        <Box
          textAlign="center"
          bg="white"
          border="1px solid"
          borderColor={BORDER}
          borderRadius="16px"
          p={12}
        >
          <Heading size="md">
            {cartError ? 'Unable to load your cart' : 'Your cart is empty'}
          </Heading>

          <Text mt={3} color={MUTED}>
            {cartError || 'Add products before preparing an order request.'}
          </Text>

          {cartError ? (
            <Button mt={5} onClick={() => void refreshCart()}>
              Retry
            </Button>
          ) : (
            <Button
              as={Link}
              to="/shop"
              mt={5}
              bg={BLUE}
              color="white"
            >
              Browse products
            </Button>
          )}
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={7}>
          <Box
            as="form"
            onSubmit={createOrder}
            bg="white"
            border="1px solid"
            borderColor={BORDER}
            borderRadius="16px"
            p={{ base: 5, md: 7 }}
          >
            <Heading size="md" mb={6}>
              Delivery information
            </Heading>

            <Box
              as="fieldset"
              disabled={submitting || uncertainOrder}
              border={0}
              p={0}
              minW={0}
            >
              <VStack spacing={5} align="stretch">
                {deliveryFields.map((field) => (
                  <FormControl
                    key={field.name}
                    isRequired={field.required}
                  >
                    <FormLabel htmlFor={`delivery-${field.name}`}>
                      {field.label}
                    </FormLabel>

                    <Input
                      {...inputStyles}
                      id={`delivery-${field.name}`}
                      type={field.type || 'text'}
                      autoComplete={field.autoComplete}
                      value={address[field.name]}
                      onChange={(event) =>
                        updateAddress(field.name, event.target.value)
                      }
                    />
                  </FormControl>
                ))}

                <FormControl isRequired>
                  <FormLabel htmlFor="delivery-province">
                    Province
                  </FormLabel>

                  <Select
                    {...inputStyles}
                    id="delivery-province"
                    placeholder="Select province"
                    value={address.province}
                    onChange={(event) =>
                      updateAddress('province', event.target.value)
                    }
                  >
                    {provinces.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel htmlFor="delivery-postal-code">
                    Postal code
                  </FormLabel>

                  <Input
                    {...inputStyles}
                    id="delivery-postal-code"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    value={address.postalCode}
                    onChange={(event) =>
                      updateAddress('postalCode', event.target.value)
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel htmlFor="delivery-notes">
                    Delivery notes
                  </FormLabel>

                  <Textarea
                    id="delivery-notes"
                    borderColor={BORDER}
                    focusBorderColor={BLUE}
                    borderRadius="10px"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Complex name, gate code or delivery instructions"
                  />
                </FormControl>

                <Button
                  type="submit"
                  bg={BLUE}
                  color="white"
                  h="50px"
                  borderRadius="10px"
                  isLoading={submitting}
                  loadingText="Preparing order"
                  isDisabled={
                    uncertainOrder ||
                    cartLoading ||
                    updating ||
                    Boolean(cartError) ||
                    hasUnavailableItems
                  }
                  _hover={{ bg: '#007ada' }}
                >
                  Create order request
                </Button>

                <Text fontSize="xs" color={MUTED} lineHeight="1.8">
                  This saves your order for review. You will then be
                  able to open WhatsApp and send the request.
                </Text>
              </VStack>
            </Box>

            {uncertainOrder && (
              <Button
                as={Link}
                to="/dashboard"
                mt={5}
                variant="outline"
              >
                Check my orders
              </Button>
            )}
          </Box>

          <Box
            bg="white"
            border="1px solid"
            borderColor={BORDER}
            borderRadius="16px"
            p={7}
            alignSelf="start"
          >
            <Heading size="md" mb={5}>
              Your cart
            </Heading>

            <VStack align="stretch" spacing={4}>
              {items.map((item) => (
                <Flex key={item.id} justify="space-between" gap={4}>
                  <Text fontSize="sm">
                    {item.quantity} × {item.variant.product.name}
                  </Text>

                  <Text fontSize="sm" fontWeight="700">
                    {money(
                      Number(item.unitPriceSnapshot) * item.quantity,
                      cart?.currency || 'ZAR'
                    )}
                  </Text>
                </Flex>
              ))}
            </VStack>

            <Divider my={5} borderColor={BORDER} />

            <Flex justify="space-between" gap={4}>
              <Text fontWeight="700">Cart subtotal</Text>

              <Text fontWeight="800">
                {money(subtotal, cart?.currency || 'ZAR')}
              </Text>
            </Flex>

            <Text mt={4} color={MUTED} fontSize="sm" lineHeight="1.8">
              Our team will confirm availability, final pricing,
              delivery costs and payment arrangements via WhatsApp.
            </Text>

            {(hasUnavailableItems || cartError) && (
              <Alert status="warning" mt={5} borderRadius="10px">
                <AlertIcon />

                <Text fontSize="sm">
                  {cartError ||
                    'Return to your cart and update unavailable items.'}
                </Text>
              </Alert>
            )}
          </Box>
        </SimpleGrid>
      )}
    </>
  )
}

function OrderSummary({ order }: { order: WhatsAppOrder }) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor={BORDER}
      borderRadius="16px"
      p={7}
    >
      <Heading size="md" mb={5}>
        Order summary
      </Heading>

      <VStack align="stretch" spacing={4}>
        {order.items.map((item) => (
          <Flex key={item.id} justify="space-between" gap={4}>
            <Text fontSize="sm">
              {item.quantity} × {item.productNameSnapshot}
            </Text>

            <Text fontWeight="700" fontSize="sm">
              {money(item.lineTotal, order.currency)}
            </Text>
          </Flex>
        ))}
      </VStack>

      <Divider my={5} borderColor={BORDER} />

      <SummaryRow
        label="Subtotal"
        value={order.subtotal}
        currency={order.currency}
      />

      <SummaryRow
        label="Discount"
        value={-Number(order.discountTotal)}
        currency={order.currency}
      />

      <SummaryRow
        label="Recorded delivery fee"
        value={order.deliveryFee}
        currency={order.currency}
      />

      <SummaryRow
        label="Recorded tax"
        value={order.taxTotal}
        currency={order.currency}
      />

      <Divider my={5} borderColor={BORDER} />

      <Flex justify="space-between" gap={4}>
        <Text fontWeight="700">Recorded order total</Text>

        <Text fontWeight="800" fontSize="2xl">
          {money(order.total, order.currency)}
        </Text>
      </Flex>

      <Text mt={4} color={MUTED} fontSize="xs" lineHeight="1.8">
        Final pricing and delivery arrangements will be confirmed by
        our team. No online payment has been made.
      </Text>
    </Box>
  )
}

function SummaryRow({
  label,
  value,
  currency
}: {
  label: string
  value: string | number
  currency: string
}) {
  return (
    <Flex justify="space-between" gap={4} mt={3}>
      <Text fontSize="sm" color={MUTED}>
        {label}
      </Text>

      <Text fontSize="sm" fontWeight="600">
        {money(value, currency)}
      </Text>
    </Flex>
  )
}