import type { CSSProperties } from 'react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { firstReflowAnchor, reflowAnchorColumn } from '../lib/pdf-reflow-anchor'
import type { PdfReflowAnchor } from '../lib/types'

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
  const anchorRef = useRef<PdfReflowAnchor | null>(null)
  const pendingAnchorRef = useRef<PdfReflowAnchor | null>(null)
  const capturedPageRef = useRef<number | null>(null)

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

  useLayoutEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- mulai dari kolom pertama setiap reflow diaktifkan
    if (active) setPage(0)
    if (active) {
      anchorRef.current = null
      capturedPageRef.current = null
    }
  }, [active])

  const columnWidth = Math.max(
    MIN_COLUMN,
    Math.min(Math.max(size.width - HORIZONTAL_PADDING * 2, MIN_COLUMN), maxWidth),
  )
  const height = Math.max(0, size.height - VERTICAL_MARGIN)

  useLayoutEffect(() => {
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
      const anchor = pendingAnchorRef.current ?? anchorRef.current
      const target = anchor ? reflowAnchorColumn(content, anchor, step) : null
      if (target !== null) {
        pendingAnchorRef.current = null
        capturedPageRef.current = target
      }
      if (!anchor) anchorRef.current = firstReflowAnchor(content, 0, step)
      setPage((current) => Math.min(target ?? current, columns - 1))
    }
    measure()
    void document.fonts.ready.then(() => requestAnimationFrame(measure))
    return () => {
      cancelled = true
    }
  }, [active, size, columnWidth, contentKey])

  useLayoutEffect(() => {
    const content = contentRef.current
    if (!active || !content || size.width === 0 || pendingAnchorRef.current) return
    if (capturedPageRef.current === page) return
    capturedPageRef.current = page
    anchorRef.current = firstReflowAnchor(content, page, columnWidth + COLUMN_GAP)
  }, [active, page, size.width, columnWidth])

  const getAnchor = useCallback(() => {
    const content = contentRef.current
    return content ? firstReflowAnchor(content, page, columnWidth + COLUMN_GAP) : null
  }, [page, columnWidth])

  const goToAnchor = useCallback((anchor: PdfReflowAnchor) => {
    const content = contentRef.current
    const target = content ? reflowAnchorColumn(content, anchor, columnWidth + COLUMN_GAP) : null
    anchorRef.current = anchor
    pendingAnchorRef.current = target === null ? anchor : null
    if (target !== null) {
      capturedPageRef.current = target
      setPage(target)
    }
  }, [columnWidth])

  const isAnchorOnPage = useCallback((anchor: PdfReflowAnchor) => {
    const content = contentRef.current
    return content ? reflowAnchorColumn(content, anchor, columnWidth + COLUMN_GAP) === page : false
  }, [page, columnWidth])

  const goNext = useCallback(() => setPage((current) => Math.min(current + 1, total - 1)), [total])
  const goPrev = useCallback(() => setPage((current) => Math.max(current - 1, 0)), [])
  const goToPercentage = useCallback(
    (percentage: number) =>
      setPage(Math.min(total - 1, Math.max(0, Math.round(percentage * (total - 1))))),
    [total],
  )

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
    goToPercentage,
    getAnchor,
    goToAnchor,
    isAnchorOnPage,
    canPrev,
    canNext,
    percentage,
    windowStyle,
    contentStyle,
  }
}
