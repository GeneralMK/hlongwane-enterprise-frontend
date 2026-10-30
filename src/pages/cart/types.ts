export type CartItem = {
  id: string
  productId: string
  name: string
  imageUrl?: string | null
  category: string
  transactionType: 'RENTAL' | 'PURCHASE'
  quantity: number
  unitPrice: number
  rentalStartDate?: string | null
  rentalEndDate?: string | null
}

export type CustomerProfile = {
  firstName: string
  lastName: string
  email: string
  phone: string
  businessName?: string
  streetAddress?: string
  city?: string
  province?: string
  postalCode?: string
}

export type DeliveryInformation = {
  firstName: string
  lastName: string
  businessName: string
  email: string
  phone: string
  streetAddress: string
  city: string
  province: string
  postalCode: string
  deliveryNotes: string
}

export type PaymentMethod =
  | 'CARD'
  | 'EFT'
  | 'CASH_ON_DELIVERY'

export type CheckoutOrder = {
  id: string
  orderNumber: string
  createdAt: string
  deliveryInformation: DeliveryInformation
  paymentMethod: PaymentMethod
  items: CartItem[]
  subtotal: number
  vat: number
  deliveryFee: number
  total: number
}