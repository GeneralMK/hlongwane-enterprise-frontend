import { Box, Button, ButtonGroup, Flex, Icon, Input, InputGroup, InputLeftElement, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { FileText, Image, Search, Upload, Video } from 'lucide-react'
import type { ElementType } from 'react'
import { PageWrap } from '../../../layout'
import { Panel } from '../components'

type MediaItem = {
  name: string
  size: string
  date: string
  icon: ElementType
  type: 'image' | 'document' | 'video'
}

const mediaItems: MediaItem[] = [
  { name: 'hero-image.jpg', size: '2.4 MB', date: '2026-06-05', icon: Image, type: 'image' },
  { name: 'product-1.jpg', size: '1.8 MB', date: '2026-06-04', icon: Image, type: 'image' },
  { name: 'logo.svg', size: '45 KB', date: '2026-05-20', icon: Image, type: 'image' },
  { name: 'catalog.pdf', size: '3.2 MB', date: '2026-05-15', icon: FileText, type: 'document' },
  { name: 'tutorial.mp4', size: '15.7 MB', date: '2026-05-10', icon: Video, type: 'video' }
]

export default function MediaLibrary() {
  return (
    <PageWrap
      title="Media Library"
      subtitle="Manage images, videos, and documents"
      rightElements={<Button leftIcon={<Upload size={16} />} bg="#176526" color="white">Upload Files</Button>}
    >
      <Panel>
        <VStack align="stretch" spacing={5}>
          <InputGroup>
            <InputLeftElement><Search size={16} /></InputLeftElement>
            <Input bg="gray.100" border="none" placeholder="Search media..." />
          </InputGroup>

          <ButtonGroup size="sm" isAttached bg="gray.100" borderRadius="full" p={1} width="fit-content">
            {['All', 'Images', 'Videos', 'Documents'].map((label, index) => (
              <Button key={label} borderRadius="full" bg={index === 0 ? 'white' : 'transparent'}>{label}</Button>
            ))}
          </ButtonGroup>

          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
            {mediaItems.map((media) => {
              const MediaIcon = media.icon
              return (
                <Box key={media.name} border="1px solid" borderColor="gray.200" borderRadius="10px" p={3}>
                  <Flex h="130px" bg="gray.100" align="center" justify="center" borderRadius="6px">
                    <Icon as={MediaIcon} boxSize={10} color="gray.500" />
                  </Flex>
                  <Text mt={3} fontWeight="500">{media.name}</Text>
                  <Flex justify="space-between" gap={3}>
                    <Text fontSize="sm" color="gray.500">{media.size}</Text>
                    <Text fontSize="sm" color="gray.500">{media.date}</Text>
                  </Flex>
                </Box>
              )
            })}
          </SimpleGrid>
        </VStack>
      </Panel>
    </PageWrap>
  )
}
