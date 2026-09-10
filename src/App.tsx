import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Library } from './components/Library'
import { useFileDrop } from './hooks/useFileDrop'
import { addBook, deleteBook, getAllProgress, listBooks } from './lib/db'
import { sampleBooks } from './lib/samples'
import { loadSettings, saveSettings } from './lib/settings'
import type { BookMeta, ProgressRecord, ReaderSettings } from './lib/types'

const Reader = lazy(() =>
  import('./components/Reader').then((module) => ({ default: module.Reader })),
)

type View = { type: 'library' } | { type: 'reader'; id: string }

const isEpub = (file: File) =>
  file.name.toLowerCase().endsWith('.epub') || file.type === 'application/epub+zip'

export default function App() {
  const [settings, setSettings] = useState<ReaderSettings>(() => loadSettings())
  const [books, setBooks] = useState<BookMeta[]>([])
  const [progress, setProgress] = useState<Record<string, ProgressRecord>>({})
  const [view, setView] = useState<View>({ type: 'library' })
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [list, progressMap] = await Promise.all([listBooks(), getAllProgress()])
    setBooks(list)
    setProgress(progressMap)
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- memuat data dari IndexedDB (sistem eksternal)
    void refresh()
  }, [refresh])

  useEffect(() => {
    saveSettings(settings)
    document.documentElement.dataset.theme = settings.theme

    const themeColors: Record<string, string> = {
      light: '#fbfbfd',
      sepia: '#f4ead5',
      dark: '#000000',
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColors[settings.theme] || themeColors.light)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = themeColors[settings.theme] || themeColors.light
      document.head.appendChild(meta)
    }
  }, [settings])

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), 4000)
    return () => window.clearTimeout(timer)
  }, [message])

  const handleImport = useCallback(
    async (files: File[]) => {
      const epubs = files.filter(isEpub)
      const rejected = files.length - epubs.length
      if (epubs.length === 0) {
        setMessage('Hanya file .epub yang didukung.')
        return
      }

      setImporting(true)
      const { extractMetadata } = await import('./lib/epub')
      let added = 0
      const failed: string[] = []

      for (const file of epubs) {
        try {
          const data = await file.arrayBuffer()
          const meta = await extractMetadata(data.slice(0))
          await addBook({
            id: crypto.randomUUID(),
            title: meta.title,
            author: meta.author,
            fileName: file.name,
            size: file.size,
            addedAt: Date.now(),
            cover: meta.cover,
            data,
          })
          added += 1
        } catch {
          failed.push(file.name)
        }
      }

      await refresh()
      setImporting(false)

      const parts = [`${added} buku ditambahkan`]
      if (rejected > 0) parts.push(`${rejected} file diabaikan`)
      if (failed.length > 0) parts.push(`${failed.length} gagal dibuka`)
      setMessage(parts.join(', '))
    },
    [refresh],
  )

  const handleLoadSamples = useCallback(async () => {
    const existing = new Set(books.map((book) => book.fileName))
    const pending = sampleBooks.filter((sample) => !existing.has(sample.fileName))
    if (pending.length === 0) {
      setMessage('Buku sampel sudah ada di perpustakaan.')
      return
    }

    setImporting(true)
    const files: File[] = []
    for (const sample of pending) {
      try {
        const response = await fetch(sample.url)
        if (!response.ok) continue
        const blob = await response.blob()
        files.push(new File([blob], sample.fileName, { type: 'application/epub+zip' }))
      } catch {
        // lewati sampel yang gagal diunduh
      }
    }
    setImporting(false)

    if (files.length === 0) {
      setMessage('Gagal memuat buku sampel.')
      return
    }
    await handleImport(files)
  }, [books, handleImport])

  const handleDelete = useCallback(
    async (id: string) => {
      const book = books.find((item) => item.id === id)
      if (!window.confirm(`Hapus "${book?.title ?? 'buku ini'}" dari perpustakaan?`)) return
      await deleteBook(id)
      await refresh()
    },
    [books, refresh],
  )

  const handleSettingsChange = useCallback((patch: Partial<ReaderSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const handleDrop = useCallback(
    (files: File[]) => {
      void handleImport(files)
    },
    [handleImport],
  )

  const isDragging = useFileDrop(handleDrop)

  const content = useMemo(() => {
    if (view.type === 'reader') {
      return (
        <Suspense fallback={<div className="reader-overlay">Menyiapkan pembaca…</div>}>
          <Reader
            key={view.id}
            bookId={view.id}
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onClose={() => {
              setView({ type: 'library' })
              void refresh()
            }}
          />
        </Suspense>
      )
    }
    return (
      <Library
        books={books}
        progress={progress}
        importing={importing}
        onOpen={(id) => setView({ type: 'reader', id })}
        onDelete={handleDelete}
        onImport={handleImport}
        onLoadSamples={handleLoadSamples}
      />
    )
  }, [view, settings, handleSettingsChange, books, progress, importing, handleDelete, handleImport, handleLoadSamples, refresh])

  return (
    <div className="app" data-view={view.type}>
      {content}

      {isDragging && (
        <div className="drop-overlay">
          <div className="drop-box">
            <div className="drop-icon">⬇</div>
            <strong>Lepaskan file EPUB di sini</strong>
          </div>
        </div>
      )}

      {message && <div className="toast">{message}</div>}
    </div>
  )
}
