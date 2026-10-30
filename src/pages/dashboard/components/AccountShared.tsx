import {
  Box,
  Center,
  Input,
  Text,
  VStack
} from '@chakra-ui/react'
import type { ReactNode } from 'react'

import { BRAND_GREEN } from '../constants'

export function SectionTitle({
  children
}: {
  children:
    ReactNode
}) {
  return (
    <Text
      color={BRAND_GREEN}
      fontSize="30px"
      fontWeight="800"
      mb="24px"
    >
      {children}
    </Text>
  )
}

export function EmptyState({
  title,
  message
}: {
  title: string
  message: string
}) {
  return (
    <Center
      bg="white"
      borderRadius="18px"
      boxShadow="0 8px 24px rgba(0,0,0,0.06)"
      minH="240px"
      px={6}
    >
      <VStack spacing={2}>
        <Text
          color={BRAND_GREEN}
          fontSize="lg"
          fontWeight="800"
        >
          {title}
        </Text>

        <Text
          color="gray.500"
          textAlign="center"
        >
          {message}
        </Text>
      </VStack>
    </Center>
  )
}

export function Field({
  label,
  value
}: {
  label: string
  value: string
}) {
  return (
    <Box>
      <Text
        color={BRAND_GREEN}
        fontSize="13px"
        fontWeight="800"
        mb="8px"
      >
        {label}
      </Text>

      <Input
        h="48px"
        borderColor="#cfdcc5"
        borderRadius="12px"
        value={value}
        readOnly
      />
    </Box>
  )
}

export function Info({
  label,
  value
}: {
  label: string
  value: string
}) {
  return (
    <Box>
      <Text
        color="#53664b"
        fontSize="13px"
      >
        {label}
      </Text>

      <Text
        color={BRAND_GREEN}
        fontSize="17px"
        fontWeight="800"
      >
        {value}
      </Text>
    </Box>
  )
}