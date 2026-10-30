import { Badge, Box, Flex, Progress, Text } from '@chakra-ui/react'

type Props = {
  name: string
  helper: string
  value: number
  badge?: string
}

export default function ProgressItem({
  name,
  helper,
  value,
  badge
}: Props) {
  const colorScheme =
    value >= 80
      ? 'green'
      : value >= 60
        ? 'yellow'
        : 'red'

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={2}>
        <Box>
          <Text fontWeight="500">{name}</Text>
          <Text fontSize="sm" color="gray.500">
            {helper}
          </Text>
        </Box>

        <Badge
          colorScheme={colorScheme}
          borderRadius="full"
          minW="72px"
          h="32px"
          px={3}
          display="flex"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          fontWeight="700"
          fontSize="sm"
          textTransform="uppercase"
        >
          {badge ?? `${value}%`}
        </Badge>
      </Flex>

      <Progress
        value={value}
        colorScheme="green"
        size="sm"
        borderRadius="full"
      />
    </Box>
  )
}