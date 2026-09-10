import { useRef } from 'react'
import type { BookMeta, ProgressRecord } from '../lib/types'
import { FullscreenButton } from './FullscreenButton'

interface LibraryProps {
  books: BookMeta[]
  progress: Record<string, ProgressRecord>
  importing: boolean
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onImport: (files: File[]) => void
  onLoadSamples: () => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function Library({
  books,
  progress,
  importing,
  onOpen,
  onDelete,
  onImport,
  onLoadSamples,
}: LibraryProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="library">
      <header className="library-top">
        <div>
          <h1 className="library-title">Perpustakaan</h1>
          <p className="library-subtitle">
            {books.length > 0 ? `${books.length} buku tersimpan di perangkat ini` : 'Belum ada buku'}
          </p>
        </div>
        <div className="library-actions">
          <FullscreenButton />
          <button className="primary-btn" onClick={() => inputRef.current?.click()} disabled={importing}>
            {importing ? 'Mengimpor…' : '+ Tambah EPUB'}
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".epub,application/epub+zip"
          multiple
          hidden
          onChange={(event) => {
            const files = event.target.files
            if (files && files.length > 0) onImport(Array.from(files))
            event.target.value = ''
          }}
        />
      </header>

      {books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h2>Seret &amp; lepas file EPUB ke sini</h2>
          <p>Semua file diproses langsung di browser dan tidak diunggah ke mana pun.</p>
          <div className="empty-actions">
            <button className="primary-btn" onClick={() => inputRef.current?.click()}>
              Pilih file EPUB
            </button>
            <button className="ghost-btn" onClick={onLoadSamples} disabled={importing}>
              {importing ? 'Memuat…' : 'Baca buku sampel'}
            </button>
          </div>
        </div>
      ) : (
        <ul className="book-grid">
          {books.map((book) => {
            const pct = Math.round((progress[book.id]?.percentage ?? 0) * 100)
            return (
              <li key={book.id} className="book-card">
                <button className="book-cover" onClick={() => onOpen(book.id)}>
                  {book.cover ? (
                    <img src={book.cover} alt="" loading="lazy" />
                  ) : (
                    <span className="book-cover-fallback">{book.title.slice(0, 1).toUpperCase()}</span>
                  )}
                </button>
                <div className="book-info">
                  <button className="book-open" onClick={() => onOpen(book.id)}>
                    <span className="book-title">{book.title}</span>
                    <span className="book-author">{book.author}</span>
                  </button>
                  <div className="book-meta">
                    <span>{formatSize(book.size)}</span>
                    <span>{pct > 0 ? `${pct}% dibaca` : 'Belum dibaca'}</span>
                  </div>
                  <div className="book-progress">
                    <div className="book-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => onDelete(book.id)}
                  aria-label={`Hapus ${book.title}`}
                  title="Hapus"
                >
                  ✕
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
