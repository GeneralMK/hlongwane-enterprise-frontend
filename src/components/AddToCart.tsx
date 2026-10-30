import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Flex,
  Input,
  Text,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import { ShoppingCart } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import { Link, useNavigate } from 'react-router-dom'

import AuthModal from './AuthModal'
import { useAuthContext } from '../context'
import { useCart } from '../context/CartContext'

interface Props {
  variantId?: string
  available: number
  productName: string
}

interface CheckoutIntent {
  variantId: string
  quantity: number
}

export default function AddToCart(props: Props) {
  return (
    <CartControls
      key={props.variantId || 'unavailable'}
      {...props}
    />
  )
}

function CartControls({
  variantId,
  available,
  productName
}: Props) {
  const navigate = useNavigate()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const {
    token,
    isAuthenticated,
    isAuthenticating
  } = useAuthContext()

  const { addItem, updating } = useCart()

  const [quantity, setQuantity] = useState('1')
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resumeCheckout, setResumeCheckout] = useState(false)

  const mounted = useRef(false)
  const locked = useRef(false)
  const intent = useRef<CheckoutIntent | null>(null)
  const authenticationSucceeded = useRef(false)

  const tokenRef = useRef(token)
  tokenRef.current = token

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])

  const stock = Number.isFinite(available)
    ? Math.max(0, Math.floor(available))
    : 0

  const count = Number(quantity)

  const validQuantity =
    quantity.trim() !== '' &&
    Number.isSafeInteger(count) &&
    count >= 1 &&
    count <= stock

  const submitItem = useCallback(
    async (
      selectedVariantId: string,
      selectedQuantity: number,
      goToCheckout: boolean
    ) => {
      if (locked.current || !token) return

      const requestToken = token

      locked.current = true
      setAdding(true)
      setAdded(false)
      setError(null)

      try {
        await addItem(selectedVariantId, selectedQuantity)

        if (
          !mounted.current ||
          tokenRef.current !== requestToken
        ) {
          return
        }

        if (goToCheckout) {
          navigate('/checkout')
        } else {
          setAdded(true)

          toast({
            title: 'Added to cart',
            description: `${selectedQuantity} × ${productName}`,
            status: 'success',
            duration: 4000,
            isClosable: true
          })
        }
      } catch (error) {
        if (
          mounted.current &&
          tokenRef.current === requestToken
        ) {
          setError(
            error instanceof Error
              ? error.message
              : 'Unable to add this product to your cart.'
          )
        }
      } finally {
        locked.current = false

        if (mounted.current) {
          setAdding(false)
        }
      }
    },
    [token, addItem, navigate, toast, productName]
  )

  useEffect(() => {
    if (
      !resumeCheckout ||
      isAuthenticating ||
      !isAuthenticated ||
      !token ||
      locked.current
    ) {
      return
    }

    const pending = intent.current

    // Consume the intent once, before starting the request.
    intent.current = null
    authenticationSucceeded.current = false
    setResumeCheckout(false)

    if (!pending) return

    if (
      pending.variantId !== variantId ||
      pending.quantity < 1 ||
      pending.quantity > stock
    ) {
      setError(
        'The selected quantity is no longer available. Please check your selection.'
      )
      return
    }

    void submitItem(
      pending.variantId,
      pending.quantity,
      true
    )
  }, [
    resumeCheckout,
    isAuthenticating,
    isAuthenticated,
    token,
    variantId,
    stock,
    submitItem
  ])

  function handleAdd() {
    if (
      locked.current ||
      isAuthenticating ||
      updating ||
      !variantId ||
      stock === 0
    ) {
      return
    }

    if (!validQuantity) {
      setError(`Enter a quantity between 1 and ${stock}.`)
      return
    }

    setError(null)
    setAdded(false)

    if (!isAuthenticated || !token) {
      intent.current = {
        variantId,
        quantity: count
      }

      authenticationSucceeded.current = false
      setResumeCheckout(false)
      onOpen()
      return
    }

    // Already signed in: retain the normal Add to Cart behaviour.
    void submitItem(variantId, count, false)
  }

  function handleAuthenticated() {
    authenticationSucceeded.current = true
    setResumeCheckout(true)
  }

  function handleModalClose() {
    // Successful authentication preserves the pending checkout.
    // Closing without authenticating cancels it.
    if (!authenticationSucceeded.current) {
      intent.current = null
      setResumeCheckout(false)
    }

    onClose()
  }

  return (
    <>
      <Box mt={6}>
        <Text
          as="label"
          htmlFor="cart-quantity"
          fontSize="sm"
          fontWeight="700"
          color="#07132b"
        >
          Quantity
        </Text>

        <Flex
          mt={2}
          gap={3}
          direction={{ base: 'column', sm: 'row' }}
        >
          <Input
            id="cart-quantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={Math.max(1, stock)}
            step={1}
            value={quantity}
            onChange={(event) => {
              setQuantity(event.target.value)
              setError(null)
              setAdded(false)
            }}
            isDisabled={
              adding ||
              resumeCheckout ||
              updating ||
              isOpen ||
              !variantId ||
              stock === 0
            }
            w={{ base: 'full', sm: '100px' }}
            h="48px"
            bg="white"
            borderColor="#e3eaf3"
            borderRadius="10px"
            focusBorderColor="#008fff"
          />

          <Button
            type="button"
            flex={1}
            h="48px"
            bg="#008fff"
            color="white"
            borderRadius="10px"
            leftIcon={<ShoppingCart size={19} />}
            isLoading={
              adding ||
              resumeCheckout ||
              isAuthenticating
            }
            loadingText={
              isAuthenticating
                ? 'Checking session'
                : 'Adding...'
            }
            isDisabled={
              updating ||
              !variantId ||
              stock === 0 ||
              !validQuantity
            }
            onClick={handleAdd}
            _hover={{ bg: '#007ada' }}
          >
            {!variantId
              ? 'Unavailable'
              : stock === 0
                ? 'Out of stock'
                : 'Add to Cart'}
          </Button>
        </Flex>

        {error && (
          <Alert status="error" mt={4} borderRadius="10px">
            <AlertIcon />
            <Text fontSize="sm">{error}</Text>
          </Alert>
        )}

        {added && (
          <Flex
            role="status"
            mt={4}
            p={4}
            gap={3}
            align="center"
            justify="space-between"
            flexWrap="wrap"
            bg="#eaf6ff"
            borderRadius="10px"
          >
            <Text fontSize="sm" color="#07132b">
              Product added to your cart.
            </Text>

            <Button
              as={Link}
              to="/cart"
              size="sm"
              variant="outline"
              color="#008fff"
              borderColor="#008fff"
            >
              View Cart
            </Button>
          </Flex>
        )}
      </Box>

      <AuthModal
        isOpen={isOpen}
        onClose={handleModalClose}
        onAuthenticated={handleAuthenticated}
        initialView="sign-in"
        redirectToDashboard={false}
      />
    </>
  )
}