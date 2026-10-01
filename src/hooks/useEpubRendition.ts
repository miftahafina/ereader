import ePub from 'epubjs'
import type { Book, Contents, Location, NavItem, Rendition } from 'epubjs'
import { useEffect, useRef, useState } from 'react'
import { getBook } from '../lib/db'
import { IS_WEBKIT, SPREAD_MIN_WIDTH } from '../lib/reader-constants'
import { applyReaderTheme, buildReaderCss } from '../lib/reader-theme'
import type { BookRecord, FlowMode, ReaderSettings } from '../lib/types'
import type { LatestRef } from './useLatest'
import { useLatest } from './useLatest'
import { useReadingProgress } from './useReadingProgress'

interface ElementRef<T> {
  current: T | null
}

export interface ReaderHandlers {
  onSelection: (contents: Contents) => void
  onDismissPopup: () => void
  onSectionChange: (sectionIndex: number | null) => void
  onKey: (event: KeyboardEvent) => void
  onTap: (event: MouseEvent, contents: Contents) => void
  onTouchStart: (event: TouchEvent) => void
  onTouchEnd: (event: TouchEvent) => void
}

interface EpubRenditionOptions {
  bookId: string
  flow: FlowMode
  settingsRef: LatestRef<ReaderSettings>
  viewerRef: ElementRef<HTMLDivElement>
  renditionRef: ElementRef<Rendition>
  handlers: ReaderHandlers
}

export function useEpubRendition({
  bookId,
  flow,
  settingsRef,
  viewerRef,
  renditionRef,
  handlers,
}: EpubRenditionOptions) {
  const handlersRef = useLatest(handlers)
  const lastSizeRef = useRef<{ width: number; height: number } | null>(null)

  const [record, setRecord] = useState<BookRecord | null>(null)
  const [toc, setToc] = useState<NavItem[]>([])
  const [percentage, setPercentage] = useState(0)
  const [currentHref, setCurrentHref] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { load, schedule, flush } = useReadingProgress(bookId)

  useEffect(() => {
    let cancelled = false
    let localBook: Book | null = null
    let localRendition: Rendition | null = null
    let resizeObserver: ResizeObserver | null = null
    let handleFullscreen: (() => void) | null = null

    const handleKey = (event: KeyboardEvent) => handlersRef.current.onKey(event)

    async function init() {
      setLoading(true)
      setError(null)
      setToc([])
      setPercentage(0)
      lastSizeRef.current = null

      const loaded = await getBook(bookId)
      if (cancelled) return
      if (!loaded) {
        setError('Buku tidak ditemukan.')
        setLoading(false)
        return
      }
      setRecord(loaded)

      const epubBook = ePub(loaded.data)
      localBook = epubBook

      await epubBook.ready
      if (cancelled) return

      const bookNavigation = await epubBook.loaded.navigation
      if (cancelled) return
      setToc(bookNavigation?.toc ?? [])

      const rendition = epubBook.renderTo(viewerRef.current as Element, {
        width: '100%',
        height: '100%',
        flow: settingsRef.current.flow === 'scrolled' ? 'scrolled-doc' : 'paginated',
        spread: 'auto',
        minSpreadWidth: SPREAD_MIN_WIDTH,
        allowScriptedContent: IS_WEBKIT,
      })
      localRendition = rendition
      renditionRef.current = rendition

      rendition.hooks.content.register((contents: Contents) => {
        void contents.addStylesheetCss(buildReaderCss(settingsRef.current), 'ereader')
        contents.document?.addEventListener('contextmenu', (event) => event.preventDefault())
      })

      applyReaderTheme(rendition, settingsRef.current)

      rendition.on('selected', (_cfiRange: string, contents: Contents) =>
        handlersRef.current.onSelection(contents),
      )
      rendition.on('click', () => handlersRef.current.onDismissPopup())
      rendition.on('click', (event: MouseEvent, contents: Contents) =>
        handlersRef.current.onTap(event, contents),
      )
      rendition.on('keydown', handleKey)
      document.addEventListener('keydown', handleKey)
      rendition.on('touchstart', (event: TouchEvent) => handlersRef.current.onTouchStart(event))
      rendition.on('touchend', (event: TouchEvent) => handlersRef.current.onTouchEnd(event))

      const saved = await load()
      if (cancelled) return
      await rendition.display(saved?.cfi)
      if (cancelled) return
      setLoading(false)

      rendition.on('relocated', (location: Location) => {
        if (!location?.start) return
        handlersRef.current.onDismissPopup()
        const cfi = location.start.cfi
        const pct = typeof location.start.percentage === 'number' ? location.start.percentage : 0
        setPercentage(pct)
        setCurrentHref(location.start.href)
        schedule(cfi, pct)
        const sectionIndex = typeof location.start.index === 'number' ? location.start.index : null
        handlersRef.current.onSectionChange(sectionIndex)
      })

      const applyResize = (force = false) => {
        const el = viewerRef.current
        if (!el) return
        const width = el.clientWidth
        const height = el.clientHeight
        const last = lastSizeRef.current
        if (
          !force &&
          last &&
          Math.abs(width - last.width) < 2 &&
          Math.abs(height - last.height) < 160
        ) {
          return
        }
        lastSizeRef.current = { width, height }
        rendition.resize(width, height)
      }

      resizeObserver = new ResizeObserver(() => applyResize())
      if (viewerRef.current) resizeObserver.observe(viewerRef.current)

      handleFullscreen = () => applyResize(true)
      document.addEventListener('fullscreenchange', handleFullscreen)

      void epubBook.locations
        .generate(1200)
        .then(() => {
          if (!cancelled) rendition.reportLocation()
        })
        .catch(() => undefined)
    }

    void init()

    return () => {
      cancelled = true
      flush()
      document.removeEventListener('keydown', handleKey)
      if (handleFullscreen) document.removeEventListener('fullscreenchange', handleFullscreen)
      resizeObserver?.disconnect()
      localRendition?.destroy()
      localBook?.destroy()
      renditionRef.current = null
    }
  }, [bookId, flow, settingsRef, viewerRef, renditionRef, handlersRef, load, schedule, flush])

  return { record, toc, percentage, currentHref, loading, error }
}
