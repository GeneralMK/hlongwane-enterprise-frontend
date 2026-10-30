import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Image,
  Skeleton,
  Text,
  useToast,
  VStack
} from '@chakra-ui/react'
import { gql, useMutation, useQuery } from '@apollo/client'
import {
  Heart,
  RefreshCcw,
  ShoppingCart,
  Trash2
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { useCart } from '../../../context/CartContext'

const BRAND = '#173F1F'
const BRAND_HOVER = '#0E2D15'
const BACKGROUND = '#FCFBF7'
const TEXT = '#23351F'
const SUBTEXT = '#66715F'
const LIGHT_GREEN = '#EDF4E5'

const MY_WISHLIST_QUERY = gql`
  query MyWishlist {
    myWishlist {
      id
      createdAt

      item {
        id
        createdAt
        updatedAt
        name
        description
        category
        sku
        stockQuantity
        condition
        purchasePrice
        rentalPrice
        isForSale
        isForRent
        availability
        imageUrl
        objectKey
      }
    }
  }
`

const REMOVE_WISHLIST_ITEM_MUTATION = gql`
  mutation RemoveWishlistItem($itemId: ID!) {
    removeWishlistItem(itemId: $itemId)
  }
`

type AgricultureItemAvailability =
  | 'AVAILABLE'
  | 'RENTED'
  | 'SOLD'
  | 'UNAVAILABLE'
  | string

type AgricultureItem = {
  id: string
  createdAt?: string | null
  updatedAt?: string | null
  name: string
  description?: string | null
  category: string
  sku?: string | null
  stockQuantity: number
  condition: string
  purchasePrice?: string | number | null
  rentalPrice?: string | number | null
  isForSale: boolean
  isForRent: boolean
  availability: AgricultureItemAvailability
  imageUrl?: string | null
  objectKey?: string | null
}

type WishlistItem = {
  id: string
  createdAt: string
  item: AgricultureItem
}

type MyWishlistData = {
  myWishlist: WishlistItem[]
}

type RemoveWishlistItemData = {
  removeWishlistItem: boolean
}

type RemoveWishlistItemVariables = {
  itemId: string
}

function toNumber(
  value: string | number | null | undefined
): number {
  const parsed = Number(value ?? 0)

  return Number.isFinite(parsed)
    ? parsed
    : 0
}

function formatCurrency(
  amount: string | number | null | undefined
): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(toNumber(amount))
}

function formatLabel(
  value?: string | null
): string {
  if (!value) {
    return ''
  }

  return value
    .toLowerCase()
    .split('_')
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ')
}

function isItemUnavailable(
  item: AgricultureItem
): boolean {
  return (
    item.stockQuantity <= 0 ||
    item.availability === 'SOLD' ||
    item.availability === 'UNAVAILABLE'
  )
}

function getDisplayedPrice(
  item: AgricultureItem
): {
  amount: number
  label: string
  mode: 'buy' | 'rent'
} {
  const purchasePrice =
    toNumber(item.purchasePrice)

  const rentalPrice =
    toNumber(item.rentalPrice)

  if (
    item.isForSale &&
    purchasePrice > 0
  ) {
    return {
      amount: purchasePrice,
      label: 'Purchase price',
      mode: 'buy'
    }
  }

  return {
    amount: rentalPrice,
    label: 'Rental price per day',
    mode: 'rent'
  }
}

export default function WishlistPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { addItem } = useCart()

  const {
    data,
    loading,
    error,
    refetch,
    networkStatus
  } = useQuery<MyWishlistData>(
    MY_WISHLIST_QUERY,
    {
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true
    }
  )

  const [
    removeWishlistItem,
    {
      loading: removing
    }
  ] = useMutation<
    RemoveWishlistItemData,
    RemoveWishlistItemVariables
  >(
    REMOVE_WISHLIST_ITEM_MUTATION
  )

  const items =
    data?.myWishlist ?? []

  const isRefreshing =
    networkStatus === 4

  async function handleRefresh(): Promise<void> {
    try {
      await refetch()

      toast({
        title: 'Wishlist refreshed',
        status: 'success',
        duration: 2000,
        isClosable: true
      })
    } catch (refreshError) {
      toast({
        title: 'Unable to refresh wishlist',
        description:
          refreshError instanceof Error
            ? refreshError.message
            : 'Please try again.',
        status: 'error',
        duration: 4000,
        isClosable: true
      })
    }
  }

  async function handleRemove(
    wishlistItem: WishlistItem
  ): Promise<void> {
    try {
      await removeWishlistItem({
        variables: {
          itemId:
            wishlistItem.item.id
        },

        optimisticResponse: {
          removeWishlistItem: true
        },

        update(cache) {
          cache.modify({
            fields: {
              myWishlist(
                existingReferences:
                  readonly unknown[] = [],
                {
                  readField
                }
              ) {
                return existingReferences.filter(
                  reference =>
                    readField(
                      'id',
                      reference
                    ) !==
                    wishlistItem.id
                )
              }
            }
          })
        }
      })

      toast({
        title: 'Removed from wishlist',
        description:
          `${wishlistItem.item.name} was removed from your wishlist.`,
        status: 'success',
        duration: 2500,
        isClosable: true
      })
    } catch (removeError) {
      await refetch()

      toast({
        title: 'Unable to remove item',
        description:
          removeError instanceof Error
            ? removeError.message
            : 'Please try again.',
        status: 'error',
        duration: 4000,
        isClosable: true
      })
    }
  }

  function handleAddToCart(
    wishlistItem: WishlistItem
  ): void {
    const item =
      wishlistItem.item

    const price =
      getDisplayedPrice(item)

    if (
      isItemUnavailable(item)
    ) {
      toast({
        title: 'Equipment unavailable',
        description:
          `${item.name} is currently unavailable.`,
        status: 'warning',
        duration: 3500,
        isClosable: true
      })

      return
    }

    if (price.amount <= 0) {
      toast({
        title: 'Price unavailable',
        description:
          'This equipment does not have a valid price.',
        status: 'warning',
        duration: 3500,
        isClosable: true
      })

      return
    }

    addItem({
      equipmentId: item.id,
      name: item.name,
      imageUrl:
        item.imageUrl ?? undefined,
      mode: price.mode,
      quantity: 1,
      unitPrice: price.amount
    })

    toast({
      title: 'Added to cart',
      description:
        `${item.name} was added to your cart.`,
      status: 'success',
      duration: 2500,
      isClosable: true
    })
  }

  return (
    <Box
      minH="100vh"
      bg={BACKGROUND}
      color={TEXT}
      px={{
        base: 4,
        md: 6,
        xl: 8
      }}
      py={{
        base: 6,
        md: 8
      }}
    >
      <Flex
        mb={8}
        align={{
          base: 'flex-start',
          md: 'center'
        }}
        justify="space-between"
        direction={{
          base: 'column',
          md: 'row'
        }}
        gap={4}
      >
        <Box>
          <Heading
            as="h1"
            fontSize={{
              base: '30px',
              md: '40px'
            }}
            fontWeight="800"
          >
            My Wishlist
          </Heading>

          <Text
            mt={2}
            color={SUBTEXT}
          >
            Products you have saved for later.
          </Text>
        </Box>

        <Button
          leftIcon={
            <RefreshCcw size={16} />
          }
          variant="outline"
          borderColor={BRAND}
          color={BRAND}
          borderRadius="full"
          isLoading={isRefreshing}
          loadingText="Refreshing"
          onClick={() => {
            void handleRefresh()
          }}
          _hover={{
            bg: LIGHT_GREEN
          }}
        >
          Refresh
        </Button>
      </Flex>

      {loading && items.length === 0 ? (
        <WishlistSkeleton />
      ) : error ? (
        <WishlistErrorState
          message={error.message}
          isRetrying={isRefreshing}
          onRetry={() => {
            void handleRefresh()
          }}
        />
      ) : items.length === 0 ? (
        <EmptyWishlistState
          onBrowse={() => {
            navigate('/equipment')
          }}
        />
      ) : (
        <Grid
          templateColumns={{
            base: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(3, minmax(0, 1fr))'
          }}
          gap={6}
        >
          {items.map(
            wishlistItem => (
              <WishlistCard
                key={wishlistItem.id}
                wishlistItem={
                  wishlistItem
                }
                isRemoving={
                  removing
                }
                onRemove={() => {
                  void handleRemove(
                    wishlistItem
                  )
                }}
                onAddToCart={() =>
                  handleAddToCart(
                    wishlistItem
                  )
                }
              />
            )
          )}
        </Grid>
      )}
    </Box>
  )
}

function WishlistCard({
  wishlistItem,
  isRemoving,
  onRemove,
  onAddToCart
}: {
  wishlistItem: WishlistItem
  isRemoving: boolean
  onRemove: () => void
  onAddToCart: () => void
}) {
  const item =
    wishlistItem.item

  const unavailable =
    isItemUnavailable(item)

  const price =
    getDisplayedPrice(item)

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.100"
      borderRadius="20px"
      boxShadow="0 8px 24px rgba(23, 63, 31, 0.06)"
      overflow="hidden"
      transition="transform 0.2s ease, box-shadow 0.2s ease"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow:
          '0 12px 30px rgba(23, 63, 31, 0.10)'
      }}
    >
      <Box
        position="relative"
        bg="#F7F8F5"
        h="230px"
      >
        <Box
          as={Link}
          to={`/equipment/${item.id}`}
          display="block"
          width="100%"
          height="100%"
        >
          <Image
            src={
              item.imageUrl ||
              '/placeholder-equipment.png'
            }
            alt={item.name}
            w="100%"
            h="100%"
            objectFit="contain"
            p={5}
          />
        </Box>

        <IconButton
          position="absolute"
          top={3}
          right={3}
          aria-label={
            `Remove ${item.name} from wishlist`
          }
          icon={
            <Trash2 size={18} />
          }
          bg="white"
          color="red.500"
          borderRadius="full"
          boxShadow="sm"
          isLoading={isRemoving}
          isDisabled={isRemoving}
          onClick={onRemove}
          _hover={{
            bg: 'red.50'
          }}
        />
      </Box>

      <VStack
        align="stretch"
        spacing={4}
        p={5}
      >
        <Box>
          <HStack
            mb={2}
            spacing={2}
            flexWrap="wrap"
          >
            <Badge
              colorScheme={
                unavailable
                  ? 'red'
                  : 'green'
              }
              borderRadius="full"
              textTransform="none"
            >
              {unavailable
                ? 'Unavailable'
                : `${item.stockQuantity} available`}
            </Badge>

            <Badge
              colorScheme="gray"
              variant="subtle"
              borderRadius="full"
              textTransform="none"
            >
              {formatLabel(
                item.category
              )}
            </Badge>
          </HStack>

          <Text
            as={Link}
            to={`/equipment/${item.id}`}
            fontSize="18px"
            fontWeight="800"
            color={TEXT}
            noOfLines={2}
            _hover={{
              color: BRAND,
              textDecoration: 'none'
            }}
          >
            {item.name}
          </Text>

          {item.description ? (
            <Text
              mt={2}
              color={SUBTEXT}
              fontSize="13px"
              lineHeight="1.6"
              noOfLines={2}
            >
              {item.description}
            </Text>
          ) : null}
        </Box>

        <Box>
          <Text
            color={SUBTEXT}
            fontSize="12px"
          >
            {price.label}
          </Text>

          <Text
            mt={1}
            fontSize="21px"
            fontWeight="800"
            color={TEXT}
          >
            {formatCurrency(
              price.amount
            )}

            {price.mode === 'rent'
              ? '/day'
              : ''}
          </Text>
        </Box>

        <HStack spacing={3}>
          <Button
            as={Link}
            to={`/equipment/${item.id}`}
            flex={1}
            h="46px"
            variant="outline"
            borderColor={BRAND}
            color={BRAND}
            borderRadius="full"
            _hover={{
              bg: LIGHT_GREEN
            }}
          >
            View
          </Button>

          <Button
            flex={1.4}
            h="46px"
            bg={BRAND}
            color="white"
            borderRadius="full"
            leftIcon={
              <ShoppingCart size={17} />
            }
            isDisabled={
              unavailable ||
              price.amount <= 0
            }
            onClick={onAddToCart}
            _hover={{
              bg: BRAND_HOVER
            }}
          >
            {unavailable
              ? 'Unavailable'
              : 'Add to Cart'}
          </Button>
        </HStack>
      </VStack>
    </Box>
  )
}

function EmptyWishlistState({
  onBrowse
}: {
  onBrowse: () => void
}) {
  return (
    <Center
      minH="480px"
      bg="white"
      border="1px solid"
      borderColor="gray.100"
      borderRadius="24px"
      px={6}
      py={14}
    >
      <VStack
        maxW="480px"
        spacing={5}
        textAlign="center"
      >
        <Center
          w="96px"
          h="96px"
          bg={LIGHT_GREEN}
          color={BRAND}
          borderRadius="full"
        >
          <Heart
            size={44}
            strokeWidth={1.7}
          />
        </Center>

        <Box>
          <Heading
            as="h2"
            fontSize={{
              base: '24px',
              md: '30px'
            }}
            fontWeight="800"
          >
            Your wishlist is empty
          </Heading>

          <Text
            mt={3}
            color={SUBTEXT}
            lineHeight="1.7"
          >
            Save equipment you are interested in and it will appear here for easy access.
          </Text>
        </Box>

        <Button
          h="50px"
          px={8}
          bg={BRAND}
          color="white"
          borderRadius="full"
          onClick={onBrowse}
          _hover={{
            bg: BRAND_HOVER
          }}
        >
          Browse Equipment
        </Button>
      </VStack>
    </Center>
  )
}

function WishlistErrorState({
  message,
  isRetrying,
  onRetry
}: {
  message: string
  isRetrying: boolean
  onRetry: () => void
}) {
  return (
    <Center
      minH="420px"
      px={4}
    >
      <Alert
        maxW="680px"
        status="error"
        borderRadius="18px"
        alignItems="flex-start"
        p={{
          base: 5,
          md: 6
        }}
      >
        <AlertIcon mt={1} />

        <Box flex="1">
          <AlertTitle>
            Unable to load your wishlist
          </AlertTitle>

          <AlertDescription mt={2}>
            {message}
          </AlertDescription>

          <Button
            mt={5}
            size="sm"
            variant="outline"
            colorScheme="red"
            leftIcon={
              <RefreshCcw size={15} />
            }
            isLoading={isRetrying}
            onClick={onRetry}
          >
            Try Again
          </Button>
        </Box>
      </Alert>
    </Center>
  )
}

function WishlistSkeleton() {
  return (
    <Grid
      templateColumns={{
        base: '1fr',
        sm: 'repeat(2, minmax(0, 1fr))',
        xl: 'repeat(3, minmax(0, 1fr))'
      }}
      gap={6}
    >
      {[1, 2, 3].map(
        item => (
          <Box
            key={item}
            bg="white"
            borderRadius="20px"
            overflow="hidden"
          >
            <Skeleton h="230px" />

            <VStack
              align="stretch"
              spacing={4}
              p={5}
            >
              <Skeleton
                h="22px"
                w="80%"
              />

              <Skeleton
                h="16px"
                w="100%"
              />

              <Skeleton
                h="26px"
                w="40%"
              />

              <Skeleton
                h="46px"
                borderRadius="full"
              />
            </VStack>
          </Box>
        )
      )}
    </Grid>
  )
}