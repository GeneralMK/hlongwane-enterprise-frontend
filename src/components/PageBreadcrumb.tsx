import { Box, Container, HStack, Link as ChakraLink, Text } from '@chakra-ui/react'
import { Link, useLocation } from 'react-router-dom'

const routeLabels: Record<string, string> = {
  about: 'About',
  equipment: 'Equipment',
  services: 'Services',
  'our-services': 'Services',
  technologies: 'Technology',
  industries: 'Industries',
  compliance: 'Compliance',
  'book-consultation': 'Book Consultation',
  'contact-us': 'Contact Us'
}

export default function PageBreadcrumb() {
  const { pathname } = useLocation()

  const parts = pathname.split('/').filter(Boolean)

  const crumbs = [
    {
      label: 'Home',
      path: '/'
    },
    ...parts.map((part, index) => ({
      label: routeLabels[part] ?? part.replace(/-/g, ' '),
      path: `/${parts.slice(0, index + 1).join('/')}`
    }))
  ]

  return (
    <Box bg="#eaf3e2" h="40px" display="flex" alignItems="center">
      <Container maxW="1400px">
        <HStack spacing="6px">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1

            return (
              <HStack key={`${crumb.path}-${index}`} spacing="6px">
                {isLast ? (
                  <Text fontSize="12px" color="#53664b">
                    {crumb.label}
                  </Text>
                ) : (
                  <ChakraLink
                    as={Link}
                    to={crumb.path}
                    fontSize="12px"
                    color="#53664b"
                    _hover={{ color: '#173F1F', textDecoration: 'none' }}
                  >
                    {crumb.label}
                  </ChakraLink>
                )}

                {!isLast && (
                  <Text fontSize="12px" color="#53664b">
                    &gt;
                  </Text>
                )}
              </HStack>
            )
          })}
        </HStack>
      </Container>
    </Box>
  )
}