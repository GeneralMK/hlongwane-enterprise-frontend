import {
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    useToast
  } from '@chakra-ui/react'
  import React from 'react'
  import { type AdminUser, useRemoveAdminUserMutation } from '../../../generated/graphql'
  
  interface DeleteAdminUserModalProps {
    isOpen: boolean
    onClose: () => void
    adminUser: AdminUser | null
    onUserUpdated: () => void
  }
  
  const DeleteAdminUserModal: React.FC<DeleteAdminUserModalProps> = ({
    isOpen,
    onClose,
    adminUser,
    onUserUpdated
  }) => {
    const toast = useToast()
    const [removeAdminUserMutation, { loading }] = useRemoveAdminUserMutation()
  
    const handleDeleteAdminUser = async () => {
      if (!adminUser || !adminUser.id) {
        toast({
          title: 'Invalid Admin User',
          description: 'The selected admin user does not exist or is missing an ID.',
          status: 'warning',
          duration: 5000,
          isClosable: true
        })
        return
      }
  
      try {
        const { data } = await removeAdminUserMutation({
          variables: {
            input: {
              adminUserId: parseInt(adminUser.id)
            }
          }
        })
  
        if (data?.removeAdminUser) {
          toast({
            title: 'Admin User Removed',
            description: `The admin user ${adminUser.firstName} ${adminUser.lastName} has been successfully removed.`,
            status: 'success',
            duration: 5000,
            isClosable: true
          })
          onUserUpdated()
          onClose()
        } else {
          toast({
            title: 'Admin User Removal Failed',
            description: 'Failed to remove the admin user. Please try again later.',
            status: 'error',
            duration: 5000,
            isClosable: true
          })
        }
      } catch (error) {
        toast({
          title: 'Error Occurred',
          description: `An error occurred while trying to remove the admin user: ${
            (error as Error).message
          }`,
          status: 'error',
          duration: 5000,
          isClosable: true
        })
      }
    }
  
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay backdropFilter="blur(4px)"/>
        <ModalContent>
          <ModalHeader>Confirm Admin User Deletion</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {adminUser && (
              <>
                <Text>
                  Are you sure you want to delete{' '}
                  <strong>
                    {adminUser.firstName} {adminUser.lastName}
                  </strong>
                  ? This action is irreversible and will permanently remove their access.
                </Text>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeleteAdminUser}
              isLoading={loading}
              isDisabled={!adminUser}
            >
              Confirm Deletion
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  }
  
  export default DeleteAdminUserModal
  