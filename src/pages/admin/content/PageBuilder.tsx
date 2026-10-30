// import {
//   Alert,
//   AlertIcon,
//   Badge,
//   Box,
//   Button,
//   Checkbox,
//   Divider,
//   HStack,
//   IconButton,
//   Input,
//   Modal,
//   ModalBody,
//   ModalCloseButton,
//   ModalContent,
//   ModalHeader,
//   ModalOverlay,
//   Select,
//   SimpleGrid,
//   Spinner,
//   Text,
//   Textarea,
//   useDisclosure,
//   useToast,
//   VStack
// } from '@chakra-ui/react'
// import {
//   ArrowLeft,
//   ChevronDown,
//   ChevronUp,
//   Copy,
//   Eye,
//   Plus,
//   Save,
//   Trash2
// } from 'lucide-react'
// import {
//   useEffect,
//   useMemo,
//   useState
// } from 'react'
// import {
//   useLocation,
//   useNavigate,
//   useParams
// } from 'react-router-dom'

// import {
//   EnumContentStatus,
//   EnumPageSectionType,
//   type PageSectionInput,
//   useCreateWebsitePageMutation,
//   useUpdateWebsitePageMutation,
//   useWebsitePageQuery
// } from '../../../generated/graphql'
// import { PageWrap } from '../../../layout'
// import {
//   FormField,
//   Panel
// } from '../components'

// type JsonObject = Record<
//   string,
//   unknown
// >

// type BuilderSection = {
//   localId: string
//   id?: string
//   title: string
//   type: EnumPageSectionType
//   position: number
//   content: JsonObject
//   style: JsonObject
// }

// type PageFormState = {
//   id?: string
//   name: string
//   slug: string
//   status: EnumContentStatus
//   metaTitle: string
//   metaDescription: string
//   sections: BuilderSection[]
// }

// type PreviewNavigationState = {
//   openPreview?: boolean
// }

// type Testimonial = {
//   name: string
//   role: string
//   quote: string
// }

// const EMPTY_PAGE: PageFormState = {
//   name: '',
//   slug: '',
//   status: EnumContentStatus.Draft,
//   metaTitle: '',
//   metaDescription: '',
//   sections: []
// }

// const SECTION_LABELS: Record<
//   EnumPageSectionType,
//   string
// > = {
//   [EnumPageSectionType.Hero]:
//     'Hero Section',
//   [EnumPageSectionType.Content]:
//     'Content Section',
//   [EnumPageSectionType.Testimonials]:
//     'Testimonials',
//   [EnumPageSectionType.Products]:
//     'Featured Products',
//   [EnumPageSectionType.CallToAction]:
//     'Call to Action',
//   [EnumPageSectionType.ImageText]:
//     'Image and Text'
// }

// function createLocalId(): string {
//   if (
//     typeof crypto !== 'undefined' &&
//     typeof crypto.randomUUID ===
//       'function'
//   ) {
//     return crypto.randomUUID()
//   }

//   return `${Date.now()}-${Math.random()
//     .toString(36)
//     .slice(2)}`
// }

// function cloneJson<T>(value: T): T {
//   if (
//     typeof structuredClone ===
//     'function'
//   ) {
//     return structuredClone(value)
//   }

//   return JSON.parse(
//     JSON.stringify(value)
//   ) as T
// }

// function asJsonObject(
//   value: unknown
// ): JsonObject {
//   if (
//     value &&
//     typeof value === 'object' &&
//     !Array.isArray(value)
//   ) {
//     return value as JsonObject
//   }

//   return {}
// }

// function getString(
//   value: JsonObject,
//   key: string
// ): string {
//   const result = value[key]

//   return typeof result === 'string'
//     ? result
//     : ''
// }

// function getNumber(
//   value: JsonObject,
//   key: string,
//   fallback: number
// ): number {
//   const result = value[key]

//   return typeof result === 'number'
//     ? result
//     : fallback
// }

// function getBoolean(
//   value: JsonObject,
//   key: string,
//   fallback = false
// ): boolean {
//   const result = value[key]

//   return typeof result === 'boolean'
//     ? result
//     : fallback
// }

// function getTestimonials(
//   value: JsonObject
// ): Testimonial[] {
//   if (!Array.isArray(value.testimonials)) {
//     return []
//   }

//   return value.testimonials.map(
//     (item) => {
//       const testimonial =
//         asJsonObject(item)

//       return {
//         name: getString(
//           testimonial,
//           'name'
//         ),
//         role: getString(
//           testimonial,
//           'role'
//         ),
//         quote: getString(
//           testimonial,
//           'quote'
//         )
//       }
//     }
//   )
// }

// function normalizeSlug(
//   value: string
// ): string {
//   const trimmed = value.trim()

//   if (!trimmed || trimmed === '/') {
//     return '/'
//   }

//   const slug = trimmed
//     .toLowerCase()
//     .replace(/^\/+|\/+$/g, '')
//     .replace(/\s+/g, '-')
//     .replace(/[^a-z0-9/_-]/g, '')
//     .replace(/-+/g, '-')

//   return `/${slug}`
// }

// function createSection(
//   type: EnumPageSectionType
// ): BuilderSection {
//   const base = {
//     localId: createLocalId(),
//     title: SECTION_LABELS[type],
//     type,
//     position: 0,
//     style: {}
//   }

//   switch (type) {
//     case EnumPageSectionType.Hero:
//       return {
//         ...base,
//         content: {
//           heading:
//             'Your Farming Equipment, Delivered.',
//           subheading:
//             'Quality farming equipment for your business.',
//           buttonText:
//             'View Equipment',
//           buttonUrl:
//             '/equipment',
//           imageUrl: '',
//           showSearch: true,
//           searchPlaceholder:
//             'Search for tractors, harvesters and equipment'
//         }
//       }

//     case EnumPageSectionType.Content:
//       return {
//         ...base,
//         content: {
//           heading: '',
//           body: '',
//           textAlign: 'left'
//         }
//       }

//     case EnumPageSectionType.Testimonials:
//       return {
//         ...base,
//         content: {
//           heading:
//             'What Our Customers Say',
//           testimonials: []
//         }
//       }

//     case EnumPageSectionType.Products:
//       return {
//         ...base,
//         content: {
//           heading:
//             'Featured Equipment',
//           description: '',
//           limit: 6,
//           showViewAll: true,
//           viewAllUrl:
//             '/equipment'
//         }
//       }

//     case EnumPageSectionType.CallToAction:
//       return {
//         ...base,
//         content: {
//           heading:
//             'Need Farming Equipment?',
//           description:
//             'Speak to our team today.',
//           buttonText:
//             'Book Consultation',
//           buttonUrl:
//             '/book-consultation'
//         }
//       }

//     case EnumPageSectionType.ImageText:
//       return {
//         ...base,
//         content: {
//           heading: '',
//           body: '',
//           imageUrl: '',
//           imagePosition: 'left'
//         }
//       }

//     default:
//       return {
//         ...base,
//         content: {}
//       }
//   }
// }

// function TestimonialsEditor({
//   content,
//   onChange
// }: {
//   content: JsonObject
//   onChange: (
//     content: JsonObject
//   ) => void
// }) {
//   const testimonials =
//     getTestimonials(content)

//   const updateTestimonial = (
//     index: number,
//     key: keyof Testimonial,
//     value: string
//   ) => {
//     const next =
//       testimonials.map(
//         (
//           testimonial,
//           testimonialIndex
//         ) =>
//           testimonialIndex === index
//             ? {
//                 ...testimonial,
//                 [key]: value
//               }
//             : testimonial
//       )

//     onChange({
//       ...content,
//       testimonials: next
//     })
//   }

//   const addTestimonial = () => {
//     onChange({
//       ...content,
//       testimonials: [
//         ...testimonials,
//         {
//           name: '',
//           role: '',
//           quote: ''
//         }
//       ]
//     })
//   }

//   const removeTestimonial = (
//     index: number
//   ) => {
//     onChange({
//       ...content,
//       testimonials:
//         testimonials.filter(
//           (_, itemIndex) =>
//             itemIndex !== index
//         )
//     })
//   }

//   return (
//     <VStack
//       align="stretch"
//       spacing={4}
//     >
//       <FormField label="Section heading">
//         <Input
//           bg="gray.100"
//           border="none"
//           value={getString(
//             content,
//             'heading'
//           )}
//           onChange={(event) =>
//             onChange({
//               ...content,
//               heading:
//                 event.target.value
//             })
//           }
//         />
//       </FormField>

//       {testimonials.map(
//         (testimonial, index) => (
//           <Box
//             key={`${index}-${testimonial.name}`}
//             border="1px solid"
//             borderColor="gray.200"
//             borderRadius="8px"
//             p={4}
//           >
//             <HStack
//               justify="space-between"
//               mb={3}
//             >
//               <Text fontWeight="600">
//                 Testimonial {index + 1}
//               </Text>

//               <IconButton
//                 aria-label="Remove testimonial"
//                 icon={
//                   <Trash2 size={15} />
//                 }
//                 size="sm"
//                 variant="ghost"
//                 colorScheme="red"
//                 onClick={() =>
//                   removeTestimonial(index)
//                 }
//               />
//             </HStack>

//             <VStack
//               align="stretch"
//               spacing={3}
//             >
//               <Input
//                 placeholder="Customer name"
//                 bg="gray.100"
//                 border="none"
//                 value={
//                   testimonial.name
//                 }
//                 onChange={(event) =>
//                   updateTestimonial(
//                     index,
//                     'name',
//                     event.target.value
//                   )
//                 }
//               />

//               <Input
//                 placeholder="Role or company"
//                 bg="gray.100"
//                 border="none"
//                 value={
//                   testimonial.role
//                 }
//                 onChange={(event) =>
//                   updateTestimonial(
//                     index,
//                     'role',
//                     event.target.value
//                   )
//                 }
//               />

//               <Textarea
//                 placeholder="Customer testimonial"
//                 bg="gray.100"
//                 border="none"
//                 value={
//                   testimonial.quote
//                 }
//                 onChange={(event) =>
//                   updateTestimonial(
//                     index,
//                     'quote',
//                     event.target.value
//                   )
//                 }
//               />
//             </VStack>
//           </Box>
//         )
//       )}

//       <Button
//         width="100%"
//         variant="outline"
//         leftIcon={<Plus size={14} />}
//         onClick={addTestimonial}
//       >
//         Add Testimonial
//       </Button>
//     </VStack>
//   )
// }

// function SectionEditor({
//   section,
//   index,
//   sectionCount,
//   onChange,
//   onRemove,
//   onDuplicate,
//   onMoveUp,
//   onMoveDown
// }: {
//   section: BuilderSection
//   index: number
//   sectionCount: number
//   onChange: (
//     section: BuilderSection
//   ) => void
//   onRemove: () => void
//   onDuplicate: () => void
//   onMoveUp: () => void
//   onMoveDown: () => void
// }) {
//   const updateContent = (
//     key: string,
//     value: unknown
//   ) => {
//     onChange({
//       ...section,
//       content: {
//         ...section.content,
//         [key]: value
//       }
//     })
//   }

//   return (
//     <Box
//       border="1px solid"
//       borderColor="gray.200"
//       borderRadius="10px"
//       overflow="hidden"
//       bg="white"
//     >
//       <HStack
//         justify="space-between"
//         px={4}
//         py={3}
//         bg="gray.50"
//         borderBottom="1px solid"
//         borderColor="gray.200"
//       >
//         <HStack>
//           <Badge colorScheme="green">
//             {index + 1}
//           </Badge>

//           <Box>
//             <Text fontWeight="600">
//               {section.title}
//             </Text>

//             <Text
//               fontSize="xs"
//               color="gray.500"
//             >
//               {
//                 SECTION_LABELS[
//                   section.type
//                 ]
//               }
//             </Text>
//           </Box>
//         </HStack>

//         <HStack spacing={1}>
//           <IconButton
//             aria-label="Move section up"
//             icon={
//               <ChevronUp size={16} />
//             }
//             size="sm"
//             variant="ghost"
//             isDisabled={index === 0}
//             onClick={onMoveUp}
//           />

//           <IconButton
//             aria-label="Move section down"
//             icon={
//               <ChevronDown size={16} />
//             }
//             size="sm"
//             variant="ghost"
//             isDisabled={
//               index === sectionCount - 1
//             }
//             onClick={onMoveDown}
//           />

//           <IconButton
//             aria-label="Duplicate section"
//             icon={<Copy size={16} />}
//             size="sm"
//             variant="ghost"
//             onClick={onDuplicate}
//           />

//           <IconButton
//             aria-label="Remove section"
//             icon={<Trash2 size={16} />}
//             size="sm"
//             variant="ghost"
//             colorScheme="red"
//             onClick={onRemove}
//           />
//         </HStack>
//       </HStack>

//       <VStack
//         align="stretch"
//         spacing={4}
//         p={4}
//       >
//         <FormField label="Internal section title">
//           <Input
//             bg="gray.100"
//             border="none"
//             value={section.title}
//             onChange={(event) =>
//               onChange({
//                 ...section,
//                 title:
//                   event.target.value
//               })
//             }
//           />
//         </FormField>

//         {section.type ===
//           EnumPageSectionType.Hero && (
//           <>
//             <FormField label="Heading">
//               <Input
//                 bg="gray.100"
//                 border="none"
//                 value={getString(
//                   section.content,
//                   'heading'
//                 )}
//                 onChange={(event) =>
//                   updateContent(
//                     'heading',
//                     event.target.value
//                   )
//                 }
//               />
//             </FormField>

//             <FormField label="Subheading">
//               <Textarea
//                 bg="gray.100"
//                 border="none"
//                 value={getString(
//                   section.content,
//                   'subheading'
//                 )}
//                 onChange={(event) =>
//                   updateContent(
//                     'subheading',
//                     event.target.value
//                   )
//                 }
//               />
//             </FormField>

//             <SimpleGrid
//               columns={{
//                 base: 1,
//                 md: 2
//               }}
//               spacing={4}
//             >
//               <FormField label="Button text">
//                 <Input
//                   bg="gray.100"
//                   border="none"
//                   value={getString(
//                     section.content,
//                     'buttonText'
//                   )}
//                   onChange={(event) =>
//                     updateContent(
//                       'buttonText',
//                       event.target.value
//                     )
//                   }
//                 />
//               </FormField>

//               <FormField label="Button URL">
//                 <Input
//                   bg="gray.100"
//                   border="none"
//                   value={getString(
//                     section.content,
//                     'buttonUrl'
//                   )}
//                   onChange={(event) =>
//                     updateContent(
//                       'buttonUrl',
//                       event.target.value
//                     )
//                   }
//                 />
//               </FormField>
//             </SimpleGrid>

//             <FormField label="Background image URL">
//               <Input
//                 bg="gray.100"
//                 border="none"
//                 placeholder="https://..."
//                 value={getString(
//                   section.content,
//                   'imageUrl'
//                 )}
//                 onChange={(event) =>
//                   updateContent(
//                     'imageUrl',
//                     event.target.value
//                   )
//                 }
//               />
//             </FormField>

//             <Checkbox
//               isChecked={getBoolean(
//                 section.content,
//                 'showSearch',
//                 true
//               )}
//               onChange={(event) =>
//                 updateContent(
//                   'showSearch',
//                   event.target.checked
//                 )
//               }
//             >
//               Show equipment search
//             </Checkbox>

//             {getBoolean(
//               section.content,
//               'showSearch',
//               true
//             ) && (
//               <FormField label="Search placeholder">
//                 <Input
//                   bg="gray.100"
//                   border="none"
//                   value={getString(
//                     section.content,
//                     'searchPlaceholder'
//                   )}
//                   onChange={(event) =>
//                     updateContent(
//                       'searchPlaceholder',
//                       event.target.value
//                     )
//                   }
//                 />
//               </FormField>
//             )}
//           </>
//         )}

//         {section.type ===
//           EnumPageSectionType.Content && (
//           <>
//             <FormField label="Heading">
//               <Input
//                 bg="gray.100"
//                 border="none"
//                 value={getString(
//                   section.content,
//                   'heading'
//                 )}
//                 onChange={(event) =>
//                   updateContent(
//                     'heading',
//                     event.target.value
//                   )
//                 }
//               />
//             </FormField>

//             <FormField label="Content">
//               <Textarea
//                 bg="gray.100"
//                 border="none"
//                 minH="180px"
//                 value={getString(
//                   section.content,
//                   'body'
//                 )}
//                 onChange={(event) =>
//                   updateContent(
//                     'body',
//                     event.target.value
//                   )
//                 }
//               />
//             </FormField>

//             <FormField label="Text alignment">
//               <Select
//                 bg="gray.100"
//                 border="none"
//                 value={
//                   getString(
//                     section.content,
//                     'textAlign'
//                   ) || 'left'
//                 }
//                 onChange={(event) =>
//                   updateContent(
//                     'textAlign',
//                     event.target.value
//                   )
//                 }
//               >
//                 <option value="left">
//                   Left
//                 </option>
//                 <option value="center">
//                   Centre
//                 </option>
//                 <option value="right">
//                   Right
//                 </option>
//               </Select>
//             </FormField>
//           </>
//         )}

//         {section.type ===
//           EnumPageSectionType.Testimonials && (
//           <TestimonialsEditor
//             content={section.content}
//             onChange={(content) =>
//               onChange({
//                 ...section,
//                 content
//               })
//             }
//           />
//         )}

//         {section.type ===
//           EnumPageSectionType.Products && (
//           <>
//             <FormField label="Heading">
//               <Input
//                 bg="gray.100"
//                 border="none"
//                 value={getString(
//                   section.content,
//                   'heading'
//                 )}
//                 onChange={(event) =>
//                   updateContent(
//                     'heading',
//                     event.target.value
//                   )
//                 }
//               />
//             </FormField>

//             <FormField label="Description">
//               <Textarea
//                 bg="gray.100"
//                 border="none"
//                 value={getString(
//                   section.content,
//                   'description'
//                 )}
//                 onChange={(event) =>
//                   updateContent(
//                     'description',
//                     event.target.value
//                   )
//                 }
//               />
//             </FormField>

//             <SimpleGrid
//               columns={{
//                 base: 1,
//                 md: 2
//               }}
//               spacing={4}
//             >
//               <FormField label="Number of products">
//                 <Input
//                   type="number"
//                   min={1}
//                   max={20}
//                   bg="gray.100"
//                   border="none"
//                   value={getNumber(
//                     section.content,
//                     'limit',
//                     6
//                   )}
//                   onChange={(event) =>
//                     updateContent(
//                       'limit',
//                       Number(
//                         event.target.value
//                       )
//                     )
//                   }
//                 />
//               </FormField>

//               <FormField label="View all URL">
//                 <Input
//                   bg="gray.100"
//                   border="none"
//                   value={getString(
//                     section.content,
//                     'viewAllUrl'
//                   )}
//                   onChange={(event) =>
//                     updateContent(
//                       'viewAllUrl',
//                       event.target.value
//                     )
//                   }
//                 />
//               </FormField>
//             </SimpleGrid>

//             <Checkbox
//               isChecked={getBoolean(
//                 section.content,
//                 'showViewAll',
//                 true
//               )}
//               onChange={(event) =>
//                 updateContent(
//                   'showViewAll',
//                   event.target.checked
//                 )
//               }
//             >
//               Show view-all button
//             </Checkbox>
//           </>
//         )}

//         {section.type ===
//           EnumPageSectionType.CallToAction && (
//           <>
//             <FormField label="Heading">
//               <Input
//                 bg="gray.100"
//                 border="none"
//                 value={getString(
//                   section.content,
//                   'heading'
//                 )}
//                 onChange={(event) =>
//                   updateContent(
//                     'heading',
//                     event.target.value
//                   )
//                 }
//               />
//             </FormField>

//             <FormField label="Description">
//               <Textarea
//                 bg="gray.100"
//                 border="none"
//                 value={getString(
//                   section.content,
//                   'description'
//                 )}
//                 onChange={(event) =>
//                   updateContent(
//                     'description',
//                     event.target.value
//                   )
//                 }
//               />
//             </FormField>

//             <SimpleGrid
//               columns={{
//                 base: 1,
//                 md: 2
//               }}
//               spacing={4}
//             >
//               <FormField label="Button text">
//                 <Input
//                   bg="gray.100"
//                   border="none"
//                   value={getString(
//                     section.content,
//                     'buttonText'
//                   )}
//                   onChange={(event) =>
//                     updateContent(
//                       'buttonText',
//                       event.target.value
//                     )
//                   }
//                 />
//               </FormField>

//               <FormField label="Button URL">
//                 <Input
//                   bg="gray.100"
//                   border="none"
//                   value={getString(
//                     section.content,
//                     'buttonUrl'
//                   )}
//                   onChange={(event) =>
//                     updateContent(
//                       'buttonUrl',
//                       event.target.value
//                     )
//                   }
//                 />
//               </FormField>
//             </SimpleGrid>
//           </>
//         )}

//         {section.type ===
//           EnumPageSectionType.ImageText && (
//           <>
//             <FormField label="Heading">
//               <Input
//                 bg="gray.100"
//                 border="none"
//                 value={getString(
//                   section.content,
//                   'heading'
//                 )}
//                 onChange={(event) =>
//                   updateContent(
//                     'heading',
//                     event.target.value
//                   )
//                 }
//               />
//             </FormField>

//             <FormField label="Content">
//               <Textarea
//                 bg="gray.100"
//                 border="none"
//                 minH="140px"
//                 value={getString(
//                   section.content,
//                   'body'
//                 )}
//                 onChange={(event) =>
//                   updateContent(
//                     'body',
//                     event.target.value
//                   )
//                 }
//               />
//             </FormField>

//             <FormField label="Image URL">
//               <Input
//                 bg="gray.100"
//                 border="none"
//                 value={getString(
//                   section.content,
//                   'imageUrl'
//                 )}
//                 onChange={(event) =>
//                   updateContent(
//                     'imageUrl',
//                     event.target.value
//                   )
//                 }
//               />
//             </FormField>

//             <FormField label="Image position">
//               <Select
//                 bg="gray.100"
//                 border="none"
//                 value={
//                   getString(
//                     section.content,
//                     'imagePosition'
//                   ) || 'left'
//                 }
//                 onChange={(event) =>
//                   updateContent(
//                     'imagePosition',
//                     event.target.value
//                   )
//                 }
//               >
//                 <option value="left">
//                   Left
//                 </option>
//                 <option value="right">
//                   Right
//                 </option>
//               </Select>
//             </FormField>
//           </>
//         )}
//       </VStack>
//     </Box>
//   )
// }

// function PreviewSection({
//   section
// }: {
//   section: BuilderSection
// }) {
//   switch (section.type) {
//     case EnumPageSectionType.Hero:
//       return (
//         <Box
//           minH="500px"
//           px={{
//             base: 6,
//             md: 16
//           }}
//           py={20}
//           display="flex"
//           alignItems="center"
//           justifyContent="center"
//           textAlign="center"
//           bgImage={
//             getString(
//               section.content,
//               'imageUrl'
//             )
//               ? `linear-gradient(rgba(18, 70, 22, 0.55), rgba(85, 59, 0, 0.55)), url("${getString(
//                   section.content,
//                   'imageUrl'
//                 )}")`
//               : undefined
//           }
//           bgSize="cover"
//           bgPosition="center"
//           bgColor="green.700"
//           color="white"
//         >
//           <Box maxW="900px">
//             <Text
//               fontSize={{
//                 base: '4xl',
//                 md: '6xl'
//               }}
//               lineHeight="1.1"
//               fontWeight="800"
//             >
//               {getString(
//                 section.content,
//                 'heading'
//               )}
//             </Text>

//             <Text
//               mt={5}
//               fontSize="lg"
//             >
//               {getString(
//                 section.content,
//                 'subheading'
//               )}
//             </Text>

//             {getBoolean(
//               section.content,
//               'showSearch',
//               true
//             ) && (
//               <HStack
//                 mt={8}
//                 bg="white"
//                 p={2}
//                 borderRadius="12px"
//                 maxW="760px"
//                 mx="auto"
//               >
//                 <Input
//                   border="none"
//                   color="gray.800"
//                   placeholder={getString(
//                     section.content,
//                     'searchPlaceholder'
//                   )}
//                   _focusVisible={{
//                     boxShadow: 'none'
//                   }}
//                 />

//                 <Button
//                   bg="#176526"
//                   color="white"
//                   _hover={{
//                     bg: '#12501e'
//                   }}
//                 >
//                   Search
//                 </Button>
//               </HStack>
//             )}

//             {!getBoolean(
//               section.content,
//               'showSearch',
//               true
//             ) &&
//               getString(
//                 section.content,
//                 'buttonText'
//               ) && (
//                 <Button
//                   mt={8}
//                   bg="white"
//                   color="green.800"
//                 >
//                   {getString(
//                     section.content,
//                     'buttonText'
//                   )}
//                 </Button>
//               )}
//           </Box>
//         </Box>
//       )

//     case EnumPageSectionType.Content:
//       return (
//         <Box px={8} py={14}>
//           <Box
//             maxW="900px"
//             mx="auto"
//             textAlign={
//               (getString(
//                 section.content,
//                 'textAlign'
//               ) || 'left') as
//                 | 'left'
//                 | 'center'
//                 | 'right'
//             }
//           >
//             <Text
//               fontSize="3xl"
//               fontWeight="700"
//             >
//               {getString(
//                 section.content,
//                 'heading'
//               )}
//             </Text>

//             <Text
//               mt={4}
//               whiteSpace="pre-wrap"
//               color="gray.600"
//             >
//               {getString(
//                 section.content,
//                 'body'
//               )}
//             </Text>
//           </Box>
//         </Box>
//       )

//     case EnumPageSectionType.Testimonials:
//       return (
//         <Box
//           px={8}
//           py={14}
//           bg="gray.50"
//         >
//           <Text
//             textAlign="center"
//             fontSize="3xl"
//             fontWeight="700"
//           >
//             {getString(
//               section.content,
//               'heading'
//             )}
//           </Text>

//           <SimpleGrid
//             mt={8}
//             columns={{
//               base: 1,
//               md: 3
//             }}
//             spacing={5}
//           >
//             {getTestimonials(
//               section.content
//             ).map(
//               (testimonial, index) => (
//                 <Box
//                   key={`${testimonial.name}-${index}`}
//                   bg="white"
//                   p={5}
//                   borderRadius="10px"
//                   boxShadow="sm"
//                 >
//                   <Text>
//                     “{testimonial.quote}”
//                   </Text>

//                   <Text
//                     mt={4}
//                     fontWeight="700"
//                   >
//                     {testimonial.name}
//                   </Text>

//                   <Text
//                     fontSize="sm"
//                     color="gray.500"
//                   >
//                     {testimonial.role}
//                   </Text>
//                 </Box>
//               )
//             )}
//           </SimpleGrid>
//         </Box>
//       )

//     case EnumPageSectionType.Products:
//       return (
//         <Box px={8} py={14}>
//           <Text
//             textAlign="center"
//             fontSize="3xl"
//             fontWeight="700"
//           >
//             {getString(
//               section.content,
//               'heading'
//             )}
//           </Text>

//           <Text
//             textAlign="center"
//             mt={2}
//             color="gray.600"
//           >
//             {getString(
//               section.content,
//               'description'
//             )}
//           </Text>

//           <SimpleGrid
//             mt={8}
//             columns={{
//               base: 1,
//               md: 3
//             }}
//             spacing={5}
//           >
//             {Array.from({
//               length: Math.min(
//                 getNumber(
//                   section.content,
//                   'limit',
//                   6
//                 ),
//                 6
//               )
//             }).map((_, index) => (
//               <Box
//                 key={index}
//                 border="1px solid"
//                 borderColor="gray.200"
//                 borderRadius="10px"
//                 overflow="hidden"
//               >
//                 <Box
//                   h="170px"
//                   bg="gray.100"
//                 />

//                 <Box p={4}>
//                   <Text fontWeight="700">
//                     Product {index + 1}
//                   </Text>

//                   <Text
//                     fontSize="sm"
//                     color="gray.500"
//                   >
//                     Equipment details
//                   </Text>
//                 </Box>
//               </Box>
//             ))}
//           </SimpleGrid>
//         </Box>
//       )

//     case EnumPageSectionType.CallToAction:
//       return (
//         <Box
//           px={8}
//           py={14}
//           bg="green.700"
//           color="white"
//           textAlign="center"
//         >
//           <Text
//             fontSize="3xl"
//             fontWeight="700"
//           >
//             {getString(
//               section.content,
//               'heading'
//             )}
//           </Text>

//           <Text mt={3}>
//             {getString(
//               section.content,
//               'description'
//             )}
//           </Text>

//           {getString(
//             section.content,
//             'buttonText'
//           ) && (
//             <Button mt={6}>
//               {getString(
//                 section.content,
//                 'buttonText'
//               )}
//             </Button>
//           )}
//         </Box>
//       )

//     case EnumPageSectionType.ImageText:
//       return (
//         <SimpleGrid
//           columns={{
//             base: 1,
//             md: 2
//           }}
//           spacing={8}
//           px={8}
//           py={14}
//           alignItems="center"
//         >
//           <Box
//             order={
//               getString(
//                 section.content,
//                 'imagePosition'
//               ) === 'right'
//                 ? 2
//                 : 1
//             }
//           >
//             {getString(
//               section.content,
//               'imageUrl'
//             ) ? (
//               <Box
//                 as="img"
//                 src={getString(
//                   section.content,
//                   'imageUrl'
//                 )}
//                 alt={getString(
//                   section.content,
//                   'heading'
//                 )}
//                 width="100%"
//                 borderRadius="12px"
//               />
//             ) : (
//               <Box
//                 minH="260px"
//                 bg="gray.100"
//                 borderRadius="12px"
//               />
//             )}
//           </Box>

//           <Box
//             order={
//               getString(
//                 section.content,
//                 'imagePosition'
//               ) === 'right'
//                 ? 1
//                 : 2
//             }
//           >
//             <Text
//               fontSize="3xl"
//               fontWeight="700"
//             >
//               {getString(
//                 section.content,
//                 'heading'
//               )}
//             </Text>

//             <Text
//               mt={4}
//               whiteSpace="pre-wrap"
//               color="gray.600"
//             >
//               {getString(
//                 section.content,
//                 'body'
//               )}
//             </Text>
//           </Box>
//         </SimpleGrid>
//       )

//     default:
//       return null
//   }
// }

// function PagePreview({
//   page
// }: {
//   page: PageFormState
// }) {
//   const sections = useMemo(
//     () =>
//       [...page.sections].sort(
//         (first, second) =>
//           first.position -
//           second.position
//       ),
//     [page.sections]
//   )

//   if (sections.length === 0) {
//     return (
//       <Box
//         py={20}
//         textAlign="center"
//       >
//         <Text color="gray.500">
//           Add sections to preview this
//           page.
//         </Text>
//       </Box>
//     )
//   }

//   return (
//     <VStack
//       align="stretch"
//       spacing={0}
//     >
//       {sections.map((section) => (
//         <PreviewSection
//           key={section.localId}
//           section={section}
//         />
//       ))}
//     </VStack>
//   )
// }

// export default function PageBuilder() {
//   const toast = useToast()
//   const preview = useDisclosure()
//   const navigate = useNavigate()
//   const location = useLocation()

//   const { pageId } = useParams<{
//     pageId: string
//   }>()

//   const isNewPage =
//     !pageId || pageId === 'new'

//   const [
//     sectionType,
//     setSectionType
//   ] =
//     useState<EnumPageSectionType>(
//       EnumPageSectionType.Hero
//     )

//   const [form, setForm] =
//     useState<PageFormState>(
//       EMPTY_PAGE
//     )

//   const {
//     data,
//     loading,
//     error,
//     refetch
//   } = useWebsitePageQuery({
//     variables: {
//       id: pageId ?? ''
//     },
//     skip: isNewPage,
//     fetchPolicy: 'network-only'
//   })

//   const [
//     createWebsitePage,
//     { loading: creating }
//   ] =
//     useCreateWebsitePageMutation()

//   const [
//     updateWebsitePage,
//     { loading: updating }
//   ] =
//     useUpdateWebsitePageMutation()

//   const websitePage =
//     data?.websitePage

//   useEffect(() => {
//     if (isNewPage) {
//       setForm(EMPTY_PAGE)
//       return
//     }

//     if (!websitePage) {
//       return
//     }

//     setForm({
//       id: websitePage.id,
//       name: websitePage.name,
//       slug: websitePage.slug,
//       status: websitePage.status,
//       metaTitle:
//         websitePage.metaTitle ?? '',
//       metaDescription:
//         websitePage.metaDescription ??
//         '',
//       sections: [
//         ...websitePage.sections
//       ]
//         .sort(
//           (first, second) =>
//             first.position -
//             second.position
//         )
//         .map((section, index) => ({
//           localId: createLocalId(),
//           id: section.id,
//           title: section.title,
//           type: section.type,
//           position: index,
//           content: asJsonObject(
//             section.content
//           ),
//           style: asJsonObject(
//             section.style
//           )
//         }))
//     })
//   }, [
//     isNewPage,
//     websitePage
//   ])

//   useEffect(() => {
//     const navigationState =
//       location.state as
//         | PreviewNavigationState
//         | null

//     if (
//       navigationState?.openPreview &&
//       websitePage
//     ) {
//       preview.onOpen()

//       navigate(location.pathname, {
//         replace: true,
//         state: null
//       })
//     }
//   }, [
//     location.pathname,
//     location.state,
//     navigate,
//     preview,
//     websitePage
//   ])

//   const updateSection = (
//     localId: string,
//     nextSection: BuilderSection
//   ) => {
//     setForm((current) => ({
//       ...current,
//       sections: current.sections.map(
//         (section) =>
//           section.localId === localId
//             ? nextSection
//             : section
//       )
//     }))
//   }

//   const addSection = () => {
//     setForm((current) => ({
//       ...current,
//       sections: [
//         ...current.sections,
//         {
//           ...createSection(
//             sectionType
//           ),
//           position:
//             current.sections.length
//         }
//       ]
//     }))
//   }

//   const removeSection = (
//     localId: string
//   ) => {
//     setForm((current) => ({
//       ...current,
//       sections: current.sections
//         .filter(
//           (section) =>
//             section.localId !==
//             localId
//         )
//         .map((section, index) => ({
//           ...section,
//           position: index
//         }))
//     }))
//   }

//   const duplicateSection = (
//     localId: string
//   ) => {
//     setForm((current) => {
//       const sectionIndex =
//         current.sections.findIndex(
//           (section) =>
//             section.localId ===
//             localId
//         )

//       if (sectionIndex < 0) {
//         return current
//       }

//       const source =
//         current.sections[sectionIndex]

//       const copy: BuilderSection = {
//         ...source,
//         id: undefined,
//         localId: createLocalId(),
//         title: `${source.title} Copy`,
//         content: cloneJson(
//           source.content
//         ),
//         style: cloneJson(
//           source.style
//         )
//       }

//       const nextSections = [
//         ...current.sections
//       ]

//       nextSections.splice(
//         sectionIndex + 1,
//         0,
//         copy
//       )

//       return {
//         ...current,
//         sections: nextSections.map(
//           (section, index) => ({
//             ...section,
//             position: index
//           })
//         )
//       }
//     })
//   }

//   const moveSection = (
//     index: number,
//     direction: -1 | 1
//   ) => {
//     setForm((current) => {
//       const targetIndex =
//         index + direction

//       if (
//         targetIndex < 0 ||
//         targetIndex >=
//           current.sections.length
//       ) {
//         return current
//       }

//       const nextSections = [
//         ...current.sections
//       ]

//       const [section] =
//         nextSections.splice(index, 1)

//       nextSections.splice(
//         targetIndex,
//         0,
//         section
//       )

//       return {
//         ...current,
//         sections: nextSections.map(
//           (item, itemIndex) => ({
//             ...item,
//             position: itemIndex
//           })
//         )
//       }
//     })
//   }

//   const validateForm = (): boolean => {
//     if (!form.name.trim()) {
//       toast({
//         title: 'Page name is required',
//         status: 'error'
//       })

//       return false
//     }

//     if (!form.slug.trim()) {
//       toast({
//         title: 'URL slug is required',
//         status: 'error'
//       })

//       return false
//     }

//     const invalidSection =
//       form.sections.find(
//         (section) =>
//           !section.title.trim()
//       )

//     if (invalidSection) {
//       toast({
//         title:
//           'Every section requires a title',
//         status: 'error'
//       })

//       return false
//     }

//     return true
//   }

//   const savePage = async () => {
//     if (!validateForm()) {
//       return
//     }

//     const sections: PageSectionInput[] =
//       form.sections.map(
//         (section, index) => ({
//           id: section.id,
//           title:
//             section.title.trim(),
//           type: section.type,
//           position: index,
//           content: section.content,
//           style: section.style
//         })
//       )

//     try {
//       if (isNewPage) {
//         const response =
//           await createWebsitePage({
//             variables: {
//               input: {
//                 name: form.name.trim(),
//                 slug: normalizeSlug(
//                   form.slug
//                 ),
//                 status: form.status,
//                 metaTitle:
//                   form.metaTitle.trim() ||
//                   null,
//                 metaDescription:
//                   form.metaDescription.trim() ||
//                   null,
//                 sections
//               }
//             }
//           })

//         const createdPage =
//           response.data
//             ?.createWebsitePage

//         if (!createdPage) {
//           throw new Error(
//             'Page was not created'
//           )
//         }

//         toast({
//           title:
//             'Page created successfully',
//           status: 'success',
//           duration: 4000,
//           isClosable: true
//         })

//         navigate(
//           `/admin/content-management/pages/${createdPage.id}`,
//           {
//             replace: true
//           }
//         )

//         return
//       }

//       if (!pageId) {
//         throw new Error(
//           'Page ID is missing'
//         )
//       }

//       await updateWebsitePage({
//         variables: {
//           id: pageId,
//           input: {
//             name: form.name.trim(),
//             slug: normalizeSlug(
//               form.slug
//             ),
//             status: form.status,
//             metaTitle:
//               form.metaTitle.trim() ||
//               null,
//             metaDescription:
//               form.metaDescription.trim() ||
//               null,
//             sections
//           }
//         }
//       })

//       toast({
//         title:
//           'Page updated successfully',
//         status: 'success',
//         duration: 4000,
//         isClosable: true
//       })

//       await refetch()
//     } catch (saveError) {
//       toast({
//         title: 'Unable to save page',
//         description:
//           saveError instanceof Error
//             ? saveError.message
//             : 'An unexpected error occurred',
//         status: 'error',
//         duration: 6000,
//         isClosable: true
//       })
//     }
//   }

//   if (
//     !isNewPage &&
//     loading &&
//     !websitePage
//   ) {
//     return (
//       <PageWrap
//         title="Edit Page"
//         subtitle="Loading website page"
//       >
//         <Box
//           py={20}
//           textAlign="center"
//         >
//           <Spinner
//             size="xl"
//             color="green.600"
//           />
//         </Box>
//       </PageWrap>
//     )
//   }

//   if (
//     !isNewPage &&
//     !loading &&
//     !websitePage
//   ) {
//     return (
//       <PageWrap
//         title="Page Not Found"
//         subtitle="The requested website page could not be found"
//       >
//         <Alert
//           status="error"
//           borderRadius="10px"
//         >
//           <AlertIcon />

//           <Box>
//             <Text fontWeight="600">
//               Website page not found
//             </Text>

//             <Text fontSize="sm">
//               The page may have been
//               deleted or the URL is
//               invalid.
//             </Text>
//           </Box>
//         </Alert>

//         <Button
//           mt={5}
//           leftIcon={
//             <ArrowLeft size={16} />
//           }
//           onClick={() =>
//             navigate(
//               '/admin/content-management/pages'
//             )
//           }
//         >
//           Back to Pages
//         </Button>
//       </PageWrap>
//     )
//   }

//   return (
//     <>
//       <PageWrap
//         title={
//           isNewPage
//             ? 'Create Page'
//             : form.name || 'Edit Page'
//         }
//         subtitle={
//           isNewPage
//             ? 'Create a new website page'
//             : `Editing ${form.slug}`
//         }
//         rightElements={
//           <HStack>
//             <Button
//               leftIcon={
//                 <ArrowLeft size={16} />
//               }
//               variant="ghost"
//               onClick={() =>
//                 navigate(
//                   '/admin/content-management/pages'
//                 )
//               }
//             >
//               Back
//             </Button>

//             <Button
//               leftIcon={
//                 <Eye size={16} />
//               }
//               variant="outline"
//               onClick={preview.onOpen}
//             >
//               Preview
//             </Button>

//             <Button
//               leftIcon={
//                 <Save size={16} />
//               }
//               bg="#176526"
//               color="white"
//               _hover={{
//                 bg: '#12501e'
//               }}
//               isLoading={
//                 creating || updating
//               }
//               loadingText="Saving"
//               onClick={savePage}
//             >
//               {isNewPage
//                 ? 'Create Page'
//                 : 'Save Changes'}
//             </Button>
//           </HStack>
//         }
//       >
//         {error && (
//           <Alert
//             status="error"
//             mb={5}
//             borderRadius="10px"
//           >
//             <AlertIcon />

//             <Box>
//               <Text fontWeight="600">
//                 Unable to load page
//               </Text>

//               <Text fontSize="sm">
//                 {error.message}
//               </Text>
//             </Box>
//           </Alert>
//         )}

//         <SimpleGrid
//           columns={{
//             base: 1,
//             xl: 3
//           }}
//           spacing={5}
//           alignItems="start"
//         >
//           <Panel title="Page Settings">
//             <VStack
//               align="stretch"
//               spacing={4}
//             >
//               <Box
//                 bg="green.50"
//                 border="1px solid"
//                 borderColor="green.100"
//                 borderRadius="8px"
//                 p={3}
//               >
//                 <Text
//                   fontSize="xs"
//                   color="green.700"
//                 >
//                   {isNewPage
//                     ? 'Creating page'
//                     : 'Editing page'}
//                 </Text>

//                 <Text fontWeight="700">
//                   {form.name ||
//                     'Untitled Page'}
//                 </Text>

//                 {!isNewPage && (
//                   <Text
//                     mt={1}
//                     fontSize="xs"
//                     color="gray.500"
//                     fontFamily="mono"
//                     wordBreak="break-all"
//                   >
//                     {pageId}
//                   </Text>
//                 )}
//               </Box>

//               <Divider />

//               <FormField label="Page Name">
//                 <Input
//                   bg="gray.100"
//                   border="none"
//                   value={form.name}
//                   onChange={(event) =>
//                     setForm(
//                       (current) => ({
//                         ...current,
//                         name:
//                           event.target.value
//                       })
//                     )
//                   }
//                 />
//               </FormField>

//               <FormField label="URL Slug">
//                 <Input
//                   bg="gray.100"
//                   border="none"
//                   placeholder="/about"
//                   value={form.slug}
//                   onChange={(event) =>
//                     setForm(
//                       (current) => ({
//                         ...current,
//                         slug:
//                           event.target.value
//                       })
//                     )
//                   }
//                   onBlur={() =>
//                     setForm(
//                       (current) => ({
//                         ...current,
//                         slug:
//                           normalizeSlug(
//                             current.slug
//                           )
//                       })
//                     )
//                   }
//                 />
//               </FormField>

//               <FormField label="Status">
//                 <Select
//                   bg="gray.100"
//                   border="none"
//                   value={form.status}
//                   onChange={(event) =>
//                     setForm(
//                       (current) => ({
//                         ...current,
//                         status:
//                           event.target
//                             .value as EnumContentStatus
//                       })
//                     )
//                   }
//                 >
//                   <option
//                     value={
//                       EnumContentStatus.Draft
//                     }
//                   >
//                     Draft
//                   </option>

//                   <option
//                     value={
//                       EnumContentStatus.Published
//                     }
//                   >
//                     Published
//                   </option>

//                   <option
//                     value={
//                       EnumContentStatus.Archived
//                     }
//                   >
//                     Archived
//                   </option>
//                 </Select>
//               </FormField>

//               <Divider />

//               <FormField label="Meta Title">
//                 <Input
//                   bg="gray.100"
//                   border="none"
//                   placeholder="SEO title"
//                   value={form.metaTitle}
//                   onChange={(event) =>
//                     setForm(
//                       (current) => ({
//                         ...current,
//                         metaTitle:
//                           event.target.value
//                       })
//                     )
//                   }
//                 />
//               </FormField>

//               <FormField label="Meta Description">
//                 <Textarea
//                   bg="gray.100"
//                   border="none"
//                   placeholder="SEO description"
//                   value={
//                     form.metaDescription
//                   }
//                   onChange={(event) =>
//                     setForm(
//                       (current) => ({
//                         ...current,
//                         metaDescription:
//                           event.target.value
//                       })
//                     )
//                   }
//                 />
//               </FormField>
//             </VStack>
//           </Panel>

//           <Box
//             gridColumn={{
//               xl: 'span 2'
//             }}
//           >
//             <Panel
//               title="Page Sections"
//               right={
//                 <HStack>
//                   <Select
//                     size="sm"
//                     width="190px"
//                     value={sectionType}
//                     onChange={(event) =>
//                       setSectionType(
//                         event.target
//                           .value as EnumPageSectionType
//                       )
//                     }
//                   >
//                     {Object.values(
//                       EnumPageSectionType
//                     ).map((type) => (
//                       <option
//                         key={type}
//                         value={type}
//                       >
//                         {
//                           SECTION_LABELS[
//                             type
//                           ]
//                         }
//                       </option>
//                     ))}
//                   </Select>

//                   <Button
//                     size="sm"
//                     leftIcon={
//                       <Plus size={14} />
//                     }
//                     variant="outline"
//                     onClick={addSection}
//                   >
//                     Add Section
//                   </Button>
//                 </HStack>
//               }
//             >
//               <VStack
//                 align="stretch"
//                 spacing={4}
//               >
//                 {form.sections.map(
//                   (section, index) => (
//                     <SectionEditor
//                       key={
//                         section.localId
//                       }
//                       section={section}
//                       index={index}
//                       sectionCount={
//                         form.sections
//                           .length
//                       }
//                       onChange={(
//                         nextSection
//                       ) =>
//                         updateSection(
//                           section.localId,
//                           nextSection
//                         )
//                       }
//                       onRemove={() =>
//                         removeSection(
//                           section.localId
//                         )
//                       }
//                       onDuplicate={() =>
//                         duplicateSection(
//                           section.localId
//                         )
//                       }
//                       onMoveUp={() =>
//                         moveSection(
//                           index,
//                           -1
//                         )
//                       }
//                       onMoveDown={() =>
//                         moveSection(
//                           index,
//                           1
//                         )
//                       }
//                     />
//                   )
//                 )}

//                 {form.sections.length ===
//                   0 && (
//                   <Box
//                     py={14}
//                     textAlign="center"
//                     border="1px dashed"
//                     borderColor="gray.300"
//                     borderRadius="10px"
//                   >
//                     <Text fontWeight="600">
//                       No page sections
//                     </Text>

//                     <Text
//                       mt={1}
//                       fontSize="sm"
//                       color="gray.500"
//                     >
//                       Select a section
//                       type and click Add
//                       Section.
//                     </Text>
//                   </Box>
//                 )}
//               </VStack>
//             </Panel>
//           </Box>
//         </SimpleGrid>
//       </PageWrap>

//       <Modal
//         isOpen={preview.isOpen}
//         onClose={preview.onClose}
//         size="6xl"
//         scrollBehavior="inside"
//       >
//         <ModalOverlay />

//         <ModalContent>
//           <ModalHeader>
//             Preview: {form.name}
//           </ModalHeader>

//           <ModalCloseButton />

//           <ModalBody p={0}>
//             <PagePreview page={form} />
//           </ModalBody>
//         </ModalContent>
//       </Modal>
//     </>
//   )
// }