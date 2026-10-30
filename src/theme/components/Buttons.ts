import type { ComponentStyleConfig } from '@chakra-ui/react'

const Button: ComponentStyleConfig = {
  baseStyle: {
    borderRadius: 'xl',
    fontWeight: 500,
    letterSpacing: 'wide',
    lineHeight: 1.5
  },
  sizes: {
    md: {
      padding: '8px 24px'
    },
    lg: {
      fontSize: 16,
      minWidth: 164
    }
  },
  defaultProps: {
    colorScheme: 'primary',
    size: 'lg'
  }
}

export default Button
