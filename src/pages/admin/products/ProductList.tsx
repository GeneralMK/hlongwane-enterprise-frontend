import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertIcon,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Image,
  Input,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast
} from '@chakra-ui/react'
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Plus,
  RefreshCw
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthContext } from '../../../context'

import {
  archiveCatalogueProduct,
  fetchCatalogueCategories,
  fetchCatalogueProducts,
  getCatalogueError,
  getCatalogueImage,
  type CatalogueCategory,
  type CatalogueProduct,
  type ProductPage,
  type ProductStatus
} from '../../../rest/api/productCatalogue'

const BLUE = '#008fff'
const NAVY = '#07132b'
const BORDER = '#e3eaf3'
const MUTED = '#7183a0'
const LIMIT = 20

type QueryState = {
  key: string
  data: ProductPage | null
  error: string | null
  loading: boolean
}

function formatMoney(value: string): string {
  const amount = Number(value)

  if (!Number.isFinite(amount)) return '—'

  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2
  }).format(amount)
}

function getPrice(product: CatalogueProduct): string {
  const prices = product.variants
    .map((variant: { salePrice: any; price: any }) => variant.salePrice ?? variant.price)
    .filter((value: any) => Number.isFinite(Number(value)))
    .sort((a: any, b: any) => Number(a) - Number(b))

  const lowest = prices[0]
  const highest = prices[prices.length - 1]

  if (lowest === undefined || highest === undefined) {
    return 'No price'
  }

  return Number(lowest) === Number(highest)
    ? formatMoney(lowest)
    : `From ${formatMoney(lowest)}`
}

function getAvailableStock(product: CatalogueProduct): number {
  return product.variants.reduce((total: number, variant: { availableQuantity: number | null; inventory: { physicalQuantity: number; reservedQuantity: number } }) => {
    return total + (
      variant.availableQuantity ??
      (
        (variant.inventory?.physicalQuantity ?? 0) -
        (variant.inventory?.reservedQuantity ?? 0)
      )
    )
  }, 0)
}

function getStatusColor(status: ProductStatus): string {
  if (status === 'ACTIVE') return 'green'
  if (status === 'DRAFT') return 'orange'

  return 'gray'
}

function ProductThumbnail({
  product
}: {
  product: CatalogueProduct
}) {
  const source = getCatalogueImage(product)

  const fallback = (
    <Center
      w="64px"
      h="64px"
      bg="#f2f6fb"
      color="#8c9ab0"
    >
      <ImageOff size={22} />
    </Center>
  )

  return (
    <Box
      w="64px"
      h="64px"
      flexShrink={0}
      overflow="hidden"
      bg="white"
      border="1px solid"
      borderColor={BORDER}
      borderRadius="8px"
    >
      {source ? (
        <Image
          key={source}
          src={source}
          alt=""
          w="full"
          h="full"
          p={1}
          objectFit="contain"
          loading="lazy"
          fallback={fallback}
        />
      ) : fallback}
    </Box>
  )
}

export default function ProductList() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, token } = useAuthContext()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<ProductStatus | ''>('')
  const [page, setPage] = useState(1)
  const [refresh, setRefresh] = useState(0)

  const [categoryState, setCategoryState] = useState<{
    token: string | null
    items: CatalogueCategory[]
    error: string | null
  }>({
    token: null,
    items: [],
    error: null
  })

  const [query, setQuery] = useState<QueryState>({
    key: '',
    data: null,
    error: null,
    loading: false
  })

  const [selectedProduct, setSelectedProduct] =
    useState<CatalogueProduct | null>(null)

  const [archiving, setArchiving] = useState(false)

  const cancelRef = useRef<HTMLButtonElement>(null)
  const archivePending = useRef(false)
  const mounted = useRef(false)
  const currentToken = useRef(token)

  currentToken.current = token

  const canCreate = Boolean(
    user?.isSuperAdmin ||
    user?.permissions?.includes('products.create')
  )

  const canUpdate = Boolean(
    user?.isSuperAdmin ||
    user?.permissions?.includes('products.update')
  )

  const canArchive = Boolean(
    user?.isSuperAdmin ||
    user?.permissions?.includes('products.delete')
  )

  const requestKey = JSON.stringify([
    token,
    page,
    debouncedSearch,
    categoryId,
    status,
    refresh
  ])

  const current = query.key === requestKey
  const data = current ? query.data : null
  const error = current ? query.error : null
  const loading = Boolean(token) && (!current || query.loading)

  const products: CatalogueProduct[] = data?.items ?? []
  const pagination = data?.pagination

  const categories =
    categoryState.token === token ? categoryState.items : []

  const categoriesError =
    categoryState.token === token ? categoryState.error : null

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    setSelectedProduct(null)
  }, [token])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    if (!token) return

    const activeToken = token
    const controller = new AbortController()

    async function loadCategories() {
      try {
        const items = await fetchCatalogueCategories(
          activeToken,
          controller.signal
        )

        if (controller.signal.aborted) return

        setCategoryState({
          token: activeToken,
          items,
          error: null
        })
      } catch (error) {
        if (controller.signal.aborted) return

        setCategoryState({
          token: activeToken,
          items: [],
          error: getCatalogueError(error)
        })
      }
    }

    void loadCategories()

    return () => controller.abort()
  }, [token, refresh])

  useEffect(() => {
    if (!token) return

    const activeToken = token
    const controller = new AbortController()

    setQuery({
      key: requestKey,
      data: null,
      error: null,
      loading: true
    })

    async function loadProducts() {
      try {
        const result = await fetchCatalogueProducts(
          activeToken,
          {
            page,
            limit: LIMIT,
            search: debouncedSearch || undefined,
            categoryId: categoryId || undefined,
            status: status || undefined
          },
          controller.signal
        )

        if (controller.signal.aborted) return

        const lastPage = Math.max(1, result.pagination.pages)

        if (page > lastPage) {
          setPage(lastPage)
          return
        }

        setQuery({
          key: requestKey,
          data: result,
          error: null,
          loading: false
        })
      } catch (error) {
        if (controller.signal.aborted) return

        setQuery({
          key: requestKey,
          data: null,
          error: getCatalogueError(error),
          loading: false
        })
      }
    }

    void loadProducts()

    return () => controller.abort()
  }, [
    token,
    page,
    debouncedSearch,
    categoryId,
    status,
    requestKey
  ])

  function refetch() {
    setRefresh((value) => value + 1)
  }

  function closeArchiveDialog() {
    if (!archivePending.current) {
      setSelectedProduct(null)
    }
  }

  async function handleArchive() {
    if (
      !selectedProduct ||
      !token ||
      !canArchive ||
      archivePending.current
    ) {
      return
    }

    const product = selectedProduct
    const operationToken = token

    archivePending.current = true
    setArchiving(true)

    try {
      await archiveCatalogueProduct(operationToken, product.id)

      if (
        !mounted.current ||
        currentToken.current !== operationToken
      ) {
        return
      }

      setSelectedProduct(null)
      refetch()

      toast({
        title: 'Product archived',
        description: `${product.name} was archived successfully.`,
        status: 'success',
        duration: 3500,
        isClosable: true
      })
    } catch (error) {
      if (
        mounted.current &&
        currentToken.current === operationToken
      ) {
        toast({
          title: 'Unable to archive product',
          description: getCatalogueError(error),
          status: 'error',
          duration: 5000,
          isClosable: true
        })
      }
    } finally {
      archivePending.current = false

      if (mounted.current) {
        setArchiving(false)
      }
    }
  }

  return (
    <Box minH="100dvh" bg="#f7f9fc" color={NAVY}>
      <Flex
        minH="72px"
        px={{ base: 4, md: 8 }}
        align="center"
        justify="space-between"
        gap={4}
        bg="white"
        borderBottom="1px solid"
        borderColor={BORDER}
      >
        <Text as="h1" fontSize="21px" fontWeight="800">
          Products
        </Text>

        <Button
          variant="ghost"
          size="sm"
          color={MUTED}
          onClick={() => navigate('/')}
        >
          Back to store
        </Button>
      </Flex>

      <Box
        maxW="1600px"
        mx="auto"
        px={{ base: 4, md: 8 }}
        py={8}
      >
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'center' }}
          justify="space-between"
          gap={4}
          mb={6}
        >
          <Box>
            <Text
              as="h2"
              fontSize={{ base: '25px', md: '30px' }}
              fontWeight="800"
              letterSpacing="-0.04em"
            >
              Your product catalogue
            </Text>

            <Text mt={1} color={MUTED} fontSize="sm">
              Manage devices, accessories, pricing and availability.
            </Text>
          </Box>

          <HStack spacing={3}>
            <Button
              leftIcon={<RefreshCw size={16} />}
              variant="outline"
              borderColor={BORDER}
              bg="white"
              isDisabled={!token || loading}
              onClick={refetch}
            >
              Refresh
            </Button>

            {canCreate && (
              <Button
                leftIcon={<Plus size={18} />}
                bg={BLUE}
                color="white"
                _hover={{ bg: '#007bdc' }}
                onClick={() => navigate('/admin/products/new')}
              >
                Add Product
              </Button>
            )}
          </HStack>
        </Flex>

        <Box
          bg="white"
          border="1px solid"
          borderColor={BORDER}
          borderRadius="12px"
          overflow="hidden"
        >
          <Flex
            p={5}
            gap={3}
            direction={{ base: 'column', lg: 'row' }}
            borderBottom="1px solid"
            borderColor={BORDER}
          >
            <Input
              aria-label="Search products"
              placeholder="Search product names or descriptions..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              flex={1}
              borderColor={BORDER}
              focusBorderColor={BLUE}
              borderRadius="8px"
            />

            <Select
              aria-label="Filter by category"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value)
                setPage(1)
              }}
              w={{ base: 'full', lg: '230px' }}
              borderColor={BORDER}
              focusBorderColor={BLUE}
            >
              <option value="">All categories</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {!category.isActive ? ' (inactive)' : ''}
                </option>
              ))}
            </Select>

            <Select
              aria-label="Filter by status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as ProductStatus | '')
                setPage(1)
              }}
              w={{ base: 'full', lg: '180px' }}
              borderColor={BORDER}
              focusBorderColor={BLUE}
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </Flex>

          {categoriesError && (
            <Alert status="warning">
              <AlertIcon />

              <AlertDescription flex={1}>
                Category filters could not load: {categoriesError}
              </AlertDescription>

              <Button size="sm" onClick={refetch}>
                Retry
              </Button>
            </Alert>
          )}

          {!token ? (
            <Center minH="300px">
              <Text color={MUTED}>
                Please sign in to view products.
              </Text>
            </Center>
          ) : loading ? (
            <Center minH="360px">
              <Spinner
                color={BLUE}
                size="lg"
                thickness="3px"
                label="Loading products"
              />
            </Center>
          ) : error ? (
            <Box p={6}>
              <Alert status="error" borderRadius="8px">
                <AlertIcon />

                <AlertDescription flex={1}>
                  {error}
                </AlertDescription>

                <Button size="sm" onClick={refetch}>
                  Retry
                </Button>
              </Alert>
            </Box>
          ) : products.length === 0 ? (
            <Center
              minH="320px"
              flexDirection="column"
              px={5}
            >
              <Text fontSize="lg" fontWeight="700">
                No products found
              </Text>

              <Text mt={2} color={MUTED} textAlign="center">
                Change your filters or add a product to your catalogue.
              </Text>

              {canCreate && (
                <Button
                  mt={5}
                  bg={BLUE}
                  color="white"
                  _hover={{ bg: '#007bdc' }}
                  onClick={() => navigate('/admin/products/new')}
                >
                  Add Product
                </Button>
              )}
            </Center>
          ) : (
            <Box overflowX="auto">
              <Table minW="1050px" size="sm">
                <Thead bg="#f8fafd">
                  <Tr>
                    {[
                      'Product',
                      'Brand',
                      'Category',
                      'Price',
                      'Available',
                      'Status',
                      'Actions'
                    ].map((heading) => (
                      <Th
                        key={heading}
                        py={4}
                        color={MUTED}
                        borderColor={BORDER}
                        fontSize="11px"
                        letterSpacing="0.04em"
                      >
                        {heading}
                      </Th>
                    ))}
                  </Tr>
                </Thead>

                <Tbody>
                  {products.map((product) => {
                    const stock = getAvailableStock(product)

                    return (
                      <Tr
                        key={product.id}
                        _hover={{ bg: '#fbfdff' }}
                      >
                        <Td py={4} borderColor={BORDER}>
                          <HStack spacing={3}>
                            <ProductThumbnail product={product} />

                            <Box maxW="280px">
                              <Text
                                fontWeight="700"
                                noOfLines={2}
                              >
                                {product.name}
                              </Text>

                              <Text
                                mt={1}
                                color={MUTED}
                                fontSize="xs"
                                noOfLines={1}
                              >
                                {product.shortDescription ||
                                  product.variants[0]?.sku ||
                                  product.slug}
                              </Text>

                              {product.isFeatured && (
                                <Badge
                                  mt={1}
                                  colorScheme="blue"
                                >
                                  Featured
                                </Badge>
                              )}
                            </Box>
                          </HStack>
                        </Td>

                        <Td borderColor={BORDER}>
                          {product.brand?.name || '—'}
                        </Td>

                        <Td borderColor={BORDER}>
                          {product.category?.name || '—'}
                        </Td>

                        <Td
                          borderColor={BORDER}
                          whiteSpace="nowrap"
                        >
                          <Text
                            color="#007bdc"
                            fontWeight="700"
                          >
                            {getPrice(product)}
                          </Text>
                        </Td>

                        <Td borderColor={BORDER}>
                          <Badge
                            colorScheme={stock > 0 ? 'green' : 'red'}
                            px={2}
                            py={1}
                            borderRadius="5px"
                          >
                            {stock > 0
                              ? `${stock} in stock`
                              : 'Out of stock'}
                          </Badge>
                        </Td>

                        <Td borderColor={BORDER}>
                          <Badge
                            colorScheme={getStatusColor(product.status)}
                            px={2}
                            py={1}
                            borderRadius="5px"
                          >
                            {product.status}
                          </Badge>
                        </Td>

                        <Td borderColor={BORDER}>
                          <HStack spacing={2}>
                            {canUpdate && (
                              <Button
                                size="sm"
                                variant="outline"
                                borderColor={BORDER}
                                color={NAVY}
                                onClick={() =>
                                  navigate(
                                    `/admin/products/${encodeURIComponent(product.id)}/edit`
                                  )
                                }
                              >
                                Edit
                              </Button>
                            )}

                            {canArchive &&
                              product.status !== 'ARCHIVED' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  leftIcon={<Archive size={14} />}
                                  isDisabled={archiving}
                                  onClick={() =>
                                    setSelectedProduct(product)
                                  }
                                >
                                  Archive
                                </Button>
                              )}

                            {!canUpdate &&
                              (!canArchive ||
                                product.status === 'ARCHIVED') && (
                                <Text color={MUTED}>—</Text>
                              )}
                          </HStack>
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </Box>
          )}

          {pagination && !loading && !error && (
            <Flex
              p={5}
              gap={4}
              align="center"
              justify="space-between"
              wrap="wrap"
              borderTop="1px solid"
              borderColor={BORDER}
            >
              <Text color={MUTED} fontSize="sm">
                {pagination.total === 0
                  ? '0 products'
                  : `${
                      (pagination.page - 1) * pagination.limit + 1
                    }–${
                      Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )
                    } of ${pagination.total} products`}
              </Text>

              <HStack spacing={2}>
                <Button
                  size="sm"
                  variant="outline"
                  borderColor={BORDER}
                  leftIcon={<ChevronLeft size={16} />}
                  isDisabled={page <= 1}
                  onClick={() =>
                    setPage((value) => Math.max(1, value - 1))
                  }
                >
                  Previous
                </Button>

                <Text fontSize="sm" px={2}>
                  {pagination.page} / {Math.max(1, pagination.pages)}
                </Text>

                <Button
                  size="sm"
                  variant="outline"
                  borderColor={BORDER}
                  rightIcon={<ChevronRight size={16} />}
                  isDisabled={page >= pagination.pages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </HStack>
            </Flex>
          )}
        </Box>
      </Box>

      <AlertDialog
        isOpen={selectedProduct !== null}
        leastDestructiveRef={cancelRef}
        onClose={closeArchiveDialog}
        isCentered
        closeOnOverlayClick={!archiving}
        closeOnEsc={!archiving}
      >
        <AlertDialogOverlay>
          <AlertDialogContent
            mx={4}
            borderRadius="12px"
            color={NAVY}
            bg="white"
          >
            <AlertDialogHeader>
              Archive product?
            </AlertDialogHeader>

            <AlertDialogBody color={MUTED}>
              Archive “{selectedProduct?.name}”? It will no longer
              appear in the active storefront catalogue.
            </AlertDialogBody>

            <AlertDialogFooter gap={3}>
              <Button
                ref={cancelRef}
                onClick={closeArchiveDialog}
                isDisabled={archiving}
              >
                Cancel
              </Button>

              <Button
                colorScheme="red"
                isLoading={archiving}
                loadingText="Archiving"
                onClick={() => void handleArchive()}
              >
                Archive Product
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}