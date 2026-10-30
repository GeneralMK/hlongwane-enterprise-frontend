import {
  Badge,
  Box,
  Button,
  Container,
  HStack,
  Image,
  SimpleGrid,
  Skeleton,
  Text,
  VStack
} from '@chakra-ui/react'
import {
  ArrowRight,
  Star
} from 'lucide-react'
import {
  useMemo
} from 'react'
import {
  Link
} from 'react-router-dom'

import {
  type PopularAgricultureItemsQuery,
  usePopularAgricultureItemsQuery
} from '../generated/graphql'
import images from '../theme/images'

const BRAND_GREEN =
  '#173F1F'

const BRAND_HOVER =
  '#0F3018'

const GOLD =
  '#D8A21D'

const MUTED_TEXT =
  '#667160'

type AgricultureItem =
  NonNullable<
    PopularAgricultureItemsQuery[
      'publicAgricultureItems'
    ]
  >[number]

type RatedAgricultureItem =
  AgricultureItem & {
    averageRating?:
      | number
      | string
      | null

    reviewCount?:
      | number
      | null
  }

type ProductRatingProps = {
  averageRating?:
    | number
    | string
    | null

  reviewCount?:
    | number
    | null
}

const CATEGORY_FALLBACK_IMAGES:
Record<string, string> = {
  TRACTOR:
    images.greenTractor,

  HARVESTER:
    images.redSomething,

  IRRIGATION:
    images.blueTractor,

  PLOUGH:
    images.redTractor,

  SEEDER:
    images.implementation,

  SPRAYER:
    images.implementation,

  TRAILER:
    images.trailers,

  FERTILIZER:
    images.spareParts,

  SEED:
    images.spareParts,

  LIVESTOCK_EQUIPMENT:
    images.workshopEquipment,

  OTHER:
    images.workshopEquipment
}

const CATEGORY_LABELS:
Record<string, string> = {
  TRACTOR:
    'Tractor',

  HARVESTER:
    'Harvester',

  IRRIGATION:
    'Irrigation',

  PLOUGH:
    'Plough',

  SEEDER:
    'Seeder',

  SPRAYER:
    'Sprayer',

  TRAILER:
    'Trailer',

  FERTILIZER:
    'Fertilizer',

  SEED:
    'Seed',

  LIVESTOCK_EQUIPMENT:
    'Livestock Equipment',

  OTHER:
    'Equipment'
}

function toNumber(
  value?:
    | string
    | number
    | null
): number {
  const parsed =
    Number(
      value ?? 0
    )

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0
}

function formatCurrency(
  value?:
    | string
    | number
    | null
): string {
  return new Intl.NumberFormat(
    'en-ZA',
    {
      style:
        'currency',

      currency:
        'ZAR',

      minimumFractionDigits:
        0,

      maximumFractionDigits:
        0
    }
  ).format(
    toNumber(value)
  )
}

function getProductImage(
  item: AgricultureItem
): string {
  if (item.imageUrl) {
    return item.imageUrl
  }

  return (
    CATEGORY_FALLBACK_IMAGES[
      item.category
    ] ??
    images.logo
  )
}

function getPriceLabel(
  item: AgricultureItem
): {
  prefix: string
  primary: string
  secondary: string | null
} {
  if (
    item.isForRent &&
    item.rentalPrice
  ) {
    return {
      prefix:
        'From',

      primary:
        `${formatCurrency(
          item.rentalPrice
        )}/day`,

      secondary:
        item.isForSale &&
        item.purchasePrice
          ? `or ${formatCurrency(
              item.purchasePrice
            )} to buy`
          : null
    }
  }

  if (
    item.isForSale &&
    item.purchasePrice
  ) {
    return {
      prefix:
        'Purchase price',

      primary:
        formatCurrency(
          item.purchasePrice
        ),

      secondary:
        null
    }
  }

  return {
    prefix:
      '',

    primary:
      'Contact for pricing',

    secondary:
      null
  }
}

function getAvailabilityLabel(
  item: AgricultureItem
): string {
  if (
    item.stockQuantity <= 0
  ) {
    return 'Out of stock'
  }

  if (
    item.stockQuantity === 1
  ) {
    return '1 available'
  }

  return `${item.stockQuantity} available`
}

function getAvailabilityColor(
  item: AgricultureItem
): {
  background: string
  color: string
} {
  if (
    item.stockQuantity <= 0
  ) {
    return {
      background:
        'red.50',

      color:
        'red.600'
    }
  }

  if (
    item.stockQuantity <= 3
  ) {
    return {
      background:
        'orange.50',

      color:
        'orange.600'
    }
  }

  return {
    background:
      'green.50',

    color:
      'green.700'
  }
}

function getPopularityScore(
  item: RatedAgricultureItem
): number {
  let score =
    0

  if (
    item.availability ===
    'AVAILABLE'
  ) {
    score +=
      100
  }

  if (
    item.isForRent &&
    item.rentalPrice
  ) {
    score +=
      50
  }

  if (
    item.isForSale &&
    item.purchasePrice
  ) {
    score +=
      40
  }

  if (
    item.isForRent &&
    item.isForSale
  ) {
    score +=
      30
  }

  score +=
    Math.min(
      item.stockQuantity,
      20
    )

  const averageRating =
    toNumber(
      item.averageRating
    )

  const reviewCount =
    Math.max(
      Number(
        item.reviewCount ??
        0
      ),
      0
    )

  /*
   * Reviews influence popularity,
   * but do not completely override
   * availability and pricing.
   */
  if (
    averageRating > 0 &&
    reviewCount > 0
  ) {
    score +=
      averageRating * 15

    score +=
      Math.min(
        reviewCount,
        50
      )
  }

  return score
}

function ProductRating({
  averageRating,
  reviewCount
}: ProductRatingProps) {
  const rating =
    Math.min(
      Math.max(
        toNumber(
          averageRating
        ),
        0
      ),
      5
    )

  const totalReviews =
    Math.max(
      Number(
        reviewCount ??
        0
      ),
      0
    )

  /*
   * Do not render fake stars when
   * no review has been submitted.
   */
  if (
    rating <= 0 ||
    totalReviews <= 0
  ) {
    return null
  }

  return (
    <HStack
      spacing="2px"
      mb="9px"
      align="center"
      aria-label={`${rating.toFixed(
        1
      )} out of 5 stars from ${totalReviews} ${
        totalReviews === 1
          ? 'review'
          : 'reviews'
      }`}
    >
      {[1, 2, 3, 4, 5].map(
        starNumber => {
          const fillPercentage =
            Math.min(
              Math.max(
                rating -
                  (
                    starNumber -
                    1
                  ),
                0
              ),
              1
            ) *
            100

          return (
            <Box
              key={
                starNumber
              }
              position="relative"
              width="14px"
              height="14px"
              flexShrink={0}
            >
              <Star
                size={14}
                color={GOLD}
                strokeWidth={1.8}
              />

              {fillPercentage >
              0 ? (
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  width={`${fillPercentage}%`}
                  height="100%"
                  overflow="hidden"
                  pointerEvents="none"
                >
                  <Star
                    size={14}
                    fill={GOLD}
                    color={GOLD}
                    strokeWidth={1.8}
                  />
                </Box>
              ) : null}
            </Box>
          )
        }
      )}

      <Text
        color={
          MUTED_TEXT
        }
        fontSize="10px"
        ml="5px"
        whiteSpace="nowrap"
      >
        {rating.toFixed(
          1
        )}
        {' · '}
        {totalReviews}{' '}
        {totalReviews === 1
          ? 'review'
          : 'reviews'}
      </Text>
    </HStack>
  )
}

export default function PopularSeasonSection() {
  const {
    data,
    loading,
    error
  } =
    usePopularAgricultureItemsQuery({
      fetchPolicy:
        'cache-and-network',

      notifyOnNetworkStatusChange:
        true
    })

  const products =
    useMemo<
      RatedAgricultureItem[]
    >(
      () => {
        const items =
          (
            data
              ?.publicAgricultureItems ??
            []
          ) as RatedAgricultureItem[]

        return [
          ...items
        ]
          .filter(
            item => {
              const hasPrice =
                Boolean(
                  item.rentalPrice ||
                    item.purchasePrice
                )

              const isAvailable =
                item.availability !==
                'SOLD'

              return (
                hasPrice &&
                isAvailable &&
                item.stockQuantity >
                  0
              )
            }
          )
          .sort(
            (
              first,
              second
            ) =>
              getPopularityScore(
                second
              ) -
              getPopularityScore(
                first
              )
          )
          .slice(
            0,
            4
          )
      },
      [
        data
          ?.publicAgricultureItems
      ]
    )

  return (
    <Box
      as="section"
      bg="#FBFAF7"
      py={{
        base:
          '64px',
        md:
          '82px'
      }}
    >
      <Container
        maxW="100%"
        px={{
          base:
            6,
          md:
            '88px'
        }}
      >
        <Text
          textAlign="center"
          color={
            BRAND_GREEN
          }
          fontSize={{
            base:
              '34px',
            md:
              '42px'
          }}
          fontWeight="500"
          lineHeight="1.2"
          mb={{
            base:
              '42px',
            md:
              '56px'
          }}
        >
          Popular This Season
        </Text>

        {(loading || Boolean(error)) &&
        products.length === 0 ? (
          <PopularProductsSkeleton />
        ) : products.length === 0 ? (
          <VStack
            py={16}
            spacing={4}
            textAlign="center"
          >
            <Text
              color={
                BRAND_GREEN
              }
              fontSize="24px"
              fontWeight="700"
            >
              No popular equipment
              available
            </Text>

            <Text
              color={
                MUTED_TEXT
              }
              maxW="520px"
            >
              Products will appear
              here when available
              equipment is added to
              the catalogue.
            </Text>

            <Button
              as={Link}
              to="/equipment"
              bg={
                BRAND_GREEN
              }
              color="white"
              borderRadius="full"
              rightIcon={
                <ArrowRight
                  size={18}
                />
              }
              _hover={{
                bg:
                  BRAND_HOVER,

                textDecoration:
                  'none'
              }}
            >
              Browse Equipment
            </Button>
          </VStack>
        ) : (
          <>
            <SimpleGrid
              columns={{
                base:
                  1,
                sm:
                  2,
                lg:
                  4
              }}
              spacing="24px"
            >
              {products.map(
                product => {
                  const price =
                    getPriceLabel(
                      product
                    )

                  const availability =
                    getAvailabilityColor(
                      product
                    )

                  return (
                    <Box
                      key={
                        product.id
                      }
                      bg="white"
                      borderRadius="16px"
                      overflow="hidden"
                      boxShadow="0 4px 12px rgba(0,0,0,0.13)"
                      transition="transform 0.2s ease, box-shadow 0.2s ease"
                      _hover={{
                        transform:
                          'translateY(-5px)',

                        boxShadow:
                          '0 14px 30px rgba(0,0,0,0.14)'
                      }}
                    >
                      <Box
                        position="relative"
                        bg="#F7F7F5"
                      >
                        <Image
                          src={getProductImage(
                            product
                          )}
                          alt={
                            product.name
                          }
                          w="100%"
                          h="240px"
                          objectFit="cover"
                          fallbackSrc={
                            images.logo
                          }
                        />

                        <Badge
                          position="absolute"
                          top="14px"
                          left="14px"
                          px={3}
                          py={1}
                          borderRadius="full"
                          bg="whiteAlpha.900"
                          color={
                            BRAND_GREEN
                          }
                          textTransform="none"
                          fontSize="11px"
                          boxShadow="sm"
                        >
                          {CATEGORY_LABELS[
                            product.category
                          ] ??
                            product.category}
                        </Badge>

                        <Badge
                          position="absolute"
                          top="14px"
                          right="14px"
                          px={3}
                          py={1}
                          borderRadius="full"
                          bg={
                            availability.background
                          }
                          color={
                            availability.color
                          }
                          textTransform="none"
                          fontSize="11px"
                        >
                          {getAvailabilityLabel(
                            product
                          )}
                        </Badge>
                      </Box>

                      <Box
                        px="24px"
                        pt="24px"
                        pb="22px"
                      >
                        <Text
                          color={
                            BRAND_GREEN
                          }
                          fontSize="18px"
                          fontWeight="800"
                          lineHeight="1.25"
                          mb="12px"
                          noOfLines={2}
                          minH="45px"
                        >
                          {
                            product.name
                          }
                        </Text>

                        {price.prefix ? (
                          <Text
                            color={
                              MUTED_TEXT
                            }
                            fontSize="12px"
                            lineHeight="1"
                            mb="4px"
                          >
                            {
                              price.prefix
                            }
                          </Text>
                        ) : null}

                        <Text
                          color={
                            BRAND_GREEN
                          }
                          fontSize="18px"
                          fontWeight="800"
                          lineHeight="1.1"
                          mb="3px"
                        >
                          {
                            price.primary
                          }
                        </Text>

                        <Text
                          color={
                            MUTED_TEXT
                          }
                          fontSize="10px"
                          lineHeight="1.2"
                          mb="8px"
                          minH="12px"
                        >
                          {price.secondary ??
                            ' '}
                        </Text>

                        <ProductRating
                          averageRating={
                            product.averageRating
                          }
                          reviewCount={
                            product.reviewCount
                          }
                        />

                        <HStack
                          as={Link}
                          to={`/equipment/${product.id}`}
                          spacing="5px"
                          color={
                            BRAND_GREEN
                          }
                          fontSize="15px"
                          fontWeight="600"
                          lineHeight="1"
                          width="fit-content"
                          _hover={{
                            textDecoration:
                              'none',

                            color:
                              BRAND_HOVER
                          }}
                        >
                          <Text>
                            View Details
                          </Text>

                          <ArrowRight
                            size={15}
                            strokeWidth={2}
                          />
                        </HStack>
                      </Box>
                    </Box>
                  )
                }
              )}
            </SimpleGrid>

            <VStack
              mt="46px"
            >
              <Button
                as={Link}
                to="/equipment"
                h="48px"
                px="34px"
                borderRadius="999px"
                bg={
                  BRAND_GREEN
                }
                color="white"
                fontSize="16px"
                fontWeight="500"
                rightIcon={
                  <ArrowRight
                    size={20}
                  />
                }
                boxShadow="0 8px 18px rgba(0,0,0,0.22)"
                _hover={{
                  bg:
                    BRAND_HOVER,

                  textDecoration:
                    'none'
                }}
              >
                View Full Catalogue
              </Button>
            </VStack>
          </>
        )}
      </Container>
    </Box>
  )
}

function PopularProductsSkeleton() {
  return (
    <SimpleGrid
      columns={{
        base:
          1,
        sm:
          2,
        lg:
          4
      }}
      spacing="24px"
    >
      {Array.from({
        length:
          4
      }).map(
        (
          _,
          index
        ) => (
          <Box
            key={
              index
            }
            bg="white"
            borderRadius="16px"
            overflow="hidden"
            boxShadow="0 4px 12px rgba(0,0,0,0.08)"
          >
            <Skeleton
              h="240px"
            />

            <VStack
              align="stretch"
              spacing={3}
              px="24px"
              pt="24px"
              pb="22px"
            >
              <Skeleton
                h="20px"
                w="80%"
              />

              <Skeleton
                h="12px"
                w="25%"
              />

              <Skeleton
                h="20px"
                w="50%"
              />

              <Skeleton
                h="12px"
                w="60%"
              />

              <Skeleton
                h="14px"
                w="45%"
              />

              <Skeleton
                h="16px"
                w="35%"
              />
            </VStack>
          </Box>
        )
      )}
    </SimpleGrid>
  )
}