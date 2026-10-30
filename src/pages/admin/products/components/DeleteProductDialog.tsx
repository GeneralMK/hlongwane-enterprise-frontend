import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button
} from '@chakra-ui/react'
import {
  useRef
} from 'react'

type DeleteProductDialogProps = {
  isOpen: boolean
  isDeleting: boolean
  productName: string
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteProductDialog({
  isOpen,
  isDeleting,
  productName,
  onClose,
  onConfirm
}: DeleteProductDialogProps) {
  const cancelRef =
    useRef<HTMLButtonElement>(null)

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader>
            Delete product
          </AlertDialogHeader>

          <AlertDialogBody>
            Are you sure you want to delete{' '}
            <strong>{productName}</strong>?
            This action cannot be undone.
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button
              ref={cancelRef}
              onClick={onClose}
              isDisabled={isDeleting}
            >
              Cancel
            </Button>

            <Button
              ml={3}
              colorScheme="red"
              isLoading={isDeleting}
              loadingText="Deleting"
              onClick={onConfirm}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  )
}