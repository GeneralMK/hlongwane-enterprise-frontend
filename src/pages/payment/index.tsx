import { Center, Spinner, Text, VStack } from '@chakra-ui/react'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

/**
 * Compatibility route for the old `/payment` page.
 * Backyard Developmentz no longer initializes Paystack consultation payments.
 * PayFast checkout starts on `/checkout` and returns to `/payment/callback`.
 */
export default function PaymentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const reference = searchParams.get('reference')?.trim()
    const status = searchParams.get('status')?.trim()
    const destination = new URLSearchParams()

    if (reference) destination.set('reference', reference)
    if (status) destination.set('status', status)

    navigate(
      reference || status
        ? `/payment/callback?${destination.toString()}`
        : '/checkout',
      { replace: true }
    )
  }, [navigate, searchParams])

  return (
    <Center minH="100vh" bg="#080909" color="#f4f4f5">
      <VStack spacing={4}>
        <Spinner color="#ef3347" thickness="3px" />
        <Text
          fontFamily="'Roboto Condensed', 'Arial Narrow', sans-serif"
          fontSize="12px"
          fontWeight="800"
          letterSpacing="0.16em"
          textTransform="uppercase"
        >
          Opening secure checkout
        </Text>
      </VStack>
    </Center>
  )
}