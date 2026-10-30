import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text
} from '@chakra-ui/react'
import axios from 'axios'
import { ImageOff, PackageSearch, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { API_HOST } from '../utils/contants'

interface Product {
  id: string
  name: string
  brand?: {
    name: string
  } | null
  images: Array<{
    id: string
    isPrimary: boolean
    position: number
    fileUpload?: {
      publicUrl?: string | null
      url?: string | null
      path?: string | null
      objectKey?: string | null
    } | null
  }>
  variants: Array<{
    price: string
    salePrice?: string | null
    isActive: boolean
  }>
}

interface SearchResponse {
  success: boolean
  data: {
    items: Product[]
    pagination: {
      total: number
    }
  }
}

interface Props {
  isOpen: boolean
  onClose: () => void
  search: string
}

const BLUE = '#008fff'
const NAVY = '#07132b'
const MUTED = '#7183a0'

const api = axios.create({
  baseURL: `${API_HOST.trim().replace(/\/+$/, '')}/api/v1`,
  timeout: 20_000
})

function getImage(product: Product): string | null {
  const images = [...product.images].sort(
    (a, b) =>
      Number(b.isPrimary) - Number(a.isPrimary) ||
      a.position - b.position
  )

  const base = import.meta.env.VITE_SPACES_PUBLIC_URL
    ?.trim()
    .replace(/\/+$/, '')

  for (const image of images) {
    const file = image.fileUpload
    const value = (
      file?.publicUrl ||
      file?.url ||
      file?.path ||
      file?.objectKey
    )?.trim()

    if (!value) continue
    if (/^https?:\/\//i.test(value)) return value

    if (base) {
      return `${base}/${value.replace(/^\/+/, '')}`
    }
  }

  return null
}

function getPrice(product: Product): string {
  const prices = product.variants
    .filter((variant) => variant.isActive)
    .map((variant) => Number(variant.salePrice ?? variant.price))
    .filter((value) => Number.isFinite(value) && value >= 0)

  if (!prices.length) return 'Price unavailable'

  const formatted = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(Math.min(...prices))

  return `${new Set(prices).size > 1 ? 'From ' : ''}${formatted}`
}

export default function ProductSearchModal({
  isOpen,
  onClose,
  search
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(search)
  const [retry, setRetry] = useState(0)

  const term = query.trim()

  const [state, setState] = useState<{
    term: string
    products: Product[]
    total: number
    loading: boolean
    error: string | null
  }>({
    term: '',
    products: [],
    total: 0,
    loading: false,
    error: null
  })

  useEffect(() => {
    if (isOpen) setQuery(search)
  }, [isOpen, search])

  useEffect(() => {
    if (!isOpen || !term) return

    const controller = new AbortController()

    setState({
      term,
      products: [],
      total: 0,
      loading: true,
      error: null
    })

    // Debounce edits made inside the popup.
    const timer = window.setTimeout(async () => {
      try {
        const response = await api.get<SearchResponse>('/products', {
          signal: controller.signal,
          params: {
            search: term,
            status: 'ACTIVE',
            page: 1,
            limit: 8
          }
        })

        if (!response.data.success || !response.data.data) {
          throw new Error('Search failed.')
        }

        if (controller.signal.aborted) return

        setState({
          term,
          products: response.data.data.items,
          total: response.data.data.pagination.total,
          loading: false,
          error: null
        })
      } catch {
        if (controller.signal.aborted) return

        setState({
          term,
          products: [],
          total: 0,
          loading: false,
          error: 'Unable to search products. Please try again.'
        })
      }
    }, 300)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [isOpen, term, retry])

  const current = state.term === term
  const loading = Boolean(term) && (!current || state.loading)
  const error = current ? state.error : null
  const products = current ? state.products : []

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      initialFocusRef={inputRef}
      size="xl"
      scrollBehavior="inside"
      isCentered
    >
      <ModalOverlay bg="blackAlpha.600" />

      <ModalContent
        mx={4}
        bg="white"
        color={NAVY}
        borderRadius="18px"
        maxH="85dvh"
      >
        <ModalHeader pr={12}>
          Search products
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody pb={6}>
          {/* <HStack mb={5} spacing={3}>
            <Search size={20} color={BLUE} />

            <Input
              ref={inputRef}
              aria-label="Search catalogue"
              placeholder="Search products..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              focusBorderColor={BLUE}
              borderColor="#e3eaf3"
              borderRadius="10px"
            />
          </HStack> */}

          {!term ? (
            <Text py={8} textAlign="center" color={MUTED}>
              Enter a product name to search.
            </Text>
          ) : loading ? (
            <Flex py={12} justify="center">
              <Spinner color={BLUE} size="lg" />
            </Flex>
          ) : error ? (
            <Alert
              status="error"
              borderRadius="10px"
              gap={3}
              flexWrap="wrap"
            >
              <AlertIcon />
              <Text flex={1} fontSize="sm">{error}</Text>

              <Button
                size="sm"
                onClick={() => setRetry((value) => value + 1)}
              >
                Retry
              </Button>
            </Alert>
          ) : products.length === 0 ? (
            <Box
              role="status"
              textAlign="center"
              py={10}
              px={4}
              bg="#f7f9fc"
              borderRadius="12px"
            >
              <Flex
                mx="auto"
                boxSize="70px"
                align="center"
                justify="center"
                bg="#eaf6ff"
                color={BLUE}
                borderRadius="full"
              >
                <PackageSearch size={32} />
              </Flex>

              <Heading mt={5} size="sm">
                No products found
              </Heading>

              <Text
                mt={3}
                color={MUTED}
                fontSize="sm"
                overflowWrap="anywhere"
              >
                No products match “{term}”. Try another name.
              </Text>
            </Box>
          ) : (
            <Box aria-live="polite">
              <Text mb={3} color={MUTED} fontSize="sm">
                {state.total} matching{' '}
                {state.total === 1 ? 'product' : 'products'}
              </Text>

              {products.map((product) => {
                const image = getImage(product)

                return (
                  <Flex
                    key={product.id}
                    as={Link}
                    to={`/shop/${encodeURIComponent(product.id)}`}
                    onClick={onClose}
                    gap={4}
                    align="center"
                    p={3}
                    mb={2}
                    border="1px solid"
                    borderColor="#e3eaf3"
                    borderRadius="12px"
                    _hover={{
                      bg: '#f0f8ff',
                      borderColor: BLUE,
                      textDecoration: 'none'
                    }}
                    _focusVisible={{
                      outline: `2px solid ${BLUE}`,
                      outlineOffset: '2px'
                    }}
                  >
                    <Flex
                      boxSize="76px"
                      flexShrink={0}
                      align="center"
                      justify="center"
                      bg="#f7f9fc"
                      borderRadius="8px"
                      overflow="hidden"
                    >
                      {image ? (
                        <Image
                          src={image}
                          alt=""
                          boxSize="full"
                          objectFit="contain"
                          fallback={
                            <ImageOff size={24} color={MUTED} />
                          }
                        />
                      ) : (
                        <ImageOff size={24} color={MUTED} />
                      )}
                    </Flex>

                    <Box flex={1} minW={0}>
                      <Text fontSize="xs" color={BLUE}>
                        {product.brand?.name || 'DLinkUp'}
                      </Text>

                      <Text mt={1} fontWeight="700" noOfLines={2}>
                        {product.name}
                      </Text>

                      <Text mt={1} fontSize="sm" color={MUTED}>
                        {getPrice(product)}
                      </Text>
                    </Box>
                  </Flex>
                )
              })}
            </Box>
          )}
        </ModalBody>

        <ModalFooter borderTop="1px solid #e3eaf3" gap={3}>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>

          {term && !loading && !error && products.length > 0 && (
            <Button
              as={Link}
              to={`/shop?${new URLSearchParams({ search: term })}`}
              onClick={onClose}
              bg={BLUE}
              color="white"
              _hover={{ bg: '#007ada', textDecoration: 'none' }}
            >
              View all results
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}