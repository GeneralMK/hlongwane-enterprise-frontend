import { Box, Flex } from '@chakra-ui/react'

type Props = {
  values?: number[]
  colors?: string[]
}

export default function PieChart({
  values = [45, 35, 20],
  colors = ['#176526', '#45a347', '#86c987']
}: Props) {
  let start = 0
  const gradient = values.map((value, index) => {
    const end = start + value
    const part = `${colors[index]} ${start}% ${end}%`
    start = end
    return part
  }).join(',')

  return (
    <Flex minH="260px" align="center" justify="center">
      <Box w="170px" h="170px" borderRadius="full" background={`conic-gradient(${gradient})`} />
    </Flex>
  )
}
