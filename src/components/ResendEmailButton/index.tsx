import { EmailIcon } from '@chakra-ui/icons'
import { Button, Text, useToast } from '@chakra-ui/react'
import { useResendInviteEmailMutation } from '../../generated/graphql'

type ResendEmailButtonProps = {
  userId: string
}

const ResendEmailButton: React.FC<ResendEmailButtonProps> = ({ userId }) => {
  const toast = useToast()
  const [resendInvite, { loading }] = useResendInviteEmailMutation({
    variables: { id: userId },
    onCompleted: () => {
      toast({
        title: 'Invite Resent',
        description: 'The invite email has been resent successfully.',
        status: 'success',
        duration: 9000,
        isClosable: true
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'There was an error resending the invite email.',
        status: 'error',
        duration: 9000,
        isClosable: true
      })
    }
  })

  return (
    <Button
      leftIcon={<EmailIcon color="dark" ml={-6} />}
      onClick={() => resendInvite()}
      _hover={{ bg: "white", textColor: "black" }}
      isLoading={loading}
      textColor="white"
      alignSelf="flex-start"
      variant="transparent"
    >
      <Text _hover={{ bg: '', textColor: 'black' }}> Resend Email</Text>
    </Button>
  )
}

export default ResendEmailButton
