import {
  Box,
  Button,
  Container,
  HStack,
  IconButton,
  Image,
  SimpleGrid,
  Text,
  VStack
} from '@chakra-ui/react'
import {
  FaArrowRight,
  FaCheck,
  FaFacebookF,
  FaInstagram,
  FaPlus,
  FaStar,
  FaTiktok,
  FaWhatsapp,
  FaYoutube
} from 'react-icons/fa'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import images from '../theme/images'

const ACCENT = '#ef3347'
const DISPLAY_FONT = "Impact, 'Arial Black', 'Roboto Condensed', sans-serif"
const LABEL_FONT = "'Roboto Condensed', 'Arial Narrow', sans-serif"

const benefits = [
  'Save your cart & build configurations',
  'Track your orders and fitment appointments',
  'List your car  free for private sellers',
  'Member pricing on selected accessories'
]

const socialLinks = [
  { label: 'WhatsApp', icon: FaWhatsapp, href: '#' },
  { label: 'Instagram', icon: FaInstagram, href: '#' },
  { label: 'Facebook', icon: FaFacebookF, href: '#' },
  { label: 'TikTok', icon: FaTiktok, href: '#' },
  { label: 'YouTube', icon: FaYoutube, href: '#' }
]

export default function AccountGarageSection() {
  const [isSocialOpen, setIsSocialOpen] = useState(false)

  return (
    <Box
      as="section"
      position="relative"
      overflow="hidden"
      bg="#070707"
      py={{ base: 16, md: 20, lg: 24 }}
    >
      <Container maxW="1180px" px={{ base: 5, md: 8 }}>
        <SimpleGrid
          columns={{ base: 1, lg: 2 }}
          overflow="hidden"
          border="1px solid"
          borderColor="#242424"
          borderRadius="3px"
          bg="#0c0c0c"
          px={3}
        >
          <VStack
            align="flex-start"
            justify="center"
            spacing={0}
            minH={{ base: 'auto', lg: '590px' }}
            px={{ base: 7, md: 20, lg: 13 }}
            py={{ base: 12, md: 20, lg: 24 }}
          >
            <Text
              color={ACCENT}
              fontFamily={LABEL_FONT}
              fontSize="10px"
              fontWeight="800"
              letterSpacing="0.3em"
              textTransform="uppercase"
            >
              Join The Community
            </Text>

            <Text
              as="h2"
              mt={6}
              color="white"
              fontFamily={DISPLAY_FONT}
              fontSize={{ base: '45px', md: '58px' }}
              fontWeight="900"
              lineHeight="0.98"
              textTransform="uppercase"
            >
              Your Account,
              <Box as="span" display="block" mt={2} color={ACCENT}>
                Your Garage
              </Box>
            </Text>

            <Text
              mt={7}
              maxW="460px"
              color="#7f848c"
              fontSize={{ base: '14px', md: '15px' }}
              lineHeight="1.75"
            >
              Sign in or register to save your builds, track your orders, list your car for sale,
              and get access to member-only deals. It takes 30 seconds.
            </Text>

            <VStack align="stretch" spacing={4} mt={8}>
              {benefits.map((benefit) => (
                <HStack key={benefit} spacing={3} color="#8d8d8d">
                  <Box
                    boxSize="18px"
                    flexShrink={0}
                    display="grid"
                    placeItems="center"
                    border="1px solid"
                    borderColor="#8f2631"
                    borderRadius="full"
                    color={ACCENT}
                  >
                    <FaCheck size={8} />
                  </Box>
                  <Text fontSize="14px">{benefit}</Text>
                </HStack>
              ))}
            </VStack>

            <Button
              as={Link}
              to="/login"
              mt={9}
              h="56px"
              minW="225px"
              px={7}
              borderRadius="3px"
              bg={ACCENT}
              color="white"
              fontFamily={LABEL_FONT}
              fontSize="12px"
              fontWeight="800"
              letterSpacing="0.1em"
              textTransform="uppercase"
              display="inline-flex"
              alignItems="center"
              gap={2}
              _hover={{
                bg: '#d9273b',
                textDecoration: 'none'
              }}
            >
              Sign In / Register
              <FaArrowRight size={12} />
            </Button>
          </VStack>

          <Box position="relative" minH={{ base: '430px', lg: '590px' }}>
            <Image
              src={images.interiorImg}
              alt="Performance car representing a member garage"
              position="absolute"
              inset={0}
              w="100%"
              h="100%"
              objectFit="cover"
              objectPosition="center"
            />

            <Box
              position="absolute"
              inset={0}
              bgGradient="linear(to-b, rgba(16,6,9,0.26), rgba(17,7,10,0.18) 55%, rgba(17,7,10,0.48))"
            />
            {/* 
            <HStack
              position="absolute"
              left={{ base: 5, md: 8 }}
              right={{ base: 5, md: 8 }}
              bottom={{ base: 5, md: 8 }}
              minH="80px"
              px={{ base: 4, md: 5 }}
              spacing={4}
              border="1px solid"
              borderColor="#2a2224"
              borderRadius="3px"
              bg="rgba(8,8,8,0.88)"
              backdropFilter="blur(6px)"
            >
              <Box
                boxSize="44px"
                flexShrink={0}
                display="grid"
                placeItems="center"
                borderRadius="full"
                bg={ACCENT}
                color="#ffdf55"
              >
                <FaStar size={18} />
              </Box>

              <Box minW={0}>
                <Text
                  color="white"
                  fontFamily={LABEL_FONT}
                  fontSize={{ base: '12px', md: '14px' }}
                  fontWeight="800"
                >
                  “Best car platform in SA, hands down.”
                </Text>
                <Text
                  mt={2}
                  color="#77777c"
                  fontFamily={LABEL_FONT}
                  fontSize="8px"
                  fontWeight="700"
                  letterSpacing="0.15em"
                  textTransform="uppercase"
                >
                  Thabo M.  Johannesburg · Verified Buyer
                </Text>
              </Box>
            </HStack> */}
          </Box>
        </SimpleGrid>
      </Container>

      <VStack
        display={{ base: 'none', xl: 'flex' }}
        position="absolute"
        right={4}
        top="50%"
        transform="translateY(-50%)"
        spacing={2}
      >
        <VStack
          spacing={2}
          maxH={isSocialOpen ? '280px' : '0'}
          opacity={isSocialOpen ? 1 : 0}
          overflow="hidden"
          pointerEvents={isSocialOpen ? 'auto' : 'none'}
          transform={isSocialOpen ? 'translateY(0)' : 'translateY(18px)'}
          transition="max-height 0.35s ease, opacity 0.25s ease, transform 0.35s ease"
          aria-hidden={!isSocialOpen}
        >
          {socialLinks.map((social, index) => {
            const SocialIcon = social.icon

            return (
              <IconButton
                key={social.label}
                as="a"
                href={social.href}
                aria-label={social.label}
                tabIndex={isSocialOpen ? 0 : -1}
                icon={<SocialIcon size={17} />}
                isRound
                boxSize="50px"
                minW="50px"
                border="2px solid"
                borderColor="#393939"
                bg="#181818"
                color="#92959c"
                opacity={isSocialOpen ? 1 : 0}
                transform={isSocialOpen ? 'scale(1)' : 'scale(0.75)'}
                transition={`opacity 0.2s ease ${index * 45}ms, transform 0.25s ease ${
                  index * 45
                }ms, background 0.2s ease`}
                _hover={{ bg: ACCENT, borderColor: ACCENT, color: 'white' }}
              />
            )
          })}
        </VStack>

        <IconButton
          aria-label={isSocialOpen ? 'Close social links' : 'Open social links'}
          aria-expanded={isSocialOpen}
          icon={
            <Box
              display="flex"
              transition="transform 0.25s ease"
              transform={isSocialOpen ? 'rotate(45deg)' : 'rotate(0deg)'}
            >
              <FaPlus size={17} />
            </Box>
          }
          isRound
          boxSize="50px"
          minW="50px"
          border="3px solid"
          borderColor={isSocialOpen ? '#276a9a' : '#464646'}
          bg="#181818"
          color="white"
          onClick={() => setIsSocialOpen((open) => !open)}
          transition="border-color 0.25s ease, background 0.2s ease"
          _hover={{ bg: ACCENT, borderColor: ACCENT }}
        />
      </VStack>
    </Box>
  )
}
