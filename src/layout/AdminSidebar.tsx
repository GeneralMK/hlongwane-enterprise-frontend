import {
  Avatar,
  Box,
  Collapse,
  Flex,
  HStack,
  Icon,
  IconButton,
  Text,
  Tooltip,
  VStack
} from '@chakra-ui/react'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Package,
  ShoppingCart,
  Ticket
} from 'lucide-react'
import {
  type ElementType,
  useEffect,
  useId,
  useState
} from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { useAuthContext } from '../context'

const BLUE = '#008fff'
const NAVY = '#07132b'
const BORDER = '#e3eaf3'
const MUTED = '#718096'
const ACTIVE_BG = '#eef7ff'

type Child = {
  label: string
  path: string
}

type Item = {
  label: string
  icon: ElementType
  path?: string
  children?: Child[]
}

const adminItems: Item[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin/dashboard'
  },
  {
    label: 'Products',
    icon: Package,
    children: [
      { label: 'View Products', path: '/admin/products' },
      { label: 'Add Product', path: '/admin/products/new' }
    ]
  },
  {
    label: 'Orders',
    icon: ShoppingCart,
    children: [
      { label: 'Orders Dashboard', path: '/admin/orders' },
      {
        label: 'Order Processing',
        path: '/admin/orders/processing'
      }
    ]
  }
]

const supportItems: Item[] = [
  {
    label: 'My Tickets',
    icon: Ticket,
    path: '/admin/support-agent/dashboard'
  }
]

function matchesPath(current: string, target: string) {
  return current === target || current.startsWith(`${target}/`)
}

function SidebarItem({
  item,
  collapsed,
  onExpand
}: {
  item: Item
  collapsed: boolean
  onExpand: () => void
}) {
  const { pathname } = useLocation()
  const submenuId = useId()

  const activeChild = item.children
    ?.filter((child) => matchesPath(pathname, child.path))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path

  const active = item.children?.length
    ? Boolean(activeChild)
    : Boolean(item.path && matchesPath(pathname, item.path))

  const [open, setOpen] = useState(Boolean(activeChild))

  useEffect(() => {
    if (activeChild) setOpen(true)
  }, [activeChild])

  const styles = {
    w: 'full',
    minH: '46px',
    px: collapsed ? 0 : 4,
    alignItems: 'center',
    borderRadius: '8px',
    border: '1px solid',
    borderColor: active ? '#d5eaff' : 'transparent',
    bg: active ? ACTIVE_BG : 'transparent',
    color: active ? '#0078d4' : MUTED,
    fontSize: '14px',
    fontWeight: active ? '700' : '500',
    transition: 'background 0.2s, color 0.2s',
    _hover: {
      bg: active ? ACTIVE_BG : '#f5f8fc',
      color: active ? '#0078d4' : NAVY,
      textDecoration: 'none'
    },
    _focusVisible: {
      outline: `2px solid ${BLUE}`,
      outlineOffset: '2px'
    }
  }

  if (item.children?.length) {
    return (
      <Box>
        <Tooltip
          label={item.label}
          placement="right"
          isDisabled={!collapsed}
          hasArrow
        >
          <Flex
            as="button"
            type="button"
            {...styles}
            justifyContent={collapsed ? 'center' : 'space-between'}
            aria-label={item.label}
            aria-expanded={open && !collapsed}
            aria-controls={submenuId}
            onClick={() => {
              if (collapsed) {
                onExpand()
                setOpen(true)
              } else {
                setOpen((current) => !current)
              }
            }}
          >
            <HStack spacing={3}>
              <Icon
                as={item.icon}
                boxSize={5}
                strokeWidth={1.8}
              />

              {!collapsed && <Text>{item.label}</Text>}
            </HStack>

            {!collapsed && (
              <Icon
                as={open ? ChevronDown : ChevronRight}
                boxSize={4}
              />
            )}
          </Flex>
        </Tooltip>

        <Collapse in={open && !collapsed} animateOpacity>
          <VStack
            id={submenuId}
            align="stretch"
            spacing={1}
            mt={2}
            ml={6}
            pl={3}
            borderLeft="1px solid"
            borderColor={BORDER}
          >
            {item.children.map((child) => {
              const selected = activeChild === child.path

              return (
                <Box
                  key={child.path}
                  as={NavLink}
                  to={child.path}
                  end
                  px={3}
                  py={2.5}
                  borderRadius="6px"
                  color={selected ? '#0078d4' : MUTED}
                  bg={selected ? ACTIVE_BG : 'transparent'}
                  fontSize="13px"
                  fontWeight={selected ? '600' : '400'}
                  _hover={{
                    color: '#0078d4',
                    bg: ACTIVE_BG,
                    textDecoration: 'none'
                  }}
                  _focusVisible={{
                    outline: `2px solid ${BLUE}`,
                    outlineOffset: '2px'
                  }}
                >
                  {child.label}
                </Box>
              )
            })}
          </VStack>
        </Collapse>
      </Box>
    )
  }

  return (
    <Tooltip
      label={item.label}
      placement="right"
      isDisabled={!collapsed}
      hasArrow
    >
      <Flex
        as={NavLink}
        to={item.path ?? '/admin/dashboard'}
        {...styles}
        aria-label={item.label}
        justifyContent={collapsed ? 'center' : 'flex-start'}
        gap={collapsed ? 0 : 3}
      >
        <Icon
          as={item.icon}
          boxSize={5}
          strokeWidth={1.8}
        />

        {!collapsed && <Text>{item.label}</Text>}
      </Flex>
    </Tooltip>
  )
}

export default function AdminSidebar() {
  const { user, isSuperAdmin, isAdmin } = useAuthContext()
  const [collapsed, setCollapsed] = useState(false)

  const supportOnly =
    !isSuperAdmin &&
    !isAdmin &&
    Boolean(
      user?.roles.some((role) => role.code === 'SUPPORT_AGENT')
    )

  const items = supportOnly ? supportItems : adminItems

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'My account'

  return (
    <Flex
      as="aside"
      w={collapsed ? '80px' : '270px'}
      minW={collapsed ? '80px' : '270px'}
      h="100dvh"
      direction="column"
      position="sticky"
      top={0}
      flexShrink={0}
      overflow="hidden"
      bg="white"
      color={NAVY}
      borderRight="1px solid"
      borderColor={BORDER}
      fontFamily="Arial, Helvetica, sans-serif"
      transition="width 0.2s, min-width 0.2s"
      sx={{
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none'
        }
      }}
    >
      <Box h="4px" bg={BLUE} flexShrink={0} />

      {/* Brand */}
      <Flex
        minH="100px"
        px={collapsed ? 3 : 5}
        align="center"
        justify={collapsed ? 'center' : 'space-between'}
        borderBottom="1px solid"
        borderColor={BORDER}
      >
        {!collapsed && (
          <Box>
            <Text
              fontSize="23px"
              fontWeight="900"
              letterSpacing="-0.06em"
              lineHeight="1.1"
              whiteSpace="nowrap"
            >
              DEVICE
              <Box as="span" color={BLUE}>
                LINKUP
              </Box>
            </Text>

            <Text
              mt={2}
              color={MUTED}
              fontSize="9px"
              fontWeight="600"
              letterSpacing="0.14em"
              textTransform="uppercase"
            >
              {supportOnly ? 'Support Portal' : 'CMS Admin Portal'}
            </Text>
          </Box>
        )}

        <IconButton
          size="sm"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          icon={<Menu size={21} />}
          variant="ghost"
          color={MUTED}
          onClick={() => setCollapsed((current) => !current)}
          _hover={{ color: BLUE, bg: ACTIVE_BG }}
        />
      </Flex>

      {/* Account */}
      <HStack
        px={collapsed ? 0 : 5}
        py={5}
        justify={collapsed ? 'center' : 'flex-start'}
        spacing={3}
        borderBottom="1px solid"
        borderColor={BORDER}
      >
        <Avatar
          name={displayName}
          size="sm"
          bg="#dceeff"
          color="#0078d4"
        />

        {!collapsed && (
          <Box minW={0}>
            <Text fontSize="sm" fontWeight="600" noOfLines={1}>
              {displayName}
            </Text>

            <Text mt={1} color={MUTED} fontSize="xs">
              {supportOnly
                ? 'Support Agent'
                : isSuperAdmin
                  ? 'SuperAdmin'
                  : 'Administrator'}
            </Text>
          </Box>
        )}
      </HStack>

      {/* Navigation */}
      <Box
        as="nav"
        aria-label="Admin navigation"
        flex={1}
        overflowY="auto"
        overflowX="hidden"
        px={3}
        py={5}
      >
        {!collapsed && (
          <Text
            px={4}
            mb={3}
            color="#94a3b8"
            fontSize="10px"
            fontWeight="700"
            letterSpacing="0.12em"
            textTransform="uppercase"
          >
            Workspace
          </Text>
        )}

        <VStack align="stretch" spacing={2}>
          {items.map((item) => (
            <SidebarItem
              key={item.label}
              item={item}
              collapsed={collapsed}
              onExpand={() => setCollapsed(false)}
            />
          ))}
        </VStack>
      </Box>

      {/* Storefront */}
      <Box px={3} py={4} borderTop="1px solid" borderColor={BORDER}>
        <Tooltip
          label="Back to store"
          placement="right"
          isDisabled={!collapsed}
          hasArrow
        >
          <Flex
            as={NavLink}
            to="/"
            aria-label="Back to store"
            minH="44px"
            align="center"
            justify={collapsed ? 'center' : 'flex-start'}
            gap={3}
            px={collapsed ? 0 : 4}
            borderRadius="8px"
            color={MUTED}
            fontSize="13px"
            fontWeight="500"
            _hover={{
              color: BLUE,
              bg: ACTIVE_BG,
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={18} />
            {!collapsed && <Text>Back to store</Text>}
          </Flex>
        </Tooltip>
      </Box>
    </Flex>
  )
}