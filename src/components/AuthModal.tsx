import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack
} from '@chakra-ui/react'
import axios from 'axios'
import { ArrowRight, Eye, EyeOff, Layers3 } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type FormEvent
} from 'react'

import { useAuthContext } from '../context'

const BLUE = '#008fff'
const NAVY = '#07132b'

export type AuthView = 'sign-in' | 'register'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialView?: AuthView
  redirectToDashboard?: boolean
  onAuthenticated?: () => void
}

interface AuthErrorResponse {
  code?: string
  message?: string
  error?: string | {
    code?: string
    message?: string
  }
}

function getAuthenticationError(
  cause: unknown,
  registering: boolean
): string {
  if (!axios.isAxiosError<AuthErrorResponse>(cause)) {
    return cause instanceof Error
      ? cause.message
      : 'Unable to complete authentication.'
  }

  const status = cause.response?.status
  const body = cause.response?.data

  const code =
    typeof body?.error === 'object'
      ? body.error.code || body.code
      : body?.code

  if (!cause.response) {
    return 'Unable to connect to the server. Please try again.'
  }

  if (status === 401) {
    return 'Invalid email or password.'
  }

  if (status === 429) {
    return 'Too many attempts. Please wait and try again.'
  }

  if (status && status >= 500) {
    return 'The server could not complete your request. Please try again later.'
  }

  if (code === 'EMAIL_EXISTS' || (registering && status === 409)) {
    return 'A user with this email already exists. Please sign in.'
  }

  const nested =
    typeof body?.error === 'string'
      ? body.error
      : body?.error?.message

  return nested || body?.message || 'Unable to complete authentication.'
}

export default function AuthModal({
  isOpen,
  onClose,
  initialView = 'sign-in',
  redirectToDashboard = true,
  onAuthenticated
}: AuthModalProps) {
  const { signIn, signUp } = useAuthContext()

  const [view, setView] = useState<AuthView>(initialView)
  const [adminPortal, setAdminPortal] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const pending = useRef(false)
  const mounted = useRef(false)
  const errorRef = useRef<HTMLDivElement>(null)

  const registering = !adminPortal && view === 'register'

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return

    setView(initialView)
    setAdminPortal(false)
    setFirstName('')
    setLastName('')
    setEmail('')
    setPassword('')
    setRememberMe(false)
    setShowPassword(false)
    setError('')
  }, [isOpen, initialView])

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  function resetPassword() {
    setPassword('')
    setShowPassword(false)
    setError('')
  }

  function closeModal() {
    if (!pending.current) onClose()
  }

  function changeView(next: AuthView) {
    if (pending.current) return
    setView(next)
    resetPassword()
  }

  function togglePortal() {
    if (pending.current) return
    setAdminPortal((current) => !current)
    setView('sign-in')
    resetPassword()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (pending.current) return

    const normalizedEmail = email.trim().toLowerCase()
    setError('')

    if (registering && (!firstName.trim() || !lastName.trim())) {
      setError('First name and last name are required.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    if (!password) {
      setError('Password is required.')
      return
    }

    if (registering && (password.length < 8 || password.length > 128)) {
      setError('Password must contain between 8 and 128 characters.')
      return
    }

    pending.current = true
    setSubmitting(true)

    try {
      if (registering) {
        await signUp(
          {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            password
          },
          redirectToDashboard
        )
      } else {
        await signIn(
          normalizedEmail,
          null,
          true,
          password,
          adminPortal,
          adminPortal ? 'admin' : 'web',
          rememberMe,
          adminPortal || redirectToDashboard
        )
      }

      if (!mounted.current) return

      setPassword('')

      // Customer authentication can resume a pending cart action.
      // CMS authentication keeps its admin dashboard flow.
      if (!adminPortal) {
        onAuthenticated?.()
      }

      onClose()
    } catch (cause) {
      if (mounted.current) {
        setError(getAuthenticationError(cause, registering))
      }
    } finally {
      pending.current = false
      if (mounted.current) setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      isCentered
      closeOnOverlayClick={!submitting}
      closeOnEsc={!submitting}
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />

      <ModalContent
        mx={4}
        maxW="440px"
        bg="white"
        color={NAVY}
        borderRadius="14px"
        overflow="hidden"
      >
        <Box h="4px" bg={BLUE} />

        <ModalHeader px={7} pt={7}>
          <Text
            as="span"
            fontSize="26px"
            fontWeight="900"
            letterSpacing="-0.06em"
          >
            DEVICE<Box as="span" color={BLUE}>LINKUP</Box>
          </Text>

          <Text
            mt={1}
            fontSize="9px"
            color="gray.500"
            letterSpacing="0.15em"
            textTransform="uppercase"
          >
            Your devices. Our connection.
          </Text>
        </ModalHeader>

        <ModalCloseButton isDisabled={submitting} />

        <ModalBody px={7} pb={7}>
          {adminPortal ? (
            <Box mb={5} p={4} bg="#eef7ff" borderRadius="8px">
              <HStack>
                <Layers3 size={19} color={BLUE} />
                <Text fontWeight="700">CMS Admin Portal</Text>
              </HStack>

              <Text mt={2} fontSize="sm" color="gray.600">
                Sign in with your SuperAdmin account to manage your store.
              </Text>
            </Box>
          ) : (
            <Grid
              templateColumns="1fr 1fr"
              gap={1}
              p={1}
              mb={5}
              bg="#f0f4f9"
              borderRadius="8px"
            >
              {(['sign-in', 'register'] as const).map((item) => (
                <Button
                  key={item}
                  type="button"
                  bg={view === item ? BLUE : 'transparent'}
                  color={view === item ? 'white' : NAVY}
                  isDisabled={submitting}
                  onClick={() => changeView(item)}
                  _hover={{
                    bg: view === item ? '#007ada' : '#e4ebf4'
                  }}
                >
                  {item === 'sign-in' ? 'Sign In' : 'Register'}
                </Button>
              ))}
            </Grid>
          )}

          {error && (
            <Alert
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              status="error"
              mb={4}
              borderRadius="7px"
              fontSize="sm"
            >
              <AlertIcon />
              <Text>{error}</Text>
            </Alert>
          )}

          <Box as="form" onSubmit={submit} noValidate>
            <VStack align="stretch" spacing={4}>
              {registering && (
                <Grid
                  templateColumns={{ base: '1fr', sm: '1fr 1fr' }}
                  gap={3}
                >
                  <FormControl isRequired isDisabled={submitting}>
                    <FormLabel fontSize="sm">First name</FormLabel>
                    <Input
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      focusBorderColor={BLUE}
                    />
                  </FormControl>

                  <FormControl isRequired isDisabled={submitting}>
                    <FormLabel fontSize="sm">Last name</FormLabel>
                    <Input
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      focusBorderColor={BLUE}
                    />
                  </FormControl>
                </Grid>
              )}

              <FormControl isRequired isDisabled={submitting}>
                <FormLabel fontSize="sm">Email address</FormLabel>
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  focusBorderColor={BLUE}
                />
              </FormControl>

              <FormControl isRequired isDisabled={submitting}>
                <FormLabel fontSize="sm">Password</FormLabel>

                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={
                      registering ? 'new-password' : 'current-password'
                    }
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    focusBorderColor={BLUE}
                    pr={12}
                  />

                  <InputRightElement>
                    <IconButton
                      type="button"
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                      icon={
                        showPassword
                          ? <EyeOff size={17} />
                          : <Eye size={17} />
                      }
                      size="sm"
                      variant="ghost"
                      isDisabled={submitting}
                      onClick={() => setShowPassword((current) => !current)}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {!registering && (
                <Checkbox
                  size="sm"
                  colorScheme="blue"
                  isChecked={rememberMe}
                  isDisabled={submitting}
                  onChange={(event) => setRememberMe(event.target.checked)}
                >
                  Remember me
                </Checkbox>
              )}

              <Button
                type="submit"
                h="46px"
                bg={BLUE}
                color="white"
                isLoading={submitting}
                loadingText={
                  registering ? 'Creating account' : 'Signing in'
                }
                rightIcon={<ArrowRight size={18} />}
                _hover={{ bg: '#007ada' }}
              >
                {adminPortal
                  ? 'Sign In to Admin Portal'
                  : registering
                    ? 'Create Account'
                    : 'Sign In'}
              </Button>
            </VStack>
          </Box>

          <HStack my={6} spacing={3}>
            <Box h="1px" flex={1} bg="gray.200" />
            <Text
              fontSize="9px"
              fontWeight="700"
              color="gray.500"
              letterSpacing="0.12em"
              whiteSpace="nowrap"
            >
              {adminPortal ? 'CUSTOMER ACCESS' : 'BUSINESS ACCESS'}
            </Text>
            <Box h="1px" flex={1} bg="gray.200" />
          </HStack>

          <Button
            type="button"
            w="full"
            variant="outline"
            borderColor="#b5dcff"
            color="#007bdb"
            leftIcon={<Layers3 size={17} />}
            isDisabled={submitting}
            onClick={togglePortal}
            _hover={{ bg: '#eef7ff' }}
          >
            {adminPortal
              ? 'Back to Customer Login'
              : 'CMS Admin Portal'}
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}