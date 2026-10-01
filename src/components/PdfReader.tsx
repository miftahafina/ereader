import type { PDFPageProxy } from 'pdfjs-dist'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePdfDocument } from '../hooks/usePdfDocument'
import { usePdfProgress } from '../hooks/usePdfProgress'
import { usePdfReflow } from '../hooks/usePdfReflow'
import { usePdfView } from '../hooks/usePdfView'
import { useReaderChrome } from '../hooks/useReaderChrome'
import { literataFontFaces } from '../lib/fontFaces'
import { fontOptions } from '../lib/settings'
import type { ReaderSettings } from '../lib/types'
import { DebugPanel } from './DebugPanel'
import { FullscreenButton } from './FullscreenButton'
import { PdfPage } from './PdfPage'
import { PdfSettingsPanel } from './PdfSettingsPanel'
import { PdfToc } from './PdfToc'

interface PdfReaderProps {
  bookId: string
  settings: ReaderSettings
  onSettingsChange: (patch: Partial<ReaderSettings>) => void
  onClose: () => void
}

export function PdfReader({ bookId, settings, onSettingsChange, onClose }: PdfReaderProps) {
  const { record, doc, outline, loading, error } = usePdfDocument(bookId)
  const chrome = useReaderChrome()
  const view = usePdfView(doc, settings)
  const reflow = usePdfReflow(doc, settings.pdfReflow)
  const { load, schedule, flush } = usePdfProgress(bookId)

  const [pageProxies, setPageProxies] = useState<Record<number, PDFPageProxy | null>>({})
  const [reflowFraction, setReflowFraction] = useState(0)
  const reflowRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)
  const setPageRef = useRef(view.setPage)

  useEffect(() => {
    setPageRef.current = view.setPage
  }, [view.setPage])

  const pagesKey = view.pages.join(',')
  const pageNumbers = useMemo(
    () => (pagesKey ? pagesKey.split(',').map(Number) : []),
    [pagesKey],
  )

  useEffect(() => {
    if (!doc || settings.pdfReflow) return
    let cancelled = false
    void Promise.all(
      pageNumbers.map(async (pageNumber) => {
        try {
          return [pageNumber, await doc.getPage(pageNumber)] as const
        } catch {
          return [pageNumber, null] as const
        }
      }),
    ).then((entries) => {
      if (!cancelled) setPageProxies(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [doc, pageNumbers, settings.pdfReflow])

  useEffect(() => {
    if (!doc) return
    loadedRef.current = false
    let cancelled = false
    void load().then((saved) => {
      if (cancelled) return
      setPageRef.current(saved)
      loadedRef.current = true
    })
    return () => {
      cancelled = true
    }
  }, [doc, load])

  useEffect(() => {
    if (!doc || settings.pdfReflow || !loadedRef.current) return
    schedule(view.page, view.percentage)
  }, [doc, settings.pdfReflow, view.page, view.percentage, schedule])

  useEffect(() => {
    if (!doc || !settings.pdfReflow || !loadedRef.current) return
    const page = Math.round(reflowFraction * (view.numPages - 1)) + 1
    schedule(page, reflowFraction)
  }, [doc, settings.pdfReflow, reflowFraction, view.numPages, schedule])

  useEffect(() => () => flush(), [flush])

  const scrollReflow = useCallback((dir: 1 | -1) => {
    const element = reflowRef.current
    if (!element) return
    element.scrollBy({ top: element.clientHeight * 0.9 * dir, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        chrome.closePanel()
        return
      }
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault()
        if (settings.pdfReflow) scrollReflow(1)
        else view.goNext()
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        if (settings.pdfReflow) scrollReflow(-1)
        else view.goPrev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [settings.pdfReflow, scrollReflow, view, chrome])

  const touchStartX = useRef<number | null>(null)
  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX
  }
  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = event.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 50) return
    if (settings.pdfReflow) scrollReflow(delta < 0 ? 1 : -1)
    else if (delta < 0) view.goNext()
    else view.goPrev()
  }

  const handleReflowScroll = () => {
    const element = reflowRef.current
    if (!element) return
    const max = element.scrollHeight - element.clientHeight
    setReflowFraction(max > 0 ? element.scrollTop / max : 0)
  }

  const displayPercentage = settings.pdfReflow ? reflowFraction : view.percentage
  const fontStack = fontOptions.find((option) => option.value === settings.fontFamily)?.stack ?? ''
  const reflowStyle: React.CSSProperties = {
    fontSize: `${settings.fontSize}%`,
    lineHeight: settings.lineHeight,
    fontFamily: fontStack || undefined,
    textAlign: settings.textAlign === 'default' ? undefined : settings.textAlign,
    opacity: settings.fontOpacity / 100,
  }

  return (
    <div className={`reader${chrome.chromeHidden ? ' chrome-hidden' : ''}`}>
      {settings.fontFamily === 'literata' && <style>{literataFontFaces()}</style>}

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
            className={`icon-btn ${chrome.panel === 'toc' ? 'active' : ''}`}
            onClick={() => chrome.togglePanel('toc')}
            aria-label="Daftar isi"
          >
            ☰
          </button>
          <button
            className={`icon-btn ${chrome.panel === 'settings' ? 'active' : ''}`}
            onClick={() => chrome.togglePanel('settings')}
            aria-label="Pengaturan"
          >
            Aa
          </button>
          <FullscreenButton />
        </div>
      </header>

      <div className="reader-body">
        {chrome.panel === 'toc' && (
          <aside className="reader-sidebar">
            <PdfToc items={outline} currentPage={view.page} onSelect={view.setPage} />
          </aside>
        )}

        <div
          className="reader-stage pdf-stage"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {settings.pdfReflow ? (
            <div className="pdf-reflow" ref={reflowRef} onScroll={handleReflowScroll}>
              <div className="pdf-reflow-inner" style={reflowStyle}>
                {reflow.sections.map((section) => (
                  <section key={section.page} className="pdf-reflow-page">
                    {section.blocks.map((block, index) =>
                      block.kind === 'heading' ? (
                        <h3 key={index}>{block.text}</h3>
                      ) : (
                        <p key={index}>{block.text}</p>
                      ),
                    )}
                  </section>
                ))}
                {reflow.sections.length === 0 && <p className="pdf-reflow-status">Menyiapkan teks…</p>}
              </div>
              {reflow.loaded < reflow.total && (
                <div className="pdf-reflow-progress">
                  Menyalin teks {reflow.loaded}/{reflow.total}…
                </div>
              )}
            </div>
          ) : (
            <div className="pdf-spread" data-columns={view.columns}>
              {pageNumbers.map((pageNumber) => (
                <PdfPage
                  key={pageNumber}
                  page={pageProxies[pageNumber] ?? null}
                  crop={settings.pdfCrop}
                  cropMargin={settings.pdfCropMargin}
                  zoom={settings.pdfZoom}
                />
              ))}
              {pageNumbers.length === 0 && !loading && !error && (
                <div className="reader-overlay">Tidak ada halaman.</div>
              )}
            </div>
          )}

          {loading && <div className="reader-overlay">Memuat PDF…</div>}
          {error && <div className="reader-overlay error">{error}</div>}
        </div>

        {chrome.panel === 'settings' && (
          <aside className="reader-sidebar settings-sidebar">
            <PdfSettingsPanel settings={settings} onChange={onSettingsChange} />
          </aside>
        )}
      </div>

      <footer className="reader-bottom">
        <button
          className="nav-btn"
          onClick={() => (settings.pdfReflow ? scrollReflow(-1) : view.goPrev())}
          disabled={!settings.pdfReflow && !view.canPrev}
          aria-label="Sebelumnya"
        >
          ‹
        </button>
        <div className="progress-track" role="progressbar" aria-valuenow={Math.round(displayPercentage * 100)}>
          <div className="progress-fill" style={{ width: `${Math.min(100, displayPercentage * 100)}%` }} />
        </div>
        <span className="progress-label">
          {settings.pdfReflow
            ? `${Math.round(displayPercentage * 100)}%`
            : `${view.page}/${view.numPages}`}
        </span>
        <button
          className="nav-btn"
          onClick={() => (settings.pdfReflow ? scrollReflow(1) : view.goNext())}
          disabled={!settings.pdfReflow && !view.canNext}
          aria-label="Berikutnya"
        >
          ›
        </button>
      </footer>

      {settings.debugMode && (
        <DebugPanel log={[`PDF: ${view.numPages} halaman`, `kolom: ${view.columns}`]} />
      )}
    </div>
  )
}
