import type { PDFPageProxy } from 'pdfjs-dist'
import { useEffect, useRef, useState } from 'react'
import { renderPage } from '../lib/pdf'
import { recolorForTheme } from '../lib/pdf-color'
import { cropCanvas, detectContentBounds } from '../lib/pdf-crop'
import type { ReaderTheme } from '../lib/types'

interface PdfPageProps {
  page: PDFPageProxy | null
  crop: boolean
  cropMargin: number
  zoom: number
  theme: ReaderTheme
  fontOpacity: number
  onRendered?: () => void
}

const PANE_PADDING = 12
const SUPERSAMPLE = 2

export function PdfPage({ page, crop, cropMargin, zoom, theme, fontOpacity, onRendered }: PdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onRenderedRef = useRef(onRendered)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    onRenderedRef.current = onRendered
  }, [onRendered])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect
      setSize((previous) => {
        if (
          previous &&
          Math.abs(previous.width - rect.width) < 1 &&
          Math.abs(previous.height - rect.height) < 1
        ) {
          return previous
        }
        return { width: rect.width, height: rect.height }
      })
    })
    observer.observe(element)
    setSize({ width: element.clientWidth, height: element.clientHeight })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = containerRef.current
    if (!element || !page || !size || size.width < 20 || size.height < 20) return
    const targetPage = page
    const targetWidth = size.width
    const targetHeight = size.height

    let cancelled = false
    let task: ReturnType<typeof renderPage>['task'] | null = null

    const run = async () => {
      const base = targetPage.getViewport({ scale: 1 })
      const fit = Math.min(
        (targetWidth - PANE_PADDING * 2) / base.width,
        (targetHeight - PANE_PADDING * 2) / base.height,
      )
      const safeFit = Math.max(fit, 0.05)
      const renderScale = safeFit * (window.devicePixelRatio || 1) * SUPERSAMPLE

      const rendered = renderPage(targetPage, renderScale)
      task = rendered.task
      try {
        await rendered.task.promise
      } catch {
        return
      }
      if (cancelled) return

      let display = rendered.canvas
      if (crop) {
        const rect = detectContentBounds(rendered.canvas)
        const marginDevice = Math.round(cropMargin * safeFit * (window.devicePixelRatio || 1))
        display = cropCanvas(rendered.canvas, rect, marginDevice)
      }

      recolorForTheme(display, theme, fontOpacity / 100)

      const logicalWidth = display.width / renderScale
      const logicalHeight = display.height / renderScale
      const contain =
        Math.min(
          (targetWidth - PANE_PADDING * 2) / logicalWidth,
          (targetHeight - PANE_PADDING * 2) / logicalHeight,
        ) * zoom

      display.className = 'pdf-canvas'
      display.style.width = `${Math.max(1, logicalWidth * contain)}px`
      display.style.height = `${Math.max(1, logicalHeight * contain)}px`

      element.replaceChildren(display)
      onRenderedRef.current?.()
    }

    run().catch(() => undefined)

    return () => {
      cancelled = true
      try {
        task?.cancel()
      } catch {
        // render task sudah selesai
      }
    }
  }, [page, size, crop, cropMargin, zoom, theme, fontOpacity])

  return <div className="pdf-page" ref={containerRef} />
}
