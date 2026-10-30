import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Container,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Text,
  VStack
} from '@chakra-ui/react'
import { CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import WebsiteLayout from '../../layout/WebsiteLayout'

const BRAND = '#173F1F'
const BRAND_HOVER = '#0E2D15'
const BACKGROUND = '#FCFBF7'
const BORDER = '#D7DFC8'
const TEXT = '#23351F'
const SUBTEXT = '#5F6B58'
const LIGHT_GREEN = '#EDF4E5'

const API_HOST = import.meta.env.VITE_APP_API_HOST?.replace(/\/+$/, '') ?? ''

type ApiResponse = {
  message?: string
  error?: string
}

async function readResponse(response: Response): Promise<ApiResponse> {
  try {
    const data = (await response.json()) as ApiResponse | string

    return typeof data === 'string'
      ? {
          message: data
        }
      : data
  } catch {
    return {}
  }
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()

  const token = searchParams.get('token')?.trim() ?? ''

  const [password, setPassword] = useState('')

  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)

  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [errorMessage, setErrorMessage] = useState('')

  const [isSuccess, setIsSuccess] = useState(false)

  const isValid = useMemo(() => {
    return token.length > 0 && password.length >= 8 && password === confirmPassword
  }, [token, password, confirmPassword])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isValid || isSubmitting) {
      return
    }

    if (!API_HOST) {
      setErrorMessage('The authentication service is not configured.')

      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const response = await fetch(`${API_HOST}/reset-password`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          token,
          password
        })
      })

      const responseBody = await readResponse(response)

      if (!response.ok) {
        throw new Error(
          responseBody.message || responseBody.error || 'Unable to reset your password.'
        )
      }

      setIsSuccess(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to reset your password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <WebsiteLayout>
        <Box minH="100vh" bg={BACKGROUND} display="flex" alignItems="center">
          <Container maxW="560px">
            <Box
              bg="white"
              p={{
                base: 6,
                md: 9
              }}
              borderRadius="24px"
              boxShadow="0 12px 40px rgba(0,0,0,0.08)"
              textAlign="center"
            >
              <Alert status="error" borderRadius="12px" mb={6}>
                <AlertIcon />

                <AlertDescription>
                  This password reset link is invalid or incomplete.
                </AlertDescription>
              </Alert>

              <Button
                as={Link}
                to="/login"
                bg={BRAND}
                color="white"
                borderRadius="full"
                _hover={{
                  bg: BRAND_HOVER,
                  textDecoration: 'none'
                }}
              >
                Return to Sign In
              </Button>
            </Box>
          </Container>
        </Box>
      </WebsiteLayout>
    )
  }

  return (
    <WebsiteLayout>
      <Box
        minH="100vh"
        bg={BACKGROUND}
        display="flex"
        alignItems="center"
        py={{
          base: 10,
          md: 16
        }}
      >
        <Container maxW="580px">
          <Box
            bg="white"
            p={{
              base: 6,
              md: 9
            }}
            borderRadius="24px"
            boxShadow="0 12px 40px rgba(0,0,0,0.08)"
          >
            {isSuccess ? (
              <VStack spacing={6}>
                <Box
                  width="84px"
                  height="84px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="full"
                  bg={LIGHT_GREEN}
                  color={BRAND}
                >
                  <CheckCircle2 size={44} />
                </Box>

                <Box textAlign="center">
                  <Text color={TEXT} fontSize="30px" fontWeight="800">
                    Password Updated
                  </Text>

                  <Text mt={3} color={SUBTEXT} lineHeight="1.7">
                    Your password has been reset successfully. You can now sign in using your new
                    password.
                  </Text>
                </Box>

                <Button
                  as={Link}
                  to="/login"
                  width="100%"
                  height="52px"
                  borderRadius="full"
                  bg={BRAND}
                  color="white"
                  _hover={{
                    bg: BRAND_HOVER,
                    textDecoration: 'none'
                  }}
                >
                  Continue to Sign In
                </Button>
              </VStack>
            ) : (
              <Box as="form" onSubmit={handleSubmit}>
                <VStack align="stretch" spacing={6}>
                  <Box textAlign="center">
                    <Text
                      color={TEXT}
                      fontSize={{
                        base: '28px',
                        md: '34px'
                      }}
                      fontWeight="800"
                    >
                      Create New Password
                    </Text>

                    <Text mt={3} color={SUBTEXT} lineHeight="1.7">
                      Your password must contain at least eight characters.
                    </Text>
                  </Box>

                  {errorMessage ? (
                    <Alert status="error" borderRadius="12px">
                      <AlertIcon />

                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  ) : null}

                  <PasswordField
                    label="New Password"
                    value={password}
                    showPassword={showPassword}
                    autoComplete="new-password"
                    isDisabled={isSubmitting}
                    onToggle={() => {
                      setShowPassword((current) => !current)
                    }}
                    onChange={(value) => {
                      setPassword(value)
                      setErrorMessage('')
                    }}
                  />

                  <PasswordField
                    label="Confirm New Password"
                    value={confirmPassword}
                    showPassword={showConfirmPassword}
                    autoComplete="new-password"
                    isDisabled={isSubmitting}
                    onToggle={() => {
                      setShowConfirmPassword((current) => !current)
                    }}
                    onChange={(value) => {
                      setConfirmPassword(value)

                      setErrorMessage('')
                    }}
                  />

                  {confirmPassword && password !== confirmPassword ? (
                    <Text color="red.500" fontSize="13px">
                      The passwords do not match.
                    </Text>
                  ) : null}

                  <Button
                    type="submit"
                    width="100%"
                    height="52px"
                    borderRadius="full"
                    bg={BRAND}
                    color="white"
                    fontSize="17px"
                    fontWeight="800"
                    isLoading={isSubmitting}
                    loadingText="Updating password"
                    isDisabled={!isValid || isSubmitting}
                    _hover={{
                      bg: BRAND_HOVER
                    }}
                    _disabled={{
                      bg: '#9AA392',
                      cursor: 'not-allowed'
                    }}
                  >
                    Reset Password
                  </Button>
                </VStack>
              </Box>
            )}
          </Box>
        </Container>
      </Box>
    </WebsiteLayout>
  )
}

type PasswordFieldProps = {
  label: string
  value: string
  showPassword: boolean
  autoComplete: string
  isDisabled: boolean
  onChange: (value: string) => void
  onToggle: () => void
}

function PasswordField({
  label,
  value,
  showPassword,
  autoComplete,
  isDisabled,
  onChange,
  onToggle
}: PasswordFieldProps) {
  return (
    <Box>
      <Text mb="10px" color={TEXT} fontSize="14px" fontWeight="800">
        {label}
      </Text>

      <InputGroup>
        <InputLeftElement h="50px" color={SUBTEXT}>
          <Lock size={19} />
        </InputLeftElement>

        <Input
          type={showPassword ? 'text' : 'password'}
          height="50px"
          pl="46px"
          pr="46px"
          value={value}
          autoComplete={autoComplete}
          placeholder="••••••••"
          isDisabled={isDisabled}
          borderColor={BORDER}
          borderWidth="2px"
          borderRadius="12px"
          onChange={(event) => {
            onChange(event.target.value)
          }}
          _focus={{
            borderColor: BRAND,
            boxShadow: `0 0 0 1px ${BRAND}`
          }}
        />

        <InputRightElement h="50px">
          <IconButton
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            size="sm"
            variant="ghost"
            onClick={onToggle}
          />
        </InputRightElement>
      </InputGroup>
    </Box>
  )
}
