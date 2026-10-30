import { Box, Button, Container, Text, VStack } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import images from '../theme/images'

export default function CallToActionSection() {
  const navigate = useNavigate()

  return (
    <Box
      as="section"
      position="relative"
      h={{ base: '360px', md: '775px' }}
      bgImage={`url(${images.farmCtaBg})`}
      bgSize="cover"
      bgPosition={{ base: 'center', md: 'center 42%' }}
      bgRepeat="no-repeat"
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
    >
      <Box position="absolute" inset={0} bg="rgba(0,0,0,0.28)" />

      <Container position="relative" zIndex={2} maxW="100%" px={4}>
        <VStack spacing="28px" textAlign="center" transform="translateY(-8px)">
          <Text
            color="white"
            fontSize={{ base: '30px', md: '46px' }}
            fontWeight="800"
            lineHeight="1.15"
          >
            Take Action Now To Revitalize Your Farm
          </Text>

          <Text
            color="white"
            fontSize={{ base: '20px', md: '30px' }}
            fontWeight="400"
            lineHeight="1.2"
          >
            Start Hiring Our Equipment(s) Today!
          </Text>

          <Button
            mt="26px"
            h="82px"
            w={{ base: '230px', md: '288px' }}
            bg="#111"
            color="white"
            borderRadius="2px"
            fontSize="28px"
            fontWeight="800"
            _hover={{ bg: '#173f1f' }}
            onClick={() => navigate('/book-consultation')}
          >
            CONSULT
          </Button>
        </VStack>
      </Container>
    </Box>
  )
}