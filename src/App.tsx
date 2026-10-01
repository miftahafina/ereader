import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { Library } from './components/Library'
import { useFileDrop } from './hooks/useFileDrop'
import { useLibrary } from './hooks/useLibrary'
import { useReaderSettings } from './hooks/useReaderSettings'
import { useTheme } from './hooks/useTheme'

const Reader = lazy(() =>
  import('./components/Reader').then((module) => ({ default: module.Reader })),
)

type View = { type: 'library' } | { type: 'reader'; id: string }

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

  const content = useMemo(() => {
    if (view.type === 'reader') {
      return (
        <Suspense fallback={<div className="reader-overlay">Menyiapkan pembaca…</div>}>
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
        </Suspense>
      )
    }
    return (
      <Library
        books={books}
        progress={progress}
        importing={importing}
        onOpen={(id) => setView({ type: 'reader', id })}
        onDelete={remove}
        onImport={importFiles}
        onLoadSamples={loadSamples}
      />
    )
  }, [view, settings, updateSettings, books, progress, importing, remove, importFiles, loadSamples, refresh])

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
