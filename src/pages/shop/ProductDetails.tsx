import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Heading,
  HStack,
  Image,
  Select,
  SimpleGrid,
  Skeleton,
  Text,
  VStack
} from '@chakra-ui/react'
import axios from 'axios'
import { ArrowLeft, ImageOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AddToCart from '../../components/AddToCart'

import { API_HOST } from '../../utils/contants'
import WebsiteLayout from '../../layout/WebsiteLayout'

const BLUE = '#008fff'
const NAVY = '#07132b'
const MUTED = '#7183a0'
const BORDER = '#e3eaf3'

interface ProductImage {
  id: string
  position: number
  isPrimary: boolean
  altText?: string | null
  fileUpload?: {
    publicUrl?: string | null
    url?: string | null
    path?: string | null
    objectKey?: string | null
  } | null
}

interface Variant {
  id: string
  sku: string
  price: string
  salePrice?: string | null
  attributes: Record<string, unknown>
  isActive: boolean
  inventory?: {
    physicalQuantity: number
    reservedQuantity: number
  } | null
}

interface Product {
  id: string
  name: string
  status: string
  shortDescription?: string | null
  description?: string | null
  warrantyMonths?: number | null
  isFeatured: boolean
  specifications?: Record<string, unknown> | null
  brand?: {
    id: string
    name: string
  } | null
  category?: {
    id: string
    name: string
  } | null
  images: ProductImage[]
  variants: Variant[]
}

interface ProductResponse {
  success: boolean
  message?: string
  data: Product
}

const api = axios.create({
  baseURL: `${API_HOST.trim().replace(/\/+$/, '')}/api/v1`,
  timeout: 20_000,
  headers: {
    Accept: 'application/json'
  }
})

const money = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR'
})

function displayValue(value: unknown): string {
  if (value == null) return '—'

  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

function variantLabel(variant: Variant): string {
  const attributes = Object.entries(variant.attributes || {})
    .map(([name, value]) => `${name}: ${displayValue(value)}`)
    .join(' · ')

  return attributes || variant.sku
}

function imageUrl(image: ProductImage): string | null {
  const file = image.fileUpload

  const value = (file?.publicUrl || file?.url || file?.path || file?.objectKey)?.trim()

  if (!value) return null

  if (/^https?:\/\//i.test(value)) return value

  const base = import.meta.env.VITE_SPACES_PUBLIC_URL?.trim().replace(/\/+$/, '')

  return base ? `${base}/${value.replace(/^\/+/, '')}` : null
}

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      return 'This product could not be found.'
    }

    // Avoid displaying backend internals to shoppers.
    return 'Unable to load this product. Please try again.'
  }

  return error instanceof Error ? error.message : 'Unable to load this product.'
}

function ImagePlaceholder() {
  return (
    <Flex
      minH={{ base: '280px', md: '420px' }}
      align="center"
      justify="center"
      direction="column"
      gap={3}
      color={MUTED}
      bg="#f7f9fc"
      borderRadius="12px"
    >
      <ImageOff size={42} />
      <Text fontSize="sm">Image unavailable</Text>
    </Flex>
  )
}

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>()
  const [refresh, setRefresh] = useState(0)
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [selectedImageId, setSelectedImageId] = useState('')

  const [state, setState] = useState<{
    key: string
    product: Product | null
    loading: boolean
    error: string | null
  }>({
    key: '',
    product: null,
    loading: true,
    error: null
  })

  const key = JSON.stringify([id, refresh])

  useEffect(() => {
    const controller = new AbortController()

    setState({
      key,
      product: null,
      loading: true,
      error: null
    })

    setSelectedVariantId('')
    setSelectedImageId('')

    async function load() {
      try {
        if (!id) {
          throw new Error('No product was selected.')
        }

        const response = await api.get<ProductResponse>(`/products/${encodeURIComponent(id)}`, {
          signal: controller.signal
        })

        if (!response.data.success || !response.data.data) {
          throw new Error('This product could not be found.')
        }

        const product = response.data.data

        if (product.status !== 'ACTIVE') {
          throw new Error('This product is currently unavailable.')
        }

        if (controller.signal.aborted) return

        setState({
          key,
          product,
          loading: false,
          error: null
        })
      } catch (error) {
        if (controller.signal.aborted) return

        setState({
          key,
          product: null,
          loading: false,
          error: errorMessage(error)
        })
      }
    }

    void load()

    return () => controller.abort()
  }, [id, refresh, key])

  const current = state.key === key
  const loading = !current || state.loading
  const error = current ? state.error : null
  const product = current ? state.product : null

  const variants = product?.variants.filter((variant) => variant.isActive) || []

  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) || variants[0]

  const gallery = [...(product?.images || [])]
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.position - b.position)
    .map((image) => ({
      ...image,
      source: imageUrl(image)
    }))
    .filter((image) => Boolean(image.source))

  const selectedImage = gallery.find((image) => image.id === selectedImageId) || gallery[0]

  const available = selectedVariant
    ? Math.max(
        0,
        (selectedVariant.inventory?.physicalQuantity ?? 0) -
          (selectedVariant.inventory?.reservedQuantity ?? 0)
      )
    : 0

  const price = selectedVariant ? Number(selectedVariant.salePrice ?? selectedVariant.price) : null

  const regularPrice = selectedVariant ? Number(selectedVariant.price) : null

  const discounted =
    price !== null &&
    regularPrice !== null &&
    Number.isFinite(price) &&
    Number.isFinite(regularPrice) &&
    price < regularPrice

  return (
    <WebsiteLayout>
      <Box bg="#f7f9fc" color={NAVY} minH="75vh" fontFamily="Arial, Helvetica, sans-serif">
        <Container maxW="1440px" px={{ base: 5, md: 8 }} py={{ base: 6, md: 10 }}>
          <Button
            as={Link}
            to="/shop"
            variant="link"
            color={BLUE}
            leftIcon={<ArrowLeft size={17} />}
            mb={7}
          >
            Back to shop
          </Button>

          {loading ? (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              <Skeleton h="460px" borderRadius="16px" />

              <VStack align="stretch" spacing={5}>
                <Skeleton h="28px" w="35%" />
                <Skeleton h="60px" />
                <Skeleton h="100px" />
                <Skeleton h="50px" w="45%" />
              </VStack>
            </SimpleGrid>
          ) : error || !product ? (
            <Alert status="error" borderRadius="12px" gap={3} flexWrap="wrap">
              <AlertIcon />
              <Text flex={1}>{error || 'Product unavailable.'}</Text>
              <Button size="sm" onClick={() => setRefresh((value) => value + 1)}>
                Retry
              </Button>
            </Alert>
          ) : (
            <>
              <SimpleGrid
                columns={{ base: 1, lg: 2 }}
                spacing={{ base: 7, lg: 12 }}
                alignItems="start"
              >
                <Box
                  bg="white"
                  border="1px solid"
                  borderColor={BORDER}
                  borderRadius="18px"
                  p={{ base: 4, md: 6 }}
                >
                  {selectedImage?.source ? (
                    <Image
                      key={selectedImage.id}
                      src={selectedImage.source}
                      alt={selectedImage.altText || product.name}
                      w="full"
                      h={{ base: '280px', md: '420px' }}
                      objectFit="contain"
                      fallback={<ImagePlaceholder />}
                    />
                  ) : (
                    <ImagePlaceholder />
                  )}

                  {gallery.length > 1 && (
                    <Flex mt={5} gap={3} overflowX="auto" pb={2}>
                      {gallery.map((image) => (
                        <Box
                          as="button"
                          type="button"
                          key={image.id}
                          aria-label={`View ${image.altText || product.name} image`}
                          aria-pressed={image.id === selectedImage?.id}
                          onClick={() => setSelectedImageId(image.id)}
                          flexShrink={0}
                          p={2}
                          border="2px solid"
                          borderColor={image.id === selectedImage?.id ? BLUE : BORDER}
                          borderRadius="10px"
                          _focusVisible={{
                            outline: `2px solid ${BLUE}`,
                            outlineOffset: '2px'
                          }}
                        >
                          <Image src={image.source!} alt="" boxSize="65px" objectFit="contain" />
                        </Box>
                      ))}
                    </Flex>
                  )}
                </Box>

                <Box py={{ base: 0, lg: 3 }}>
                  <HStack spacing={3} flexWrap="wrap">
                    {product.brand && (
                      <Button
                        as={Link}
                        to={`/shop?${new URLSearchParams({
                          brandId: product.brand.id
                        })}`}
                        variant="link"
                        color={BLUE}
                        fontSize="sm"
                      >
                        {product.brand.name}
                      </Button>
                    )}

                    {product.isFeatured && (
                      <Badge colorScheme="blue" borderRadius="full" px={3}>
                        Featured
                      </Badge>
                    )}
                  </HStack>

                  <Heading
                    as="h1"
                    mt={4}
                    fontSize={{ base: '30px', md: '42px' }}
                    lineHeight="1.15"
                    letterSpacing="-0.04em"
                  >
                    {product.name}
                  </Heading>

                  {product.shortDescription && (
                    <Text mt={4} color={MUTED} lineHeight="1.8">
                      {product.shortDescription}
                    </Text>
                  )}

                  <HStack mt={6} spacing={4} align="baseline">
                    <Text fontSize="32px" fontWeight="800">
                      {price !== null && Number.isFinite(price)
                        ? money.format(price)
                        : 'Price unavailable'}
                    </Text>

                    {discounted && (
                      <Text color={MUTED} textDecoration="line-through">
                        {money.format(regularPrice!)}
                      </Text>
                    )}
                  </HStack>

                  {variants.length > 1 && (
                    <Box mt={6}>
                      <Text as="label" htmlFor="product-variant" fontWeight="700">
                        Choose an option
                      </Text>

                      <Select
                        id="product-variant"
                        mt={2}
                        bg="white"
                        borderColor={BORDER}
                        focusBorderColor={BLUE}
                        value={selectedVariant?.id || ''}
                        onChange={(event) => setSelectedVariantId(event.target.value)}
                      >
                        {variants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variantLabel(variant)}
                          </option>
                        ))}
                      </Select>
                    </Box>
                  )}

                  <Badge
                    mt={5}
                    colorScheme={available > 0 ? 'green' : 'gray'}
                    borderRadius="full"
                    px={3}
                    py={1}
                  >
                    {available > 0 ? `${available} available` : 'Out of stock'}
                  </Badge>
                  <AddToCart
                    variantId={selectedVariant?.id}
                    available={available}
                    productName={product.name}
                  />

                  <Divider my={6} borderColor={BORDER} />

                  <VStack align="stretch" spacing={4} fontSize="sm">
                    {selectedVariant && (
                      <Flex justify="space-between" gap={4}>
                        <Text color={MUTED}>SKU</Text>
                        <Text fontWeight="600" wordBreak="break-word">
                          {selectedVariant.sku}
                        </Text>
                      </Flex>
                    )}

                    {product.category && (
                      <Flex justify="space-between" gap={4}>
                        <Text color={MUTED}>Category</Text>

                        <Button
                          as={Link}
                          to={`/shop?${new URLSearchParams({
                            categoryId: product.category.id
                          })}`}
                          variant="link"
                          color={BLUE}
                          fontSize="sm"
                        >
                          {product.category.name}
                        </Button>
                      </Flex>
                    )}

                    {product.warrantyMonths != null && (
                      <Flex justify="space-between" gap={4}>
                        <Text color={MUTED}>Warranty</Text>
                        <Text fontWeight="600">
                          {product.warrantyMonths > 0
                            ? `${product.warrantyMonths} months`
                            : 'No warranty specified'}
                        </Text>
                      </Flex>
                    )}
                  </VStack>
                </Box>
              </SimpleGrid>

              <Box
                mt={10}
                bg="white"
                border="1px solid"
                borderColor={BORDER}
                borderRadius="18px"
                p={{ base: 5, md: 8 }}
              >
                <Heading as="h2" size="md">
                  Product description
                </Heading>

                <Text mt={4} color={MUTED} lineHeight="1.9" whiteSpace="pre-wrap">
                  {product.description ||
                    product.shortDescription ||
                    'No description has been added for this product.'}
                </Text>

                {product.specifications && Object.keys(product.specifications).length > 0 && (
                  <Box mt={8}>
                    <Heading as="h2" size="md" mb={4}>
                      Specifications
                    </Heading>

                    {Object.entries(product.specifications).map(([name, value]) => (
                      <Flex
                        key={name}
                        gap={5}
                        justify="space-between"
                        py={3}
                        borderBottom="1px solid"
                        borderColor={BORDER}
                        fontSize="sm"
                      >
                        <Text color={MUTED}>{name}</Text>
                        <Text fontWeight="600" textAlign="right" overflowWrap="anywhere">
                          {displayValue(value)}
                        </Text>
                      </Flex>
                    ))}
                  </Box>
                )}
              </Box>
            </>
          )}
        </Container>
      </Box>
    </WebsiteLayout>
  )
}
