import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ChartFrameProps = {
  className?: string
  fallback?: ReactNode
  children: (size: { width: number; height: number }) => ReactNode
}

export function ChartFrame({ className, fallback, children }: ChartFrameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const node = containerRef.current
    if (!node) {
      return
    }

    const updateSize = () => {
      const nextWidth = node.clientWidth
      const nextHeight = node.clientHeight

      setSize((current) => {
        if (current.width === nextWidth && current.height === nextHeight) {
          return current
        }

        return {
          width: nextWidth,
          height: nextHeight,
        }
      })
    }

    updateSize()

    const observer = new ResizeObserver(() => {
      updateSize()
    })

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [])

  const isReady = size.width > 0 && size.height > 0

  return (
    <div ref={containerRef} className={cn('h-full w-full min-w-0 min-h-0', className)}>
      {isReady ? children(size) : fallback ?? <div className="h-full w-full" />}
    </div>
  )
}
