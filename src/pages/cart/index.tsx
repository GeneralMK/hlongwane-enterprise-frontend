import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Image,
  Skeleton,
  Text,
  VStack,
  useToast
} from '@chakra-ui/react'
import {
  ArrowLeft,
  ArrowRight,
  ImageOff,
  Minus,
  Plus,
  ShoppingCart,
  Trash2
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuthContext } from '../../context'
import {
  useCart,
  type CartItem
} from '../../context/CartContext'
import WebsiteLayout from '../../layout/WebsiteLayout'

const BLUE = '#008fff'
const NAVY = '#07132b'
const MUTED = '#7183a0'
const BORDER = '#e3eaf3'

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency
  }).format(amount)
}

function getImage(item: CartItem): string | null {
  const images = [...(item.variant.product.images || [])].sort(
    (a, b) =>
      Number(b.isPrimary) - Number(a.isPrimary) ||
      a.position - b.position
  )

  const base = import.meta.env.VITE_SPACES_PUBLIC_URL
    ?.trim()
    .replace(/\/+$/, '')

  for (const image of images) {
    const value = (
      image.fileUpload?.publicUrl ||
      image.fileUpload?.path
    )?.trim()

    if (!value) continue

    if (/^https?:\/\//i.test(value)) return value

    if (base) {
      return `${base}/${value.replace(/^\/+/, '')}`
    }
  }

  return null
}

function ImagePlaceholder() {
  return (
    <Flex
      w="full"
      h="full"
      align="center"
      justify="center"
      bg="#f7f9fc"
      color={MUTED}
    >
      <ImageOff size={26} />
    </Flex>
  )
}

function CartItemCard({
  item,
  currency,
  disabled,
  onQuantity,
  onRemove
}: {
  item: CartItem
  currency: string
  disabled: boolean
  onQuantity: (quantity: number) => void
  onRemove: () => void
}) {
  const product = item.variant.product
  const image = getImage(item)

  const available = Math.max(
    0,
    (item.variant.inventory?.physicalQuantity ?? 0) -
      (item.variant.inventory?.reservedQuantity ?? 0)
  )

  const unavailable =
    !item.variant.isActive ||
    available === 0 ||
    item.quantity > available

  const unitPrice = Number(item.unitPriceSnapshot)
  const lineTotal = unitPrice * item.quantity

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor={BORDER}
      borderRadius="16px"
      p={{ base: 4, md: 5 }}
    >
      <Flex gap={{ base: 4, md: 5 }} align="flex-start">
        <Box
          as={Link}
          to={`/shop/${encodeURIComponent(product.id)}`}
          boxSize={{ base: '85px', md: '120px' }}
          flexShrink={0}
          borderRadius="10px"
          overflow="hidden"
        >
          {image ? (
            <Image
              src={image}
              alt={product.name}
              w="full"
              h="full"
              objectFit="contain"
              fallback={<ImagePlaceholder />}
            />
          ) : (
            <ImagePlaceholder />
          )}
        </Box>

        <Box flex={1} minW={0}>
          <Flex justify="space-between" gap={3}>
            <Box>
              <Text
                as={Link}
                to={`/shop/${encodeURIComponent(product.id)}`}
                fontSize={{ base: 'md', md: 'lg' }}
                fontWeight="700"
                noOfLines={2}
                _hover={{ color: BLUE }}
              >
                {product.name}
              </Text>

              <Text
                mt={1}
                color={MUTED}
                fontSize="xs"
                overflowWrap="anywhere"
              >
                SKU: {item.variant.sku}
              </Text>
            </Box>

            <IconButton
              aria-label={`Remove ${product.name}`}
              icon={<Trash2 size={18} />}
              size="sm"
              variant="ghost"
              color="red.500"
              isDisabled={disabled}
              onClick={onRemove}
            />
          </Flex>

          <Text mt={3} color={MUTED} fontSize="sm">
            {formatMoney(unitPrice, currency)} each
          </Text>

          {unavailable && (
            <Text mt={2} color="red.600" fontSize="sm">
              {!item.variant.isActive || available === 0
                ? 'This option is currently unavailable. Remove it to continue.'
                : `Only ${available} available. Reduce your quantity to continue.`}
            </Text>
          )}

          <Flex
            mt={4}
            gap={4}
            justify="space-between"
            align="center"
            flexWrap="wrap"
          >
            <HStack spacing={3}>
              <IconButton
                aria-label={`Decrease ${product.name} quantity`}
                icon={<Minus size={15} />}
                size="sm"
                variant="outline"
                borderColor={BORDER}
                isDisabled={disabled || item.quantity <= 1}
                onClick={() => onQuantity(item.quantity - 1)}
              />

              <Text
                minW="24px"
                textAlign="center"
                fontWeight="700"
                aria-live="polite"
              >
                {item.quantity}
              </Text>

              <IconButton
                aria-label={`Increase ${product.name} quantity`}
                icon={<Plus size={15} />}
                size="sm"
                variant="outline"
                borderColor={BORDER}
                isDisabled={
                  disabled ||
                  !item.variant.isActive ||
                  item.quantity >= available
                }
                onClick={() => onQuantity(item.quantity + 1)}
              />
            </HStack>

            <Text fontWeight="800" fontSize="lg">
              {formatMoney(lineTotal, currency)}
            </Text>
          </Flex>
        </Box>
      </Flex>
    </Box>
  )
}

export default function CartPage() {
  const toast = useToast()
  const { isAuthenticated, isAuthenticating } = useAuthContext()

  const {
    cart,
    items,
    itemCount,
    subtotal,
    loading,
    updating,
    error,
    refreshCart,
    updateQuantity,
    removeItem
  } = useCart()

  const [actionPending, setActionPending] = useState(false)

  const currency = cart?.currency || 'ZAR'
  const busy = updating || actionPending || loading

  const hasUnavailableItems = items.some((item) => {
    const available =
      (item.variant.inventory?.physicalQuantity ?? 0) -
      (item.variant.inventory?.reservedQuantity ?? 0)

    return !item.variant.isActive || item.quantity > available
  })

  async function changeQuantity(item: CartItem, quantity: number) {
    if (busy) return

    setActionPending(true)

    try {
      await updateQuantity(item.id, quantity)
    } catch (error) {
      toast({
        title: 'Cart could not be updated',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        status: 'error',
        duration: 4000,
        isClosable: true
      })
    } finally {
      setActionPending(false)
    }
  }

  async function handleRemove(item: CartItem) {
    if (busy) return

    setActionPending(true)

    try {
      await removeItem(item.id)

      toast({
        title: 'Item removed',
        description: item.variant.product.name,
        status: 'info',
        duration: 3000,
        isClosable: true
      })
    } catch (error) {
      toast({
        title: 'Item could not be removed',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        status: 'error',
        duration: 4000,
        isClosable: true
      })
    } finally {
      setActionPending(false)
    }
  }

  return (
    <WebsiteLayout>
      <Box
        minH="75vh"
        bg="#f7f9fc"
        color={NAVY}
        fontFamily="Arial, Helvetica, sans-serif"
      >
        <Container
          maxW="1320px"
          px={{ base: 5, md: 8 }}
          py={{ base: 8, md: 12 }}
        >
          <Button
            as={Link}
            to="/shop"
            variant="link"
            color={BLUE}
            leftIcon={<ArrowLeft size={17} />}
            mb={6}
          >
            Continue shopping
          </Button>

          <Heading
            as="h1"
            fontSize={{ base: '30px', md: '42px' }}
            letterSpacing="-0.04em"
          >
            Shopping Cart
          </Heading>

          {isAuthenticated && cart && (
            <Text mt={2} color={MUTED}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
            </Text>
          )}

          {isAuthenticating || (loading && !cart) ? (
            <Grid
              mt={8}
              templateColumns={{ base: '1fr', lg: '2fr 1fr' }}
              gap={6}
            >
              <VStack align="stretch" spacing={5}>
                <Skeleton h="180px" borderRadius="16px" />
                <Skeleton h="180px" borderRadius="16px" />
              </VStack>

              <Skeleton h="300px" borderRadius="16px" />
            </Grid>
          ) : !isAuthenticated ? (
            <EmptyState
              title="Sign in to view your cart"
              message="Your saved products will appear here once you sign in."
              buttonLabel="Sign in"
              to="/login"
            />
          ) : (
            <>
              {error && (
                <Alert
                  status="error"
                  mt={6}
                  borderRadius="12px"
                  gap={3}
                  flexWrap="wrap"
                >
                  <AlertIcon />
                  <Text flex={1}>{error}</Text>

                  <Button
                    size="sm"
                    isDisabled={busy}
                    onClick={() => void refreshCart()}
                  >
                    Retry
                  </Button>
                </Alert>
              )}

              {items.length === 0 ? (
                !error && (
                  <EmptyState
                    title="Your cart is empty"
                    message="Discover devices, consoles and accessories, then add your favourites to your cart."
                    buttonLabel="Browse products"
                    to="/shop"
                  />
                )
              ) : (
                <Grid
                  mt={8}
                  templateColumns={{
                    base: '1fr',
                    lg: 'minmax(0, 1.7fr) minmax(300px, 0.9fr)'
                  }}
                  gap={7}
                  alignItems="start"
                >
                  <VStack align="stretch" spacing={5}>
                    {items.map((item) => (
                      <CartItemCard
                        key={item.id}
                        item={item}
                        currency={currency}
                        disabled={busy}
                        onQuantity={(quantity) =>
                          void changeQuantity(item, quantity)
                        }
                        onRemove={() => void handleRemove(item)}
                      />
                    ))}
                  </VStack>

                  <Box
                    bg="white"
                    border="1px solid"
                    borderColor={BORDER}
                    borderRadius="16px"
                    p={6}
                  >
                    <Heading as="h2" size="md">
                      Order summary
                    </Heading>

                    <Flex mt={6} justify="space-between" gap={4}>
                      <Text color={MUTED}>Items ({itemCount})</Text>
                      <Text fontWeight="700">
                        {formatMoney(subtotal, currency)}
                      </Text>
                    </Flex>

                    <Divider my={5} borderColor={BORDER} />

                    <Flex justify="space-between" align="center" gap={4}>
                      <Text fontWeight="700">Subtotal</Text>
                      <Text fontSize="2xl" fontWeight="800">
                        {formatMoney(subtotal, currency)}
                      </Text>
                    </Flex>

                    <Text mt={3} color={MUTED} fontSize="sm" lineHeight="1.7">
                      Final pricing, delivery and any applicable adjustments
                      are confirmed at checkout.
                    </Text>

                    {hasUnavailableItems && (
                      <Text mt={4} color="red.600" fontSize="sm">
                        Update or remove unavailable items before checkout.
                      </Text>
                    )}

                    <Button
                      as={Link}
                      to="/checkout"
                      mt={6}
                      w="full"
                      h="50px"
                      bg={BLUE}
                      color="white"
                      borderRadius="10px"
                      rightIcon={<ArrowRight size={18} />}
                      isDisabled={busy || Boolean(error) || hasUnavailableItems}
                      onClick={(event) => {
                        if (busy || error || hasUnavailableItems) {
                          event.preventDefault()
                        }
                      }}
                      _hover={{ bg: '#007ada', textDecoration: 'none' }}
                    >
                      Proceed to Checkout
                    </Button>

                    <Text mt={4} color={MUTED} fontSize="xs" lineHeight="1.7">
                      Items in your cart are not reserved. Availability is
                      checked again at checkout.
                    </Text>
                  </Box>
                </Grid>
              )}
            </>
          )}
        </Container>
      </Box>
    </WebsiteLayout>
  )
}

function EmptyState({
  title,
  message,
  buttonLabel,
  to
}: {
  title: string
  message: string
  buttonLabel: string
  to: string
}) {
  return (
    <Box
      role="status"
      mt={8}
      bg="white"
      border="1px solid"
      borderColor={BORDER}
      borderRadius="16px"
      px={6}
      py={16}
      textAlign="center"
    >
      <Flex
        mx="auto"
        boxSize="80px"
        bg="#eaf6ff"
        color={BLUE}
        borderRadius="full"
        align="center"
        justify="center"
      >
        <ShoppingCart size={34} />
      </Flex>

      <Heading mt={5} size="md">
        {title}
      </Heading>

      <Text mt={3} maxW="420px" mx="auto" color={MUTED} lineHeight="1.8">
        {message}
      </Text>

      <Button
        as={Link}
        to={to}
        mt={6}
        bg={BLUE}
        color="white"
        borderRadius="10px"
        _hover={{ bg: '#007ada', textDecoration: 'none' }}
      >
        {buttonLabel}
      </Button>
    </Box>
  )
}