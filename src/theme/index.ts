import type { ThemeConfig } from '@chakra-ui/react'
import { extendTheme } from '@chakra-ui/react'
import type { Styles } from '@chakra-ui/theme-tools'
import components from './components'



const colors = {
  primary: {
    500: '#1b45b5'
  },
  background: '#F4F4F4',
  text: '#2A2A2A',
  siteText: '#727272'
}

const config: ThemeConfig = {
  useSystemColorMode: false
}

const fonts = {
  body: `Manrope,Alacrity-Sans, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,"Manrope", "Segoe UI", "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
  heading: `Manrope, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,"Manrope", "Segoe UI", "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`
}

const styles: Styles = {
  global: () => ({
    'html, body': {
      lineHeight: 1.5,
      letterSpacing: 'normal',
      MozOsxFontSmoothing: 'grayscale',
      WebkitFontSmoothing: 'antialiased',
      fontFeatureSettings: `"liga", "kern" 1`,
      fontKerning: 'normal',
      textRendering: 'optimizeLegibility',
      overflowX: 'clip',
      scrollBehavior: "smooth",
    },
    'ul, li': {
      listStyleType: 'none'
    }
  })
}

export default extendTheme({
  colors,
  components,
  config,
  fonts,
  styles
})
