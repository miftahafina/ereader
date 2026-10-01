import { useEffect, useState } from 'react'
import { SPREAD_GUTTER, SPREAD_MIN_WIDTH } from '../lib/reader-constants'
import type { ReaderSettings } from '../lib/types'

interface BodyRef {
  current: HTMLDivElement | null
}

export function useReaderLayout(bodyRef: BodyRef, settings: ReaderSettings) {
  const [bodyWidth, setBodyWidth] = useState(0)

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      setBodyWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [bodyRef])

  const twoColumn = settings.flow === 'paginated' && bodyWidth >= SPREAD_MIN_WIDTH
  const stageMaxWidth = twoColumn
    ? Math.min(bodyWidth, settings.maxWidth * 2 + SPREAD_GUTTER)
    : settings.maxWidth

  return { twoColumn, stageMaxWidth }
}
