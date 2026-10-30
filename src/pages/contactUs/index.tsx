import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  useToast
} from '@chakra-ui/react'
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import WebsiteLayout from '../../layout/WebsiteLayout'
import images from '../../theme/images'

const BRAND_GREEN = '#173F1F'
const BRAND_GREEN_HOVER = '#0F3018'
const PAGE_BACKGROUND = '#FBFAF7'
const FAQ_BACKGROUND = '#EDF4E5'
const INPUT_BORDER = '#CDD8C5'
const MUTED_TEXT = '#667160'

const CONTACT_FORM_STORAGE_KEY = 'mckenzie-contact-form'

const CONTACT_API_URL = import.meta.env.VITE_APP_API_HOST + '/contact' || 'https://mckenzie-api-huvtu.ondigitalocean.app/contact'

type ContactForm = {
  fullName: string
  email: string
  phone: string
  subject: string
  message: string
}

type ContactFormErrors = Partial<Record<keyof ContactForm, string>>

type ContactApiPayload = {
  fullName: string
  email: string
  phone: string
  subject: string
  message: string
}

type ContactNavigationState = {
  requestType?: string
  subject?: string
}

type ApiErrorResponse = {
  message?: string
  error?: string
}

type FaqItem = {
  question: string
  answer: string
}

const initialForm: ContactForm = {
  fullName: '',
  email: '',
  phone: '',
  subject: '',
  message: ''
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What are the rental terms?',
    answer:
      'Rental terms depend on the equipment type, rental duration and availability. Our team will confirm the applicable daily rate, deposit, collection or delivery arrangements and return conditions before the rental is approved.'
  },
  {
    question: 'Do you offer financing options?',
    answer:
      'Financing may be available for qualifying equipment purchases. Contact our team with the equipment you are interested in and we will guide you through the available options and required documentation.'
  },
  {
    question: 'What warranty do you provide?',
    answer:
      'Warranty coverage depends on the equipment, manufacturer and whether the item is new or pre-owned. Full warranty details will be provided with the equipment quotation.'
  },
  {
    question: 'Do you deliver equipment?',
    answer:
      'Delivery can be arranged depending on the equipment size, destination and transport requirements. Delivery fees and estimated timelines will be confirmed before checkout.'
  }
]

function validateForm(form: ContactForm): ContactFormErrors {
  const errors: ContactFormErrors = {}

  const normalizedName = form.fullName.trim()

  const normalizedEmail = form.email.trim()

  const normalizedSubject = form.subject.trim()

  const normalizedMessage = form.message.trim()

  if (!normalizedName) {
    errors.fullName = 'Full name is required.'
  } else if (normalizedName.length < 2) {
    errors.fullName = 'Enter a valid full name.'
  }

  if (!normalizedEmail) {
    errors.email = 'Email address is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = 'Enter a valid email address.'
  }

  if (form.phone.trim() && form.phone.replace(/[^\d+]/g, '').length < 8) {
    errors.phone = 'Enter a valid phone number.'
  }

  if (!normalizedSubject) {
    errors.subject = 'Subject is required.'
  } else if (normalizedSubject.length < 3) {
    errors.subject = 'Subject must contain at least 3 characters.'
  }

  if (!normalizedMessage) {
    errors.message = 'Message is required.'
  } else if (normalizedMessage.length < 10) {
    errors.message = 'Message must contain at least 10 characters.'
  }

  return errors
}

function getErrorMessage(value: unknown): string {
  if (value instanceof Error) {
    return value.message
  }

  return 'Something went wrong. Please try again.'
}

export default function ContactUsPage() {
  const toast = useToast()
  const location = useLocation()

  const navigationState = location.state as ContactNavigationState | null

  const subjectFromNavigation =
    navigationState?.subject?.trim() || navigationState?.requestType?.trim() || ''

  const [form, setForm] = useState<ContactForm>(() => {
    const savedForm = localStorage.getItem(CONTACT_FORM_STORAGE_KEY)

    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm) as Partial<ContactForm>

        return {
          ...initialForm,
          ...parsed,
          subject: subjectFromNavigation || parsed.subject || ''
        }
      } catch {
        localStorage.removeItem(CONTACT_FORM_STORAGE_KEY)
      }
    }

    return {
      ...initialForm,
      subject: subjectFromNavigation
    }
  })

  const [errors, setErrors] = useState<ContactFormErrors>({})

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    localStorage.setItem(CONTACT_FORM_STORAGE_KEY, JSON.stringify(form))
  }, [form])

  useEffect(() => {
    if (!subjectFromNavigation) {
      return
    }

    setForm((current) => ({
      ...current,
      subject: subjectFromNavigation
    }))

    setErrors((current) => ({
      ...current,
      subject: undefined
    }))
  }, [subjectFromNavigation])

  const canSubmit = useMemo(() => {
    return (
      form.fullName.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
      form.subject.trim().length >= 3 &&
      form.message.trim().length >= 10
    )
  }, [form])

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target

    const field = name as keyof ContactForm

    setForm((current) => ({
      ...current,
      [field]: value
    }))

    setErrors((current) => ({
      ...current,
      [field]: undefined
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const validationErrors = validateForm(form)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)

      toast({
        title: 'Check the highlighted fields',
        description: 'Complete the required contact information before sending your message.',
        status: 'error',
        duration: 4000,
        isClosable: true
      })

      return
    }

    const payload: ContactApiPayload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      subject: form.subject.trim(),
      message: form.message.trim()
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(CONTACT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      let responseData: ApiErrorResponse | null = null

      try {
        responseData = await response.json()
      } catch {
        responseData = null
      }

      if (!response.ok) {
        throw new Error(responseData?.message || responseData?.error || 'Failed to send message.')
      }

      toast({
        title: 'Message sent',
        description: 'Thank you. Our team will get back to you soon.',
        status: 'success',
        duration: 4500,
        isClosable: true
      })

      localStorage.removeItem(CONTACT_FORM_STORAGE_KEY)

      setForm({
        ...initialForm,
        subject: subjectFromNavigation
      })

      setErrors({})
    } catch (error) {
      toast({
        title: 'Message could not be sent',
        description: getErrorMessage(error),
        status: 'error',
        duration: 5500,
        isClosable: true
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <WebsiteLayout>
      <Box bg={PAGE_BACKGROUND} color={BRAND_GREEN}>
        <HeroSection />

        <Box
          as="section"
          py={{
            base: 14,
            md: 20
          }}
        >
          <Container
            maxW="1180px"
            px={{
              base: 5,
              md: 8
            }}
          >
            <VStack
              spacing={2}
              textAlign="center"
              mb={{
                base: 10,
                md: 14
              }}
            >
              <Heading
                as="h1"
                fontSize={{
                  base: '34px',
                  md: '44px'
                }}
                fontWeight="800"
                letterSpacing="-0.025em"
                color={BRAND_GREEN}
              >
                Get in Touch
              </Heading>

              <Text
                color={MUTED_TEXT}
                fontSize={{
                  base: '15px',
                  md: '17px'
                }}
              >
                Have questions? We&apos;re here to help.
              </Text>
            </VStack>

            <SimpleGrid
              columns={{
                base: 1,
                lg: 2
              }}
              spacing={{
                base: 10,
                lg: 16
              }}
              alignItems="center"
            >
              <MapSection />

              <ContactFormCard
                form={form}
                errors={errors}
                canSubmit={canSubmit}
                isSubmitting={isSubmitting}
                onChange={handleChange}
                onSubmit={handleSubmit}
              />
            </SimpleGrid>
          </Container>
        </Box>

        <FaqSection />
      </Box>
    </WebsiteLayout>
  )
}

function HeroSection() {
  return (
    <Box
      as="section"
      position="relative"
      minH={{
        base: '350px',
        md: '470px'
      }}
      bgImage={`url(${images.contactUsBg})`}
      bgSize="cover"
      bgPosition="center"
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
    >
      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(90deg, rgba(13,48,21,0.55), rgba(42,84,14,0.38))"
      />

      <VStack
        position="relative"
        zIndex={1}
        spacing={5}
        textAlign="center"
        color="white"
        px={5}
        maxW="900px"
      >
        <Heading
          as="h2"
          fontSize={{
            base: '38px',
            md: '58px'
          }}
          lineHeight="1.05"
          fontWeight="800"
          letterSpacing="-0.025em"
        >
          Empowering Agricultural Excellence
        </Heading>

        <Text
          maxW="690px"
          fontSize={{
            base: '15px',
            md: '18px'
          }}
          lineHeight="1.7"
        >
          Premium equipment, expert consultation and flexible rental solutions for modern farming.
        </Text>

        <HStack spacing={4} pt={2} flexWrap="wrap" justify="center">
          <Button
            as={Link}
            to="/equipment"
            minW="150px"
            h="48px"
            borderRadius="full"
            bg="#D8A21D"
            color={BRAND_GREEN}
            fontWeight="700"
            _hover={{
              bg: '#C59118',
              textDecoration: 'none'
            }}
          >
            Shop Equipment
          </Button>

          <Button
            as={Link}
            to="/book-consultation"
            minW="170px"
            h="48px"
            borderRadius="full"
            variant="outline"
            borderColor="white"
            color="white"
            bg="whiteAlpha.100"
            _hover={{
              bg: 'white',
              color: BRAND_GREEN,
              textDecoration: 'none'
            }}
          >
            Book Consultation
          </Button>
        </HStack>
      </VStack>
    </Box>
  )
}

function MapSection() {
  return (
    <Box
      width="100%"
      height={{
        base: '340px',
        md: '430px'
      }}
      overflow="hidden"
      borderRadius="4px"
      bg="gray.100"
      boxShadow="0 6px 24px rgba(23,63,31,0.08)"
    >
      <iframe
        title="McKenzie Farming Solutions location"
        src="https://www.google.com/maps?q=24+Rustenburg+Road+Magaliesburg+1791+South+Africa&output=embed"
        width="100%"
        height="100%"
        style={{
          border: 0
        }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </Box>
  )
}

type ContactFormCardProps = {
  form: ContactForm
  errors: ContactFormErrors
  canSubmit: boolean
  isSubmitting: boolean
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function ContactFormCard({
  form,
  errors,
  canSubmit,
  isSubmitting,
  onChange,
  onSubmit
}: ContactFormCardProps) {
  const fieldStyles = {
    height: '48px',
    borderColor: INPUT_BORDER,
    borderRadius: '9px',
    bg: 'white',
    fontSize: '14px',
    _hover: {
      borderColor: '#A9BCA0'
    },
    _focusVisible: {
      borderColor: BRAND_GREEN,
      boxShadow: `0 0 0 1px ${BRAND_GREEN}`
    }
  }

  return (
    <Box
      as="form"
      onSubmit={onSubmit}
      bg="white"
      borderRadius="16px"
      border="1px solid"
      borderColor="#EFF1EC"
      boxShadow="0 8px 28px rgba(23,63,31,0.08)"
      p={{
        base: 5,
        md: 7
      }}
    >
      <SimpleGrid
        columns={{
          base: 1,
          md: 2
        }}
        spacing={4}
      >
        <FormControl isRequired isInvalid={Boolean(errors.fullName)}>
          <FormLabel fontSize="12px" fontWeight="700" color="#1F2F1C">
            Full Name
          </FormLabel>

          <Input
            name="fullName"
            value={form.fullName}
            onChange={onChange}
            placeholder="John Smith"
            autoComplete="fullName"
            isDisabled={isSubmitting}
            {...fieldStyles}
          />

          <FormErrorMessage>{errors.fullName}</FormErrorMessage>
        </FormControl>

        <FormControl isRequired isInvalid={Boolean(errors.email)}>
          <FormLabel fontSize="12px" fontWeight="700" color="#1F2F1C">
            Email
          </FormLabel>

          <Input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="john@example.com"
            autoComplete="email"
            isDisabled={isSubmitting}
            {...fieldStyles}
          />

          <FormErrorMessage>{errors.email}</FormErrorMessage>
        </FormControl>
      </SimpleGrid>

      <FormControl mt={4} isInvalid={Boolean(errors.phone)}>
        <FormLabel fontSize="12px" fontWeight="700" color="#1F2F1C">
          Phone
        </FormLabel>

        <Input
          name="phone"
          type="tel"
          value={form.phone}
          onChange={onChange}
          placeholder="+27 XX XXX XXXX"
          autoComplete="tel"
          isDisabled={isSubmitting}
          {...fieldStyles}
        />

        <FormErrorMessage>{errors.phone}</FormErrorMessage>
      </FormControl>

      <FormControl mt={4} isRequired isInvalid={Boolean(errors.subject)}>
        <FormLabel fontSize="12px" fontWeight="700" color="#1F2F1C">
          Subject
        </FormLabel>

        <Input
          name="subject"
          value={form.subject}
          onChange={onChange}
          placeholder="Equipment enquiry"
          isDisabled={isSubmitting}
          {...fieldStyles}
        />

        <FormErrorMessage>{errors.subject}</FormErrorMessage>
      </FormControl>

      <FormControl mt={4} isRequired isInvalid={Boolean(errors.message)}>
        <FormLabel fontSize="12px" fontWeight="700" color="#1F2F1C">
          Message
        </FormLabel>

        <Textarea
          name="message"
          value={form.message}
          onChange={onChange}
          placeholder="Tell us how we can help..."
          minH="135px"
          resize="vertical"
          borderColor={INPUT_BORDER}
          borderRadius="9px"
          fontSize="14px"
          isDisabled={isSubmitting}
          _hover={{
            borderColor: '#A9BCA0'
          }}
          _focusVisible={{
            borderColor: BRAND_GREEN,
            boxShadow: `0 0 0 1px ${BRAND_GREEN}`
          }}
        />

        <FormErrorMessage>{errors.message}</FormErrorMessage>
      </FormControl>

      <Button
        type="submit"
        mt={5}
        width="100%"
        height="50px"
        borderRadius="full"
        bg={BRAND_GREEN}
        color="white"
        fontSize="14px"
        fontWeight="700"
        isLoading={isSubmitting}
        loadingText="Sending"
        isDisabled={!canSubmit}
        _hover={{
          bg: BRAND_GREEN_HOVER
        }}
        _active={{
          bg: '#0B2512'
        }}
      >
        Send Message
      </Button>
    </Box>
  )
}

function FaqSection() {
  return (
    <Box
      as="section"
      bg={FAQ_BACKGROUND}
      py={{
        base: 14,
        md: 20
      }}
    >
      <Container
        maxW="900px"
        px={{
          base: 5,
          md: 8
        }}
      >
        <VStack
          spacing={2}
          textAlign="center"
          mb={{
            base: 8,
            md: 10
          }}
        >
          <Heading
            as="h2"
            fontSize={{
              base: '30px',
              md: '40px'
            }}
            fontWeight="800"
            color={BRAND_GREEN}
            letterSpacing="-0.02em"
          >
            Frequently Asked Questions
          </Heading>

          <Text color={MUTED_TEXT} fontSize="15px">
            Quick answers to common questions.
          </Text>
        </VStack>

        <Accordion allowToggle display="flex" flexDirection="column" gap={3}>
          {FAQ_ITEMS.map((item) => (
            <AccordionItem
              key={item.question}
              border="none"
              bg="white"
              borderRadius="14px"
              overflow="hidden"
              boxShadow="0 3px 12px rgba(23,63,31,0.05)"
            >
              <AccordionButton
                px={{
                  base: 5,
                  md: 6
                }}
                py={5}
                _hover={{
                  bg: '#F9FBF7'
                }}
                _expanded={{
                  bg: '#F9FBF7'
                }}
              >
                <Box
                  as="span"
                  flex="1"
                  textAlign="left"
                  color="#20321D"
                  fontWeight="700"
                  fontSize={{
                    base: '14px',
                    md: '15px'
                  }}
                >
                  {item.question}
                </Box>

                <AccordionIcon />
              </AccordionButton>

              <AccordionPanel
                px={{
                  base: 5,
                  md: 6
                }}
                pt={0}
                pb={5}
                color={MUTED_TEXT}
                fontSize="14px"
                lineHeight="1.8"
              >
                {item.answer}
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </Box>
  )
}
