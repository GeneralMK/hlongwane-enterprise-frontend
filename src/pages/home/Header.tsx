import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Icon,
  IconButton,
  Image,
  Link as ChakraLink,
  SimpleGrid,
  Skeleton,
  Text,
  VStack
} from '@chakra-ui/react'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Headphones,
  ShieldCheck,
  Truck
} from 'lucide-react'
import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import useStorefront, { getProductImage } from '../../hooks/useStoreFront'
import images from '../../theme/images'

const BLUE = '#008fff'
const NAVY = '#07132b'

const brands = [
  {
    name: 'Apple',
    image: images.appleLogo,
    width: '62px',
    height: '62px'
  },
  {
    name: 'Samsung',
    image: images.samsungLogo,
    width: '260px',
    height: '85px'
  },
  {
    name: 'PlayStation',
    image: images.psLogo,
    width: '210px',
    height: '62px'
  },
  {
    name: 'Xbox',
    image: images.xboxLogo,
    width: '260px',
    height: '85px'
  }
]

const heroBenefits = [
  {
    icon: Truck,
    firstLine: 'Fast & Reliable',
    secondLine: 'Delivery'
  },
  {
    icon: ShieldCheck,
    firstLine: '100% Authentic',
    secondLine: 'Products'
  },
  {
    icon: Headphones,
    firstLine: 'Dedicated',
    secondLine: 'Support'
  }
]

const benefits = [
  {
    icon: Truck,
    title: 'Nationwide Delivery',
    description: 'Fast and secure shipping'
  },
  {
    icon: ShieldCheck,
    title: 'Genuine Products',
    description: '100% authentic and warranty supported'
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description: 'Multiple payment options'
  },
  {
    icon: Headphones,
    title: 'Customer Support',
    description: 'Here to help, always'
  }
]

function LoadingCards({ height, categories = false }: { height: string; categories?: boolean }) {
  const count = categories ? 5 : 6

  return (
    <SimpleGrid
      columns={{
        base: 2,
        md: 3,
        lg: categories ? 5 : 6
      }}
      spacing={3}
    >
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} h={height} borderRadius="8px" />
      ))}
    </SimpleGrid>
  )
}

function RequestError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert status="error" borderRadius="8px" gap={2} flexWrap="wrap">
      <AlertIcon />

      <Text flex={1} fontSize="sm">
        {message}
      </Text>

      <Button size="sm" onClick={onRetry}>
        Retry
      </Button>
    </Alert>
  )
}

function ImageFallback({ label }: { label: string }) {
  return (
    <Box
      w="full"
      h="130px"
      display="grid"
      placeItems="center"
      bg="#f7f8fc"
      color="gray.500"
      borderRadius="5px"
      px={3}
      textAlign="center"
    >
      <Text fontSize="xs">{label}</Text>
    </Box>
  )
}

function getCategoryPlaceholder(name: string): string {
  const normalized = name.trim().toLowerCase()

  if (/phone|iphone|smartphone/.test(normalized)) {
    return images.phonesPlaceholder
  }

  if (/tablet|ipad/.test(normalized)) {
    return images.tabletsPlaceholder
  }

  if (/wearable|watch|airpod|earbud/.test(normalized)) {
    return images.wearablesPlaceholder
  }

  if (/gaming|game|console|playstation|xbox/.test(normalized)) {
    return images.gamesPlaceholder
  }

  return images.accessoriesPlaceholder
}

function CategoryImage({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  const placeholder = getCategoryPlaceholder(name)
  const source = imageUrl?.trim() || placeholder

  return (
    <Box w="full" h={{ base: '140px', md: '155px' }} overflow="hidden">
      <Image
        key={source}
        src={source}
        alt=""
        w="full"
        h="full"
        objectFit="contain"
        p={3}
        loading="lazy"
        fallback={
          <Image
            src={placeholder}
            alt=""
            w="full"
            h="full"
            objectFit="contain"
            p={3}
            ignoreFallback
          />
        }
      />
    </Box>
  )
}

export default function Header() {
  const productTrack = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const {
    categories,
    products,
    categoriesLoading,
    productsLoading,
    categoriesError,
    productsError,
    refetch
  } = useStorefront()

  function scrollProducts(direction: -1 | 1) {
    const track = productTrack.current

    if (!track) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    track.scrollBy({
      left: direction * track.clientWidth * 0.8,
      behavior: reducedMotion ? 'auto' : 'smooth'
    })
  }

  return (
    <Box color={NAVY} bg="white" fontFamily="Arial, Helvetica, sans-serif">
      {/* Hero */}
      <Box
        as="section"
        aria-labelledby="home-heading"
        position="relative"
        overflow="hidden"
        bg="#000b16"
        minH={{
          base: '660px',
          md: '520px',
          lg: '390px'
        }}
        sx={{
          '@media (min-width: 1280px)': {
            minHeight: '30.8vw'
          }
        }}
      >
        <Image
          src={images.heroBg}
          alt=""
          position="absolute"
          inset={0}
          w="full"
          h="full"
          objectFit="cover"
          objectPosition={{
            base: '70% bottom',
            md: 'center',
            lg: 'center'
          }}
        />

        <Box
          position="absolute"
          inset={0}
          display={{ base: 'block', lg: 'none' }}
          bgGradient="linear(to-b, rgba(0,11,22,0.97) 0%, rgba(0,11,22,0.9) 43%, rgba(0,11,22,0.08) 80%)"
        />

        <Box
          position="relative"
          zIndex={1}
          px={{ base: 6, md: 8, lg: '3%' }}
          pt={{ base: 8, lg: '3.4vw' }}
          pb={{ base: 8, lg: '2vw' }}
        >
          <Box w={{ base: '100%', lg: '47%' }}>
            <Text
              as="h1"
              id="home-heading"
              m={0}
              color="white"
              fontSize={{
                base: '40px',
                sm: '48px',
                md: '56px',
                lg: 'clamp(48px, 5.1vw, 100px)'
              }}
              fontWeight="800"
              letterSpacing="-0.045em"
              lineHeight="0.99"
            >
              <Box as="span" display="block">
                Your Devices.
              </Box>

              <Box as="span" display="block" mt={1} whiteSpace={{ base: 'normal', lg: 'nowrap' }}>
                Our{' '}
                <Box as="span" color={BLUE}>
                  Connection.
                </Box>
              </Box>
            </Text>

            <Text
              mt={{ base: 5, lg: '1.3vw' }}
              maxW={{ base: '520px', lg: '43vw' }}
              color="#f2f3f6"
              fontSize={{
                base: '16px',
                lg: 'clamp(18px, 1.6vw, 30px)'
              }}
              lineHeight="1.3"
              letterSpacing="-0.02em"
            >
              The latest iPhones, Samsung devices, Apple wearables, consoles and more all in one
              place.
            </Text>

            <Button
              as={Link}
              to="/shop"
              mt={{ base: 5, lg: '1.35vw' }}
              h={{
                base: '49px',
                lg: 'clamp(49px, 3.9vw, 76px)'
              }}
              px={{ base: 8, lg: '3vw' }}
              borderRadius="full"
              bg={BLUE}
              color="white"
              fontSize={{
                base: '18px',
                lg: 'clamp(18px, 1.5vw, 28px)'
              }}
              fontWeight="500"
              rightIcon={<ArrowRight size={22} />}
              _hover={{
                bg: '#007ada',
                textDecoration: 'none'
              }}
            >
              Shop Now
            </Button>

            <Flex
              mt={{ base: 7, lg: '2.4vw' }}
              align="center"
              justify="space-between"
              gap={{ base: 3, lg: 5 }}
              maxW={{ base: '520px', lg: '37vw' }}
            >
              {heroBenefits.map(({ icon, firstLine, secondLine }) => (
                <HStack
                  key={firstLine}
                  spacing={{ base: 2, lg: 3 }}
                  align="center"
                  flex={1}
                  minW={0}
                >
                  <Icon
                    as={icon}
                    color={BLUE}
                    boxSize={{
                      base: '28px',
                      lg: 'clamp(30px, 2.7vw, 50px)'
                    }}
                    flexShrink={0}
                    strokeWidth={1.8}
                  />

                  <Text
                    color="white"
                    fontSize={{
                      base: '11px',
                      lg: 'clamp(12px, 1vw, 18px)'
                    }}
                    lineHeight="1.3"
                  >
                    {firstLine}

                    <Box as="span" display="block">
                      {secondLine}
                    </Box>
                  </Text>
                </HStack>
              ))}
            </Flex>
          </Box>
        </Box>
      </Box>

      <Container maxW="1440px" px={{ base: 4, lg: '38px' }}>
        {/* Categories */}
        <Box as="section" aria-label="Shop by category" aria-busy={categoriesLoading} pt={5}>
          {categoriesLoading ? (
            <LoadingCards height="205px" categories />
          ) : categoriesError ? (
            <RequestError message={categoriesError} onRetry={refetch} />
          ) : categories.length > 0 ? (
            <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={3}>
              {categories.map((category) => {
                const imageUrl = category.imageFile?.publicUrl || category.imageFile?.url

                return (
                  <ChakraLink
                    key={category.id}
                    as={Link}
                    to={`/shop?${new URLSearchParams({
                      categoryId: category.id
                    })}`}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    bg="#f7f8fc"
                    border="1px solid"
                    borderColor="#edf0f5"
                    borderRadius="8px"
                    textAlign="center"
                    overflow="hidden"
                    pb={4}
                    transition="background 0.2s ease, border-color 0.2s ease"
                    _hover={{
                      bg: '#edf4ff',
                      borderColor: '#b9dcff',
                      textDecoration: 'none'
                    }}
                    _focusVisible={{
                      outline: '2px solid',
                      outlineColor: BLUE,
                      outlineOffset: '3px'
                    }}
                  >
                    <CategoryImage name={category.name} imageUrl={imageUrl} />

                    <Text px={2} color={NAVY} fontSize="16px" fontWeight="700" lineHeight="1.3">
                      {category.name}
                    </Text>

                    {category.description && (
                      <Text mt={1} px={3} fontSize="13px" color="#818799" noOfLines={2}>
                        {category.description}
                      </Text>
                    )}
                  </ChakraLink>
                )
              })}
            </SimpleGrid>
          ) : null}
        </Box>

        {/* Featured products */}
        <Box
          as="section"
          aria-labelledby="featured-heading"
          aria-busy={productsLoading}
          mt={5}
          pb={4}
        >
          <Flex justify="space-between" align="center" gap={3} mb={3}>
            <Box>
              <Text
                as="h2"
                id="featured-heading"
                fontSize={{ base: '22px', lg: '24px' }}
                fontWeight="800"
                letterSpacing="-0.04em"
              >
                Featured Products
              </Text>

              <Text mt={1} color="#818799" fontSize="14px">
                Popular devices and accessories
              </Text>
            </Box>

            <Button
              variant="link"
              color="#0082e6"
              fontSize={{ base: '12px', md: '14px' }}
              fontWeight="600"
              rightIcon={<ArrowRight size={17} />}
              whiteSpace="nowrap"
              isDisabled={productsLoading || Boolean(productsError) || products.length === 0}
              onClick={() => navigate('/shop')}
              _disabled={{
                color: 'gray.400',
                cursor: 'not-allowed',
                opacity: 0.6
              }}
            >
              View All Products
            </Button>
          </Flex>

          {productsLoading ? (
            <LoadingCards height="205px" />
          ) : productsError ? (
            <RequestError message={productsError} onRetry={refetch} />
          ) : products.length === 0 ? (
            <Box py={10} textAlign="center" bg="#f8f9fd" borderRadius="8px">
              <Text color="gray.500">Featured products will appear here soon.</Text>
            </Box>
          ) : (
            <Box position="relative">
              <Flex
                ref={productTrack}
                gap={3}
                overflowX="auto"
                scrollSnapType="x mandatory"
                pb={1}
                sx={{
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': {
                    display: 'none'
                  }
                }}
              >
                {products.map((product) => {
                  const imageUrl = getProductImage(product)

                  return (
                    <VStack
                      key={product.id}
                      flex={{
                        base: '0 0 70%',
                        sm: '0 0 calc((100% - 12px) / 2)',
                        md: '0 0 calc((100% - 24px) / 3)',
                        lg: '0 0 calc((100% - 60px) / 6)'
                      }}
                      minW={0}
                      spacing={2}
                      p={2}
                      border="1px solid"
                      borderColor="#edf0f5"
                      borderRadius="9px"
                      scrollSnapAlign="start"
                    >
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={product.name}
                          w="full"
                          h="130px"
                          objectFit="contain"
                          loading="lazy"
                          fallback={<ImageFallback label="Image unavailable" />}
                        />
                      ) : (
                        <ImageFallback label="Image coming soon" />
                      )}

                      <Text
                        fontSize="sm"
                        fontWeight="600"
                        textAlign="center"
                        noOfLines={2}
                        minH="40px"
                      >
                        {product.name}
                      </Text>

                      <Button
                        as={Link}
                        to={`/shop/${encodeURIComponent(product.id)}`}
                        aria-label={`View ${product.name}`}
                        variant="outline"
                        borderColor="#2598e8"
                        color="#0082e6"
                        borderRadius="5px"
                        w="full"
                        h="32px"
                        fontSize="13px"
                        fontWeight="500"
                        rightIcon={<ArrowRight size={16} />}
                        _hover={{
                          bg: '#eef7ff',
                          textDecoration: 'none'
                        }}
                      >
                        View Product
                      </Button>
                    </VStack>
                  )
                })}
              </Flex>

              {products.length > 1 && (
                <>
                  <IconButton
                    aria-label="Previous products"
                    icon={<ChevronLeft size={25} />}
                    onClick={() => scrollProducts(-1)}
                    position="absolute"
                    top="50%"
                    left="-13px"
                    transform="translateY(-50%)"
                    borderRadius="full"
                    border="1px solid #e9edf4"
                    bg="#f8f9fd"
                    color={NAVY}
                    boxShadow="sm"
                    size="sm"
                    _hover={{ bg: '#eaf3ff' }}
                  />

                  <IconButton
                    aria-label="Next products"
                    icon={<ChevronRight size={25} />}
                    onClick={() => scrollProducts(1)}
                    position="absolute"
                    top="50%"
                    right="-13px"
                    transform="translateY(-50%)"
                    borderRadius="full"
                    border="1px solid #e9edf4"
                    bg="#f8f9fd"
                    color={NAVY}
                    boxShadow="sm"
                    size="sm"
                    _hover={{ bg: '#eaf3ff' }}
                  />
                </>
              )}
            </Box>
          )}
        </Box>
      </Container>

      {/* Brand logos */}
      <Box as="section" aria-label="Shop by brand" bg="#f8f9fd">
        <Container maxW="1440px" px={{ base: 4, lg: '38px' }}>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={0} py={4}>
            {brands.map((brand, index) => (
              <ChakraLink
                key={brand.name}
                as={Link}
                to={`/shop?${new URLSearchParams({
                  brand: brand.name
                    .toLocaleLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '')
                }).toString()}`}
                minW={0}
                minH="90px"
                px={{ base: 2, md: 3 }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRight={{
                  base: 'none',
                  md: index < brands.length - 1 ? '1px solid #e5e9f0' : 'none'
                }}
                aria-label={`Shop ${brand.name}`}
                _hover={{
                  opacity: 0.8,
                  textDecoration: 'none'
                }}
                _focusVisible={{
                  outline: '2px solid',
                  outlineColor: BLUE,
                  outlineOffset: '3px'
                }}
              >
                <Image
                  src={brand.image}
                  alt={brand.name}
                  w="100%"
                  maxW={brand.width}
                  h={brand.height}
                  objectFit="contain"
                />
              </ChakraLink>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Service benefits */}
      <Container maxW="1440px" px={{ base: 5, lg: '48px' }}>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6} py={6}>
          {benefits.map(({ icon, title, description }) => (
            <HStack key={title} spacing={3} align="center">
              <Icon
                as={icon}
                color={BLUE}
                boxSize={{
                  base: '28px',
                  lg: 'clamp(30px, 2.7vw, 50px)'
                }}
                flexShrink={0}
                strokeWidth={1.8}
              />

              <Box>
                <Text fontSize="14px" fontWeight="700">
                  {title}
                </Text>

                <Text mt={1} color="#818799" fontSize="12px" lineHeight="1.4">
                  {description}
                </Text>
              </Box>
            </HStack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  )
}
