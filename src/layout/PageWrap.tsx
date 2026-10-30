import { Box, Flex, Heading, type StackProps, Text, VStack } from '@chakra-ui/react'
import type { ReactNode } from 'react'


type Props = StackProps & {
  title: string
  subtitle?: string
  rightElements?: ReactNode
  children: ReactNode
}

export default function PageWrap({ title, subtitle, rightElements, children, ...rest }: Props) {
  return (
    <Flex h="100vh" bg="white" overflow="hidden">
      {/* <AdminSidebar /> */}
      <Box flex="1" h="100vh" overflowY="auto" overflowX="hidden">
       {/* @ts-ignore */}
        <VStack align="stretch" spacing={6} minH="100%" px={{ base: 5, lg: 8 }} py={{ base: 5, lg: 7 }} {...rest}>
          <Flex justify="space-between" align="flex-start" gap={4}>
            <Box>
              <Heading size="lg">{title}</Heading>
              {subtitle && <Text mt={1} color="gray.500">{subtitle}</Text>}
            </Box>
            {rightElements}
          </Flex>
          {children}
        </VStack>
      </Box>
    </Flex>
  )
}
