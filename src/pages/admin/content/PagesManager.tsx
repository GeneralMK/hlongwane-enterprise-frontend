import {
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertIcon,
  Badge,
  Box,
  Button,
  HStack,
  IconButton,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import {
  Edit2,
  Eye,
  Plus,
  RefreshCcw,
  Trash2
} from 'lucide-react'
import {
  useMemo,
  useRef,
  useState
} from 'react'
import { useNavigate } from 'react-router-dom'

import {
  gql,
  useMutation,
  useQuery
} from '@apollo/client'

enum EnumContentStatus {
  Draft = 'DRAFT',
  Published = 'PUBLISHED',
  Archived = 'ARCHIVED'
}

type WebsitePageSection = {
  id: string
}

type WebsitePage = {
  id: string
  name: string
  slug: string
  metaTitle?: string | null
  status: EnumContentStatus
  updatedAt: string
  sections: WebsitePageSection[]
}

type WebsitePagesData = {
  websitePages: WebsitePage[]
}

type DeleteWebsitePageData = {
  deleteWebsitePage: boolean
}

type DeleteWebsitePageVariables = {
  id: string
}

const WEBSITE_PAGES_QUERY = gql`
  query WebsitePages {
    websitePages {
      id
      name
      slug
      metaTitle
      status
      updatedAt

      sections {
        id
      }
    }
  }
`

const DELETE_WEBSITE_PAGE_MUTATION = gql`
  mutation DeleteWebsitePage(
    $id: ID!
  ) {
    deleteWebsitePage(
      id: $id
    )
  }
`
import { PageWrap } from '../../../layout'
import { Panel } from '../components'

type SelectedPage = {
  id: string
  name: string
} | null

function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(date)
}

function getStatusColor(
  status: EnumContentStatus
): string {
  switch (status) {
    case EnumContentStatus.Published:
      return 'green'

    case EnumContentStatus.Archived:
      return 'orange'

    case EnumContentStatus.Draft:
    default:
      return 'gray'
  }
}

function getStatusLabel(
  status: EnumContentStatus
): string {
  switch (status) {
    case EnumContentStatus.Published:
      return 'Published'

    case EnumContentStatus.Archived:
      return 'Archived'

    case EnumContentStatus.Draft:
    default:
      return 'Draft'
  }
}

export default function PagesManager() {
  const navigate = useNavigate()
  const toast = useToast()
  const deleteDialog = useDisclosure()

  const cancelRef =
    useRef<HTMLButtonElement>(null)

  const [
    selectedPage,
    setSelectedPage
  ] = useState<SelectedPage>(null)

  const {
    data,
    loading,
    error,
    refetch,
    networkStatus
  } = useQuery<
    WebsitePagesData
  >(
    WEBSITE_PAGES_QUERY,
    {
      fetchPolicy:
        'network-only',
      notifyOnNetworkStatusChange:
        true
    }
  )

  const [
    deleteWebsitePage,
    {
      loading: deleting
    }
  ] = useMutation<
    DeleteWebsitePageData,
    DeleteWebsitePageVariables
  >(
    DELETE_WEBSITE_PAGE_MUTATION
  )

  const pages = useMemo(() => {
    return [...(data?.websitePages ?? [])].sort(
      (first, second) =>
        new Date(second.updatedAt).getTime() -
        new Date(first.updatedAt).getTime()
    )
  }, [data?.websitePages])

  const handleAddPage = () => {
    navigate(
      '/admin/content-management/pages/new'
    )
  }

  const handleEditPage = (
    pageId: string
  ) => {
    navigate(
      `/admin/content-management/pages/${pageId}`
    )
  }

  const handlePreviewPage = (
    pageId: string
  ) => {
    navigate(
      `/admin/content-management/pages/${pageId}`,
      {
        state: {
          openPreview: true
        }
      }
    )
  }

  const openDeleteDialog = (
    page: {
      id: string
      name: string
    }
  ) => {
    setSelectedPage(page)
    deleteDialog.onOpen()
  }

  const closeDeleteDialog = () => {
    if (deleting) {
      return
    }

    deleteDialog.onClose()
    setSelectedPage(null)
  }

  const handleDeletePage =
    async () => {
      if (!selectedPage) {
        return
      }

      try {
        const response =
          await deleteWebsitePage({
            variables: {
              id: selectedPage.id
            }
          })

        if (
          !response.data
            ?.deleteWebsitePage
        ) {
          throw new Error(
            'The page could not be deleted'
          )
        }

        toast({
          title: 'Page deleted',
          description: `${selectedPage.name} was deleted successfully.`,
          status: 'success',
          duration: 4000,
          isClosable: true
        })

        deleteDialog.onClose()
        setSelectedPage(null)

        await refetch()
      } catch (deleteError) {
        toast({
          title: 'Unable to delete page',
          description:
            deleteError instanceof Error
              ? deleteError.message
              : 'An unexpected error occurred',
          status: 'error',
          duration: 6000,
          isClosable: true
        })
      }
    }

  return (
    <>
      <PageWrap
        title="Pages"
        subtitle="Manage website pages and page sections"
        rightElements={
          <HStack>
            <Button
              leftIcon={
                <RefreshCcw size={16} />
              }
              variant="outline"
              isLoading={networkStatus === 4}
              onClick={() => refetch()}
            >
              Refresh
            </Button>

            <Button
              leftIcon={
                <Plus size={16} />
              }
              bg="#176526"
              color="white"
              _hover={{
                bg: '#12501e'
              }}
              onClick={handleAddPage}
            >
              Add Page
            </Button>
          </HStack>
        }
      >
        {error && (
          <Alert
            status="error"
            mb={5}
            borderRadius="10px"
          >
            <AlertIcon />

            <Box>
              <Text fontWeight="600">
                Unable to load pages
              </Text>

              <Text fontSize="sm">
                {error.message}
              </Text>
            </Box>
          </Alert>
        )}

        <Panel title="Website Pages">
          {loading &&
          pages.length === 0 ? (
            <Box
              py={16}
              textAlign="center"
            >
              <Spinner
                size="xl"
                color="green.600"
              />

              <Text
                mt={4}
                color="gray.500"
              >
                Loading pages...
              </Text>
            </Box>
          ) : pages.length === 0 ? (
            <Box
              py={16}
              textAlign="center"
              border="1px dashed"
              borderColor="gray.300"
              borderRadius="10px"
            >
              <Text
                fontWeight="600"
                fontSize="lg"
              >
                No website pages
              </Text>

              <Text
                mt={1}
                color="gray.500"
              >
                Create your first page.
              </Text>

              <Button
                mt={5}
                leftIcon={
                  <Plus size={16} />
                }
                bg="#176526"
                color="white"
                _hover={{
                  bg: '#12501e'
                }}
                onClick={handleAddPage}
              >
                Add Page
              </Button>
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table>
                <Thead>
                  <Tr>
                    <Th>Page Name</Th>
                    <Th>Slug</Th>
                    <Th>Sections</Th>
                    <Th>Status</Th>
                    <Th>Last Updated</Th>
                    <Th textAlign="right">
                      Actions
                    </Th>
                  </Tr>
                </Thead>

                <Tbody>
                  {pages.map((page) => (
                    <Tr
                      key={page.id}
                      cursor="pointer"
                      _hover={{
                        bg: 'gray.50'
                      }}
                      onClick={() =>
                        handleEditPage(page.id)
                      }
                    >
                      <Td>
                        <Text fontWeight="600">
                          {page.name}
                        </Text>

                        {page.metaTitle && (
                          <Text
                            mt={1}
                            fontSize="xs"
                            color="gray.500"
                            noOfLines={1}
                          >
                            {page.metaTitle}
                          </Text>
                        )}
                      </Td>

                      <Td>
                        <Text
                          color="gray.500"
                          fontFamily="mono"
                          fontSize="sm"
                        >
                          {page.slug}
                        </Text>
                      </Td>

                      <Td>
                        <Badge
                          borderRadius="full"
                          px={3}
                          py={1}
                          colorScheme="blue"
                        >
                          {page.sections.length}
                        </Badge>
                      </Td>

                      <Td>
                        <Badge
                          borderRadius="full"
                          px={3}
                          py={1}
                          colorScheme={getStatusColor(
                            page.status
                          )}
                        >
                          {getStatusLabel(
                            page.status
                          )}
                        </Badge>
                      </Td>

                      <Td>
                        {formatDate(
                          page.updatedAt
                        )}
                      </Td>

                      <Td>
                        <HStack
                          justify="flex-end"
                          spacing={1}
                        >
                          <IconButton
                            aria-label={`Preview ${page.name}`}
                            title="Preview"
                            icon={
                              <Eye size={17} />
                            }
                            size="sm"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation()

                              handlePreviewPage(
                                page.id
                              )
                            }}
                          />

                          <IconButton
                            aria-label={`Edit ${page.name}`}
                            title="Edit"
                            icon={
                              <Edit2 size={17} />
                            }
                            size="sm"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation()

                              handleEditPage(
                                page.id
                              )
                            }}
                          />

                          <IconButton
                            aria-label={`Delete ${page.name}`}
                            title="Delete"
                            icon={
                              <Trash2 size={17} />
                            }
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={(event) => {
                              event.stopPropagation()

                              openDeleteDialog(
                                page
                              )
                            }}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Panel>
      </PageWrap>

      <AlertDialog
        isOpen={deleteDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={closeDeleteDialog}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>
              Delete website page
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to
              delete{' '}
              <Text
                as="span"
                fontWeight="700"
              >
                {selectedPage?.name}
              </Text>
              ? This action cannot be
              undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={closeDeleteDialog}
                isDisabled={deleting}
              >
                Cancel
              </Button>

              <Button
                ml={3}
                colorScheme="red"
                isLoading={deleting}
                loadingText="Deleting"
                onClick={handleDeletePage}
              >
                Delete Page
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}