export type RevenueTrendItem = {
  key: string
  label: string
  revenue: number
  purchaseRevenue: number
  rentalRevenue: number
  consultationRevenue: number
}

export type OrdersByMonthItem = {
  key: string
  label: string
  orders: number
}

export type RevenueBreakdownItem = {
  purpose:
    | 'PURCHASE'
    | 'RENTAL'
    | 'CONSULTATION_BOOKING'
  label: string
  transactions: number
  revenue: number
  percentage: number
}

export type CategorySalesItem = {
  category: string
  quantity: number
  revenue: number
}

export type TopProductItem = {
  productId: string
  productName: string
  category: string
  quantity: number
  revenue: number
}

export type RentalInsightItem = {
  productId: string
  productName: string
  rentals: number
  quantity: number
  revenue: number
}

export type ConsultationInsightItem = {
  consultationType: string
  label: string
  bookings: number
  revenue: number
}



export type SalesRevenueAnalytics = {
  period: {
    from: string
    to: string
  }

  currency: string

  totalRevenue: number
  totalOrders: number
  averageOrderValue: number

  purchaseRevenue: number
  rentalRevenue: number
  consultationRevenue: number

  purchaseTransactions: number
  rentalTransactions: number
  consultationBookings: number

  revenueGrowthPercentage: number | null
  orderGrowthPercentage: number | null
  averageOrderValueGrowthPercentage:
    | number
    | null

  revenueTrend: RevenueTrendItem[]

  ordersByMonth: Array<{
    key: string
    label: string
    orders: number
  }>

  revenueBreakdown:
    RevenueBreakdownItem[]

  salesByCategory: Array<{
    category: string
    quantity: number
    revenue: number
  }>

  topProducts:
    TopProductItem[]

  topRentals:
    RentalInsightItem[]

  consultationInsights:
    ConsultationInsightItem[]

  generatedAt: string
}

export type SalesRevenueApiResponse = {
  success: boolean
  data?: SalesRevenueAnalytics
  code?: string
  message?: string
}

