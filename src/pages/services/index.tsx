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
import { CheckCircle2, ClipboardCheck, Cog, GraduationCap, Pickaxe } from "lucide-react";
import WebsiteLayout from "../../layout/WebsiteLayout";
import images from "../../theme/images";

const services = [
  {
    title: "Planning & Standards",
    subtitle: "Strategic frameworks for risk-based vegetation management",
    description:
      "We help organizations move from ad-hoc clearing to structured programs built on risk assessment and compliance requirements.",
    icon: ClipboardCheck,
    deliverables: [
      "Vegetation risk assessments",
      "Compliance framework development",
      "National and organizational standards",
      "Policy and procedure design",
      "Multi-year program planning",
      "Budget modeling and optimization",
    ],
  },
  {
    title: "Implementation Support",
    subtitle: "Execution oversight and quality assurance",
    description:
      "We support organizations in executing their vegetation management programs, ensuring quality, compliance, and continuous improvement.",
    icon: Cog,
    deliverables: [
      "Program design and setup",
      "Contractor selection and management",
      "Quality assurance and auditing",
      "Work specification development",
      "Performance monitoring",
      "Issue resolution and optimization",
    ],
  },
  {
    title: "Capacity Building",
    subtitle: "Knowledge transfer and organizational development",
    description:
      "We build internal capability so organizations can sustain their vegetation management programs independently.",
    icon: GraduationCap,
    deliverables: [
      "Staff training programs",
      "Technical knowledge transfer",
      "Process documentation",
      "System setup and configuration",
      "Mentorship and coaching",
      "Organizational readiness assessments",
    ],
  },
  {
    title: "Specialised Execution",
    subtitle: "High-risk and technical vegetation operations",
    description:
      "When the work requires specialized skills or presents elevated risk, we provide hands-on execution services.",
    icon: Pickaxe,
    deliverables: [
      "High-risk clearance near live infrastructure",
      "Invasive species control programs",
      "Emergency response services",
      "Technical rope access work",
      "Ecological restoration",
      "Herbicide application programs",
    ],
  },
];

export default function ServicesPage() {
  return (
    <WebsiteLayout>
      <Box>
        <Box
          position="relative"
          minH={{ base: "260px", md: "330px" }}
          bgImage={`url(${images.lidarScanning})`}
          bgSize="cover"
          bgPosition="center"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="white"
        >
          <Box position="absolute" inset={0} bg="rgba(0,0,0,0.45)" />

          <VStack position="relative" zIndex={1} spacing={3} textAlign="center">
            <Heading fontSize={{ base: "4xl", md: "6xl" }} fontWeight="600">
              Services
            </Heading>
            <Text fontSize={{ base: "lg", md: "2xl" }}>
              From strategic planning to hands-on execution
            </Text>
          </VStack>
        </Box>

        <Box bg="white" py={{ base: 14, md: 20 }}>
          <Container maxW="6xl">
            <VStack spacing={{ base: 14, md: 20 }} align="stretch">
              {services.map((service, index) => {
                const IconComponent = service.icon;
                const isReversed = index % 2 === 1;

                const info = (
                  <VStack align="start" spacing={5}>
                    <HStack spacing={4} align="start">
                      <Box
                        w="44px"
                        h="44px"
                        rounded="md"
                        bg="#14532D"
                        color="white"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        <Icon as={IconComponent} boxSize={6} />
                      </Box>

                      <Box>
                        <Heading color="#2d2d2d" fontSize={{ base: "2xl", md: "3xl" }}>
                          {service.title}
                        </Heading>
                        <Text color="gray.500" fontSize="sm">
                          {service.subtitle}
                        </Text>
                      </Box>
                    </HStack>

                    <Text color="gray.500" lineHeight="1.8" maxW="520px">
                      {service.description}
                    </Text>
                  </VStack>
                );

                const deliverables = (
                  <Box bg="#f4f4f0" rounded="md" p={{ base: 6, md: 8 }}>
                    <Text color="#2d2d2d" fontWeight="600" mb={5}>
                      What We Deliver
                    </Text>

                    <VStack align="start" spacing={3}>
                      {service.deliverables.map((item) => (
                        <HStack key={item} spacing={3} align="start">
                          <CheckCircle2 size={15} color="#14532D" />
                          <Text color="#2d2d2d" fontSize="sm">
                            {item}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                );

                return (
                  <SimpleGrid
                    key={service.title}
                    columns={{ base: 1, md: 2 }}
                    spacing={{ base: 8, md: 16 }}
                    alignItems="center"
                  >
                    {isReversed ? (
                      <>
                        {deliverables}
                        {info}
                      </>
                    ) : (
                      <>
                        {info}
                        {deliverables}
                      </>
                    )}
                  </SimpleGrid>
                );
              })}
            </VStack>
          </Container>
        </Box>
      </Box>
    </WebsiteLayout>
  );
}