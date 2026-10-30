import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Container,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Link as ChakraLink,
  Text,
  VStack
} from '@chakra-ui/react'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  RefreshCcw,
  UserRound
} from 'lucide-react'
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import { Link, useNavigate } from 'react-router-dom'

import OtpInput from '../../components/OtpInput'
import { useAuthContext } from '../../context/Auth'
import WebsiteLayout from '../../layout/WebsiteLayout'

const BRAND = '#173F1F'
const LIGHT_GREEN = '#EDF4E5'
const BORDER = '#D7DFC8'
const BACKGROUND = '#FCFBF7'
const TEXT = '#23351F'
const SUBTEXT = '#5F6B58'

const OTP_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

type FormState = {
  firstName: string
  lastName: string
  email: string
  password: string
  acceptedTerms: boolean
}

const initialForm: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  acceptedTerms: false
}

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (
    error &&
    typeof error === 'object'
  ) {
    const candidate = error as {
      response?: {
        data?: {
          message?: string
          error?: string
        }
      }
      message?: string
    }

    return (
      candidate.response?.data?.message ??
      candidate.response?.data?.error ??
      candidate.message ??
      fallback
    )
  }

  return fallback
}

function formatCountdown(
  totalSeconds: number
): string {
  const minutes = Math.floor(
    totalSeconds / 60
  )

  const seconds =
    totalSeconds % 60

  return `${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(
    2,
    '0'
  )}`
}

export default function SignUpPage() {
  const navigate = useNavigate()

  const {
    signUp,
    verifyRegistrationOtp,
    resendRegistrationOtp
  } = useAuthContext()

  const [
    form,
    setForm
  ] =
    useState<FormState>(
      initialForm
    )

  const [
    otpCode,
    setOtpCode
  ] =
    useState('')

  const [
    otpStep,
    setOtpStep
  ] =
    useState(false)

  const [
    showPassword,
    setShowPassword
  ] =
    useState(false)

  const [
    isSubmitting,
    setIsSubmitting
  ] =
    useState(false)

  const [
    isResending,
    setIsResending
  ] =
    useState(false)

  const [
    resendCountdown,
    setResendCountdown
  ] =
    useState(0)

  const [
    errorMessage,
    setErrorMessage
  ] =
    useState('')

  const [
    successMessage,
    setSuccessMessage
  ] =
    useState('')

  const normalisedEmail =
    form.email
      .trim()
      .toLowerCase()

  const isValid =
    useMemo(() => {
      return (
        form.firstName
          .trim()
          .length > 0 &&
        form.lastName
          .trim()
          .length > 0 &&
        normalisedEmail.length > 0 &&
        form.password
          .trim()
          .length >= 6 &&
        form.acceptedTerms
      )
    }, [
      form,
      normalisedEmail
    ])

  const canResend =
    otpStep &&
    resendCountdown === 0 &&
    !isResending &&
    !isSubmitting

  const startResendCountdown =
    useCallback(() => {
      setResendCountdown(
        RESEND_COOLDOWN_SECONDS
      )
    }, [])

  useEffect(() => {
    if (
      !otpStep ||
      resendCountdown <= 0
    ) {
      return
    }

    const intervalId =
      window.setInterval(
        () => {
          setResendCountdown(
            current =>
              Math.max(
                current - 1,
                0
              )
          )
        },
        1000
      )

    return () => {
      window.clearInterval(
        intervalId
      )
    }
  }, [
    otpStep,
    resendCountdown
  ])

  function updateField<
    K extends keyof FormState
  >(
    key: K,
    value: FormState[K]
  ): void {
    setForm(current => ({
      ...current,
      [key]: value
    }))
  }

  async function handleSubmit():
    Promise<void> {
    if (
      !isValid ||
      isSubmitting
    ) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await signUp({
        firstName:
          form.firstName.trim(),
        lastName:
          form.lastName.trim(),
        email:
          normalisedEmail,
        password:
          form.password
      })

      setOtpCode('')
      setOtpStep(true)
      startResendCountdown()

      setSuccessMessage(
        'A verification code has been sent to your email address.'
      )
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          'Failed to create account. Please try again.'
        )
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerifyOtp():
    Promise<void> {
    if (
      otpCode.length !==
        OTP_LENGTH ||
      isSubmitting
    ) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await verifyRegistrationOtp(
        normalisedEmail,
        otpCode
      )

      navigate(
        '/dashboard'
      )
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          'Invalid OTP. Please try again.'
        )
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResendOtp():
    Promise<void> {
    if (!canResend) {
      return
    }

    setIsResending(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await resendRegistrationOtp(
        normalisedEmail
      )

      setOtpCode('')
      startResendCountdown()

      setSuccessMessage(
        'A new verification code has been sent to your email address.'
      )
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          'Unable to resend the verification code. Please try again.'
        )
      )
    } finally {
      setIsResending(false)
    }
  }

  function handleChangeEmail():
    void {
    if (
      isSubmitting ||
      isResending
    ) {
      return
    }

    setOtpStep(false)
    setOtpCode('')
    setResendCountdown(0)
    setErrorMessage('')
    setSuccessMessage('')
  }

  return (
    <WebsiteLayout>
      <Box
        bg={BACKGROUND}
        minH="100vh"
      >
        <Container
          maxW="520px"
          minH="100vh"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          py="48px"
        >
          <VStack
            spacing="18px"
            mb="28px"
          >
            <Box
              w="72px"
              h="72px"
              bg={BRAND}
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <UserRound
                color="white"
                size={34}
              />
            </Box>

            <Text
              color={BRAND}
              fontSize="36px"
              fontWeight="800"
              lineHeight="1.1"
              textAlign="center"
            >
              {otpStep
                ? 'Verify Email'
                : 'Create Account'}
            </Text>
          </VStack>

          <Box
            bg="white"
            borderRadius="24px"
            boxShadow="0 12px 40px rgba(0,0,0,0.06)"
            p={{
              base: '24px',
              md: '32px'
            }}
            w="100%"
          >
            {!otpStep ? (
              <HStack
                bg={LIGHT_GREEN}
                borderRadius="999px"
                p="4px"
                mb="32px"
              >
                <Button
                  as={Link}
                  to="/login"
                  flex="1"
                  h="44px"
                  borderRadius="999px"
                  bg="transparent"
                  color={BRAND}
                  fontWeight="800"
                  _hover={{
                    bg: 'transparent'
                  }}
                >
                  Sign In
                </Button>

                <Button
                  flex="1"
                  h="44px"
                  borderRadius="999px"
                  bg={BRAND}
                  color="white"
                  fontWeight="800"
                  _hover={{
                    bg: BRAND
                  }}
                >
                  Sign Up
                </Button>
              </HStack>
            ) : null}

            {otpStep ? (
              <VStack
                spacing="20px"
                align="stretch"
              >
                <Text
                  color={SUBTEXT}
                  fontSize="15px"
                  textAlign="center"
                  lineHeight="1.6"
                >
                  We sent a verification
                  code to{' '}

                  <Text
                    as="span"
                    color={BRAND}
                    fontWeight="800"
                  >
                    {normalisedEmail}
                  </Text>
                </Text>

                {errorMessage ? (
                  <Alert
                    status="error"
                    borderRadius="12px"
                    fontSize="13px"
                  >
                    <AlertIcon />

                    {errorMessage}
                  </Alert>
                ) : null}

                {successMessage ? (
                  <Alert
                    status="success"
                    borderRadius="12px"
                    fontSize="13px"
                  >
                    <AlertIcon />

                    {successMessage}
                  </Alert>
                ) : null}

                <OtpInput
                  value={otpCode}
                  onChange={value => {
                    setOtpCode(
                      value.replace(
                        /\D/g,
                        ''
                      )
                    )

                    if (
                      errorMessage
                    ) {
                      setErrorMessage(
                        ''
                      )
                    }
                  }}
                  length={OTP_LENGTH}
                  isDisabled={
                    isSubmitting ||
                    isResending
                  }
                />

                <Button
                  h="52px"
                  bg={BRAND}
                  color="white"
                  borderRadius="999px"
                  fontSize="18px"
                  fontWeight="800"
                  isLoading={
                    isSubmitting
                  }
                  loadingText="Verifying"
                  isDisabled={
                    otpCode.length !==
                      OTP_LENGTH ||
                    isSubmitting ||
                    isResending
                  }
                  onClick={() => {
                    void handleVerifyOtp()
                  }}
                  _hover={{
                    bg: '#0E2D15'
                  }}
                  _disabled={{
                    bg: '#9AA392',
                    cursor:
                      'not-allowed'
                  }}
                >
                  Verify Email
                </Button>

                <VStack spacing={2}>
                  {resendCountdown > 0 ? (
                    <Text
                      color={SUBTEXT}
                      fontSize="13px"
                      textAlign="center"
                    >
                      Resend code in{' '}

                      <Text
                        as="span"
                        color={BRAND}
                        fontWeight="800"
                      >
                        {formatCountdown(
                          resendCountdown
                        )}
                      </Text>
                    </Text>
                  ) : (
                    <Text
                      color={SUBTEXT}
                      fontSize="13px"
                      textAlign="center"
                    >
                      Did not receive the
                      code?
                    </Text>
                  )}

                  <Button
                    variant="ghost"
                    color={BRAND}
                    leftIcon={
                      <RefreshCcw
                        size={16}
                      />
                    }
                    isLoading={
                      isResending
                    }
                    loadingText="Resending"
                    isDisabled={
                      !canResend
                    }
                    onClick={() => {
                      void handleResendOtp()
                    }}
                    _hover={{
                      bg: LIGHT_GREEN
                    }}
                    _disabled={{
                      color:
                        'gray.400',
                      cursor:
                        'not-allowed'
                    }}
                  >
                    Resend OTP
                  </Button>
                </VStack>

                <Button
                  variant="ghost"
                  color={BRAND}
                  isDisabled={
                    isSubmitting ||
                    isResending
                  }
                  onClick={
                    handleChangeEmail
                  }
                >
                  Change email
                </Button>
              </VStack>
            ) : (
              <VStack
                spacing="20px"
                align="stretch"
              >
                {errorMessage ? (
                  <Alert
                    status="error"
                    borderRadius="12px"
                    fontSize="13px"
                  >
                    <AlertIcon />

                    {errorMessage}
                  </Alert>
                ) : null}

                <FormField
                  label="First Name *"
                  placeholder="John"
                  value={
                    form.firstName
                  }
                  onChange={value =>
                    updateField(
                      'firstName',
                      value
                    )
                  }
                  icon={
                    <UserRound
                      size={18}
                    />
                  }
                />

                <FormField
                  label="Last Name *"
                  placeholder="Smith"
                  value={
                    form.lastName
                  }
                  onChange={value =>
                    updateField(
                      'lastName',
                      value
                    )
                  }
                  icon={
                    <UserRound
                      size={18}
                    />
                  }
                />

                <FormField
                  label="Email Address *"
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={value =>
                    updateField(
                      'email',
                      value
                    )
                  }
                  icon={
                    <Mail size={18} />
                  }
                />

                <Box>
                  <Label>
                    Password *
                  </Label>

                  <InputGroup>
                    <InputLeftElement
                      h="48px"
                      color={SUBTEXT}
                    >
                      <Lock size={18} />
                    </InputLeftElement>

                    <Input
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      h="48px"
                      pl="46px"
                      pr="46px"
                      value={
                        form.password
                      }
                      onChange={event =>
                        updateField(
                          'password',
                          event.target
                            .value
                        )
                      }
                      placeholder="••••••••"
                      borderColor={
                        BORDER
                      }
                      borderWidth="2px"
                      borderRadius="12px"
                      _focus={{
                        borderColor:
                          BRAND,
                        boxShadow:
                          `0 0 0 1px ${BRAND}`
                      }}
                    />

                    <InputRightElement h="48px">
                      <IconButton
                        aria-label="Toggle password visibility"
                        icon={
                          showPassword
                            ? (
                              <EyeOff
                                size={
                                  18
                                }
                              />
                            )
                            : (
                              <Eye
                                size={
                                  18
                                }
                              />
                            )
                        }
                        size="sm"
                        variant="ghost"
                        color={SUBTEXT}
                        onClick={() =>
                          setShowPassword(
                            value =>
                              !value
                          )
                        }
                      />
                    </InputRightElement>
                  </InputGroup>

                  <Text
                    color={SUBTEXT}
                    fontSize="11px"
                    mt="6px"
                  >
                    Password must be at
                    least 6 characters.
                  </Text>
                </Box>

                <Checkbox
                  colorScheme="green"
                  isChecked={
                    form.acceptedTerms
                  }
                  onChange={event =>
                    updateField(
                      'acceptedTerms',
                      event.target.checked
                    )
                  }
                >
                  <Text
                    color={TEXT}
                    fontSize="14px"
                    lineHeight="1.4"
                  >
                    I agree to the{' '}

                    <ChakraLink
                      as={Link}
                      to="/terms"
                      color={BRAND}
                      fontWeight="700"
                    >
                      Terms & Conditions
                    </ChakraLink>{' '}

                    and{' '}

                    <ChakraLink
                      as={Link}
                      to="/privacy"
                      color={BRAND}
                      fontWeight="700"
                    >
                      Privacy Policy
                    </ChakraLink>
                  </Text>
                </Checkbox>

                <Button
                  h="52px"
                  bg={BRAND}
                  color="white"
                  borderRadius="999px"
                  fontSize="18px"
                  fontWeight="800"
                  isLoading={
                    isSubmitting
                  }
                  loadingText="Creating account"
                  isDisabled={
                    !isValid ||
                    isSubmitting
                  }
                  onClick={() => {
                    void handleSubmit()
                  }}
                  _hover={{
                    bg: '#0E2D15'
                  }}
                  _disabled={{
                    bg: '#9AA392',
                    cursor:
                      'not-allowed'
                  }}
                >
                  Create Account
                </Button>
              </VStack>
            )}
          </Box>

          <Text
            textAlign="center"
            color={SUBTEXT}
            fontSize="14px"
            mt="28px"
          >
            Need help?{' '}

            <ChakraLink
              as={Link}
              to="/contact-us"
              color={BRAND}
              fontWeight="700"
            >
              Contact Support
            </ChakraLink>
          </Text>
        </Container>
      </Box>
    </WebsiteLayout>
  )
}

function Label({
  children
}: {
  children: ReactNode
}) {
  return (
    <Text
      color={TEXT}
      fontSize="14px"
      fontWeight="800"
      mb="10px"
    >
      {children}
    </Text>
  )
}

function FormField({
  label,
  placeholder,
  type = 'text',
  icon,
  value,
  onChange
}: {
  label: string
  placeholder: string
  type?: string
  icon?: ReactNode
  value: string
  onChange: (
    value: string
  ) => void
}) {
  return (
    <Box>
      <Label>{label}</Label>

      <InputGroup>
        {icon ? (
          <InputLeftElement
            h="48px"
            color={SUBTEXT}
          >
            {icon}
          </InputLeftElement>
        ) : null}

        <Input
          type={type}
          h="48px"
          pl={
            icon
              ? '46px'
              : '16px'
          }
          value={value}
          onChange={event =>
            onChange(
              event.target.value
            )
          }
          placeholder={
            placeholder
          }
          borderColor={BORDER}
          borderWidth="2px"
          borderRadius="12px"
          color={TEXT}
          _placeholder={{
            color: '#9AA392'
          }}
          _focus={{
            borderColor: BRAND,
            boxShadow:
              `0 0 0 1px ${BRAND}`
          }}
        />
      </InputGroup>
    </Box>
  )
}