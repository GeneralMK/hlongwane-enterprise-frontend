import { Box, type BoxProps } from '@chakra-ui/react'
import styled from '@emotion/styled'
import type { FC } from 'react'
import { createContext, useCallback, useContext, useMemo, useRef } from 'react'
import { useMeasure } from '../../hooks'

export interface IScrollViewProps extends BoxProps {
  direction?: 'horizontal' | 'vertical'
}

interface ContextType {
  scrollToTop: () => void
}

const Context = createContext({} as ContextType)

export const useScrollView = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useScrollView must be used within a AppearanceProvider')
  }
  return context
}

/**
 * @render react
 * @name ScrollView component
 * @description ScrollView component.
 * @example
 * <ScrollView>
 *   <H1 />
 *   <Image />
 *   <Text />
 * </ScrollView>
 */

const Wrapper = styled(Box)<IScrollViewProps>`
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;
`

const ScrollView: FC<IScrollViewProps> = ({ children, direction, ...rest }) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const { height: wrapperHeight } = useMeasure(wrapperRef)
  const { height: contentHeight } = useMeasure(contentRef)

  const hasContentOverflow = contentHeight > wrapperHeight

  const scrollToTop = useCallback(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const context = useMemo(
    () => ({
      scrollToTop
    }),
    [scrollToTop]
  )

  return (
    <Context.Provider value={context}>
      <Wrapper
        ref={wrapperRef}
        {...rest}
        justifyContent={hasContentOverflow ? 'flex-start' : rest.justifyContent}
        overflowX={direction === 'vertical' ? 'hidden' : 'auto'}
        overflowY={direction === 'vertical' ? 'auto' : 'hidden'}
      >
        <div ref={contentRef} style={{ width: '100%' }}>
          {children}
        </div>
      </Wrapper>
    </Context.Provider>
  )
}

ScrollView.defaultProps = {
  direction: 'vertical',
  height: '100%',
  width: '100%'
}

export default ScrollView
