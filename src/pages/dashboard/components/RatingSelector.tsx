import {
  HStack,
  IconButton
} from '@chakra-ui/react'
import { Star } from 'lucide-react'
import { useState } from 'react'

export function RatingSelector({
  value,
  onChange
}: {
  value: number

  onChange:
    (value: number) => void
}) {
  const [
    hover,
    setHover
  ] =
    useState(0)

  const activeValue =
    hover ||
    value

  return (
    <HStack spacing={1}>
      {[1, 2, 3, 4, 5].map(
        star => (
          <IconButton
            key={
              star
            }
            aria-label={`Rate ${star} out of 5`}
            icon={
              <Star
                size={30}
                fill={
                  star <=
                  activeValue
                    ? 'currentColor'
                    : 'none'
                }
              />
            }
            variant="ghost"
            minW="42px"
            color={
              star <=
              activeValue
                ? 'yellow.400'
                : 'gray.300'
            }
            onMouseEnter={() =>
              setHover(
                star
              )
            }
            onMouseLeave={() =>
              setHover(0)
            }
            onClick={() =>
              onChange(
                star
              )
            }
          />
        )
      )}
    </HStack>
  )
}
