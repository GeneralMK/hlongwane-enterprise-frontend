import type {
  EnumOrderStatus,
  EnumRentalStatus,
  EnumReviewStatus,
  MyWishlistItemsQuery
} from '../../generated/graphql'

export type AccountTab =
  | 'orders'
  | 'rentals'
  | 'wishlist'
  | 'settings'
  | 'addresses'
  | 'payments'

/*
 * Reviews
 */

export type ExistingReview = {
  id: string
  rating: number
  comment?: string | null
  status: EnumReviewStatus
}

export type ReviewSummary = {
  id: string
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

export type ReviewMap =
  Map<
    string,
    ExistingReview
  >

/*
 * User profile
 *
 * SettingsSection or Sidebar can populate this from
 * a dedicated MyProfile query.
 */

export type AccountUser = {
  id: string
  email: string
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
  phoneNumber?: string | null
  businessName?: string | null
}

/*
 * Addresses
 *
 * AddressesSection can populate this from
 * useMyAddressesQuery.
 */

export type AccountAddress = {
  id: string
  createdAt?: string
  updatedAt?: string

  recipientName?: string | null
  phoneNumber?: string | null

  addressLine1: string
  addressLine2?: string | null

  city: string
  province: string
  postalCode: string
  country: string

  isDefault: boolean
}

export type AccountAddresses =
  AccountAddress[]

/*
 * Wishlist
 *
 * This type must be derived from the exact query used
 * by WishlistSection. This preserves required generated
 * fields such as createdAt.
 */

export type AccountWishlistItems =
  NonNullable<
    MyWishlistItemsQuery[
      'myWishlistItems'
    ]
  >

export type AccountWishlistItem =
  AccountWishlistItems[number]

export type ValidWishlistItem =
  AccountWishlistItem & {
    item: NonNullable<
      AccountWishlistItem[
        'item'
      ]
    >
  }

/*
 * Rentals
 *
 * Do not derive this through a conditional type.
 * The previous conditional resolved to never because
 * the generated query shape did not match its branches.
 */

export type AccountRentalItem = {
  id: string
  name: string
  imageUrl?: string | null
}

export type AccountRental = {
  id: string

  startDate: string
  endDate: string
  returnedAt?: string | null

  status: EnumRentalStatus

  dailyRate?: string | number | null
  deposit?: string | number | null
  totalAmount?: string | number | null

  item: AccountRentalItem
}

export type AccountRentals =
  AccountRental[]

/*
 * Orders
 *
 * This view model is independent from the removed
 * UserDashboard/MyAccount query.
 */

export type AccountOrderItemProduct = {
  id: string
  name: string
  imageUrl?: string | null
}

export type AccountOrderItem = {
  id: string
  quantity: number

  unitPrice:
    | string
    | number

  total:
    | string
    | number

  item:
    AccountOrderItemProduct
}

export type AccountOrder = {
  id: string
  orderNumber: string

  createdAt?: string
  updatedAt?: string
  orderDate: string

  status: EnumOrderStatus

  totalAmount:
    | string
    | number

  items:
    AccountOrderItem[]
}

export type AccountOrders =
  AccountOrder[]