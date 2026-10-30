import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Center,
  Container,
  Spinner,
  Text,
  VStack
} from '@chakra-ui/react'
import { CheckCircle2, CircleX, Clock3 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { useCart } from '../../context/CartContext'
import { fetchJwt } from '../../utils'

type ViewStatus = 'verifying' | 'success' | 'pending' | 'cancelled' | 'failed'
type PaymentStatusResult = {
  reference: string
  paid: boolean
  status: string
  itemTransactionId?: string | null
  orderId?: string | null
  orderNumber?: string | null
}

const ACCENT = '#ef3347'
const BACKGROUND = '#080909'
const PANEL = '#121313'
const BORDER = '#292a2d'
const TEXT = '#f4f4f5'
const MUTED = '#858a93'
const LABEL_FONT = "'Roboto Condensed', 'Arial Narrow', sans-serif"

const REST_API_URL = String(
  import.meta.env.VITE_APP_API_HOST ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:4000'
).replace(/\/+$/, '')

function getStoredReference(): string {
  try {
    const value = window.sessionStorage.getItem('backyard-active-payment')
    if (!value) return ''
    return String((JSON.parse(value) as { reference?: string }).reference || '').trim()
  } catch {
    return ''
  }
}

async function getPaymentStatus(reference: string): Promise<PaymentStatusResult> {
  const token = fetchJwt()
  if (!token) throw new Error('Your session has expired. Please sign in and try again.')

  const response = await fetch(
    `${REST_API_URL}/payments/payfast/status/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const responseText = await response.text()
  let payload: { message?: string; data?: PaymentStatusResult } = {}

  if (responseText.trim()) {
    try {
      payload = JSON.parse(responseText) as typeof payload
    } catch {
      throw new Error(
        response.ok
          ? 'The payment service returned an invalid response.'
          : responseText.slice(0, 240)
      )
    }
  }
  if (!response.ok || !payload.data) {
    throw new Error(payload.message || 'Unable to check the payment status.')
  }
  return payload.data
}

export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams()
  const { clearCart } = useCart()
  const reference = searchParams.get('reference')?.trim() || getStoredReference()
  const returnedStatus = searchParams.get('status')?.trim().toLowerCase()
  const [status, setStatus] = useState<ViewStatus>(
    returnedStatus === 'cancelled' ? 'cancelled' : 'verifying'
  )
  const [message, setMessage] = useState('Confirming your payment with PayFast…')
  const attempts = useRef(0)

  const verify = useCallback(async () => {
    if (!reference) {
      setStatus('failed')
      setMessage('The PayFast payment reference is missing.')
      return
    }

    try {
      const result = await getPaymentStatus(reference)
      if (result.paid) {
        clearCart()
        window.sessionStorage.removeItem('backyard-active-payment')
        setStatus('success')
        setMessage(
          result.orderNumber
            ? `Payment confirmed. Your order number is ${result.orderNumber}.`
            : 'Payment confirmed successfully.'
        )
        return
      }

      attempts.current += 1
      if (attempts.current < 10 && ['PENDING', 'PROCESSING'].includes(result.status.toUpperCase())) {
        setStatus('pending')
        setMessage('PayFast is still confirming your payment. This may take a few seconds.')
        window.setTimeout(() => void verify(), 2000)
        return
      }

      setStatus('failed')
      setMessage('The payment has not been confirmed. No order has been completed.')
    } catch (error) {
      setStatus('failed')
      setMessage(error instanceof Error ? error.message : 'Unable to verify the payment.')
    }
  }, [clearCart, reference])

  useEffect(() => {
    if (returnedStatus !== 'cancelled') void verify()
  }, [returnedStatus, verify])

  const icon =
    status === 'success' ? CheckCircle2 :
      status === 'cancelled' || status === 'failed' ? CircleX : Clock3
  const iconColor = status === 'success' ? '#22c96b' : status === 'failed' || status === 'cancelled' ? ACCENT : '#ff8500'

  return (
    <Center minH="100vh" bg={BACKGROUND} px={4}>
      <Container maxW="560px">
        <Box border="1px solid" borderColor={BORDER} borderRadius="6px" bg={PANEL} p={{ base: 6, md: 10 }} textAlign="center">
          <VStack spacing={6}>
            {status === 'verifying' ? (
              <Spinner size="xl" color={ACCENT} thickness="4px" />
            ) : (
              <Box as={icon} boxSize="64px" color={iconColor} />
            )}

            <Box>
              <Text color={TEXT} fontFamily={LABEL_FONT} fontSize="24px" fontWeight="900" textTransform="uppercase">
                {status === 'success' ? 'Payment successful' :
                  status === 'cancelled' ? 'Payment cancelled' :
                    status === 'failed' ? 'Payment not confirmed' : 'Confirming payment'}
              </Text>
              <Text mt={3} color={MUTED} lineHeight="1.8">{message}</Text>
            </Box>

            {status === 'failed' && (
              <Alert status="error" borderRadius="4px" bg="rgba(239,51,71,0.08)" color={TEXT} textAlign="left">
                <AlertIcon />
                <AlertDescription>Do not make another payment if money was deducted. Contact support with reference {reference}.</AlertDescription>
              </Alert>
            )}

            <Button as={Link} to={status === 'success' ? '/account/orders' : '/checkout'} w="100%" h="48px" borderRadius="4px" bg={ACCENT} color="white" fontFamily={LABEL_FONT} fontWeight="900" letterSpacing="0.1em" textTransform="uppercase" _hover={{ bg: '#d92d3f' }}>
              {status === 'success' ? 'View orders' : 'Return to checkout'}
            </Button>
          </VStack>
        </Box>
      </Container>
    </Center>
  )
}
