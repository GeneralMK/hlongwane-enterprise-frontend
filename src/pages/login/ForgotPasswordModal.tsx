import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack
} from '@chakra-ui/react'
import {
  CheckCircle2,
  Mail
} from 'lucide-react'
import {
  type FormEvent,
  useMemo,
  useState
} from 'react'

const BRAND = '#173F1F'
const BRAND_HOVER = '#0E2D15'
const LIGHT_GREEN = '#EDF4E5'
const BORDER = '#D7DFC8'
const TEXT = '#23351F'
const SUBTEXT = '#5F6B58'

const API_HOST =
  import.meta.env.VITE_APP_API_HOST?.replace(
    /\/+$/,
    ''
  ) ?? ''

type ApiErrorBody = {
  message?: string
  error?: string
}

type ForgotPasswordModalProps = {
  isOpen: boolean
  initialEmail?: string
  onClose: () => void
}

function isValidEmail(
  value: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim()
  )
}

async function readResponseBody(
  response: Response
): Promise<ApiErrorBody> {
  try {
    const data =
      (await response.json()) as
        | ApiErrorBody
        | string

    if (typeof data === 'string') {
      return {
        message: data
      }
    }

    return data
  } catch {
    return {}
  }
}

export default function ForgotPasswordModal({
  isOpen,
  initialEmail = '',
  onClose
}: ForgotPasswordModalProps) {
  const [email, setEmail] =
    useState(initialEmail)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [
    isSubmitting,
    setIsSubmitting
  ] = useState(false)

  const [isSent, setIsSent] =
    useState(false)

  const normalizedEmail =
    email.trim().toLowerCase()

  const isValid = useMemo(
    () => isValidEmail(normalizedEmail),
    [normalizedEmail]
  )

  const resetState = () => {
    setErrorMessage('')
    setIsSubmitting(false)
    setIsSent(false)
  }

  const handleClose = () => {
    if (isSubmitting) {
      return
    }

    resetState()
    onClose()
  }

  const handleSubmit = async (
    event?: FormEvent<HTMLFormElement>
  ) => {
    event?.preventDefault()

    if (
      !isValid ||
      isSubmitting
    ) {
      return
    }

    if (!API_HOST) {
      setErrorMessage(
        'The authentication service is not configured.'
      )

      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const response = await fetch(
        `${API_HOST}/forgot-password`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            email: normalizedEmail
          })
        }
      )

      const responseBody =
        await readResponseBody(response)

      if (!response.ok) {
        throw new Error(
          responseBody.message ||
            responseBody.error ||
            'Unable to send the reset link.'
        )
      }

      setIsSent(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to send the reset link.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isCentered
      size={{
        base: 'full',
        sm: 'md'
      }}
      closeOnOverlayClick={
        !isSubmitting
      }
      closeOnEsc={!isSubmitting}
    >
      <ModalOverlay
        bg="rgba(7, 18, 10, 0.66)"
        backdropFilter="blur(12px)"
      />

      <ModalContent
        mx={{
          base: 4,
          sm: 0
        }}
        borderRadius={{
          base: '22px',
          sm: '26px'
        }}
        boxShadow="0 30px 90px rgba(0, 0, 0, 0.35)"
        overflow="hidden"
      >
        <ModalCloseButton
          top="18px"
          right="18px"
          isDisabled={isSubmitting}
        />

        {isSent ? (
          <>
            <Box
              display="flex"
              justifyContent="center"
              pt="40px"
            >
              <Box
                width="82px"
                height="82px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="full"
                bg={LIGHT_GREEN}
                color={BRAND}
              >
                <CheckCircle2
                  size={42}
                />
              </Box>
            </Box>

            <ModalHeader
              textAlign="center"
              pt="22px"
              pb="8px"
              color={TEXT}
              fontSize="28px"
              fontWeight="800"
            >
              Check Your Email
            </ModalHeader>

            <ModalBody
              px={{
                base: 6,
                md: 9
              }}
              pb="20px"
            >
              <Text
                color={SUBTEXT}
                textAlign="center"
                lineHeight="1.8"
              >
                If an account exists for{' '}

                <Text
                  as="span"
                  color={BRAND}
                  fontWeight="800"
                  wordBreak="break-word"
                >
                  {normalizedEmail}
                </Text>

                , we have sent a password
                reset link.
              </Text>

              <Text
                mt={4}
                color={SUBTEXT}
                textAlign="center"
                fontSize="13px"
              >
                The link expires in 20
                minutes. Check your spam
                folder if it does not arrive.
              </Text>
            </ModalBody>

            <ModalFooter
              px={{
                base: 6,
                md: 9
              }}
              pb="32px"
            >
              <Button
                width="100%"
                height="50px"
                borderRadius="999px"
                bg={BRAND}
                color="white"
                onClick={handleClose}
                _hover={{
                  bg: BRAND_HOVER
                }}
              >
                Return to Sign In
              </Button>
            </ModalFooter>
          </>
        ) : (
          <Box
            as="form"
            onSubmit={handleSubmit}
          >
            <Box
              display="flex"
              justifyContent="center"
              pt="40px"
            >
              <Box
                width="82px"
                height="82px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="full"
                bg={LIGHT_GREEN}
                color={BRAND}
              >
                <Mail size={40} />
              </Box>
            </Box>

            <ModalHeader
              textAlign="center"
              pt="22px"
              pb="8px"
              color={TEXT}
              fontSize="28px"
              fontWeight="800"
            >
              Reset Your Password
            </ModalHeader>

            <ModalBody
              px={{
                base: 6,
                md: 9
              }}
              pb="20px"
            >
              <VStack
                align="stretch"
                spacing="20px"
              >
                <Text
                  color={SUBTEXT}
                  textAlign="center"
                  lineHeight="1.7"
                >
                  Enter your email address
                  and we will send you a
                  secure password reset link.
                </Text>

                {errorMessage ? (
                  <Alert
                    status="error"
                    borderRadius="12px"
                  >
                    <AlertIcon />

                    <AlertDescription>
                      {errorMessage}
                    </AlertDescription>
                  </Alert>
                ) : null}

                <Box>
                  <Text
                    mb="10px"
                    color={TEXT}
                    fontSize="14px"
                    fontWeight="800"
                  >
                    Email Address
                  </Text>

                  <InputGroup>
                    <InputLeftElement
                      h="50px"
                      color={SUBTEXT}
                    >
                      <Mail size={19} />
                    </InputLeftElement>

                    <Input
                      type="email"
                      height="50px"
                      pl="46px"
                      value={email}
                      placeholder="john@example.com"
                      autoComplete="email"
                      isDisabled={
                        isSubmitting
                      }
                      borderColor={BORDER}
                      borderWidth="2px"
                      borderRadius="12px"
                      onChange={event => {
                        setEmail(
                          event.target.value
                        )

                        if (errorMessage) {
                          setErrorMessage('')
                        }
                      }}
                      _focus={{
                        borderColor: BRAND,
                        boxShadow:
                          `0 0 0 1px ${BRAND}`
                      }}
                    />
                  </InputGroup>
                </Box>
              </VStack>
            </ModalBody>

            <ModalFooter
              px={{
                base: 6,
                md: 9
              }}
              pb="32px"
              pt="8px"
              display="flex"
              flexDirection="column"
              gap="10px"
            >
              <Button
                type="submit"
                width="100%"
                height="52px"
                borderRadius="999px"
                bg={BRAND}
                color="white"
                fontWeight="800"
                isLoading={isSubmitting}
                loadingText="Sending link"
                isDisabled={
                  !isValid ||
                  isSubmitting
                }
                _hover={{
                  bg: BRAND_HOVER
                }}
                _disabled={{
                  bg: '#9AA392',
                  cursor: 'not-allowed'
                }}
              >
                Send Reset Link
              </Button>

              <Button
                type="button"
                width="100%"
                variant="ghost"
                color={SUBTEXT}
                isDisabled={
                  isSubmitting
                }
                onClick={handleClose}
              >
                Cancel
              </Button>
            </ModalFooter>
          </Box>
        )}
      </ModalContent>
    </Modal>
  )
}