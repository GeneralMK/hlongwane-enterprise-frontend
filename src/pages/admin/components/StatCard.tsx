import { Box, Flex, Icon, Text } from '@chakra-ui/react'
import type { ElementType } from 'react'
import Panel from './Panel'

type Props = {
  title: string
  value: string
  helper: string
  icon?: ElementType
  helperColor?: string
}

export default function StatCard({
  title,
  value,
  helper,
  icon,
  helperColor = 'green.700'
}: Props) {
  return (
    <Panel>
      <Flex justify="space-between">
        <Box>
          <Text fontSize="sm" color="gray.700">{title}</Text>
          <Text mt={5} fontSize="2xl" fontWeight="700">{value}</Text>
          <Text fontSize="xs" color={helperColor}>↗ {helper}</Text>
        </Box>
        {icon && <Icon as={icon} boxSize={4} color="gray.500" />}
      </Flex>
    </Panel>
  )
}
