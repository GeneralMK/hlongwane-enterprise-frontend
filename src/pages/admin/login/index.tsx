// import {
//   Alert,
//   AlertIcon,
//   Box,
//   Button,
//   Checkbox,
//   Container,
//   HStack,
//   IconButton,
//   Input,
//   InputGroup,
//   InputLeftElement,
//   InputRightElement,
//   Link as ChakraLink,
//   Text,
//   VStack
// } from '@chakra-ui/react'
// import axios from 'axios'
// import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
// import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
// import { Link, useLocation, useNavigate } from 'react-router-dom'

// import { useAuthContext } from '../../../context'
// import WebsiteLayout from '../../../layout/WebsiteLayout'

// const BRAND = '#173F1F'
// const BORDER = '#D7DFC8'
// const BACKGROUND = '#FCFBF7'
// const TEXT = '#23351F'
// const SUBTEXT = '#5F6B58'

// const ADMIN_DASHBOARD_PATH = '/admin/dashboard'

// const SUPPORT_AGENT_DASHBOARD_PATH = '/admin/support-agent/dashboard'

// const SUPPORT_AGENT_ROUTE_PREFIX = '/admin/support-agent'

// type LocationState = {
//   from?: string
// }

// function getErrorMessage(error: unknown): string {
//   if (axios.isAxiosError(error)) {
//     const response = error.response?.data

//     if (typeof response === 'string') {
//       return response
//     }

//     if (response && typeof response === 'object') {
//       const data = response as {
//         message?: string
//         error?: string
//       }

//       return data.message || data.error || 'Unable to sign in'
//     }
//   }

//   if (error instanceof Error) {
//     return error.message
//   }

//   return 'Unable to sign in'
// }

// function isSupportAgentRole(role?: string | null): boolean {
//   return role === 'SUPPORT_AGENT'
// }

// function isSupportAgentRoute(pathname?: string | null): boolean {
//   if (!pathname) {
//     return false
//   }

//   return (
//     pathname === SUPPORT_AGENT_ROUTE_PREFIX || pathname.startsWith(`${SUPPORT_AGENT_ROUTE_PREFIX}/`)
//   )
// }

// function getDashboardPath(role?: string | null): string {
//   if (isSupportAgentRole(role)) {
//     return SUPPORT_AGENT_DASHBOARD_PATH
//   }

//   return ADMIN_DASHBOARD_PATH
// }

// function getSafeRedirectPath({
//   role,
//   requestedPath
// }: {
//   role?: string | null
//   requestedPath?: string
// }): string {
//   const isSupportAgent = isSupportAgentRole(role)

//   /*
//    * Support agents must always enter their own
//    * dashboard and should not be redirected into
//    * the normal administration dashboard.
//    */
//   if (isSupportAgent) {
//     return SUPPORT_AGENT_DASHBOARD_PATH
//   }

//   /*
//    * Super admins and ordinary admins must never
//    * be redirected into support-agent pages,
//    * including a path stored in location.state.
//    */
//   if (requestedPath && !isSupportAgentRoute(requestedPath)) {
//     return requestedPath
//   }

//   return ADMIN_DASHBOARD_PATH
// }

// export default function AdminLoginPage() {
//   const navigate = useNavigate()
//   const location = useLocation()

//   const { signIn, user, isAuthenticated, isAdmin, isAuthenticating } = useAuthContext()

//   const [email, setEmail] = useState('')

//   const [password, setPassword] = useState('')

//   const [rememberMe, setRememberMe] = useState(true)

//   const [showPassword, setShowPassword] = useState(false)

//   const [isSubmitting, setIsSubmitting] = useState(false)

//   const [errorMessage, setErrorMessage] = useState('')

//   const isSupportAgent = isSupportAgentRole(user?.role)

//   const hasAdminPortalAccess = isAdmin || isSupportAgent

//   const isValid = useMemo(() => {
//     const normalisedEmail = email.trim()

//     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalisedEmail) && password.trim().length > 0
//   }, [email, password])

//   useEffect(() => {
//     if (isAuthenticating || !isAuthenticated || !user || !hasAdminPortalAccess) {
//       return
//     }

//     const routeState = location.state as LocationState | null

//     const destination = getSafeRedirectPath({
//       role: user.role,
//       requestedPath: routeState?.from
//     })

//     navigate(destination, {
//       replace: true
//     })
//   }, [hasAdminPortalAccess, isAuthenticated, isAuthenticating, location.state, navigate, user])

//   const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
//     event?.preventDefault()

//     if (!isValid || isSubmitting) {
//       return
//     }

//     try {
//       setIsSubmitting(true)
//       setErrorMessage('')

//       await signIn(email.trim().toLowerCase(), null, true, password, true, 'admin', rememberMe)

//       /*
//        * Navigation happens in the useEffect
//        * after AuthContext updates the user.
//        */
//     } catch (error) {
//       setErrorMessage(getErrorMessage(error))
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   if (isAuthenticating) {
//     return <Box minH="100vh" bg={BACKGROUND} />
//   }

//   return (
//     <WebsiteLayout>
//       <Box minH="100vh" bg={BACKGROUND}>
//         <Container
//           maxW="580px"
//           minH="100vh"
//           display="flex"
//           flexDirection="column"
//           justifyContent="center"
//           py={{
//             base: '32px',
//             md: '48px'
//           }}
//         >
//           <VStack spacing="20px" mb="34px">
//             <Box textAlign="center">
//               <Text
//                 color={BRAND}
//                 fontSize={{
//                   base: '30px',
//                   md: '36px'
//                 }}
//                 fontWeight="800"
//                 lineHeight="1.1"
//               >
//                 Admin Dashboard
//               </Text>

//               <Text color={SUBTEXT} fontSize="16px" mt="10px">
//                 Sign in to manage business operations
//               </Text>
//             </Box>
//           </VStack>

//           <Box
//             as="form"
//             onSubmit={handleSubmit}
//             bg="white"
//             borderRadius="24px"
//             boxShadow={'0 12px 40px rgba(0, 0, 0, 0.06)'}
//             p={{
//               base: '24px',
//               md: '32px'
//             }}
//             noValidate
//           >
//             <VStack spacing="22px" align="stretch">
//               {errorMessage && (
//                 <Alert status="error" borderRadius="12px" fontSize="13px">
//                   <AlertIcon />

//                   {errorMessage}
//                 </Alert>
//               )}

//               <FormField
//                 label="Email Address *"
//                 type="email"
//                 placeholder="admin@example.com"
//                 value={email}
//                 icon={<Mail size={20} />}
//                 autoComplete="username"
//                 isDisabled={isSubmitting}
//                 onChange={(value) => {
//                   setEmail(value)
//                   setErrorMessage('')
//                 }}
//               />

//               <Box>
//                 <Text color={TEXT} fontSize="14px" fontWeight="800" mb="10px">
//                   Password *
//                 </Text>

//                 <InputGroup>
//                   <InputLeftElement height="48px" color={SUBTEXT}>
//                     <Lock size={20} />
//                   </InputLeftElement>

//                   <Input
//                     type={showPassword ? 'text' : 'password'}
//                     height="48px"
//                     paddingLeft="46px"
//                     paddingRight="46px"
//                     value={password}
//                     placeholder="••••••••"
//                     autoComplete="current-password"
//                     borderColor={BORDER}
//                     borderWidth="2px"
//                     borderRadius="12px"
//                     color={TEXT}
//                     isDisabled={isSubmitting}
//                     onChange={(event) => {
//                       setPassword(event.target.value)
//                       setErrorMessage('')
//                     }}
//                     _placeholder={{
//                       color: '#9AA392'
//                     }}
//                     _focus={{
//                       borderColor: BRAND,
//                       boxShadow: `0 0 0 1px ${BRAND}`
//                     }}
//                   />

//                   <InputRightElement height="48px">
//                     <IconButton
//                       type="button"
//                       aria-label={showPassword ? 'Hide password' : 'Show password'}
//                       icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                       size="sm"
//                       variant="ghost"
//                       color={SUBTEXT}
//                       isDisabled={isSubmitting}
//                       onClick={() => setShowPassword((current) => !current)}
//                     />
//                   </InputRightElement>
//                 </InputGroup>
//               </Box>

//               <HStack justify="space-between" pt="2px">
//                 <Checkbox
//                   colorScheme="green"
//                   isChecked={rememberMe}
//                   isDisabled={isSubmitting}
//                   onChange={(event) => setRememberMe(event.target.checked)}
//                 >
//                   <Text color={TEXT} fontSize="14px">
//                     Remember me
//                   </Text>
//                 </Checkbox>
//               </HStack>

//               <Button
//                 type="submit"
//                 width="100%"
//                 height="52px"
//                 bg={BRAND}
//                 color="white"
//                 borderRadius="999px"
//                 fontSize="18px"
//                 fontWeight="800"
//                 mt="4px"
//                 isLoading={isSubmitting}
//                 loadingText="Signing in"
//                 isDisabled={!isValid || isSubmitting}
//                 _hover={{
//                   bg: '#0E2D15'
//                 }}
//                 _disabled={{
//                   bg: '#9AA392',
//                   cursor: 'not-allowed'
//                 }}
//               >
//                 Sign In
//               </Button>
//             </VStack>
//           </Box>

//           <Text textAlign="center" color={SUBTEXT} fontSize="14px" mt="28px">
//             Need help?{' '}
//             <ChakraLink
//               as={Link}
//               to="/contact-us"
//               color={BRAND}
//               fontWeight="700"
//               _hover={{
//                 textDecoration: 'none'
//               }}
//             >
//               Contact Support
//             </ChakraLink>
//           </Text>
//         </Container>
//       </Box>
//     </WebsiteLayout>
//   )
// }

// type FormFieldProps = {
//   label: string
//   type: string
//   placeholder: string
//   icon: ReactNode
//   value: string
//   autoComplete?: string
//   isDisabled?: boolean
//   onChange: (value: string) => void
// }

// function FormField({
//   label,
//   type,
//   placeholder,
//   icon,
//   value,
//   autoComplete,
//   isDisabled = false,
//   onChange
// }: FormFieldProps) {
//   return (
//     <Box>
//       <Text color={TEXT} fontSize="14px" fontWeight="800" mb="10px">
//         {label}
//       </Text>

//       <InputGroup>
//         <InputLeftElement height="48px" color={SUBTEXT}>
//           {icon}
//         </InputLeftElement>

//         <Input
//           type={type}
//           height="48px"
//           paddingLeft="46px"
//           value={value}
//           placeholder={placeholder}
//           autoComplete={autoComplete}
//           borderColor={BORDER}
//           borderWidth="2px"
//           borderRadius="12px"
//           color={TEXT}
//           isDisabled={isDisabled}
//           onChange={(event) => onChange(event.target.value)}
//           _placeholder={{
//             color: '#9AA392'
//           }}
//           _focus={{
//             borderColor: BRAND,
//             boxShadow: `0 0 0 1px ${BRAND}`
//           }}
//         />
//       </InputGroup>
//     </Box>
//   )
// }
