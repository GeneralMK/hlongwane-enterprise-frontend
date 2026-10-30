import type { ComponentStyleConfig } from '@chakra-ui/react'

const activeLabelStyles = {
  transform: 'scale(0.85) translateY(-26px)'
}

const Form: ComponentStyleConfig = {
  parts: [],
  variants: {
    floating: {
      container: {
        _focusWithin: {
          label: {
            ...activeLabelStyles
          }
        },
        'input:not(:placeholder-shown) + label, .chakra-select__wrapper + label, textarea:not(:placeholder-shown) ~ label':
          {
            ...activeLabelStyles
          },
        label: {
          top: 0,
          left: 0,
          zIndex: 2,
          position: 'absolute',
          backgroundColor: 'white',
          pointerEvents: 'none',
          mx: 3,
          px: 1,
          my: 3,
          transformOrigin: 'left top'
        }
      }
    }
  }
}

export default Form
