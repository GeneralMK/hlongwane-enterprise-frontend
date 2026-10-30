import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Center,
  Checkbox,
  Flex,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";

import {
  type AdminUser,
  useAdminSupportTicketsQuery,
  useAssignSupportTicketMutation,
} from "../../../generated/graphql";

interface AssignSupportTicketProps {
  isOpen: boolean;
  onClose: () => void;
  adminUser: AdminUser | null;
  onAssigned?: () => void;
}

const ROWS_PER_PAGE = 5;

const formatValue = (value?: string | null) => {
  if (!value) return "-";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const AssignSupportTicket: React.FC<AssignSupportTicketProps> = ({
  isOpen,
  onClose,
  adminUser,
  onAssigned,
}) => {
  const toast = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);

  const {
    data,
    loading,
    error,
    refetch,
  } = useAdminSupportTicketsQuery({
    variables: {
      input: {
        page: 1,
        limit: 100,
      },
    },
    skip: !isOpen,
    fetchPolicy: "network-only",
  });

  const [
    assignSupportTicket,
    { loading: assigning },
  ] = useAssignSupportTicketMutation();

  const tickets = useMemo(
    () => data?.adminSupportTickets?.tickets ?? [],
    [data?.adminSupportTickets?.tickets]
  );

  /**
   * Only show tickets that:
   * 1. Are not already assigned
   * 2. Are not closed
   */
  const availableTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket &&
          !ticket.assignedToAdminUser &&
          ticket.status !== "CLOSED"
      ),
    [tickets]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(availableTickets.length / ROWS_PER_PAGE)
  );

  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const endIndex = startIndex + ROWS_PER_PAGE;

    return availableTickets.slice(startIndex, endIndex);
  }, [availableTickets, currentPage]);

  const currentPageTicketIds = useMemo(
    () => paginatedTickets.map((ticket) => String(ticket.id)),
    [paginatedTickets]
  );

  const allCurrentPageSelected =
    currentPageTicketIds.length > 0 &&
    currentPageTicketIds.every((ticketId) =>
      selectedTicketIds.includes(ticketId)
    );

  const someCurrentPageSelected =
    currentPageTicketIds.some((ticketId) =>
      selectedTicketIds.includes(ticketId)
    ) && !allCurrentPageSelected;

  useEffect(() => {
    if (!isOpen) {
      setSelectedTicketIds([]);
      setCurrentPage(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleTicketToggle = (ticketId: string) => {
    setSelectedTicketIds((currentIds) =>
      currentIds.includes(ticketId)
        ? currentIds.filter((id) => id !== ticketId)
        : [...currentIds, ticketId]
    );
  };

  const handleSelectAllCurrentPage = () => {
    setSelectedTicketIds((currentIds) => {
      if (allCurrentPageSelected) {
        return currentIds.filter(
          (id) => !currentPageTicketIds.includes(id)
        );
      }

      return Array.from(
        new Set([...currentIds, ...currentPageTicketIds])
      );
    });
  };

  const handleSubmit = async () => {
    if (!adminUser?.id) {
      toast({
        title: "Support agent required",
        description: "Select a support agent before assigning tickets.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });

      return;
    }

    if (selectedTicketIds.length === 0) {
      toast({
        title: "No tickets selected",
        description: "Select at least one support ticket.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });

      return;
    }

    try {
      /*
       * The GraphQL mutation assigns one ticket at a time.
       *
       * Adjust assignedToAdminUserId only if your
       * AssignSupportTicketInput uses a different field name.
       */
      await Promise.all(
        selectedTicketIds.map((ticketId) =>
          assignSupportTicket({
            variables: {
              id: ticketId,
              input: {
                assignedToAdminUserId: Number(adminUser.id),
              },
            },
          })
        )
      );

      toast({
        title: "Tickets assigned",
        description: `${selectedTicketIds.length} ticket${
          selectedTicketIds.length === 1 ? "" : "s"
        } successfully assigned.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      setSelectedTicketIds([]);

      await refetch();

      onAssigned?.();
      onClose();
    } catch (assignmentError) {
      const description =
        assignmentError instanceof Error
          ? assignmentError.message
          : "Failed to assign the selected tickets.";

      toast({
        title: "Assignment failed",
        description,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const supportAgentName = adminUser
    ? `${adminUser.firstName ?? ""} ${
        adminUser.lastName ?? ""
      }`.trim() || adminUser.email
    : "the selected support agent";

  return (
    <Modal
      isOpen={isOpen}
      onClose={assigning ? () => undefined : onClose}
      size="6xl"
      isCentered
      scrollBehavior="inside"
    >
      <ModalOverlay backdropFilter="blur(4px)" />

      <ModalContent maxW="90vw">
        <ModalHeader textAlign="center" fontSize="20px">
          Assign Support Tickets
        </ModalHeader>

        <ModalCloseButton isDisabled={assigning} />

        <ModalBody pb={8}>
          <Text mb={5} color="gray.600">
            Assign support tickets to{" "}
            <Text as="span" fontWeight="bold" color="gray.800">
              {supportAgentName}
            </Text>
            .
          </Text>

          <Box
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            bg="white"
            boxShadow="sm"
          >
            {loading ? (
              <Center minH="300px">
                <Flex direction="column" align="center" gap={3}>
                  <Spinner size="lg" />

                  <Text color="gray.500">
                    Loading support tickets...
                  </Text>
                </Flex>
              </Center>
            ) : error ? (
              <Center minH="300px">
                <Flex direction="column" align="center" gap={4}>
                  <Text color="red.500">
                    Failed to load support tickets.
                  </Text>

                  <Button
                    size="sm"
                    onClick={() => refetch()}
                  >
                    Try Again
                  </Button>
                </Flex>
              </Center>
            ) : availableTickets.length === 0 ? (
              <Center minH="300px">
                <Text color="gray.500">
                  There are no unassigned support tickets.
                </Text>
              </Center>
            ) : (
              <>
                <TableContainer>
                  <Table variant="simple">
                    <Thead bg="#002B60">
                      <Tr>
                        <Th width="60px">
                          <Checkbox
                            colorScheme="green"
                            isChecked={allCurrentPageSelected}
                            isIndeterminate={someCurrentPageSelected}
                            onChange={handleSelectAllCurrentPage}
                          />
                        </Th>

                        <Th color="white">Subject</Th>
                        <Th color="white">Customer</Th>
                        <Th color="white">Category</Th>
                        <Th color="white">Priority</Th>
                        <Th color="white">Status</Th>
                        <Th color="white">Created</Th>
                      </Tr>
                    </Thead>

                    <Tbody>
                      {paginatedTickets.map((ticket) => {
                        const ticketId = String(ticket.id);
                        const customerName =
                          ticket.user?.fullName ||
                          `${ticket.user?.firstName ?? ""} ${
                            ticket.user?.lastName ?? ""
                          }`.trim() ||
                          "-";

                        return (
                          <Tr
                            key={ticket.id}
                            cursor="pointer"
                            _hover={{ bg: "gray.50" }}
                            onClick={() =>
                              handleTicketToggle(ticketId)
                            }
                          >
                            <Td>
                              <Checkbox
                                colorScheme="green"
                                isChecked={selectedTicketIds.includes(
                                  ticketId
                                )}
                                onChange={() =>
                                  handleTicketToggle(ticketId)
                                }
                                onClick={(event) =>
                                  event.stopPropagation()
                                }
                              />
                            </Td>

                            <Td>
                              <Text
                                fontWeight="semibold"
                                maxW="250px"
                                noOfLines={1}
                              >
                                {ticket.subject}
                              </Text>

                              <Text
                                fontSize="sm"
                                color="gray.500"
                                maxW="250px"
                                noOfLines={2}
                              >
                                {ticket.message}
                              </Text>
                            </Td>

                            <Td>
                              <Text fontWeight="medium">
                                {customerName}
                              </Text>

                              <Text
                                fontSize="sm"
                                color="gray.500"
                              >
                                {ticket.user?.email ?? "-"}
                              </Text>
                            </Td>

                            <Td>
                              {formatValue(ticket.category)}
                            </Td>

                            <Td>
                              {formatValue(ticket.priority)}
                            </Td>

                            <Td>
                              {formatValue(ticket.status)}
                            </Td>

                            <Td whiteSpace="nowrap">
                              {ticket.createdAt
                                ? new Date(
                                    ticket.createdAt
                                  ).toLocaleDateString("en-ZA", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "-"}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>

                <Flex
                  px={5}
                  py={4}
                  align="center"
                  justify="space-between"
                  gap={4}
                  borderTopWidth="1px"
                  flexWrap="wrap"
                >
                  <Text fontSize="sm" color="gray.600">
                    {selectedTicketIds.length} ticket
                    {selectedTicketIds.length === 1 ? "" : "s"} selected
                  </Text>

                  <Flex align="center" gap={4}>
                    <IconButton
                      aria-label="Previous page"
                      icon={<ChevronLeftIcon />}
                      size="sm"
                      isDisabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.max(page - 1, 1)
                        )
                      }
                    />

                    <Text fontSize="sm">
                      Page {currentPage} of {totalPages}
                    </Text>

                    <IconButton
                      aria-label="Next page"
                      icon={<ChevronRightIcon />}
                      size="sm"
                      isDisabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(page + 1, totalPages)
                        )
                      }
                    />
                  </Flex>
                </Flex>
              </>
            )}
          </Box>

          <Flex mt={6} justify="flex-end" gap={3}>
            <Button
              variant="outline"
              onClick={onClose}
              isDisabled={assigning}
            >
              Cancel
            </Button>

            <Button
              bg="rgba(3, 101, 50, 1)"
              color="white"
              _hover={{ bg: "green.700" }}
              onClick={handleSubmit}
              isLoading={assigning}
              loadingText="Assigning"
              isDisabled={
                selectedTicketIds.length === 0 ||
                !adminUser
              }
            >
              Assign Selected
            </Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AssignSupportTicket;