import ePub from 'epubjs'
import type { Book, Contents, Location, NavItem, Rendition } from 'epubjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getBook, getProgress, saveProgress } from '../lib/db'
import { fetchDefinition } from '../lib/dictionary'
import type { WordDefinition } from '../lib/dictionary'
import { literataFontFaces } from '../lib/fontFaces'
import { fontOptions, themePalette } from '../lib/settings'
import type { BookRecord, ReaderSettings } from '../lib/types'
import { SettingsPanel } from './SettingsPanel'
import { Toc } from './Toc'
import { FullscreenButton } from './FullscreenButton'

interface ReaderProps {
  bookId: string
  settings: ReaderSettings
  onSettingsChange: (patch: Partial<ReaderSettings>) => void
  onClose: () => void
}

const SPREAD_MIN_WIDTH = 1000
const SPREAD_GUTTER = 80

interface WordPopup {
  word: string
  x: number
  y: number
  below: boolean
  status: 'loading' | 'done' | 'error'
  definition?: WordDefinition
}

function extractWord(text: string): string | null {
  const word = text.replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu, '')
  if (!word || /\s/.test(word)) return null
  return word
}

function buildReaderCss(settings: ReaderSettings): string {
  const palette = themePalette[settings.theme]
  const font = fontOptions.find((option) => option.value === settings.fontFamily)
  const fontRule = font?.stack ? `font-family: ${font.stack} !important;` : ''
  const fontFaces = settings.fontFamily === 'literata' ? literataFontFaces() : ''

  return `
    ${fontFaces}
    html, body { background: ${palette.bg} !important; }
    body { line-height: ${settings.lineHeight} !important; }
    body, body * { color: ${palette.text} !important; ${fontRule} }
    body p { margin-top: 0 !important; margin-bottom: ${settings.paragraphSpacing}em !important; }
    a, a * { color: ${palette.link} !important; }
  `
}

function applyReaderTheme(rendition: Rendition, settings: ReaderSettings) {
  const css = buildReaderCss(settings)
  const contents = rendition.getContents() as unknown as Contents[]
  contents.forEach((content) => {
    void content.addStylesheetCss(css, 'ereader')
  })
  rendition.themes.fontSize(`${settings.fontSize}%`)
}

export function Reader({ bookId, settings, onSettingsChange, onClose }: ReaderProps) {
  const [record, setRecord] = useState<BookRecord | null>(null)
  const [toc, setToc] = useState<NavItem[]>([])
  const [percentage, setPercentage] = useState(0)
  const [currentHref, setCurrentHref] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showToc, setShowToc] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [chromeHidden, setChromeHidden] = useState(false)
  const [bodyWidth, setBodyWidth] = useState(0)
  const [popup, setPopup] = useState<WordPopup | null>(null)

  const viewerRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const renditionRef = useRef<Rendition | null>(null)
  const settingsRef = useRef(settings)
  const latestRef = useRef<{ cfi: string; percentage: number } | null>(null)
  const popupAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      setBodyWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const twoColumn = settings.flow === 'paginated' && bodyWidth >= SPREAD_MIN_WIDTH
  const stageMaxWidth = twoColumn
    ? Math.min(bodyWidth, settings.maxWidth * 2 + SPREAD_GUTTER)
    : settings.maxWidth

  const goNext = useCallback(() => {
    void renditionRef.current?.next()
  }, [])

  const goPrev = useCallback(() => {
    void renditionRef.current?.prev()
  }, [])

  useEffect(() => {
    let cancelled = false
    let localBook: Book | null = null
    let localRendition: Rendition | null = null
    let saveTimer: number | null = null
    let resizeObserver: ResizeObserver | null = null
    let handleKey: ((event: KeyboardEvent) => void) | null = null

    async function init() {
      setLoading(true)
      setError(null)
      setToc([])
      setPercentage(0)

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

      const navigation = await epubBook.loaded.navigation
      if (cancelled) return
      setToc(navigation?.toc ?? [])

      const rendition = epubBook.renderTo(viewerRef.current as Element, {
        width: '100%',
        height: '100%',
        flow: settingsRef.current.flow === 'scrolled' ? 'scrolled-doc' : 'paginated',
        spread: 'auto',
        minSpreadWidth: SPREAD_MIN_WIDTH,
        allowScriptedContent: false,
      })
      localRendition = rendition
      renditionRef.current = rendition

      rendition.hooks.content.register((contents: Contents) => {
        void contents.addStylesheetCss(buildReaderCss(settingsRef.current), 'ereader')
      })

      applyReaderTheme(rendition, settingsRef.current)

      const handleSelected = (_cfiRange: string, contents: Contents) => {
        const selection = contents.window.getSelection()
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return
        const word = extractWord(selection.toString())
        if (!word) {
          setPopup(null)
          return
        }
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        const frameRect = contents.window.frameElement?.getBoundingClientRect()
        const x = rect.left + (frameRect?.left ?? 0) + rect.width / 2
        const top = rect.top + (frameRect?.top ?? 0)
        const below = top < 170

        popupAbortRef.current?.abort()
        const controller = new AbortController()
        popupAbortRef.current = controller
        setPopup({
          word,
          x,
          y: below ? top + rect.height : top,
          below,
          status: 'loading',
        })

        void fetchDefinition(word.toLowerCase(), controller.signal)
          .then((definition) => {
            if (cancelled) return
            setPopup((prev) =>
              prev && prev.word === word
                ? { ...prev, status: definition ? 'done' : 'error', definition: definition ?? undefined }
                : prev,
            )
          })
          .catch(() => {
            if (cancelled || controller.signal.aborted) return
            setPopup((prev) => (prev && prev.word === word ? { ...prev, status: 'error' } : prev))
          })
      }
      rendition.on('selected', handleSelected)

      const handleContentClick = () => {
        setPopup(null)
      }
      rendition.on('click', handleContentClick)

      const saved = await getProgress(bookId)
      if (cancelled) return
      await rendition.display(saved?.cfi)
      if (cancelled) return
      setLoading(false)

      const handleRelocated = (location: Location) => {
        if (!location?.start) return
        setPopup(null)
        const cfi = location.start.cfi
        const pct = typeof location.start.percentage === 'number' ? location.start.percentage : 0
        setPercentage(pct)
        setCurrentHref(location.start.href)
        latestRef.current = { cfi, percentage: pct }
        if (saveTimer) window.clearTimeout(saveTimer)
        saveTimer = window.setTimeout(() => {
          void saveProgress({ id: bookId, cfi, percentage: pct, updatedAt: Date.now() })
        }, 600)
      }

      rendition.on('relocated', handleRelocated)

      const onKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setPopup(null)
          return
        }
        if (
          event.key === 'ArrowRight' ||
          event.key === 'PageDown' ||
          event.key === 'AudioVolumeUp'
        ) {
          event.preventDefault()
          void rendition.next()
        } else if (
          event.key === 'ArrowLeft' ||
          event.key === 'PageUp' ||
          event.key === 'AudioVolumeDown'
        ) {
          event.preventDefault()
          void rendition.prev()
        }
      }
      handleKey = onKey
      rendition.on('keydown', onKey)
      document.addEventListener('keydown', onKey)

      const isTouch = window.matchMedia('(pointer: coarse)').matches
      let lastSwipeAt = 0

      const onTap = (event: MouseEvent, contents: Contents) => {
        if (!isTouch) return
        if (Date.now() - lastSwipeAt < 400) return
        const target = event.target as Element | null
        if (target && typeof target.closest === 'function' && target.closest('a')) return
        const selection = contents.window.getSelection()
        if (selection && !selection.isCollapsed) return
        const viewer = viewerRef.current
        if (!viewer) return
        const frame = contents.window.frameElement
        const viewerRect = viewer.getBoundingClientRect()
        if (!viewerRect.width) return
        const frameRect = frame?.getBoundingClientRect()
        const visibleX = event.clientX + (frameRect ? frameRect.left : 0) - viewerRect.left
        const ratio = visibleX / viewerRect.width
        if (ratio < 0.3) {
          void rendition.prev()
        } else if (ratio > 0.7) {
          void rendition.next()
        } else {
          setChromeHidden((value) => !value)
          setShowToc(false)
          setShowSettings(false)
        }
      }
      rendition.on('click', onTap)

      let touchStartX = 0
      let touchStartY = 0
      let touchStartAt = 0

      const onTouchStart = (event: TouchEvent) => {
        const touch = event.changedTouches[0]
        if (!touch) return
        touchStartX = touch.clientX
        touchStartY = touch.clientY
        touchStartAt = Date.now()
      }

      const onTouchEnd = (event: TouchEvent) => {
        const touch = event.changedTouches[0]
        if (!touch) return
        const dx = touch.clientX - touchStartX
        const dy = touch.clientY - touchStartY
        const dt = Date.now() - touchStartAt
        if (dt > 800) return
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return
        lastSwipeAt = Date.now()
        if (dx < 0) void rendition.next()
        else void rendition.prev()
      }
      rendition.on('touchstart', onTouchStart)
      rendition.on('touchend', onTouchEnd)

      resizeObserver = new ResizeObserver(() => {
        const el = viewerRef.current
        if (el) rendition.resize(el.clientWidth, el.clientHeight)
      })
      if (viewerRef.current) resizeObserver.observe(viewerRef.current)

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
      popupAbortRef.current?.abort()
      if (saveTimer) window.clearTimeout(saveTimer)
      if (latestRef.current) {
        void saveProgress({
          id: bookId,
          cfi: latestRef.current.cfi,
          percentage: latestRef.current.percentage,
          updatedAt: Date.now(),
        })
      }
      if (handleKey) document.removeEventListener('keydown', handleKey)
      resizeObserver?.disconnect()
      localRendition?.destroy()
      localBook?.destroy()
      renditionRef.current = null
    }
  }, [bookId, settings.flow])

  useEffect(() => {
    if (renditionRef.current) applyReaderTheme(renditionRef.current, settings)
  }, [settings])

  const handleTocSelect = useCallback((href: string) => {
    void renditionRef.current?.display(href)
    setShowToc(false)
  }, [])

  const popupHalf = Math.min(160, Math.max(72, (window.innerWidth - 24) / 2))
  const popupLeft = popup ? Math.min(Math.max(popup.x, popupHalf), window.innerWidth - popupHalf) : 0

  return (
    <div className={`reader${chromeHidden ? ' chrome-hidden' : ''}`}>
      <header className="reader-top">
        <button className="icon-btn" onClick={onClose} aria-label="Kembali ke perpustakaan">
          ←
        </button>
        <div className="reader-heading">
          <span className="reader-title">{record?.title ?? 'Memuat…'}</span>
          <span className="reader-author">{record?.author}</span>
        </div>
        <div className="reader-actions">
          <button
            className={`icon-btn ${showToc ? 'active' : ''}`}
            onClick={() => {
              setShowToc((v) => !v)
              setShowSettings(false)
            }}
            aria-label="Daftar isi"
          >
            ☰
          </button>
          <button
            className={`icon-btn ${showSettings ? 'active' : ''}`}
            onClick={() => {
              setShowSettings((v) => !v)
              setShowToc(false)
            }}
            aria-label="Pengaturan"
          >
            Aa
          </button>
          <FullscreenButton />
        </div>
      </header>

      <div className="reader-body" ref={bodyRef}>
        {showToc && (
          <aside className="reader-sidebar">
            <Toc items={toc} currentHref={currentHref} onSelect={handleTocSelect} />
          </aside>
        )}

        <div className="reader-stage" style={{ maxWidth: `${stageMaxWidth}px` }}>
          <div className="reader-viewer" ref={viewerRef} />
          {loading && <div className="reader-overlay">Memuat buku…</div>}
          {error && <div className="reader-overlay error">{error}</div>}
        </div>

        {showSettings && (
          <aside className="reader-sidebar settings-sidebar">
            <SettingsPanel settings={settings} onChange={onSettingsChange} />
          </aside>
        )}
      </div>

      <footer className="reader-bottom">
        <button className="nav-btn" onClick={goPrev} aria-label="Halaman sebelumnya">
          ‹
        </button>
        <div className="progress-track" role="progressbar" aria-valuenow={Math.round(percentage * 100)}>
          <div className="progress-fill" style={{ width: `${Math.min(100, percentage * 100)}%` }} />
        </div>
        <span className="progress-label">{Math.round(percentage * 100)}%</span>
        <button className="nav-btn" onClick={goNext} aria-label="Halaman berikutnya">
          ›
        </button>
      </footer>

      {settings.grain > 0 && (
        <div
          className="reader-grain"
          style={{ opacity: (settings.grain / 100) * 0.55 }}
          aria-hidden="true"
        />
      )}

      {popup && (
        <div
          className={`word-popup${popup.below ? ' below' : ''}`}
          style={{ left: `${popupLeft}px`, top: `${popup.y}px` }}
          role="tooltip"
        >
          <div className="word-popup-head">
            <span className="word-popup-word">{popup.word}</span>
            {popup.status === 'done' && popup.definition?.phonetic && (
              <span className="word-popup-phonetic">{popup.definition.phonetic}</span>
            )}
            <button
              className="word-popup-close"
              onClick={() => setPopup(null)}
              aria-label="Tutup"
            >
              ×
            </button>
          </div>
          {popup.status === 'loading' && (
            <div className="word-popup-skeleton" aria-hidden="true">
              <span className="skeleton-line" />
              <span className="skeleton-line" />
              <span className="skeleton-line short" />
            </div>
          )}
          {popup.status === 'error' && <p className="word-popup-note">Definisi tidak ditemukan.</p>}
          {popup.status === 'done' && popup.definition && (
            <ul className="word-popup-list">
              {popup.definition.definitions.map((item, index) => (
                <li key={index}>
                  {item.partOfSpeech && <em className="word-popup-pos">{item.partOfSpeech}</em>}
                  <span>{item.meaning}</span>
                  {item.example && <span className="word-popup-example">“{item.example}”</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
