import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Center,
  Checkbox,
  CheckboxGroup,
  Collapse,
  Flex,
  Grid,
  GridItem,
  HStack,
  Image,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  VStack,
  useDisclosure
} from '@chakra-ui/react'
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { gql, useQuery } from '@apollo/client'

type EquipmentCatalogueItem = {
  id: string
  createdAt: string
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
  availability: string
  imageUrl?: string | null
}

type PublicEquipmentCatalogueData = {
  publicAgricultureItems: EquipmentCatalogueItem[]
}

const PUBLIC_EQUIPMENT_CATALOGUE_QUERY = gql`
  query PublicEquipmentCatalogue {
    publicAgricultureItems {
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

import images from '../../theme/images'
import WebsiteLayout from '../../layout/WebsiteLayout'

const BRAND = '#173F1F'
const BRAND_HOVER = '#0E2D15'
const BACKGROUND = '#FCFBF7'
const LIGHT_GREEN = '#EDF4E5'
const BORDER = '#E1E7DB'
const TEXT = '#23351F'
const SUBTEXT = '#66715F'

const PAGE_SIZE = 6

type EquipmentItem = EquipmentCatalogueItem

type SortOption = 'price-low-high' | 'price-high-low' | 'newest' | 'name-a-z' | 'name-z-a'

type TransactionType = 'rent' | 'buy'

type FilterState = {
  categories: string[]
  transactions: TransactionType[]
  availability: string[]
  conditions: string[]
}

const INITIAL_FILTERS: FilterState = {
  categories: [],
  transactions: [],
  availability: [],
  conditions: []
}

function getFiltersFromSearchParams(searchParams: URLSearchParams): FilterState {
  const categoryParam = searchParams.get('category')

  const transactionParam = searchParams.get('transaction')

  const availabilityParam = searchParams.get('availability')

  const conditionParam = searchParams.get('condition')

  return {
    categories: categoryParam
      ? categoryParam
          .split(',')
          .map((value) => value.trim().toUpperCase())
          .filter(Boolean)
      : [],

    transactions: transactionParam
      ? transactionParam
          .split(',')
          .map((value) => value.trim().toLowerCase())
          .filter((value): value is TransactionType => value === 'rent' || value === 'buy')
      : [],

    availability: availabilityParam
      ? availabilityParam
          .split(',')
          .map((value) => value.trim().toUpperCase())
          .filter(Boolean)
      : [],

    conditions: conditionParam
      ? conditionParam
          .split(',')
          .map((value) => value.trim().toUpperCase())
          .filter(Boolean)
      : []
  }
}

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

function getStartingPrice(item: EquipmentItem) {
  const prices: number[] = []

  if (item.isForRent && toNumber(item.rentalPrice) > 0) {
    prices.push(toNumber(item.rentalPrice))
  }

  if (item.isForSale && toNumber(item.purchasePrice) > 0) {
    prices.push(toNumber(item.purchasePrice))
  }

  if (prices.length === 0) {
    return Number.MAX_SAFE_INTEGER
  }

  return Math.min(...prices)
}

function getAvailabilityBadge(item: EquipmentItem) {
  switch (item.availability) {
    case 'AVAILABLE':
      if (item.stockQuantity <= 0) {
        return {
          label: 'Out of Stock',
          scheme: 'red'
        }
      }

      return {
        label: 'In Stock',
        scheme: 'green'
      }

    case 'RENTED':
      return {
        label: 'Rented',
        scheme: 'orange'
      }

    case 'SOLD':
      return {
        label: 'Sold',
        scheme: 'purple'
      }

    case 'UNAVAILABLE':
    default:
      return {
        label: 'Unavailable',
        scheme: 'red'
      }
  }
}

export default function EquipmentPage() {
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()

  const mobileFilters = useDisclosure()

  const parsedPage = Number(searchParams.get('page') ?? 1)

  const [currentPage, setCurrentPage] = useState(
    Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1
  )

  const [sort, setSort] = useState<SortOption>('price-low-high')

  const [filters, setFilters] = useState<FilterState>(() =>
    getFiltersFromSearchParams(searchParams)
  )

  useEffect(() => {
    const nextFilters = getFiltersFromSearchParams(searchParams)

    setFilters((current) => {
      const hasChanged =
        current.categories.join(',') !== nextFilters.categories.join(',') ||
        current.transactions.join(',') !== nextFilters.transactions.join(',') ||
        current.availability.join(',') !== nextFilters.availability.join(',') ||
        current.conditions.join(',') !== nextFilters.conditions.join(',')

      return hasChanged ? nextFilters : current
    })
  }, [searchParams])

  const { data, loading, error } = useQuery<PublicEquipmentCatalogueData>(
    PUBLIC_EQUIPMENT_CATALOGUE_QUERY,
    {
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true
    }
  )

  const equipment = data?.publicAgricultureItems ?? []

  const shouldShowSkeleton =
    (loading || Boolean(error)) && equipment.length === 0

  const categories = useMemo(
    () =>
      Array.from(new Set(equipment.map((item) => item.category))).sort((first, second) =>
        first.localeCompare(second)
      ),
    [equipment]
  )

  const conditions = useMemo(
    () =>
      Array.from(new Set(equipment.map((item) => item.condition))).sort((first, second) =>
        first.localeCompare(second)
      ),
    [equipment]
  )

  const availabilityOptions = useMemo(
    () =>
      Array.from(new Set(equipment.map((item) => item.availability))).sort((first, second) =>
        first.localeCompare(second)
      ),
    [equipment]
  )

  const filteredEquipment = useMemo(() => {
    const filtered = equipment.filter((item) => {
      const categoryMatches =
        filters.categories.length === 0 || filters.categories.includes(item.category)

      const conditionMatches =
        filters.conditions.length === 0 || filters.conditions.includes(item.condition)

      const availabilityMatches =
        filters.availability.length === 0 || filters.availability.includes(item.availability)

      const transactionMatches =
        filters.transactions.length === 0 ||
        filters.transactions.some((transaction) => {
          if (transaction === 'rent') {
            return item.isForRent
          }

          return item.isForSale
        })

      return categoryMatches && conditionMatches && availabilityMatches && transactionMatches
    })

    return [...filtered].sort((first, second) => {
      switch (sort) {
        case 'price-high-low':
          return getStartingPrice(second) - getStartingPrice(first)

        case 'name-a-z':
          return first.name.localeCompare(second.name)

        case 'name-z-a':
          return second.name.localeCompare(first.name)

        case 'newest':
          return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()

        case 'price-low-high':
        default:
          return getStartingPrice(first) - getStartingPrice(second)
      }
    })
  }, [equipment, filters, sort])

  const totalPages = Math.max(Math.ceil(filteredEquipment.length / PAGE_SIZE), 1)

  const paginatedEquipment = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE

    return filteredEquipment.slice(start, start + PAGE_SIZE)
  }, [currentPage, filteredEquipment])

  const hasFilters =
    filters.categories.length > 0 ||
    filters.transactions.length > 0 ||
    filters.availability.length > 0 ||
    filters.conditions.length > 0

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)

    next.set('page', String(currentPage))

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, {
        replace: true
      })
    }
  }, [currentPage, searchParams, setSearchParams])

  const changePage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages)

    setCurrentPage(nextPage)

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const updateFilter = (key: keyof FilterState, values: string[]) => {
    setFilters((current) => ({
      ...current,
      [key]: values
    }))

    const next = new URLSearchParams(searchParams)

    const parameterMap: Record<keyof FilterState, string> = {
      categories: 'category',
      transactions: 'transaction',
      availability: 'availability',
      conditions: 'condition'
    }

    const parameterName = parameterMap[key]

    if (values.length > 0) {
      next.set(parameterName, values.join(','))
    } else {
      next.delete(parameterName)
    }

    next.set('page', '1')

    setSearchParams(next, {
      replace: true
    })

    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS)
    setCurrentPage(1)

    const next = new URLSearchParams(searchParams)

    next.delete('category')
    next.delete('transaction')
    next.delete('availability')
    next.delete('condition')
    next.set('page', '1')

    setSearchParams(next, {
      replace: true
    })
  }

  return (
    <WebsiteLayout>
      <Box minH="auto" bg={BACKGROUND} color={TEXT}>
        <Box bg={LIGHT_GREEN} minH="58px" display="flex" alignItems="center">
          <Box
            width="100%"
            maxW="1180px"
            mx="auto"
            px={{
              base: 5,
              md: 8
            }}
          >
            <HStack spacing={2} color={SUBTEXT} fontSize="13px">
              <Link to="/">Home</Link>

              <Text>&gt;</Text>

              <Text>Equipment</Text>
            </HStack>
          </Box>
        </Box>

        <Box
          width="80%"
          mx="auto"
          px={{
            base: 5,
            md: 8
          }}
          pt={{
            base: 8,
            md: 10
          }}
          pb={16}
        >
          <Flex
            justify="space-between"
            align={{
              base: 'stretch',
              md: 'center'
            }}
            direction={{
              base: 'column',
              md: 'row'
            }}
            gap={5}
            mb={7}
          >
            <Box>
              <Text
                as="h1"
                color={BRAND}
                fontSize={{
                  base: '32px',
                  md: '42px'
                }}
                fontWeight="800"
                lineHeight="1.05"
                letterSpacing="-0.02em"
              >
                Equipment Catalogue
              </Text>

              {!shouldShowSkeleton ? (
                <Text mt={2} color={SUBTEXT} fontSize="14px">
                  {filteredEquipment.length}{' '}
                  {filteredEquipment.length === 1 ? 'product' : 'products'} found
                </Text>
              ) : null}
            </Box>

            <HStack
              width={{
                base: '100%',
                md: 'auto'
              }}
              spacing={3}
            >
              <Button
                display={{
                  base: 'flex',
                  lg: 'none'
                }}
                leftIcon={<Filter size={17} />}
                variant="outline"
                borderColor={BORDER}
                bg="white"
                onClick={mobileFilters.onToggle}
              >
                Filters
              </Button>

              <Select
                width={{
                  base: '100%',
                  md: '190px'
                }}
                height="42px"
                bg="white"
                borderColor="#CBD7BE"
                borderRadius="10px"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as SortOption)
                  setCurrentPage(1)
                }}
              >
                <option value="price-low-high">Price: Low to High</option>

                <option value="price-high-low">Price: High to Low</option>

                <option value="newest">Newest</option>

                <option value="name-a-z">Name: A to Z</option>

                <option value="name-z-a">Name: Z to A</option>
              </Select>
            </HStack>
          </Flex>

          <Collapse in={mobileFilters.isOpen} animateOpacity>
            <Box
              display={{
                base: 'block',
                lg: 'none'
              }}
              mb={6}
            >
              <EquipmentFilters
                categories={categories}
                conditions={conditions}
                availabilityOptions={availabilityOptions}
                filters={filters}
                hasFilters={hasFilters}
                onChange={updateFilter}
                onClear={clearFilters}
              />
            </Box>
          </Collapse>

          <Grid
              templateColumns={{
                base: 'minmax(0, 1fr)',
                lg: '220px minmax(0, 1fr)'
              }}
              gap={6}
              alignItems="start"
            >
              <GridItem
                display={{
                  base: 'none',
                  lg: 'block'
                }}
              >
                <EquipmentFilters
                  categories={categories}
                  conditions={conditions}
                  availabilityOptions={availabilityOptions}
                  filters={filters}
                  hasFilters={hasFilters}
                  onChange={updateFilter}
                  onClear={clearFilters}
                />
              </GridItem>

              <GridItem minW={0}>
                {shouldShowSkeleton ? (
                  <EquipmentSkeleton />
                ) : paginatedEquipment.length === 0 ? (
                  <EmptyEquipment hasFilters={hasFilters} onClear={clearFilters} />
                ) : (
                  <>
                    <SimpleGrid
                      columns={{
                        base: 1,
                        md: 2,
                        xl: 3
                      }}
                      spacing={5}
                      alignItems="stretch"
                    >
                      {paginatedEquipment.map((item) => (
                        <EquipmentCard
                          key={item.id}
                          item={item}
                          onView={() => navigate(`/equipment/${item.id}`)}
                        />
                      ))}
                    </SimpleGrid>

                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onChange={changePage}
                    />
                  </>
                )}
              </GridItem>
            </Grid>
        </Box>
      </Box>
    </WebsiteLayout>
  )
}

type EquipmentFiltersProps = {
  categories: string[]
  conditions: string[]
  availabilityOptions: string[]
  filters: FilterState
  hasFilters: boolean
  onChange: (key: keyof FilterState, values: string[]) => void
  onClear: () => void
}

function EquipmentFilters({
  categories,
  conditions,
  availabilityOptions,
  filters,
  hasFilters,
  onChange,
  onClear
}: EquipmentFiltersProps) {
  return (
    <Card
      variant="outline"
      borderColor={BORDER}
      borderRadius="16px"
      bg="white"
      boxShadow="0 4px 16px rgba(35, 53, 31, 0.05)"
      position={{
        lg: 'sticky'
      }}
      top={{
        lg: '20px'
      }}
    >
      <CardBody p={5}>
        <Flex justify="space-between" align="center" mb={6}>
          <Text fontSize="16px" fontWeight="800">
            Filters
          </Text>

          {hasFilters ? (
            <Button size="xs" variant="link" color={BRAND} onClick={onClear}>
              Clear
            </Button>
          ) : null}
        </Flex>

        <VStack align="stretch" spacing={6}>
          <FilterGroup title="Category">
            <FilterOptions
              options={categories}
              value={filters.categories}
              onChange={(values) => onChange('categories', values)}
            />
          </FilterGroup>

          <FilterGroup title="Transaction Type">
            <CheckboxGroup
              value={filters.transactions}
              onChange={(values) => onChange('transactions', values as string[])}
            >
              <Stack spacing={2}>
                <FilterCheckbox value="rent" label="Rent" />

                <FilterCheckbox value="buy" label="Buy" />
              </Stack>
            </CheckboxGroup>
          </FilterGroup>

          <FilterGroup title="Availability">
            <FilterOptions
              options={availabilityOptions}
              value={filters.availability}
              onChange={(values) => onChange('availability', values)}
            />
          </FilterGroup>

          <FilterGroup title="Condition">
            <FilterOptions
              options={conditions}
              value={filters.conditions}
              onChange={(values) => onChange('conditions', values)}
            />
          </FilterGroup>
        </VStack>
      </CardBody>
    </Card>
  )
}

function FilterOptions({
  options,
  value,
  onChange
}: {
  options: string[]
  value: string[]
  onChange: (values: string[]) => void
}) {
  if (options.length === 0) {
    return (
      <Text color={SUBTEXT} fontSize="12px">
        No options available
      </Text>
    )
  }

  return (
    <CheckboxGroup value={value} onChange={(values) => onChange(values as string[])}>
      <Stack spacing={2}>
        {options.map((option) => (
          <FilterCheckbox key={option} value={option} label={formatLabel(option)} />
        ))}
      </Stack>
    </CheckboxGroup>
  )
}

function FilterCheckbox({ value, label }: { value: string; label: string }) {
  return (
    <Checkbox value={value} colorScheme="green" alignItems="flex-start">
      <Text fontSize="13px" lineHeight="20px">
        {label}
      </Text>
    </Checkbox>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Text fontSize="13px" fontWeight="800" mb={3}>
        {title}
      </Text>

      {children}
    </Box>
  )
}

function EquipmentCard({ item, onView }: { item: EquipmentItem; onView: () => void }) {
  const availability = getAvailabilityBadge(item)

  const hasRentalPrice = item.isForRent && toNumber(item.rentalPrice) > 0

  const hasPurchasePrice = item.isForSale && toNumber(item.purchasePrice) > 0

  return (
    <Card
      height="100%"
      overflow="hidden"
      borderRadius="16px"
      border="1px solid"
      borderColor={BORDER}
      bg="white"
      boxShadow="0 5px 18px rgba(35, 53, 31, 0.06)"
      transition="all 0.2s ease"
      _hover={{
        transform: 'translateY(-3px)',
        boxShadow: '0 10px 24px rgba(35, 53, 31, 0.1)'
      }}
    >
      <Box position="relative" height="160px" bg="#F8F8F7" overflow="hidden">
        <Image
          src={item.imageUrl || images.logo}
          alt={item.name}
          width="100%"
          height="100%"
          objectFit="contain"
          p={4}
        />

        <Badge
          position="absolute"
          top={3}
          right={3}
          colorScheme={availability.scheme}
          px={3}
          py={1}
          borderRadius="full"
          textTransform="none"
          fontSize="10px"
        >
          {availability.label}
        </Badge>
      </Box>

      <CardBody p={4} display="flex" flexDirection="column">
        <Text
          color={TEXT}
          fontSize="17px"
          fontWeight="800"
          lineHeight="1.25"
          noOfLines={2}
          minH="42px"
        >
          {item.name}
        </Text>

        <Text mt={2} color={SUBTEXT} fontSize="12px" noOfLines={1}>
          {formatLabel(item.category)}

          {item.sku ? ` • ${item.sku}` : ''}
        </Text>

        <Box mt={3} minH="61px">
          {hasRentalPrice ? (
            <>
              <Text color={SUBTEXT} fontSize="12px">
                From
              </Text>

              <Text fontSize="20px" fontWeight="800" lineHeight="1.2">
                {formatCurrency(item.rentalPrice)}
                /day
              </Text>
            </>
          ) : null}

          {hasPurchasePrice ? (
            <Text
              mt={1}
              color={SUBTEXT}
              fontSize={hasRentalPrice ? '11px' : '20px'}
              fontWeight={hasRentalPrice ? '400' : '800'}
            >
              {hasRentalPrice ? 'or ' : ''}
              {formatCurrency(item.purchasePrice)} to buy
            </Text>
          ) : null}

          {!hasRentalPrice && !hasPurchasePrice ? (
            <Text color={SUBTEXT} fontWeight="700">
              Contact us for pricing
            </Text>
          ) : null}
        </Box>

        <Button
          mt="auto"
          width="100%"
          height="38px"
          borderRadius="full"
          bg={BRAND}
          color="white"
          fontSize="13px"
          fontWeight="700"
          onClick={onView}
          _hover={{
            bg: BRAND_HOVER
          }}
        >
          View Details
        </Button>
      </CardBody>
    </Card>
  )
}

function EquipmentSkeleton() {
  return (
    <SimpleGrid
      columns={{
        base: 1,
        md: 2,
        xl: 3
      }}
      spacing={5}
    >
      {Array.from({
        length: PAGE_SIZE
      }).map((_, index) => (
        <Card
          key={index}
          overflow="hidden"
          borderRadius="16px"
          border="1px solid"
          borderColor={BORDER}
        >
          <Skeleton height="160px" />

          <CardBody p={4}>
            <Skeleton height="20px" mb={3} />

            <Skeleton height="12px" width="65%" mb={4} />

            <Skeleton height="26px" width="50%" mb={5} />

            <Skeleton height="38px" borderRadius="full" />
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  )
}

function EmptyEquipment({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <Center
      minH="420px"
      border="1px dashed"
      borderColor={BORDER}
      borderRadius="16px"
      bg="white"
      px={6}
      textAlign="center"
      flexDirection="column"
    >
      <Text fontSize="21px" fontWeight="800">
        No equipment found
      </Text>

      <Text mt={2} color={SUBTEXT} fontSize="14px" maxW="420px">
        {hasFilters
          ? 'No equipment matches the selected filters.'
          : 'No equipment has been added to the catalogue yet.'}
      </Text>

      {hasFilters ? (
        <Button
          mt={5}
          bg={BRAND}
          color="white"
          borderRadius="full"
          onClick={onClear}
          _hover={{
            bg: BRAND_HOVER
          }}
        >
          Clear Filters
        </Button>
      ) : null}
    </Center>
  )
}

function Pagination({
  currentPage,
  totalPages,
  onChange
}: {
  currentPage: number
  totalPages: number
  onChange: (page: number) => void
}) {
  const pages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from(
        {
          length: totalPages
        },
        (_, index) => index + 1
      )
    }

    const start = Math.max(Math.min(currentPage - 2, totalPages - 4), 1)

    return Array.from(
      {
        length: 5
      },
      (_, index) => start + index
    )
  }, [currentPage, totalPages])

  if (totalPages <= 1) {
    return null
  }

  return (
    <Flex mt={9} justify="center" align="center" wrap="wrap" gap={2}>
      <Button
        size="sm"
        leftIcon={<ChevronLeft size={15} />}
        variant="outline"
        borderColor={BRAND}
        color={BRAND}
        borderRadius="full"
        isDisabled={currentPage === 1}
        onClick={() => onChange(currentPage - 1)}
      >
        Previous
      </Button>

      {pages.map((page) => (
        <Button
          key={page}
          size="sm"
          minW="36px"
          borderRadius="full"
          bg={page === currentPage ? BRAND : 'white'}
          color={page === currentPage ? 'white' : BRAND}
          border="1px solid"
          borderColor={BRAND}
          onClick={() => onChange(page)}
          _hover={{
            bg: page === currentPage ? BRAND_HOVER : LIGHT_GREEN
          }}
        >
          {page}
        </Button>
      ))}

      <Button
        size="sm"
        rightIcon={<ChevronRight size={15} />}
        variant="outline"
        borderColor={BRAND}
        color={BRAND}
        borderRadius="full"
        isDisabled={currentPage === totalPages}
        onClick={() => onChange(currentPage + 1)}
      >
        Next
      </Button>
    </Flex>
  )
}