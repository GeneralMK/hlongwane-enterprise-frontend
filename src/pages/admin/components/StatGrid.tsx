import { SimpleGrid } from '@chakra-ui/react'
import type { ReactNode } from 'react'

export default function StatGrid({ children }: { children: ReactNode }) {
  return <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>{children}</SimpleGrid>
}
