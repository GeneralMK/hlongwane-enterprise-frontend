import { HStack, Input } from '@chakra-ui/react'
import { useRef } from 'react'

type OtpInputProps = {
  value: string
  length?: number
  isDisabled?: boolean
  onChange: (value: string) => void
}

export default function OtpInput({
  value,
  length = 6,
  isDisabled = false,
  onChange
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  const values = Array.from({ length }, (_, index) => value[index] || '')

  const updateOtp = (index: number, nextValue: string) => {
    const digit = nextValue.replace(/\D/g, '').slice(-1)
    const next = values.map((item, itemIndex) => (itemIndex === index ? digit : item)).join('')

    onChange(next)

    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !values[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()

    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, length)

    onChange(pasted)

    const nextIndex = Math.min(pasted.length, length - 1)
    inputsRef.current[nextIndex]?.focus()
  }

  return (
    <HStack spacing="10px" justify="center">
      {values.map((digit, index) => (
        <Input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element
          }}
          value={digit}
          isDisabled={isDisabled}
          onChange={(event) => updateOtp(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          inputMode="numeric"
          maxLength={1}
          textAlign="center"
          h="54px"
          w="48px"
          borderRadius="12px"
          borderWidth="2px"
          borderColor="#D7DFC8"
          fontSize="24px"
          fontWeight="800"
          color="#173F1F"
          _focus={{
            borderColor: '#173F1F',
            boxShadow: '0 0 0 1px #173F1F'
          }}
        />
      ))}
    </HStack>
  )
}