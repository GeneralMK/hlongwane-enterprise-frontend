import { Box, 
  Button, Container, Flex, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import {
  Download,
  Droplet,
  ExternalLink,
  FileText,
  Leaf,
  Shield,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import WebsiteLayout from '../layout/WebsiteLayout'
import PageBreadcrumb from '../components/PageBreadcrumb'

const BRAND_GREEN = '#173F1F'
const LIGHT_GREEN = '#EEF5E8'
const GOLD = '#C99A20'

type ComplianceTab = 'popia' | 'environmental' | 'water' | 'safety'

const tabs = [
  {
    key: 'popia' as const,
    title: 'POPIA Compliance',
    description: 'Protection of Personal Information Act requirements for agricultural businesses',
    icon: Shield
  },
  {
    key: 'environmental' as const,
    title: 'Environmental Regulations',
    description: 'Conservation of Agricultural Resources Act (CARA) and environmental compliance',
    icon: Leaf
  },
  {
    key: 'water' as const,
    title: 'Water Use Licensing',
    description: 'National Water Act compliance and water use authorization requirements',
    icon: Droplet
  },
  {
    key: 'safety' as const,
    title: 'Health & Safety',
    description: 'Occupational Health and Safety Act requirements for farming operations',
    icon: AlertCircle
  }
]

const requirements: Record<
  ComplianceTab,
  { title: string; items: { title: string; text: string; badge: string }[] }
> = {
  popia: {
    title: 'POPIA Compliance Requirements',
    items: [
      {
        title: 'Appoint Information Officer',
        text: 'Designate a responsible person for POPIA compliance within your farming operation.',
        badge: 'Required'
      },
      {
        title: 'Data Inventory & Mapping',
        text: 'Document all personal information collected from employees, contractors, and customers.',
        badge: 'Required'
      },
      {
        title: 'Privacy Policy Development',
        text: 'Create and publish a comprehensive privacy policy for your agricultural business.',
        badge: 'Required'
      },
      {
        title: 'Consent Management',
        text: 'Implement systems to obtain and manage consent for data processing activities.',
        badge: 'Recommended'
      },
      {
        title: 'Security Measures',
        text: 'Establish technical and organizational measures to protect personal information.',
        badge: 'Required'
      }
    ]
  },
  environmental: {
    title: 'Environmental Regulations Requirements',
    items: [
      {
        title: 'CARA Registration',
        text: 'Register your farming operation with the Department of Agriculture.',
        badge: 'Required'
      },
      {
        title: 'Soil Conservation Plan',
        text: 'Develop and implement a soil conservation and land use management plan.',
        badge: 'Required'
      },
      {
        title: 'Invasive Species Control',
        text: 'Implement programs to control and eradicate invasive plant species on your land.',
        badge: 'Required'
      },
      {
        title: 'Environmental Impact Assessment',
        text: 'Conduct EIA for activities that may significantly affect the environment.',
        badge: 'If Applicable'
      }
    ]
  },
  water: {
    title: 'Water Use Licensing Requirements',
    items: [
      {
        title: 'Water Use Assessment',
        text: 'Determine if your water use requires authorization under the National Water Act.',
        badge: 'Required'
      },
      {
        title: 'License Application',
        text: 'Apply for water use license through the Department of Water and Sanitation.',
        badge: 'Required'
      },
      {
        title: 'Water Management Plan',
        text: 'Develop a comprehensive water conservation and management strategy.',
        badge: 'Required'
      },
      {
        title: 'Monitoring & Reporting',
        text: 'Implement water usage monitoring and submit required reports to authorities.',
        badge: 'Required'
      }
    ]
  },
  safety: {
    title: 'Health & Safety Requirements',
    items: [
      {
        title: 'Risk Assessment',
        text: 'Conduct comprehensive risk assessments for all farming activities and equipment.',
        badge: 'Required'
      },
      {
        title: 'Safety Policies & Procedures',
        text: 'Develop written health and safety policies and standard operating procedures.',
        badge: 'Required'
      },
      {
        title: 'Worker Training',
        text: 'Provide mandatory health and safety training to all employees and contractors.',
        badge: 'Required'
      },
      {
        title: 'PPE Provision',
        text: 'Supply appropriate personal protective equipment for all farm workers.',
        badge: 'Required'
      },
      {
        title: 'Incident Reporting System',
        text: 'Establish a system for reporting and investigating workplace incidents.',
        badge: 'Required'
      }
    ]
  }
}

const downloads = [
  'POPIA Compliance Checklist for Farms',
  'CARA Registration Application Form',
  'Water Use License Application Guide',
  'Farm Safety Compliance Manual'
]

const governmentLinks = [
  {
    title: 'Department of Agriculture',
    url: 'https://www.nda.gov.za/'
  },
  {
    title: 'Department of Water and Sanitation',
    url: 'https://www.dws.gov.za/'
  },
  {
    title: 'Department of Employment and Labour (OHS)',
    url: 'https://www.labour.gov.za/occupational-health-and-safety-%28ohs%29'
  },
  {
    title: 'Information Regulator South Africa (POPIA)',
    url: 'https://inforegulator.org.za/popia/'
  },
  {
    title: 'National Environmental Management Act Portal',
    url: 'https://www.gov.za/documents/national-environmental-management-act'
  },
  {
    title: 'Agricultural Product Standards Act Resources',
    url: 'https://www.nda.gov.za/index.php/core-business/agricultural-production/inspection-services/food-safety-quality-assurance'
  }
]

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState<ComplianceTab>('popia')
  const active = requirements[activeTab]

  return (
    <WebsiteLayout>
      <Box bg="#fbfaf7" minH="100vh">
        <Box bg="#eaf3e2" h="40px" display="flex" alignItems="center">
          <Container maxW="1400px">
            <Text fontSize="12px" color="#53664b">
              <PageBreadcrumb />
            </Text>
          </Container>
        </Box>

        <Container maxW="1400px" py="26px">
          <VStack spacing="10px" mb="44px" textAlign="center">
            <Text color={BRAND_GREEN} fontSize="42px" fontWeight="800" lineHeight="1">
              Agricultural Compliance Hub
            </Text>

            <Text color="#53664b" fontSize="15px" lineHeight="1.5" maxW="650px">
              Navigate South African farming regulations with confidence. Stay compliant with POPIA,
              environmental laws, water use licensing, and safety requirements.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="24px" mb="46px">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const selected = activeTab === tab.key

              return (
                <Box
                  key={tab.key}
                  as="button"
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  textAlign="left"
                  bg="white"
                  border="1px solid"
                  borderColor={selected ? GOLD : '#d7e3cf'}
                  borderRadius="12px"
                  p="28px"
                  minH="180px"
                  boxShadow={selected ? '0 8px 20px rgba(201,154,32,0.22)' : 'none'}
                  cursor="pointer"
                >
                  <Box
                    w="42px"
                    h="42px"
                    borderRadius="full"
                    bg={tab.key === 'safety' ? '#fff1cf' : '#e3f1e3'}
                    color={tab.key === 'safety' ? GOLD : BRAND_GREEN}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mb="22px"
                  >
                    <Icon size={22} />
                  </Box>

                  <Text color={BRAND_GREEN} fontSize="17px" fontWeight="800" mb="12px">
                    {tab.title}
                  </Text>

                  <Text color="#53664b" fontSize="12px" lineHeight="1.5" mb="16px">
                    {tab.description}
                  </Text>

                  <Text color={BRAND_GREEN} fontSize="12px" fontWeight="800">
                    {selected ? 'Hide Details ▲' : 'View Details ▼'}
                  </Text>
                </Box>
              )
            })}
          </SimpleGrid>

          <Box
            bg="white"
            border="1px solid"
            borderColor="#d7e3cf"
            borderRadius="14px"
            p="30px"
            mb="150px"
          >
            <Text color={BRAND_GREEN} fontSize="30px" fontWeight="800" mb="26px">
              {active.title}
            </Text>

            <VStack spacing="16px" align="stretch">
              {active.items.map((item, index) => (
                <Flex
                  key={item.title}
                  border="1px solid"
                  borderColor="#e2eadb"
                  borderRadius="10px"
                  minH="72px"
                  px="22px"
                  align="center"
                  justify="space-between"
                >
                  <HStack spacing="18px">
                    <Box
                      w="42px"
                      h="42px"
                      borderRadius="full"
                      bg={BRAND_GREEN}
                      color="white"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="15px"
                      fontWeight="800"
                    >
                      {index + 1}
                    </Box>

                    <Box>
                      <Text color={BRAND_GREEN} fontSize="13px" fontWeight="800">
                        {item.title}
                      </Text>
                      <Text color="#53664b" fontSize="11px">
                        {item.text}
                      </Text>
                    </Box>
                  </HStack>

                  <HStack spacing="18px">
                    <Box
                      bg={
                        item.badge === 'Required'
                          ? '#ffe0e4'
                          : item.badge === 'Recommended'
                          ? '#fff3b8'
                          : '#dbe7ff'
                      }
                      color={
                        item.badge === 'Required'
                          ? '#db3148'
                          : item.badge === 'Recommended'
                          ? '#a27c00'
                          : '#2463d9'
                      }
                      px="10px"
                      py="4px"
                      borderRadius="999px"
                      fontSize="10px"
                      fontWeight="800"
                    >
                      {item.badge}
                    </Box>
                    <CheckCircle2 size={16} color="#cfdcc5" />
                  </HStack>
                </Flex>
              ))}
            </VStack>

            <Flex
              mt="28px"
              bg={LIGHT_GREEN}
              borderRadius="10px"
              px="24px"
              py="20px"
              align="center"
              justify="space-between"
            >
              <Box>
                <Text color={BRAND_GREEN} fontSize="13px" fontWeight="800">
                  Need Expert Compliance Assistance?
                </Text>
                <Text color="#53664b" fontSize="11px">
                  Our agricultural compliance consultants can help you navigate these requirements.
                </Text>
              </Box>

              <Button
                as={Link}
                to="/book-consultation"
                bg={BRAND_GREEN}
                color="white"
                h="34px"
                px="28px"
                borderRadius="999px"
                fontSize="12px"
                _hover={{ bg: '#0f3018' }}
              >
                Book Consultation
              </Button>
            </Flex>
          </Box>

          <Text color={BRAND_GREEN} fontSize="28px" fontWeight="800" mb="22px">
            Compliance Resources & Downloads
          </Text>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing="16px" mb="44px">
            {downloads.map((item, index) => (
              <HStack
                key={item}
                bg="white"
                border="1px solid"
                borderColor="#d7e3cf"
                borderRadius="12px"
                p="24px"
                spacing="18px"
              >
                <Box
                  w="40px"
                  h="40px"
                  borderRadius="full"
                  bg={LIGHT_GREEN}
                  color={BRAND_GREEN}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <FileText size={20} />
                </Box>

                <Box>
                  <Text color={BRAND_GREEN} fontSize="13px" fontWeight="800">
                    {item}
                  </Text>
                  <Text color="#53664b" fontSize="11px">
                    PDF Guide · {index === 3 ? '5.1 MB' : index === 2 ? '3.2 MB' : '2.4 MB'} ·
                    Updated 2026-0{index + 2}-15
                  </Text>
                  <HStack color={BRAND_GREEN} fontSize="11px" fontWeight="800" mt="8px">
                    <Download size={13} />
                    <Text>Download PDF</Text>
                  </HStack>
                </Box>
              </HStack>
            ))}
          </SimpleGrid>

          <Box
            bg="white"
            border="1px solid"
            borderColor="#d7e3cf"
            borderRadius="12px"
            p="24px"
            mb="34px"
          >
            <Text color={BRAND_GREEN} fontSize="17px" fontWeight="800" mb="18px">
              Official Government Resources
            </Text>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing="12px">
              {governmentLinks.map((item) => (
                <Flex
                  key={item.title}
                  as="a"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  border="1px solid"
                  borderColor="#d7e3cf"
                  borderRadius="8px"
                  h="40px"
                  px="14px"
                  align="center"
                  justify="space-between"
                  transition="all 0.2s ease"
                  _hover={{
                    borderColor: GOLD,
                    bg: LIGHT_GREEN,
                    textDecoration: 'none',
                    transform: 'translateY(-1px)'
                  }}
                  _focusVisible={{
                    outline: '2px solid',
                    outlineColor: GOLD,
                    outlineOffset: '2px'
                  }}
                >
                  <Text color={BRAND_GREEN} fontSize="11px" fontWeight="700">
                    {item.title}
                  </Text>
                  <ExternalLink size={13} color={BRAND_GREEN} aria-hidden="true" />
                </Flex>
              ))}
            </SimpleGrid>
          </Box>

          <HStack
            align="start"
            bg="#fff5df"
            border="1px solid"
            borderColor={GOLD}
            borderRadius="10px"
            p="22px"
            mb="120px"
          >
            <AlertCircle size={18} color={GOLD} />

            <Box>
              <Text color={BRAND_GREEN} fontSize="13px" fontWeight="800" mb="4px">
                Legal Disclaimer
              </Text>
              <Text color="#53664b" fontSize="11px" lineHeight="1.5">
                This information is provided for general guidance only and should not be considered
                legal advice. Compliance requirements may vary based on your specific farming
                operation, location, and activities. We recommend consulting with qualified legal
                and compliance professionals to ensure full adherence to all applicable regulations.
              </Text>
            </Box>
          </HStack>
        </Container>
      </Box>
    </WebsiteLayout>
  )
}
