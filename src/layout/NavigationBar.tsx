import {
  Badge,
  Box,
  Button,
  Container,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Link as ChakraLink,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  VStack,
  useDisclosure
} from '@chakra-ui/react'
import {
  ChevronDown,
  Heart,
  Menu as MenuIcon,
  Search,
  ShoppingCart,
  UserRound
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import {
  Link,
  useLocation,
  useNavigate
} from 'react-router-dom'

import AuthModal from '../components/AuthModal'
import ProductSearchModal from '../components/ProductSearchModal'
import { useAuthContext } from '../context'
import { useCart } from '../context/CartContext'
import images from '../theme/images'

const BLUE = '#008fff'
const NAVY = '#001728'
const INK = '#101425'

interface NavItem {
  label: string
  route: string
  children?: string[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    route: '/'
  },
  {
    label: 'Phones',
    route: '/shop?search=phones',
    children: ['iPhone', 'Samsung']
  },
  {
    label: 'Tablets',
    route: '/shop?search=tablets',
    children: ['iPad', 'Samsung tablets']
  },
  {
    label: 'Wearables',
    route: '/shop?search=wearables',
    children: ['Apple Watch', 'Samsung watch', 'Earbuds']
  },
  {
    label: 'Gaming',
    route: '/shop?search=gaming',
    children: ['PlayStation', 'Xbox', 'Controllers']
  },
  {
    label: 'Accessories',
    route: '/shop?search=accessories',
    children: ['Cases', 'Chargers', 'Headphones', 'Cables']
  },
  {
    label: 'Deals',
    route: '/shop?deals=true'
  },
  {
    label: 'About Us',
    route: '/about'
  },
  {
    label: 'Contact Us',
    route: '/contact-us'
  }
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()

  const mobileMenu = useDisclosure()
  const authModal = useDisclosure()
  const searchModal = useDisclosure()

  const { itemCount, openCart } = useCart()

  const {
    isAuthenticated,
    isSuperAdmin,
    isAuthenticating
  } = useAuthContext()

  const [search, setSearch] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')

  function handleAccount() {
    mobileMenu.onClose()

    if (isAuthenticated) {
      navigate(
        isSuperAdmin
          ? '/admin/dashboard'
          : '/dashboard'
      )
      return
    }

    authModal.onOpen()
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const value = search.trim()

    if (!value) return

    setSubmittedSearch(value)
    mobileMenu.onClose()
    searchModal.onOpen()
  }

  function handleCart() {
    mobileMenu.onClose()
    openCart()
  }

  function isActive(item: NavItem): boolean {
    const [pathname, query = ''] = item.route.split('?')

    if (location.pathname !== pathname) return false

    const current = new URLSearchParams(location.search)
    const target = new URLSearchParams(query)

    if (!query) {
      return !location.search
    }

    const matchingSearch = current.get('search')

    const childMatch =
      item.children?.some(
        (child) =>
          child.toLowerCase() === matchingSearch?.toLowerCase()
      ) ?? false

    return (
      childMatch ||
      Array.from(target.entries()).every(
        ([key, value]) => current.get(key) === value
      )
    )
  }

  function renderSearch(label: string) {
    return (
      <Flex
        as="form"
        role="search"
        aria-label={label}
        onSubmit={handleSearch}
        w="full"
        h="44px"
        bg="#f8f9fc"
        border="1px solid #e1e6ed"
        borderRadius="9px"
        overflow="hidden"
        _focusWithin={{
          borderColor: BLUE,
          boxShadow: `0 0 0 1px ${BLUE}`
        }}
      >
        <InputGroup flex={1} minW={0}>
          <InputLeftElement
            h="42px"
            pointerEvents="none"
          >
            <Search size={19} color="#8a91a2" />
          </InputLeftElement>

          <Input
            aria-label="Search products"
            placeholder="Search for iPhones, Samsung, PlayStation, Xbox, accessories..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            autoComplete="off"
            h="42px"
            border={0}
            borderRadius={0}
            color={INK}
            fontSize="12px"
            _placeholder={{
              color: '#858b9a'
            }}
            _focusVisible={{
              boxShadow: 'none'
            }}
          />
        </InputGroup>

        <IconButton
          type="submit"
          aria-label="Show product search results"
          icon={
            <Search
              size={23}
              strokeWidth={1.8}
            />
          }
          h="44px"
          minW="48px"
          borderRadius={0}
          bg={BLUE}
          color="white"
          isDisabled={!search.trim()}
          _hover={{
            bg: '#007bdf'
          }}
        />
      </Flex>
    )
  }

  return (
    <>
      <Box
        as="header"
        position="sticky"
        top={0}
        zIndex={1000}
        bg="white"
        fontFamily="Arial, Helvetica, sans-serif"
        boxShadow="0 1px 5px rgba(0,0,0,0.08)"
      >
        <Container
          maxW="1280px"
          px={{ base: 4, lg: 10 }}
        >
          <Flex
            minH={{ base: '74px', lg: '81px' }}
            align="center"
            justify="space-between"
            gap={{ base: 3, lg: 8 }}
          >
            <ChakraLink
              as={Link}
              to="/"
              aria-label="DeviceLinkUp home"
              flexShrink={0}
            >
              <Image
                src={images.logo}
                alt="DeviceLinkUp — Your devices. Our connection."
                w={{
                  base: '175px',
                  md: '245px',
                  lg: '340px'
                }}
                h={{
                  base: '56px',
                  lg: '72px'
                }}
                objectFit="contain"
                objectPosition="left center"
              />
            </ChakraLink>

            <Box
              display={{
                base: 'none',
                lg: 'block'
              }}
              flex={1}
              minW={0}
              maxW="500px"
            >
              {renderSearch('Desktop product search')}
            </Box>

            <HStack
              spacing={{ base: 2, lg: 6 }}
              flexShrink={0}
            >
              <Button
                type="button"
                onClick={handleAccount}
                isDisabled={isAuthenticating}
                variant="unstyled"
                display={{
                  base: 'none',
                  md: 'inline-flex'
                }}
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                gap="5px"
                h="58px"
                minW="48px"
                color={INK}
                fontWeight="400"
                _hover={{
                  color: BLUE
                }}
              >
                <UserRound
                  size={26}
                  strokeWidth={1.8}
                />

                <Text as="span" fontSize="12px">
                  Account
                </Text>
              </Button>

              <ChakraLink
                as={Link}
                to="/dashboard/wishlist"
                display={{
                  base: 'none',
                  md: 'flex'
                }}
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                gap="5px"
                h="58px"
                minW="48px"
                color={INK}
                _hover={{
                  color: BLUE,
                  textDecoration: 'none'
                }}
              >
                <Heart
                  size={27}
                  strokeWidth={1.8}
                />

                <Text as="span" fontSize="12px">
                  Wishlist
                </Text>
              </ChakraLink>

              <Button
                type="button"
                onClick={handleCart}
                aria-label={`Open cart, ${itemCount} items`}
                variant="unstyled"
                display="inline-flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                gap="5px"
                h="58px"
                minW="48px"
                color={INK}
                fontWeight="400"
                _hover={{
                  color: BLUE
                }}
              >
                <Box
                  as="span"
                  position="relative"
                  display="inline-flex"
                >
                  <ShoppingCart
                    size={28}
                    strokeWidth={1.8}
                  />

                  <Badge
                    position="absolute"
                    top="-7px"
                    right="-10px"
                    minW="20px"
                    h="20px"
                    px={1}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg={BLUE}
                    color="white"
                    borderRadius="full"
                    fontSize="10px"
                    fontWeight="500"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </Badge>
                </Box>

                <Text as="span" fontSize="12px">
                  Cart
                </Text>
              </Button>

              <IconButton
                display={{
                  base: 'inline-flex',
                  lg: 'none'
                }}
                aria-label="Open navigation"
                icon={<MenuIcon size={25} />}
                onClick={mobileMenu.onOpen}
                variant="ghost"
                color={INK}
              />
            </HStack>
          </Flex>

          <Box
            display={{
              base: 'block',
              lg: 'none'
            }}
            pb={3}
          >
            {renderSearch('Mobile product search')}
          </Box>
        </Container>

        <Box
          as="nav"
          aria-label="Primary navigation"
          display={{
            base: 'none',
            lg: 'block'
          }}
          bg={NAVY}
        >
          <Container maxW="1280px" px={10}>
            <Flex
              h="45px"
              align="stretch"
              justify="space-between"
            >
              {NAV_ITEMS.map((item) => {
                const active = isActive(item)

                const styles = {
                  h: '45px',
                  px: { lg: 3, xl: 5 },
                  borderBottom: '3px solid',
                  borderBottomColor: active
                    ? BLUE
                    : 'transparent',
                  borderRadius: 0,
                  color: active
                    ? BLUE
                    : '#f3f5f8',
                  fontSize: '14px',
                  fontWeight: '400',
                  whiteSpace: 'nowrap' as const,
                  _hover: {
                    color: BLUE,
                    bg: 'whiteAlpha.50',
                    textDecoration: 'none'
                  }
                }

                return item.children ? (
                  <Menu key={item.label} isLazy>
                    <MenuButton
                      as={Button}
                      variant="unstyled"
                      {...styles}
                    >
                      <HStack
                        spacing={2}
                        justify="center"
                      >
                        <Text as="span">
                          {item.label}
                        </Text>

                        <ChevronDown
                          size={14}
                          strokeWidth={1.8}
                        />
                      </HStack>
                    </MenuButton>

                    <MenuList
                      bg="white"
                      color={INK}
                      borderColor="#e8edf3"
                      borderRadius="6px"
                      boxShadow="lg"
                      zIndex={1100}
                    >
                      <MenuItem
                        as={Link}
                        to={item.route}
                        fontSize="sm"
                      >
                        Shop all {item.label.toLowerCase()}
                      </MenuItem>

                      {item.children.map((label) => (
                        <MenuItem
                          key={label}
                          as={Link}
                          to={`/shop?${new URLSearchParams({
                            search: label
                          })}`}
                          fontSize="sm"
                        >
                          {label}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Menu>
                ) : (
                  <ChakraLink
                    key={item.label}
                    as={Link}
                    to={item.route}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    aria-current={
                      active ? 'page' : undefined
                    }
                    {...styles}
                  >
                    {item.label}
                  </ChakraLink>
                )
              })}
            </Flex>
          </Container>
        </Box>
      </Box>

      <Drawer
        isOpen={mobileMenu.isOpen}
        placement="right"
        onClose={mobileMenu.onClose}
        size="xs"
      >
        <DrawerOverlay />

        <DrawerContent bg={NAVY} color="white">
          <DrawerCloseButton />

          <DrawerHeader
            borderBottom="1px solid"
            borderColor="whiteAlpha.200"
          >
            Device
            <Box as="span" color={BLUE}>
              LinkUp
            </Box>
          </DrawerHeader>

          <DrawerBody py={5}>
            <VStack align="stretch" spacing={0}>
              {NAV_ITEMS.map((item) => (
                <ChakraLink
                  key={item.label}
                  as={Link}
                  to={item.route}
                  onClick={mobileMenu.onClose}
                  py={3}
                  borderBottom="1px solid"
                  borderColor="whiteAlpha.100"
                  color={isActive(item) ? BLUE : 'white'}
                  fontSize="sm"
                  _hover={{
                    color: BLUE,
                    textDecoration: 'none'
                  }}
                >
                  {item.label}
                </ChakraLink>
              ))}

              <Button
                mt={6}
                leftIcon={<UserRound size={18} />}
                onClick={handleAccount}
                isDisabled={isAuthenticating}
                bg={BLUE}
                color="white"
                _hover={{
                  bg: '#007bdf'
                }}
              >
                {isAuthenticated
                  ? 'My dashboard'
                  : 'Sign in / Register'}
              </Button>

              <Button
                as={Link}
                to="/dashboard/wishlist"
                onClick={mobileMenu.onClose}
                mt={3}
                leftIcon={<Heart size={18} />}
                variant="ghost"
                color="white"
                _hover={{
                  bg: 'whiteAlpha.100'
                }}
              >
                Wishlist
              </Button>

              <Button
                mt={3}
                leftIcon={<ShoppingCart size={18} />}
                onClick={handleCart}
                variant="ghost"
                color="white"
                _hover={{
                  bg: 'whiteAlpha.100'
                }}
              >
                Cart ({itemCount})
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <ProductSearchModal
        isOpen={searchModal.isOpen}
        onClose={searchModal.onClose}
        search={submittedSearch}
      />

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={authModal.onClose}
        initialView="sign-in"
      />
    </>
  )
}