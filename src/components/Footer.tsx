import {
  Box,
  Button,
  Container,
  Divider,
  HStack,
  Link as ChakraLink,
  SimpleGrid,
  Text,
  VStack
} from '@chakra-ui/react'
import type { ReactNode } from 'react'
import {
  FaChevronRight,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaWhatsapp
} from 'react-icons/fa'
import type { IconType } from 'react-icons'
import { Link } from 'react-router-dom'

const ACCENT = '#008cff'
const BACKGROUND = '#031426'
const MUTED = '#a7b7ca'

const quickLinks = [
  { label: 'Home', path: '/' },
  { label: 'Shop All Products', path: '/shop' },
  { label: 'About Us', path: '/about' },
  { label: 'Contact Us', path: '/contact' },
  { label: 'My Account', path: '/dashboard' },
  { label: 'Cart', path: '/cart' }
]

export interface FooterProps {
  phone?: string
  email?: string
  address?: string

  /**
   * International number, including country code.
   * Example format: +27...
   */
  whatsappNumber?: string

  tradingHours?: Array<{
    day: string
    hours: string
  }>
}

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <Text
      as="h2"
      color="white"
      fontSize="sm"
      fontWeight="700"
      mb={5}
    >
      {children}
    </Text>
  )
}

function FooterLink({
  children,
  path
}: {
  children: ReactNode
  path: string
}) {
  return (
    <ChakraLink
      as={Link}
      to={path}
      display="inline-flex"
      alignItems="center"
      color={MUTED}
      fontSize="sm"
      py={1}
      transition="color 0.2s"
      _hover={{
        color: 'white',
        textDecoration: 'none'
      }}
      _focusVisible={{
        outline: '2px solid',
        outlineColor: ACCENT,
        outlineOffset: '4px'
      }}
    >
      <Box as="span" color={ACCENT} mr={3} aria-hidden>
        <FaChevronRight size={8} />
      </Box>

      {children}
    </ChakraLink>
  )
}

function ContactItem({
  icon: Icon,
  label,
  children
}: {
  icon: IconType
  label: string
  children: ReactNode
}) {
  return (
    <HStack align="flex-start" spacing={3}>
      <Box
        color={ACCENT}
        pt={1}
        flexShrink={0}
        aria-hidden
      >
        <Icon size={15} />
      </Box>

      <Box minW={0}>
        <Text
          color="white"
          fontSize="xs"
          fontWeight="600"
          mb={1}
        >
          {label}
        </Text>

        <Box color={MUTED} fontSize="sm" lineHeight="1.8">
          {children}
        </Box>
      </Box>
    </HStack>
  )
}

export default function Footer({
  phone,
  email,
  address,
  whatsappNumber,
  tradingHours = []
}: FooterProps) {
  const contactPhone = phone?.trim()
  const contactEmail = email?.trim()
  const contactAddress = address?.trim()
  const whatsappDigits = whatsappNumber?.replace(/\D/g, '')

  const hasContactDetails = Boolean(
    contactPhone || contactEmail || contactAddress
  )

  return (
    <Box
      as="footer"
      bg={BACKGROUND}
      color="white"
      borderTop="3px solid"
      borderTopColor={ACCENT}
    >
      <Container
        maxW="1440px"
        px={{ base: 6, md: 10 }}
        pt={{ base: 12, md: 16 }}
      >
        <SimpleGrid
          columns={{ base: 1, sm: 2, lg: 4 }}
          spacing={{ base: 10, md: 12 }}
        >
          <VStack align="flex-start" spacing={5}>
            <ChakraLink
              as={Link}
              to="/"
              aria-label="DeviceLinkUp home"
              _hover={{ textDecoration: 'none' }}
            >
              <Text
                fontSize={{ base: '26px', md: '28px' }}
                fontWeight="900"
                letterSpacing="-0.06em"
                lineHeight="1.1"
              >
                DEVICE
                <Box as="span" color={ACCENT}>
                  LINKUP
                </Box>
              </Text>

              <Text
                mt={2}
                color={MUTED}
                fontSize="9px"
                fontWeight="600"
                letterSpacing="0.18em"
                textTransform="uppercase"
              >
                Your devices. Our connection.
              </Text>
            </ChakraLink>

            <Box w="44px" h="3px" bg={ACCENT} />

            <Text
              maxW="290px"
              color={MUTED}
              fontSize="sm"
              lineHeight="1.9"
            >
              Explore phones, tablets, wearables, gaming consoles
              and everyday accessories, all in one place.
            </Text>

            <Button
              as={Link}
              to="/shop"
              bg={ACCENT}
              color="white"
              size="sm"
              px={5}
              borderRadius="full"
              rightIcon={<FaChevronRight size={10} />}
              _hover={{ bg: '#0074d6' }}
            >
              Explore the shop
            </Button>
          </VStack>

          <Box>
            <FooterHeading>Quick Links</FooterHeading>

            <VStack align="flex-start" spacing={2}>
              {quickLinks.map((item) => (
                <FooterLink key={item.path} path={item.path}>
                  {item.label}
                </FooterLink>
              ))}
            </VStack>
          </Box>

          <Box>
            <FooterHeading>Contact Us</FooterHeading>

            <VStack align="stretch" spacing={5}>
              {contactPhone && (
                <ContactItem icon={FaPhoneAlt} label="Phone">
                  <ChakraLink
                    href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`}
                    _hover={{ color: 'white' }}
                  >
                    {contactPhone}
                  </ChakraLink>
                </ContactItem>
              )}

              {contactEmail && (
                <ContactItem icon={FaEnvelope} label="Email">
                  <ChakraLink
                    href={`mailto:${contactEmail}`}
                    overflowWrap="anywhere"
                    _hover={{ color: 'white' }}
                  >
                    {contactEmail}
                  </ChakraLink>
                </ContactItem>
              )}

              {contactAddress && (
                <ContactItem icon={FaMapMarkerAlt} label="Address">
                  {contactAddress}
                </ContactItem>
              )}

              {!hasContactDetails && (
                <Text color={MUTED} fontSize="sm" lineHeight="1.9">
                  Have a question about a product or your order?
                  Visit our contact page to get in touch.
                </Text>
              )}

              <FooterLink path="/contact">
                Contact our team
              </FooterLink>
            </VStack>
          </Box>

          <Box>
            <FooterHeading>
              {tradingHours.length ? 'Trading Hours' : 'Customer Support'}
            </FooterHeading>

            {tradingHours.length > 0 ? (
              <VStack align="stretch" spacing={4}>
                {tradingHours.map((item) => (
                  <HStack
                    key={item.day}
                    justify="space-between"
                    align="flex-start"
                    spacing={4}
                  >
                    <Text color={MUTED} fontSize="sm">
                      {item.day}
                    </Text>

                    <Text
                      color="white"
                      fontSize="xs"
                      fontWeight="600"
                      textAlign="right"
                    >
                      {item.hours}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            ) : (
              <Text color={MUTED} fontSize="sm" lineHeight="1.9">
                Find your next device, ask a product question or
                get help with an existing order.
              </Text>
            )}

            {whatsappDigits && (
              <Button
                as="a"
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                mt={6}
                leftIcon={<FaWhatsapp size={19} />}
                variant="outline"
                borderColor="#2acb77"
                color="#60e69c"
                size="sm"
                _hover={{
                  bg: '#123e2c',
                  textDecoration: 'none'
                }}
              >
                WhatsApp Us
              </Button>
            )}
          </Box>
        </SimpleGrid>

        <Divider borderColor="whiteAlpha.200" mt={12} />

        <Box
          display="flex"
          flexDirection={{ base: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ base: 'flex-start', md: 'center' }}
          gap={4}
          py={6}
        >
          <Text color={MUTED} fontSize="xs" lineHeight="1.8">
            © {new Date().getFullYear()} DeviceLinkUp. All rights reserved.
          </Text>

          <HStack spacing={6} flexWrap="wrap">
            <ChakraLink
              as={Link}
              to="/privacy"
              color={MUTED}
              fontSize="xs"
              _hover={{ color: 'white' }}
            >
              Privacy Policy
            </ChakraLink>

            <ChakraLink
              as={Link}
              to="/terms"
              color={MUTED}
              fontSize="xs"
              _hover={{ color: 'white' }}
            >
              Terms of Service
            </ChakraLink>
          </HStack>
        </Box>
      </Container>
    </Box>
  )
}