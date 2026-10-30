import {
  EnumOrderStatus,
  EnumRentalStatus,
  EnumReviewStatus,
  type MyRentalsQuery
} from '../../generated/graphql'
import images from '../../theme/images'

export function formatCurrency(
  value:
    | number
    | string
    | null
    | undefined
) {
  const amount =
    Number(
      value ?? 0
    )

  return new Intl.NumberFormat(
    'en-ZA',
    {
      style:
        'currency',

      currency:
        'ZAR',

      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2
    }
  ).format(
    Number.isFinite(
      amount
    )
      ? amount
      : 0
  )
}
export function formatDate(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return '-'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '-'
  }

  return new Intl.DateTimeFormat(
    'en-ZA',
    {
      year:
        'numeric',

      month:
        'short',

      day:
        '2-digit'
    }
  ).format(date)
}
export function formatStatus(
  value:
    | string
    | null
    | undefined
) {
  return (
    value
      ?.toLowerCase()
      .split('_')
      .map(
        word =>
          word
            .charAt(0)
            .toUpperCase() +
          word.slice(1)
      )
      .join(' ') ??
    'Unknown'
  )
}
export function getInitials(
  fullName:
    | string
    | null
    | undefined,

  email:
    | string
    | null
    | undefined
) {
  const source =
    fullName?.trim() ||
    email?.trim() ||
    'User'

  return source
    .split(/\s+/)
    .slice(
      0,
      2
    )
    .map(
      part =>
        part.charAt(0)
          .toUpperCase()
    )
    .join('')
}
export function getOrderStatusColor(
  status:
    EnumOrderStatus
) {
  switch (status) {
    case EnumOrderStatus.Completed:
      return 'green'

    case EnumOrderStatus.Processing:
      return 'blue'

    case EnumOrderStatus.ReadyForPickup:
      return 'purple'

    case EnumOrderStatus.Cancelled:
      return 'red'

    case EnumOrderStatus.Pending:
    default:
      return 'yellow'
  }
}
export function getRentalStatusColor(
  status:
    EnumRentalStatus
) {
  switch (status) {
    case EnumRentalStatus.Active:
      return 'blue'

    case EnumRentalStatus.Upcoming:
      return 'purple'

    case EnumRentalStatus.Overdue:
      return 'red'

    case EnumRentalStatus.Completed:
      return 'green'

    case EnumRentalStatus.Cancelled:
      return 'gray'

    default:
      return 'gray'
  }
}
export function getReviewStatusColor(
  status:
    EnumReviewStatus
) {
  switch (status) {
    case EnumReviewStatus.Approved:
      return 'green'

    case EnumReviewStatus.Rejected:
      return 'red'

    case EnumReviewStatus.Pending:
    default:
      return 'yellow'
  }
}
export function getDaysRemaining(
  endDate: string
) {
  const end =
    new Date(endDate)

  if (
    Number.isNaN(
      end.getTime()
    )
  ) {
    return null
  }

  return Math.max(
    0,
    Math.ceil(
      (
        end.getTime() -
        Date.now()
      ) /
        (
          1000 *
          60 *
          60 *
          24
        )
    )
  )
}
export function normaliseImage(
  imageUrl?:
    | string
    | null
) {
  return (
    imageUrl ||
    images.blueTractor
  )
}

export type ExistingReview = {
  id: string
  rating: number
  comment?: string | null
  status: EnumReviewStatus
}

export type ReviewItemInput = {
  id: string
  name: string
  imageUrl?: string | null
  existingReview?: ExistingReview | null
}

export type ReviewableItem = {
  itemId: string
  itemName: string
  imageUrl?: string | null
  existingReview?: ExistingReview | null
}

/*
 * Supports a paginated MyRentals query:
 *
 * myRentals {
 *   items { ... }
 * }
 */
type PaginatedRentals =
  NonNullable<
    MyRentalsQuery['myRentals']
  >

type PaginatedRentalItem =
  PaginatedRentals extends {
    items?: infer Items
  }
    ? NonNullable<Items> extends readonly (
        infer Rental
      )[]
      ? Rental
      : never
    : never

/*
 * Fallback for a direct-array MyRentals query:
 *
 * myRentals { ...rental fields }
 */
type DirectRentalItem =
  PaginatedRentals extends readonly (
    infer Rental
  )[]
    ? Rental
    : never

export type AccountRental =
  [PaginatedRentalItem] extends [never]
    ? DirectRentalItem
    : PaginatedRentalItem

export type ReviewMap =
  Map<
    string,
    ExistingReview
  >