import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import images from "../theme/images";

const MotionBox = motion(Box);

const services = [
  {
    title: "Planning & Standards",
    description:
      "High-risk clearance, invasive species control, and technical operations",
    bullets: ["High-risk work", "Invasive control", "Technical ops"],
    accordionText:
      "We help organizations move from ad-hoc clearing to structured programs built on risk assessment and compliance requirements.",
  },
  {
    title: "Implementation Support",
    description:
      "Program design, contractor management, and quality assurance",
    bullets: ["Program design", "Quality assurance", "Contractor oversight"],
    accordionText:
      "We support organizations in executing their vegetation management programs, ensuring quality, compliance, and continuous improvement.",
  },
  {
    title: "Capacity Building",
    description:
      "Training, knowledge transfer, and organizational development",
    bullets: ["Staff training", "Knowledge transfer", "System setup"],
    accordionText:
      "We build internal capability so organizations can sustain their vegetation management programs independently.",
  },
  {
    title: "Specialised Execution",
    description:
      "High-risk clearance, invasive species control, and technical operations",
    bullets: ["High-risk work", "Invasive control", "Technical ops"],
    accordionText:
      "When the work requires specialized skills or presents elevated risk, we provide hands-on execution services.",
  },
];

export default function ServicesSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <Box
      as="section"
      id="services"
      position="relative"
      overflow="hidden"
      py={{ base: 16, md: 20 }}
      color="white"
      minH="68em"
    >
      <Box
        as="video"
        position="absolute"
        inset={0}
        w="100%"
        h="100%"
        objectFit="cover"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={images.serviceBg} type="video/mp4" />
      </Box>

      <Box position="absolute" inset={0} bg="rgba(0, 0, 0, 0.58)" />

      <Container maxW="7xl" position="relative" zIndex={2} mt="5%">
        <Heading
          textAlign="center"
          fontSize={{ base: "4xl", md: "6xl" }}
          fontWeight="700"
          mb={{ base: 10, md: 14 }}
        >
          Our Services
        </Heading>

        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={{ base: 8, lg: 10 }}
          alignItems="start"
        >
          {services.map((service, index) => {
            const isOpen = openIndex === index;

            return (
              <MotionBox
                key={service.title}
                bg={isOpen ? "#2B2B2B" : "white"}
                color={isOpen ? "white" : "#2d2d2d"}
                rounded="md"
                overflow="hidden"
                display="flex"
                flexDirection="column"
                minH="330px"
                boxShadow="0 12px 30px rgba(0,0,0,0.18)"
                animate={{
                  backgroundColor: isOpen ? "#2B2B2B" : "#ffffff",
                  color: isOpen ? "#ffffff" : "#2d2d2d",
                }}
                transition={{
                  duration: 0.35,
                  ease: "easeInOut",
                }}
              >
                <VStack align="start" spacing={5} p={7} flex="1">
                  <Text fontSize="lg" fontWeight={isOpen ? "700" : "600"}>
                    {service.title}
                  </Text>

                  <AnimatePresence mode="wait">
                    {isOpen ? (
                      <MotionBox
                        key={`${service.title}-details`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <Text fontSize="md" lineHeight="1.8" color="gray.200">
                          {service.accordionText}
                        </Text>
                      </MotionBox>
                    ) : (
                      <MotionBox
                        key={`${service.title}-summary`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <Text color="gray.500" fontSize="md" lineHeight="1.6">
                          {service.description}
                        </Text>

                        <VStack align="start" spacing={2} pt={4}>
                          {service.bullets.map((bullet) => (
                            <HStack key={bullet} spacing={2}>
                              <CheckCircle2 size={14} color="#0B4D2B" />
                              <Text fontSize="sm" color="#2d2d2d">
                                {bullet}
                              </Text>
                            </HStack>
                          ))}
                        </VStack>
                      </MotionBox>
                    )}
                  </AnimatePresence>
                </VStack>

                <Button
                  onClick={() => handleToggle(index)}
                  rounded="none"
                  bg="#0B4D2B"
                  color="white"
                  h="52px"
                  fontSize="md"
                  fontWeight="500"
                  _hover={{ bg: "#083b21" }}
                  _active={{ bg: "#062d19" }}
                >
                  {isOpen ? "Close" : "Read More"}
                </Button>
              </MotionBox>
            );
          })}
        </SimpleGrid>
      </Container>
    </Box>
  );
}