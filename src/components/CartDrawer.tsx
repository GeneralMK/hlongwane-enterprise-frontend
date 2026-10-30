import {
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Image,
  Text,
  VStack
} from '@chakra-ui/react'
import {
  Minus,
  Plus,
  Trash2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  type CartItem,
  useCart
} from '../context/CartContext'
import images from '../theme/images'

const BRAND = '#254D32'
const ACCENT = '#C96F3B'
const ACCENT_HOVER = '#B85E2E'
const SURFACE = '#FFFDF7'
const SURFACE_MUTED = '#F4EFE3'
const LIGHT_GREEN = '#E7EFE4'
const BORDER = '#DED6C6'
const TEXT = '#253126'
const SUBTEXT = '#6C7167'

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    'en-ZA',
    {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }
  ).format(value)
}

function getItemTotal(
  item: CartItem
) {
  const days =
    item.mode === 'rent'
      ? Math.max(
          item.rentalDays ?? 1,
          1
        )
      : 1

  return (
    item.unitPrice *
    item.quantity *
    days
  )
}

export default function CartDrawer() {
  const navigate = useNavigate()

  const {
    items,
    itemCount,
    subtotal,
    isCartOpen,
    closeCart,
    removeItem,
    increaseQuantity,
    decreaseQuantity
  } = useCart()

  const goToCart = () => {
    closeCart()
    navigate('/cart')
  }

  const goToCheckout = () => {
    closeCart()
    navigate('/checkout')
  }

  return (
    <Drawer
      isOpen={isCartOpen}
      placement="right"
      size="sm"
      onClose={closeCart}
    >
      <DrawerOverlay
        bg="blackAlpha.600"
        backdropFilter="blur(3px)"
      />

      <DrawerContent
        bg={SURFACE}
        maxW={{
          base: '100%',
          sm: '440px'
        }}
      >
        <DrawerCloseButton
          top="28px"
          right="24px"
          color={TEXT}
        />

        <DrawerHeader
          px={7}
          pt={8}
          pb={7}
          borderBottom="1px solid"
          borderColor={BORDER}
          bg={SURFACE}
        >
          <Text
            color={TEXT}
            fontSize="24px"
            fontWeight="800"
          >
            Your Cart ({itemCount})
          </Text>
        </DrawerHeader>

        <DrawerBody
          px={7}
          py={6}
        >
          {items.length === 0 ? (
            <Flex
              minH="420px"
              align="center"
              justify="center"
              direction="column"
              textAlign="center"
            >
              <Text
                color={TEXT}
                fontSize="20px"
                fontWeight="800"
              >
                Your cart is empty
              </Text>

              <Text
                mt={2}
                color={SUBTEXT}
                fontSize="14px"
              >
                Add something special for
                your outdoor space.
              </Text>

              <Button
                mt={6}
                bg={ACCENT}
                color="white"
                borderRadius="full"
                onClick={() => {
                  closeCart()
                  navigate(
                    '/shop'
                  )
                }}
                _hover={{
                  bg: ACCENT_HOVER
                }}
              >
                Explore the Shop
              </Button>
            </Flex>
          ) : (
            <VStack
              align="stretch"
              spacing={0}
            >
              {items.map(item => (
                <Box
                  key={item.key}
                  pb={5}
                  mb={5}
                  borderBottom="1px solid"
                  borderColor={BORDER}
                >
                  <Flex
                    gap={4}
                    align="flex-start"
                  >
                    <Flex
                      width="88px"
                      height="88px"
                      minW="88px"
                      align="center"
                      justify="center"
                      bg={SURFACE_MUTED}
                      border="1px solid"
                      borderColor={BORDER}
                      borderRadius="16px"
                      overflow="hidden"
                    >
                      <Image
                        src={
                          item.imageUrl ||
                          images.logo
                        }
                        alt={item.name}
                        width="100%"
                        height="100%"
                        objectFit="contain"
                        p={2}
                      />
                    </Flex>

                    <Box
                      flex={1}
                      minW={0}
                    >
                      <Flex
                        justify="space-between"
                        align="flex-start"
                        gap={3}
                      >
                        <Box minW={0}>
                          <Text
                            color={TEXT}
                            fontSize="16px"
                            fontWeight="800"
                            noOfLines={2}
                          >
                            {item.name}
                          </Text>

                          <Badge
                            mt={2}
                            bg={LIGHT_GREEN}
                            color={TEXT}
                            borderRadius="full"
                            px={3}
                            py={1}
                            textTransform="capitalize"
                            fontSize="12px"
                          >
                            {item.mode ===
                            'buy'
                              ? 'Purchase'
                              : 'Rental'}
                          </Badge>
                        </Box>

                        <IconButton
                          aria-label="Remove item"
                          icon={
                            <Trash2
                              size={17}
                            />
                          }
                          size="sm"
                          variant="ghost"
                          color={SUBTEXT}
                          _hover={{
                            color: '#A63F2B',
                            bg: '#FBE9E3'
                          }}
                          onClick={() =>
                            removeItem(
                              item.key
                            )
                          }
                        />
                      </Flex>

                      {item.mode ===
                        'rent' &&
                      item.startDate &&
                      item.endDate ? (
                        <Text
                          mt={2}
                          color={SUBTEXT}
                          fontSize="11px"
                        >
                          {item.startDate}{' '}
                          to{' '}
                          {item.endDate}
                        </Text>
                      ) : null}

                      <Flex
                        mt={3}
                        justify="space-between"
                        align="center"
                        gap={3}
                      >
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Decrease quantity"
                            icon={
                              <Minus
                                size={14}
                              />
                            }
                            size="sm"
                            variant="outline"
                            borderColor={
                              BORDER
                            }
                            bg={SURFACE}
                            _hover={{
                              bg: LIGHT_GREEN,
                              borderColor:
                                BRAND
                            }}
                            isDisabled={
                              item.quantity <=
                              1
                            }
                            onClick={() =>
                              decreaseQuantity(
                                item.key
                              )
                            }
                          />

                          <Text
                            minW="20px"
                            textAlign="center"
                            fontWeight="700"
                          >
                            {item.quantity}
                          </Text>

                          <IconButton
                            aria-label="Increase quantity"
                            icon={
                              <Plus
                                size={14}
                              />
                            }
                            size="sm"
                            variant="outline"
                            borderColor={
                              BORDER
                            }
                            bg={SURFACE}
                            _hover={{
                              bg: LIGHT_GREEN,
                              borderColor:
                                BRAND
                            }}
                            onClick={() =>
                              increaseQuantity(
                                item.key
                              )
                            }
                          />
                        </HStack>

                        <Text
                          color={TEXT}
                          fontSize="18px"
                          fontWeight="800"
                          whiteSpace="nowrap"
                        >
                          {formatCurrency(
                            getItemTotal(
                              item
                            )
                          )}
                        </Text>
                      </Flex>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </VStack>
          )}
        </DrawerBody>

        {items.length > 0 ? (
          <DrawerFooter
            display="block"
            px={7}
            pt={6}
            pb={7}
            bg={SURFACE_MUTED}
            borderTop="1px solid"
            borderColor={BORDER}
          >
            <Flex
              justify="space-between"
              align="center"
              mb={5}
            >
              <Text
                color={SUBTEXT}
                fontSize="17px"
              >
                Subtotal
              </Text>

              <Text
                color={TEXT}
                fontSize="25px"
                fontWeight="800"
              >
                {formatCurrency(
                  subtotal
                )}
              </Text>
            </Flex>

            <Button
              width="100%"
              height="58px"
              bg={ACCENT}
              color="white"
              borderRadius="full"
              fontSize="18px"
              fontWeight="800"
              onClick={goToCheckout}
              _hover={{
                bg: ACCENT_HOVER
              }}
            >
              Proceed to Checkout
            </Button>

            <Button
              mt={4}
              width="100%"
              height="52px"
              variant="outline"
              borderWidth="2px"
              borderColor={BRAND}
              color={BRAND}
              borderRadius="full"
              fontSize="17px"
              fontWeight="700"
              onClick={goToCart}
              _hover={{
                bg: LIGHT_GREEN
              }}
            >
              View Full Cart
            </Button>
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}