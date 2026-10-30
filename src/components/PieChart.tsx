import {
  Box,
  Flex,
  HStack,
  Text,
  VStack
} from '@chakra-ui/react'
import { useMemo } from 'react'

type PieChartItem = {
  label: string
  value: number
}

type PieChartProps = {
  data: PieChartItem[]
}

export default function PieChart({
  data
}: PieChartProps) {
  const total = useMemo(
    () =>
      data.reduce(
        (sum, item) => sum + item.value,
        0
      ),
    [data]
  )

  const gradient = useMemo(() => {
    if (total <= 0) {
      return 'conic-gradient(#edf2f7 0deg 360deg)'
    }

    const colours = [
      '#22543d',
      '#38a169',
      '#68d391',
      '#9ae6b4',
      '#276749',
      '#48bb78'
    ]

    let currentPercentage = 0

    const segments = data.map((item, index) => {
      const start = currentPercentage
      const percentage = (item.value / total) * 100

      currentPercentage += percentage

      return `${colours[index % colours.length]} ${start}% ${currentPercentage}%`
    })

    return `conic-gradient(${segments.join(', ')})`
  }, [data, total])

  if (!data.length || total <= 0) {
    return (
      <Flex minH="220px" align="center" justify="center">
        <Text color="gray.500">
          No category data available.
        </Text>
      </Flex>
    )
  }

  return (
    <Flex
      minH="260px"
      align="center"
      justify="center"
      gap={8}
      direction={{ base: 'column', md: 'row' }}
    >
      <Box
        w="180px"
        h="180px"
        borderRadius="full"
        background={gradient}
        position="relative"
        flexShrink={0}
      >
        <Flex
          position="absolute"
          inset="38px"
          bg="white"
          borderRadius="full"
          align="center"
          justify="center"
          direction="column"
        >
          <Text fontSize="sm" color="gray.500">
            Revenue
          </Text>

          <Text fontWeight="700">
            {total.toLocaleString('en-ZA')}
          </Text>
        </Flex>
      </Box>

      <VStack align="stretch" spacing={3}>
        {data.map((item, index) => {
          const percentage =
            total > 0
              ? (item.value / total) * 100
              : 0

          return (
            <HStack
              key={item.label}
              justify="space-between"
              spacing={6}
            >
              <HStack>
                <Box
                  w="10px"
                  h="10px"
                  borderRadius="full"
                  bg={[
                    '#22543d',
                    '#38a169',
                    '#68d391',
                    '#9ae6b4',
                    '#276749',
                    '#48bb78'
                  ][index % 6]}
                />

                <Text fontSize="sm">
                  {item.label}
                </Text>
              </HStack>

              <Text
                fontSize="sm"
                fontWeight="600"
              >
                {percentage.toFixed(1)}%
              </Text>
            </HStack>
          )
        })}
      </VStack>
    </Flex>
  )
}