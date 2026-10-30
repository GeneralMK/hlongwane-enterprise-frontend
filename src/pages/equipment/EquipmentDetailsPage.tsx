import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Image,
  Input,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useToast,
  VStack
} from '@chakra-ui/react'
import { Check, ChevronLeft, Heart, Minus, Plus, ShoppingCart, Truck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import {
  gql,
  useMutation,
  useQuery
} from '@apollo/client'

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
}

type PublicEquipmentDetailData = {
  publicAgricultureItem?: AgricultureItem | null
}

type PublicEquipmentDetailVariables = {
  id: string
}

type IsItemWishlistedData = {
  isItemWishlisted: boolean
}

type IsItemWishlistedVariables = {
  itemId: string
}

type WishlistItem = {
  id: string
  createdAt: string
  item: AgricultureItem
}

type AddWishlistItemData = {
  addWishlistItem: WishlistItem
}

type AddWishlistItemVariables = {
  input: {
    itemId: string
  }
  itemId: string
}

type RemoveWishlistItemData = {
  removeWishlistItem: boolean
}

type RemoveWishlistItemVariables = {
  itemId: string
}

const PUBLIC_EQUIPMENT_DETAIL_QUERY = gql`
  query PublicEquipmentDetail(
    $id: ID!
  ) {
    publicAgricultureItem(
      id: $id
    ) {
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
    }
  }
`

const IS_ITEM_WISHLISTED_QUERY = gql`
  query IsItemWishlisted(
    $itemId: ID!
  ) {
    isItemWishlisted(
      itemId: $itemId
    )
  }
`

const ADD_WISHLIST_ITEM_MUTATION = gql`
  mutation AddWishlistItem(
    $input: AddWishlistItemInput!
    $itemId: ID!
  ) {
    addWishlistItem(
      input: $input
      itemId: $itemId
    ) {
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
      }
    }
  }
`

const REMOVE_WISHLIST_ITEM_MUTATION = gql`
  mutation RemoveWishlistItem(
    $itemId: ID!
  ) {
    removeWishlistItem(
      itemId: $itemId
    )
  }
`
import images from '../../theme/images'
import WebsiteLayout from '../../layout/WebsiteLayout'

const BRAND = '#173F1F'
const BRAND_HOVER = '#0E2D15'
const PAGE_BACKGROUND = '#FCFBF7'
const BREADCRUMB_BACKGROUND = '#EDF4E5'

const IMAGE_BACKGROUND = '#F8F8F7'
const BORDER = '#E2E7DC'
const TEXT = '#23351F'
const SUBTEXT = '#66715F'
const LIGHT_GREEN = '#EDF4E5'

type EquipmentItem = AgricultureItem

type PurchaseMode = 'rent' | 'buy'

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0)

  return Number.isFinite(parsed) ? parsed : 0
}

function formatCurrency(value: string | number | null | undefined) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(toNumber(value))
}

function formatLabel(value?: string | null) {
  if (!value) {
    return ''
  }

  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getAvailabilityDetails(
  item: EquipmentItem
) {
  if (
    item.stockQuantity > 0 &&
    item.availability !== 'SOLD' &&
    item.availability !== 'UNAVAILABLE'
  ) {
    return {
      label:
        item.stockQuantity === 1
          ? '1 Unit Available'
          : `${item.stockQuantity} Units Available`,
      background: '#159447',
      color: 'white',
      available: true
    }
  }

  if (
    item.availability === 'SOLD'
  ) {
    return {
      label: 'Sold',
      background: '#EFE5FF',
      color: '#6941C6',
      available: false
    }
  }

  return {
    label: 'Out of Stock',
    background: '#FDE8E8',
    color: '#B42318',
    available: false
  }
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function getRentalDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return 0
  }

  const start = new Date(`${startDate}T00:00:00`)

  const end = new Date(`${endDate}T00:00:00`)

  const difference = end.getTime() - start.getTime()

  if (difference < 0) {
    return 0
  }

  return Math.floor(difference / (1000 * 60 * 60 * 24)) + 1
}

export default function EquipmentDetailsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { addItem } = useCart()
  const { equipmentId = '' } = useParams<{
    equipmentId: string
  }>()

  const {
    data,
    loading,
    error,
    refetch,
    networkStatus
  } = useQuery<
    PublicEquipmentDetailData,
    PublicEquipmentDetailVariables
  >(
    PUBLIC_EQUIPMENT_DETAIL_QUERY,
    {
      variables: {
        id: equipmentId
      },
      skip: !equipmentId,
      fetchPolicy:
        'cache-and-network',
      notifyOnNetworkStatusChange:
        true
    }
  )

  const equipment =
    data?.publicAgricultureItem

  const {
    data: wishlistData,
    loading: wishlistQueryLoading
  } = useQuery<
    IsItemWishlistedData,
    IsItemWishlistedVariables
  >(
    IS_ITEM_WISHLISTED_QUERY,
    {
      variables: {
        itemId: equipmentId
      },
      skip: !equipmentId,
      fetchPolicy:
        'cache-and-network',
      errorPolicy: 'all'
    }
  )

  const [
    addWishlistItem,
    {
      loading: addingToWishlist
    }
  ] = useMutation<
    AddWishlistItemData,
    AddWishlistItemVariables
  >(
    ADD_WISHLIST_ITEM_MUTATION
  )

  const [
    removeWishlistItem,
    {
      loading:
        removingFromWishlist
    }
  ] = useMutation<
    RemoveWishlistItemData,
    RemoveWishlistItemVariables
  >(
    REMOVE_WISHLIST_ITEM_MUTATION
  )

  const [isWishlisted, setIsWishlisted] = useState(false)

  const wishlistLoading = wishlistQueryLoading || addingToWishlist || removingFromWishlist

  const [mode, setMode] = useState<PurchaseMode>('rent')

  const [quantity, setQuantity] = useState(1)

  const [startDate, setStartDate] = useState('')

  const [endDate, setEndDate] = useState('')

  const [selectedImage, setSelectedImage] = useState('')

  useEffect(() => {
    setIsWishlisted(wishlistData?.isItemWishlisted ?? false)
  }, [wishlistData?.isItemWishlisted])

  useEffect(() => {
    if (!equipment) {
      return
    }

    setSelectedImage(equipment.imageUrl || images.logo)

    if (equipment.isForRent) {
      setMode('rent')
    } else if (equipment.isForSale) {
      setMode('buy')
    }
  }, [equipment])

  const rentalDays = useMemo(() => getRentalDays(startDate, endDate), [startDate, endDate])

  const calculatedTotal = useMemo(() => {
    if (!equipment) {
      return 0
    }

    if (mode === 'buy') {
      return toNumber(equipment.purchasePrice) * quantity
    }

    return toNumber(equipment.rentalPrice) * quantity * rentalDays
  }, [equipment, mode, quantity, rentalDays])

  if (loading && !equipment) {
    return <DetailsSkeleton />
  }

  if (error) {
    return (
      <ErrorState
        message={error.message}
        isRetrying={networkStatus === 4}
        onRetry={() => {
          void refetch()
        }}
      />
    )
  }

  if (!equipment) {
    return <EmptyState onBack={() => navigate('/equipment')} />
  }

  const availability = getAvailabilityDetails(equipment)

  const canRent = equipment.isForRent && toNumber(equipment.rentalPrice) > 0

  const canBuy = equipment.isForSale && toNumber(equipment.purchasePrice) > 0

  const maximumQuantity = Math.max(equipment.stockQuantity, 1)

  const currentPrice = mode === 'rent' ? equipment.rentalPrice : equipment.purchasePrice

  const validateSelection = () => {
    if (!availability.available) {
      toast({
        title: 'Equipment unavailable',
        description: `${equipment.name} is not currently available.`,
        status: 'warning',
        duration: 4000,
        isClosable: true
      })

      return false
    }

    if (mode === 'rent' && (!startDate || !endDate)) {
      toast({
        title: 'Rental dates required',
        description: 'Select a start and end date.',
        status: 'warning',
        duration: 4000,
        isClosable: true
      })

      return false
    }

    if (mode === 'rent' && rentalDays <= 0) {
      toast({
        title: 'Invalid rental period',
        description: 'The end date must be on or after the start date.',
        status: 'warning',
        duration: 4000,
        isClosable: true
      })

      return false
    }

    return true
  }

  const handleAddToCart = () => {
    if (!validateSelection()) {
      return
    }

    addItem({
      equipmentId: equipment.id,

      name: equipment.name,

      imageUrl: equipment.imageUrl,

      mode,

      quantity,

      unitPrice: toNumber(currentPrice),

      startDate: mode === 'rent' ? startDate : undefined,

      endDate: mode === 'rent' ? endDate : undefined,

      rentalDays: mode === 'rent' ? rentalDays : undefined
    })

    toast({
      title: 'Added to cart',
      description: `${equipment.name} was added to your cart.`,
      status: 'success',
      duration: 3000,
      isClosable: true
    })
  }

  const handleWishlist = async () => {
    if (wishlistLoading) {
      return
    }

    const previousWishlistState = isWishlisted
    const nextWishlistState = !previousWishlistState

    // Update the heart immediately. If the request fails, the state is restored.
    setIsWishlisted(nextWishlistState)

    try {
      if (previousWishlistState) {
        await removeWishlistItem({
          variables: {
            itemId: equipment.id
          },
          optimisticResponse: {
            removeWishlistItem: true
          }
        })

        toast({
          title: 'Removed from wishlist',
          description: `${equipment.name} was removed from your wishlist.`,
          status: 'success',
          duration: 3000,
          isClosable: true
        })
      } else {
        await addWishlistItem({
          variables: {
            input: {
              itemId: equipment.id
            },
            itemId: equipment.id
          },
          optimisticResponse: {
            addWishlistItem: {
              id: `optimistic-wishlist-${equipment.id}`,
              createdAt: new Date().toISOString(),
              item: {
                id: equipment.id,
                name: equipment.name,
                description: equipment.description ?? null,
                category: equipment.category,
                sku: equipment.sku ?? null,
                stockQuantity: equipment.stockQuantity,
                condition: equipment.condition,
                purchasePrice: equipment.purchasePrice ?? null,
                rentalPrice: equipment.rentalPrice ?? null,
                isForSale: equipment.isForSale,
                isForRent: equipment.isForRent,
                availability: equipment.availability,
                imageUrl: equipment.imageUrl ?? null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            }
          }
        })

        toast({
          title: 'Added to wishlist',
          description: `${equipment.name} was saved for later.`,
          status: 'success',
          duration: 3000,
          isClosable: true
        })
      }
    } catch (wishlistError) {
      setIsWishlisted(previousWishlistState)

      const message =
        wishlistError instanceof Error ? wishlistError.message : 'Unable to update your wishlist.'

      const normalisedMessage = message.toLowerCase()
      const requiresAuthentication =
        normalisedMessage.includes('authentication') ||
        normalisedMessage.includes('unauthenticated') ||
        normalisedMessage.includes('valid customer account')

      toast({
        title: requiresAuthentication ? 'Sign in required' : 'Wishlist update failed',
        description: requiresAuthentication
          ? 'Please sign in to save equipment to your wishlist.'
          : message,
        status: requiresAuthentication ? 'warning' : 'error',
        duration: 4000,
        isClosable: true
      })

      if (requiresAuthentication) {
        navigate('/login', {
          state: {
            returnTo: `/equipment/${equipment.id}`
          }
        })
      }
    }
  }

  return (
    <WebsiteLayout>
      <Box minH="100vh" bg={PAGE_BACKGROUND} color={TEXT}>
        <BreadcrumbBar equipment={equipment} />

        <Box
          width="100%"
          maxW="1240px"
          mx="auto"
          px={{
            base: 5,
            md: 8,
            xl: 0
          }}
          pt={{
            base: 7,
            md: 9
          }}
          pb={16}
        >
          <Button
            display={{
              base: 'flex',
              md: 'none'
            }}
            mb={5}
            variant="ghost"
            leftIcon={<ChevronLeft size={17} />}
            onClick={() => navigate('/equipment')}
          >
            Back to equipment
          </Button>

          <Grid
            templateColumns={{
              base: '1fr',
              lg: 'minmax(0, 1fr) minmax(360px, 0.92fr)'
            }}
            gap={{
              base: 8,
              lg: 10
            }}
            alignItems="start"
          >
            <GridItem>
              <EquipmentGallery
                equipment={equipment}
                selectedImage={selectedImage}
                isWishlisted={isWishlisted}
                wishlistLoading={wishlistLoading}
                onSelectImage={setSelectedImage}
                onToggleWishlist={() => {
                  void handleWishlist()
                }}
              />
            </GridItem>

            <GridItem>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text
                    as="h1"
                    color={TEXT}
                    fontSize={{
                      base: '28px',
                      md: '34px'
                    }}
                    fontWeight="800"
                    lineHeight="1.15"
                  >
                    {equipment.name}
                  </Text>

                  <HStack mt={2} spacing={2}>
                    <Badge
                      bg={availability.background}
                      color={availability.color}
                      px={3}
                      py={1}
                      borderRadius="full"
                      textTransform="none"
                    >
                      {availability.label}
                    </Badge>

                    <Text color={SUBTEXT} fontSize="13px">
                      {formatLabel(equipment.category)}
                    </Text>
                  </HStack>
                </Box>

                <PurchaseModeSelector
                  canRent={canRent}
                  canBuy={canBuy}
                  mode={mode}
                  onChange={setMode}
                />

                <Box>
                  <Text color={SUBTEXT} fontSize="12px">
                    {mode === 'rent' ? 'Rental price' : 'Purchase price'}
                  </Text>

                  <Text mt={1} color={TEXT} fontSize="24px" fontWeight="800">
                    {formatCurrency(currentPrice)}

                    {mode === 'rent' ? '/day' : ''}
                  </Text>
                </Box>

                {mode === 'rent' ? (
                  <SimpleGrid
                    columns={{
                      base: 1,
                      sm: 2
                    }}
                    spacing={4}
                  >
                    <FormControl isRequired>
                      <FormLabel fontSize="12px" fontWeight="700">
                        Start Date
                      </FormLabel>

                      <Input
                        type="date"
                        min={getToday()}
                        value={startDate}
                        bg="white"
                        borderColor={BORDER}
                        borderRadius="10px"
                        onChange={(event) => {
                          const value = event.target.value

                          setStartDate(value)

                          if (endDate && endDate < value) {
                            setEndDate('')
                          }
                        }}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontSize="12px" fontWeight="700">
                        End Date
                      </FormLabel>

                      <Input
                        type="date"
                        min={startDate || getToday()}
                        value={endDate}
                        bg="white"
                        borderColor={BORDER}
                        borderRadius="10px"
                        isDisabled={!startDate}
                        onChange={(event) => setEndDate(event.target.value)}
                      />
                    </FormControl>
                  </SimpleGrid>
                ) : null}

                <QuantitySelector
                  quantity={quantity}
                  maximumQuantity={maximumQuantity}
                  onChange={setQuantity}
                />

                {calculatedTotal > 0 ? (
                  <Flex
                    justify="space-between"
                    align="center"
                    p={3}
                    bg={LIGHT_GREEN}
                    borderRadius="10px"
                  >
                    <Text color={SUBTEXT} fontSize="13px">
                      Estimated total
                      {mode === 'rent' && rentalDays > 0
                        ? ` (${rentalDays} ${rentalDays === 1 ? 'day' : 'days'})`
                        : ''}
                    </Text>

                    <Text fontWeight="800">{formatCurrency(calculatedTotal)}</Text>
                  </Flex>
                ) : null}

                <Button
                  height="46px"
                  leftIcon={<ShoppingCart size={17} />}
                  bg={availability.available ? BRAND : '#9EAA98'}
                  color="white"
                  borderRadius="full"
                  isDisabled={!availability.available}
                  onClick={handleAddToCart}
                  _hover={{
                    bg: availability.available ? BRAND_HOVER : '#9EAA98'
                  }}
                >
                  Add to Cart
                </Button>

                <Button
                  height="44px"
                  leftIcon={
                    <Heart
                      size={18}
                      fill={isWishlisted ? '#E53E3E' : 'none'}
                      color={isWishlisted ? '#E53E3E' : BRAND}
                      strokeWidth={2}
                    />
                  }
                  variant="outline"
                  bg="white"
                  borderColor={isWishlisted ? '#E53E3E' : BRAND}
                  color={isWishlisted ? '#E53E3E' : BRAND}
                  borderRadius="full"
                  isLoading={wishlistLoading}
                  loadingText={isWishlisted ? 'Removing...' : 'Saving...'}
                  onClick={() => {
                    void handleWishlist()
                  }}
                  _hover={{
                    bg: '#FFF5F5',
                    borderColor: '#E53E3E',
                    color: '#E53E3E'
                  }}
                >
                  {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </Button>

                <DeliveryInformation equipment={equipment} />
              </VStack>
            </GridItem>
          </Grid>

          <Box mt={12}>
            <EquipmentInformation equipment={equipment} />
          </Box>
        </Box>
      </Box>
    </WebsiteLayout>
  )
}

function BreadcrumbBar({ equipment }: { equipment: EquipmentItem }) {
  return (
    <Box minH="58px" bg={BREADCRUMB_BACKGROUND} display="flex" alignItems="center">
      <Box
        width="100%"
        maxW="1240px"
        mx="auto"
        px={{
          base: 5,
          md: 8,
          xl: 0
        }}
      >
        <HStack spacing={2} color={SUBTEXT} fontSize="12px" overflow="hidden">
          <Link to="/">Home</Link>

          <Text>&gt;</Text>

          <Link to="/equipment">Equipment</Link>

          <Text>&gt;</Text>

          <Text>{formatLabel(equipment.category)}</Text>

          <Text>&gt;</Text>

          <Text color={TEXT} fontWeight="600" noOfLines={1}>
            {equipment.name}
          </Text>
        </HStack>
      </Box>
    </Box>
  )
}

function EquipmentGallery({
  equipment,
  selectedImage,
  isWishlisted,
  wishlistLoading,
  onSelectImage,
  onToggleWishlist
}: {
  equipment: EquipmentItem
  selectedImage: string
  isWishlisted: boolean
  wishlistLoading: boolean
  onSelectImage: (value: string) => void
  onToggleWishlist: () => void
}) {
  const image = equipment.imageUrl || images.logo

  const galleryImages = [image, image, image, image]

  return (
    <Box>
      <Box
        position="relative"
        height={{
          base: '340px',
          md: '500px'
        }}
        bg={IMAGE_BACKGROUND}
        borderRadius="16px"
        overflow="hidden"
      >
        <Image
          src={selectedImage || image}
          alt={equipment.name}
          width="100%"
          height="100%"
          objectFit="contain"
          p={{
            base: 6,
            md: 10
          }}
        />

        <IconButton
          position="absolute"
          top={4}
          right={4}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          icon={
            <Heart
              size={20}
              fill={isWishlisted ? '#E53E3E' : 'none'}
              color="#E53E3E"
              strokeWidth={2}
            />
          }
          bg="white"
          color="#E53E3E"
          border="1px solid"
          borderColor={isWishlisted ? '#E53E3E' : '#E2E8F0'}
          borderRadius="full"
          boxShadow="md"
          isLoading={wishlistLoading}
          onClick={onToggleWishlist}
          _hover={{
            bg: '#FFF5F5',
            borderColor: '#E53E3E'
          }}
        />
      </Box>

      <SimpleGrid mt={4} columns={4} spacing={3}>
        {galleryImages.map((galleryImage, index) => (
          <Button
            key={`${galleryImage}-${index}`}
            height={{
              base: '74px',
              md: '94px'
            }}
            p={2}
            bg={IMAGE_BACKGROUND}
            border="2px solid"
            borderColor={selectedImage === galleryImage && index === 0 ? BRAND : 'transparent'}
            borderRadius="10px"
            overflow="hidden"
            onClick={() => onSelectImage(galleryImage)}
            _hover={{
              borderColor: BRAND
            }}
          >
            <Image
              src={galleryImage}
              alt={`${equipment.name} ${index + 1}`}
              width="100%"
              height="100%"
              objectFit="contain"
            />
          </Button>
        ))}
      </SimpleGrid>
    </Box>
  )
}

function PurchaseModeSelector({
  canRent,
  canBuy,
  mode,
  onChange
}: {
  canRent: boolean
  canBuy: boolean
  mode: PurchaseMode
  onChange: (value: PurchaseMode) => void
}) {
  if (!canRent && !canBuy) {
    return (
      <Alert status="warning" borderRadius="10px">
        <AlertIcon />
        This equipment is not currently available for rent or purchase.
      </Alert>
    )
  }

  return (
    <Grid
      templateColumns={canRent && canBuy ? '1fr 1fr' : '1fr'}
      bg={LIGHT_GREEN}
      p="3px"
      borderRadius="full"
    >
      {canRent ? (
        <Button
          height="38px"
          borderRadius="full"
          bg={mode === 'rent' ? BRAND : 'transparent'}
          color={mode === 'rent' ? 'white' : TEXT}
          onClick={() => onChange('rent')}
          _hover={{
            bg: mode === 'rent' ? BRAND_HOVER : 'whiteAlpha.600'
          }}
        >
          Rent
        </Button>
      ) : null}

      {canBuy ? (
        <Button
          height="38px"
          borderRadius="full"
          bg={mode === 'buy' ? BRAND : 'transparent'}
          color={mode === 'buy' ? 'white' : TEXT}
          onClick={() => onChange('buy')}
          _hover={{
            bg: mode === 'buy' ? BRAND_HOVER : 'whiteAlpha.600'
          }}
        >
          Buy
        </Button>
      ) : null}
    </Grid>
  )
}

function QuantitySelector({
  quantity,
  maximumQuantity,
  onChange
}: {
  quantity: number
  maximumQuantity: number
  onChange: (value: number) => void
}) {
  return (
    <Box>
      <Text fontSize="12px" fontWeight="700" mb={2}>
        Quantity
      </Text>

      <HStack spacing={2}>
        <IconButton
          aria-label="Decrease quantity"
          icon={<Minus size={15} />}
          size="sm"
          variant="outline"
          borderColor={BORDER}
          isDisabled={quantity <= 1}
          onClick={() => onChange(Math.max(quantity - 1, 1))}
        />

        <Center minW="36px" height="32px" fontWeight="700">
          {quantity}
        </Center>

        <IconButton
          aria-label="Increase quantity"
          icon={<Plus size={15} />}
          size="sm"
          variant="outline"
          borderColor={BORDER}
          isDisabled={quantity >= maximumQuantity}
          onClick={() => onChange(Math.min(quantity + 1, maximumQuantity))}
        />

        <Text ml={2} color={SUBTEXT} fontSize="12px">
          {maximumQuantity} available
        </Text>
      </HStack>
    </Box>
  )
}

function DeliveryInformation({ equipment }: { equipment: EquipmentItem }) {
  return (
    <Box bg={LIGHT_GREEN} borderRadius="10px" p={4}>
      <VStack align="stretch" spacing={3}>
        <HStack align="flex-start" spacing={3}>
          <Truck size={17} color={BRAND} />

          <Box>
            <Text fontSize="12px" fontWeight="700">
              Delivery available
            </Text>

            <Text color={SUBTEXT} fontSize="11px">
              Delivery arrangements are confirmed after checkout.
            </Text>
          </Box>
        </HStack>

        <HStack align="flex-start" spacing={3}>
          <Check size={17} color={BRAND} />

          <Box>
            <Text fontSize="12px" fontWeight="700">
              Stock availability
            </Text>

            <Text color={SUBTEXT} fontSize="11px">
              {equipment.stockQuantity} unit
              {equipment.stockQuantity === 1 ? '' : 's'} currently available.
            </Text>
          </Box>
        </HStack>
      </VStack>
    </Box>
  )
}

function EquipmentInformation({ equipment }: { equipment: EquipmentItem }) {
  const specifications = [
    ['Category', formatLabel(equipment.category)],
    ['Condition', formatLabel(equipment.condition)],
    ['SKU', equipment.sku || ''],
    ['Availability', formatLabel(equipment.availability)],
    ['Stock Quantity', String(equipment.stockQuantity)],
    [
      'Transaction Options',
      [equipment.isForRent ? 'Rent' : null, equipment.isForSale ? 'Buy' : null]
        .filter(Boolean)
        .join(' and ') || ''
    ]
  ]

  return (
    <Accordion allowMultiple defaultIndex={[0]}>
      <AccordionItem
        mb={4}
        border="1px solid"
        borderColor={BORDER}
        borderRadius="14px"
        overflow="hidden"
        bg="white"
      >
        <AccordionButton
          px={5}
          py={5}
          _hover={{
            bg: LIGHT_GREEN
          }}
        >
          <Box flex="1" textAlign="left">
            <Text fontSize="17px" fontWeight="800">
              Full Specifications
            </Text>
          </Box>

          <AccordionIcon />
        </AccordionButton>

        <AccordionPanel px={5} pb={5}>
          <SimpleGrid
            columns={{
              base: 1,
              md: 2
            }}
            spacingX={8}
          >
            {specifications.map(([label, value]) => (
              <Flex
                key={label}
                justify="space-between"
                align="center"
                gap={4}
                py={4}
                borderBottom="1px solid"
                borderColor={BORDER}
              >
                <Text color={SUBTEXT} fontSize="13px">
                  {label}
                </Text>

                <Text textAlign="right" fontSize="13px" fontWeight="700">
                  {value}
                </Text>
              </Flex>
            ))}
          </SimpleGrid>
        </AccordionPanel>
      </AccordionItem>

      <AccordionItem
        mb={4}
        border="1px solid"
        borderColor={BORDER}
        borderRadius="14px"
        overflow="hidden"
        bg="white"
      >
        <AccordionButton
          px={5}
          py={5}
          _hover={{
            bg: LIGHT_GREEN
          }}
        >
          <Box flex="1" textAlign="left">
            <Text fontSize="17px" fontWeight="800">
              Description
            </Text>
          </Box>

          <AccordionIcon />
        </AccordionButton>

        <AccordionPanel px={5} pb={5}>
          <Text color={SUBTEXT} fontSize="14px" lineHeight="1.8" whiteSpace="pre-wrap">
            {equipment.description || 'No description has been provided for this equipment.'}
          </Text>
        </AccordionPanel>
      </AccordionItem>

      <AccordionItem
        border="1px solid"
        borderColor={BORDER}
        borderRadius="14px"
        overflow="hidden"
        bg="white"
      >
        <AccordionButton
          px={5}
          py={5}
          _hover={{
            bg: LIGHT_GREEN
          }}
        >
          <Box flex="1" textAlign="left">
            <Text fontSize="17px" fontWeight="800">
              Rental & Purchase Terms
            </Text>
          </Box>

          <AccordionIcon />
        </AccordionButton>

        <AccordionPanel px={5} pb={5}>
          <Stack spacing={3}>
            <Text color={SUBTEXT} fontSize="14px" lineHeight="1.7">
              Rental dates and final availability are confirmed during checkout.
            </Text>

            <Divider />

            <Text color={SUBTEXT} fontSize="14px" lineHeight="1.7">
              Equipment must be returned in the condition in which it was received. Additional
              charges may apply for damage or late returns.
            </Text>

            <Divider />

            <Text color={SUBTEXT} fontSize="14px" lineHeight="1.7">
              Purchase and rental orders remain subject to stock confirmation.
            </Text>
          </Stack>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}

function DetailsSkeleton() {
  return (
    <Box minH="100vh" bg={PAGE_BACKGROUND}>
      <Skeleton height="58px" />

      <Box
        maxW="1240px"
        mx="auto"
        px={{
          base: 5,
          md: 8
        }}
        py={10}
      >
        <Grid
          templateColumns={{
            base: '1fr',
            lg: '1fr 0.92fr'
          }}
          gap={10}
        >
          <Box>
            <Skeleton
              height={{
                base: '340px',
                md: '500px'
              }}
              borderRadius="16px"
            />

            <SimpleGrid mt={4} columns={4} spacing={3}>
              {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} height="90px" borderRadius="10px" />
              ))}
            </SimpleGrid>
          </Box>

          <VStack align="stretch" spacing={5}>
            <Skeleton height="38px" width="70%" />

            <Skeleton height="44px" borderRadius="full" />

            <Skeleton height="32px" width="40%" />

            <SimpleGrid columns={2} spacing={4}>
              <Skeleton height="70px" />
              <Skeleton height="70px" />
            </SimpleGrid>

            <Skeleton height="46px" borderRadius="full" />

            <Skeleton height="44px" borderRadius="full" />

            <Skeleton height="120px" borderRadius="10px" />
          </VStack>
        </Grid>
      </Box>
    </Box>
  )
}

function ErrorState({
  message,
  isRetrying,
  onRetry
}: {
  message: string
  isRetrying: boolean
  onRetry: () => void
}) {
  return (
    <Center minH="70vh" px={5}>
      <Alert maxW="700px" status="error" borderRadius="14px" alignItems="flex-start" p={5}>
        <AlertIcon mt={1} />

        <Box flex="1">
          <AlertTitle>Unable to load equipment</AlertTitle>

          <AlertDescription>{message}</AlertDescription>
        </Box>

        <Button size="sm" variant="outline" isLoading={isRetrying} onClick={onRetry}>
          Retry
        </Button>
      </Alert>
    </Center>
  )
}

function EmptyState({ onBack }: { onBack: () => void }) {
  return (
    <Center minH="70vh" flexDirection="column" textAlign="center" px={5}>
      <Text fontSize="24px" fontWeight="800">
        Equipment not found
      </Text>

      <Text mt={2} color={SUBTEXT}>
        This equipment may have been removed or is no longer available.
      </Text>

      <Button
        mt={5}
        bg={BRAND}
        color="white"
        borderRadius="full"
        onClick={onBack}
        _hover={{
          bg: BRAND_HOVER
        }}
      >
        Back to Equipment
      </Button>
    </Center>
  )
}