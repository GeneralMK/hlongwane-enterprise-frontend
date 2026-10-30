import {
  Box,
  Container,
  Flex,
  SimpleGrid,
  Text
} from '@chakra-ui/react'
import { ArrowRight } from 'lucide-react'

const resources = [
  {
    title: 'Conservation of Agricultural\nResources Act',
    description: 'Guidelines on sustainable land use and\nresource management'
  },
  {
    title: 'Equipment Safety Standards\n(SANS)',
    description: 'Required safety protocols for agricultural\nmachinery'
  },
  {
    title: 'Land Reform Guidelines',
    description: 'Regulatory framework for land ownership\nand usage'
  },
  {
    title: 'Sustainable Farming\nPractices',
    description: 'Best practices for environmental\nstewardship'
  }
]


export default function ComplianceSection() {
  return (
    <Box as="section" bg="#ffff" py="86px">
      <Container maxW="760px" px={0}>
        <Text
          textAlign="center"
          color="#050505"
          fontSize="38px"
          fontWeight="700"
          lineHeight="1.2"
          mb="22px"
        >
          Agricultural Compliance & Best Practices
        </Text>

        <Text
          textAlign="center"
          color="#444"
          fontSize="18px"
          lineHeight="1.45"
          maxW="690px"
          mx="auto"
          mb="38px"
        >
          Stay informed with up-to-date resources on South African farming regulations,
          <br />
          equipment safety standards, and land use guidelines.
        </Text>

        <SimpleGrid columns={2} spacing="16px">
          {resources.map((item) => (
            <Flex
              key={item.title}
              bg="white"
              border="1px solid"
              borderColor="#dfe7d5"
              borderRadius="13px"
              minH="136px"
              px="24px"
              py="23px"
              align="center"
              justify="space-between"
            >
              <Box>
                <Text
                  whiteSpace="pre-line"
                  color="#050505"
                  fontSize="16px"
                  fontWeight="700"
                  lineHeight="1.45"
                  mb="8px"
                >
                  {item.title}
                </Text>

                <Text
                  whiteSpace="pre-line"
                  color="#444"
                  fontSize="14px"
                  lineHeight="1.35"
                >
                  {item.description}
                </Text>
              </Box>

              <Box color="#444" ml="18px" flexShrink={0}>
                <ArrowRight size={22} strokeWidth={1.8} />
              </Box>
            </Flex>
          ))}
        </SimpleGrid>

        <Text
          mt="32px"
          textAlign="center"
          color="#444"
          fontSize="14px"
          fontStyle="italic"
        >
          This information is for general guidance. Consult with our specialists for tailored compliance advice.
        </Text>
      </Container>
    </Box>
  )
}