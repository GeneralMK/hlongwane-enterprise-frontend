import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  VStack,
  useToast
} from '@chakra-ui/react'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

import {
  useCreateCustomerReviewMutation,
  useDeleteCustomerReviewMutation,
  useUpdateCustomerReviewMutation
} from '../../../generated/graphql'
import { BRAND_GREEN } from '../constants'
import type { ReviewableItem } from '../types'
import { formatStatus, getReviewStatusColor, normaliseImage } from '../utils'
import { RatingSelector } from './RatingSelector'

export function ReviewModal({
  isOpen,
  onClose,
  item,
  onSaved
}: {
  isOpen: boolean
  onClose: () => void

  item: ReviewableItem | null

  onSaved: () => Promise<unknown>
}) {
  const toast = useToast()

  const [rating, setRating] = useState(0)

  const [comment, setComment] = useState('')

  const [submitted, setSubmitted] = useState(false)

  const [createReview, { loading: creating }] = useCreateCustomerReviewMutation()

  const [updateReview, { loading: updating }] = useUpdateCustomerReviewMutation()

  const [deleteReview, { loading: deleting }] = useDeleteCustomerReviewMutation()

  const initialiseForm = () => {
    setRating(item?.existingReview?.rating ?? 0)

    setComment(item?.existingReview?.comment ?? '')

    setSubmitted(false)
  }

  const handleClose = () => {
    setRating(0)
    setComment('')
    setSubmitted(false)
    onClose()
  }

  const saveReview = async () => {
    if (!item) {
      return
    }

    setSubmitted(true)

    const trimmedComment = comment.trim()

    if (rating < 1 || rating > 5) {
      return
    }

    if (trimmedComment && trimmedComment.length < 3) {
      return
    }

    try {
      if (item.existingReview) {
        await updateReview({
          variables: {
            id: item.existingReview.id,

            input: {
              rating,

              comment: trimmedComment || null
            }
          }
        })
      } else {
        await createReview({
          variables: {
            input: {
              itemId: item.itemId,

              rating,

              comment: trimmedComment || null
            }
          }
        })
      }

      toast({
        title: item.existingReview ? 'Review updated' : 'Review submitted',

        description: 'Your review has been sent for approval.',

        status: 'success',

        duration: 5000,

        isClosable: true
      })

      await onSaved()

      handleClose()
    } catch (reviewError) {
      toast({
        title: 'Unable to save review',

        description: reviewError instanceof Error ? reviewError.message : 'Please try again.',

        status: 'error',

        duration: 6000,

        isClosable: true
      })
    }
  }

  const removeReview = async () => {
    if (!item?.existingReview) {
      return
    }

    try {
      await deleteReview({
        variables: {
          id: item.existingReview.id
        }
      })

      toast({
        title: 'Review deleted',

        status: 'success',

        duration: 4000,

        isClosable: true
      })

      await onSaved()

      handleClose()
    } catch (deleteError) {
      toast({
        title: 'Unable to delete review',

        description: deleteError instanceof Error ? deleteError.message : 'Please try again.',

        status: 'error',

        duration: 6000,

        isClosable: true
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      onOverlayClick={handleClose}
      size="lg"
      isCentered
      onCloseComplete={() => {
        setRating(0)
        setComment('')
      }}
    >
      <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(8px)" />

      <ModalContent borderRadius="18px" mx={4} onAnimationStart={initialiseForm}>
        <ModalHeader>{item?.existingReview ? 'Edit Review' : 'Leave a Review'}</ModalHeader>

        <ModalCloseButton />

        <ModalBody >
          {item ? (
            <VStack align="stretch" spacing={5}>
              <HStack spacing={4}>
                <Image
                  src={normaliseImage(item.imageUrl)}
                  boxSize="80px"
                  objectFit="contain"
                  bg="gray.50"
                  borderRadius="12px"
                />

                <Box>
                  <Text color={BRAND_GREEN} fontWeight="800" fontSize="lg">
                    {item.itemName}
                  </Text>

                  {item.existingReview ? (
                    <Badge
                      mt={1}
                      colorScheme={getReviewStatusColor(item.existingReview.status)}
                      borderRadius="full"
                      textTransform="none"
                    >
                      {formatStatus(item.existingReview.status)}
                    </Badge>
                  ) : null}
                </Box>
              </HStack>

              <Divider />

              <FormControl isInvalid={submitted && (rating < 1 || rating > 5)}>
                <FormLabel>Your rating</FormLabel>

                <RatingSelector value={rating} onChange={setRating} />

                <FormErrorMessage>Select a rating between 1 and 5.</FormErrorMessage>
              </FormControl>

              <FormControl
                isInvalid={submitted && comment.trim().length > 0 && comment.trim().length < 3}
              >
                <FormLabel>Your review</FormLabel>

                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  minH="130px"
                  maxLength={2000}
                  placeholder="Tell us about your experience with this item..."
                />

                <Flex mt={1} justify="space-between">
                  <FormErrorMessage>
                    Comment must contain at least three characters.
                  </FormErrorMessage>

                  <Text ml="auto" fontSize="xs" color="gray.500">
                    {comment.length}/2000
                  </Text>
                </Flex>
              </FormControl>

              <Alert status="info" borderRadius="10px">
                <AlertIcon />
                Your review will be visible after administrator approval.
              </Alert>
            </VStack>
          ) : null}
        </ModalBody>

        <ModalFooter gap={3}>
          {item?.existingReview ? (
            <Button
              mr="auto"
              colorScheme="red"
              size="md"
              variant="outline"
              leftIcon={<Trash2 size={16} />}
              isLoading={deleting}
              onClick={() => void removeReview()}
            >
              Delete
            </Button>
          ) : null}

          <Button variant="outline" size="md" onClick={handleClose}>
            Cancel
          </Button>

          <Button
            bg={BRAND_GREEN}
            color="white"
            size="md"
            isLoading={creating || updating}
            loadingText="Saving"
            onClick={() => void saveReview()}
            _hover={{
              bg: '#102f17'
            }}
          >
            {item?.existingReview ? 'Update Review' : 'Submit Review'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
