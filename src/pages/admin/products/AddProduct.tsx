import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Image,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
  useToast
} from '@chakra-ui/react'
import { ArrowLeft, ImagePlus, Save, Trash2 } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent
} from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuthContext } from '../../../context'
import {
  createProduct,
  getProductError,
  getProductOptions,
  uploadProductImage,
  type CatalogueOption
} from '../../../rest/api/adminProducts'

const BLUE = '#008fff'
const NAVY = '#07132b'
const BORDER = '#e3eaf3'
const MAX_INT = 2_147_483_647

interface ImageDraft {
  key: string
  file: File
  preview: string
  fileUploadId?: string
}

const initialForm = {
  name: '',
  shortDescription: '',
  description: '',
  brandId: '',
  categoryId: '',
  price: '',
  quantity: '0',
  warrantyMonths: '',
  isFeatured: false,
  publish: false
}

export default function AddProduct() {
  const { token } = useAuthContext()
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState(initialForm)
  const [brands, setBrands] = useState<CatalogueOption[]>([])
  const [categories, setCategories] = useState<CatalogueOption[]>([])
  const [images, setImages] = useState<ImageDraft[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [optionsError, setOptionsError] = useState('')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const [reload, setReload] = useState(0)

  const pending = useRef(false)
  const imageRef = useRef<ImageDraft[]>([])
  const fileInput = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  function update<K extends keyof typeof initialForm>(
    field: K,
    value: (typeof initialForm)[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function replaceImages(next: ImageDraft[]) {
    imageRef.current = next
    setImages(next)
  }

  useEffect(() => {
    return () => {
      imageRef.current.forEach((image) => {
        URL.revokeObjectURL(image.preview)
      })
    }
  }, [])

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  useEffect(() => {
    const controller = new AbortController()

    async function loadOptions() {
      setLoading(true)
      setOptionsError('')
      setBrands([])
      setCategories([])

      if (!token) {
        setOptionsError('Please sign in before adding products.')
        setLoading(false)
        return
      }

      try {
        const options = await getProductOptions(
          token,
          controller.signal
        )

        if (controller.signal.aborted) return

        setBrands(options.brands)
        setCategories(options.categories)

        setForm((current) => ({
          ...current,
          brandId: options.brands.some(
            (brand) => brand.id === current.brandId
          )
            ? current.brandId
            : '',
          categoryId: options.categories.some(
            (category) => category.id === current.categoryId
          )
            ? current.categoryId
            : ''
        }))
      } catch (cause) {
        if (!controller.signal.aborted) {
          setOptionsError(getProductError(cause))
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadOptions()

    return () => controller.abort()
  }, [token, reload])

  function selectImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (pending.current || !files.length) return

    if (imageRef.current.length + files.length > 8) {
      setError('You can upload up to eight product images.')
      return
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ]

    if (files.some((file) => !allowedTypes.includes(file.type))) {
      setError('Please select JPG, PNG or WebP images.')
      return
    }

    if (files.some((file) => file.size === 0)) {
      setError('Empty image files cannot be uploaded.')
      return
    }

    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      setError('Each image must be 5 MB or smaller.')
      return
    }

    replaceImages([
      ...imageRef.current,
      ...files.map((file) => ({
        key: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file)
      }))
    ])

    setError('')
  }

  function removeImage(key: string) {
    if (pending.current) return

    const removed = imageRef.current.find(
      (image) => image.key === key
    )

    if (removed) {
      URL.revokeObjectURL(removed.preview)
    }

    replaceImages(
      imageRef.current.filter((image) => image.key !== key)
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (pending.current) return

    setError('')

    if (!token) {
      setError('Please sign in before adding products.')
      return
    }

    if (!form.name.trim()) {
      setError('Product name is required.')
      return
    }

    if (
      !brands.some((brand) => brand.id === form.brandId) ||
      !categories.some((category) => category.id === form.categoryId)
    ) {
      setError('Select an active brand and category.')
      return
    }

    const price = form.price.trim()

    if (!/^\d{1,10}(\.\d{1,2})?$/.test(price)) {
      setError('Enter a valid price with up to two decimal places.')
      return
    }

    const quantity = Number(form.quantity)
    const warrantyMonths = form.warrantyMonths.trim()
      ? Number(form.warrantyMonths)
      : undefined

    if (
      !form.quantity.trim() ||
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      quantity > MAX_INT
    ) {
      setError(
        'Opening stock must be a whole number between 0 and 2,147,483,647.'
      )
      return
    }

    if (
      warrantyMonths !== undefined &&
      (
        !Number.isInteger(warrantyMonths) ||
        warrantyMonths < 0 ||
        warrantyMonths > MAX_INT
      )
    ) {
      setError('Enter a valid number of warranty months.')
      return
    }

    pending.current = true
    setSaving(true)

    try {
      const imageFileIds: string[] = []
      const selectedImages = [...imageRef.current]

      for (let index = 0; index < selectedImages.length; index++) {
        const image = selectedImages[index]
        let fileUploadId = image.fileUploadId

        // Reuse successful uploads if the product save is retried.
        if (!fileUploadId) {
          setProgress(
            `Uploading image ${index + 1} of ${selectedImages.length}…`
          )

          const uploaded = await uploadProductImage(
            image.file,
            token
          )

          fileUploadId = uploaded.id

          replaceImages(
            imageRef.current.map((current) =>
              current.key === image.key
                ? { ...current, fileUploadId }
                : current
            )
          )
        }

        imageFileIds.push(fileUploadId)
      }

      setProgress('Saving product…')

      await createProduct(
        {
          name: form.name.trim(),
          shortDescription:
            form.shortDescription.trim() || undefined,
          description:
            form.description.trim() || undefined,
          brandId: form.brandId,
          categoryId: form.categoryId,
          price,
          quantity,
          warrantyMonths,
          isFeatured: form.isFeatured,
          publish: form.publish,
          imageFileIds
        },
        token
      )

      toast({
        title: form.publish ? 'Product published' : 'Draft saved',
        description: 'Your product was created successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true
      })

      navigate('/admin/products')
    } catch (cause) {
      setError(getProductError(cause))
    } finally {
      pending.current = false
      setSaving(false)
      setProgress('')
    }
  }

  const cannotSave =
    loading ||
    Boolean(optionsError) ||
    !brands.length ||
    !categories.length ||
    !token

  return (
    <Box
      minH="100dvh"
      bg="#f7f9fc"
      color={NAVY}
      fontFamily="Arial, Helvetica, sans-serif"
    >
      <Flex
        px={{ base: 5, md: 8 }}
        py={5}
        bg="white"
        borderBottom="1px solid"
        borderColor={BORDER}
        justify="space-between"
        align="center"
        gap={3}
      >
        <Heading size="md">Add Product</Heading>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          leftIcon={<ArrowLeft size={16} />}
          isDisabled={saving}
          color="gray.600"
          onClick={() => navigate('/admin/products')}
        >
          Products
        </Button>
      </Flex>

      <Container
        maxW="1100px"
        py={8}
        px={{ base: 4, md: 6 }}
      >
        <Heading
          fontSize={{ base: '25px', md: '28px' }}
          letterSpacing="-0.04em"
        >
          Add to your catalogue
        </Heading>

        <Text mt={2} mb={6} color="gray.500">
          Add product details, pricing, stock and images.
        </Text>

        {error && (
          <Alert
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            status="error"
            mb={5}
            borderRadius="8px"
          >
            <AlertIcon />
            <Text>{error}</Text>
          </Alert>
        )}

        {optionsError && (
          <Alert
            status="error"
            mb={5}
            borderRadius="8px"
            gap={3}
            flexWrap="wrap"
          >
            <AlertIcon />
            <Text flex={1}>{optionsError}</Text>

            <Button
              size="sm"
              onClick={() => setReload((current) => current + 1)}
            >
              Retry
            </Button>
          </Alert>
        )}

        {loading ? (
          <HStack py={10}>
            <Spinner color={BLUE} />
            <Text>Loading brands and categories…</Text>
          </HStack>
        ) : (
          <Box as="form" onSubmit={submit}>
            <VStack align="stretch" spacing={6}>
              {!optionsError &&
                (!brands.length || !categories.length) && (
                  <Alert status="warning" borderRadius="8px">
                    <AlertIcon />

                    <Box>
                      <Text>
                        Create at least one active brand and category
                        before adding a product.
                      </Text>

                      <Button
                        type="button"
                        size="sm"
                        mt={2}
                        onClick={() =>
                          setReload((current) => current + 1)
                        }
                      >
                        Reload options
                      </Button>
                    </Box>
                  </Alert>
                )}

              {/* Details */}
              <Box
                as="fieldset"
                disabled={saving}
                border="1px solid"
                borderColor={BORDER}
                borderRadius="12px"
                bg="white"
                p={{ base: 5, md: 7 }}
                minW={0}
              >
                <Heading size="sm" mb={5}>
                  Product details
                </Heading>

                <VStack align="stretch" spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Product name</FormLabel>

                    <Input
                      value={form.name}
                      onChange={(event) =>
                        update('name', event.target.value)
                      }
                      placeholder="Samsung Galaxy S24 Ultra"
                      focusBorderColor={BLUE}
                    />
                  </FormControl>

                  <SimpleGrid
                    columns={{ base: 1, md: 2 }}
                    spacing={4}
                  >
                    <FormControl isRequired>
                      <FormLabel>Brand</FormLabel>

                      <Select
                        placeholder="Select brand"
                        value={form.brandId}
                        onChange={(event) =>
                          update('brandId', event.target.value)
                        }
                        focusBorderColor={BLUE}
                      >
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Category</FormLabel>

                      <Select
                        placeholder="Select category"
                        value={form.categoryId}
                        onChange={(event) =>
                          update('categoryId', event.target.value)
                        }
                        focusBorderColor={BLUE}
                      >
                        {categories.map((category) => (
                          <option
                            key={category.id}
                            value={category.id}
                          >
                            {category.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </SimpleGrid>

                  <FormControl>
                    <FormLabel>Short description</FormLabel>

                    <Input
                      value={form.shortDescription}
                      onChange={(event) =>
                        update('shortDescription', event.target.value)
                      }
                      placeholder="A short introduction to the product"
                      focusBorderColor={BLUE}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Description</FormLabel>

                    <Textarea
                      rows={5}
                      value={form.description}
                      onChange={(event) =>
                        update('description', event.target.value)
                      }
                      placeholder="Describe the product and its features"
                      focusBorderColor={BLUE}
                    />
                  </FormControl>
                </VStack>
              </Box>

              {/* Pricing */}
              <Box
                as="fieldset"
                disabled={saving}
                border="1px solid"
                borderColor={BORDER}
                borderRadius="12px"
                bg="white"
                p={{ base: 5, md: 7 }}
                minW={0}
              >
                <Heading size="sm" mb={5}>
                  Pricing and stock
                </Heading>

                <SimpleGrid
                  columns={{ base: 1, md: 3 }}
                  spacing={4}
                >
                  <FormControl isRequired>
                    <FormLabel>Price (ZAR)</FormLabel>

                    <Input
                      inputMode="decimal"
                      value={form.price}
                      onChange={(event) =>
                        update('price', event.target.value)
                      }
                      placeholder="0.00"
                      focusBorderColor={BLUE}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Opening stock</FormLabel>

                    <Input
                      type="number"
                      min={0}
                      max={MAX_INT}
                      step={1}
                      value={form.quantity}
                      onChange={(event) =>
                        update('quantity', event.target.value)
                      }
                      focusBorderColor={BLUE}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Warranty months</FormLabel>

                    <Input
                      type="number"
                      min={0}
                      max={MAX_INT}
                      step={1}
                      value={form.warrantyMonths}
                      onChange={(event) =>
                        update('warrantyMonths', event.target.value)
                      }
                      placeholder="Optional"
                      focusBorderColor={BLUE}
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>

              {/* Images */}
              <Box
                bg="white"
                p={{ base: 5, md: 7 }}
                border="1px solid"
                borderColor={BORDER}
                borderRadius="12px"
              >
                <Heading size="sm" mb={2}>
                  Product images
                </Heading>

                <Text mb={5} color="gray.500" fontSize="sm">
                  Add up to eight JPG, PNG or WebP images, 5 MB each.
                  The first image is the primary image.
                </Text>

                <Input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  display="none"
                  onChange={selectImages}
                  disabled={saving}
                />

                <Button
                  type="button"
                  variant="outline"
                  color="#0078d4"
                  borderColor="#b5dcff"
                  leftIcon={<ImagePlus size={18} />}
                  onClick={() => fileInput.current?.click()}
                  isDisabled={saving || images.length >= 8}
                  _hover={{ bg: '#eef7ff' }}
                >
                  Select images
                </Button>

                <SimpleGrid
                  columns={{ base: 2, md: 4 }}
                  spacing={4}
                  mt={5}
                >
                  {images.map((image, index) => (
                    <Box
                      key={image.key}
                      position="relative"
                      border="1px solid"
                      borderColor={BORDER}
                      borderRadius="8px"
                      overflow="hidden"
                    >
                      <Image
                        src={image.preview}
                        alt={`Product preview ${index + 1}`}
                        h="150px"
                        w="full"
                        objectFit="contain"
                      />

                      <Text
                        px={3}
                        py={2}
                        fontSize="xs"
                        color="gray.500"
                      >
                        {index === 0
                          ? 'Primary image'
                          : `Image ${index + 1}`}
                      </Text>

                      <IconButton
                        type="button"
                        aria-label={`Remove image ${index + 1}`}
                        icon={<Trash2 size={15} />}
                        size="sm"
                        position="absolute"
                        top={2}
                        right={2}
                        bg="white"
                        color="red.600"
                        isDisabled={saving}
                        onClick={() => removeImage(image.key)}
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>

              {/* Publishing */}
              <Box
                bg="white"
                p={6}
                border="1px solid"
                borderColor={BORDER}
                borderRadius="12px"
              >
                <Heading size="sm" mb={5}>
                  Publishing
                </Heading>

                <VStack align="start" spacing={4}>
                  <Checkbox
                    colorScheme="blue"
                    isChecked={form.isFeatured}
                    isDisabled={saving}
                    onChange={(event) =>
                      update('isFeatured', event.target.checked)
                    }
                  >
                    Feature on the home page
                  </Checkbox>

                  <Checkbox
                    colorScheme="blue"
                    isChecked={form.publish}
                    isDisabled={saving}
                    onChange={(event) =>
                      update('publish', event.target.checked)
                    }
                  >
                    Publish immediately
                  </Checkbox>

                  <Text color="gray.500" fontSize="sm">
                    Unpublished products are saved as drafts.
                    Published products appear in the storefront.
                  </Text>
                </VStack>
              </Box>

              <Flex
                justify="flex-end"
                gap={3}
                direction={{ base: 'column-reverse', sm: 'row' }}
              >
                <Button
                  type="button"
                  variant="outline"
                  h="46px"
                  borderRadius="8px"
                  isDisabled={saving}
                  onClick={() => navigate('/admin/products')}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  bg={BLUE}
                  color="white"
                  px={7}
                  h="46px"
                  borderRadius="8px"
                  leftIcon={<Save size={18} />}
                  isLoading={saving}
                  loadingText={progress || 'Saving…'}
                  isDisabled={cannotSave}
                  _hover={{ bg: '#007ada' }}
                >
                  {form.publish ? 'Publish Product' : 'Save Draft'}
                </Button>
              </Flex>
            </VStack>
          </Box>
        )}
      </Container>
    </Box>
  )
}