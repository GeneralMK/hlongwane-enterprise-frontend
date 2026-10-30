import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Input,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  useToast
} from '@chakra-ui/react'
import { Check, Clock, MapPin, Phone, Video } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageBreadcrumb from '../../components/PageBreadcrumb'
import AddressAutoComplete, {
  type SelectedAddress
} from '../../components/AddressAutoComplete'
import {
  gql,
  useMutation
} from '@apollo/client'

enum EnumConsultationTimeSlot {
  Morning = 'MORNING',
  Evening = 'EVENING'
}

enum EnumConsultationType {
  OnSiteVisit = 'ON_SITE_VISIT',
  Virtual = 'VIRTUAL',
  Telephone = 'TELEPHONE'
}

type CreateConsultationBookingInput = {
  consultationType: EnumConsultationType
  preferredTime: EnumConsultationTimeSlot
  preferredDate: string

  topic?: string | null
  message?: string | null
  phoneNumber: string

  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  province?: string | null
  postalCode?: string | null
  country?: string | null
}

type CreateConsultationBookingData = {
  createConsultationBooking: {
    id: string
    createdAt?: string | null
    updatedAt?: string | null
    consultationType?: EnumConsultationType | null
    preferredTime?: EnumConsultationTimeSlot | null
    preferredDate?: string | null
    status?: string | null
    totalAmount?: string | number | null
  }
}

type CreateConsultationBookingVariables = {
  input: CreateConsultationBookingInput
}

const CREATE_CONSULTATION_BOOKING_MUTATION = gql`
  mutation CreateConsultationBooking(
    $input: CreateConsultationBookingInput!
  ) {
    createConsultationBooking(
      input: $input
    ) {
      id
      createdAt
      updatedAt
      consultationType
      preferredTime
      preferredDate
      status
      totalAmount
    }
  }
`
import WebsiteLayout from '../../layout/WebsiteLayout'
import { USER_STORAGE_KEY } from '../../utils/contants'
import { FaMoneyBill } from 'react-icons/fa'

const BRAND_GREEN = '#173F1F'
const LIGHT_GREEN = '#EEF5E8'

const included = [
  'Comprehensive farm assessment',
  'Equipment recommendations tailored to your needs',
  'Financing options discussion',
  'Implementation timeline planning',
  'Follow-up support for 30 days'
]

type PreferredTime = 'morning' | 'afternoon'
type ConsultationType = 'onsite' | 'video' | 'phone'

type BookingForm = {
  phone: string
  preferredDate: string
  preferredTime: PreferredTime
  consultationType: ConsultationType

  address: string
  formattedAddress: string
  city: string
  province: string
  postalCode: string
  country: string

  latitude?: number
  longitude?: number
  placeId?: string

  topic: string
  message: string
}

const consultationTypes = [
  {
    value: 'onsite' as const,
    icon: MapPin,
    title: 'On-site Visit',
    text: 'Our consultant visits your farm'
  },
  {
    value: 'video' as const,
    icon: Video,
    title: 'Video Call',
    text: 'Virtual consultation via Zoom/Teams'
  },
  {
    value: 'phone' as const,
    icon: Phone,
    title: 'Phone Call',
    text: 'Consultation via telephone'
  }
]

const getStoredToken = () => {
  const stored =
    localStorage.getItem(USER_STORAGE_KEY) ||
    sessionStorage.getItem(USER_STORAGE_KEY)

  if (!stored) return null

  try {
    const parsed = JSON.parse(stored)

    return parsed?.token || parsed?.jwt || null
  } catch {
    return null
  }
}

function normalisePhoneInput(
  value: string
): string {
  const trimmed =
    value.trim()

  const hasInternationalPrefix =
    trimmed.startsWith('+')

  const digits =
    trimmed.replace(/\D/g, '')

  if (hasInternationalPrefix) {
    return `+${digits.slice(0, 11)}`
  }

  return digits.slice(0, 10)
}

function isValidSouthAfricanCellphone(
  value: string
): boolean {
  const phone =
    value.replace(/[\s()-]/g, '')

  return (
    /^0[6-8]\d{8}$/.test(phone) ||
    /^\+27[6-8]\d{8}$/.test(phone)
  )
}

export default function BookConsultationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [
    createBooking,
    {
      loading
    }
  ] = useMutation<
    CreateConsultationBookingData,
    CreateConsultationBookingVariables
  >(
    CREATE_CONSULTATION_BOOKING_MUTATION
  )

  const [form, setForm] = useState<BookingForm>({
    phone: '',
    preferredDate: '',
    preferredTime: 'morning',
    consultationType: 'onsite',

    address: '',
    formattedAddress: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa',

    latitude: undefined,
    longitude: undefined,
    placeId: undefined,

    topic: '',
    message: ''
  })

  const [
    phoneTouched,
    setPhoneTouched
  ] = useState(false)

  const today = useMemo(() => {
    const date = new Date()
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - offset * 60 * 1000)

    return localDate.toISOString().split('T')[0]
  }, [])

  const phoneIsValid =
    useMemo(
      () =>
        isValidSouthAfricanCellphone(
          form.phone
        ),
      [form.phone]
    )

  const phoneError =
    phoneTouched &&
    form.phone.length > 0 &&
    !phoneIsValid
      ? 'Enter a valid South African cellphone number, for example 0812345678 or +27812345678.'
      : null

  const isValid = useMemo(() => {
    const required =
      phoneIsValid &&
      Boolean(
        form.preferredDate.trim()
      )

    if (
      form.consultationType ===
      'onsite'
    ) {
      return Boolean(
        required &&
          form.address.trim() &&
          form.city.trim() &&
          form.province.trim() &&
          form.postalCode.trim()
      )
    }

    return Boolean(required)
  }, [
    form.address,
    form.city,
    form.consultationType,
    form.postalCode,
    form.preferredDate,
    form.province,
    phoneIsValid
  ])

  const updateField = <
    K extends keyof BookingForm
  >(
    key: K,
    value: BookingForm[K]
  ) => {
    setForm(current => ({
      ...current,
      [key]: value
    }))
  }

  const handleAddressChange = (
    value: string
  ): void => {
    setForm(current => ({
      ...current,
      address: value,
      formattedAddress: '',

      /*
       * Clear fields populated from the
       * previous Google Places selection.
       */
      city: '',
      province: '',
      postalCode: '',
      latitude: undefined,
      longitude: undefined,
      placeId: undefined
    }))
  }

  const handleAddressSelected = (
    selectedAddress: SelectedAddress
  ): void => {
    setForm(current => ({
      ...current,

      address:
        selectedAddress.address ||
        selectedAddress.formattedAddress,

      formattedAddress:
        selectedAddress.formattedAddress,

      city:
        selectedAddress.city,

      province:
        selectedAddress.province,

      postalCode:
        selectedAddress.postalCode,

      country: 'South Africa',

      latitude:
        selectedAddress.latitude,

      longitude:
        selectedAddress.longitude,

      placeId:
        selectedAddress.placeId
    }))
  }

  const handleConsultationTypeChange = (
    consultationType:
      ConsultationType
  ): void => {
    setForm(current => ({
      ...current,
      consultationType,

      ...(consultationType !==
      'onsite'
        ? {
            address: '',
            formattedAddress: '',
            city: '',
            province: '',
            postalCode: '',
            country:
              'South Africa',
            latitude: undefined,
            longitude: undefined,
            placeId: undefined
          }
        : {})
    }))
  }

  const getConsultationType = () => {
    if (form.consultationType === 'onsite') return EnumConsultationType.OnSiteVisit
    if (form.consultationType === 'video') return EnumConsultationType.Virtual

    return EnumConsultationType.Telephone
  }

  const getPreferredTime = () => {
    if (form.preferredTime === 'morning') return EnumConsultationTimeSlot.Morning

    return EnumConsultationTimeSlot.Evening
  }

const handleSubmit = async () => {
  setPhoneTouched(true)

  if (!phoneIsValid) {
    toast({
      title:
        'Invalid cellphone number',
      description:
        'Enter a valid South African cellphone number, for example 0812345678 or +27812345678.',
      status: 'warning',
      duration: 4000,
      isClosable: true
    })

    return
  }

  if (!isValid || loading) {
    return
  }

  const token =
    getStoredToken()

  if (!token) {
    toast({
      title:
        'Authentication required',
      description:
        'Please sign in before booking a consultation.',
      status: 'warning',
      duration: 4000,
      isClosable: true
    })

    navigate('/login', {
      state: {
        redirectTo:
          `${location.pathname}${location.search}`
      }
    })

    return
  }

  try {
    const result =
      await createBooking({
        variables: {
          input: {
            consultationType:
              getConsultationType(),

            preferredTime:
              getPreferredTime(),

            preferredDate:
              new Date(
                `${form.preferredDate}T00:00:00.000Z`
              ).toISOString(),

            topic:
              form.topic.trim() ||
              null,

            message:
              form.message.trim() ||
              null,

            phoneNumber:
              form.phone.trim(),

            addressLine1:
              form.consultationType ===
              'onsite'
                ? form.address.trim()
                : null,

            addressLine2: null,

            city:
              form.consultationType ===
              'onsite'
                ? form.city.trim()
                : null,

            province:
              form.consultationType ===
              'onsite'
                ? form.province.trim()
                : null,

            postalCode:
              form.consultationType ===
              'onsite'
                ? form.postalCode.trim()
                : null,

            country:
              form.consultationType ===
              'onsite'
                ? form.country.trim() ||
                  'South Africa'
                : null
          }
        }
      })

    console.log(
      '[CREATE CONSULTATION RESPONSE]',
      result
    )

    const booking =
      result.data
        ?.createConsultationBooking

    if (!booking) {
      throw new Error(
        'The booking response was empty.'
      )
    }

    const bookingId =
      booking.id?.trim()

    if (!bookingId) {
      console.error(
        '[MISSING BOOKING ID]',
        {
          booking,
          result
        }
      )

      throw new Error(
        'The consultation was created, but the booking ID was not returned.'
      )
    }

    toast({
      title:
        'Consultation reserved',
      description:
        'Complete payment to confirm your consultation.',
      status: 'success',
      duration: 3000,
      isClosable: true
    })

    navigate(
      `/payment?bookingId=${encodeURIComponent(
        bookingId
      )}`,
      {
        replace: true
      }
    )
  } catch (error) {
    console.error(
      '[CREATE CONSULTATION ERROR]',
      error
    )

    toast({
      title:
        'Booking failed',
      description:
        error instanceof Error
          ? error.message
          : 'Unable to create consultation booking.',
      status: 'error',
      duration: 5000,
      isClosable: true
    })
  }
}

  return (
    <WebsiteLayout>
      <Box bg="#fbfaf7" minH="100vh">
        <PageBreadcrumb />

        <Container maxW="1200px" py="40px">
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="42px" alignItems="start">
            <Box pt="8px">
              <Text
                color={BRAND_GREEN}
                fontSize={{ base: '36px', md: '42px' }}
                fontWeight="800"
                lineHeight="0.95"
                mb="24px"
              >
                Book an Agricultural
                <br />
                Consultation
              </Text>

              <Text color="#53664b" fontSize="16px" lineHeight="1.6" maxW="520px" mb="28px">
                Get expert guidance from our agricultural specialists to optimize your farming
                operations, select the right equipment, and maximize your return on investment.
              </Text>

              <Flex
                bg="#eaf3e2"
                borderRadius="14px"
                h="72px"
                px="22px"
                align="center"
                maxW="520px"
                mb="28px"
              >
                <HStack flex="1" spacing="12px">
                  <Clock size={18} color={BRAND_GREEN} />
                  <Box>
                    <Text fontSize="13px" fontWeight="800" color={BRAND_GREEN}>
                      Duration
                    </Text>
                    <Text fontSize="13px" color="#53664b">
                      90 minutes
                    </Text>
                  </Box>
                </HStack>

                <HStack flex="1" spacing="12px">
                  <FaMoneyBill size={18} color={BRAND_GREEN} />
                  <Box>
                    <Text fontSize="13px" fontWeight="800" color={BRAND_GREEN}>
                      Fee
                    </Text>
                    <Text fontSize="13px" color="#53664b">
                      R2,500
                    </Text>
                  </Box>
                </HStack>
              </Flex>

              <Text color={BRAND_GREEN} fontSize="20px" fontWeight="800" mb="16px">
                What&apos;s Included
              </Text>

              <VStack align="start" spacing="12px">
                {included.map((item) => (
                  <HStack key={item} spacing="12px">
                    <Check size={16} color="#159947" />
                    <Text color="#53664b" fontSize="14px">
                      {item}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>

            <Box bg="white" borderRadius="16px" boxShadow="0 8px 24px rgba(0,0,0,0.06)" p="26px">
              <Text color={BRAND_GREEN} fontSize="20px" fontWeight="800" mb="22px">
                Book Your Session
              </Text>

              <VStack spacing="18px" align="stretch">
                <PhoneField
                  value={form.phone}
                  error={phoneError}
                  onBlur={() => {
                    setPhoneTouched(true)
                  }}
                  onChange={value => {
                    updateField(
                      'phone',
                      normalisePhoneInput(
                        value
                      )
                    )
                  }}
                />

                <FormField
                  label="Consultation Topic"
                  placeholder="Equipment advice"
                  value={form.topic}
                  onChange={(value) => updateField('topic', value)}
                />

                <Box>
                  <Label>Preferred Date *</Label>
                  <Input
                    type="date"
                    value={form.preferredDate}
                    min={today}
                    onChange={(event) => updateField('preferredDate', event.target.value)}
                    h="40px"
                    borderColor="#cfdcc5"
                    borderRadius="10px"
                    color="#53664b"
                    _focus={{
                      borderColor: BRAND_GREEN,
                      boxShadow: `0 0 0 1px ${BRAND_GREEN}`
                    }}
                  />
                </Box>

                <Box>
                  <Label>Preferred Time *</Label>
                  <SimpleGrid columns={2} spacing="10px">
                    <SelectableButton
                      isSelected={form.preferredTime === 'morning'}
                      onClick={() => updateField('preferredTime', 'morning')}
                    >
                      Morning (8AM-12PM)
                    </SelectableButton>

                    <SelectableButton
                      isSelected={form.preferredTime === 'afternoon'}
                      onClick={() => updateField('preferredTime', 'afternoon')}
                    >
                      Afternoon (1PM-5PM)
                    </SelectableButton>
                  </SimpleGrid>
                </Box>

                <Box>
                  <Label>Consultation Type *</Label>

                  <VStack spacing="8px" align="stretch">
                    {consultationTypes.map((item) => {
                      const Icon = item.icon
                      const selected = form.consultationType === item.value

                      return (
                        <HStack
                          key={item.value}
                          as="button"
                          type="button"
                          spacing="12px"
                          textAlign="left"
                          border="1px solid"
                          borderColor={selected ? BRAND_GREEN : '#cfdcc5'}
                          bg={selected ? LIGHT_GREEN : 'white'}
                          borderRadius="10px"
                          px="14px"
                          py="12px"
                          color={BRAND_GREEN}
                          cursor="pointer"
                          onClick={() =>
                            handleConsultationTypeChange(
                              item.value
                            )
                          }
                          _hover={{
                            borderColor: BRAND_GREEN,
                            bg: selected ? LIGHT_GREEN : '#f7fbf4'
                          }}
                        >
                          <Icon size={16} />

                          <Box>
                            <Text fontSize="13px" fontWeight="800">
                              {item.title}
                            </Text>

                            <Text fontSize="11px" color="#53664b">
                              {item.text}
                            </Text>
                          </Box>
                        </HStack>
                      )
                    })}
                  </VStack>
                </Box>

                {form.consultationType ===
                'onsite' ? (
                  <VStack
                    spacing="14px"
                    align="stretch"
                  >
                    <AddressAutoComplete
                      value={
                        form.address
                      }
                      label="Physical Address"
                      placeholder="Start typing the site visit address..."
                      isRequired
                      onChange={
                        handleAddressChange
                      }
                      onAddressSelected={
                        handleAddressSelected
                      }
                    />

                    <SimpleGrid
                      columns={{
                        base: 1,
                        md: 2
                      }}
                      spacing="12px"
                    >
                      <ReadOnlyAddressField
                        label="City *"
                        value={form.city}
                        placeholder="City"
                      />

                      <ReadOnlyAddressField
                        label="Province *"
                        value={
                          form.province
                        }
                        placeholder="Province"
                      />

                      <ReadOnlyAddressField
                        label="Postal Code *"
                        value={
                          form.postalCode
                        }
                        placeholder="Postal code"
                      />

                      <ReadOnlyAddressField
                        label="Country"
                        value={
                          form.country
                        }
                        placeholder="Country"
                      />
                    </SimpleGrid>

                    {form.formattedAddress ? (
                      <Box
                        p={3}
                        bg="#f7fbf4"
                        border="1px solid"
                        borderColor="#dfe7d5"
                        borderRadius="10px"
                      >
                        <Text
                          color="#53664b"
                          fontSize="11px"
                          fontWeight="700"
                          mb={1}
                        >
                          Selected address
                        </Text>

                        <Text
                          color={
                            BRAND_GREEN
                          }
                          fontSize="13px"
                        >
                          {
                            form.formattedAddress
                          }
                        </Text>
                      </Box>
                    ) : null}
                  </VStack>
                ) : null}

                <Box>
                  <Label>Tell us about your needs</Label>

                  <Textarea
                    h="88px"
                    value={form.message}
                    onChange={(event) => updateField('message', event.target.value)}
                    placeholder="Describe your current challenges, goals, or specific areas you'd like to discuss..."
                    borderColor="#cfdcc5"
                    borderRadius="10px"
                    _focus={{
                      borderColor: BRAND_GREEN,
                      boxShadow: `0 0 0 1px ${BRAND_GREEN}`
                    }}
                  />
                </Box>

                <Box borderTop="1px solid" borderColor="#dfe7d5" pt="14px">
                  <HStack justify="space-between" mb="14px">
                    <Text color="#53664b" fontSize="14px">
                      Consultation Fee
                    </Text>

                    <Text color={BRAND_GREEN} fontSize="22px" fontWeight="800">
                      R2,500
                    </Text>
                  </HStack>

                  <Button
                    w="100%"
                    h="44px"
                    bg={BRAND_GREEN}
                    color="white"
                    borderRadius="999px"
                    isLoading={loading}
                    isDisabled={!isValid || loading}
                    onClick={handleSubmit}
                    _hover={{ bg: '#0F3018' }}
                    _disabled={{
                      bg: '#9AA392',
                      cursor: 'not-allowed'
                    }}
                  >
                    Proceed to Payment
                  </Button>

                  <Text textAlign="center" color="#53664b" fontSize="9px" mt="10px">
                    * You&apos;ll receive confirmation within 24 hours
                  </Text>
                </Box>
              </VStack>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>
    </WebsiteLayout>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text color={BRAND_GREEN} fontSize="11px" fontWeight="800" mb="8px">
      {children}
    </Text>
  )
}

function PhoneField({
  value,
  error,
  onChange,
  onBlur
}: {
  value: string
  error?: string | null
  onChange: (value: string) => void
  onBlur: () => void
}) {
  return (
    <Box>
      <Label>
        Cellphone Number *
      </Label>

      <Input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        h="40px"
        value={value}
        maxLength={12}
        placeholder="0812345678 or +27812345678"
        borderColor={
          error
            ? 'red.400'
            : '#cfdcc5'
        }
        borderRadius="10px"
        onBlur={onBlur}
        onChange={event => {
          onChange(
            event.target.value
          )
        }}
        _focus={{
          borderColor:
            error
              ? 'red.400'
              : BRAND_GREEN,
          boxShadow:
            error
              ? '0 0 0 1px var(--chakra-colors-red-400)'
              : `0 0 0 1px ${BRAND_GREEN}`
        }}
        aria-invalid={
          Boolean(error)
        }
      />

      <Text
        mt={1.5}
        color={
          error
            ? 'red.500'
            : '#65745f'
        }
        fontSize="11px"
      >
        {error ??
          'Use a South African mobile number starting with 06, 07 or 08, or use +27.'}
      </Text>
    </Box>
  )
}

function FormField({
  label,
  placeholder,
  type = 'text',
  value,
  onChange
}: {
  label: string
  placeholder: string
  type?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Box>
      <Label>{label}</Label>

      <Input
        type={type}
        h="40px"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        borderColor="#cfdcc5"
        borderRadius="10px"
        _focus={{
          borderColor: BRAND_GREEN,
          boxShadow: `0 0 0 1px ${BRAND_GREEN}`
        }}
      />
    </Box>
  )
}

function ReadOnlyAddressField({
  label,
  value,
  placeholder
}: {
  label: string
  value: string
  placeholder: string
}) {
  return (
    <Box>
      <Label>{label}</Label>

      <Input
        h="40px"
        value={value}
        placeholder={placeholder}
        borderColor="#cfdcc5"
        borderRadius="10px"
        color="#53664b"
        bg="#f7f9f5"
        isReadOnly
        _readOnly={{
          cursor: 'default'
        }}
        _focus={{
          borderColor:
            BRAND_GREEN,
          boxShadow:
            `0 0 0 1px ${BRAND_GREEN}`
        }}
      />
    </Box>
  )
}

function SelectableButton({
  isSelected,
  onClick,
  children
}: {
  isSelected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      h="38px"
      bg={isSelected ? BRAND_GREEN : 'white'}
      color={isSelected ? 'white' : BRAND_GREEN}
      border="1px solid"
      borderColor={isSelected ? BRAND_GREEN : '#cfdcc5'}
      borderRadius="10px"
      fontSize="13px"
      onClick={onClick}
      _hover={{
        bg: isSelected ? BRAND_GREEN : '#f7fbf4',
        borderColor: BRAND_GREEN
      }}
    >
      {children}
    </Button>
  )
}