import {
  Box,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Spinner,
  Text
} from '@chakra-ui/react'
import {
  Autocomplete,
  useJsApiLoader
} from '@react-google-maps/api'
import { useCallback, useRef } from 'react'

const GOOGLE_MAPS_LIBRARIES: 'places'[] = ['places']

export type SelectedAddress = {
  address: string
  formattedAddress: string
  city: string
  province: string
  postalCode: string
  latitude?: number
  longitude?: number
  placeId?: string
}

type AddressAutoCompleteProps = {
  value: string
  label?: string
  placeholder?: string
  error?: string
  isRequired?: boolean
  isDisabled?: boolean
  onChange: (value: string) => void
  onAddressSelected: (address: SelectedAddress) => void
}

const getAddressComponent = (
  place: google.maps.places.PlaceResult,
  types: string[],
  useShortName = false
): string => {
  const component = place.address_components?.find((item) =>
    types.some((type) => item.types.includes(type))
  )

  if (!component) return ''
  return useShortName ? component.short_name : component.long_name
}

const parseStreetAddress = (
  place: google.maps.places.PlaceResult
): string => {
  const subpremise = getAddressComponent(place, ['subpremise'])
  const premise = getAddressComponent(place, ['premise'])
  const streetNumber = getAddressComponent(place, ['street_number'])
  const route = getAddressComponent(place, ['route'])

  const address = [subpremise, premise, streetNumber, route]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  return address || place.name || place.formatted_address || ''
}

const parseCity = (
  place: google.maps.places.PlaceResult
): string =>
  getAddressComponent(place, ['locality']) ||
  getAddressComponent(place, ['postal_town']) ||
  getAddressComponent(place, ['administrative_area_level_2']) ||
  getAddressComponent(place, ['sublocality_level_1']) ||
  getAddressComponent(place, ['sublocality'])

const parseProvince = (
  place: google.maps.places.PlaceResult
): string => {
  const province = getAddressComponent(place, [
    'administrative_area_level_1'
  ])
  const code = getAddressComponent(
    place,
    ['administrative_area_level_1'],
    true
  ).toUpperCase()

  const aliases: Record<string, string> = {
    GP: 'Gauteng',
    GT: 'Gauteng',
    KZN: 'KwaZulu-Natal',
    WC: 'Western Cape',
    EC: 'Eastern Cape',
    LP: 'Limpopo',
    MP: 'Mpumalanga',
    FS: 'Free State',
    NW: 'North West',
    NC: 'Northern Cape'
  }

  return aliases[code] ?? province
}

const parsePostalCode = (
  place: google.maps.places.PlaceResult
): string =>
  getAddressComponent(place, ['postal_code'])
    .replace(/\D/g, '')
    .slice(0, 4)

export default function AddressAutoComplete({
  value,
  label = 'Address',
  placeholder = 'Start typing the venue address...',
  error,
  isRequired = false,
  isDisabled = false,
  onChange,
  onAddressSelected
}: AddressAutoCompleteProps) {
  const autocompleteRef =
    useRef<google.maps.places.Autocomplete | null>(null)

  const apiKey = import.meta.env.VITE_APP_GEO_LOCATION_API_KEY ?? ''

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'event-address-google-maps',
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES
  })

  const handleLoad = useCallback(
    (autocomplete: google.maps.places.Autocomplete) => {
      autocompleteRef.current = autocomplete
      autocomplete.setFields([
        'address_components',
        'formatted_address',
        'geometry',
        'name',
        'place_id'
      ])
    },
    []
  )

  const handleUnmount = useCallback(() => {
    autocompleteRef.current = null
  }, [])

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace()

    if (!place || (!place.address_components && !place.formatted_address)) {
      return
    }

    const selectedAddress: SelectedAddress = {
      address: parseStreetAddress(place),
      formattedAddress: place.formatted_address ?? '',
      city: parseCity(place),
      province: parseProvince(place),
      postalCode: parsePostalCode(place),
      latitude: place.geometry?.location?.lat(),
      longitude: place.geometry?.location?.lng(),
      placeId: place.place_id
    }

    onAddressSelected(selectedAddress)
  }, [onAddressSelected])

  const manualInput = (
    message: string,
    colour: 'orange.500' | 'red.500'
  ) => (
    <FormControl isRequired={isRequired} isInvalid={Boolean(error)}>
      <FormLabel fontSize="sm">{label}</FormLabel>
      <Input
        value={value}
        placeholder={placeholder}
        isDisabled={isDisabled}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
      />
      <Text mt={1} fontSize="xs" color={colour}>
        {message}
      </Text>
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  )

  if (!apiKey) {
    return manualInput(
      'Google Maps API key is not configured. You can still enter the address manually.',
      'orange.500'
    )
  }

  if (loadError) {
    return manualInput(
      'Address suggestions could not be loaded. You can still enter the address manually.',
      'red.500'
    )
  }

  if (!isLoaded) {
    return (
      <FormControl>
        <FormLabel fontSize="sm">{label}</FormLabel>
        <Box position="relative">
          <Input placeholder="Loading address search..." isDisabled />
          <Spinner
            position="absolute"
            right={3}
            top="50%"
            transform="translateY(-50%)"
            size="sm"
            color="green.500"
          />
        </Box>
      </FormControl>
    )
  }

  return (
    <FormControl isRequired={isRequired} isInvalid={Boolean(error)}>
      <FormLabel fontSize="sm">{label}</FormLabel>
      <Autocomplete
        onLoad={handleLoad}
        onUnmount={handleUnmount}
        onPlaceChanged={handlePlaceChanged}
        options={{
          componentRestrictions: { country: 'za' },
          fields: [
            'address_components',
            'formatted_address',
            'geometry',
            'name',
            'place_id'
          ],
          types: ['address']
        }}
      >
        <Input
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          isDisabled={isDisabled}
          onChange={(event) => onChange(event.target.value)}
        />
      </Autocomplete>
      <Text mt={1} fontSize="xs" color="gray.500">
        Select an address from the suggestions to populate city, province and
        postal code.
      </Text>
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  )
}