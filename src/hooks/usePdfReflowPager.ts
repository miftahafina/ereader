import type { CSSProperties } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

const COLUMN_GAP = 48
const HORIZONTAL_PADDING = 24
const VERTICAL_MARGIN = 16
const MIN_COLUMN = 200

export function usePdfReflowPager(active: boolean, maxWidth: number, contentKey: string) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLSpanElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(1)

  useEffect(() => {
    const element = viewportRef.current
    if (!element || !active) return
    const update = () => {
      setSize((previous) => {
        const width = element.clientWidth
        const height = element.clientHeight
        if (Math.abs(previous.width - width) < 1 && Math.abs(previous.height - height) < 1) {
          return previous
        }
        return { width, height }
      })
    }
    const observer = new ResizeObserver(update)
    observer.observe(element)
    update()
    return () => observer.disconnect()
  }, [active])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- mulai dari kolom pertama setiap reflow diaktifkan
    if (active) setPage(0)
  }, [active])

  const columnWidth = Math.max(
    MIN_COLUMN,
    Math.min(Math.max(size.width - HORIZONTAL_PADDING * 2, MIN_COLUMN), maxWidth),
  )
  const height = Math.max(0, size.height - VERTICAL_MARGIN)

  useEffect(() => {
    if (!active || size.width === 0) return
    let cancelled = false
    const measure = () => {
      if (cancelled) return
      const content = contentRef.current
      const end = endRef.current
      if (!content || !end) return
      const step = columnWidth + COLUMN_GAP
      const left = end.getBoundingClientRect().left - content.getBoundingClientRect().left
      const columns = Math.max(1, Math.round(left / step) + 1)
      setTotal(columns)
      setPage((current) => Math.min(current, columns - 1))
    }
    const raf = requestAnimationFrame(measure)
    void document.fonts.ready.then(() => requestAnimationFrame(measure))
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [active, size, columnWidth, contentKey])

  const goNext = useCallback(() => setPage((current) => Math.min(current + 1, total - 1)), [total])
  const goPrev = useCallback(() => setPage((current) => Math.max(current - 1, 0)), [])

  const canPrev = page > 0
  const canNext = page < total - 1
  const percentage = total <= 1 ? 0 : page / (total - 1)

  const windowStyle: CSSProperties = { width: columnWidth, height }
  const contentStyle: CSSProperties = {
    height,
    columnWidth,
    columnGap: COLUMN_GAP,
    transform: `translateX(-${page * (columnWidth + COLUMN_GAP)}px)`,
  }

  return {
    viewportRef,
    contentRef,
    endRef,
    page,
    total,
    goNext,
    goPrev,
    canPrev,
    canNext,
    percentage,
    windowStyle,
    contentStyle,
  }
}
