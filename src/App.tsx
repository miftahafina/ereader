import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { Library } from './components/Library'
import { useFileDrop } from './hooks/useFileDrop'
import { useLibrary } from './hooks/useLibrary'
import { useReaderSettings } from './hooks/useReaderSettings'
import { useTheme } from './hooks/useTheme'
import type { BookFormat } from './lib/types'

const Reader = lazy(() =>
  import('./components/Reader').then((module) => ({ default: module.Reader })),
)

const PdfReader = lazy(() =>
  import('./components/PdfReader').then((module) => ({ default: module.PdfReader })),
)

type View = { type: 'library' } | { type: 'reader'; id: string; format: BookFormat }

export default function App() {
  const { settings, update: updateSettings } = useReaderSettings()
  const { books, progress, importing, message, refresh, importFiles, loadSamples, remove } =
    useLibrary()
  const [view, setView] = useState<View>({ type: 'library' })

  useTheme(settings.theme)

  const handleDrop = useCallback(
    (files: File[]) => {
      void importFiles(files)
    },
    [importFiles],
  )

  const isDragging = useFileDrop(handleDrop)

  const openBook = useCallback(
    (id: string) => {
      const book = books.find((item) => item.id === id)
      setView({ type: 'reader', id, format: book?.format ?? 'epub' })
    },
    [books],
  )

  const content = useMemo(() => {
    if (view.type === 'reader') {
      const isPdf = view.format === 'pdf'
      return (
        <Suspense fallback={<div className="reader-overlay">Menyiapkan pembaca…</div>}>
          {isPdf ? (
            <PdfReader
              key={view.id}
              bookId={view.id}
              settings={settings}
              onSettingsChange={updateSettings}
              onClose={() => {
                setView({ type: 'library' })
                void refresh()
              }}
            />
          ) : (
            <Reader
              key={view.id}
              bookId={view.id}
              settings={settings}
              onSettingsChange={updateSettings}
              onClose={() => {
                setView({ type: 'library' })
                void refresh()
              }}
            />
          )}
        </Suspense>
      )
    }
    return (
      <Library
        books={books}
        progress={progress}
        importing={importing}
        onOpen={openBook}
        onDelete={remove}
        onImport={importFiles}
        onLoadSamples={loadSamples}
      />
    )
  }, [view, settings, updateSettings, books, progress, importing, remove, importFiles, loadSamples, refresh, openBook])

  return (
    <div className="app" data-view={view.type}>
      {content}

      {isDragging && (
        <div className="drop-overlay">
          <div className="drop-box">
            <div className="drop-icon">⬇</div>
            <strong>Lepaskan file EPUB atau PDF di sini</strong>
          </div>
        </div>
      )}

      {message && <div className="toast">{message}</div>}
    </div>
  )
}
