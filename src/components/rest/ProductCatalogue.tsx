// import { useState } from 'react'
// import {
//   Alert,
//   AlertIcon,
//   Box,
//   Button,
//   Heading,
//   Image,
//   Input,
//   SimpleGrid,
//   Spinner,
//   Text,
//   VStack
// } from '@chakra-ui/react'
// import { useProducts, useCreateProductEnquiry, useRestSession } from '../../rest/hooks'
// import { productCardFragment } from '../../rest/fragments'

// /** Reusable REST consumer. It does not depend on generated GraphQL hooks. */
// export default function ProductCatalogue() {
//   const [search, setSearch] = useState('')
//   const [page, setPage] = useState(1)
//   const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null)
//   const session = useRestSession()
//   const products = useProducts({ params: { search, page, limit: 12, status: 'ACTIVE' } })
//   const enquiry = useCreateProductEnquiry()

//   return (
//     <VStack align="stretch" spacing={6}>
//       <Heading>Product catalogue</Heading>
//       <Input
//         aria-label="Search products"
//         placeholder="Search products"
//         value={search}
//         onChange={(event) => {
//           setSearch(event.target.value)
//           setPage(1)
//         }}
//       />
//       {products.isPending && <Spinner aria-label="Loading products" />}
//       {products.error && (
//         <Alert status="error">
//           <AlertIcon />
//           {products.error.message}
//         </Alert>
//       )}
//       {enquiry.error && (
//         <Alert status="error">
//           <AlertIcon />
//           {enquiry.error.message}
//         </Alert>
//       )}
//       {products.data?.items.length === 0 && <Text>No products found.</Text>}
//       <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
//         {products.data?.items.map((product) => {
//           const card = productCardFragment(product)
//           return (
//             <Box key={card.id} borderWidth="1px" borderRadius="lg" p={5}>
//               {card.image && (
//                 <Image
//                   src={card.image}
//                   alt={card.name ?? 'Product'}
//                   height="180px"
//                   objectFit="contain"
//                 />
//               )}
//               <Heading size="md" my={3}>
//                 {card.name}
//               </Heading>
//               <Text mb={3}>{product.shortDescription}</Text>
//               <Button
//                 isDisabled={!session.isAuthenticated || enquiry.isPending}
//                 onClick={() => {
//                   setWhatsappUrl(null)
//                   enquiry.mutate(
//                     { body: { productId: String(card.id) } },
//                     {
//                       onSuccess: (data) => setWhatsappUrl(data.whatsappUrl)
//                     }
//                   )
//                 }}
//               >
//                 Check availability
//               </Button>
//             </Box>
//           )
//         })}
//       </SimpleGrid>
//       {!session.isAuthenticated && <Text>Sign in before requesting availability.</Text>}
//       {whatsappUrl && (
//         <Button as="a" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
//           Open enquiry in WhatsApp
//         </Button>
//       )}
//       <Box display="flex" gap={3} alignItems="center">
//         <Button
//           isDisabled={page <= 1 || products.isFetching}
//           onClick={() => setPage((value) => value - 1)}
//         >
//           Previous
//         </Button>
//         <Text>
//           Page {page} of {products.data?.pagination.pages || 1}
//         </Text>
//         <Button
//           isDisabled={
//             !products.data || page >= products.data.pagination.pages || products.isFetching
//           }
//           onClick={() => setPage((value) => value + 1)}
//         >
//           Next
//         </Button>
//       </Box>
//     </VStack>
//   )
// }
