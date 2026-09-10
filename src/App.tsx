import { Box, Button, Container, Heading, HStack, Text, VStack } from '@chakra-ui/react'
import { Link, Route, Routes } from 'react-router-dom'

function HomePage() {
  return (
    <Container maxW="7xl" py={10}>
      <VStack align="start" spacing={6}>
        <Text fontWeight="bold">Hlongwane Enterprise</Text>
        <Heading size="2xl">Technology for the way you live and work.</Heading>
        <Text maxW="2xl" color="gray.600">
          Shop phones, laptops, tablets and accessories from one trusted platform.
        </Text>
        <HStack>
          <Button as={Link} to="/shop" colorScheme="blue">
            Shop devices
          </Button>
        </HStack>
      </VStack>
    </Container>
  )
}

function ShopPage() {
  return (
    <Container maxW="7xl" py={10}>
      <Heading>Shop</Heading>
      <Text mt={4}>Product catalogue coming next.</Text>
    </Container>
  )
}

export default function App() {
  return (
    <Box minH="100vh">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
      </Routes>
    </Box>
  )
}
