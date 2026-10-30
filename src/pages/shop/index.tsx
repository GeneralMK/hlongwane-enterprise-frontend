import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  Input,
  SimpleGrid,
  Skeleton,
  Text
} from '@chakra-ui/react'
import axios from 'axios'
import { ArrowRight, ImageOff, PackageSearch } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import WebsiteLayout from '../../layout/WebsiteLayout'
import { API_HOST } from '../../utils/contants'

const BLUE = '#008fff'
const NAVY = '#07132b'
const MUTED = '#7183a0'
const BORDER = '#e3eaf3'
const LIMIT = 12

const api = axios.create({
  baseURL: `${API_HOST.trim().replace(/\/+$/, '')}/api/v1`,
  timeout: 20_000,
  headers: {
    Accept: 'application/json'
  }
})

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

interface Brand {
  id: string
  name: string
  slug: string
  isActive: boolean
}

interface Category {
  id: string
  name: string
  slug: string
  isActive: boolean
}

interface ProductImage {
  id: string
  position: number
  isPrimary: boolean
  fileUpload?: {
    publicUrl?: string | null
    url?: string | null
    path?: string | null
    objectKey?: string | null
  } | null
}

interface ProductVariant {
  id: string
  price: string
  salePrice?: string | null
  isActive: boolean
  inventory?: {
    physicalQuantity: number
    reservedQuantity: number
  } | null
}

interface Product {
  id: string
  name: string
  shortDescription?: string | null
  isFeatured: boolean
  brand?: {
    id: string
    name: string
  } | null
  category?: {
    id: string
    name: string
  } | null
  images: ProductImage[]
  variants: ProductVariant[]
}

interface ProductPage {
  items: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface QueryState {
  key: string
  data: ProductPage | null
  brandName: string
  categoryName: string
  loading: boolean
  error: string | null
}

function unwrap<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data == null) {
    throw new Error('Unable to retrieve the catalogue. Please try again.')
  }

  return body.data
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Unable to connect to the server. Please try again.'
    }

    if (error.response.status === 429) {
      return 'Too many requests. Please wait a moment and try again.'
    }

    return 'Unable to load products right now. Please try again.'
  }

  return 'Unable to load products right now. Please try again.'
}

function emptyPage(page: number): ProductPage {
  return {
    items: [],
    pagination: {
      page,
      limit: LIMIT,
      total: 0,
      pages: 0
    }
  }
}

function productImage(product: Product): string | null {
  const sorted = [...product.images].sort(
    (a, b) =>
      Number(b.isPrimary) - Number(a.isPrimary) ||
      a.position - b.position
  )

  const publicBase = import.meta.env.VITE_SPACES_PUBLIC_URL
    ?.trim()
    .replace(/\/+$/, '')

  for (const image of sorted) {
    const file = image.fileUpload

    const value = (
      file?.publicUrl ||
      file?.url ||
      file?.path ||
      file?.objectKey
    )?.trim()

    if (!value) continue

    if (/^https?:\/\//i.test(value)) {
      return value
    }

    if (publicBase) {
      return `${publicBase}/${value.replace(/^\/+/, '')}`
    }
  }

  return null
}

const currency = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR'
})

function ProductCard({ product }: { product: Product }) {
  const image = productImage(product)

  const variants = product.variants.filter(
    (variant) => variant.isActive
  )

  const prices = variants
    .map((variant) => Number(variant.salePrice ?? variant.price))
    .filter((price) => Number.isFinite(price) && price >= 0)

  const lowestPrice = prices.length ? Math.min(...prices) : null
  const differentPrices = new Set(prices).size > 1

  const stock = variants.reduce(
    (total, variant) =>
      total +
      Math.max(
        0,
        (variant.inventory?.physicalQuantity ?? 0) -
          (variant.inventory?.reservedQuantity ?? 0)
      ),
    0
  )

  const fallback = (
    <Flex
      h="220px"
      align="center"
      justify="center"
      direction="column"
      gap={3}
      color={MUTED}
      bg="#f7f9fc"
      borderRadius="10px"
    >
      <ImageOff size={32} />
      <Text fontSize="sm">Image unavailable</Text>
    </Flex>
  )

  return (
    <Flex
      direction="column"
      bg="white"
      border="1px solid"
      borderColor={BORDER}
      borderRadius="16px"
      overflow="hidden"
      transition="box-shadow 0.2s, transform 0.2s"
      _hover={{
        boxShadow: '0 12px 30px rgba(7,19,43,0.08)',
        transform: 'translateY(-3px)'
      }}
    >
      <Box position="relative" p={4}>
        {image ? (
          <Image
            key={image}
            src={image}
            alt={product.name}
            w="full"
            h="220px"
            objectFit="contain"
            loading="lazy"
            fallback={fallback}
          />
        ) : (
          fallback
        )}

        {product.isFeatured && (
          <Badge
            position="absolute"
            top={4}
            left={4}
            bg="#eaf6ff"
            color="#007acb"
            borderRadius="full"
            px={3}
            py={1}
          >
            Featured
          </Badge>
        )}
      </Box>

      <Flex direction="column" flex={1} p={5} pt={2}>
        <Text
          color={BLUE}
          fontSize="xs"
          fontWeight="700"
          textTransform="uppercase"
          letterSpacing="0.08em"
        >
          {product.brand?.name || 'DLinkUp'}
        </Text>

        <Heading
          as="h2"
          mt={2}
          fontSize="lg"
          lineHeight="1.4"
          noOfLines={2}
          minH="50px"
        >
          {product.name}
        </Heading>

        <Text mt={2} color={MUTED} fontSize="sm" noOfLines={2}>
          {product.shortDescription ||
            product.category?.name ||
            'Explore this product'}
        </Text>

        <Box mt="auto" pt={5}>
          <Text fontWeight="800" fontSize="xl">
            {lowestPrice === null
              ? 'Price unavailable'
              : `${differentPrices ? 'From ' : ''}${currency.format(lowestPrice)}`}
          </Text>

          <Text
            mt={1}
            fontSize="xs"
            color={stock > 0 ? 'green.600' : MUTED}
          >
            {stock > 0 ? `${stock} available` : 'Out of stock'}
          </Text>

          <Button
            as={Link}
            to={`/shop/${encodeURIComponent(product.id)}`}
            mt={4}
            w="full"
            bg={BLUE}
            color="white"
            borderRadius="10px"
            rightIcon={<ArrowRight size={17} />}
            _hover={{
              bg: '#007ada',
              textDecoration: 'none'
            }}
          >
            View Product
          </Button>
        </Box>
      </Flex>
    </Flex>
  )
}

interface EmptyProductsProps {
  message: string
  filtered: boolean
  page: number
  onFirstPage: () => void
  onClearFilters: () => void
}

function EmptyProducts({
  message,
  filtered,
  page,
  onFirstPage,
  onClearFilters
}: EmptyProductsProps) {
  return (
    <Box
      role="status"
      bg="white"
      border="1px solid"
      borderColor={BORDER}
      borderRadius="16px"
      textAlign="center"
      px={6}
      py={{ base: 12, md: 20 }}
    >
      <Flex
        mx="auto"
        mb={5}
        boxSize="80px"
        align="center"
        justify="center"
        borderRadius="full"
        bg="#eaf6ff"
        color={BLUE}
      >
        <PackageSearch size={36} strokeWidth={1.6} />
      </Flex>

      <Heading size="md" color={NAVY}>
        No products available
      </Heading>

      <Text
        mt={3}
        mx="auto"
        maxW="450px"
        color={MUTED}
        lineHeight="1.8"
      >
        {message}
      </Text>

      {(page > 1 || filtered) && (
        <Flex mt={6} justify="center" gap={3} flexWrap="wrap">
          {page > 1 && (
            <Button
              variant="outline"
              borderColor={BORDER}
              borderRadius="10px"
              onClick={onFirstPage}
            >
              First page
            </Button>
          )}

          {filtered && (
            <Button
              bg={BLUE}
              color="white"
              borderRadius="10px"
              onClick={onClearFilters}
              rightIcon={<ArrowRight size={17} />}
              _hover={{ bg: '#007ada' }}
            >
              Browse all products
            </Button>
          )}
        </Flex>
      )}
    </Box>
  )
}

export default function ShopPage() {
  const [params, setParams] = useSearchParams()

  const brandId = params.get('brandId')?.trim() || ''
  const brand = params.get('brand')?.trim() || ''
  const categoryId = params.get('categoryId')?.trim() || ''
  const search = params.get('search')?.trim() || ''

  const rawPage = Number(params.get('page') || 1)

  const page =
    Number.isSafeInteger(rawPage) &&
    rawPage > 0 &&
    Number.isSafeInteger((rawPage - 1) * LIMIT)
      ? rawPage
      : 1

  const hasBrand = Boolean(brandId || brand)
  const hasCategory = Boolean(categoryId)
  const filtered = hasBrand || hasCategory || Boolean(search)

  const [searchInput, setSearchInput] = useState(search)
  const [refresh, setRefresh] = useState(0)

  const key = JSON.stringify([
    brandId,
    brand,
    categoryId,
    search,
    page,
    refresh
  ])

  const [state, setState] = useState<QueryState>({
    key: '',
    data: null,
    brandName: '',
    categoryName: '',
    loading: true,
    error: null
  })

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    const controller = new AbortController()

    setState({
      key,
      data: null,
      brandName: '',
      categoryName: '',
      loading: true,
      error: null
    })

    async function load() {
      try {
        const selectedBrandPromise: Promise<Brand | null> =
          brandId || brand
            ? api
                .get<ApiResponse<Brand[]>>('/brands', {
                  signal: controller.signal
                })
                .then((response) => {
                  const brands = unwrap(response.data)
                  const normalized = brand.toLowerCase()

                  const selected = brands.find((item) =>
                    brandId
                      ? item.id === brandId
                      : item.name.trim().toLowerCase() === normalized ||
                        item.slug.trim().toLowerCase() === normalized
                  )

                  return selected?.isActive ? selected : null
                })
            : Promise.resolve(null)

        const selectedCategoryPromise: Promise<Category | null> =
          categoryId
            ? api
                .get<ApiResponse<Category[]>>('/categories', {
                  signal: controller.signal
                })
                .then((response) => {
                  const selected = unwrap(response.data).find(
                    (item) => item.id === categoryId
                  )

                  return selected?.isActive ? selected : null
                })
            : Promise.resolve(null)

        const [selectedBrand, selectedCategory] = await Promise.all([
          selectedBrandPromise,
          selectedCategoryPromise
        ])

        if (controller.signal.aborted) return

        const unavailableBrand =
          Boolean(brandId || brand) && !selectedBrand

        const unavailableCategory =
          Boolean(categoryId) && !selectedCategory

        // Stop here when a selected filter is unavailable.
        // Omitting that filter from the API request would show
        // unrelated products.
        if (unavailableBrand || unavailableCategory) {
          setState({
            key,
            data: emptyPage(page),
            brandName: selectedBrand?.name || brand || '',
            categoryName: selectedCategory?.name || '',
            loading: false,
            error: null
          })

          return
        }

        const response = await api.get<ApiResponse<ProductPage>>(
          '/products',
          {
            signal: controller.signal,
            params: {
              status: 'ACTIVE',
              brandId: selectedBrand?.id,
              categoryId: selectedCategory?.id,
              search: search || undefined,
              page,
              limit: LIMIT
            }
          }
        )

        const data = unwrap(response.data)

        if (controller.signal.aborted) return

        setState({
          key,
          data,
          brandName: selectedBrand?.name || '',
          categoryName: selectedCategory?.name || '',
          loading: false,
          error: null
        })
      } catch (error) {
        if (controller.signal.aborted) return

        setState({
          key,
          data: null,
          brandName: '',
          categoryName: '',
          loading: false,
          error: getErrorMessage(error)
        })
      }
    }

    void load()

    return () => controller.abort()
  }, [brandId, brand, categoryId, search, page, refresh, key])

  // Hide previous results immediately when filters change.
  const current = state.key === key
  const loading = !current || state.loading
  const error = current ? state.error : null
  const data = current ? state.data : null

  const brandName = current ? state.brandName : ''
  const categoryName = current ? state.categoryName : ''

  const heading =
    [brandName, categoryName].filter(Boolean).join(' · ') ||
    (hasBrand
      ? 'Brand Products'
      : hasCategory
        ? 'Category Products'
        : 'Shop DLinkUp')

  const emptyMessage = search
    ? 'No products match your search and selected filters. Try another search or browse our catalogue.'
    : hasBrand && hasCategory
      ? 'There are currently no products available for this brand in the selected category.'
      : hasBrand
        ? 'There are currently no products available for this brand. Please check back soon.'
        : hasCategory
          ? 'There are currently no products available in this category. Please check back soon.'
          : 'Our catalogue is being updated. Please check back soon for available devices and accessories.'

  function updatePage(nextPage: number) {
    const next = new URLSearchParams(params)

    next.set('page', String(nextPage))
    setParams(next)
  }

  function removeFilter(...names: string[]) {
    const next = new URLSearchParams(params)

    names.forEach((name) => next.delete(name))
    next.delete('page')

    setParams(next)
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const next = new URLSearchParams(params)
    const value = searchInput.trim()

    if (value) {
      next.set('search', value)
    } else {
      next.delete('search')
    }

    next.delete('page')
    setParams(next)
  }

  return (
    <WebsiteLayout>
      <Box
        bg="#f7f9fc"
        color={NAVY}
        minH="75vh"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        <Box
          bg="white"
          borderBottom="1px solid"
          borderColor={BORDER}
        >
          <Container
            maxW="1440px"
            py={{ base: 8, md: 12 }}
            px={{ base: 5, md: 8 }}
          >
            <Text
              color={BLUE}
              fontWeight="700"
              fontSize="xs"
              textTransform="uppercase"
              letterSpacing="0.15em"
            >
              Discover your next device
            </Text>

            <Heading
              as="h1"
              mt={3}
              fontSize={{ base: '30px', md: '44px' }}
              letterSpacing="-0.04em"
            >
              {heading}
            </Heading>

            <Text mt={3} color={MUTED}>
              {hasBrand && hasCategory
                ? 'Browse your selected brand and category.'
                : hasBrand
                  ? 'Browse products from your selected brand.'
                  : hasCategory
                    ? 'Browse products in your selected category.'
                    : 'Explore our devices, consoles and accessories.'}
            </Text>

            {filtered && (
              <Flex mt={5} gap={3} flexWrap="wrap">
                {hasBrand && (
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor={BORDER}
                    onClick={() => removeFilter('brandId', 'brand')}
                  >
                    Clear brand
                  </Button>
                )}

                {hasCategory && (
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor={BORDER}
                    onClick={() => removeFilter('categoryId')}
                  >
                    Clear category
                  </Button>
                )}

                {search && (
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor={BORDER}
                    onClick={() => removeFilter('search')}
                  >
                    Clear search
                  </Button>
                )}
              </Flex>
            )}
          </Container>
        </Box>

        <Container
          maxW="1440px"
          px={{ base: 5, md: 8 }}
          py={8}
        >
          <Flex
            gap={4}
            align={{ base: 'stretch', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            mb={7}
          >
            <Box
              as="form"
              onSubmit={submitSearch}
              w="full"
              maxW="600px"
            >
              <HStack>
                <Input
                  aria-label="Search products"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(event.target.value)
                  }
                  bg="white"
                  borderColor={BORDER}
                  borderRadius="10px"
                  focusBorderColor={BLUE}
                />

                <Button
                  type="submit"
                  bg={BLUE}
                  color="white"
                  px={6}
                  _hover={{ bg: '#007ada' }}
                >
                  Search
                </Button>
              </HStack>
            </Box>

            {!loading && !error && data && (
              <Text
                color={MUTED}
                fontSize="sm"
                whiteSpace="nowrap"
              >
                {data.pagination.total}{' '}
                {data.pagination.total === 1
                  ? 'product'
                  : 'products'}
              </Text>
            )}
          </Flex>

          <Box aria-busy={loading}>
            {loading ? (
              <SimpleGrid
                columns={{ base: 1, sm: 2, lg: 3, xl: 4 }}
                spacing={5}
              >
                {Array.from({ length: 8 }, (_, index) => (
                  <Skeleton
                    key={index}
                    h="420px"
                    borderRadius="16px"
                  />
                ))}
              </SimpleGrid>
            ) : error ? (
              <Alert
                status="error"
                borderRadius="12px"
                flexWrap="wrap"
                gap={3}
              >
                <AlertIcon />

                <Text flex={1}>{error}</Text>

                <Button
                  size="sm"
                  onClick={() =>
                    setRefresh((value) => value + 1)
                  }
                >
                  Retry
                </Button>
              </Alert>
            ) : !data || data.items.length === 0 ? (
              <EmptyProducts
                message={emptyMessage}
                filtered={filtered}
                page={page}
                onFirstPage={() => updatePage(1)}
                onClearFilters={() => setParams({})}
              />
            ) : (
              <>
                <SimpleGrid
                  columns={{ base: 1, sm: 2, lg: 3, xl: 4 }}
                  spacing={5}
                >
                  {data.items.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}
                </SimpleGrid>

                {data.pagination.pages > 1 && (
                  <HStack
                    justify="center"
                    spacing={4}
                    mt={10}
                  >
                    <Button
                      bg="white"
                      border="1px solid"
                      borderColor={BORDER}
                      isDisabled={page <= 1}
                      onClick={() => updatePage(page - 1)}
                    >
                      Previous
                    </Button>

                    <Text fontSize="sm" color={MUTED}>
                      Page {page} of {data.pagination.pages}
                    </Text>

                    <Button
                      bg={BLUE}
                      color="white"
                      _hover={{ bg: '#007ada' }}
                      isDisabled={
                        page >= data.pagination.pages
                      }
                      onClick={() => updatePage(page + 1)}
                    >
                      Next
                    </Button>
                  </HStack>
                )}
              </>
            )}
          </Box>
        </Container>
      </Box>
    </WebsiteLayout>
  )
}