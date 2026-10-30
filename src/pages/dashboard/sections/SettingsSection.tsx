import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
  useToast
} from '@chakra-ui/react'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useAuthContext } from '../../../context'

const BRAND = '#173F1F'
const BRAND_HOVER = '#0E2D15'
const PAGE_BACKGROUND = '#FCFBF7'
const TEXT = '#23351F'
const SUBTEXT = '#66715F'
const BORDER = '#D8E2CB'

export type AccountSettingsValues = {
  fullName: string
  email: string
  phoneNumber: string
  businessName: string
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

export type AccountProfile = {
  fullName: string
  email: string
  phoneNumber?: string | null
  businessName?: string | null
}

type AccountSettingsProps = {
  profile?: AccountProfile | null
  isLoading?: boolean

  onSave?: (values: AccountSettingsValues) => Promise<void> | void

  onCancel?: () => void
}

type FormErrors = Partial<Record<keyof AccountSettingsValues, string>>

type UpdateAccountSettingsResponse = {
  message?: string

  user?: {
    id?: string
    firstName?: string | null
    lastName?: string | null
    fullName?: string | null
    email?: string
    phoneNumber?: string | null
    confirmed?: boolean
  }
}

type AuthContextShape = {
  user?: {
    id?: string
    firstName?: string | null
    lastName?: string | null
    fullName?: string | null
    email?: string | null
  } | null

  token?: string | null
  accessToken?: string | null
  authToken?: string | null

  session?: {
    token?: string | null
    accessToken?: string | null
    authToken?: string | null
  } | null

  auth?: {
    token?: string | null
    accessToken?: string | null
    authToken?: string | null
  } | null

  setUser?: (user: unknown) => void

  updateUser?: (user: unknown) => void
}

const EMPTY_FORM: AccountSettingsValues = {
  fullName: '',
  email: '',
  phoneNumber: '',
  businessName: '',
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: ''
}

function normalizePhoneNumber(value: string): string {
  return value.replace(/[^\d+\s()-]/g, '')
}

function validateForm(values: AccountSettingsValues): FormErrors {
  const errors: FormErrors = {}

  if (values.fullName.trim().length < 2) {
    errors.fullName = 'Full name must contain at least 2 characters.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (values.phoneNumber.trim() && !/^\+?[0-9\s()-]{9,20}$/.test(values.phoneNumber.trim())) {
    errors.phoneNumber = 'Enter a valid phone number.'
  }

  const wantsPasswordChange = Boolean(
    values.currentPassword || values.newPassword || values.confirmNewPassword
  )

  if (wantsPasswordChange) {
    if (!values.currentPassword.trim()) {
      errors.currentPassword = 'Enter your current password.'
    }

    if (values.newPassword.length < 8) {
      errors.newPassword = 'New password must contain at least 8 characters.'
    } else if (
      !/[A-Z]/.test(values.newPassword) ||
      !/[a-z]/.test(values.newPassword) ||
      !/\d/.test(values.newPassword)
    ) {
      errors.newPassword = 'Use uppercase, lowercase and at least one number.'
    }

    if (values.confirmNewPassword !== values.newPassword) {
      errors.confirmNewPassword = 'The passwords do not match.'
    }

    if (
      values.currentPassword &&
      values.newPassword &&
      values.currentPassword === values.newPassword
    ) {
      errors.newPassword = 'Your new password must be different from your current password.'
    }
  }

  return errors
}

function getApiBaseUrl(): string {
  const configuredUrl = String(
    import.meta.env.VITE_APP_API_HOST || import.meta.env.VITE_API_URL || ''
  )
    .trim()
    .replace(/\/+$/, '')

  return configuredUrl
}

function normalizeToken(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  const token = value.trim()

  if (!token) {
    return ''
  }

  if (token.toLowerCase().startsWith('bearer ')) {
    return token.slice(7).trim()
  }

  return token
}

function findTokenInObject(value: unknown, depth = 0): string {
  if (!value || typeof value !== 'object' || depth > 5) {
    return ''
  }

  const record = value as Record<string, unknown>

  const tokenKeys = [
    'token',
    'accessToken',
    'access_token',
    'authToken',
    'auth_token',
    'jwt',
    'jwtToken',
    'idToken'
  ]

  for (const key of tokenKeys) {
    const token = normalizeToken(record[key])

    if (token) {
      return token
    }
  }

  const nestedKeys = [
    'state',
    'auth',
    'session',
    'data',
    'user',
    'currentUser',
    'authentication',
    'credentials'
  ]

  for (const key of nestedKeys) {
    const token = findTokenInObject(record[key], depth + 1)

    if (token) {
      return token
    }
  }

  return ''
}

function findTokenInStorage(storage: Storage): string {
  const directKeys = [
    'token',
    'accessToken',
    'access_token',
    'authToken',
    'auth_token',
    'jwt',
    'jwtToken',
    'user-token',
    'mckenzie-token'
  ]

  for (const key of directKeys) {
    const token = normalizeToken(storage.getItem(key))

    if (token) {
      return token
    }
  }

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)

    if (!key) {
      continue
    }

    const rawValue = storage.getItem(key)

    if (!rawValue) {
      continue
    }

    const directToken = normalizeToken(rawValue)

    /*
     * A JWT contains three dot-separated
     * base64url sections.
     */
    if (directToken.split('.').length === 3) {
      return directToken
    }

    try {
      const parsed = JSON.parse(rawValue)

      const nestedToken = findTokenInObject(parsed)

      if (nestedToken) {
        return nestedToken
      }
    } catch {
      // Ignore non-JSON values.
    }
  }

  return ''
}

function resolveAuthToken(authContext: AuthContextShape): string {
  const contextCandidates = [
    authContext.token,
    authContext.accessToken,
    authContext.authToken,
    authContext.session?.token,
    authContext.session?.accessToken,
    authContext.session?.authToken,
    authContext.auth?.token,
    authContext.auth?.accessToken,
    authContext.auth?.authToken
  ]

  for (const candidate of contextCandidates) {
    const token = normalizeToken(candidate)

    if (token) {
      return token
    }
  }

  const contextToken = findTokenInObject(authContext)

  if (contextToken) {
    return contextToken
  }

  const localToken = findTokenInStorage(window.localStorage)

  if (localToken) {
    return localToken
  }

  const sessionToken = findTokenInStorage(window.sessionStorage)

  if (sessionToken) {
    return sessionToken
  }

  return ''
}

function getResponseErrorMessage(responseData: unknown, fallback: string): string {
  if (typeof responseData !== 'object' || responseData === null) {
    return fallback
  }

  const data = responseData as {
    message?: unknown
    error?: unknown
    code?: unknown
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message
  }

  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error
  }

  if (typeof data.code === 'string' && data.code.trim()) {
    return data.code
  }

  return fallback
}

function buildAccountSettingsUrl(): string {
  const api = getApiBaseUrl()

  if (!api) {
    return '/account/settings'
  }

  return `${api}/account/settings`
}

export default function AccountSettings({
  profile,
  isLoading = false,
  onSave,
  onCancel
}: AccountSettingsProps) {
  const toast = useToast()

  const authContext = useAuthContext() as unknown as AuthContextShape

  const user = authContext.user

  const [values, setValues] = useState<AccountSettingsValues>(EMPTY_FORM)

  const [errors, setErrors] = useState<FormErrors>({})

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [submitError, setSubmitError] = useState<string | null>(null)

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)

  const [showNewPassword, setShowNewPassword] = useState(false)

  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const authenticatedFullName = useMemo(() => {
    const storedFullName = user?.fullName?.trim()

    if (storedFullName) {
      return storedFullName
    }

    return [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
  }, [user?.firstName, user?.lastName, user?.fullName])

  const initialValues = useMemo<AccountSettingsValues>(
    () => ({
      fullName: profile?.fullName || authenticatedFullName,

      email: profile?.email || user?.email || '',

      phoneNumber: profile?.phoneNumber || '',

      businessName: profile?.businessName || '',

      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    }),
    [
      authenticatedFullName,
      profile?.businessName,
      profile?.email,
      profile?.fullName,
      profile?.phoneNumber,
      user?.email
    ]
  )

  useEffect(() => {
    setValues(initialValues)
    setErrors({})
    setSubmitError(null)
  }, [initialValues])

  const hasChanges = useMemo(
    () =>
      values.fullName.trim() !== initialValues.fullName.trim() ||
      values.email.trim() !== initialValues.email.trim() ||
      values.phoneNumber.trim() !== initialValues.phoneNumber.trim() ||
      values.businessName.trim() !== initialValues.businessName.trim() ||
      Boolean(values.currentPassword || values.newPassword || values.confirmNewPassword),
    [values, initialValues]
  )

  const updateField = <Field extends keyof AccountSettingsValues>(
    field: Field,
    value: AccountSettingsValues[Field]
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value
    }))

    setErrors((current) => ({
      ...current,
      [field]: undefined
    }))

    setSubmitError(null)
  }

  const resetForm = () => {
    setValues(initialValues)
    setErrors({})
    setSubmitError(null)

    setShowCurrentPassword(false)

    setShowNewPassword(false)

    setShowConfirmPassword(false)
  }

  const handleCancel = () => {
    resetForm()
    onCancel?.()
  }

  const updateAuthenticatedUser = (updatedUser: UpdateAccountSettingsResponse['user']) => {
    if (!updatedUser) {
      return
    }

    if (typeof authContext.updateUser === 'function') {
      authContext.updateUser(updatedUser)

      return
    }

    if (typeof authContext.setUser === 'function') {
      authContext.setUser(updatedUser)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationErrors = validateForm(values)

    setErrors(validationErrors)
    setSubmitError(null)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    try {
      setIsSubmitting(true)

      const payload: AccountSettingsValues = {
        fullName: values.fullName.trim(),

        email: values.email.trim().toLowerCase(),

        phoneNumber: values.phoneNumber.trim(),

        businessName: values.businessName.trim(),

        currentPassword: values.currentPassword,

        newPassword: values.newPassword,

        confirmNewPassword: values.confirmNewPassword
      }

      if (onSave) {
        await onSave(payload)
      } else {
        const token = resolveAuthToken(authContext)

        if (!token) {
          throw new Error(
            'You are signed in, but the authentication token could not be found. Please sign out and sign in again.'
          )
        }

        const response = await fetch(buildAccountSettingsUrl(), {
          method: 'PATCH',

          headers: {
            Accept: 'application/json',

            'Content-Type': 'application/json',

            Authorization: `Bearer ${token}`
          },

          credentials: 'include',

          body: JSON.stringify({
            fullName: payload.fullName,

            email: payload.email,

            phoneNumber: payload.phoneNumber || null,

            currentPassword: payload.currentPassword || undefined,

            newPassword: payload.newPassword || undefined
          })
        })

        const responseData = (await response
          .json()
          .catch(() => null)) as UpdateAccountSettingsResponse | null

        if (!response.ok) {
          throw new Error(
            getResponseErrorMessage(
              responseData,
              response.status === 401
                ? 'Your authentication session is invalid. Please sign in again.'
                : 'Unable to update your account settings.'
            )
          )
        }

        updateAuthenticatedUser(responseData?.user)
      }

      setValues((current) => ({
        ...current,

        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }))

      setErrors({})
      setSubmitError(null)

      setShowCurrentPassword(false)

      setShowNewPassword(false)

      setShowConfirmPassword(false)

      toast({
        title: 'Account settings updated',

        description: 'Your changes have been saved successfully.',

        status: 'success',
        duration: 4000,
        isClosable: true
      })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save your changes.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box
      minH="100%"
      bg={PAGE_BACKGROUND}
      color={TEXT}
      py={{
        base: 6,
        md: 8
      }}
    >
      <Box
        width="100%"
        maxW="1280px"
        mx="auto"
        px={{
          base: 5,
          md: 8
        }}
      >
        <Heading
          as="h1"
          fontSize={{
            base: '30px',
            md: '36px'
          }}
          lineHeight="1.15"
          fontWeight="800"
          color={TEXT}
          mb={{
            base: 6,
            md: 8
          }}
        >
          Account Settings
        </Heading>

        <Box
          as="form"
          onSubmit={handleSubmit}
          bg="white"
          borderRadius={{
            base: '18px',
            md: '22px'
          }}
          boxShadow="0 10px 30px rgba(23, 63, 31, 0.06)"
          p={{
            base: 5,
            md: 8
          }}
        >
          <VStack spacing={0} align="stretch">
            {submitError ? (
              <Alert status="error" borderRadius="12px" mb={6}>
                <AlertIcon />

                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}

            <Grid
              templateColumns={{
                base: '1fr',

                md: 'repeat(2, minmax(0, 1fr))'
              }}
              columnGap={6}
              rowGap={5}
            >
              <GridItem>
                <AccountInput
                  label="Full Name"
                  value={values.fullName}
                  placeholder="John Smith"
                  error={errors.fullName}
                  isDisabled={isLoading || isSubmitting}
                  onChange={(value) => updateField('fullName', value)}
                />
              </GridItem>

              <GridItem>
                <AccountInput
                  label="Email Address"
                  type="email"
                  value={values.email}
                  placeholder="thandi@gmail.com"
                  error={errors.email}
                  isDisabled={isLoading || isSubmitting}
                  onChange={(value) => updateField('email', value)}
                />
              </GridItem>
            </Grid>

            <Divider
              my={{
                base: 7,
                md: 8
              }}
              borderColor={BORDER}
            />

            <Box>
              <Text
                as="h2"
                fontSize={{
                  base: '21px',
                  md: '24px'
                }}
                fontWeight="800"
                color={TEXT}
                mb={5}
              >
                Change Password
              </Text>

              <Grid
                templateColumns={{
                  base: '1fr',

                  md: 'repeat(2, minmax(0, 1fr))'
                }}
                columnGap={6}
                rowGap={5}
              >
                <GridItem
                  colSpan={{
                    base: 1,
                    md: 2
                  }}
                >
                  <PasswordInput
                    label="Current Password"
                    value={values.currentPassword}
                    showPassword={showCurrentPassword}
                    error={errors.currentPassword}
                    isDisabled={isLoading || isSubmitting}
                    onToggle={() => setShowCurrentPassword((current) => !current)}
                    onChange={(value) => updateField('currentPassword', value)}
                  />
                </GridItem>

                <GridItem>
                  <PasswordInput
                    label="New Password"
                    value={values.newPassword}
                    showPassword={showNewPassword}
                    error={errors.newPassword}
                    isDisabled={isLoading || isSubmitting}
                    onToggle={() => setShowNewPassword((current) => !current)}
                    onChange={(value) => updateField('newPassword', value)}
                  />
                </GridItem>

                <GridItem>
                  <PasswordInput
                    label="Confirm New Password"
                    value={values.confirmNewPassword}
                    showPassword={showConfirmPassword}
                    error={errors.confirmNewPassword}
                    isDisabled={isLoading || isSubmitting}
                    onToggle={() => setShowConfirmPassword((current) => !current)}
                    onChange={(value) => updateField('confirmNewPassword', value)}
                  />
                </GridItem>
              </Grid>
            </Box>

            <Box
              display="flex"
              alignItems={{
                base: 'stretch',
                sm: 'center'
              }}
              flexDirection={{
                base: 'column',
                sm: 'row'
              }}
              gap={4}
              mt={{
                base: 8,
                md: 10
              }}
            >
              <Button
                type="submit"
                minW={{
                  base: '100%',
                  sm: '190px'
                }}
                h="58px"
                px={8}
                bg={BRAND}
                color="white"
                borderRadius="full"
                fontSize="17px"
                fontWeight="800"
                isLoading={isSubmitting}
                loadingText="Saving"
                isDisabled={isLoading || !hasChanges}
                _hover={{
                  bg: BRAND_HOVER
                }}
              >
                Save Changes
              </Button>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  )
}

function AccountInput({
  label,
  value,
  placeholder,
  type = 'text',
  error,
  isDisabled,
  onChange
}: {
  label: string
  value: string
  placeholder?: string
  type?: string
  error?: string
  isDisabled?: boolean
  onChange: (value: string) => void
}) {
  return (
    <FormControl isInvalid={Boolean(error)}>
      <FormLabel mb={2} color={TEXT} fontSize="14px" fontWeight="700">
        {label}
      </FormLabel>

      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        h="54px"
        px={4}
        bg="white"
        color={TEXT}
        borderWidth="2px"
        borderColor={BORDER}
        borderRadius="14px"
        fontSize="16px"
        isDisabled={isDisabled}
        onChange={(event) => onChange(event.target.value)}
        _placeholder={{
          color: '#929C8D'
        }}
        _hover={{
          borderColor: '#B8C9A9'
        }}
        _focusVisible={{
          borderColor: BRAND,
          boxShadow: `0 0 0 1px ${BRAND}`
        }}
      />

      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  )
}

function PasswordInput({
  label,
  value,
  showPassword,
  error,
  isDisabled,
  onChange,
  onToggle
}: {
  label: string
  value: string
  showPassword: boolean
  error?: string
  isDisabled?: boolean
  onChange: (value: string) => void
  onToggle: () => void
}) {
  return (
    <FormControl isInvalid={Boolean(error)}>
      <FormLabel mb={2} color={TEXT} fontSize="14px" fontWeight="700">
        {label}
      </FormLabel>

      <InputGroup>
        <Input
          type={showPassword ? 'text' : 'password'}
          value={value}
          placeholder="••••••••"
          h="54px"
          px={4}
          pr="52px"
          bg="white"
          color={TEXT}
          borderWidth="2px"
          borderColor={BORDER}
          borderRadius="14px"
          fontSize="16px"
          isDisabled={isDisabled}
          onChange={(event) => onChange(event.target.value)}
          _placeholder={{
            color: '#929C8D'
          }}
          _hover={{
            borderColor: '#B8C9A9'
          }}
          _focusVisible={{
            borderColor: BRAND,
            boxShadow: `0 0 0 1px ${BRAND}`
          }}
        />

        <InputRightElement h="54px" width="48px">
          <Button
            type="button"
            aria-label={showPassword ? `Hide ${label}` : `Show ${label}`}
            minW="auto"
            w="38px"
            h="38px"
            p={0}
            variant="ghost"
            color={SUBTEXT}
            isDisabled={isDisabled}
            onClick={onToggle}
            _hover={{
              bg: '#EDF4E5',
              color: BRAND
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </Button>
        </InputRightElement>
      </InputGroup>

      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  )
}
