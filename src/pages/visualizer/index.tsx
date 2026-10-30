import {
  Badge,
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Image,
  Select,
  SimpleGrid,
  Text,
  VStack
} from '@chakra-ui/react'
import { Check, RotateCcw } from 'lucide-react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Html, OrbitControls, useGLTF } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import WebsiteLayout from '../../layout/WebsiteLayout'
import images from '../../theme/images'

type View = 'side' | 'front' | 'rear' | 'interior'
type Accessory = { id: number; name: string; price: number; views: View[]; image: string }
const RED = '#ef3347',
  ORANGE = '#ff8a00',
  DISPLAY = "Impact, 'Arial Black', 'Roboto Condensed', sans-serif",
  LABEL = "'Roboto Condensed', 'Arial Narrow', sans-serif"
const colours = [
  ['Pearl White', '#f1f1ef'],
  ['Midnight Black', '#090909'],
  ['Racing Red', '#d6223b'],
  ['Gunmetal', '#4b5563'],
  ['Sunset Orange', '#dd5b00'],
  ['Silver', '#b9b9b9'],
  ['Deep Blue', '#1e396b'],
  ['British Green', '#163f31']
] as const
const models: Record<string, string[]> = { Ferrari: ['458 Italia'] }
const accessories: Accessory[] = [
  {
    id: 1,
    name: 'Rear Lip Spoiler',
    price: 2400,
    views: ['side', 'rear'],
    image: images.exteriorImg
  },
  {
    id: 2,
    name: 'Full Body Kit',
    price: 8500,
    views: ['side', 'front'],
    image: images.performanceImg
  },
  {
    id: 3,
    name: 'Racing Decal Set',
    price: 650,
    views: ['side', 'front', 'rear'],
    image: images.exteriorImg
  },
  {
    id: 4,
    name: 'Chrome Trim Strips',
    price: 380,
    views: ['side', 'front', 'rear'],
    image: images.interiorImg
  },
  { id: 5, name: 'Universal Roof Rack', price: 1950, views: ['side'], image: images.exteriorImg },
  {
    id: 6,
    name: 'Titanium Exhaust Tip',
    price: 1100,
    views: ['side', 'rear'],
    image: images.performanceImg
  },
  {
    id: 7,
    name: '18” Multi-Spoke Alloy Wheels',
    price: 9200,
    views: ['side', 'front', 'rear'],
    image: images.performanceImg
  },
  {
    id: 8,
    name: 'LED Headlight Conversion',
    price: 2100,
    views: ['front'],
    image: images.techElectronicsImg
  },
  {
    id: 9,
    name: '4K Dual Dash Cam',
    price: 1650,
    views: ['rear'],
    image: images.techElectronicsImg
  },
  {
    id: 10,
    name: 'Premium Leather Seat Covers',
    price: 1850,
    views: ['interior'],
    image: images.interiorImg
  },
  {
    id: 11,
    name: 'Carbon Fibre Floor Mats',
    price: 680,
    views: ['interior'],
    image: images.interiorImg
  },
  {
    id: 12,
    name: 'Sport Steering Wheel Cover',
    price: 420,
    views: ['interior'],
    image: images.performanceImg
  },
  {
    id: 13,
    name: 'Carbon Dashboard Trim Kit',
    price: 1200,
    views: ['interior'],
    image: images.interiorImg
  },
  {
    id: 14,
    name: 'RGB Ambient Lighting Kit',
    price: 890,
    views: ['interior'],
    image: images.techElectronicsImg
  },
  {
    id: 15,
    name: '12” Android Car Stereo',
    price: 3200,
    views: ['interior'],
    image: images.techElectronicsImg
  }
]
const money = new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 })

const FERRARI_MODEL = 'https://threejs.org/examples/models/gltf/ferrari.glb'

function CameraView({ view }: { view: View }) {
  const { camera, controls } = useThree()
  useEffect(() => {
    const positions: Record<View, [number, number, number]> = {
      side: [7.5, 2.4, 0],
      front: [0, 2.1, 7.5],
      rear: [0, 2.1, -7.5],
      interior: [0, 1.65, 0.15]
    }
    camera.position.set(...positions[view])
    camera.lookAt(0, 0.7, 0)
    camera.updateProjectionMatrix()
    const orbit = controls as { target?: THREE.Vector3; update?: () => void } | null
    orbit?.target?.set(0, 0.7, 0)
    orbit?.update?.()
  }, [camera, controls, view])
  return null
}

function Ferrari({ colour }: { colour: string }) {
  const { scene } = useGLTF(FERRARI_MODEL)
  const car = useMemo(() => {
    const copy = scene.clone(true)
    copy.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.castShadow = true
      object.receiveShadow = true
      if (object.name.toLowerCase().includes('body')) {
        object.material = (object.material as THREE.MeshStandardMaterial).clone()
        ;(object.material as THREE.MeshStandardMaterial).color.set(colour)
        ;(object.material as THREE.MeshStandardMaterial).metalness = 0.75
        ;(object.material as THREE.MeshStandardMaterial).roughness = 0.22
      }
    })
    return copy
  }, [scene, colour])
  return <primitive object={car} scale={4} rotation={[0, Math.PI, 0]} position={[0, 0.03, 0]} />
}

function CarGraphic({ view, colour }: { view: View; colour: string; mods: number[] }) {
  return (
    <Canvas
      dpr={[1, 2]}
      shadows
      camera={{ position: [7.5, 2.4, 0], fov: 38 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={['#0b0b0b']} />
      <fog attach="fog" args={['#0b0b0b', 9, 18]} />
      <ambientLight intensity={0.55} />
      <directionalLight castShadow position={[5, 8, 5]} intensity={3} />
      <directionalLight position={[-5, 3, -4]} intensity={1.3} color="#6d82a8" />
      <Suspense
        fallback={
          <Html center>
            <Text color="white" fontFamily={DISPLAY}>
              LOADING 3D CAR…
            </Text>
          </Html>
        }
      >
        <Ferrari colour={colour} />
        <Environment preset="city" />
        <ContactShadows position={[0, -0.02, 0]} opacity={0.65} scale={12} blur={2.5} />
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={2.2}
        maxDistance={11}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2.05}
      />
      <CameraView view={view} />
    </Canvas>
  )
}

useGLTF.preload(FERRARI_MODEL)

export default function VisualizerPage() {
  const [started, setStarted] = useState(false),
    [make, setMake] = useState(''),
    [model, setModel] = useState(''),
    [year, setYear] = useState('')
  const [colourName, setColourName] = useState('Pearl White'),
    [colour, setColour] = useState('#f1f1ef'),
    [view, setView] = useState<View>('side'),
    [selected, setSelected] = useState<number[]>([])
  const available = accessories.filter((a) => a.views.includes(view)),
    total = useMemo(
      () => accessories.filter((a) => selected.includes(a.id)).reduce((s, a) => s + a.price, 0),
      [selected]
    )
  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const ready = Boolean(make && model && year)

  if (!started)
    return (
      <WebsiteLayout>
        <Box minH="calc(100vh - 60px)" bg="#070707" color="white">
          <Box bg="#0d0d0d" borderBottom="1px solid #222" py={{ base: 12, md: 16 }}>
            <Container maxW="1400px">
              <Text color={RED} fontSize="9px" letterSpacing=".32em">
                3D PREVIEW
              </Text>
              <Heading mt={6} fontFamily={DISPLAY} fontSize={{ base: '42px', md: '55px' }}>
                DETAILING VISUALIZER
              </Heading>
              <Text mt={5} color="#747984" fontSize="13px">
                Select your car to see exactly how accessories will look before you buy.
              </Text>
            </Container>
          </Box>
          <Container maxW="700px" py={{ base: 12, md: 16 }}>
            <Box p={{ base: 6, md: 9 }} border="1px solid #292929" borderRadius="4px" bg="#141414">
              <Heading mb={8} fontFamily={DISPLAY} fontSize="21px">
                CONFIGURE YOUR CAR
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                {[
                  [
                    'MAKE',
                    make,
                    (v: string) => {
                      setMake(v)
                      setModel('')
                    }
                  ],
                  ['MODEL', model, setModel],
                  ['YEAR', year, setYear]
                ].map(([label, value, setter]) => (
                  <Box key={String(label)}>
                    <Text mb={2} color="#737782" fontSize="8px" letterSpacing=".18em">
                      {String(label)}
                    </Text>
                    <Select
                      value={String(value)}
                      onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                      h="42px"
                      bg="#181818"
                      borderColor="#333"
                    >
                      <option value="">
                        Select {String(label).charAt(0) + String(label).slice(1).toLowerCase()}
                      </option>
                      {label === 'MAKE'
                        ? Object.keys(models).map((x) => <option key={x}>{x}</option>)
                        : label === 'MODEL'
                        ? (models[make] ?? []).map((x) => <option key={x}>{x}</option>)
                        : ['2026', '2025', '2024', '2023', '2022'].map((x) => (
                            <option key={x}>{x}</option>
                          ))}
                    </Select>
                  </Box>
                ))}
              </SimpleGrid>
              <Text mt={8} mb={3} color="#737782" fontSize="8px" letterSpacing=".16em">
                COLOUR {' '}
                <Text as="span" color="white">
                  {colourName.toUpperCase()}
                </Text>
              </Text>
              <HStack flexWrap="wrap">
                {colours.map(([n, c]) => (
                  <Button
                    key={n}
                    aria-label={n}
                    onClick={() => {
                      setColourName(n)
                      setColour(c)
                    }}
                    minW="0"
                    boxSize="34px"
                    p={0}
                    borderRadius="full"
                    bg={c}
                    border="2px solid"
                    borderColor={colourName === n ? RED : '#444'}
                    boxShadow={colourName === n ? `0 0 12px ${RED}` : 'none'}
                    _hover={{ bg: c }}
                  />
                ))}
              </HStack>
              <Button
                mt={8}
                onClick={() => ready && setStarted(true)}
                isDisabled={!ready}
                h="50px"
                px={8}
                borderRadius="3px"
                bg={RED}
                color="white"
                fontFamily={LABEL}
                fontSize="11px"
                letterSpacing=".1em"
                _hover={{ bg: '#d9273b' }}
              >
                OPEN VISUALIZER →
              </Button>
            </Box>
          </Container>
        </Box>
      </WebsiteLayout>
    )

  return (
    <WebsiteLayout>
      <Box minH="100vh" bg="#070707" color="white">
        <HStack h="54px" px={5} borderBottom="1px solid #222" justify="space-between">
          <HStack>
            <Button
              onClick={() => setStarted(false)}
              variant="ghost"
              color="#767b85"
              leftIcon={<RotateCcw size={13} />}
              fontSize="9px"
            >
              RECONFIGURE
            </Button>
            <Text fontFamily={DISPLAY} fontSize="17px">
              {year} {make} {model}
            </Text>
            <Text color="#555" fontSize="8px" letterSpacing=".15em">
              {colourName.toUpperCase()}
            </Text>
          </HStack>
          <Text color="#666" fontSize="9px">
            {selected.length} MODS ·{' '}
            <Text as="span" color={ORANGE}>
              R {money.format(total)}
            </Text>
          </Text>
        </HStack>
        <SimpleGrid column={{ base: 1, lg: '1fr 290px' }} minH="calc(100vh - 54px)">
          <VStack p={{ base: 4, md: 6 }} spacing={4}>
            <HStack>
              {(['side', 'front', 'rear', 'interior'] as View[]).map((v) => (
                <Button
                  key={v}
                  onClick={() => setView(v)}
                  h="38px"
                  px={6}
                  borderRadius="3px"
                  bg={view === v ? RED : '#171717'}
                  color={view === v ? 'white' : '#70747c'}
                  fontSize="9px"
                  letterSpacing=".12em"
                  _hover={{ bg: view === v ? RED : '#222' }}
                >
                  {v.toUpperCase()}
                </Button>
              ))}
            </HStack>
            <Box
              flex="1"
              w="100%"
              minH={{ base: '430px', lg: '600px' }}
              border="1px solid #222"
              bg="#0b0b0b"
              display="grid"
              placeItems="center"
            >
              <CarGraphic view={view} colour={colour} mods={selected} />
            </Box>
          </VStack>
          <Box p={4} borderLeft="1px solid #222" bg="#0d0d0d">
            <Text color="#6d727c" fontSize="8px" letterSpacing=".2em">
              {view.toUpperCase()} VIEW
            </Text>
            <Heading mt={3} mb={5} fontFamily={DISPLAY} fontSize="17px">
              ACCESSORIES
            </Heading>
            <VStack align="stretch" spacing={2}>
              {available.map((a) => {
                const chosen = selected.includes(a.id)
                return (
                  <HStack
                    key={a.id}
                    as="button"
                    onClick={() => toggle(a.id)}
                    p={3}
                    border="1px solid"
                    borderColor={chosen ? RED : '#282828'}
                    bg="#141414"
                    textAlign="left"
                  >
                    <Image src={a.image} alt="" boxSize="50px" objectFit="cover" />
                    <Box flex="1">
                      <Text fontFamily={DISPLAY} fontSize="13px">
                        {a.name}
                      </Text>
                      <Text mt={1} color={ORANGE} fontSize="10px">
                        R {money.format(a.price)}
                      </Text>
                    </Box>
                    <Box
                      boxSize="20px"
                      display="grid"
                      placeItems="center"
                      borderRadius="full"
                      border="2px solid"
                      borderColor={chosen ? RED : '#444'}
                      bg={chosen ? RED : 'transparent'}
                    >
                      {chosen && <Check size={12} />}
                    </Box>
                  </HStack>
                )
              })}
            </VStack>
            {selected.length > 0 && (
              <Box mt={5} p={4} border="1px solid #292929">
                <HStack justify="space-between">
                  <Text color="#777" fontSize="10px">
                    TOTAL MODS
                  </Text>
                  <Badge bg={RED} color="white">
                    {selected.length}
                  </Badge>
                </HStack>
                <Text mt={2} color={ORANGE} fontFamily={DISPLAY} fontSize="22px">
                  R {money.format(total)}
                </Text>
                <Button
                  mt={3}
                  w="100%"
                  onClick={() => setSelected([])}
                  variant="outline"
                  borderColor="#444"
                  fontSize="9px"
                >
                  CLEAR ALL
                </Button>
              </Box>
            )}
          </Box>
        </SimpleGrid>
      </Box>
    </WebsiteLayout>
  )
}
