import * as React from 'react'

import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Icon,
  Text
} from '@chakra-ui/react'
import { Clock3, LogOut, ShieldCheck } from 'lucide-react'

import { useAuthContext } from '../context/Auth'

interface InactivityLogoutProps {
  children: React.ReactNode
  timeout?: number
  warningDuration?: number
}

const DEFAULT_TIMEOUT = 3 * 60 * 1000
const DEFAULT_WARNING_DURATION = 60 * 1000

const BLUE = '#008fff'
const NAVY = '#07132b'
const MUTED = '#718096'
const BORDER = '#e3eaf3'

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'pointerdown',
  'pointermove',
  'keydown',
  'scroll',
  'touchstart'
]

export default function InactivityLogout({
  children,
  timeout = DEFAULT_TIMEOUT,
  warningDuration = DEFAULT_WARNING_DURATION
}: InactivityLogoutProps) {
  const { isAuthenticated, isAuthenticating, signOut } = useAuthContext()

  const idleTimer = React.useRef<number | undefined>(undefined)
  const logoutTimer = React.useRef<number | undefined>(undefined)
  const countdownTimer = React.useRef<number | undefined>(undefined)

  const lastActivity = React.useRef(0)
  const logoutDeadline = React.useRef(0)
  const promptOpen = React.useRef(false)

  const continueButton = React.useRef<HTMLButtonElement>(null)

  const [isPromptOpen, setIsPromptOpen] = React.useState(false)
  const [secondsRemaining, setSecondsRemaining] = React.useState(
    Math.ceil(warningDuration / 1000)
  )

  const clearIdleTimer = React.useCallback(() => {
    window.clearTimeout(idleTimer.current)
    idleTimer.current = undefined
  }, [])

  const clearWarningTimers = React.useCallback(() => {
    window.clearTimeout(logoutTimer.current)
    window.clearInterval(countdownTimer.current)

    logoutTimer.current = undefined
    countdownTimer.current = undefined
    logoutDeadline.current = 0
  }, [])

  const closePrompt = React.useCallback(() => {
    promptOpen.current = false
    setIsPromptOpen(false)
    clearWarningTimers()
  }, [clearWarningTimers])

  const automaticLogout = React.useCallback(() => {
    closePrompt()

    if (isAuthenticated && !isAuthenticating) {
      signOut()
    }
  }, [closePrompt, isAuthenticated, isAuthenticating, signOut])

  const openPrompt = React.useCallback(() => {
    if (promptOpen.current) return

    clearIdleTimer()
    promptOpen.current = true
    setIsPromptOpen(true)
  }, [clearIdleTimer])

  const scheduleIdlePrompt = React.useCallback(() => {
    clearIdleTimer()
    idleTimer.current = window.setTimeout(openPrompt, timeout)
  }, [clearIdleTimer, openPrompt, timeout])

  const handleStillHere = React.useCallback(() => {
    closePrompt()
    lastActivity.current = Date.now()
    scheduleIdlePrompt()
  }, [closePrompt, scheduleIdlePrompt])

  const handleSignOut = React.useCallback(() => {
    clearIdleTimer()
    closePrompt()

    if (isAuthenticated) {
      signOut()
    }
  }, [clearIdleTimer, closePrompt, isAuthenticated, signOut])

  const recordActivity = React.useCallback(() => {
    // Only the dialog buttons dismiss an open warning.
    if (promptOpen.current) return

    const now = Date.now()

    if (now - lastActivity.current < 1000) return

    lastActivity.current = now
    scheduleIdlePrompt()
  }, [scheduleIdlePrompt])

  React.useEffect(() => {
    lastActivity.current = Date.now()
    scheduleIdlePrompt()

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, {
        passive: true
      })
    })

    return () => {
      clearIdleTimer()

      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity)
      })
    }
  }, [clearIdleTimer, recordActivity, scheduleIdlePrompt])

  React.useEffect(() => {
    if (!isPromptOpen || !isAuthenticated || isAuthenticating) {
      clearWarningTimers()
      return
    }

    clearWarningTimers()

    logoutDeadline.current = Date.now() + warningDuration

    function updateCountdown() {
      setSecondsRemaining(
        Math.max(
          0,
          Math.ceil((logoutDeadline.current - Date.now()) / 1000)
        )
      )
    }

    updateCountdown()

    countdownTimer.current = window.setInterval(updateCountdown, 250)

    logoutTimer.current = window.setTimeout(
      automaticLogout,
      warningDuration
    )

    return clearWarningTimers
  }, [
    automaticLogout,
    clearWarningTimers,
    isAuthenticated,
    isAuthenticating,
    isPromptOpen,
    warningDuration
  ])

  const idleMinutes = timeout / 60_000
  const idleDescription = Number.isInteger(idleMinutes)
    ? `${idleMinutes} minute${idleMinutes === 1 ? '' : 's'}`
    : `${Math.round(timeout / 1000)} seconds`

  return (
    <>
      {children}

      <AlertDialog
        isOpen={isPromptOpen}
        leastDestructiveRef={continueButton}
        onClose={() => undefined}
        closeOnEsc={false}
        closeOnOverlayClick={false}
        returnFocusOnClose={false}
        preserveScrollBarGap
        isCentered
        motionPreset="scale"
      >
        <AlertDialogOverlay
          bg="blackAlpha.700"
          backdropFilter="blur(4px)"
        >
          <AlertDialogContent
            mx={4}
            maxW="440px"
            bg="white"
            color={NAVY}
            border="1px solid"
            borderColor={BORDER}
            borderRadius="14px"
            overflow="hidden"
            fontFamily="Arial, Helvetica, sans-serif"
            boxShadow="0 24px 80px rgba(0, 15, 35, 0.3)"
          >
            <Box h="4px" bg={BLUE} />

            <AlertDialogHeader px={7} pt={7} pb={4}>
              <Flex direction="column" align="center" textAlign="center">
                <Text
                  as="span"
                  fontSize="26px"
                  fontWeight="900"
                  letterSpacing="-0.06em"
                >
                  DEVICE
                  <Box as="span" color={BLUE}>
                    LINKUP
                  </Box>
                </Text>

                <Text
                  mt={1}
                  color={MUTED}
                  fontSize="9px"
                  fontWeight="600"
                  letterSpacing="0.15em"
                  textTransform="uppercase"
                >
                  Your devices. Our connection.
                </Text>

                <Flex
                  align="center"
                  justify="center"
                  boxSize="64px"
                  mt={6}
                  mb={4}
                  borderRadius="full"
                  bg="#eef7ff"
                  border="1px solid #d5eaff"
                >
                  <Icon
                    as={Clock3}
                    boxSize={7}
                    color={BLUE}
                    strokeWidth={1.8}
                  />
                </Flex>

                <Text
                  as="span"
                  fontSize="24px"
                  fontWeight="700"
                  letterSpacing="-0.03em"
                >
                  Are you still there?
                </Text>
              </Flex>
            </AlertDialogHeader>

            <AlertDialogBody px={7} pb={6} textAlign="center">
              <Text color={MUTED} fontSize="sm" lineHeight="1.8">
                We haven’t detected any activity for {idleDescription}.
              </Text>

              {isAuthenticated && !isAuthenticating ? (
                <Box
                  mt={5}
                  p={4}
                  bg="#eef7ff"
                  border="1px solid #d5eaff"
                  borderRadius="9px"
                >
                  <HStack justify="center" spacing={2}>
                    <Icon as={ShieldCheck} color={BLUE} boxSize={4} />

                    <Text color={NAVY} fontSize="sm">
                      You’ll be signed out in
                    </Text>
                  </HStack>

                  <Text
                    mt={2}
                    color={BLUE}
                    fontSize="32px"
                    fontWeight="800"
                    lineHeight="1.2"
                  >
                    {secondsRemaining}
                    <Box
                      as="span"
                      ml={2}
                      fontSize="sm"
                      fontWeight="500"
                    >
                      second{secondsRemaining === 1 ? '' : 's'}
                    </Box>
                  </Text>

                  <Text mt={2} color={MUTED} fontSize="xs">
                    Confirm below to keep your session active.
                  </Text>
                </Box>
              ) : (
                <Text mt={3} color={MUTED} fontSize="sm">
                  Ready to continue exploring?
                </Text>
              )}
            </AlertDialogBody>

            <Divider borderColor={BORDER} />

            <AlertDialogFooter
              px={7}
              py={6}
              gap={3}
              flexDirection={{
                base: 'column-reverse',
                sm: 'row'
              }}
            >
              {isAuthenticated && (
                <Button
                  type="button"
                  w={{ base: 'full', sm: 'auto' }}
                  h="44px"
                  px={5}
                  variant="outline"
                  borderColor={BORDER}
                  borderRadius="7px"
                  color={NAVY}
                  fontSize="sm"
                  leftIcon={<LogOut size={16} />}
                  onClick={handleSignOut}
                  _hover={{
                    bg: '#f0f4f9',
                    borderColor: '#bdcddd'
                  }}
                >
                  Sign out
                </Button>
              )}

              <Button
                ref={continueButton}
                type="button"
                w={{ base: 'full', sm: 'auto' }}
                flex={{ sm: 1 }}
                h="44px"
                bg={BLUE}
                color="white"
                borderRadius="7px"
                fontSize="sm"
                onClick={handleStillHere}
                _hover={{ bg: '#007ada' }}
                _active={{ bg: '#006bc2' }}
              >
                {isAuthenticated
                  ? 'Keep me signed in'
                  : 'Continue browsing'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}