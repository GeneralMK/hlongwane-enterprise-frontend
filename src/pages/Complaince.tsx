import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  Icon,
} from "@chakra-ui/react";
import {
  ShieldCheck,
  FileCheck2,
  Sprout,
} from "lucide-react";

const complianceItems = [
  {
    title: "Occupational Health & Safety Act",
    description:
      "Compliant safety protocols and risk management",
    icon: ShieldCheck,
  },
  {
    title: "NEMA",
    description:
      "Environmental management and conservation alignment",
    icon: FileCheck2,
  },
  {
    title: "CARA",
    description:
      "Agricultural pest and invasive species control",
    icon: Sprout,
  },
];

export default function RegulatoryComplianceSection() {
  return (
    <Box bg="#f8f8f5" py={{ base: 16, md: 24 }}>
      <Container maxW="7xl">
        <VStack spacing={{ base: 12, md: 16 }}>
          {/* Heading */}
          <VStack spacing={4}>
            <Heading
              textAlign="center"
              color="#2d2d2d"
              fontSize={{ base: "4xl", md: "6xl" }}
              fontWeight="700"
              lineHeight="1"
            >
              Regulatory Compliance
            </Heading>

            <Text
              textAlign="center"
              color="#4a4a4a"
              fontSize={{ base: "md", md: "xl" }}
              maxW="700px"
            >
              Our systems align with South Africa&apos;s regulatory framework
            </Text>
          </VStack>

          {/* Cards */}
          <SimpleGrid
            columns={{ base: 1, md: 3 }}
            spacing={{ base: 6, md: 8 }}
            w="100%"
          >
            {complianceItems.map((item) => (
              <VStack
                key={item.title}
                bg="white"
                rounded="lg"
                py={{ base: 10, md: 12 }}
                px={{ base: 6, md: 8 }}
                spacing={5}
                minH="220px"
                justify="center"
                textAlign="center"
                boxShadow="0 2px 8px rgba(0,0,0,0.03)"
              >
                {/* Icon */}
                <Icon
                  as={item.icon}
                  boxSize={12}
                  color="#14532D"
                  strokeWidth={2}
                />

                {/* Title */}
                <Heading
                  fontSize={{ base: "xl", md: "2xl" }}
                  fontWeight="500"
                  color="#2d2d2d"
                  lineHeight="1.3"
                >
                  {item.title}
                </Heading>

                {/* Description */}
                <Text
                  color="#666"
                  fontSize={{ base: "md", md: "lg" }}
                  lineHeight="1.7"
                  maxW="320px"
                >
                  {item.description}
                </Text>
              </VStack>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
}