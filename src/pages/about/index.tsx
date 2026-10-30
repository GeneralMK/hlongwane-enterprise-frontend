import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  SimpleGrid,
  Text,
  VStack
} from '@chakra-ui/react'
import {
  ArrowRight,
  Gamepad2,
  Headphones,
  Laptop,
  MessageCircle,
  Smartphone,
  Watch
} from 'lucide-react'
import { Link } from 'react-router-dom'
import WebsiteLayout from '../../layout/WebsiteLayout'


const BLUE = '#008fff'
const NAVY = '#07132b'
const MUTED = '#718096'

const categories = [
  {
    icon: Smartphone,
    title: 'Phones',
    description: 'Explore smartphones for everyday communication, work and entertainment.'
  },
  {
    icon: Laptop,
    title: 'Tablets',
    description: 'Discover portable devices for studying, creating and staying productive.'
  },
  {
    icon: Watch,
    title: 'Wearables',
    description: 'Find connected accessories that complement your everyday routine.'
  },
  {
    icon: Gamepad2,
    title: 'Gaming',
    description: 'Browse consoles and accessories for your next gaming setup.'
  },
  {
    icon: Headphones,
    title: 'Accessories',
    description: 'Complete your setup with practical accessories for your devices.'
  }
]

const steps = [
  {
    number: '01',
    title: 'Explore our collection',
    description: 'Browse our catalogue and find a device or accessory that interests you.'
  },
  {
    number: '02',
    title: 'Speak to our team',
    description: 'Contact us to confirm availability and ask any questions before purchasing.'
  },
  {
    number: '03',
    title: 'Confirm your purchase',
    description:
      'Once availability and order details are confirmed, our team will guide you through the next steps.'
  }
]

export default function AboutPage() {
  return (
    <WebsiteLayout>
      <Box as="main" bg="white" color={NAVY} fontFamily="Arial, Helvetica, sans-serif">
        {/* Hero */}
        <Box as="section" position="relative" overflow="hidden" bg="#000b16">
          <Image
            src="/images/home/hero-devices.png"
            alt=""
            position="absolute"
            inset={0}
            w="full"
            h="full"
            objectFit="cover"
            objectPosition="right center"
            opacity={0.45}
          />

          <Box
            position="absolute"
            inset={0}
            bgGradient="linear(to-r, #000b16 0%, rgba(0,11,22,0.95) 35%, rgba(0,11,22,0.3) 100%)"
          />

          <Container
            maxW="1280px"
            position="relative"
            px={{ base: 6, lg: 10 }}
            py={{ base: 16, md: 24 }}
          >
            <Text
              color="#54b8ff"
              fontSize="xs"
              fontWeight="700"
              letterSpacing="0.16em"
              textTransform="uppercase"
              mb={4}
            >
              About DeviceLinkUp
            </Text>

            <Heading
              as="h1"
              maxW="700px"
              color="white"
              fontSize={{ base: '40px', md: '62px' }}
              fontWeight="800"
              letterSpacing="-0.05em"
              lineHeight="1.05"
            >
              Your Devices.
              <Box as="span" display="block">
                Our{' '}
                <Box as="span" color={BLUE}>
                  Connection.
                </Box>
              </Box>
            </Heading>

            <Text
              mt={6}
              maxW="540px"
              color="#c7d4e3"
              fontSize={{ base: '16px', md: '18px' }}
              lineHeight="1.8"
            >
              Connecting you with phones, tablets, wearables, gaming consoles and accessories that
              fit your world.
            </Text>

            <Button
              as={Link}
              to="/shop"
              mt={7}
              bg={BLUE}
              color="white"
              borderRadius="full"
              h="48px"
              px={7}
              rightIcon={<ArrowRight size={18} />}
              _hover={{
                bg: '#007ada',
                textDecoration: 'none'
              }}
            >
              Explore the shop
            </Button>
          </Container>
        </Box>

        {/* Introduction */}
        <Container maxW="1280px" px={{ base: 6, lg: 10 }} py={{ base: 12, md: 20 }}>
          <SimpleGrid
            columns={{ base: 1, lg: 2 }}
            spacing={{ base: 8, lg: 16 }}
            alignItems="center"
          >
            <Box>
              <Text
                color="#0076cf"
                fontSize="xs"
                fontWeight="700"
                letterSpacing="0.14em"
                textTransform="uppercase"
                mb={3}
              >
                Who we are
              </Text>

              <Heading
                as="h2"
                fontSize={{ base: '30px', md: '40px' }}
                letterSpacing="-0.04em"
                lineHeight="1.15"
              >
                Technology for the way you live.
              </Heading>
            </Box>

            <VStack align="stretch" spacing={4}>
              <Text color={MUTED} lineHeight="1.9">
                DeviceLinkUp brings devices and accessories together in one place. Whether you are
                looking for your next smartphone, a tablet for work or a console for your downtime,
                our catalogue is a place to start.
              </Text>

              <Text color={MUTED} lineHeight="1.9">
                We want choosing your next device to feel clear and straightforward. Explore the
                collection, ask questions and speak to our team to confirm availability before
                making your purchase.
              </Text>
            </VStack>
          </SimpleGrid>
        </Container>

        {/* Categories */}
        <Box as="section" bg="#f7f9fc">
          <Container maxW="1280px" px={{ base: 6, lg: 10 }} py={{ base: 12, md: 16 }}>
            <Box textAlign="center" maxW="600px" mx="auto" mb={9}>
              <Heading as="h2" fontSize={{ base: '28px', md: '36px' }} letterSpacing="-0.04em">
                Find your next connection.
              </Heading>

              <Text mt={3} color={MUTED} lineHeight="1.8">
                Explore devices for work, entertainment and everyday life.
              </Text>
            </Box>

            <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={4}>
              {categories.map(({ icon, title, description }) => (
                <Box key={title} bg="white" p={6} border="1px solid #e8edf4" borderRadius="12px">
                  <Flex
                    boxSize="48px"
                    align="center"
                    justify="center"
                    bg="#eef7ff"
                    borderRadius="12px"
                    mb={5}
                  >
                    <Icon as={icon} boxSize={6} color={BLUE} strokeWidth={1.8} />
                  </Flex>

                  <Heading as="h3" fontSize="lg" mb={3}>
                    {title}
                  </Heading>

                  <Text color={MUTED} fontSize="sm" lineHeight="1.8">
                    {description}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Container>
        </Box>

        {/* Purchase journey */}
        <Container as="section" maxW="1280px" px={{ base: 6, lg: 10 }} py={{ base: 12, md: 20 }}>
          <Heading as="h2" fontSize={{ base: '28px', md: '36px' }} letterSpacing="-0.04em" mb={3}>
            From browsing to your next device.
          </Heading>

          <Text color={MUTED} maxW="620px" lineHeight="1.8" mb={9}>
            Start with the catalogue. Our team can help you confirm the details before you pay.
          </Text>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={7}>
            {steps.map((step) => (
              <Box key={step.number} borderTop="2px solid" borderColor="#d5eaff" pt={5}>
                <Text color={BLUE} fontSize="32px" fontWeight="800" letterSpacing="-0.04em">
                  {step.number}
                </Text>

                <Heading as="h3" fontSize="lg" mt={3} mb={3}>
                  {step.title}
                </Heading>

                <Text color={MUTED} fontSize="sm" lineHeight="1.9">
                  {step.description}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Container>

        {/* Contact */}
        <Box as="section" bg="#eef7ff" borderTop="1px solid #dcecff">
          <Container maxW="1280px" px={{ base: 6, lg: 10 }} py={{ base: 10, md: 14 }}>
            <Flex
              direction={{ base: 'column', md: 'row' }}
              align={{ base: 'flex-start', md: 'center' }}
              justify="space-between"
              gap={7}
            >
              <Box maxW="650px">
                <HStack spacing={2} mb={3}>
                  <Icon as={MessageCircle} color={BLUE} boxSize={5} />
                  <Text color="#0076cf" fontSize="sm" fontWeight="600">
                    Let’s connect
                  </Text>
                </HStack>

                <Heading as="h2" fontSize={{ base: '28px', md: '34px' }} letterSpacing="-0.04em">
                  Need help choosing?
                </Heading>

                <Text mt={3} color={MUTED} lineHeight="1.8">
                  Contact our team with your questions or to check availability on a device you have
                  your eye on.
                </Text>
              </Box>

              <Button
                as={Link}
                to="/contact"
                h="48px"
                px={7}
                bg={BLUE}
                color="white"
                borderRadius="full"
                flexShrink={0}
                rightIcon={<ArrowRight size={18} />}
                _hover={{
                  bg: '#007ada',
                  textDecoration: 'none'
                }}
              >
                Contact us
              </Button>
            </Flex>
          </Container>
        </Box>
      </Box>
    </WebsiteLayout>
  )
}
