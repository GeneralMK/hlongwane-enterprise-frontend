export type RentalTrendItem = {
  key: string
  label: string
  rentals: number
}

export type RentalRevenueTrendItem = {
  key: string
  label: string
  revenue: number
}

export type EquipmentUtilizationItem = {
  itemId: string
  itemName: string
  category: string
  rentals: number
  rentedDays: number
  utilization: number
  revenue: number
}

export type RentalDurationItem = {
  key:
    | 'ONE_TO_THREE'
    | 'FOUR_TO_SEVEN'
    | 'EIGHT_PLUS'
  label: string
  count: number
  percentage: number
}

export type RentalStatusBreakdownItem = {
  status: string
  label: string
  count: number
  percentage: number
}

export type RentalInsightsAnalytics = {
  period: {
    from: string
    to: string
  }

  currency: string

  activeRentals: number
  rentalRevenue: number
  averageUtilization: number
  totalRentals: number
  overdueRentals: number
  completedRentals: number

  revenueGrowthPercentage:
    | number
    | null

  rentalGrowthPercentage:
    | number
    | null

  rentalTrend:
    RentalTrendItem[]

  revenueTrend:
    RentalRevenueTrendItem[]

  equipmentUtilization:
    EquipmentUtilizationItem[]

  popularDurations:
    RentalDurationItem[]

  statusBreakdown:
    RentalStatusBreakdownItem[]

  generatedAt: string
}

export type RentalInsightsApiResponse = {
  success: boolean
  data?: RentalInsightsAnalytics
  code?: string
  message?: string
}