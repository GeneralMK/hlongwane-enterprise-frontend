import {
  Alert,
  AlertIcon,
  Box
} from '@chakra-ui/react'

import { SectionTitle } from '../components/AccountShared'

export function PaymentsSection() {
  return (
    <Box>
      <SectionTitle>
        Payment Methods
      </SectionTitle>

      <Alert
        status="info"
        borderRadius="12px"
      >
        <AlertIcon />

        Payment card details are securely managed through Paystack and are not stored directly in your account.
      </Alert>
    </Box>
  )
}
