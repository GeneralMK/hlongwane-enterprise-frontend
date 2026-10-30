import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Text
} from '@chakra-ui/react'
import { FaWhatsapp } from 'react-icons/fa'

import { useAuthContext } from '../context'

export interface WhatsAppOrder {
  id: string
  orderNumber: string
  status: string
  currency: string
  subtotal: string
  discountTotal: string
  deliveryFee: string
  taxTotal: string
  total: string
  deliveryAddress?: Record<string, unknown> | null
  notes?: string | null
  items: Array<{
    id: string
    productNameSnapshot: string
    skuSnapshot?: string
    quantity: number
    lineTotal: string
  }>
}

function formatMoney(value: string, currency: string): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency
  }).format(Number(value))
}

function addressValue(
  address: Record<string, unknown>,
  field: string
): string {
  const value = address[field]

  return typeof value === 'string' ? value.trim() : ''
}

export default function RequestOrderWhatsApp({
  order
}: {
  order: WhatsAppOrder
}) {
  const { user } = useAuthContext()

  const phone = (
    import.meta.env.VITE_BUSINESS_WHATSAPP_NUMBER || ''
  )
    .trim()
    .replace(/[\s()+-]/g, '')

  const configured = /^[1-9]\d{7,14}$/.test(phone)

  const address = order.deliveryAddress || {}

  const customerName =
    addressValue(address, 'recipientName') ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ')

  const customerPhone =
    addressValue(address, 'phoneNumber') ||
    user?.phone ||
    ''

  const deliveryLines = [
    addressValue(address, 'addressLine1'),
    addressValue(address, 'addressLine2'),
    addressValue(address, 'city'),
    addressValue(address, 'province'),
    addressValue(address, 'postalCode'),
    addressValue(address, 'country')
  ].filter(Boolean)

  const itemLines = order.items.map((item, index) =>
    [
      `${index + 1}. ${item.productNameSnapshot}`,
      item.skuSnapshot ? `SKU: ${item.skuSnapshot}` : '',
      `Quantity: ${item.quantity}`,
      `Line total: ${formatMoney(item.lineTotal, order.currency)}`
    ]
      .filter(Boolean)
      .join('\n')
  )

  const message = [
    'Hello DLinkUp, I would like to request this order.',
    '',
    `Order reference: ${order.orderNumber}`,
    '',
    'CUSTOMER DETAILS',
    `Name: ${customerName || 'Not provided'}`,
    `Email: ${user?.email || 'Not provided'}`,
    `Phone: ${customerPhone || 'Not provided'}`,
    '',
    'PRODUCTS',
    itemLines.join('\n\n'),
    '',
    'ORDER SUMMARY',
    `Subtotal: ${formatMoney(order.subtotal, order.currency)}`,
    `Discount: ${formatMoney(order.discountTotal, order.currency)}`,
    `Recorded delivery fee: ${formatMoney(order.deliveryFee, order.currency)}`,
    `Recorded tax: ${formatMoney(order.taxTotal, order.currency)}`,
    `Recorded order total: ${formatMoney(order.total, order.currency)}`,
    '',
    'DELIVERY ADDRESS',
    deliveryLines.length
      ? deliveryLines.join('\n')
      : 'To be confirmed',
    ...(order.notes?.trim()
      ? ['', 'DELIVERY NOTES', order.notes.trim()]
      : []),
    '',
    'Please confirm availability, final pricing, delivery costs and payment arrangements.',
    'No online payment has been made.'
  ].join('\n')

  const href = configured
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : ''

  if (order.status !== 'PENDING_PAYMENT') {
    return (
      <Box mt={6}>
        <Text color="#7183a0" fontSize="sm">
          This order is no longer awaiting a payment arrangement.
          View its latest status in your dashboard.
        </Text>
      </Box>
    )
  }

  if (!configured) {
    return (
      <Alert status="warning" mt={6} borderRadius="12px">
        <AlertIcon />
        <Text fontSize="sm">
          WhatsApp requests are temporarily unavailable. Please contact
          the business and quote order {order.orderNumber}.
        </Text>
      </Alert>
    )
  }

  return (
    <Box mt={6}>
      <Text color="#7183a0" fontSize="sm" lineHeight="1.8">
        Contact our team to confirm this order and arrange payment.
      </Text>

      <Button
        as="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        mt={5}
        w="full"
        h="52px"
        bg="#008fff"
        color="white"
        borderRadius="10px"
        leftIcon={<FaWhatsapp size={21} />}
        _hover={{
          bg: '#007ada',
          textDecoration: 'none'
        }}
      >
        Request via WhatsApp
      </Button>

      <Text mt={3} color="#7183a0" fontSize="xs" lineHeight="1.8">
        WhatsApp will open with your order and delivery details.
        Press Send to submit your request to our team.
      </Text>
    </Box>
  )
}