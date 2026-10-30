import {
  Box,
  Container,
  Image,
  Link as ChakraLink,
  SimpleGrid,
  Text
} from '@chakra-ui/react'
import {
  FaBolt,
  FaBullseye,
  FaCarSide,
  FaChair,
  FaMoneyBillWave,
  FaSatelliteDish,
  FaWrench
} from 'react-icons/fa'
import { Link } from 'react-router-dom'

import images from '../theme/images'

const categories = [
  {
    icon: FaChair,
    title: 'Interior',
    description: 'Seat covers, steering wheels, ambient lighting & more',
    itemCount: 7,
    image: images.interiorImg,
    slug: 'interior'
  },
  {
    icon: FaCarSide,
    title: 'Exterior',
    description: 'Spoilers, body kits, decals & chrome trims',
    itemCount: 7,
    image: images.exteriorImg,
    slug: 'exterior'
  },
  {
    icon: FaBolt,
    title: 'Performance',
    description: 'Exhausts, air filters, suspension & alloy wheels',
    itemCount: 4,
    image: images.performanceImg,
    slug: 'performance'
  },
  {
    icon: FaSatelliteDish,
    title: 'Tech & Electronics',
    description: 'Audio, dash cams, GPS, LED headlights & more',
    itemCount: 7,
    image: images.techElectronicsImg,
    slug: 'tech-electronics'
  }
]

const features = [
  {
    icon: FaWrench,
    title: 'Expert Fitment',
    description:
      'Every product comes with a professional installation guide and our fitment team is on call.',
    action: 'Browse Products',
    route: '/shop'
  },
  {
    icon: FaBullseye,
    title: '3D Preview',
    description:
      'See exactly how accessories look on your specific car before you buy. Pick make, model, colour & year.',
    action: 'Try Visualizer',
    route: '/3d-visualizer'
  },
  {
    icon: FaMoneyBillWave,
    title: 'Sell Your Car',
    description:
      "List your vehicle on South Africa's most active automotive marketplace. Free for private sellers.",
    action: 'List Your Car',
    route: '/sell-your-car'
  }
]

const ACCENT = '#ef3347'
const DISPLAY_FONT = "Impact, 'Arial Black', 'Roboto Condensed', sans-serif"
const LABEL_FONT = "'Roboto Condensed', 'Arial Narrow', sans-serif"

export default function Categories() {
  return (
    <Box as="section" bg="#070707" py={{ base: 16, md: 20, lg: 24 }}>
      <Container maxW="1420px" px={{ base: 5, md: 8 }}>
        <Text
          color={ACCENT}
          fontFamily={LABEL_FONT}
          fontSize="10px"
          fontWeight="800"
          letterSpacing="0.3em"
          textTransform="uppercase"
        >
          What We Offer
        </Text>

        <Text
          as="h2"
          mt={7}
          mb={{ base: 10, md: 14, lg: 16 }}
          color="white"
          fontFamily={DISPLAY_FONT}
          fontSize={{ base: '43px', md: '56px', lg: '62px' }}
          fontWeight="900"
          lineHeight="1"
          letterSpacing="0.005em"
          textTransform="uppercase"
        >
          Shop By Category
        </Text>

        <SimpleGrid
          columns={{ base: 1, md: 2, xl: 4 }}
          spacing={{ base: 5, md: 5 }}
        >
          {categories.map((category) => {
            const CategoryIcon = category.icon

            return (
              <ChakraLink
              key={category.slug}
              as={Link}
              to={`/shop?category=${category.slug}`}
              position="relative"
              minH={{ base: '360px', md: '390px' }}
              overflow="hidden"
              border="1px solid"
              borderColor="#242424"
              borderRadius="3px"
              bg="#101010"
              isolation="isolate"
              _hover={{ textDecoration: 'none' }}
              role="group"
            >
              <Image
                src={category.image}
                alt={`${category.title} car accessories`}
                position="absolute"
                inset={0}
                w="100%"
                h="100%"
                objectFit="cover"
                transition="transform 0.45s ease"
                _groupHover={{ transform: 'scale(1.05)' }}
              />

              <Box
                position="absolute"
                inset={0}
                bgGradient="linear(to-b, rgba(0,0,0,0.18) 0%, rgba(6,6,6,0.26) 38%, rgba(7,7,7,0.96) 100%)"
              />

              <Text
                position="absolute"
                top={5}
                right={5}
                px={3}
                py={2}
                border="1px solid"
                borderColor="#292929"
                borderRadius="2px"
                bg="rgba(8,8,8,0.76)"
                color="#8c8c8c"
                fontFamily={LABEL_FONT}
                fontSize="9px"
                fontWeight="700"
                letterSpacing="0.13em"
                textTransform="uppercase"
                backdropFilter="blur(4px)"
              >
                {category.itemCount} Items
              </Text>

              <Box
                position="absolute"
                left={{ base: 6, md: 7 }}
                right={{ base: 6, md: 7 }}
                bottom={{ base: 6, md: 7 }}
              >
                <Box color={ACCENT} mb={4}>
                  <CategoryIcon size={26} aria-hidden="true" />
                </Box>

                <Text
                  color="white"
                  fontFamily={DISPLAY_FONT}
                  fontSize={{ base: '28px', md: '30px' }}
                  fontWeight="900"
                  lineHeight="1"
                  textTransform="uppercase"
                  transition="color 0.2s ease"
                  _groupHover={{ color: ACCENT }}
                >
                  {category.title}
                </Text>

                <Text
                  mt={4}
                  maxW="310px"
                  color="#969696"
                  fontSize="14px"
                  lineHeight="1.55"
                >
                  {category.description}
                </Text>
              </Box>
              </ChakraLink>
            )
          })}
        </SimpleGrid>

        <SimpleGrid
          columns={{ base: 1, md: 3 }}
          spacing={{ base: 5, md: 6 }}
          mt={{ base: 14, md: 20 }}
          pt={{ base: 10, md: 14 }}
          borderTop="1px solid"
          borderColor="#1e1e1e"
        >
          {features.map((feature) => {
            const FeatureIcon = feature.icon

            return (
              <Box
                key={feature.title}
                minH={{ base: '270px', md: '292px' }}
                p={{ base: 7, md: 8 }}
                display="flex"
                flexDirection="column"
                alignItems="flex-start"
                border="1px solid"
                borderColor="#262626"
                borderRadius="3px"
                bg="#111111"
                transition="border-color 0.2s ease, transform 0.2s ease"
                _hover={{
                  borderColor: '#3b3b3b',
                  transform: 'translateY(-3px)'
                }}
              >
                <Box color={ACCENT} mb={7}>
                  <FeatureIcon size={24} aria-hidden="true" />
                </Box>

                <Text
                  color="white"
                  fontFamily={DISPLAY_FONT}
                  fontSize={{ base: '23px', md: '25px' }}
                  fontWeight="900"
                  lineHeight="1"
                  textTransform="uppercase"
                >
                  {feature.title}
                </Text>

                <Text
                  mt={5}
                  mb={6}
                  color="#747981"
                  fontSize="13px"
                  lineHeight="1.6"
                >
                  {feature.description}
                </Text>

                <ChakraLink
                  as={Link}
                  to={feature.route}
                  mt="auto"
                  minH="38px"
                  px={5}
                  display="inline-flex"
                  alignItems="center"
                  border="1px solid"
                  borderColor="#484848"
                  borderRadius="3px"
                  color="white"
                  fontFamily={LABEL_FONT}
                  fontSize="9px"
                  fontWeight="800"
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                  transition="all 0.2s ease"
                  _after={{ content: "' →'", ml: 1 }}
                  _hover={{
                    bg: ACCENT,
                    borderColor: ACCENT,
                    textDecoration: 'none'
                  }}
                >
                  {feature.action}
                </ChakraLink>
              </Box>
            )
          })}
        </SimpleGrid>
      </Container>
    </Box>
  )
}