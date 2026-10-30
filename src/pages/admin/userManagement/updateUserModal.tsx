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
    useToast
  } from '@chakra-ui/react'
  import React, { useEffect, useState } from 'react'
  import { useAuthContext } from '../../../context'
  import {
    type AdminUser,
    EnumUserRole,
    useUpdateAdminUserMutation
  } from '../../../generated/graphql'
  
  interface UpdateAdminUserModalProps {
    isOpen: boolean
    onClose: () => void
    adminUser: AdminUser | null // Allow adminUser to be null
    onUserUpdated: () => void
  }
  
  const UpdateAdminUserModal: React.FC<UpdateAdminUserModalProps> = ({
    isOpen,
    onClose,
    adminUser,
    onUserUpdated
  }) => {
    const { user: currentUser } = useAuthContext()
    const [firstName, setFirstName] = useState<string>('')
    const [lastName, setLastName] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [role, setRole] = useState<EnumUserRole>(EnumUserRole.SupportAgent)
    const toast = useToast()
    const [updateAdminUser, { loading }] = useUpdateAdminUserMutation()
  
    useEffect(() => {
      if (adminUser) {
        setFirstName(adminUser.firstName || '')
        setLastName(adminUser.lastName || '')
        setEmail(adminUser.email || '')
        setRole(adminUser.role || EnumUserRole.SupportAgent)
      }
    }, [adminUser])
  
    const handleUpdateAdminUser = async () => {
      if (!adminUser) return
  
      try {
        const { data } = await updateAdminUser({
          variables: {
            id: adminUser.id,
            data: {
              firstName,
              lastName,
              email,
              role
            }
          }
        })
        if (data?.updateAdminUser) {
          toast({
            title: 'Admin user updated.',
            description: 'The admin user has been successfully updated.',
            status: 'success',
            duration: 9000,
            isClosable: true
          })
          onUserUpdated()
          onClose()
        }
      } catch (error) {
        toast({
          title: 'Error.',
          description: (error as Error).message,
          status: 'error',
          duration: 9000,
          isClosable: true
        })
      }
    }
  
    const isSuperAdmin =
      currentUser && (currentUser as AdminUser)?.role === EnumUserRole.SuperAdmin
    const canEditEmail =
      currentUser &&
      (isSuperAdmin ||
        ((currentUser as AdminUser)?.role === EnumUserRole.Admin &&
          adminUser?.role !== EnumUserRole.Admin))
    const canEditRole = currentUser && isSuperAdmin
  
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay backdropFilter="blur(4px)"/>
        <ModalContent>
          <ModalHeader>Update  User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {adminUser ? (
              <>
                <FormControl id="first-name" isRequired>
                  <FormLabel>First Name</FormLabel>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </FormControl>
                <FormControl id="last-name" isRequired>
                  <FormLabel>Last Name</FormLabel>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </FormControl>
                <FormControl id="email" isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    isDisabled={!canEditEmail}
                  />
                </FormControl>
                <FormControl id="role" isRequired>
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={role}
                    onChange={(e) => setRole(e.target.value as EnumUserRole)}
                    isDisabled={!canEditRole}
                  >
                   
                    <option value={EnumUserRole.SuperAdmin}>Super Admin</option>
                    <option value={EnumUserRole.SupportAgent}>Support</option>
                  </Select>
                </FormControl>
              </>
            ) : (
              <p>No user selected</p> // Add fallback UI when no user is selected
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              bg="rgba(3, 101, 50, 1)"
              onClick={handleUpdateAdminUser}
              isLoading={loading}
              isDisabled={!adminUser}
            >
              Update User
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  }
  
  export default UpdateAdminUserModal
  