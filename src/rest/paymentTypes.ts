export type PaymentProvider =
  | 'PAYSTACK'
  | 'PAYFAST'
  | 'OZOW'
  | 'PEACH_PAYMENTS'
  | 'PAYFLEX'
  | 'MOBICRED'

export type PaymentStatus =
  | 'INITIALIZED'
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'

export type RefundStatus =
  | 'REQUESTED'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'

export interface Payment {
  id: string
  orderId: string
  provider: PaymentProvider
  status: PaymentStatus
  reference: string
  providerReference: string | null
  amount: string
  currency: string
  checkoutUrl: string | null
  failureCode: string | null
  failureMessage: string | null
  verifiedAt: string | null
  paidAt: string | null
  metadata: unknown
  createdAt: string
  updatedAt: string
}

export interface PaymentEvent {
  id: string
  paymentId: string
  providerEventId: string | null
  idempotencyKey: string
  eventType: string
  signatureValid: boolean
  payload: unknown
  processedAt: string | null
  createdAt: string
}

export interface Refund {
  id: string
  orderId: string
  paymentId: string
  status: RefundStatus
  amount: string
  reason: string | null
  providerReference: string | null
  processedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PaymentDetails extends Payment {
  events: PaymentEvent[]
  refunds: Refund[]
}

export interface InitializePaymentInput {
  orderId: string
  provider: PaymentProvider
  callbackUrl?: string
}

export interface RefundPaymentInput {
  amount: string
  reason?: string
}