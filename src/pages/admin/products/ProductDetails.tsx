import {
  Alert,
  AlertIcon,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Image,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react'
import { Archive, ArrowLeft, Edit3, ImageOff, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuthContext } from '../../../context'

import {
  archiveCatalogueProduct,
  fetchCatalogueProduct,
  getCatalogueError,
  getCatalogueImage,
  type CatalogueProduct
} from '../../../rest/api/productCatalogue'

const BLUE = '#008fff'
const NAVY = '#07132b'
const BORDER = '#e3eaf3'
const MUTED = '#7183a0'

function formatMoney(value?: string | null): string {
  if (value == null || value === '') return '—'

  const amount = Number(value)

  if (!Number.isFinite(amount)) return '—'

  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount)
}

function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box minW={0}>
      <Text color={MUTED} fontSize="xs" mb={1}>
        {label}
      </Text>

      <Box fontWeight="600" fontSize="sm" overflowWrap="anywhere">
        {children}
      </Box>
    </Box>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor={BORDER}
      borderRadius="12px"
      p={{ base: 5, md: 6 }}
    >
      <Text fontSize="16px" fontWeight="800" mb={5}>
        {title}
      </Text>

      {children}
    </Box>
  )
}

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>()
  const { token, user } = useAuthContext()
  const navigate = useNavigate()
  const toast = useToast()

  const [refresh, setRefresh] = useState(0)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const [state, setState] = useState<{
    key: string
    product: CatalogueProduct | null
    error: string | null
  }>({
    key: '',
    product: null,
    error: null
  })

  const cancelRef = useRef<HTMLButtonElement>(null)
  const pending = useRef(false)
  const mounted = useRef(false)
  const identityRef = useRef('')

  const identity = JSON.stringify([token, id])
  const requestKey = JSON.stringify([token, id, refresh])

  identityRef.current = identity

  const current = state.key === requestKey
  const product = current ? state.product : null
  const loading = Boolean(token && id) && !current

  const error = !id
    ? 'Product ID is missing.'
    : !token
    ? 'Please sign in to view this product.'
    : current
    ? state.error
    : null

  const canUpdate = Boolean(user?.isSuperAdmin || user?.permissions?.includes('products.update'))

  const canArchive = Boolean(user?.isSuperAdmin || user?.permissions?.includes('products.delete'))

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    setArchiveOpen(false)
  }, [identity])

  useEffect(() => {
    if (!token || !id) return

    const activeToken = token
    const productId = id
    const controller = new AbortController()

    async function load() {
      try {
        const result = await fetchCatalogueProduct(activeToken, productId, controller.signal)

        if (!controller.signal.aborted) {
          setState({
            key: requestKey,
            product: result,
            error: null
          })
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            key: requestKey,
            product: null,
            error: getCatalogueError(error)
          })
        }
      }
    }

    void load()

    return () => controller.abort()
  }, [token, id, requestKey])

  function closeArchive() {
    if (!pending.current) {
      setArchiveOpen(false)
    }
  }

  async function handleArchive() {
    if (!product || !token || !canArchive || pending.current) {
      return
    }

    const operationIdentity = identity

    pending.current = true
    setArchiving(true)

    try {
      await archiveCatalogueProduct(token, product.id)

      if (!mounted.current || identityRef.current !== operationIdentity) {
        return
      }

      toast({
        title: 'Product archived',
        description: 'The product is no longer active in the storefront.',
        status: 'success',
        duration: 3500,
        isClosable: true
      })

      navigate('/admin/products', { replace: true })
    } catch (error) {
      if (mounted.current && identityRef.current === operationIdentity) {
        toast({
          title: 'Unable to archive product',
          description: getCatalogueError(error),
          status: 'error',
          duration: 5000,
          isClosable: true
        })
      }
    } finally {
      pending.current = false

      if (mounted.current) {
        setArchiving(false)
      }
    }
  }

  const image = product ? getCatalogueImage(product) : undefined

  const availableStock =
    product?.variants.reduce(
      (total, variant) =>
        total +
        (variant.availableQuantity ??
          (variant.inventory?.physicalQuantity ?? 0) - (variant.inventory?.reservedQuantity ?? 0)),
      0
    ) ?? 0

  const statusColor =
    product?.status === 'ACTIVE' ? 'green' : product?.status === 'DRAFT' ? 'orange' : 'gray'

  const imageFallback = (
    <Center h="320px" color={MUTED} flexDirection="column" gap={3}>
      <ImageOff size={36} />
      <Text fontSize="sm">Image unavailable</Text>
    </Center>
  )

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
          Product Details
        </Text>

        <Button
          variant="ghost"
          leftIcon={<ArrowLeft size={16} />}
          isDisabled={archiving}
          onClick={() => navigate('/admin/products')}
        >
          Products
        </Button>
      </Flex>

      <Box maxW="1400px" mx="auto" px={{ base: 4, md: 8 }} py={8}>
        {error ? (
          <Stack spacing={4}>
            <Alert status="error" borderRadius="8px">
              <AlertIcon />
              {error}
            </Alert>

            {token && id && (
              <Button alignSelf="flex-start" onClick={() => setRefresh((value) => value + 1)}>
                Retry
              </Button>
            )}
          </Stack>
        ) : loading ? (
          <Center minH="400px">
            <Spinner color={BLUE} size="lg" />
          </Center>
        ) : product ? (
          <>
            <Flex
              direction={{ base: 'column', lg: 'row' }}
              justify="space-between"
              align={{ base: 'stretch', lg: 'center' }}
              gap={5}
              mb={6}
            >
              <Box minW={0}>
                <HStack spacing={3} flexWrap="wrap">
                  <Text
                    as="h2"
                    fontSize={{ base: '25px', md: '30px' }}
                    fontWeight="800"
                    letterSpacing="-0.04em"
                  >
                    {product.name}
                  </Text>

                  <Badge colorScheme={statusColor}>{product.status}</Badge>

                  {product.isFeatured && <Badge colorScheme="blue">Featured</Badge>}
                </HStack>

                <Text mt={2} color={MUTED} fontSize="sm" overflowWrap="anywhere">
                  {product.slug}
                </Text>
              </Box>

              <HStack spacing={3} flexWrap="wrap">
                <Button
                  variant="outline"
                  borderColor={BORDER}
                  bg="white"
                  leftIcon={<RefreshCw size={16} />}
                  isDisabled={archiving}
                  onClick={() => setRefresh((value) => value + 1)}
                >
                  Refresh
                </Button>

                {canUpdate && (
                  <Button
                    bg={BLUE}
                    color="white"
                    leftIcon={<Edit3 size={16} />}
                    isDisabled={archiving}
                    _hover={{ bg: '#007bdc' }}
                    onClick={() =>
                      navigate(`/admin/products/${encodeURIComponent(product.id)}/edit`)
                    }
                  >
                    Edit Product
                  </Button>
                )}

                {canArchive && product.status !== 'ARCHIVED' && (
                  <Button
                    variant="outline"
                    colorScheme="red"
                    leftIcon={<Archive size={16} />}
                    onClick={() => setArchiveOpen(true)}
                  >
                    Archive
                  </Button>
                )}
              </HStack>
            </Flex>

            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} alignItems="start">
              <Stack spacing={6}>
                <Box
                  bg="white"
                  border="1px solid"
                  borderColor={BORDER}
                  borderRadius="12px"
                  overflow="hidden"
                >
                  {image ? (
                    <Image
                      key={image}
                      src={image}
                      alt={product.name}
                      w="full"
                      h="320px"
                      objectFit="contain"
                      p={6}
                      fallback={imageFallback}
                    />
                  ) : (
                    imageFallback
                  )}

                  <Box p={5} borderTop="1px solid" borderColor={BORDER}>
                    <DetailItem label="Product ID">{product.id}</DetailItem>
                  </Box>
                </Box>

                <Panel title="Record information">
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={5}>
                    <DetailItem label="Created">{formatDate(product.createdAt)}</DetailItem>

                    <DetailItem label="Last updated">{formatDate(product.updatedAt)}</DetailItem>
                  </SimpleGrid>
                </Panel>
              </Stack>

              <Stack spacing={6}>
                <Panel title="Product information">
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={5}>
                    <DetailItem label="Brand">{product.brand?.name || '—'}</DetailItem>

                    <DetailItem label="Category">{product.category?.name || '—'}</DetailItem>

                    <DetailItem label="Available stock">
                      <Badge colorScheme={availableStock > 0 ? 'green' : 'red'}>
                        {availableStock} available
                      </Badge>
                    </DetailItem>

                    <DetailItem label="Warranty">
                      {product.warrantyMonths == null
                        ? 'Not specified'
                        : `${product.warrantyMonths} months`}
                    </DetailItem>
                  </SimpleGrid>

                  {product.shortDescription && (
                    <Text mt={5} color={MUTED} fontSize="sm">
                      {product.shortDescription}
                    </Text>
                  )}
                </Panel>

                <Panel title="Description">
                  <Text
                    color={MUTED}
                    whiteSpace="pre-wrap"
                    overflowWrap="anywhere"
                    fontSize="sm"
                    lineHeight="1.8"
                  >
                    {product.description || 'No description provided.'}
                  </Text>
                </Panel>

                <Panel title="Variants and inventory">
                  {product.variants.length === 0 ? (
                    <Text color={MUTED} fontSize="sm">
                      No variants available.
                    </Text>
                  ) : (
                    <Stack spacing={5}>
                      {product.variants.map((variant) => {
                        const available =
                          variant.availableQuantity ??
                          (variant.inventory?.physicalQuantity ?? 0) -
                            (variant.inventory?.reservedQuantity ?? 0)

                        return (
                          <Box
                            key={variant.id}
                            p={4}
                            bg="#f8fafd"
                            border="1px solid"
                            borderColor={BORDER}
                            borderRadius="8px"
                          >
                            <Text fontWeight="700" fontSize="sm" overflowWrap="anywhere" mb={4}>
                              {variant.sku}
                            </Text>

                            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                              <DetailItem label="Regular price">
                                {formatMoney(variant.price)}
                              </DetailItem>

                              <DetailItem label="Sale price">
                                {formatMoney(variant.salePrice)}
                              </DetailItem>

                              <DetailItem label="Physical stock">
                                {variant.inventory?.physicalQuantity ?? 0}
                              </DetailItem>

                              <DetailItem label="Reserved stock">
                                {variant.inventory?.reservedQuantity ?? 0}
                              </DetailItem>

                              <DetailItem label="Available stock">{available}</DetailItem>

                              <DetailItem label="Variant status">
                                <Badge colorScheme={variant.isActive ? 'green' : 'gray'}>
                                  {variant.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </DetailItem>
                            </SimpleGrid>
                          </Box>
                        )
                      })}
                    </Stack>
                  )}

                  {canUpdate && product.variants.length > 0 && (
                    <Button
                      mt={5}
                      variant="outline"
                      borderColor={BORDER}
                      color={BLUE}
                      onClick={() =>
                        navigate(`/admin/products/${encodeURIComponent(product.id)}/edit`)
                      }
                    >
                      Edit Details and Adjust Stock
                    </Button>
                  )}
                </Panel>
              </Stack>
            </SimpleGrid>
          </>
        ) : null}
      </Box>

      <AlertDialog
        isOpen={archiveOpen}
        leastDestructiveRef={cancelRef}
        onClose={closeArchive}
        isCentered
        closeOnOverlayClick={!archiving}
        closeOnEsc={!archiving}
      >
        <AlertDialogOverlay>
          <AlertDialogContent mx={4} bg="white" color={NAVY} borderRadius="12px">
            <AlertDialogHeader>Archive product?</AlertDialogHeader>

            <AlertDialogBody color={MUTED}>
              Archive “{product?.name}”? It will no longer appear in the active storefront
              catalogue.
            </AlertDialogBody>

            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} isDisabled={archiving} onClick={closeArchive}>
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
