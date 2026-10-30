import {
  Box,
  Container,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Building2,
  Factory,
  Radio,
  Train,
  Wheat,
  Zap,
} from "lucide-react";
import WebsiteLayout from "../../layout/WebsiteLayout";
import images from "../../theme/images";

const industries = [
  {
    title: "Power Utilities",
    icon: Zap,
    description:
      "Vegetation contact is the leading cause of transmission and distribution failures. We help utilities shift from reactive clearing to risk-based programs.",
    challenges: [
      "Vegetation-caused outages",
      "Emergency clearance costs",
      "Regulatory compliance requirements",
      "Public safety exposure",
    ],
    solutions: [
      "Transmission corridor risk mapping",
      "Distribution trim cycle optimization",
      "Growth forecasting for maintenance planning",
      "Compliance documentation systems",
    ],
  },
  {
    title: "Telecommunications",
    icon: Radio,
    description:
      "Telecom networks span vast corridors where vegetation threatens signal quality, tower access, and structural integrity.",
    challenges: [
      "Signal interference from vegetation",
      "Tower access restrictions",
      "Equipment damage from falling trees",
      "Site maintenance inefficiency",
    ],
    solutions: [
      "Tower site vegetation clearance standards",
      "Fiber corridor management programs",
      "Access road maintenance protocols",
      "Site-specific risk assessments",
    ],
  },
  {
    title: "Mining",
    icon: Factory,
    description:
      "Mining operations require clear haul roads, stable infrastructure corridors, and compliance with environmental rehabilitation obligations.",
    challenges: [
      "Haul road visibility and safety",
      "Infrastructure corridor encroachment",
      "Environmental compliance obligations",
      "Invasive species on disturbed land",
    ],
    solutions: [
      "Haul road vegetation management plans",
      "Powerline and conveyor corridor programs",
      "Rehabilitation vegetation standards",
      "Invasive species control programs",
    ],
  },
  {
    title: "Transport",
    icon: Train,
    description:
      "Road and rail networks demand clear sight lines, stable embankments, and predictable vegetation that doesn’t obstruct operations.",
    challenges: [
      "Sight distance obstruction",
      "Signal and sign visibility",
      "Embankment stability",
      "Drainage blockage from vegetation",
    ],
    solutions: [
      "Roadside vegetation clearance standards",
      "Rail corridor inspection programs",
      "Sight distance modeling and remediation",
      "Stormwater system vegetation control",
    ],
  },
  {
    title: "Agriculture",
    icon: Wheat,
    description:
      "Large agricultural estates face invasive species pressure, irrigation system interference, and biosecurity requirements.",
    challenges: [
      "Invasive species spread",
      "Irrigation system blockage",
      "Biosecurity compliance",
      "Fire risk from unmanaged vegetation",
    ],
    solutions: [
      "Invasive alien plant control programs",
      "Irrigation corridor clearance protocols",
      "Biosecurity vegetation management plans",
      "Firebreak establishment and maintenance",
    ],
  },
  {
    title: "Estates & Facilities",
    icon: Building2,
    description:
      "Corporate campuses, government facilities, and large estates require professional vegetation management that balances aesthetics, safety, and cost.",
    challenges: [
      "Tree hazard risk to people and property",
      "Infrastructure damage from roots and branches",
      "Aesthetic versus safety trade-offs",
      "Budget predictability",
    ],
    solutions: [
      "Tree risk assessment programs",
      "Long-term vegetation management plans",
      "Contractor procurement and oversight",
      "Multi-year budget forecasting",
    ],
  },
];

export default function IndustriesPage() {
  return (
    <WebsiteLayout>
      <Box>
        <Box
          position="relative"
          minH={{ base: "260px", md: "330px" }}
          bgImage={`url(${images.industriesHero})`}
          bgSize="cover"
          bgPosition="center"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="white"
        >
          <Box position="absolute" inset={0} bg="rgba(0,0,0,0.35)" />

          <VStack position="relative" zIndex={1} spacing={3} textAlign="center" px={4}>
            <Heading fontSize={{ base: "4xl", md: "6xl" }} fontWeight="600">
              Industries
            </Heading>

            <Text fontSize={{ base: "lg", md: "2xl" }}>
              Sector-specific vegetation management solutions
            </Text>
          </VStack>
        </Box>

        <Box bg="white" py={{ base: 14, md: 20 }}>
          <Container maxW="6xl">
            <VStack align="start" spacing={4} mb={{ base: 12, md: 16 }}>
              <Heading color="#2d2d2d" fontSize={{ base: "3xl", md: "4xl" }}>
                Built for Infrastructure Scale
              </Heading>

              <Text color="gray.600" lineHeight="1.8" maxW="850px">
                While vegetation management principles are universal, each sector faces unique
                challenges, regulatory environments, and operational constraints. Our approach
                adapts to the specific needs of your industry while maintaining structured,
                risk-based methods.
              </Text>
            </VStack>

            <VStack spacing={{ base: 12, md: 14 }} align="stretch">
              {industries.map((industry, index) => {
                const IconComponent = industry.icon;

                return (
                  <Box
                    key={industry.title}
                    borderBottom={
                      index === industries.length - 1 ? "none" : "1px solid"
                    }
                    borderColor="gray.200"
                    pb={{ base: 10, md: 14 }}
                  >
                    <SimpleGrid
                      columns={{ base: 1, lg: 3 }}
                      spacing={{ base: 8, lg: 10 }}
                      alignItems="start"
                    >
                      <VStack align="start" spacing={5}>
                        <HStack spacing={4} align="center">
                          <Box
                            w="44px"
                            h="44px"
                            rounded="md"
                            bg="#eef3ee"
                            color="#14532D"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            <Icon as={IconComponent} boxSize={6} />
                          </Box>

                          <Heading
                            color="#2d2d2d"
                            fontSize={{ base: "xl", md: "2xl" }}
                            fontWeight="500"
                          >
                            {industry.title}
                          </Heading>
                        </HStack>

                        <Text color="gray.600" lineHeight="1.8" fontSize="sm">
                          {industry.description}
                        </Text>
                      </VStack>

                      <Box bg="#f4f4f0" rounded="md" p={6}>
                        <Text color="#2d2d2d" fontSize="sm" fontWeight="600" mb={4}>
                          Common Challenges
                        </Text>

                        <VStack align="start" spacing={2}>
                          {industry.challenges.map((challenge) => (
                            <Text key={challenge} color="#14532D" fontSize="xs">
                              • {challenge}
                            </Text>
                          ))}
                        </VStack>
                      </Box>

                      <Box bg="#f4f4f0" rounded="md" p={6}>
                        <Text color="#2d2d2d" fontSize="sm" fontWeight="600" mb={4}>
                          Our Solutions
                        </Text>

                        <VStack align="start" spacing={2}>
                          {industry.solutions.map((solution) => (
                            <Text key={solution} color="#14532D" fontSize="xs">
                              • {solution}
                            </Text>
                          ))}
                        </VStack>
                      </Box>
                    </SimpleGrid>
                  </Box>
                );
              })}
            </VStack>
          </Container>
        </Box>
      </Box>
    </WebsiteLayout>
  );
}