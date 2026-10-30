import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Link as ChakraLink,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure
} from '@chakra-ui/react'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { CheckCircle2, Eye, EyeOff, Lock, Mail, RefreshCcw, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import OtpInput from '../../components/OtpInput'
import { useAuthContext } from '../../context'
import WebsiteLayout from '../../layout/WebsiteLayout'

const BRAND = '#173F1F'
const BRAND_HOVER = '#0E2D15'
const LIGHT_GREEN = '#EDF4E5'
const BORDER = '#D7DFC8'
const BACKGROUND = '#FCFBF7'
const TEXT = '#23351F'
const SUBTEXT = '#5F6B58'

const OTP_LENGTH = 6
const OTP_RESEND_SECONDS = 60

const API_HOST = import.meta.env.VITE_APP_API_HOST?.replace(/\/+$/, '') ?? ''

type ApiErrorResponse = {
  code?: string
  message?: string
  error?: string

  errors?: Array<{
    message?: string
  }>
}

function getApiErrorData(error: unknown): {
  status?: number
  code?: string
  message: string
} {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (
      error as {
        response?: {
          status?: number
          data?: ApiErrorResponse | string
        }
      }
    ).response

    const responseData = response?.data

    if (typeof responseData === 'string') {
      return {
        status: response?.status,

        message: responseData.trim() || 'Unable to sign in.'
      }
    }

    const nestedMessage = responseData?.errors?.find((item) => item.message)?.message

    return {
      status: response?.status,

      code: responseData?.code,

      message:
        responseData?.message ||
        responseData?.error ||
        nestedMessage ||
        getStatusErrorMessage(response?.status, 'Unable to sign in.')
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message || 'Unable to sign in.'
    }
  }

  return {
    message: 'Unable to sign in.'
  }
}

function getStatusErrorMessage(status: number | undefined, fallbackMessage: string): string {
  switch (status) {
    case 400:
      return 'Please check your login details and try again.'

    case 401:
      return 'Incorrect email address or password.'

    case 403:
      return 'Your account does not have permission to sign in.'

    case 404:
      return 'No account was found with these details.'

    case 429:
      return 'Too many login attempts. Please try again later.'

    case 500:
    case 502:
    case 503:
      return 'The authentication service is temporarily unavailable.'

    default:
      return fallbackMessage
  }
}

function isEmailNotConfirmed(error: unknown): boolean {
  const errorData = getApiErrorData(error)

  const code = String(errorData.code || '')
    .trim()
    .toUpperCase()

  const message = errorData.message.trim().toLowerCase()

  return (
    code === 'EMAIL_NOT_CONFIRMED' ||
    code === 'ACCOUNT_NOT_CONFIRMED' ||
    code === 'USER_NOT_CONFIRMED' ||
    message.includes('email not confirmed') ||
    message.includes('email is not confirmed') ||
    message.includes('account not confirmed') ||
    message.includes('confirm your email')
  )
}

export default function LoginPage() {
  const navigate = useNavigate()

  const { signIn, signInWithGoogle, verifyRegistrationOtp, resendRegistrationOtp } =
    useAuthContext()

  const { isOpen: isOtpModalOpen, onOpen: openOtpModal, onClose: closeOtpModal } = useDisclosure()

  const {
    isOpen: isForgotPasswordModalOpen,
    onOpen: openForgotPasswordModal,
    onClose: closeForgotPasswordModal
  } = useDisclosure()

  const [showPassword, setShowPassword] = useState(false)

  const [rememberMe, setRememberMe] = useState(true)

  const [email, setEmail] = useState('')

  const [password, setPassword] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)

  const [errorMessage, setErrorMessage] = useState('')

  const [otpCode, setOtpCode] = useState('')

  const [otpError, setOtpError] = useState('')

  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  const [isResendingOtp, setIsResendingOtp] = useState(false)

  const [otpResendCountdown, setOtpResendCountdown] = useState(0)

  const [otpSuccessMessage, setOtpSuccessMessage] = useState('')

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')

  const [forgotPasswordError, setForgotPasswordError] = useState('')

  const [isSendingResetLink, setIsSendingResetLink] = useState(false)

  const [isResetLinkSent, setIsResetLinkSent] = useState(false)

  const normalizedEmail = email.trim().toLowerCase()

  const isValid = useMemo(() => {
    return normalizedEmail.length > 0 && password.trim().length > 0
  }, [normalizedEmail, password])

  const canResendOtp =
    isOtpModalOpen && otpResendCountdown === 0 && !isResendingOtp && !isVerifyingOtp

  useEffect(() => {
    if (!isOtpModalOpen || otpResendCountdown <= 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      setOtpResendCountdown((current) => Math.max(current - 1, 0))
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isOtpModalOpen, otpResendCountdown])

  const formatOtpCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)

    const remainingSeconds = seconds % 60

    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  }

  const navigateAfterLogin = (): void => {
    const redirectPath = window.sessionStorage.getItem('mckenzie-login-redirect')

    if (redirectPath) {
      window.sessionStorage.removeItem('mckenzie-login-redirect')
    }

    navigate(redirectPath || '/dashboard', {
      replace: true
    })
  }

  const handleSubmit = async (): Promise<void> => {
    if (!isValid || isSubmitting || isGoogleSubmitting) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      await signIn(normalizedEmail, null, true, password, false, 'web', rememberMe)

      navigateAfterLogin()
    } catch (error) {
      if (isEmailNotConfirmed(error)) {
        setOtpCode('')
        setOtpError('')
        setOtpSuccessMessage('')
        setOtpResendCountdown(OTP_RESEND_SECONDS)
        setErrorMessage('')

        openOtpModal()
        return
      }

      const errorData = getApiErrorData(error)

      setErrorMessage(errorData.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtp = async (): Promise<void> => {
    if (otpCode.length !== OTP_LENGTH || isVerifyingOtp) {
      return
    }

    setIsVerifyingOtp(true)
    setOtpError('')

    try {
      await verifyRegistrationOtp(normalizedEmail, otpCode)

      /*
       * OTP verification confirms the account.
       * Sign in again to create the authenticated
       * browser session.
       */
      await signIn(normalizedEmail, null, true, password, false, 'web', rememberMe)

      closeOtpModal()
      navigateAfterLogin()
    } catch (error) {
      const errorData = getApiErrorData(error)

      setOtpError(errorData.message || 'The verification code is invalid or has expired.')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleResendOtp = async (): Promise<void> => {
    if (!canResendOtp) {
      return
    }

    setIsResendingOtp(true)
    setOtpError('')
    setOtpSuccessMessage('')

    try {
      await resendRegistrationOtp(normalizedEmail)

      setOtpCode('')
      setOtpResendCountdown(OTP_RESEND_SECONDS)
      setOtpSuccessMessage('A new verification code has been sent to your email address.')
    } catch (error) {
      const errorData = getApiErrorData(error)

      setOtpError(errorData.message || 'Unable to resend the verification code.')
    } finally {
      setIsResendingOtp(false)
    }
  }

  const handleCloseOtpModal = (): void => {
    if (isVerifyingOtp || isResendingOtp) {
      return
    }

    setOtpCode('')
    setOtpError('')
    setOtpSuccessMessage('')
    setOtpResendCountdown(0)
    closeOtpModal()
  }

  const handleOpenForgotPasswordModal = (): void => {
    setForgotPasswordEmail(normalizedEmail)
    setForgotPasswordError('')
    setIsResetLinkSent(false)
    openForgotPasswordModal()
  }

  const handleCloseForgotPasswordModal = (): void => {
    if (isSendingResetLink) {
      return
    }

    setForgotPasswordError('')
    setIsResetLinkSent(false)
    closeForgotPasswordModal()
  }

  const handleSendResetLink = async (): Promise<void> => {
    const resetEmail = forgotPasswordEmail.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail) || isSendingResetLink) {
      return
    }

    if (!API_HOST) {
      setForgotPasswordError('The authentication service is not configured.')
      return
    }

    setIsSendingResetLink(true)
    setForgotPasswordError('')

    try {
      const response = await fetch(`${API_HOST}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: resetEmail
        })
      })

      let responseData: ApiErrorResponse | string | null = null

      try {
        responseData = await response.json()
      } catch {
        responseData = null
      }

      if (!response.ok) {
        const message =
          typeof responseData === 'string'
            ? responseData
            : responseData?.message || responseData?.error || 'Unable to send the reset link.'

        throw new Error(message)
      }

      setIsResetLinkSent(true)
    } catch (error) {
      setForgotPasswordError(
        error instanceof Error ? error.message : 'Unable to send the reset link.'
      )
    } finally {
      setIsSendingResetLink(false)
    }
  }

  const handleGoogleSuccess = async (response: CredentialResponse): Promise<void> => {
    if (!response.credential || isGoogleSubmitting || isSubmitting) {
      if (!response.credential) {
        setErrorMessage('Google did not return a login credential.')
      }

      return
    }

    setIsGoogleSubmitting(true)
    setErrorMessage('')

    try {
      await signInWithGoogle(response.credential, rememberMe)

      navigateAfterLogin()
    } catch (error) {
      const errorData = getApiErrorData(error)

      setErrorMessage(errorData.message || 'Google authentication failed.')
    } finally {
      setIsGoogleSubmitting(false)
    }
  }

  return (
    <WebsiteLayout>
      <Box bg={BACKGROUND} minH="100vh">
        <Container
          maxW="680px"
          minH="100vh"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          py={{
            base: '32px',
            md: '48px'
          }}
        >
          <VStack spacing="20px" mb="34px">
            <Box textAlign="center">
              <Text
                color={BRAND}
                fontSize={{
                  base: '34px',
                  md: '36px'
                }}
                fontWeight="800"
                lineHeight="1.1"
              >
                Welcome Back
              </Text>

              <Text color={SUBTEXT} fontSize="16px" mt="10px">
                Sign in to access your account
              </Text>
            </Box>
          </VStack>

          <Box
            bg="white"
            borderRadius="24px"
            boxShadow="0 12px 40px rgba(0,0,0,0.06)"
            p={{
              base: '24px',
              md: '32px'
            }}
          >
            <HStack bg={LIGHT_GREEN} borderRadius="999px" p="4px" mb="32px" spacing={1}>
              <Button
                as={Link}
                to="/login"
                type="button"
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
                Sign In
              </Button>

              <Button
                as={Link}
                to="/register"
                type="button"
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
                Sign Up
              </Button>

              <Button
                as={Link}
                to="/admin/login"
                type="button"
                flex="1"
                h="44px"
                borderRadius="999px"
                bg="transparent"
                color={BRAND}
                fontWeight="800"
                fontSize={{
                  base: '12px',
                  md: '14px'
                }}
                whiteSpace="nowrap"
                _hover={{
                  bg: 'white'
                }}
              >
                Admin
              </Button>
            </HStack>

            <VStack spacing="22px" align="stretch">
              {errorMessage ? (
                <Alert status="error" borderRadius="12px" fontSize="13px">
                  <AlertIcon />

                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              <FormField
                label="Email Address *"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(value) => {
                  setEmail(value)

                  if (errorMessage) {
                    setErrorMessage('')
                  }
                }}
                icon={<Mail size={20} />}
                isDisabled={isSubmitting || isGoogleSubmitting}
              />

              <Box>
                <Text color={TEXT} fontSize="14px" fontWeight="800" mb="10px">
                  Password *
                </Text>

                <InputGroup>
                  <InputLeftElement h="48px" color={SUBTEXT}>
                    <Lock size={20} />
                  </InputLeftElement>

                  <Input
                    type={showPassword ? 'text' : 'password'}
                    h="48px"
                    pl="46px"
                    pr="46px"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)

                      if (errorMessage) {
                        setErrorMessage('')
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        void handleSubmit()
                      }
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    borderColor={BORDER}
                    borderWidth="2px"
                    borderRadius="12px"
                    color={TEXT}
                    isDisabled={isSubmitting || isGoogleSubmitting}
                    _placeholder={{
                      color: '#9AA392'
                    }}
                    _focus={{
                      borderColor: BRAND,
                      boxShadow: `0 0 0 1px ${BRAND}`
                    }}
                  />

                  <InputRightElement h="48px">
                    <IconButton
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      size="sm"
                      variant="ghost"
                      color={SUBTEXT}
                      onClick={() => {
                        setShowPassword((current) => !current)
                      }}
                    />
                  </InputRightElement>
                </InputGroup>
              </Box>

              <HStack justify="space-between" pt="2px">
                <Checkbox
                  colorScheme="green"
                  isChecked={rememberMe}
                  isDisabled={isSubmitting || isGoogleSubmitting}
                  onChange={(event) => {
                    setRememberMe(event.target.checked)
                  }}
                >
                  <Text color={TEXT} fontSize="14px">
                    Remember me
                  </Text>
                </Checkbox>

                <ChakraLink
                  as="button"
                  type="button"
                  color={BRAND}
                  fontSize="14px"
                  isDisabled={isSubmitting || isGoogleSubmitting}
                  onClick={handleOpenForgotPasswordModal}
                  _hover={{
                    textDecoration: 'none',
                    color: BRAND_HOVER
                  }}
                >
                  Forgot password?
                </ChakraLink>
              </HStack>

              <Button
                type="button"
                w="100%"
                h="52px"
                bg={BRAND}
                color="white"
                borderRadius="999px"
                fontSize="18px"
                fontWeight="800"
                mt="4px"
                isLoading={isSubmitting}
                loadingText="Signing in"
                isDisabled={!isValid || isSubmitting || isGoogleSubmitting}
                onClick={() => {
                  void handleSubmit()
                }}
                _hover={{
                  bg: BRAND_HOVER
                }}
                _disabled={{
                  bg: '#9AA392',
                  cursor: 'not-allowed'
                }}
              >
                Sign In
              </Button>
              {/* 
              <HStack pt="6px">
                <Divider
                  borderColor={BORDER}
                />

                <Text
                  color={SUBTEXT}
                  fontSize="14px"
                  whiteSpace="nowrap"
                >
                  Or continue with
                </Text>

                <Divider
                  borderColor={BORDER}
                /> 
              </HStack>

              {/* <Box
                position="relative"
                width="100%"
                minH="48px"
                display="flex"
                justifyContent="center"
                alignItems="center"
                opacity={
                  isGoogleSubmitting
                    ? 0.7
                    : 1
                }
                pointerEvents={
                  isGoogleSubmitting ||
                  isSubmitting
                    ? 'none'
                    : 'auto'
                }
              >
                
                  
              </Box> */}
            </VStack>
          </Box>

          <Text textAlign="center" color={SUBTEXT} fontSize="14px" mt="28px">
            Need help?{' '}
            <ChakraLink
              as={Link}
              to="/contact-us"
              color={BRAND}
              fontWeight="700"
              _hover={{
                textDecoration: 'none'
              }}
            >
              Contact Support
            </ChakraLink>
          </Text>
        </Container>
      </Box>

      <Modal
        isOpen={isForgotPasswordModalOpen}
        onClose={handleCloseForgotPasswordModal}
        isCentered
        size={{
          base: 'full',
          sm: 'md'
        }}
        closeOnOverlayClick={!isSendingResetLink}
        closeOnEsc={!isSendingResetLink}
      >
        <ModalOverlay bg="rgba(7, 18, 10, 0.66)" backdropFilter="blur(12px)" />

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
          <ModalCloseButton top="18px" right="18px" isDisabled={isSendingResetLink} />

          <Box display="flex" justifyContent="center" pt="38px">
            <Box
              width="82px"
              height="82px"
              bg={LIGHT_GREEN}
              color={BRAND}
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {isResetLinkSent ? <CheckCircle2 size={42} /> : <Mail size={40} />}
            </Box>
          </Box>

          <ModalHeader
            pt="20px"
            pb="6px"
            textAlign="center"
            color={TEXT}
            fontSize={{
              base: '26px',
              md: '30px'
            }}
            fontWeight="800"
          >
            {isResetLinkSent ? 'Check Your Email' : 'Reset Your Password'}
          </ModalHeader>

          <ModalBody
            px={{
              base: 6,
              md: 9
            }}
            pb="20px"
          >
            {isResetLinkSent ? (
              <VStack spacing="16px" align="stretch">
                <Text color={SUBTEXT} textAlign="center" lineHeight="1.7" fontSize="15px">
                  If an account exists for{' '}
                  <Text as="span" color={BRAND} fontWeight="800" wordBreak="break-word">
                    {forgotPasswordEmail.trim().toLowerCase()}
                  </Text>
                  , a secure password reset link has been sent.
                </Text>

                <Text color={SUBTEXT} textAlign="center" fontSize="13px" lineHeight="1.6">
                  The link expires in 20 minutes. Check your spam folder if it does not arrive.
                </Text>
              </VStack>
            ) : (
              <VStack spacing="20px" align="stretch">
                <Text color={SUBTEXT} textAlign="center" lineHeight="1.7" fontSize="15px">
                  Enter your email address and we will send you a secure password reset link.
                </Text>

                {forgotPasswordError ? (
                  <Alert status="error" borderRadius="12px">
                    <AlertIcon />

                    <AlertDescription>{forgotPasswordError}</AlertDescription>
                  </Alert>
                ) : null}

                <FormField
                  label="Email Address *"
                  type="email"
                  placeholder="john@example.com"
                  value={forgotPasswordEmail}
                  onChange={(value) => {
                    setForgotPasswordEmail(value)

                    if (forgotPasswordError) {
                      setForgotPasswordError('')
                    }
                  }}
                  icon={<Mail size={20} />}
                  isDisabled={isSendingResetLink}
                />
              </VStack>
            )}
          </ModalBody>

          <ModalFooter
            px={{
              base: 6,
              md: 9
            }}
            pb="32px"
            pt="6px"
            display="flex"
            flexDirection="column"
            gap="12px"
          >
            {isResetLinkSent ? (
              <Button
                width="100%"
                height="52px"
                bg={BRAND}
                color="white"
                borderRadius="999px"
                fontWeight="800"
                onClick={handleCloseForgotPasswordModal}
                _hover={{
                  bg: BRAND_HOVER
                }}
              >
                Return to Sign In
              </Button>
            ) : (
              <>
                <Button
                  width="100%"
                  height="52px"
                  bg={BRAND}
                  color="white"
                  borderRadius="999px"
                  fontWeight="800"
                  isLoading={isSendingResetLink}
                  loadingText="Sending link"
                  isDisabled={
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordEmail.trim().toLowerCase()) ||
                    isSendingResetLink
                  }
                  onClick={() => {
                    void handleSendResetLink()
                  }}
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
                  width="100%"
                  variant="ghost"
                  color={SUBTEXT}
                  isDisabled={isSendingResetLink}
                  onClick={handleCloseForgotPasswordModal}
                >
                  Cancel
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isOtpModalOpen}
        onClose={handleCloseOtpModal}
        isCentered
        size={{
          base: 'full',
          sm: 'md'
        }}
        closeOnOverlayClick={false}
        closeOnEsc={false}
        trapFocus
        returnFocusOnClose
        preserveScrollBarGap
      >
        <ModalOverlay bg="rgba(7, 18, 10, 0.66)" backdropFilter="blur(12px)" />

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
          <Box display="flex" justifyContent="center" pt="36px">
            <Box
              width="80px"
              height="80px"
              bg={LIGHT_GREEN}
              color={BRAND}
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <ShieldCheck size={40} />
            </Box>
          </Box>

          <ModalHeader
            pt="20px"
            pb="6px"
            textAlign="center"
            color={TEXT}
            fontSize={{
              base: '26px',
              md: '30px'
            }}
            fontWeight="800"
          >
            Verify Your Email
          </ModalHeader>

          <ModalCloseButton top="18px" right="18px" isDisabled={isVerifyingOtp || isResendingOtp} />

          <ModalBody
            px={{
              base: 6,
              md: 9
            }}
            pb="20px"
          >
            <VStack spacing="22px" align="stretch">
              <Text color={SUBTEXT} textAlign="center" lineHeight="1.7" fontSize="15px">
                Your email address has not been confirmed. Enter the six-digit verification code
                sent to{' '}
                <Text as="span" color={BRAND} fontWeight="800" wordBreak="break-word">
                  {normalizedEmail}
                </Text>
              </Text>

              {otpError ? (
                <Alert status="error" borderRadius="12px">
                  <AlertIcon />

                  <AlertDescription>{otpError}</AlertDescription>
                </Alert>
              ) : null}

              {otpSuccessMessage ? (
                <Alert status="success" borderRadius="12px">
                  <AlertIcon />

                  <AlertDescription>{otpSuccessMessage}</AlertDescription>
                </Alert>
              ) : null}

              <OtpInput
                value={otpCode}
                onChange={(value) => {
                  const numericValue = value.replace(/\D/g, '').slice(0, OTP_LENGTH)

                  setOtpCode(numericValue)

                  if (otpError) {
                    setOtpError('')
                  }
                }}
                length={OTP_LENGTH}
                isDisabled={isVerifyingOtp || isResendingOtp}
              />

              <VStack spacing="8px">
                {otpResendCountdown > 0 ? (
                  <Text textAlign="center" color={SUBTEXT} fontSize="13px">
                    You can resend the code in{' '}
                    <Text as="span" color={BRAND} fontWeight="800">
                      {formatOtpCountdown(otpResendCountdown)}
                    </Text>
                  </Text>
                ) : (
                  <Text textAlign="center" color={SUBTEXT} fontSize="13px">
                    Did not receive the code?
                  </Text>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  color={BRAND}
                  leftIcon={<RefreshCcw size={16} />}
                  isLoading={isResendingOtp}
                  loadingText="Resending"
                  isDisabled={!canResendOtp}
                  onClick={() => {
                    void handleResendOtp()
                  }}
                  _hover={{
                    bg: LIGHT_GREEN
                  }}
                  _disabled={{
                    color: 'gray.400',
                    cursor: 'not-allowed'
                  }}
                >
                  Resend OTP
                </Button>
              </VStack>
            </VStack>
          </ModalBody>

          <ModalFooter
            px={{
              base: 6,
              md: 9
            }}
            pb="32px"
            pt="6px"
            display="flex"
            flexDirection="column"
            gap="12px"
          >
            <Button
              width="100%"
              height="52px"
              bg={BRAND}
              color="white"
              borderRadius="999px"
              fontWeight="800"
              fontSize="17px"
              isLoading={isVerifyingOtp}
              loadingText="Verifying"
              isDisabled={otpCode.length !== OTP_LENGTH || isVerifyingOtp || isResendingOtp}
              onClick={() => {
                void handleVerifyOtp()
              }}
              _hover={{
                bg: BRAND_HOVER
              }}
              _disabled={{
                bg: '#9AA392',
                cursor: 'not-allowed'
              }}
            >
              Verify and Sign In
            </Button>

            <Button
              width="100%"
              variant="ghost"
              color={SUBTEXT}
              isDisabled={isVerifyingOtp || isResendingOtp}
              onClick={handleCloseOtpModal}
            >
              Return to sign in
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </WebsiteLayout>
  )
}

function FormField({
  label,
  type,
  placeholder,
  icon,
  value,
  onChange,
  isDisabled = false
}: {
  label: string
  type: string
  placeholder: string
  icon: React.ReactNode
  value: string
  onChange: (value: string) => void
  isDisabled?: boolean
}) {
  return (
    <Box>
      <Text color={TEXT} fontSize="14px" fontWeight="800" mb="10px">
        {label}
      </Text>

      <InputGroup>
        <InputLeftElement h="48px" color={SUBTEXT}>
          {icon}
        </InputLeftElement>

        <Input
          type={type}
          h="48px"
          pl="46px"
          value={value}
          onChange={(event) => {
            onChange(event.target.value)
          }}
          placeholder={placeholder}
          autoComplete="email"
          borderColor={BORDER}
          borderWidth="2px"
          borderRadius="12px"
          color={TEXT}
          isDisabled={isDisabled}
          _placeholder={{
            color: '#9AA392'
          }}
          _focus={{
            borderColor: BRAND,
            boxShadow: `0 0 0 1px ${BRAND}`
          }}
        />
      </InputGroup>
    </Box>
  )
}
