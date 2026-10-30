import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  GridItem,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Textarea,
  useToast,
  VStack,
  Text,
  HStack,
  Icon,
} from "@chakra-ui/react";
import { useState } from "react";

/* Small medallion icon for the header */
const MailSparkIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
    <path d="M4 6.5h16v11H4z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 3.2V1m0 0 1.2 1.2M12 1 10.8 2.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ContactModal({ isOpen, onClose }: Props) {
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [data, setData] = useState({
    name: "",
    email: "",
    company: "",
    topic: "General Inquiry",
    message: "",
    consent: false,
  });

  const set = (key: keyof typeof data) => (e: any) =>
    setData((d) => ({ ...d, [key]: e?.target?.type === "checkbox" ? e.target.checked : e.target.value }));

  const errors = {
    name: !data.name && touched.name,
    email: (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) && touched.email,
    message: !data.message && touched.message,
    consent: !data.consent && touched.consent,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const submit = async () => {
    setTouched({ name: true, email: true, message: true, consent: true });
    if (hasErrors || !data.name || !data.email || !data.message || !data.consent) return;

    try {
      setLoading(true);
      // TODO: hook up to your backend / emailer here.
      await new Promise((r) => setTimeout(r, 900));

      toast({
        title: "Message sent",
        description: "Thanks  our team will reach out shortly.",
        status: "success",
        duration: 3500,
        isClosable: true,
      });
      onClose();
      setLoading(false);
      setData({ name: "", email: "", company: "", topic: "General Inquiry", message: "", consent: false });
      setTouched({});
    } catch (e) {
      setLoading(false);
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      {/* Dim + blur backdrop */}
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(6px)" />

      <ModalContent
        rounded="xl"
        overflow="hidden"
        position="relative"
        // gradient-border + translucent body to match your theme
        sx={{
          background:
            "linear-gradient(rgba(9,12,26,0.92), rgba(9,12,26,0.92)) padding-box," +
            "linear-gradient(135deg, rgba(168,85,247,0.35), rgba(168,85,247,0.12), rgba(168,85,247,0.35)) border-box",
          border: "1px solid transparent",
        }}
        boxShadow="0 24px 80px rgba(124,58,237,0.28)"
      >
        {/* decorative glow + tiny dots inside modal */}
        <Box
          aria-hidden
          position="absolute"
          inset={0}
          zIndex={0}
          pointerEvents="none"
        >
          <Box
            position="absolute"
            top="-10%"
            left="60%"
            w="70%"
            h="50%"
            bg="radial-gradient(45% 60% at 50% 40%, rgba(124,58,237,0.45) 0%, rgba(124,58,237,0) 70%)"
            filter="blur(18px)"
          />
          <Box
            position="absolute"
            inset={0}
            opacity={0.18}
            mixBlendMode="screen"
            bgImage={`
              radial-gradient(rgba(255,255,255,0.30) 1.2px, transparent 1.2px),
              radial-gradient(rgba(255,255,255,0.18) 1.2px, transparent 1.2px)
            `}
            bgSize="72px 72px, 48px 48px"
            bgPos="0 0, 24px 24px"
          />
        </Box>

        <ModalHeader position="relative" zIndex={1}>
          <HStack spacing={3}>
            <Box
              w="34px"
              h="34px"
              rounded="full"
              display="grid"
              placeItems="center"
              bgGradient="linear(to-b, rgba(168,85,247,0.45), rgba(124,58,237,0.45))"
              border="1px solid rgba(168,85,247,0.55)"
              boxShadow="0 8px 22px rgba(124,58,237,0.35)"
            >
              <Icon as={MailSparkIcon} color="white" />
            </Box>
            <Text color="white" fontWeight={600}>Contact Us</Text>
          </HStack>
          <Text mt={2} color="gray.300" fontSize="sm">
            Tell us about your mission  we’ll follow up shortly.
          </Text>
        </ModalHeader>

        <ModalCloseButton color="whiteAlpha.800" zIndex={1} />

        <ModalBody pt={0} pb={6} position="relative" zIndex={1}>
          <VStack align="stretch" spacing={5}>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              <GridItem>
                <FormControl isRequired isInvalid={!!errors.name}>
                  <FormLabel color="white">Full Name</FormLabel>
                  <Input
                    value={data.name}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    onChange={set("name")}
                    placeholder="Jane Doe"
                    color="white"
                    _placeholder={{ color: "whiteAlpha.600" }}
                    bg="blackAlpha.400"
                    borderColor="whiteAlpha.300"
                    _focus={{ borderColor: "purple.400", boxShadow: "0 0 0 1px rgba(168,85,247,0.6)" }}
                  />
                  <FormErrorMessage>Enter your name</FormErrorMessage>
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired isInvalid={!!errors.email}>
                  <FormLabel color="white">Work Email</FormLabel>
                  <Input
                    type="email"
                    value={data.email}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    onChange={set("email")}
                    placeholder="jane@company.com"
                    color="white"
                    _placeholder={{ color: "whiteAlpha.600" }}
                    bg="blackAlpha.400"
                    borderColor="whiteAlpha.300"
                    _focus={{ borderColor: "purple.400", boxShadow: "0 0 0 1px rgba(168,85,247,0.6)" }}
                  />
                  <FormErrorMessage>Provide a valid email</FormErrorMessage>
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel color="white">Company / Organization</FormLabel>
                  <Input
                    value={data.company}
                    onChange={set("company")}
                    placeholder="Analytikus Aero"
                    color="white"
                    _placeholder={{ color: "whiteAlpha.600" }}
                    bg="blackAlpha.400"
                    borderColor="whiteAlpha.300"
                    _focus={{ borderColor: "purple.400", boxShadow: "0 0 0 1px rgba(168,85,247,0.6)" }}
                  />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel color="white">Topic</FormLabel>
                  <Select
                    value={data.topic}
                    onChange={set("topic")}
                    color="white"
                    bg="blackAlpha.400"
                    borderColor="whiteAlpha.300"
                    _focus={{ borderColor: "purple.400", boxShadow: "0 0 0 1px rgba(168,85,247,0.6)" }}
                  >
                    <option style={{ color: "#000" }}>General Inquiry</option>
                    <option style={{ color: "#000" }}>Partnership</option>
                    <option style={{ color: "#000" }}>Other</option>
                  </Select>
                </FormControl>
              </GridItem>
            </Grid>

            <FormControl isRequired isInvalid={!!errors.message}>
              <FormLabel color="white">How can we help?</FormLabel>
              <Textarea
                rows={5}
                value={data.message}
                onBlur={() => setTouched((t) => ({ ...t, message: true }))}
                onChange={set("message")}
                placeholder="Briefly describe your needs or project goals…"
                color="white"
                _placeholder={{ color: "whiteAlpha.600" }}
                bg="blackAlpha.400"
                borderColor="whiteAlpha.300"
                _focus={{ borderColor: "purple.400", boxShadow: "0 0 0 1px rgba(168,85,247,0.6)" }}
              />
              <FormErrorMessage>Add a short message</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.consent}>
              <Checkbox
                isChecked={data.consent}
                onBlur={() => setTouched((t) => ({ ...t, consent: true }))}
                onChange={set("consent")}
                colorScheme="purple"
              >
                <Text color="gray.300" fontSize="sm">
                  I agree to the processing of my information according to the{" "}
                  <Text as="span" color="purple.300" textDecoration="underline" cursor="pointer">
                    Privacy Policy
                  </Text>.
                </Text>
              </Checkbox>
              <FormErrorMessage>Consent is required</FormErrorMessage>
            </FormControl>

            <HStack justify="flex-end" pt={2}>
              <Button variant="ghost" onClick={onClose} color="whiteAlpha.900">
                Cancel
              </Button>
              <Button
                onClick={submit}
                isLoading={loading}
                color="white"
                rounded="lg"
                bgGradient="linear(to-r, #A855F7, #7C3AED)"
                _hover={{ filter: "brightness(1.08)" }}
              >
                Send Message
              </Button>
            </HStack>
          </VStack>
        </ModalBody>

       
      </ModalContent>
    </Modal>
  );
}
