import {
  Box,
  Collapse,
  Flex,
  HStack,
  Icon,
  Text,
  VStack
} from '@chakra-ui/react'
import { gql, useQuery } from '@apollo/client'
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Heart,
  Home,
  LogOut,
  Map,
  MessageCircle,
  Settings,
  ShoppingCart
} from 'lucide-react'
import {
  type ElementType,
  useEffect,
  useState
} from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { useAuthContext } from '../../../context'

const BLUE = '#008fff'
const NAVY = '#07132b'
const MUTED = '#7183a0'
const BORDER = '#e3eaf3'
const ACTIVE_BG = '#eaf6ff'

const MY_SUPPORT_UNREAD_COUNT_QUERY = gql`
  query MySupportUnreadCount($input: SupportTicketPaginationInput) {
    mySupportTickets(input: $input) {
      tickets {
        id
        customerUnreadCount
      }
    }
  }
`

interface UnreadData {
  mySupportTickets: {
    tickets: Array<{
      id: string
      customerUnreadCount: number
    }>
  }
}

interface UnreadVariables {
  input: {
    page: number
    limit: number
  }
}

interface Child {
  label: string
  path: string
  badgeCount?: number
}

interface Item {
  label: string
  icon: ElementType
  path?: string
  children?: Child[]
  badgeCount?: number
}

const baseItems: Item[] = [
  { label: 'Back Home', icon: Home, path: '/' },
  { label: 'Orders', icon: ShoppingCart, path: '/dashboard' },
  { label: 'Rentals', icon: CalendarDays, path: '/dashboard/rentals' },
  { label: 'Wishlist', icon: Heart, path: '/dashboard/wishlist' },
  { label: 'My Profile', icon: Settings, path: '/dashboard/account' },
  { label: 'Saved Addresses', icon: Map, path: '/dashboard/addresses' },
  { label: 'My Queries', icon: MessageCircle, path: '/dashboard/queries' }
]

function isPathActive(current: string, target: string): boolean {
  if (target === '/' || target === '/dashboard') {
    return current === target
  }

  return current === target || current.startsWith(`${target}/`)
}

function CountBadge({ count }: { count?: number }) {
  if (!count || count < 1) return null

  return (
    <Flex
      minW="22px"
      h="22px"
      px={1.5}
      align="center"
      justify="center"
      bg={BLUE}
      color="white"
      borderRadius="full"
      fontSize="10px"
      fontWeight="700"
      flexShrink={0}
      aria-label={`${count} unread support messages`}
    >
      {count > 99 ? '99+' : count}
    </Flex>
  )
}

function SidebarItem({ item }: { item: Item }) {
  const { pathname } = useLocation()

  const childActive =
    item.children?.some((child) =>
      isPathActive(pathname, child.path)
    ) ?? false

  const active = item.path
    ? isPathActive(pathname, item.path)
    : childActive

  const [open, setOpen] = useState(childActive)

  useEffect(() => {
    if (childActive) setOpen(true)
  }, [childActive])

  const styles = {
    width: '100%',
    minH: '48px',
    align: 'center',
    justify: 'space-between',
    gap: 3,
    px: 4,
    py: 3,
    borderRadius: '10px',
    border: '1px solid',
    borderColor: active ? '#c6e6ff' : 'transparent',
    bg: active ? ACTIVE_BG : 'transparent',
    color: active ? BLUE : MUTED,
    transition: 'background 0.2s, color 0.2s',
    _hover: {
      bg: ACTIVE_BG,
      color: BLUE,
      textDecoration: 'none'
    },
    _focusVisible: {
      outline: `2px solid ${BLUE}`,
      outlineOffset: '2px'
    }
  }

  const label = (
    <HStack spacing={3} minW={0}>
      <Icon
        as={item.icon}
        boxSize={5}
        strokeWidth={1.8}
        flexShrink={0}
      />

      <Text
        fontSize="sm"
        fontWeight={active ? '700' : '500'}
        noOfLines={1}
      >
        {item.label}
      </Text>
    </HStack>
  )

  if (item.children?.length) {
    return (
      <Box>
        <Flex
          as="button"
          type="button"
          {...styles}
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          {label}

          <HStack spacing={2}>
            <CountBadge count={item.badgeCount} />
            <Icon
              as={open ? ChevronDown : ChevronRight}
              boxSize={4}
            />
          </HStack>
        </Flex>

        <Collapse in={open} animateOpacity>
          <VStack
            align="stretch"
            spacing={1}
            ml={6}
            mt={2}
            pl={4}
            borderLeft="1px solid"
            borderColor={BORDER}
          >
            {item.children.map((child) => {
              const selected = isPathActive(pathname, child.path)

              return (
                <Flex
                  key={child.path}
                  as={NavLink}
                  to={child.path}
                  end
                  align="center"
                  justify="space-between"
                  gap={2}
                  px={3}
                  py={2.5}
                  borderRadius="8px"
                  bg={selected ? ACTIVE_BG : 'transparent'}
                  color={selected ? BLUE : MUTED}
                  _hover={{
                    bg: ACTIVE_BG,
                    color: BLUE,
                    textDecoration: 'none'
                  }}
                  _focusVisible={{
                    outline: `2px solid ${BLUE}`,
                    outlineOffset: '2px'
                  }}
                >
                  <Text fontSize="sm" noOfLines={1}>
                    {child.label}
                  </Text>

                  <CountBadge count={child.badgeCount} />
                </Flex>
              )
            })}
          </VStack>
        </Collapse>
      </Box>
    )
  }

  return (
    <Flex
      as={NavLink}
      to={item.path || '/dashboard'}
      end
      {...styles}
    >
      {label}
      <CountBadge count={item.badgeCount} />
    </Flex>
  )
}

export default function Sidebar() {
  const { user, signOut } = useAuthContext()

  return (
    <CustomerSidebar
      key={user?.id || 'guest'}
      firstName={user?.firstName || ''}
      lastName={user?.lastName || ''}
      email={user?.email || ''}
      authenticated={Boolean(user)}
      onSignOut={signOut}
    />
  )
}

function CustomerSidebar({
  firstName,
  lastName,
  email,
  authenticated,
  onSignOut
}: {
  firstName: string
  lastName: string
  email: string
  authenticated: boolean
  onSignOut: () => void
}) {
  const { data } = useQuery<UnreadData, UnreadVariables>(
    MY_SUPPORT_UNREAD_COUNT_QUERY,
    {
      variables: {
        input: {
          page: 1,
          limit: 100
        }
      },
      skip: !authenticated,
      fetchPolicy: 'no-cache',
      pollInterval: 5000,
      errorPolicy: 'ignore'
    }
  )

  const unreadCount = (
    data?.mySupportTickets?.tickets || []
  ).reduce(
    (total, ticket) =>
      total + Math.max(0, Number(ticket.customerUnreadCount) || 0),
    0
  )

  const initials = [firstName, lastName]
    .map((name) => name.trim().charAt(0))
    .join('')
    .toUpperCase() || 'DL'

  const displayName =
    [firstName, lastName].filter(Boolean).join(' ') || 'Customer'

  const items = baseItems.map((item) =>
    item.path === '/dashboard/queries'
      ? { ...item, badgeCount: unreadCount }
      : item
  )

  return (
    <Flex
      as="aside"
      w="270px"
      minW="270px"
      h="100dvh"
      direction="column"
      bg="white"
      color={NAVY}
      borderRight="1px solid"
      borderColor={BORDER}
      position="sticky"
      top={0}
      overflow="hidden"
      flexShrink={0}
      fontFamily="Arial, Helvetica, sans-serif"
    >
      <Box px={6} py={7} borderBottom="1px solid" borderColor={BORDER}>
        <Text
          fontWeight="900"
          fontSize="23px"
          letterSpacing="-0.06em"
        >
          DEVICE
          <Box as="span" color={BLUE}>LINKUP</Box>
        </Text>

        <Text
          mt={2}
          color={MUTED}
          fontSize="10px"
          fontWeight="700"
          letterSpacing="0.15em"
          textTransform="uppercase"
        >
          Customer Portal
        </Text>
      </Box>

      <Box px={5} py={5}>
        <HStack spacing={3}>
          <Flex
            boxSize="44px"
            align="center"
            justify="center"
            bg={ACTIVE_BG}
            color={BLUE}
            borderRadius="full"
            fontSize="sm"
            fontWeight="800"
            flexShrink={0}
          >
            {initials}
          </Flex>

          <Box minW={0}>
            <Text fontSize="sm" fontWeight="700" noOfLines={1}>
              {displayName}
            </Text>

            <Text mt={1} color={MUTED} fontSize="xs" noOfLines={1}>
              {email}
            </Text>
          </Box>
        </HStack>
      </Box>

      <VStack
        flex={1}
        align="stretch"
        spacing={2}
        px={3}
        pb={5}
        overflowY="auto"
        overflowX="hidden"
        aria-label="Customer navigation"
      >
        {items.map((item) => (
          <SidebarItem key={item.label} item={item} />
        ))}
      </VStack>

      <Box px={3} py={5} borderTop="1px solid" borderColor={BORDER}>
        <Flex
          as="button"
          type="button"
          w="full"
          align="center"
          gap={3}
          px={4}
          py={3}
          color={MUTED}
          borderRadius="10px"
          onClick={onSignOut}
          _hover={{
            bg: '#fff1f2',
            color: '#d92d40'
          }}
          _focusVisible={{
            outline: `2px solid ${BLUE}`,
            outlineOffset: '2px'
          }}
        >
          <Icon as={LogOut} boxSize={5} strokeWidth={1.8} />
          <Text fontSize="sm" fontWeight="600">Sign out</Text>
        </Flex>
      </Box>
    </Flex>
  )
}