import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  EnumUserRole,
  useCreateAdminUserMutation,
  useFetchAdminRolesQuery,
} from "../../../generated/graphql";

type AddAdminUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
};

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  role: EnumUserRole;
};

const AddAdminUserModal: React.FC<AddAdminUserModalProps> = ({
  isOpen,
  onClose,
  onUserAdded,
}) => {
  const toast = useToast({ position: "top" });
  const [createAdminUser, { loading }] = useCreateAdminUserMutation();
  const {
    data: rolesData,
    loading: rolesLoading,
    error: rolesError,
  } = useFetchAdminRolesQuery();
  const [roles, setRoles] = useState<
    { id: string; name: string; role: EnumUserRole }[]
  >([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();

  useEffect(() => {
    if (rolesData && rolesData.adminUserRoles) {
      setRoles(
        rolesData.adminUserRoles.filter((role) => role !== null) as {
          id: string;
          name: string;
          role: EnumUserRole;
        }[]
      );
    }
  }, [rolesData]);

  const onSubmit = async (data: FormData) => {
    try {
      const response = await createAdminUser({ variables: { input: data } });

      if (response.errors) {
        const unauthorizedError = response.errors.find((error) =>
          error.message.includes(
            "Unauthorized: Only super admins can create new admin users"
          )
        );
        if (unauthorizedError) {
          toast({
            status: "error",
            title: "Unauthorized",
            description: unauthorizedError.message,
            duration: 9000,
            isClosable: true,
          });
          return;
        }
      }

      toast({
        status: "success",
        title: "Admin User Created",
        description: "The admin user has been created successfully",
      });
      reset(); // Reset the form fields
      onUserAdded();
      onClose();
    } catch (error) {
      toast({
        status: "error",
        title: "Error",
        description: "There was an error creating the admin user",
      });
    }
  };

  if (rolesLoading) {
    return <Spinner />;
  }

  if (rolesError) {
    toast({
      status: "error",
      title: "Error",
      description: "There was an error fetching roles",
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      motionPreset="slideInBottom"
    >
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent>
        <ModalHeader textAlign="center">Add New User</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.firstName}>
                <FormLabel>First Name</FormLabel>
                <Input
                  placeholder="First Name"
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                />
              </FormControl>
              <FormControl isInvalid={!!errors.lastName}>
                <FormLabel>Last Name</FormLabel>
                <Input
                  placeholder="Last Name"
                  {...register("lastName", {

                    required: "Last name is required",
                  })}
                />
              </FormControl>
              <FormControl isInvalid={!!errors.email}>
                <FormLabel>Email</FormLabel>
                <Input
                  placeholder="Email"
                  
                  {...register("email", { required: "Email is required" })}
                />
              </FormControl>
              <FormControl isInvalid={!!errors.role}>
                <FormLabel>Role</FormLabel>
                <Select
                  placeholder="Select role"
                  {...register("role", { required: "Role is required" })}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.role}>
                      {role.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              type="submit"
              isLoading={loading}
              bg="rgba(3, 101, 50, 1)"
              textColor="white"
            >
              Add User
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default AddAdminUserModal;
