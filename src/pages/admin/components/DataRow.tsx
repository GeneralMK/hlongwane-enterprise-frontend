import { Flex } from '@chakra-ui/react'
import type { ReactNode } from 'react'

type Props = {
  left: ReactNode
  right: ReactNode
  border?: boolean
}

export default function DataRow({ left, right, border = true }: Props) {
  return (
    <Flex justify="space-between" align="center" py={3} borderBottom={border ? '1px solid' : 'none'} borderColor="gray.200">
      {left}
      {right}
    </Flex>
  )
}
