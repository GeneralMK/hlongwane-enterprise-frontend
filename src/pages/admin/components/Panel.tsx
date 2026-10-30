import { Card, CardBody, Flex, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'

type Props = {
  title?: string
  right?: ReactNode
  children: ReactNode
}

export default function Panel({ title, right, children }: Props) {
  return (
    <Card border="1px solid" borderColor="gray.200" borderRadius="12px" boxShadow="none">
      <CardBody p={5}>
        {(title || right) && (
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="600">{title}</Text>
            {right}
          </Flex>
        )}
        {children}
      </CardBody>
    </Card>
  )
}
