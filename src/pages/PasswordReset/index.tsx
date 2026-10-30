import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Center,
  Checkbox,
  Circle,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Icon,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  List,
  ListIcon,
  ListItem,
  Progress,
  Spinner,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import {
  type FieldErrors,
  useForm,
} from "react-hook-form";
import {
  MdCheckCircle,
  MdLockOutline,
  MdOutlineArrowBack,
  MdOutlineSecurity,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import images from "../../theme/images";

type FormData = {
  password: string;
  confirmPassword: string;
  acceptSecurityNotice: boolean;
};

type PasswordRequirement = {
  label: string;
  passed: boolean;
};

const MINIMUM_PASSWORD_LENGTH = 8;

function getPasswordStrength(
  password: string,
): number {
  let score = 0;

  if (
    password.length >=
    MINIMUM_PASSWORD_LENGTH
  ) {
    score += 20;
  }

  if (/[a-z]/.test(password)) {
    score += 20;
  }

  if (/[A-Z]/.test(password)) {
    score += 20;
  }

  if (/\d/.test(password)) {
    score += 20;
  }

  if (
    /[^A-Za-z0-9]/.test(password)
  ) {
    score += 20;
  }

  return score;
}

function getStrengthDetails(
  strength: number,
): {
  label: string;
  colorScheme: string;
} {
  if (strength <= 20) {
    return {
      label: "Very weak",
      colorScheme: "red",
    };
  }

  if (strength <= 40) {
    return {
      label: "Weak",
      colorScheme: "orange",
    };
  }

  if (strength <= 60) {
    return {
      label: "Fair",
      colorScheme: "yellow",
    };
  }

  if (strength <= 80) {
    return {
      label: "Good",
      colorScheme: "blue",
    };
  }

  return {
    label: "Strong",
    colorScheme: "green",
  };
}

async function getApiErrorMessage(
  response: Response,
): Promise<string> {
  try {
    const body = await response.json();

    return (
      body?.message ||
      body?.error ||
      "Unable to set your password."
    );
  } catch {
    const body = await response.text();

    return (
      body ||
      "Unable to set your password."
    );
  }
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const toast = useToast({
    position: "top-right",
  });

  const [searchParams] =
    useSearchParams();

  const token = searchParams.get("token");

  const [loading, setLoading] =
    useState(true);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    resetSuccessful,
    setResetSuccessful,
  ] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
      acceptSecurityNotice: false,
    },
  });

  const password = watch("password");
  const confirmPassword = watch(
    "confirmPassword",
  );

  const passwordStrength =
    useMemo(
      () =>
        getPasswordStrength(
          password ?? "",
        ),
      [password],
    );

  const strengthDetails =
    getStrengthDetails(
      passwordStrength,
    );

  const passwordRequirements:
    PasswordRequirement[] = useMemo(
      () => [
        {
          label: `At least ${MINIMUM_PASSWORD_LENGTH} characters`,
          passed:
            password.length >=
            MINIMUM_PASSWORD_LENGTH,
        },
        {
          label:
            "At least one uppercase letter",
          passed: /[A-Z]/.test(password),
        },
        {
          label:
            "At least one lowercase letter",
          passed: /[a-z]/.test(password),
        },
        {
          label: "At least one number",
          passed: /\d/.test(password),
        },
        {
          label:
            "At least one special character",
          passed:
            /[^A-Za-z0-9]/.test(
              password,
            ),
        },
      ],
      [password],
    );

  const allRequirementsPassed =
    passwordRequirements.every(
      (requirement) =>
        requirement.passed,
    );

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        setLoading(false);
      },
      300,
    );

    return () =>
      window.clearTimeout(timer);
  }, []);

  const onInvalid = (
    formErrors: FieldErrors<FormData>,
  ) => {
    const firstError =
      formErrors.password?.message ||
      formErrors.confirmPassword
        ?.message ||
      formErrors.acceptSecurityNotice
        ?.message;

    if (firstError) {
      toast({
        title:
          "Please review the form",
        description: String(firstError),
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const onSubmit = async (
    formData: FormData,
  ) => {
    if (!token) {
      toast({
        title: "Invalid reset link",
        description:
          "This password reset link is missing its security token.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });

      return;
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setError("confirmPassword", {
        type: "validate",
        message:
          "The passwords do not match.",
      });

      return;
    }

    if (!allRequirementsPassed) {
      setError("password", {
        type: "validate",
        message:
          "Your password does not meet all security requirements.",
      });

      return;
    }

    try {
      const apiHost =
        import.meta.env
          .VITE_APP_API_HOST;

      if (!apiHost) {
        throw new Error(
          "The API address is not configured.",
        );
      }

      const response = await fetch(
        `${apiHost}/admin/reset-password-token`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            token,
            password:
              formData.password,
          }),
        },
      );

      if (!response.ok) {
        const message =
          await getApiErrorMessage(
            response,
          );

        throw new Error(message);
      }

      setResetSuccessful(true);

      toast({
        title: "Password created",
        description:
          "Your administrator password was created successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      window.setTimeout(() => {
        navigate("/admin/support-agent/dashboard", {
          replace: true,
        });
      }, 1800);
    } catch (error) {
      toast({
        title:
          "Unable to set password",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Center
        minH="100vh"
        bg="#F4F7F5"
      >
        <VStack spacing={4}>
          <Spinner
            size="xl"
            thickness="4px"
            color="#176B2C"
          />

          <Text color="gray.600">
            Preparing your secure
            password setup...
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Flex
      minH="100vh"
      bg="#F4F7F5"
      position="relative"
      overflow="hidden"
    >
      {/* Decorative background */}
      <Box
        position="absolute"
        top="-180px"
        right="-180px"
        width="480px"
        height="480px"
        borderRadius="full"
        bg="green.100"
        opacity={0.5}
      />

      <Box
        position="absolute"
        bottom="-220px"
        left="-180px"
        width="520px"
        height="520px"
        borderRadius="full"
        bg="green.50"
      />

      <Flex
        width="100%"
        maxW="1440px"
        minH="100vh"
        mx="auto"
        p={{
          base: 0,
          md: 6,
          xl: 10,
        }}
        align="center"
        position="relative"
        zIndex={1}
      >
        <Flex
          width="100%"
          minH={{
            base: "100vh",
            md: "760px",
          }}
          maxH={{
            xl: "880px",
          }}
          bg="white"
          borderRadius={{
            base: 0,
            md: "3xl",
          }}
          overflow="hidden"
          boxShadow={{
            base: "none",
            md: "0 25px 70px rgba(15, 50, 30, 0.13)",
          }}
        >
          {/* Left content */}
          <Flex
            display={{
              base: "none",
              lg: "flex",
            }}
            width="45%"
            position="relative"
            direction="column"
            justify="space-between"
            p={{
              lg: 10,
              xl: 14,
            }}
            color="white"
            overflow="hidden"
            bg="#0C5124"
          >
            <Box
              position="absolute"
              inset={0}
              bgImage={
                images.contactUsBg
              }
              bgPosition="center"
              bgSize="cover"
              bgRepeat="no-repeat"
              opacity={0.15}
            />

            <Box
              position="absolute"
              inset={0}
              bgGradient="linear(to-br, rgba(8, 82, 34, 0.95), rgba(2, 48, 21, 0.92))"
            />

            <Box
              position="relative"
              zIndex={1}
            >
              <Image
                src={images.logo}
                alt="Company logo"
                maxW="190px"
                maxH="85px"
                objectFit="contain"
                bg="white"
                borderRadius="xl"
                px={4}
                py={2}
              />
            </Box>

            <VStack
              position="relative"
              zIndex={1}
              align="flex-start"
              spacing={6}
              maxW="430px"
            >
              <Circle
                size="64px"
                bg="whiteAlpha.200"
                borderWidth="1px"
                borderColor="whiteAlpha.400"
              >
                <Icon
                  as={MdOutlineSecurity}
                  boxSize={8}
                />
              </Circle>

              <Box>
                <Heading
                  fontSize={{
                    lg: "3xl",
                    xl: "4xl",
                  }}
                  lineHeight="1.15"
                  mb={4}
                >
                  Secure your administrator
                  account
                </Heading>

                <Text
                  color="whiteAlpha.800"
                  fontSize="lg"
                  lineHeight="1.8"
                >
                  Create a strong password
                  to complete your account
                  setup and safely access
                  the administration portal.
                </Text>
              </Box>

              <VStack
                align="stretch"
                spacing={4}
                width="100%"
              >
                {[
                  "Protected administrator access",
                  "Secure account activation",
                  "Encrypted password storage",
                ].map((item) => (
                  <Flex
                    key={item}
                    align="center"
                    gap={3}
                  >
                    <Circle
                      size="30px"
                      bg="whiteAlpha.200"
                    >
                      <Icon
                        as={MdCheckCircle}
                        boxSize={4}
                      />
                    </Circle>

                    <Text
                      color="whiteAlpha.900"
                      fontWeight="500"
                    >
                      {item}
                    </Text>
                  </Flex>
                ))}
              </VStack>
            </VStack>

            <Text
              position="relative"
              zIndex={1}
              fontSize="sm"
              color="whiteAlpha.700"
            >
              Administrator Portal
            </Text>
          </Flex>

          {/* Form content */}
          <Flex
            width={{
              base: "100%",
              lg: "55%",
            }}
            align="center"
            justify="center"
            px={{
              base: 5,
              sm: 8,
              md: 14,
              xl: 20,
            }}
            py={{
              base: 8,
              md: 12,
            }}
          >
            <Box
              width="100%"
              maxW="520px"
            >
              <Image
                display={{
                  base: "block",
                  lg: "none",
                }}
                src={images.logo}
                alt="Company logo"
                maxW="170px"
                maxH="75px"
                objectFit="contain"
                mb={8}
              />

              {resetSuccessful ? (
                <Center
                  minH="480px"
                  textAlign="center"
                >
                  <VStack spacing={6}>
                    <Circle
                      size="90px"
                      bg="green.50"
                    >
                      <Icon
                        as={MdCheckCircle}
                        color="green.600"
                        boxSize={12}
                      />
                    </Circle>

                    <Box>
                      <Heading
                        size="lg"
                        color="gray.900"
                        mb={3}
                      >
                        Password created
                      </Heading>

                      <Text
                        color="gray.600"
                        lineHeight="1.7"
                      >
                        Your account is ready.
                        You are being redirected
                        to the administrator
                        sign-in page.
                      </Text>
                    </Box>

                    <Spinner
                      color="green.600"
                    />
                  </VStack>
                </Center>
              ) : (
                <>
                  <Circle
                    size="52px"
                    bg="green.50"
                    color="green.700"
                    mb={5}
                  >
                    <Icon
                      as={MdLockOutline}
                      boxSize={6}
                    />
                  </Circle>

                  <Heading
                    as="h1"
                    fontSize={{
                      base: "2xl",
                      md: "3xl",
                    }}
                    color="gray.900"
                    mb={2}
                  >
                    Set your password
                  </Heading>

                  <Text
                    color="gray.600"
                    lineHeight="1.7"
                    mb={8}
                  >
                    Choose a strong password
                    for your administrator
                    account. You will use it
                    when signing in.
                  </Text>

                  {!token && (
                    <Alert
                      status="error"
                      borderRadius="xl"
                      mb={6}
                    >
                      <AlertIcon />

                      <AlertDescription>
                        This password reset link
                        is invalid or incomplete.
                        Request a new invitation
                        from an administrator.
                      </AlertDescription>
                    </Alert>
                  )}

                  <form
                    onSubmit={handleSubmit(
                      onSubmit,
                      onInvalid,
                    )}
                    noValidate
                  >
                    <VStack
                      spacing={5}
                      align="stretch"
                    >
                      <FormControl
                        isRequired
                        isInvalid={
                          Boolean(
                            errors.password,
                          )
                        }
                      >
                        <FormLabel
                          color="gray.700"
                          fontWeight="600"
                        >
                          New password
                        </FormLabel>

                        <InputGroup size="lg">
                          <Input
                            {...register(
                              "password",
                              {
                                required:
                                  "Enter your new password.",
                                minLength: {
                                  value:
                                    MINIMUM_PASSWORD_LENGTH,
                                  message: `Password must contain at least ${MINIMUM_PASSWORD_LENGTH} characters.`,
                                },
                                validate: {
                                  uppercase:
                                    (
                                      value,
                                    ) =>
                                      /[A-Z]/.test(
                                        value,
                                      ) ||
                                      "Include at least one uppercase letter.",

                                  lowercase:
                                    (
                                      value,
                                    ) =>
                                      /[a-z]/.test(
                                        value,
                                      ) ||
                                      "Include at least one lowercase letter.",

                                  number:
                                    (
                                      value,
                                    ) =>
                                      /\d/.test(
                                        value,
                                      ) ||
                                      "Include at least one number.",

                                  special:
                                    (
                                      value,
                                    ) =>
                                      /[^A-Za-z0-9]/.test(
                                        value,
                                      ) ||
                                      "Include at least one special character.",
                                },
                              },
                            )}
                            type={
                              showPassword
                                ? "text"
                                : "password"
                            }
                            placeholder="Enter a strong password"
                            autoComplete="new-password"
                            borderRadius="xl"
                            pr="48px"
                            _focusVisible={{
                              borderColor:
                                "green.600",
                              boxShadow:
                                "0 0 0 1px var(--chakra-colors-green-600)",
                            }}
                          />

                          <InputRightElement>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              minW="36px"
                              aria-label={
                                showPassword
                                  ? "Hide password"
                                  : "Show password"
                              }
                              onClick={() =>
                                setShowPassword(
                                  (current) =>
                                    !current,
                                )
                              }
                            >
                              <Icon
                                as={
                                  showPassword
                                    ? MdVisibilityOff
                                    : MdVisibility
                                }
                                boxSize={5}
                              />
                            </Button>
                          </InputRightElement>
                        </InputGroup>

                        <FormErrorMessage>
                          {
                            errors.password
                              ?.message
                          }
                        </FormErrorMessage>

                        {password && (
                          <Box mt={4}>
                            <Flex
                              justify="space-between"
                              mb={2}
                            >
                              <Text
                                fontSize="sm"
                                color="gray.600"
                              >
                                Password strength
                              </Text>

                              <Text
                                fontSize="sm"
                                fontWeight="600"
                                color={`${strengthDetails.colorScheme}.600`}
                              >
                                {
                                  strengthDetails.label
                                }
                              </Text>
                            </Flex>

                            <Progress
                              value={
                                passwordStrength
                              }
                              size="sm"
                              borderRadius="full"
                              colorScheme={
                                strengthDetails.colorScheme
                              }
                            />
                          </Box>
                        )}
                      </FormControl>

                      <Box
                        p={4}
                        bg="gray.50"
                        borderRadius="xl"
                        borderWidth="1px"
                        borderColor="gray.100"
                      >
                        <Text
                          fontSize="sm"
                          fontWeight="600"
                          color="gray.700"
                          mb={3}
                        >
                          Your password must
                          include:
                        </Text>

                        <List spacing={2}>
                          {passwordRequirements.map(
                            (
                              requirement,
                            ) => (
                              <ListItem
                                key={
                                  requirement.label
                                }
                                display="flex"
                                alignItems="center"
                                color={
                                  requirement.passed
                                    ? "green.600"
                                    : "gray.500"
                                }
                                fontSize="sm"
                              >
                                <ListIcon
                                  as={
                                    MdCheckCircle
                                  }
                                  color={
                                    requirement.passed
                                      ? "green.500"
                                      : "gray.300"
                                  }
                                />

                                {
                                  requirement.label
                                }
                              </ListItem>
                            ),
                          )}
                        </List>
                      </Box>

                      <FormControl
                        isRequired
                        isInvalid={
                          Boolean(
                            errors.confirmPassword,
                          )
                        }
                      >
                        <FormLabel
                          color="gray.700"
                          fontWeight="600"
                        >
                          Confirm password
                        </FormLabel>

                        <InputGroup size="lg">
                          <Input
                            {...register(
                              "confirmPassword",
                              {
                                required:
                                  "Confirm your new password.",
                                validate:
                                  (
                                    value,
                                  ) =>
                                    value ===
                                      password ||
                                    "The passwords do not match.",
                              },
                            )}
                            type={
                              showConfirmPassword
                                ? "text"
                                : "password"
                            }
                            placeholder="Re-enter your password"
                            autoComplete="new-password"
                            borderRadius="xl"
                            pr="48px"
                            _focusVisible={{
                              borderColor:
                                "green.600",
                              boxShadow:
                                "0 0 0 1px var(--chakra-colors-green-600)",
                            }}
                          />

                          <InputRightElement>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              minW="36px"
                              aria-label={
                                showConfirmPassword
                                  ? "Hide confirmation password"
                                  : "Show confirmation password"
                              }
                              onClick={() =>
                                setShowConfirmPassword(
                                  (current) =>
                                    !current,
                                )
                              }
                            >
                              <Icon
                                as={
                                  showConfirmPassword
                                    ? MdVisibilityOff
                                    : MdVisibility
                                }
                                boxSize={5}
                              />
                            </Button>
                          </InputRightElement>
                        </InputGroup>

                        <FormErrorMessage>
                          {
                            errors
                              .confirmPassword
                              ?.message
                          }
                        </FormErrorMessage>

                        {confirmPassword &&
                          confirmPassword ===
                            password && (
                            <FormHelperText color="green.600">
                              Passwords match.
                            </FormHelperText>
                          )}
                      </FormControl>

                      <FormControl
                        isInvalid={
                          Boolean(
                            errors.acceptSecurityNotice,
                          )
                        }
                      >
                        <Checkbox
                          {...register(
                            "acceptSecurityNotice",
                            {
                              required:
                                "Please confirm that you understand the security notice.",
                            },
                          )}
                          colorScheme="green"
                          alignItems="flex-start"
                        >
                          <Text
                            fontSize="sm"
                            color="gray.600"
                            lineHeight="1.6"
                          >
                            I understand that I
                            must keep this
                            password private and
                            should not share it
                            with anyone.
                          </Text>
                        </Checkbox>

                        <FormErrorMessage>
                          {
                            errors
                              .acceptSecurityNotice
                              ?.message
                          }
                        </FormErrorMessage>
                      </FormControl>

                      <Button
                        type="submit"
                        size="lg"
                        height="52px"
                        bg="#176B2C"
                        color="white"
                        borderRadius="xl"
                        isLoading={
                          isSubmitting
                        }
                        loadingText="Creating password"
                        isDisabled={
                          !token ||
                          !allRequirementsPassed ||
                          password !==
                            confirmPassword
                        }
                        _hover={{
                          bg: "#105823",
                        }}
                        _active={{
                          bg: "#0C471C",
                        }}
                      >
                        Create password
                      </Button>

                      <Center>
                        <Link
                          display="inline-flex"
                          alignItems="center"
                          gap={2}
                          color="gray.600"
                          fontSize="sm"
                          fontWeight="500"
                          onClick={() =>
                            navigate(
                              "/admin/support-agent/dashboard",
                            )
                          }
                          _hover={{
                            color:
                              "green.700",
                            textDecoration:
                              "none",
                          }}
                        >
                          <Icon
                            as={
                              MdOutlineArrowBack
                            }
                          />

                          Back to admin sign in
                        </Link>
                      </Center>
                    </VStack>
                  </form>
                </>
              )}
            </Box>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ResetPassword;