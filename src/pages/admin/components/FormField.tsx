import { FormControl, FormLabel } from '@chakra-ui/react'
import type { ReactNode } from 'react'

export default function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <FormControl>
      <FormLabel fontSize="sm">{label}</FormLabel>
      {children}
    </FormControl>
  )
}
