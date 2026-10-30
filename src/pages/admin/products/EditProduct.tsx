import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  Checkbox,
  FormControl,
  FormLabel,
  HStack,
  Image,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Textarea,
  useToast
} from '@chakra-ui/react'
import { ArrowLeft, Save } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuthContext } from '../../../context'

import {
  fetchCatalogueBrands,
  fetchCatalogueCategories,
  fetchCatalogueProduct,
  getCatalogueError,
  getCatalogueImage,
  updateCatalogueProduct,
  type CatalogueBrand,
  type CatalogueCategory,
  type CatalogueProduct,
  type ProductStatus
} from '../../../rest/api/productCatalogue'

import VariantStockAdjustment from './components/VariantStockAdjustment'

const BLUE = '#008fff'
const NAVY = '#07132b'
const BORDER = '#e3eaf3'
const MUTED = '#7183a0'

type ProductForm = {
  name: string
  shortDescription: string
  description: string
  brandId: string
  categoryId: string
  status: ProductStatus
  warrantyMonths: string
  isFeatured: boolean
}

type LoadedEditor = {
  key: string
  product: CatalogueProduct
  brands: CatalogueBrand[]
  categories: CatalogueCategory[]
  form: ProductForm
}

export default function EditProduct() {
  const { id } = useParams<{ id: string }>()
  const { token, user } = useAuthContext()

  const navigate = useNavigate()
  const toast = useToast()

  const [editor, setEditor] = useState<LoadedEditor | null>(null)

  const [loadError, setLoadError] = useState<{
    key: string
    message: string
  } | null>(null)

  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [retry, setRetry] = useState(0)

  const pending = useRef(false)
  const mounted = useRef(false)
  const identityRef = useRef('')

  const identity = JSON.stringify([token, id])
  const loadKey = JSON.stringify([token, id, retry])

  identityRef.current = identity

  const current = editor?.key === loadKey ? editor : null

  const error = loadError?.key === loadKey ? loadError.message : null

  const canUpdate = Boolean(user?.isSuperAdmin || user?.permissions?.includes('products.update'))

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    setSaveError(null)

    if (!token || !id || !canUpdate) return

    const activeToken = token
    const productId = id
    const controller = new AbortController()

    async function load() {
      try {
        const [product, brands, categories] = await Promise.all([
          fetchCatalogueProduct(activeToken, productId, controller.signal),
          fetchCatalogueBrands(activeToken, controller.signal),
          fetchCatalogueCategories(activeToken, controller.signal)
        ])

        if (controller.signal.aborted) return

        setEditor({
          key: loadKey,
          product,
          brands,
          categories,
          form: {
            name: product.name,
            shortDescription: product.shortDescription ?? '',
            description: product.description ?? '',
            brandId: product.brand?.id ?? '',
            categoryId: product.category?.id ?? '',
            status: product.status,
            warrantyMonths: product?.warrantyMonths == null ? '' : String(product.warrantyMonths),
            isFeatured: product.isFeatured
          }
        })

        setLoadError(null)
      } catch (error) {
        if (controller.signal.aborted) return

        setLoadError({
          key: loadKey,
          message: getCatalogueError(error)
        })
      }
    }

    void load()

    return () => controller.abort()
  }, [token, id, canUpdate, loadKey])

  function updateField<K extends keyof ProductForm>(field: K, value: ProductForm[K]) {
    setSaveError(null)

    setEditor((previous) => {
      if (!previous || previous.key !== loadKey) {
        return previous
      }

      return {
        ...previous,
        form: {
          ...previous.form,
          [field]: value
        }
      }
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!current || !token || !id || !canUpdate || pending.current) {
      return
    }

    const { form, product, brands, categories } = current

    const brand = brands.find((item) => item.id === form.brandId)

    const category = categories.find((item) => item.id === form.categoryId)

    if (!form.name.trim()) {
      setSaveError('Enter a product name.')
      return
    }

    if (!brand || !category) {
      setSaveError('Select a valid brand and category.')
      return
    }

    const publishing = form.status === 'ACTIVE'
    const brandChanged = form.brandId !== product.brand?.id
    const categoryChanged = form.categoryId !== product.category?.id

    if ((publishing || brandChanged) && !brand.isActive) {
      setSaveError('Select an active brand.')
      return
    }

    if ((publishing || categoryChanged) && !category.isActive) {
      setSaveError('Select an active category.')
      return
    }

    const warrantyText = form.warrantyMonths.trim()

    const warrantyMonths = warrantyText === '' ? null : Number(warrantyText)

    if (
      warrantyMonths !== null &&
      (!Number.isInteger(warrantyMonths) || warrantyMonths < 0 || warrantyMonths > 2147483647)
    ) {
      setSaveError('Warranty months must be a non-negative whole number.')
      return
    }

    const operationIdentity = identity

    pending.current = true
    setSaving(true)
    setSaveError(null)

    try {
      await updateCatalogueProduct(token, id, {
        name: form.name.trim(),
        shortDescription: form.shortDescription.trim() || null,
        description: form.description.trim() || null,
        status: form.status,
        warrantyMonths,
        isFeatured: form.isFeatured,

        ...(brandChanged ? { brandId: form.brandId } : {}),

        ...(categoryChanged ? { categoryId: form.categoryId } : {})
      })

      if (!mounted.current || identityRef.current !== operationIdentity) {
        return
      }

      toast({
        title: 'Product updated',
        description: 'Your changes were saved successfully.',
        status: 'success',
        duration: 3500,
        isClosable: true
      })

      navigate('/admin/products', {
        replace: true
      })
    } catch (error) {
      if (mounted.current && identityRef.current === operationIdentity) {
        setSaveError(getCatalogueError(error))
      }
    } finally {
      pending.current = false

      if (mounted.current) {
        setSaving(false)
      }
    }
  }

  const pageError = !id
    ? 'Product ID is missing.'
    : !token
    ? 'Please sign in to edit products.'
    : !canUpdate
    ? 'You do not have permission to update products.'
    : error

  const image = current ? getCatalogueImage(current.product) : undefined

  return (
    <Box minH="100dvh" bg="#f7f9fc" color={NAVY}>
      <HStack
        minH="72px"
        px={{ base: 4, md: 8 }}
        justify="space-between"
        spacing={4}
        bg="white"
        borderBottom="1px solid"
        borderColor={BORDER}
      >
        <Text as="h1" fontSize="21px" fontWeight="800">
          Edit Product
        </Text>

        <Button
          type="button"
          variant="ghost"
          leftIcon={<ArrowLeft size={16} />}
          isDisabled={saving}
          onClick={() => navigate('/admin/products')}
        >
          Products
        </Button>
      </HStack>

      <Box maxW="1100px" mx="auto" px={{ base: 4, md: 8 }} py={8}>
        {pageError ? (
          <Stack spacing={4}>
            <Alert status="error" borderRadius="8px">
              <AlertIcon />
              {pageError}
            </Alert>

            {error && (
              <Button
                type="button"
                alignSelf="flex-start"
                onClick={() => setRetry((value) => value + 1)}
              >
                Retry
              </Button>
            )}
          </Stack>
        ) : !current ? (
          <Center minH="350px">
            <Spinner color={BLUE} size="lg" thickness="3px" label="Loading product" />
          </Center>
        ) : (
          <>
            <Text
              as="h2"
              fontSize={{ base: '25px', md: '30px' }}
              fontWeight="800"
              letterSpacing="-0.04em"
              mb={2}
            >
              Update your product
            </Text>

            <Text color={MUTED} mb={6}>
              Edit product details, publishing settings and variant stock.
            </Text>

            <Box as="form" noValidate onSubmit={handleSubmit}>
              {saveError && (
                <Alert status="error" borderRadius="8px" mb={5}>
                  <AlertIcon />
                  {saveError}
                </Alert>
              )}

              <Box as="fieldset" disabled={saving} border={0} p={0} m={0} minW={0}>
                <Stack spacing={5}>
                  {/* Product details */}
                  <Box
                    bg="white"
                    p={{ base: 5, md: 7 }}
                    border="1px solid"
                    borderColor={BORDER}
                    borderRadius="12px"
                  >
                    <Stack spacing={5}>
                      <Text fontWeight="800">Product details</Text>

                      <FormControl isRequired>
                        <FormLabel>Product name</FormLabel>

                        <Input
                          value={current.form.name}
                          focusBorderColor={BLUE}
                          onChange={(event) => updateField('name', event.target.value)}
                        />
                      </FormControl>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                        <FormControl isRequired>
                          <FormLabel>Brand</FormLabel>

                          <Select
                            value={current.form.brandId}
                            focusBorderColor={BLUE}
                            onChange={(event) => updateField('brandId', event.target.value)}
                          >
                            <option value="">Select brand</option>

                            {current.brands.map((brand) => (
                              <option
                                key={brand.id}
                                value={brand.id}
                                disabled={!brand.isActive && brand.id !== current.product.brand?.id}
                              >
                                {brand.name}
                                {!brand.isActive ? ' (inactive)' : ''}
                              </option>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel>Category</FormLabel>

                          <Select
                            value={current.form.categoryId}
                            focusBorderColor={BLUE}
                            onChange={(event) => updateField('categoryId', event.target.value)}
                          >
                            <option value="">Select category</option>

                            {current.categories.map((category) => (
                              <option
                                key={category.id}
                                value={category.id}
                                disabled={
                                  !category.isActive && category.id !== current.product.category?.id
                                }
                              >
                                {category.name}
                                {!category.isActive ? ' (inactive)' : ''}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                      </SimpleGrid>

                      <FormControl>
                        <FormLabel>Short description</FormLabel>

                        <Input
                          value={current.form.shortDescription}
                          focusBorderColor={BLUE}
                          onChange={(event) => updateField('shortDescription', event.target.value)}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Description</FormLabel>

                        <Textarea
                          value={current.form.description}
                          rows={5}
                          focusBorderColor={BLUE}
                          onChange={(event) => updateField('description', event.target.value)}
                        />
                      </FormControl>
                    </Stack>
                  </Box>

                  {/* Publishing */}
                  <Box
                    bg="white"
                    p={{ base: 5, md: 7 }}
                    border="1px solid"
                    borderColor={BORDER}
                    borderRadius="12px"
                  >
                    <Stack spacing={5}>
                      <Text fontWeight="800">Publishing</Text>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                        <FormControl>
                          <FormLabel>Status</FormLabel>

                          <Select
                            value={current.form.status}
                            focusBorderColor={BLUE}
                            onChange={(event) =>
                              updateField('status', event.target.value as ProductStatus)
                            }
                          >
                            <option value="DRAFT">Draft</option>
                            <option value="ACTIVE">Active</option>
                            <option value="ARCHIVED">Archived</option>
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Warranty months</FormLabel>

                          <Input
                            type="number"
                            min={0}
                            max={2147483647}
                            step={1}
                            value={current.form.warrantyMonths}
                            placeholder="Optional"
                            focusBorderColor={BLUE}
                            onChange={(event) => updateField('warrantyMonths', event.target.value)}
                          />
                        </FormControl>
                      </SimpleGrid>

                      <Checkbox
                        colorScheme="blue"
                        isChecked={current.form.isFeatured}
                        onChange={(event) => updateField('isFeatured', event.target.checked)}
                      >
                        Feature this product on the homepage
                      </Checkbox>

                      <FormControl>
                        <FormLabel>Generated slug</FormLabel>

                        <Input value={current.product.slug} isReadOnly bg="#f7f9fc" />
                      </FormControl>
                    </Stack>
                  </Box>

                  {/* Current image */}
                  <Box
                    bg="white"
                    p={{ base: 5, md: 7 }}
                    border="1px solid"
                    borderColor={BORDER}
                    borderRadius="12px"
                  >
                    <Text fontWeight="800" mb={4}>
                      Current product image
                    </Text>

                    {image ? (
                      <Image
                        src={image}
                        alt={current.product.name}
                        h="200px"
                        maxW="full"
                        objectFit="contain"
                        fallback={<Text color={MUTED}>Image unavailable.</Text>}
                      />
                    ) : (
                      <Text color={MUTED}>No image uploaded.</Text>
                    )}
                  </Box>
                </Stack>
              </Box>

              <HStack justify="flex-end" mt={6} spacing={3}>
                <Button
                  type="button"
                  variant="outline"
                  isDisabled={saving}
                  onClick={() => navigate('/admin/products')}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  bg={BLUE}
                  color="white"
                  leftIcon={<Save size={17} />}
                  isLoading={saving}
                  loadingText="Saving"
                  _hover={{ bg: '#007bdc' }}
                >
                  Save Changes
                </Button>
              </HStack>
            </Box>

            {/* Stock adjustments save separately from product details. */}
            <Box
              mt={7}
              bg="white"
              p={{ base: 5, md: 7 }}
              border="1px solid"
              borderColor={BORDER}
              borderRadius="12px"
            >
              <Text fontWeight="800" mb={2}>
                Variants and inventory
              </Text>

              <Text color={MUTED} fontSize="sm" mb={5}>
                Adjust available stock for each variant below. Stock changes save immediately when
                you select Adjust Stock.
              </Text>

              {current.product.variants.length === 0 ? (
                <Alert status="info" borderRadius="8px">
                  <AlertIcon />
                  This product has no variants.
                </Alert>
              ) : (
                <Stack spacing={6}>
                  {current.product.variants.map((variant) => (
                    <Box key={variant.id}>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                        <FormControl>
                          <FormLabel>Generated SKU</FormLabel>

                          <Input value={variant.sku} isReadOnly bg="#f7f9fc" />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Price (ZAR)</FormLabel>

                          <Input
                            value={variant.salePrice ?? variant.price}
                            isReadOnly
                            bg="#f7f9fc"
                          />
                        </FormControl>
                      </SimpleGrid>

                      <VariantStockAdjustment
                        key={`${identity}-${variant.id}`}
                        productId={current.product.id}
                        variantId={variant.id}
                        sku={variant.sku}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}
