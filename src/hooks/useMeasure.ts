import type { RefObject } from 'react'
import { useEffect, useLayoutEffect, useState } from 'react'

export interface DOMRectReadOnly {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

const useMeasure = (ref: RefObject<HTMLElement | null>) => {
  const [bounds, setContentRect] = useState<DOMRectReadOnly>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  })

  useIsomorphicLayoutEffect(() => {
    if (ref.current === null) {
      return
    }

    let animationFrameId: number | null = null
    const measure: ResizeObserverCallback = ([entry]: ResizeObserverEntry[]) => {
      animationFrameId = window.requestAnimationFrame(() => {
        setContentRect(entry.contentRect)
      })
    }

    const observer = new ResizeObserver(measure)
    observer.observe(ref.current)

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId)
      }
      observer.disconnect()
    }
  }, [ref])

  return bounds
}

export default useMeasure
