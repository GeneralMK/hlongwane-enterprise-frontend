import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DeleteIcon,
  EditIcon,
} from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  IconButton,
  Input,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  MdAssignmentAdd,
  MdPersonAdd,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

import {
  type AdminUser,
  EnumUserRole,
  useFetchAdminUsersQuery,
} from "../../../generated/graphql";
import { useAuthContext } from "../../../context";

import AddAdminUserModal from "./addUserModal";
import UpdateAdminUserModal from "./updateUserModal";
import DeleteAdminUserModal from "./deleteUserModal";
import AssignSupportTicket from "./assignSupportTicket";

const ROWS_PER_PAGE = 5;

function getAdminFullName(admin: AdminUser): string {
  const fullName = [
    admin.firstName,
    admin.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "Unnamed Admin";
}

function getRoleLabel(
  role?: EnumUserRole | null,
): string {
  switch (role) {
    case EnumUserRole.SuperAdmin:
      return "Super Admin";

    case EnumUserRole.Admin:
      return "Admin";

    case EnumUserRole.SupportAgent:
      return "Support Agent";

    default:
      return "Unknown";
  }
}

function formatAdminDate(
  value?: string | Date | null,
): string {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const AdminUserManagementPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthContext();

  const [selectedAdminUser, setSelectedAdminUser] =
    useState<AdminUser | null>(null);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const {
    loading,
    data,
    error,
    refetch,
  } = useFetchAdminUsersQuery({
    fetchPolicy: "network-only",
  });

  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onClose: onAddClose,
  } = useDisclosure();

  const {
    isOpen: isUpdateOpen,
    onOpen: onUpdateOpen,
    onClose: onUpdateClose,
  } = useDisclosure();

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const {
    isOpen: isAssignOpen,
    onOpen: onAssignOpen,
    onClose: onAssignClose,
  } = useDisclosure();

  const adminUsers = useMemo(
    () =>
      (data?.adminUsers ?? []).filter(
        (admin): admin is AdminUser =>
          Boolean(admin),
      ),
    [data?.adminUsers],
  );

  const filteredAdmins = useMemo(() => {
    const normalizedSearch =
      searchQuery.trim().toLowerCase();

    if (!normalizedSearch) {
      return adminUsers;
    }

    return adminUsers.filter((admin) => {
      const fullName =
        getAdminFullName(admin).toLowerCase();

      const email =
        admin.email?.toLowerCase() ?? "";

      const role =
        getRoleLabel(admin.role).toLowerCase();

      return (
        fullName.includes(normalizedSearch) ||
        email.includes(normalizedSearch) ||
        role.includes(normalizedSearch)
      );
    });
  }, [adminUsers, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredAdmins.length / ROWS_PER_PAGE,
    ),
  );

  const paginatedAdmins = useMemo(() => {
    const startIndex =
      (currentPage - 1) * ROWS_PER_PAGE;

    return filteredAdmins.slice(
      startIndex,
      startIndex + ROWS_PER_PAGE,
    );
  }, [filteredAdmins, currentPage]);

  const startResult =
    filteredAdmins.length === 0
      ? 0
      : (currentPage - 1) *
          ROWS_PER_PAGE +
        1;

  const endResult = Math.min(
    currentPage * ROWS_PER_PAGE,
    filteredAdmins.length,
  );

  const currentUserRole =
    user && "role" in user
      ? user.role
      : undefined;

  const canManageAdminUsers =
    currentUserRole ===
      EnumUserRole.SuperAdmin ||
    currentUserRole === EnumUserRole.Admin;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (
      user &&
      !canManageAdminUsers
    ) {
      toast({
        title: "Access denied",
        description:
          "You do not have permission to manage admin users.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });

      navigate("/admin/dashboard", {
        replace: true,
      });
    }
  }, [
    user,
    canManageAdminUsers,
    navigate,
    toast,
  ]);

  const handleRefresh = async () => {
    try {
      await refetch();
    } catch {
      toast({
        title: "Refresh failed",
        description:
          "Unable to refresh administrator users.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleUserAdded = async () => {
    await handleRefresh();
    setCurrentPage(1);
  };

  const handleUserUpdated = async () => {
    await handleRefresh();
  };

  const handleEditClick = (
    admin: AdminUser,
  ) => {
    setSelectedAdminUser(admin);
    onUpdateOpen();
  };

  const handleDeleteClick = (
    admin: AdminUser,
  ) => {
    setSelectedAdminUser(admin);
    onDeleteOpen();
  };

  const handleAssignClick = (
    admin: AdminUser,
  ) => {
    if (
      admin.role !==
      EnumUserRole.SupportAgent
    ) {
      toast({
        title: "Invalid assignment",
        description:
          "Support tickets can only be assigned to support agents.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });

      return;
    }

    setSelectedAdminUser(admin);
    onAssignOpen();
  };

  if (loading) {
    return (
      <Center minH="65vh">
        <Flex
          direction="column"
          align="center"
          gap={4}
        >
          <Spinner
            color="green.600"
            size="xl"
            thickness="4px"
          />

          <Text color="gray.500">
            Loading admin users...
          </Text>
        </Flex>
      </Center>
    );
  }

  if (error) {
    return (
      <Center minH="65vh">
        <Box
          maxW="500px"
          width="100%"
          p={8}
          borderWidth="1px"
          borderRadius="xl"
          textAlign="center"
          bg="white"
        >
          <Heading
            size="md"
            color="red.500"
            mb={3}
          >
            Unable to load admin users
          </Heading>

          <Text
            color="gray.600"
            mb={5}
          >
            {error.message}
          </Text>

          <Button
            colorScheme="green"
            onClick={handleRefresh}
          >
            Try Again
          </Button>
        </Box>
      </Center>
    );
  }

  return (
    <Box
      width="100%"
      px={{
        base: 4,
        md: 6,
        xl: 8,
      }}
      py={6}
    >
      {/* Page header */}
      <Flex
        justify="space-between"
        align={{
          base: "flex-start",
          md: "center",
        }}
        direction={{
          base: "column",
          md: "row",
        }}
        gap={4}
        mb={8}
      >
        <Box>
          <Heading
            as="h1"
            fontSize={{
              base: "2xl",
              md: "3xl",
            }}
            fontWeight="600"
            color="gray.900"
          >
            Admin Users Management
          </Heading>

          <Text
            mt={1}
            color="gray.500"
            fontSize="md"
          >
            Manage admin accounts and
            permissions
          </Text>
        </Box>

        <Button
          leftIcon={<MdPersonAdd />}
          bg="#176B2C"
          color="white"
          borderRadius="lg"
          px={6}
          height="44px"
          fontWeight="500"
          onClick={onAddOpen}
          _hover={{
            bg: "#105823",
          }}
          _active={{
            bg: "#0C471C",
          }}
        >
          Add Admin User
        </Button>
      </Flex>

      {/* Main card */}
      <Box
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="2xl"
        overflow="hidden"
      >
        <Flex
          px={{
            base: 4,
            md: 7,
          }}
          pt={6}
          pb={5}
          justify="space-between"
          align={{
            base: "flex-start",
            md: "center",
          }}
          direction={{
            base: "column",
            md: "row",
          }}
          gap={4}
        >
          <Heading
            as="h2"
            fontSize="lg"
            fontWeight="600"
          >
            Admin Users
          </Heading>

          <Input
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value,
              )
            }
            placeholder="Search name, email or role"
            maxW={{
              base: "100%",
              md: "320px",
            }}
            borderRadius="lg"
          />
        </Flex>

        <TableContainer
          px={{
            base: 2,
            md: 7,
          }}
          pb={2}
        >
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th
                  color="gray.800"
                  textTransform="none"
                  fontSize="sm"
                  fontWeight="600"
                  pl={2}
                >
                  Name
                </Th>

                <Th
                  color="gray.800"
                  textTransform="none"
                  fontSize="sm"
                  fontWeight="600"
                >
                  Email
                </Th>

                <Th
                  color="gray.800"
                  textTransform="none"
                  fontSize="sm"
                  fontWeight="600"
                >
                  Role
                </Th>

                <Th
                  color="gray.800"
                  textTransform="none"
                  fontSize="sm"
                  fontWeight="600"
                >
                  Last Login
                </Th>

                <Th
                  color="gray.800"
                  textTransform="none"
                  fontSize="sm"
                  fontWeight="600"
                >
                  Status
                </Th>

                <Th
                  color="gray.800"
                  textTransform="none"
                  fontSize="sm"
                  fontWeight="600"
                  textAlign="right"
                  pr={2}
                >
                  Actions
                </Th>
              </Tr>
            </Thead>

            <Tbody>
              {paginatedAdmins.map(
                (admin) => {
                  const fullName =
                    getAdminFullName(admin);

                  const isSupportAgent =
                    admin.role ===
                    EnumUserRole.SupportAgent;

                  return (
                    <Tr
                      key={admin.id}
                      _hover={{
                        bg: "gray.50",
                      }}
                    >
                      <Td pl={2}>
                        <Text
                          fontWeight="500"
                          color="gray.900"
                          whiteSpace="nowrap"
                        >
                          {fullName}
                        </Text>
                      </Td>

                      <Td>
                        <Text color="gray.700">
                          {admin.email ?? "-"}
                        </Text>
                      </Td>

                      <Td>
                        <Text color="gray.800">
                          {getRoleLabel(
                            admin.role,
                          )}
                        </Text>
                      </Td>

                      <Td>
                        <Text
                          color="gray.700"
                          whiteSpace="nowrap"
                        >
                          {formatAdminDate(
                            admin.lastSeenAt,
                          )}
                        </Text>
                      </Td>

                      <Td>
                        <Badge
                          px={3}
                          py={1}
                          borderRadius="lg"
                          textTransform="lowercase"
                          fontSize="xs"
                          fontWeight="500"
                          colorScheme={
                            admin.confirmed
                              ? "green"
                              : "orange"
                          }
                        >
                          {admin.confirmed
                            ? "active"
                            : "inactive"}
                        </Badge>
                      </Td>

                      <Td pr={2}>
                        <Flex
                          justify="flex-end"
                          align="center"
                          gap={2}
                        >
                          {isSupportAgent && (
                            <Tooltip
                              label={
                                admin.confirmed
                                  ? "Assign support tickets"
                                  : "Activate this account before assigning tickets"
                              }
                            >
                              <Button
                                size="sm"
                                leftIcon={
                                  <MdAssignmentAdd />
                                }
                                colorScheme="green"
                                variant="outline"
                                onClick={() =>
                                  handleAssignClick(
                                    admin,
                                  )
                                }
                                isDisabled={
                                  !admin.confirmed
                                }
                              >
                                Assign
                              </Button>
                            </Tooltip>
                          )}

                          <Tooltip label="Edit admin user">
                            <IconButton
                              aria-label={`Edit ${fullName}`}
                              icon={<EditIcon />}
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleEditClick(
                                  admin,
                                )
                              }
                            />
                          </Tooltip>

                          <Tooltip label="Delete admin user">
                            <IconButton
                              aria-label={`Delete ${fullName}`}
                              icon={<DeleteIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() =>
                                handleDeleteClick(
                                  admin,
                                )
                              }
                            />
                          </Tooltip>
                        </Flex>
                      </Td>
                    </Tr>
                  );
                },
              )}

              {paginatedAdmins.length ===
                0 && (
                <Tr>
                  <Td
                    colSpan={6}
                    py={14}
                  >
                    <Center>
                      <Box textAlign="center">
                        <Heading
                          size="sm"
                          mb={2}
                        >
                          No admin users found
                        </Heading>

                        <Text color="gray.500">
                          {searchQuery
                            ? "No users match your search."
                            : "No administrator accounts are available."}
                        </Text>
                      </Box>
                    </Center>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>

        {/* Footer and pagination */}
        <Flex
          px={{
            base: 4,
            md: 7,
          }}
          py={5}
          borderTopWidth="1px"
          borderColor="gray.100"
          justify="space-between"
          align="center"
          direction={{
            base: "column",
            md: "row",
          }}
          gap={4}
        >
          <Text
            color="gray.500"
            fontSize="sm"
          >
            Showing {startResult}–
            {endResult} of{" "}
            {filteredAdmins.length} users
          </Text>

          <Flex align="center" gap={3}>
            <IconButton
              aria-label="Previous page"
              icon={<ChevronLeftIcon />}
              size="sm"
              variant="outline"
              isDisabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((page) =>
                  Math.max(page - 1, 1),
                )
              }
            />

            <Text
              minW="100px"
              textAlign="center"
              fontSize="sm"
              color="gray.700"
            >
              Page {currentPage} of{" "}
              {totalPages}
            </Text>

            <IconButton
              aria-label="Next page"
              icon={<ChevronRightIcon />}
              size="sm"
              variant="outline"
              isDisabled={
                currentPage === totalPages
              }
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(
                    page + 1,
                    totalPages,
                  ),
                )
              }
            />
          </Flex>
        </Flex>
      </Box>

      {/* Support ticket assignment */}
      <AssignSupportTicket
        isOpen={isAssignOpen}
        onClose={() => {
          onAssignClose();
          setSelectedAdminUser(null);
        }}
        onAssigned={handleRefresh}
        adminUser={selectedAdminUser}
      />

      {/* Add admin */}
      <AddAdminUserModal
        isOpen={isAddOpen}
        onClose={onAddClose}
        onUserAdded={handleUserAdded}
      />

      {/* Update admin */}
      <UpdateAdminUserModal
        isOpen={isUpdateOpen}
        onClose={() => {
          onUpdateClose();
          setSelectedAdminUser(null);
        }}
        adminUser={selectedAdminUser}
        onUserUpdated={
          handleUserUpdated
        }
      />

      {/* Delete admin */}
      <DeleteAdminUserModal
        isOpen={isDeleteOpen}
        onClose={() => {
          onDeleteClose();
          setSelectedAdminUser(null);
        }}
        adminUser={selectedAdminUser}
        onUserUpdated={
          handleUserUpdated
        }
      />
    </Box>
  );
};

export default AdminUserManagementPage;