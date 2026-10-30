import {
  Box,
  Button,
  Container,
  HStack,
  SimpleGrid,
  Text,
  VStack,
  Link as ChakraLink
} from '@chakra-ui/react'
import images from '../theme/images'
import { useNavigate } from 'react-router-dom'

const MailIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
    <path d="M4 6h16v12H4z" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

const PhoneIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
    <path
      d="M6.6 3.8 9 6.2c.6.6.6 1.5.1 2.1l-1 1.2c1.2 2.4 3.1 4.3 5.5 5.5l1.2-1c.6-.5 1.5-.5 2.1.1l2.4 2.4c.7.7.6 1.8-.2 2.4-1 .8-2.2 1.2-3.5 1.1C9.1 19.4 4.6 14.9 4 8.4c-.1-1.3.3-2.5 1.1-3.5.6-.8 1.8-.9 2.5-.1Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
)

const PinIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
    <path
      d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <circle cx="12" cy="10" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

export default function FooterCTA() {
  const navigate = useNavigate()
  return (
    <Box as="footer" bg="#2d2d2d" color="white">
      {/* PROVEN IMPACT */}
      <Box bg="#2d2d2d" pt={{ base: 14, md: 20 }} pb={{ base: 12, md: 18 }}>
        <Container maxW="6xl">
          <Text
            textAlign="center"
            fontSize={{ base: '3xl', md: '4xl' }}
            fontWeight="700"
            color="white"
            mb={{ base: 10, md: 12 }}
          >
            Proven Impact
          </Text>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 10, md: 16 }}>
            <VStack spacing={3}>
              <Text fontSize={{ base: '4xl', md: '5xl' }} fontWeight="300">
                15-25%
              </Text>
              <Text color="gray.300" fontSize="md" textAlign="center">
                Reduction in infrastructure failures
              </Text>
            </VStack>

            <VStack spacing={3}>
              <Text fontSize={{ base: '4xl', md: '5xl' }} fontWeight="300">
                20-30%
              </Text>
              <Text color="gray.300" fontSize="md" textAlign="center">
                Cost reduction in vegetation management
              </Text>
            </VStack>

            <VStack spacing={3}>
              <Text fontSize={{ base: '4xl', md: '5xl' }} fontWeight="300">
                100%
              </Text>
              <Text color="gray.300" fontSize="md" textAlign="center">
                Compliance with national regulations
              </Text>
            </VStack>
          </SimpleGrid>
        </Container>
      </Box>

      {/* CTA IMAGE SECTION */}
      <Box
        position="relative"
        minH={{ base: '460px', md: '560px' }}
        bgImage={`url(${images.footerBackgroundImg})`}
        bgSize="cover"
        bgPosition="center"
        display="flex"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
      >
        <Box position="absolute" inset={0} bg="rgba(0,0,0,0.45)" />

        <Container maxW="6xl" position="relative" zIndex={1} top={20}>
          <VStack spacing={6} textAlign="center" maxW="900px" mx="auto">
            <Text
              fontSize={{ base: '3xl', md: '5xl' }}
              fontWeight="300"
              lineHeight="1.15"
              color="white"
            >
              Fix it before it breaks.
              <br />
              Start with a pilot project
            </Text>

            <Text
              maxW="780px"
              color="whiteAlpha.900"
              fontSize={{ base: 'sm', md: 'lg' }}
              lineHeight="1.6"
            >
              Test our approach on a defined scope before committing to a full program. Pilot
              projects provide proof of value and build organizational buy-in.
            </Text>

            <Button
              bg="white"
              color="#2d2d2d"
              px={7}
              h="48px"
              fontSize="sm"
              fontWeight="400"
              rounded="md"
              _hover={{ bg: 'gray.100' }}
              onClick={() =>
                navigate('/contact-us', {
                  state: {
                    requestType: 'Book a Pilot Assessment'
                  }
                })
              }
            >
              Book a Pilot Assessment →
            </Button>
          </VStack>
        </Container>
      </Box>

      {/* FOOTER LINKS */}
      <Box bg="#2d2d2d" py={{ base: 12, md: 16 }}>
        <Container maxW="6xl">
          <SimpleGrid
            columns={{ base: 1, md: 3 }}
            spacing={{ base: 10, md: 24 }}
            maxW="950px"
            mx="auto"
          >
            <VStack align="start" spacing={4}>
              <Text fontSize="sm" fontWeight="600" color="white">
                Quick Links
              </Text>

              {['About', 'Technology', 'Services', 'Industries', 'Contact'].map((item) => (
                <ChakraLink
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  color="gray.400"
                  fontSize="sm"
                  _hover={{ color: 'white', textDecoration: 'none' }}
                >
                  {item}
                </ChakraLink>
              ))}
            </VStack>

            <VStack align="start" spacing={4}>
              <Text fontSize="sm" fontWeight="600" color="white">
                Sectors
              </Text>

              {[
                'Power Utilities',
                'Telecommunications',
                'Mining',
                'Transport',
                'Agriculture',
                'Estates'
              ].map((item) => (
                <Text key={item} color="gray.400" fontSize="sm">
                  {item}
                </Text>
              ))}
            </VStack>

            <VStack align="start" spacing={4}>
              <Text fontSize="sm" fontWeight="600" color="white">
                Contact
              </Text>

              <HStack spacing={3} color="gray.400">
                <Box as={MailIcon} color="white" />
                <ChakraLink
                  href="mailto:info@nvsc.online"
                  fontSize="sm"
                  color="gray.400"
                  _hover={{ color: 'white', textDecoration: 'none' }}
                >
                  info@nvsc.online
                </ChakraLink>
              </HStack>

              <HStack spacing={3} color="gray.400">
                <Box as={PhoneIcon} color="white" />
                <ChakraLink
                  href="tel:+27123456789"
                  fontSize="sm"
                  color="gray.400"
                  _hover={{ color: 'white', textDecoration: 'none' }}
                >
                  011 267 0587
                </ChakraLink>
              </HStack>

              <HStack spacing={3} color="gray.400">
                <Box as={PinIcon} color="white" />
                <Text fontSize="sm">24 Rustenburg Road <br/>Magaliesburg<br/> 1791</Text>
              </HStack>
            </VStack>
          </SimpleGrid>

          <Box
            borderTop="1px solid"
            borderColor="whiteAlpha.100"
            mt={12}
            pt={6}
            maxW="950px"
            mx="auto"
          >
            <Text textAlign="center" color="gray.500" fontSize="sm">
              © {new Date().getFullYear()} National Vegetation Solutions Centre. All rights
              reserved.
            </Text>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
