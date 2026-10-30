import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Skeleton,
  Text,
  VStack
} from '@chakra-ui/react'
import {
  Search
} from 'lucide-react'
import {
  type FormEvent,
  useEffect,
  useState
} from 'react'
import {
  useNavigate,
  useSearchParams
} from 'react-router-dom'

import {
  EnumItemAvailability,
  EnumItemCategory,
  useGlobalSearchQuery
} from '../../generated/graphql'

const PAGE_SIZE = 12

function formatEnumLabel(
  value: string
): string {
  return value
    .toLowerCase()
    .split('_')
    .map(word => {
      return (
        word.charAt(0).toUpperCase() +
        word.slice(1)
      )
    })
    .join(' ')
}

function formatMoney(
  value?: string | number | null
): string | null {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null
  }

  const amount =
    Number(value)

  if (!Number.isFinite(amount)) {
    return null
  }

  return new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency: 'ZAR'
    }
  ).format(amount)
}

function isCategory(
  value: string | null
): value is EnumItemCategory {
  if (!value) {
    return false
  }

  return Object.values(
    EnumItemCategory
  ).includes(
    value as EnumItemCategory
  )
}

export default function GlobalSearchPage() {
  const navigate =
    useNavigate()

  const [
    searchParams,
    setSearchParams
  ] = useSearchParams()

  const query =
    searchParams
      .get('q')
      ?.trim() ?? ''

  const categoryParameter =
    searchParams.get('category')

  const typeParameter =
    searchParams.get('type') ?? ''

  const requestedPage =
    Number(
      searchParams.get('page') ?? '1'
    )

  const page =
    Number.isInteger(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1

  const category =
    isCategory(categoryParameter)
      ? categoryParameter
      : undefined

  const isForSale =
    typeParameter === 'sale'
      ? true
      : undefined

  const isForRent =
    typeParameter === 'rent'
      ? true
      : undefined

  const [
    inputValue,
    setInputValue
  ] = useState(query)

  useEffect(() => {
    setInputValue(query)
  }, [query])

  const {
    data,
    loading,
    error,
    refetch
  } = useGlobalSearchQuery({
    variables: {
      query,
      category,
      availability:
        EnumItemAvailability.Available,
      isForSale,
      isForRent,
      page,
      limit: PAGE_SIZE
    },
    skip: query.length < 2,
    fetchPolicy:
      'cache-and-network',
    notifyOnNetworkStatusChange: true
  })

  const results =
    data?.globalSearch.results ?? []

  const total =
    data?.globalSearch.total ?? 0

  const totalPages =
    Math.max(
      Math.ceil(total / PAGE_SIZE),
      1
    )

  const updateSearchParameters = (
    updates: Record<
      string,
      string | undefined
    >
  ): void => {
    const nextParameters =
      new URLSearchParams(
        searchParams
      )

    Object.entries(
      updates
    ).forEach(
      ([key, value]) => {
        if (value) {
          nextParameters.set(
            key,
            value
          )
        } else {
          nextParameters.delete(key)
        }
      }
    )

    setSearchParams(
      nextParameters
    )
  }

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ): void => {
    event.preventDefault()

    const nextQuery =
      inputValue.trim()

    if (nextQuery.length < 2) {
      return
    }

    updateSearchParameters({
      q: nextQuery,
      page: undefined
    })
  }

  const handleClearFilters =
    (): void => {
      const nextParameters =
        new URLSearchParams()

      if (query) {
        nextParameters.set(
          'q',
          query
        )
      }

      setSearchParams(
        nextParameters
      )
    }

  return (
    <Box
      minH="100vh"
      bg="#FCFBF7"
      py={{
        base: 8,
        md: 14
      }}
    >
      <Container maxW="7xl">
        <VStack
          align="stretch"
          spacing={8}
        >
          <Box>
            <Heading
              color="#23351F"
              fontSize={{
                base: '30px',
                md: '42px'
              }}
            >
              Search Equipment
            </Heading>

            {query ? (
              <Text
                mt={2}
                color="gray.600"
              >
                {loading &&
                results.length === 0
                  ? `Searching for “${query}”...`
                  : `${total} result${
                      total === 1
                        ? ''
                        : 's'
                    } for “${query}”`}
              </Text>
            ) : (
              <Text
                mt={2}
                color="gray.600"
              >
                Search farming equipment
                available for sale or rental.
              </Text>
            )}
          </Box>

          <Box
            as="form"
            onSubmit={handleSubmit}
          >
            <Flex
              gap={3}
              direction={{
                base: 'column',
                md: 'row'
              }}
            >
              <InputGroup size="lg">
                <InputLeftElement
                  pointerEvents="none"
                >
                  <Search size={20} />
                </InputLeftElement>

                <Input
                  value={inputValue}
                  onChange={event => {
                    setInputValue(
                      event.target.value
                    )
                  }}
                  placeholder="Search tractors, harvesters, irrigation equipment..."
                  bg="white"
                  borderRadius="12px"
                  minH="52px"
                />
              </InputGroup>

              <Button
                type="submit"
                minH="52px"
                px={8}
                bg="#173F1F"
                color="white"
                borderRadius="12px"
                isDisabled={
                  inputValue.trim().length <
                  2
                }
                _hover={{
                  bg: '#0E2D15'
                }}
              >
                Search
              </Button>
            </Flex>
          </Box>

          <Flex
            gap={4}
            direction={{
              base: 'column',
              md: 'row'
            }}
            align={{
              base: 'stretch',
              md: 'center'
            }}
          >
            <Select
              value={category ?? ''}
              bg="white"
              minH="48px"
              maxW={{
                base: '100%',
                md: '280px'
              }}
              onChange={event => {
                updateSearchParameters({
                  category:
                    event.target.value ||
                    undefined,
                  page: undefined
                })
              }}
            >
              <option value="">
                All categories
              </option>

              {Object.values(
                EnumItemCategory
              ).map(value => (
                <option
                  key={value}
                  value={value}
                >
                  {formatEnumLabel(
                    value
                  )}
                </option>
              ))}
            </Select>

            <Select
              value={typeParameter}
              bg="white"
              minH="48px"
              maxW={{
                base: '100%',
                md: '220px'
              }}
              onChange={event => {
                updateSearchParameters({
                  type:
                    event.target.value ||
                    undefined,
                  page: undefined
                })
              }}
            >
              <option value="">
                Sale and rental
              </option>

              <option value="sale">
                For sale
              </option>

              <option value="rent">
                For rent
              </option>
            </Select>

            <Button
              variant="outline"
              minH="48px"
              borderColor="#173F1F"
              color="#173F1F"
              onClick={
                handleClearFilters
              }
            >
              Clear filters
            </Button>

            <Button
              variant="ghost"
              minH="48px"
              color="#173F1F"
              onClick={() => {
                void refetch()
              }}
            >
              Refresh
            </Button>
          </Flex>

          {error ? (
            <Alert
              status="error"
              borderRadius="12px"
            >
              <AlertIcon />
              {error.message}
            </Alert>
          ) : null}

          {loading &&
          results.length === 0 ? (
            <SimpleGrid
              columns={{
                base: 1,
                md: 2,
                lg: 3
              }}
              spacing={6}
            >
              {Array.from({
                length: 6
              }).map((_, index) => (
                <Skeleton
                  key={index}
                  height="430px"
                  borderRadius="20px"
                />
              ))}
            </SimpleGrid>
          ) : null}

          {!loading &&
          !error &&
          query.length >= 2 &&
          results.length === 0 ? (
            <Box
              bg="white"
              borderRadius="20px"
              py={16}
              px={6}
              textAlign="center"
            >
              <Heading
                size="md"
                color="#23351F"
              >
                No equipment found
              </Heading>

              <Text
                mt={3}
                color="gray.600"
              >
                Try another item name,
                category or SKU.
              </Text>
            </Box>
          ) : null}

          {query.length < 2 ? (
            <Box
              bg="white"
              borderRadius="20px"
              py={16}
              px={6}
              textAlign="center"
            >
              <Heading
                size="md"
                color="#23351F"
              >
                Search the equipment catalogue
              </Heading>

              <Text
                mt={3}
                color="gray.600"
              >
                Enter at least two characters
                to begin searching.
              </Text>
            </Box>
          ) : null}

          {results.length > 0 ? (
            <SimpleGrid
              columns={{
                base: 1,
                md: 2,
                lg: 3
              }}
              spacing={6}
            >
              {results.map(item => {
                const purchasePrice =
                  formatMoney(
                    item.purchasePrice
                  )

                const rentalPrice =
                  formatMoney(
                    item.rentalPrice
                  )

                return (
                  <Box
                    key={item.id}
                    bg="white"
                    borderRadius="20px"
                    overflow="hidden"
                    border="1px solid"
                    borderColor="gray.100"
                    cursor="pointer"
                    transition="0.2s ease"
                    onClick={() => {
                      navigate(
                        `/equipment/${item.id}`
                      )
                    }}
                    _hover={{
                      transform:
                        'translateY(-4px)',
                      boxShadow:
                        '0 16px 38px rgba(0,0,0,0.09)'
                    }}
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        width="100%"
                        height="240px"
                        objectFit="cover"
                      />
                    ) : (
                      <Box
                        height="240px"
                        bg="gray.100"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text color="gray.500">
                          No image available
                        </Text>
                      </Box>
                    )}

                    <VStack
                      align="stretch"
                      spacing={3}
                      p={6}
                    >
                      <Flex
                        gap={2}
                        wrap="wrap"
                      >
                        <Badge
                          colorScheme="green"
                        >
                          {formatEnumLabel(
                            item.category
                          )}
                        </Badge>

                        {item.isForSale ? (
                          <Badge
                            colorScheme="blue"
                          >
                            For sale
                          </Badge>
                        ) : null}

                        {item.isForRent ? (
                          <Badge
                            colorScheme="orange"
                          >
                            For rent
                          </Badge>
                        ) : null}
                      </Flex>

                      <Heading
                        size="md"
                        color="#23351F"
                        noOfLines={2}
                      >
                        {item.title}
                      </Heading>

                      {item.description ? (
                        <Text
                          color="gray.600"
                          noOfLines={3}
                        >
                          {item.description}
                        </Text>
                      ) : null}

                      <VStack
                        align="stretch"
                        spacing={1}
                        pt={2}
                      >
                        {item.isForSale &&
                        purchasePrice ? (
                          <Text
                            color="#173F1F"
                            fontSize="lg"
                            fontWeight="800"
                          >
                            {purchasePrice}
                          </Text>
                        ) : null}

                        {item.isForRent &&
                        rentalPrice ? (
                          <Text
                            color="#657067"
                            fontWeight="700"
                          >
                            {rentalPrice} per day
                          </Text>
                        ) : null}
                      </VStack>
                    </VStack>
                  </Box>
                )
              })}
            </SimpleGrid>
          ) : null}

          {totalPages > 1 ? (
            <Flex
              justifyContent="center"
              alignItems="center"
              gap={4}
              pt={4}
            >
              <Button
                isDisabled={page <= 1}
                onClick={() => {
                  updateSearchParameters({
                    page: String(
                      page - 1
                    )
                  })

                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                  })
                }}
              >
                Previous
              </Button>

              <Text
                color="#23351F"
                fontWeight="700"
              >
                Page {page} of{' '}
                {totalPages}
              </Text>

              <Button
                isDisabled={
                  page >= totalPages
                }
                onClick={() => {
                  updateSearchParameters({
                    page: String(
                      page + 1
                    )
                  })

                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                  })
                }}
              >
                Next
              </Button>
            </Flex>
          ) : null}
        </VStack>
      </Container>
    </Box>
  )
}