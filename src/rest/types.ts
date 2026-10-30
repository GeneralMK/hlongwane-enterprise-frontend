import type { NotificationChannel, NotificationStatus } from '../generated/graphql'

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

export type FileResponse = {
  success: boolean
  file: StoredFile
}

// Supports the newer upload service and legacy metadata field names.
// BigInt values arrive as strings from your REST serializer.
export interface StoredFile {
  id: string

  name?: string | null
  size?: number | null
  type?: string | null
  url?: string | null
  objectKey?: string | null

  originalName?: string
  mimeType?: string
  sizeBytes?: string
  publicUrl?: string | null
  path?: string
  bucket?: string
  purpose?: FilePurpose
  status?: string
  storageProvider?: string
  uploadedByUserId?: string

  createdAt?: string
  updatedAt?: string
}

export interface AuthRole {
  id: string
  code: string
  name: string
}

export interface AuthUser {
  id: string
  authUserId: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  isActive: boolean
  roles: AuthRole[]
  permissions: string[]
  isAdmin: boolean
  isSuperAdmin: boolean
}

export interface RegisteredCustomer {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  isActive: boolean
}

export interface RegisterCustomerInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export interface AuditActor {
  id: string
  email: string
  firstName: string
  lastName: string
}

export interface AuditLog {
  id: string
  actorUserId: string | null
  action: string
  entityType: string
  entityId: string | null
  before: JsonValue
  after: JsonValue
  metadata: JsonValue
  ipAddress: string | null
  userAgent: string | null
  actor: AuditActor | null
  createdAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface AuditResult {
  items: AuditLog[]
  pagination: Pagination
}

export interface Brand {
  id: string
  name: string
  slug: string
  description: string | null
  logoFileId: string | null
  logoFile?: StoredFile | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateBrandInput {
  name: string
  slug?: string
  description?: string
  logoFileId?: string
}

export interface UpdateBrandInput {
  name?: string
  slug?: string
  description?: string | null
  logoFileId?: string | null
  isActive?: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  imageFileId: string | null
  imageFile?: StoredFile | null
  parentId: string | null
  parent?: Category | null
  children?: Category[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryInput {
  name: string
  slug?: string
  description?: string
  imageFileId?: string
  parentId?: string
}

export interface UpdateCategoryInput {
  name?: string
  slug?: string
  description?: string | null
  imageFileId?: string | null
  parentId?: string | null
  isActive?: boolean
}

export interface CartItem {
  id: string
  cartId: string
  variantId: string
  quantity: number
  unitPriceSnapshot: string
  createdAt: string
  updatedAt: string

  // Replace with your ProductVariant interface when available.
  variant?: {
    id: string
    [key: string]: unknown
  }
}

export interface Cart {
  id: string
  userId: string | null
  sessionKey: string | null
  status: 'ACTIVE' | 'CONVERTED' | 'ABANDONED' | 'EXPIRED'
  currency: string
  expiresAt: string | null
  items: CartItem[]
  createdAt: string
  updatedAt: string
}

export interface AddCartItemInput {
  variantId: string
  quantity: number
}

export type FilePurpose =
  | 'PRODUCT_IMAGE'
  | 'BRAND_LOGO'
  | 'CATEGORY_IMAGE'
  | 'USER_AVATAR'
  | 'RETURN_EVIDENCE'
  | 'WARRANTY_DOCUMENT'
  | 'INVOICE'
  | 'OTHER'

export interface SignedUploadInput {
  purpose: FilePurpose
  originalName: string
  mimeType: string
  sizeBytes?: number
  metadata?: Record<string, JsonValue>
}

export interface SignedUploadResult {
  success: boolean
  fileUpload: StoredFile
  signedUrl: string
  path: string

  // For an S3/Spaces adapter, return any required signed headers.
  headers?: Record<string, string>
}

export interface Notification {
  id: string
  userId: string | null
  channel: NotificationChannel
  status: NotificationStatus
  recipient: string
  templateKey: string | null
  subject: string | null
  body: string
  metadata: JsonValue
  sentAt: string | null
  failedAt: string | null
  error: string | null
  createdAt: string
  updatedAt: string
}

export interface NotificationsResult {
  items: Notification[]
  pagination: Pagination
}

export interface DownloadUrlResult {
  success: boolean
  id: string
  signedUrl: string
  expiresIn: number
}

export interface Inventory {
  id: string
  variantId: string
  physicalQuantity: number
  reservedQuantity: number
  soldQuantity: number
  availableQuantity: number
  reorderLevel: number
  createdAt: string
  updatedAt: string
}

// List and detail endpoints include the variant and product.
// Replace these minimal shapes with your complete models when available.
export interface InventoryDetails extends Inventory {
  variant: {
    id: string
    product: {
      id: string
      [key: string]: unknown
    }
    [key: string]: unknown
  }
}

export interface AdjustInventoryInput {
  quantityDelta: number
  notes?: string
  referenceType?: string
  referenceId?: string
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'PAID'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'

export interface OrderItem {
  id: string
  orderId: string
  productId: string | null
  variantId: string | null
  productNameSnapshot: string
  skuSnapshot: string
  attributesSnapshot: JsonValue
  unitPrice: string
  discountAmount: string
  quantity: number
  lineTotal: string
  createdAt: string
}

export interface OrderStatusHistory {
  id: string
  orderId: string
  status: OrderStatus
  note: string | null
  changedByUserId: string | null
  createdAt: string
}

export interface Order {
  id: string
  orderNumber: string
  userId: string | null
  guestEmail: string | null
  cartId: string | null
  status: OrderStatus
  currency: string
  subtotal: string
  discountTotal: string
  deliveryFee: string
  taxTotal: string
  total: string
  deliveryAddress: JsonValue
  billingAddress: JsonValue
  notes: string | null
  placedAt: string
  paidAt: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
}

export interface OrderListItem extends Order {
  items: OrderItem[]
  payments: Array<{ id: string; [key: string]: unknown }>
  shipments: Array<{ id: string; [key: string]: unknown }>
}

export interface OrderDetails extends OrderListItem {
  statusHistory: OrderStatusHistory[]
  returnRequests: Array<{ id: string; [key: string]: unknown }>
}

export interface CheckoutResult extends Order {
  items: OrderItem[]
  statusHistory: OrderStatusHistory[]
}

export interface OrdersResult {
  items: OrderListItem[]
  pagination: Pagination
}

export interface CheckoutInput {
  cartId: string
  deliveryAddress: Record<string, JsonValue>
  billingAddress?: Record<string, JsonValue>
  deliveryFee?: string
  taxTotal?: string
  discountTotal?: string
  notes?: string
}

export interface UpdateOrderStatusInput {
  status: OrderStatus
  note?: string
}

export interface VariantInventory {
  id: string
  variantId: string
  physicalQuantity: number
  reservedQuantity: number
  soldQuantity: number
  reorderLevel: number
  createdAt: string
  updatedAt: string
}

export interface SerializedDevice {
  id: string
  variantId: string
  serialNumber: string | null
  imei1: string | null
  imei2: string | null
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'RETURNED' | 'DAMAGED' | 'REPAIR'
  orderItemId: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  id: string
  productId: string
  sku: string
  barcode: string | null
  price: string
  salePrice: string | null
  costPrice: string | null
  attributes: Record<string, JsonValue>
  isActive: boolean
  weightGrams: number | null
  inventory: VariantInventory | null
  createdAt: string
  updatedAt: string
}

export interface ProductVariantDetails extends ProductVariant {
  serializedDevices: SerializedDevice[]
}

export interface CreateProductVariantInput {
  productId: string
  sku: string
  barcode?: string
  price: string
  salePrice?: string
  costPrice?: string
  attributes: Record<string, JsonValue>
  weightGrams?: number
}

export interface UpdateProductVariantInput {
  sku?: string
  barcode?: string | null
  price?: string
  salePrice?: string | null
  costPrice?: string | null
  attributes?: Record<string, JsonValue>
  weightGrams?: number | null
  isActive?: boolean
}

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

export interface Product {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  description: string | null
  brandId: string
  categoryId: string
  status: ProductStatus
  specifications: Record<string, JsonValue>
  warrantyMonths: number | null
  isFeatured: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductImage {
  id: string
  position: number
  isPrimary: boolean
  fileUpload: StoredFile
}

export interface ProductListItem extends Product {
  brand: Brand
  category: Category
  images: ProductImage[]
  variants: Array<
    ProductVariant & {
      availableQuantity: number
    }
  >
}

export interface ProductDetails extends Product {
  brand: Brand
  category: Category
  images: ProductImage[]
  variants: ProductVariantDetails[]
}

export interface ProductsResult {
  items: ProductListItem[]
  pagination: Pagination
}

export interface FindProductsInput {
  search?: string
  status?: ProductStatus
  brandId?: string
  categoryId?: string
  isFeatured?: boolean
  page?: number
  limit?: number
}

export interface CreateProductInput {
  name: string
  slug?: string
  shortDescription?: string
  description?: string
  brandId: string
  categoryId: string
  specifications?: Record<string, JsonValue>
  warrantyMonths?: number
  isFeatured?: boolean
}

export interface UpdateProductInput {
  name?: string
  slug?: string
  shortDescription?: string | null
  description?: string | null
  status?: ProductStatus
  brandId?: string
  categoryId?: string
  specifications?: Record<string, JsonValue>
  warrantyMonths?: number | null
  isFeatured?: boolean
}

export type ReturnStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RECEIVED'
  | 'INSPECTING'
  | 'COMPLETED'
  | 'CANCELLED'

export type ReturnItemCondition = 'UNOPENED' | 'OPENED' | 'USED' | 'DAMAGED' | 'FAULTY'

export interface ReturnItem {
  id: string
  returnRequestId: string
  orderItemId: string
  quantity: number
  condition: ReturnItemCondition | null
  resolution: string | null
  createdAt: string
  updatedAt: string
}

export interface ReturnEvidence {
  id: string
  returnRequestId: string
  fileUploadId: string
  fileUpload: StoredFile
  createdAt: string
}

export interface ReturnRequest {
  id: string
  orderId: string
  requestedByUserId: string | null
  status: ReturnStatus
  reason: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CreatedReturn extends ReturnRequest {
  items: ReturnItem[]
}

export interface ReturnDetails extends CreatedReturn {
  evidence: ReturnEvidence[]
}

export interface CreateReturnInput {
  orderId: string
  reason: string
  notes?: string
  items: Array<{
    orderItemId: string
    quantity: number
  }>
}

export interface Permission {
  id: string
  code: string
  name: string
  description: string | null
  module: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: string
  code: string
  name: string
  description: string | null
  isSystem: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RoleDetails extends Role {
  permissions: Array<{
    permission: Permission
  }>
}

export interface UserRoleAssignment {
  id: string
  userId: string
  roleId: string
  assignedByUserId: string | null
  isActive: boolean
  assignedAt: string
  revokedAt: string | null
  role: Role
  createdAt: string
  updatedAt: string
}

export interface AssignUserRoleInput {
  userId: string
  roleId: string
}

export interface RevokeUserRoleInput {
  userId: string
  roleId: string
}

export type ShipmentStatus =
  | 'PENDING'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED_DELIVERY'
  | 'RETURNED_TO_SENDER'
  | 'CANCELLED'

export interface ShipmentEvent {
  id: string
  shipmentId: string
  status: ShipmentStatus
  description: string | null
  location: string | null
  occurredAt: string
  createdAt: string
}

export interface Shipment {
  id: string
  orderId: string
  provider: string
  serviceLevel: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  status: ShipmentStatus
  shippedAt: string | null
  deliveredAt: string | null
  metadata: JsonValue
  createdAt: string
  updatedAt: string
}

export interface ShipmentDetails extends Shipment {
  events: ShipmentEvent[]
}

export interface CreateShipmentInput {
  orderId: string
  provider: string
  serviceLevel?: string
  trackingNumber?: string
  trackingUrl?: string
}

export interface UpdateShipmentInput {
  status: ShipmentStatus
  trackingNumber?: string
  trackingUrl?: string
  description?: string
  location?: string
}

export interface User {
  id: string
  authUserId: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  isActive: boolean
  emailVerifiedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminProfile {
  id: string
  userId: string
  employeeCode: string | null
  jobTitle: string | null
  department: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UserListItem extends User {
  adminProfile: AdminProfile | null
  userRoles: UserRoleAssignment[]
}

export interface UserDetails extends User {
  adminProfile: AdminProfile | null
  userRoles: Array<
    Omit<UserRoleAssignment, 'role'> & {
      role: RoleDetails
    }
  >
}

export interface UsersResult {
  items: UserListItem[]
  pagination: Pagination
}

export interface FindUsersInput {
  search?: string
  page?: number
  limit?: number
}

export interface UpdateUserInput {
  firstName?: string
  lastName?: string
  phone?: string | null
  isActive?: boolean
}
