import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  VStack,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import {
  Edit3,
  MapPin,
  Plus,
  RefreshCcw,
  Star,
  Trash2
} from 'lucide-react'
import {
  useMemo,
  useState
} from 'react'

import {
  gql,
  useMutation,
  useQuery
} from '@apollo/client'

type UserAddress = {
  id: string
  recipientName?: string | null
  phoneNumber?: string | null
  addressLine1: string
  addressLine2?: string | null
  city: string
  province: string
  postalCode: string
  country: string
  isDefault: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

type CreateUserAddressInput = {
  recipientName?: string | null
  phoneNumber?: string | null
  addressLine1: string
  addressLine2?: string | null
  city: string
  province: string
  postalCode: string
  country: string
  isDefault?: boolean | null
}

type UpdateUserAddressInput = {
  recipientName?: string | null
  phoneNumber?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  province?: string | null
  postalCode?: string | null
  country?: string | null
  isDefault?: boolean | null
}

type MyAddressesData = {
  myAddresses: UserAddress[]
}

type CreateUserAddressData = {
  createUserAddress: UserAddress
}

type CreateUserAddressVariables = {
  input: CreateUserAddressInput
}

type UpdateUserAddressData = {
  updateUserAddress: UserAddress
}

type UpdateUserAddressVariables = {
  id: string
  input: UpdateUserAddressInput
}

type DeleteUserAddressData = {
  deleteUserAddress: boolean
}

type DeleteUserAddressVariables = {
  id: string
}

type SetDefaultUserAddressData = {
  setDefaultUserAddress: UserAddress
}

type SetDefaultUserAddressVariables = {
  id: string
}

const USER_ADDRESS_FIELDS = gql`
  fragment UserAddressFields on UserAddress {
    id
    recipientName
    phoneNumber
    addressLine1
    addressLine2
    city
    province
    postalCode
    country
    isDefault
    createdAt
    updatedAt
  }
`

const MY_ADDRESSES_QUERY = gql`
  ${USER_ADDRESS_FIELDS}

  query MyAddresses {
    myAddresses {
      ...UserAddressFields
    }
  }
`

const CREATE_USER_ADDRESS_MUTATION = gql`
  ${USER_ADDRESS_FIELDS}

  mutation CreateUserAddress(
    $input: CreateUserAddressInput!
  ) {
    createUserAddress(
      input: $input
    ) {
      ...UserAddressFields
    }
  }
`

const UPDATE_USER_ADDRESS_MUTATION = gql`
  ${USER_ADDRESS_FIELDS}

  mutation UpdateUserAddress(
    $id: ID!
    $input: UpdateUserAddressInput!
  ) {
    updateUserAddress(
      id: $id
      input: $input
    ) {
      ...UserAddressFields
    }
  }
`

const DELETE_USER_ADDRESS_MUTATION = gql`
  mutation DeleteUserAddress(
    $id: ID!
  ) {
    deleteUserAddress(
      id: $id
    )
  }
`

const SET_DEFAULT_USER_ADDRESS_MUTATION = gql`
  ${USER_ADDRESS_FIELDS}

  mutation SetDefaultUserAddress(
    $id: ID!
  ) {
    setDefaultUserAddress(
      id: $id
    ) {
      ...UserAddressFields
    }
  }
`
import {
  EmptyState,
  SectionTitle
} from '../components/AccountShared'
import {
  BRAND_GREEN,
  LIGHT_GREEN,
  RED
} from '../constants'

type Address = UserAddress

type AddressFormState = {
  recipientName: string
  phoneNumber: string
  addressLine1: string
  addressLine2: string
  city: string
  province: string
  postalCode: string
  country: string
  isDefault: boolean
}

type AddressFormErrors =
  Partial<
    Record<
      keyof AddressFormState,
      string
    >
  >

const EMPTY_FORM: AddressFormState = {
  recipientName: '',
  phoneNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  province: '',
  postalCode: '',
  country: 'South Africa',
  isDefault: false
}

const SOUTH_AFRICAN_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape'
]

export function AddressesSection() {
  const toast =
    useToast()

  const modal =
    useDisclosure()

  const [
    editingAddress,
    setEditingAddress
  ] = useState<Address | null>(
    null
  )

  const [
    form,
    setForm
  ] =
    useState<AddressFormState>(
      EMPTY_FORM
    )

  const [
    formErrors,
    setFormErrors
  ] =
    useState<AddressFormErrors>(
      {}
    )

  const [
    deletingAddressId,
    setDeletingAddressId
  ] = useState<string | null>(
    null
  )

  const [
    defaultAddressId,
    setDefaultAddressId
  ] = useState<string | null>(
    null
  )

  const {
    data,
    loading,
    error,
    refetch,
    networkStatus
  } = useQuery<
    MyAddressesData
  >(
    MY_ADDRESSES_QUERY,
    {
      fetchPolicy:
        'cache-and-network',
      notifyOnNetworkStatusChange:
        true,
      errorPolicy:
        'all'
    }
  )

  const [
    createAddress,
    createState
  ] = useMutation<
    CreateUserAddressData,
    CreateUserAddressVariables
  >(
    CREATE_USER_ADDRESS_MUTATION
  )

  const [
    updateAddress,
    updateState
  ] = useMutation<
    UpdateUserAddressData,
    UpdateUserAddressVariables
  >(
    UPDATE_USER_ADDRESS_MUTATION
  )

  const [
    deleteAddress
  ] = useMutation<
    DeleteUserAddressData,
    DeleteUserAddressVariables
  >(
    DELETE_USER_ADDRESS_MUTATION
  )

  const [
    setDefaultAddress
  ] = useMutation<
    SetDefaultUserAddressData,
    SetDefaultUserAddressVariables
  >(
    SET_DEFAULT_USER_ADDRESS_MUTATION
  )

  const addresses =
    useMemo(
      () =>
        data?.myAddresses ??
        [],
      [
        data?.myAddresses
      ]
    )

  const isRefreshing =
    networkStatus === 4

  const isSaving =
    createState.loading ||
    updateState.loading

  const openCreateModal =
    (): void => {
      setEditingAddress(
        null
      )

      setForm({
        ...EMPTY_FORM,
        isDefault:
          addresses.length === 0
      })

      setFormErrors(
        {}
      )

      modal.onOpen()
    }

  const openEditModal =
    (
      address: Address
    ): void => {
      setEditingAddress(
        address
      )

      setForm({
        recipientName:
          address.recipientName ??
          '',
        phoneNumber:
          address.phoneNumber ??
          '',
        addressLine1:
          address.addressLine1,
        addressLine2:
          address.addressLine2 ??
          '',
        city:
          address.city,
        province:
          address.province,
        postalCode:
          address.postalCode,
        country:
          address.country,
        isDefault:
          address.isDefault
      })

      setFormErrors(
        {}
      )

      modal.onOpen()
    }

  const updateForm =
    <K extends keyof AddressFormState>(
      field: K,
      value: AddressFormState[K]
    ): void => {
      setForm(
        current => ({
          ...current,
          [field]: value
        })
      )

      setFormErrors(
        current => ({
          ...current,
          [field]: undefined
        })
      )
    }

  const validateForm =
    (): boolean => {
      const errors:
        AddressFormErrors =
        {}

      if (
        !form.addressLine1.trim()
      ) {
        errors.addressLine1 =
          'Address line 1 is required.'
      }

      if (
        !form.city.trim()
      ) {
        errors.city =
          'City is required.'
      }

      if (
        !form.province.trim()
      ) {
        errors.province =
          'Province is required.'
      }

      if (
        !/^\d{4}$/.test(
          form.postalCode.trim()
        )
      ) {
        errors.postalCode =
          'Postal code must contain exactly 4 digits.'
      }

      if (
        form.phoneNumber.trim() &&
        !/^[+0-9\s()-]{7,20}$/.test(
          form.phoneNumber.trim()
        )
      ) {
        errors.phoneNumber =
          'Enter a valid phone number.'
      }

      setFormErrors(
        errors
      )

      return (
        Object.keys(errors)
          .length === 0
      )
    }

  const handleSave =
    async (): Promise<void> => {
      if (!validateForm()) {
        return
      }

      try {
        if (editingAddress) {
          const input:
            UpdateUserAddressInput =
            {
              recipientName:
                form.recipientName.trim() ||
                null,
              phoneNumber:
                form.phoneNumber.trim() ||
                null,
              addressLine1:
                form.addressLine1.trim(),
              addressLine2:
                form.addressLine2.trim() ||
                null,
              city:
                form.city.trim(),
              province:
                form.province,
              postalCode:
                form.postalCode.trim(),
              country:
                form.country.trim(),
              isDefault:
                form.isDefault
            }

          await updateAddress({
            variables: {
              id:
                editingAddress.id,
              input
            }
          })

          toast({
            title:
              'Address updated',
            description:
              'Your saved address was updated successfully.',
            status:
              'success',
            duration:
              3000,
            isClosable:
              true,
            position:
              'top-right'
          })
        } else {
          const input:
            CreateUserAddressInput =
            {
              recipientName:
                form.recipientName.trim() ||
                null,
              phoneNumber:
                form.phoneNumber.trim() ||
                null,
              addressLine1:
                form.addressLine1.trim(),
              addressLine2:
                form.addressLine2.trim() ||
                null,
              city:
                form.city.trim(),
              province:
                form.province,
              postalCode:
                form.postalCode.trim(),
              country:
                form.country.trim(),
              isDefault:
                form.isDefault
            }

          await createAddress({
            variables: {
              input
            }
          })

          toast({
            title:
              'Address saved',
            description:
              'Your new address was added successfully.',
            status:
              'success',
            duration:
              3000,
            isClosable:
              true,
            position:
              'top-right'
          })
        }

        await refetch()

        modal.onClose()

        setEditingAddress(
          null
        )

        setForm(
          EMPTY_FORM
        )
      } catch (
        saveError
      ) {
        toast({
          title:
            editingAddress
              ? 'Unable to update address'
              : 'Unable to save address',
          description:
            saveError instanceof
            Error
              ? saveError.message
              : 'Please try again.',
          status:
            'error',
          duration:
            5000,
          isClosable:
            true,
          position:
            'top-right'
        })
      }
    }

  const handleDelete =
    async (
      address: Address
    ): Promise<void> => {
      const confirmed =
        window.confirm(
          `Delete the address in ${address.city}?`
        )

      if (!confirmed) {
        return
      }

      setDeletingAddressId(
        address.id
      )

      try {
        const result =
          await deleteAddress({
            variables: {
              id:
                address.id
            }
          })

        if (
          !result.data
            ?.deleteUserAddress
        ) {
          throw new Error(
            'The address could not be deleted.'
          )
        }

        await refetch()

        toast({
          title:
            'Address deleted',
          description:
            'The saved address was removed.',
          status:
            'success',
          duration:
            3000,
          isClosable:
            true,
          position:
            'top-right'
        })
      } catch (
        deleteError
      ) {
        toast({
          title:
            'Unable to delete address',
          description:
            deleteError instanceof
            Error
              ? deleteError.message
              : 'Please try again.',
          status:
            'error',
          duration:
            5000,
          isClosable:
            true,
          position:
            'top-right'
        })
      } finally {
        setDeletingAddressId(
          null
        )
      }
    }

  const handleSetDefault =
    async (
      address: Address
    ): Promise<void> => {
      if (address.isDefault) {
        return
      }

      setDefaultAddressId(
        address.id
      )

      try {
        await setDefaultAddress({
          variables: {
            id:
              address.id
          }
        })

        await refetch()

        toast({
          title:
            'Default address updated',
          description:
            'This address will be selected automatically during checkout.',
          status:
            'success',
          duration:
            3000,
          isClosable:
            true,
          position:
            'top-right'
        })
      } catch (
        defaultError
      ) {
        toast({
          title:
            'Unable to update default address',
          description:
            defaultError instanceof
            Error
              ? defaultError.message
              : 'Please try again.',
          status:
            'error',
          duration:
            5000,
          isClosable:
            true,
          position:
            'top-right'
        })
      } finally {
        setDefaultAddressId(
          null
        )
      }
    }

  if (
    loading &&
    addresses.length === 0
  ) {
    return (
      <AddressesLoadingState />
    )
  }

  return (
    <Box>
      <HStack
        justify="space-between"
        align={{
          base:
            'flex-start',
          md:
            'center'
        }}
        flexDirection={{
          base:
            'column',
          md:
            'row'
        }}
        spacing={4}
        mb={6}
      >
        <Box>
          <SectionTitle>
            Saved Addresses
          </SectionTitle>

          <Text
            mt="-14px"
            color="#65745f"
            fontSize="14px"
          >
            Manage the delivery
            addresses linked to your
            account.
          </Text>
        </Box>

        <HStack>
          <Button
            leftIcon={
              <RefreshCcw
                size={17}
              />
            }
            variant="outline"
            color={BRAND_GREEN}
            borderColor={
              BRAND_GREEN
            }
            borderRadius="full"
            isLoading={
              isRefreshing
            }
            loadingText="Refreshing"
            onClick={() => {
              void refetch()
            }}
          >
            Refresh
          </Button>

          <Button
            leftIcon={
              <Plus
                size={18}
              />
            }
            bg={BRAND_GREEN}
            color="white"
            borderRadius="full"
            onClick={
              openCreateModal
            }
            _hover={{
              bg:
                '#102f17'
            }}
          >
            Add Address
          </Button>
        </HStack>
      </HStack>

      {error ? (
        <Alert
          status="warning"
          mb={5}
          borderRadius="12px"
        >
          <AlertIcon />

          <Box>
            <AlertTitle>
              Addresses may be out
              of date
            </AlertTitle>

            <AlertDescription>
              {error.message}
            </AlertDescription>
          </Box>
        </Alert>
      ) : null}

      {addresses.length ===
      0 ? (
        <EmptyState
          title="No saved addresses"
          message="Add an address to make checkout faster."
        />
      ) : (
        <SimpleGrid
          columns={{
            base:
              1,
            md:
              2
          }}
          spacing={5}
        >
          {addresses.map(
            address => {
              const isDeleting =
                deletingAddressId ===
                address.id

              const isSettingDefault =
                defaultAddressId ===
                address.id

              return (
                <Box
                  key={
                    address.id
                  }
                  position="relative"
                  bg="white"
                  border="1px solid"
                  borderColor={
                    address.isDefault
                      ? '#b9d4af'
                      : '#e1e8dc'
                  }
                  borderRadius="18px"
                  boxShadow="0 8px 24px rgba(0,0,0,0.06)"
                  p="24px"
                  opacity={
                    isDeleting
                      ? 0.6
                      : 1
                  }
                >
                  <HStack
                    justify="space-between"
                    align="flex-start"
                    mb="22px"
                  >
                    <HStack>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        width="38px"
                        height="38px"
                        bg="#f0f5eb"
                        color={BRAND_GREEN}
                        borderRadius="full"
                      >
                        <MapPin
                          size={19}
                        />
                      </Box>

                      {address.isDefault ? (
                        <Badge
                          bg={LIGHT_GREEN}
                          color={
                            BRAND_GREEN
                          }
                          borderRadius="999px"
                          textTransform="none"
                          px={3}
                          py={1}
                        >
                          Default
                        </Badge>
                      ) : null}
                    </HStack>

                    <HStack>
                      {!address.isDefault ? (
                        <IconButton
                          aria-label="Set as default"
                          title="Set as default"
                          icon={
                            <Star
                              size={17}
                            />
                          }
                          variant="ghost"
                          color={BRAND_GREEN}
                          borderRadius="full"
                          isLoading={
                            isSettingDefault
                          }
                          isDisabled={
                            isDeleting
                          }
                          onClick={() => {
                            void handleSetDefault(
                              address
                            )
                          }}
                        />
                      ) : null}

                      <IconButton
                        aria-label="Edit address"
                        title="Edit address"
                        icon={
                          <Edit3
                            size={17}
                          />
                        }
                        variant="ghost"
                        color={BRAND_GREEN}
                        borderRadius="full"
                        isDisabled={
                          isDeleting
                        }
                        onClick={() => {
                          openEditModal(
                            address
                          )
                        }}
                      />

                      <IconButton
                        aria-label="Delete address"
                        title="Delete address"
                        icon={
                          <Trash2
                            size={17}
                          />
                        }
                        variant="ghost"
                        color={RED}
                        borderRadius="full"
                        isLoading={
                          isDeleting
                        }
                        isDisabled={
                          isSettingDefault
                        }
                        onClick={() => {
                          void handleDelete(
                            address
                          )
                        }}
                      />
                    </HStack>
                  </HStack>

                  <Text
                    color={BRAND_GREEN}
                    fontSize="18px"
                    fontWeight="800"
                    mb="10px"
                  >
                    {address.recipientName ||
                      'Delivery Address'}
                  </Text>

                  {address.phoneNumber ? (
                    <Text
                      color="#53664b"
                      fontSize="14px"
                      mb={2}
                    >
                      {
                        address.phoneNumber
                      }
                    </Text>
                  ) : null}

                  <Text
                    color="#53664b"
                    fontSize="15px"
                    lineHeight="1.7"
                  >
                    {
                      address.addressLine1
                    }

                    {address.addressLine2 ? (
                      <>
                        <br />

                        {
                          address.addressLine2
                        }
                      </>
                    ) : null}

                    <br />

                    {address.city},{' '}
                    {address.province}{' '}
                    {
                      address.postalCode
                    }

                    <br />

                    {address.country}
                  </Text>
                </Box>
              )
            }
          )}
        </SimpleGrid>
      )}

      <AddressModal
        isOpen={
          modal.isOpen
        }
        isEditing={
          editingAddress !==
          null
        }
        form={
          form
        }
        errors={
          formErrors
        }
        isSaving={
          isSaving
        }
        onChange={
          updateForm
        }
        onClose={() => {
          if (isSaving) {
            return
          }

          modal.onClose()

          setEditingAddress(
            null
          )

          setForm(
            EMPTY_FORM
          )

          setFormErrors(
            {}
          )
        }}
        onSave={() => {
          void handleSave()
        }}
      />
    </Box>
  )
}

function AddressModal({
  isOpen,
  isEditing,
  form,
  errors,
  isSaving,
  onChange,
  onClose,
  onSave
}: {
  isOpen: boolean
  isEditing: boolean
  form: AddressFormState
  errors: AddressFormErrors
  isSaving: boolean
  onChange:
    <K extends keyof AddressFormState>(
      field: K,
      value: AddressFormState[K]
    ) => void
  onClose: () => void
  onSave: () => void
}) {
  return (
    <Modal
      isOpen={
        isOpen
      }
      onClose={
        onClose
      }
      size="xl"
      isCentered
      closeOnOverlayClick={
        !isSaving
      }
    >
      <ModalOverlay />

      <ModalContent
        borderRadius="18px"
      >
        <ModalHeader
          color={BRAND_GREEN}
        >
          {isEditing
            ? 'Edit Address'
            : 'Add Address'}
        </ModalHeader>

        <ModalCloseButton
          isDisabled={
            isSaving
          }
        />

        <ModalBody>
          <VStack
            spacing={4}
            align="stretch"
          >
            <SimpleGrid
              columns={{
                base:
                  1,
                md:
                  2
              }}
              spacing={4}
            >
              <FormControl>
                <FormLabel>
                  Recipient name
                </FormLabel>

                <Input
                  value={
                    form.recipientName
                  }
                  placeholder="Full name"
                  onChange={
                    event => {
                      onChange(
                        'recipientName',
                        event.target.value
                      )
                    }
                  }
                />
              </FormControl>

              <FormControl
                isInvalid={
                  Boolean(
                    errors.phoneNumber
                  )
                }
              >
                <FormLabel>
                  Phone number
                </FormLabel>

                <Input
                  value={
                    form.phoneNumber
                  }
                  placeholder="e.g. 082 123 4567"
                  onChange={
                    event => {
                      onChange(
                        'phoneNumber',
                        event.target.value
                      )
                    }
                  }
                />

                <FormErrorMessage>
                  {
                    errors.phoneNumber
                  }
                </FormErrorMessage>
              </FormControl>
            </SimpleGrid>

            <FormControl
              isRequired
              isInvalid={
                Boolean(
                  errors.addressLine1
                )
              }
            >
              <FormLabel>
                Address line 1
              </FormLabel>

              <Input
                value={
                  form.addressLine1
                }
                placeholder="Street address"
                onChange={
                  event => {
                    onChange(
                      'addressLine1',
                      event.target.value
                    )
                  }
                }
              />

              <FormErrorMessage>
                {
                  errors.addressLine1
                }
              </FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>
                Address line 2
              </FormLabel>

              <Input
                value={
                  form.addressLine2
                }
                placeholder="Apartment, unit or building"
                onChange={
                  event => {
                    onChange(
                      'addressLine2',
                      event.target.value
                    )
                  }
                }
              />
            </FormControl>

            <SimpleGrid
              columns={{
                base:
                  1,
                md:
                  2
              }}
              spacing={4}
            >
              <FormControl
                isRequired
                isInvalid={
                  Boolean(
                    errors.city
                  )
                }
              >
                <FormLabel>
                  City
                </FormLabel>

                <Input
                  value={
                    form.city
                  }
                  onChange={
                    event => {
                      onChange(
                        'city',
                        event.target.value
                      )
                    }
                  }
                />

                <FormErrorMessage>
                  {errors.city}
                </FormErrorMessage>
              </FormControl>

              <FormControl
                isRequired
                isInvalid={
                  Boolean(
                    errors.province
                  )
                }
              >
                <FormLabel>
                  Province
                </FormLabel>

                <Select
                  value={
                    form.province
                  }
                  placeholder="Select province"
                  onChange={
                    event => {
                      onChange(
                        'province',
                        event.target.value
                      )
                    }
                  }
                >
                  {SOUTH_AFRICAN_PROVINCES.map(
                    province => (
                      <option
                        key={
                          province
                        }
                        value={
                          province
                        }
                      >
                        {
                          province
                        }
                      </option>
                    )
                  )}
                </Select>

                <FormErrorMessage>
                  {
                    errors.province
                  }
                </FormErrorMessage>
              </FormControl>
            </SimpleGrid>

            <SimpleGrid
              columns={{
                base:
                  1,
                md:
                  2
              }}
              spacing={4}
            >
              <FormControl
                isRequired
                isInvalid={
                  Boolean(
                    errors.postalCode
                  )
                }
              >
                <FormLabel>
                  Postal code
                </FormLabel>

                <Input
                  value={
                    form.postalCode
                  }
                  inputMode="numeric"
                  maxLength={4}
                  onChange={
                    event => {
                      const value =
                        event.target.value
                          .replace(
                            /\D/g,
                            ''
                          )
                          .slice(
                            0,
                            4
                          )

                      onChange(
                        'postalCode',
                        value
                      )
                    }
                  }
                />

                <FormErrorMessage>
                  {
                    errors.postalCode
                  }
                </FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>
                  Country
                </FormLabel>

                <Input
                  value={
                    form.country
                  }
                  onChange={
                    event => {
                      onChange(
                        'country',
                        event.target.value
                      )
                    }
                  }
                />
              </FormControl>
            </SimpleGrid>

            <Checkbox
              colorScheme="green"
              isChecked={
                form.isDefault
              }
              onChange={
                event => {
                  onChange(
                    'isDefault',
                    event.target.checked
                  )
                }
              }
            >
              Set as my default
              delivery address
            </Checkbox>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Stack
            direction={{
              base:
                'column-reverse',
              sm:
                'row'
            }}
            width={{
              base:
                '100%',
              sm:
                'auto'
            }}
            spacing={3}
          >
            <Button
              variant="ghost"
              isDisabled={
                isSaving
              }
              onClick={
                onClose
              }
            >
              Cancel
            </Button>

            <Button
              bg={BRAND_GREEN}
              color="white"
              borderRadius="full"
              isLoading={
                isSaving
              }
              loadingText={
                isEditing
                  ? 'Updating'
                  : 'Saving'
              }
              onClick={
                onSave
              }
              _hover={{
                bg:
                  '#102f17'
              }}
            >
              {isEditing
                ? 'Update Address'
                : 'Save Address'}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

function AddressesLoadingState() {
  return (
    <Box>
      <Skeleton
        height="32px"
        width="220px"
        mb={6}
      />

      <SimpleGrid
        columns={{
          base:
            1,
          md:
            2
        }}
        spacing={5}
      >
        {[1, 2].map(
          item => (
            <Skeleton
              key={item}
              height="240px"
              borderRadius="18px"
            />
          )
        )}
      </SimpleGrid>
    </Box>
  )
}

export default AddressesSection