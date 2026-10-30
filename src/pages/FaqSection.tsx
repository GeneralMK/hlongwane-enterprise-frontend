import {
  Box,
  Collapse,
  Container,
  Flex,
  Text,
  VStack
} from '@chakra-ui/react'
import { Plus, Minus } from 'lucide-react'
import { useState } from 'react'

const faqs = [
  {
    question: 'What are the rental terms?',
    answer:
      'Rental terms are flexible and depend on the equipment type, rental period, and availability.'
  },
  {
    question: 'Do you offer financing options?',
    answer:
      'Yes, we offer flexible financing options for selected equipment purchases.'
  },
  {
    question: 'What warranty do you provide?',
    answer:
      'Warranty terms vary by equipment type and manufacturer.'
  }
]

const BRAND_GREEN = '#173f1f'

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <Box as="section" bg="#edf5e8" py={{ base: '70px', md: '82px' }}>
      <Container maxW="760px">
        <Text
          textAlign="center"
          color={BRAND_GREEN}
          fontSize={{ base: '36px', md: '50px' }}
          fontWeight="800"
          lineHeight="1.1"
          mb="14px"
        >
          Frequently Asked Questions
        </Text>

        <Text
          textAlign="center"
          color="#53664b"
          fontSize={{ base: '18px', md: '20px' }}
          mb={{ base: '42px', md: '50px' }}
        >
          Quick answers to common questions
        </Text>

        <VStack spacing="16px" align="stretch">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index

            return (
              <Box
                key={faq.question}
                bg="white"
                borderRadius="18px"
                boxShadow="0 10px 24px rgba(23,63,31,0.08)"
                overflow="hidden"
              >
                <Flex
                  h="76px"
                  px="24px"
                  align="center"
                  justify="space-between"
                  cursor="pointer"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <Text color={BRAND_GREEN} fontSize="18px" fontWeight="700">
                    {faq.question}
                  </Text>

                  {isOpen ? (
                    <Minus size={22} color={BRAND_GREEN} />
                  ) : (
                    <Plus size={22} color={BRAND_GREEN} />
                  )}
                </Flex>

                <Collapse in={isOpen} animateOpacity>
                  <Box px="24px" pb="22px">
                    <Text color="#53664b" fontSize="16px" lineHeight="1.6">
                      {faq.answer}
                    </Text>
                  </Box>
                </Collapse>
              </Box>
            )
          })}
        </VStack>
      </Container>
    </Box>
  )
}