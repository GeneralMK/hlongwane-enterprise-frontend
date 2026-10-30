import { Box, Flex, Text } from '@chakra-ui/react'

type Props = {
  values: number[]
  labels?: string[]
  max: number
}

export default function BarChart({
  values,
  labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  max
}: Props) {
  return (
    <Flex h="260px" align="flex-end" gap={4} px={4} borderBottom="1px solid" borderColor="gray.300">
      {values.map((value, index) => (
        <Flex key={labels[index]} flex="1" h="100%" direction="column" justify="flex-end" align="center" gap={2}>
          <Box w="100%" maxW="70px" h={`${(value / max) * 85}%`} bg="#176526" />
          <Text fontSize="xs" color="gray.500">{labels[index]}</Text>
        </Flex>
      ))}
    </Flex>
  )
}
