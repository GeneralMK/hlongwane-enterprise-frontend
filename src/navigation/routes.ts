import React from 'react'
import { Center, Spinner } from '@chakra-ui/react'

import { Loadable } from '../components'


const fallback = React.createElement(
  Center,
  {
    minH: '100vh'
  },
  React.createElement(Spinner, {
    size: 'xl',
    color: '#0f3034'
  })
)

/**
 * Public website pages
 */
const HomePage = Loadable(() => import('../pages/home'), { fallback })

const AboutPage = Loadable(() => import('../pages/about'), { fallback })

const SupportPage = Loadable(() => import('../pages/admin/support/index'), { fallback })

const ResetPasswordPage = Loadable(() => import('../pages/login/resetPassword'), { fallback })
const AdminResetPasswordPage = Loadable(() => import('../pages/PasswordReset'), { fallback })

const SupportAgentDashboard = Loadable(() => import('../pages/admin/support-agent'), { fallback })
const MyQueriesPage = Loadable(() => import('../pages/dashboard/sections/myQueries'), { fallback })

// const TechnologyPage = Loadable(() => import('../pages/technology'), { fallback })

const IndustriesPage = Loadable(() => import('../pages/industries'), { fallback })

const ContactUsPage = Loadable(() => import('../pages/contactUs'), { fallback })

const BookingConsultation = Loadable(() => import('../pages/consultation/BookConsultationPage'), {
  fallback
})

const CartPage = Loadable(() => import('../pages/cart'), {
  fallback
})

const CheckoutPage = Loadable(() => import('../pages/checkout'), {
  fallback
})
const EquipmentPage = Loadable(() => import('../pages/equipment'), { fallback })

const EquipmentDetailsPage = Loadable(() => import('../pages/equipment/EquipmentDetailsPage'), {
  fallback
})

const CompliancePage = Loadable(() => import('../pages/CompliancePage'), { fallback })

const ShopPage = Loadable(() => import('../pages/shop'), { fallback })
// const CataloguePage = Loadable(() => import('../pages/catalogue'), { fallback })
const visualizerPage = Loadable(() => import('../pages/visualizer'), { fallback })


/**
 * Authentication pages
 */
const LoginPage = Loadable(() => import('../pages/login'), { fallback })

const RegisterPage = Loadable(() => import('../pages/register'), { fallback })

const AdminLoginPage = Loadable(() => import('../pages/admin/login'), { fallback })

const PaymentPage = Loadable(() => import('../pages/payment/index'), { fallback })
const PaymentCallbackPage = Loadable(() => import('../pages/payment/paymentCallbackPage'), {
  fallback
})

/**
 * Protected user pages
 */

const MyWishlist = Loadable(() => import('../pages/dashboard/sections/WishlistSection'), {
  fallback
})
const MyRentals = Loadable(() => import('../pages/dashboard/sections/RentalsSection'), { fallback })
const MyAccountSettings = Loadable(() => import('../pages/dashboard/sections/SettingsSection'), {
  fallback
})

const UserManagement = Loadable(() => import('../pages/admin/userManagement/index'), {
  fallback
})
const MyOrders = Loadable(() => import('../pages/dashboard/sections/OrdersSection'), { fallback })
const MyAddresses = Loadable(() => import('../pages/dashboard/sections/AddressesSection'), {
  fallback
})

/**
 * Admin dashboard
 */
const AdminDashboard = Loadable(() => import('../pages/admin/dashboard'), { fallback })

/**
 * Admin insights
 */
const SalesRevenue = Loadable(() => import('../pages/admin/insights/SalesRevenue'), { fallback })

const RentalInsights = Loadable(() => import('../pages/admin/insights/RentalInsights'), {
  fallback
})

const CustomerInsights = Loadable(() => import('../pages/admin/insights/CustomerInsights'), {
  fallback
})

const InventoryStatus = Loadable(() => import('../pages/admin/insights/InventoryStatus'), {
  fallback
})

const GlobalSearchPage = Loadable(() => import('../pages/search'), {
  fallback
})

/**
 * Admin content
 */
const PagesManager = Loadable(() => import('../pages/admin/content/PagesManager'), { fallback })

const PageBuilder = Loadable(() => import('../pages/admin/content/PageBuilder'), { fallback })

const MediaLibrary = Loadable(() => import('../pages/admin/content/MediaLibrary'), { fallback })

/**
 * Admin products
 */
const ProductList = Loadable(() => import('../pages/admin/products/ProductList'), { fallback })

const AddProduct = Loadable(() => import('../pages/admin/products/AddProduct'), { fallback })

const InventoryAdjustment = Loadable(() => import('../pages/admin/products/InventoryAdjustment'), {
  fallback
})

const MaintenanceTracking = Loadable(() => import('../pages/admin/products/MaintenanceTracking'), {
  fallback
})
const ProductDetails = Loadable(() => import('../pages/admin/products/ProductDetails'), {
  fallback
})
const EditProduct = Loadable(() => import('../pages/admin/products/EditProduct'), { fallback })

/**
 * Admin orders
 */
const OrdersDashboard = Loadable(() => import('../pages/admin/orders/OrdersDashboard'), {
  fallback
})

const CreateOrder = Loadable(() => import('../pages/admin/orders/CreateOrder'), { fallback })

const OrderProcessing = Loadable(() => import('../pages/admin/orders/OrderProcessing'), {
  fallback
})

/**
 * Admin rentals
 */
const RentalsDashboard = Loadable(() => import('../pages/admin/rentals/RentalsDashboard'), {
  fallback
})

const ExtendReturn = Loadable(() => import('../pages/admin/rentals/ExtendReturn'), { fallback })

const OverdueRentals = Loadable(() => import('../pages/admin/rentals/OverdueRentals'), { fallback })

const RentalDetails = Loadable(() => import('../pages/admin/rentals/RentalDetails'), { fallback })
/**
 * Admin products
 */
const ReviewsList = Loadable(() => import('../pages/admin/reviews'), { fallback })
/**
 * Admin customers
 */

const CustomerDetails = Loadable(() => import('../pages/admin/customers/CustomerDetails'), {
  fallback
})

const ShopProductDetailsPage = Loadable(
  () => import('../pages/shop/ProductDetails'),
  { fallback }
)
export type AppRoute = {
  title: string
  path: string
  Element: React.ComponentType
}

/**
 * Public routes
 */
const PUBLIC_ROUTES: AppRoute[] = [
  // { title: 'Product Catalogue', path: '/catalogue', Element: CataloguePage },
  {
    title: 'Home',
    path: '/',
    Element: HomePage
  },
  {
    title: 'Global Search',
    path: '/search',
    Element: GlobalSearchPage
  },
  {
    title: 'Shop',
    path: '/shop',
    Element: ShopPage
  },
  {
    title: 'About',
    path: '/about',
    Element: AboutPage
  },

  {
    title: 'Equipment',
    path: '/equipment',
    Element: EquipmentPage
  },
{
  title: 'Product Details',
  path: '/shop/:id',
  Element: ShopProductDetailsPage
},
  {
    title: '3D Visualization',
    path: '3d-visualizer',
    Element: visualizerPage
  },

  // {
  //   title: 'Services',
  //   path: '/our-services',
  //   Element: ServicePage
  // },
  // {
  //   title: 'Technology',
  //   path: '/technologies',
  //   Element: TechnologyPage
  // },
  {
    title: 'Cart',
    path: '/cart',
    Element: CartPage
  },
  {
    title: 'Industries',
    path: '/industries',
    Element: IndustriesPage
  },
  {
    title: 'Contact Us',
    path: '/contact-us',
    Element: ContactUsPage
  },
  {
    title: 'Booking Consultation',
    path: '/book-consultation',
    Element: BookingConsultation
  },
  {
    title: 'Checkout',
    path: '/checkout',
    Element: CheckoutPage
  },
  {
    title: 'Compliance',
    path: '/compliance',
    Element: CompliancePage
  },
  {
    title: 'Login',
    path: '/login',
    Element: LoginPage
  },
  {
    title: 'Reset Password',
    path: '/reset-password',
    Element: ResetPasswordPage
  },
  
  {
    title: 'Admin Reset Password',
    path: '/admin/reset-password',
    Element: AdminResetPasswordPage
  },
  {
    title: 'Register',
    path: '/register',
    Element: RegisterPage
  },
  {
    title: 'Admin Login',
    path: '/admin/login',
    Element: AdminLoginPage
  },
  {
    title: 'Payment',
    path: '/payment',
    Element: PaymentPage
  },
  {
    title: 'Payment Callback',
    path: '/payment/callback',
    Element: PaymentCallbackPage
  }
]

/**
 * Normal authenticated-user routes
 */
const PRIVATE_ROUTES: AppRoute[] = [
  {
    title: 'My Orders',
    path: '/dashboard',
    Element: MyOrders
  },
  {
    title: 'My WWishlist',
    path: '/dashboard/wishlist',
    Element: MyWishlist
  },
  {
    title: 'My Rentals',
    path: '/dashboard/rentals',
    Element: MyRentals
  },
  {
    title: 'My Addresses',
    path: '/dashboard/addresses',
    Element: MyAddresses
  },

  {
    title: 'My Account Settings',
    path: '/dashboard/account',
    Element: MyAccountSettings
  }, 
    {
    title: 'My Queries',
    path: '/dashboard/queries',
    Element: MyQueriesPage
  },
]

/**
 * Admin routes
 */
const ADMIN_ROUTES: AppRoute[] = [
  /**
   * Dashboard
   */

  {
    title: 'User Management',
    path: '/admin/user-management',
    Element: UserManagement
  },
  {
    title: 'Admin Dashboard',
    path: '/admin/dashboard',
    Element: AdminDashboard
  },

  /**
   * Insights
   */
  {
    title: 'Sales & Revenue',
    path: '/admin/insights/sales',
    Element: SalesRevenue
  },
  {
    title: 'Rental Insights',
    path: '/admin/insights/rentals',
    Element: RentalInsights
  },
  {
    title: 'Customer Insights',
    path: '/admin/insights/customers',
    Element: CustomerInsights
  },
  {
    title: 'Inventory Status',
    path: '/admin/insights/inventory',
    Element: InventoryStatus
  },

  /**
   * Content
   */
  {
    title: 'Pages Manager',
    path: '/admin/content-management/pages',
    Element: PagesManager
  },
  {
    title: 'Create Page',
    path: '/admin/content-management/pages/new',
    Element: PageBuilder
  },
  {
    title: 'Edit Page',
    path: '/admin/content-management/pages/:pageId',
    Element: PageBuilder
  },
  {
    title: 'Media Library',
    path: '/admin/content-management/media',
    Element: MediaLibrary
  },

  /**
   * Products
   *
   * Specific product paths must come before
   * the base /admin/products route where relevant.
   */
  {
    title: 'Add Product',
    path: '/admin/products/new',
    Element: AddProduct
  },
  {
    title: 'Inventory Adjustment',
    path: '/admin/products/inventory-adjustment',
    Element: InventoryAdjustment
  },
  {
    title: 'Maintenance Tracking',
    path: '/admin/products/maintenance',
    Element: MaintenanceTracking
  },
  {
    title: 'Products List',
    path: '/admin/products',
    Element: ProductList
  },
  {
    title: 'Product Details',
    path: '/admin/products/:id',
    Element: ProductDetails
  },
  {
    title: 'Edit Product',
    path: '/admin/products/:id/edit',
    Element: EditProduct
  },

  /**
   * Orders
   */
  {
    title: 'Create Order',
    path: '/admin/orders/new',
    Element: CreateOrder
  },
  {
    title: 'Order Processing',
    path: '/admin/orders/processing',
    Element: OrderProcessing
  },
  {
    title: 'Orders Dashboard',
    path: '/admin/orders',
    Element: OrdersDashboard
  },

  /**
   * Rentals
   *
   * Keep named routes before :rentalId.
   */
  {
    title: 'Extend or Return Rental',
    path: '/admin/rentals/extend-return',
    Element: ExtendReturn
  },
  {
    title: 'Overdue Rentals',
    path: '/admin/rentals/overdue',
    Element: OverdueRentals
  },
  {
    title: 'Rental Details',
    path: '/admin/rentals/:rentalId',
    Element: RentalDetails
  },
  {
    title: 'Rentals Dashboard',
    path: '/admin/rentals',
    Element: RentalsDashboard
  },

  /**
   * Customers
   *
   * Keep details route before or alongside the base
   * route. React Router v6 ranks routes correctly,
   * but this ordering keeps the intent clear.
   */
  {
    title: 'Customer Details',
    path: '/admin/customers/:customerId',
    Element: CustomerDetails
  },
  {
    title: 'Reviews List',
    path: '/admin/reviews',
    Element: ReviewsList
  },
  {
    title: 'Support',
    path: '/admin/support',
    Element: SupportPage
  }
]

const SUPPORT_AGENT_ROUTES: AppRoute[] = [
  /**
   * Dashboard
   */
  
  {
    title: 'Dashboard Management',
    path: '/admin/support-agent/dashboard',
    Element: SupportAgentDashboard
  },
    {
    title: 'My Assigned Tickets',
    path: '/admin/support-agent/tickets',
    Element: SupportAgentDashboard
  }

]

export { ADMIN_ROUTES, PRIVATE_ROUTES, PUBLIC_ROUTES, SUPPORT_AGENT_ROUTES }
