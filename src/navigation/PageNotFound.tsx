import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  Text,
  VStack
} from '@chakra-ui/react'
import {
  AlertCircle,
  ArrowLeft,
  Home
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import images from '../theme/images'

export default function PageNotFound() {
  const navigate = useNavigate()

  return (
    <Flex
      minH="100vh"
      position="relative"
      overflow="hidden"
      bg="linear-gradient(180deg, #F8FCFB 0%, #FFFFFF 100%)"
      align="center"
      justify="center"
      px={6}
    >
      {/* Decorative circles */}
      <Box
        position="absolute"
        top="-140px"
        right="-120px"
        w="320px"
        h="320px"
        bg="#EAF6F3"
        borderRadius="full"
      />

      <Box
        position="absolute"
        bottom="-140px"
        left="-120px"
        w="260px"
        h="260px"
        bg="#EEF4FA"
        borderRadius="full"
      />

      <Container maxW="780px">
        <VStack spacing={10}>
          <Image
            src={images.logo}
            width="190px"
            objectFit="contain"
          />

          <Box
            w="100%"
            bg="white"
            border="1px solid"
            borderColor="#D4E7DE"
            borderRadius="24px"
            p={{
              base: 8,
              md: 12
            }}
            boxShadow="0 20px 60px rgba(0,0,0,0.06)"
          >
            <VStack
              align="start"
              spacing={6}
            >
              <Badge
                px={4}
                py={2}
                borderRadius="full"
                bg="#DFF1EA"
                color="#234D38"
                fontSize="sm"
                fontWeight="700"
              >
                Error 404
              </Badge>

              <HStack
                align="center"
                spacing={3}
              >
                <Icon
                  as={AlertCircle}
                  color="#184D35"
                  boxSize={7}
                />

                <Heading
                  size="2xl"
                  color="#1B1E28"
                  fontWeight="800"
                >
                  Page not found
                </Heading>
              </HStack>

              <Text
                fontSize="lg"
                color="#667085"
                maxW="600px"
                lineHeight="1.8"
              >
                The page you requested does not exist or may have moved.
                Use one of the actions below to continue.
              </Text>

              <HStack
                spacing={5}
                pt={2}
                flexWrap="wrap"
              >
                <Button
                  size="lg"
                  bg="#174B2B"
                  color="white"
                  leftIcon={<Home size={18} />}
                  _hover={{
                    bg: '#123A21'
                  }}
                  borderRadius="14px"
                  px={8}
                  onClick={() =>
                    navigate('/login')
                  }
                >
                  Go to login
                </Button>

                <Button
                  variant="ghost"
                  size="lg"
                  leftIcon={<ArrowLeft size={18} />}
                  color="#1B1E28"
                  _hover={{
                    bg: 'gray.100'
                  }}
                  onClick={() => navigate(-1)}
                >
                  Go back
                </Button>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Flex>
  )
}