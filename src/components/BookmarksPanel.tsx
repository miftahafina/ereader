import type { BookmarkRecord, BookFormat } from '../lib/types'
import { BookmarkIcon } from './BookmarkIcon'

interface BookmarksPanelProps {
  bookmarks: BookmarkRecord[]
  format: BookFormat
  loading: boolean
  error: string | null
  onAdd: () => void
  onSelect: (bookmark: BookmarkRecord) => void
  onDelete: (id: string) => void
}

export function BookmarksPanel({
  bookmarks,
  format,
  loading,
  error,
  onAdd,
  onSelect,
  onDelete,
}: BookmarksPanelProps) {
  return (
    <div className="bookmarks-panel">
      <div className="bookmarks-heading">
        <h2>Bookmark {format.toUpperCase()}</h2>
        <button className="bookmark-add" onClick={onAdd} aria-label="Simpan posisi saat ini">
          <BookmarkIcon />
          Simpan
        </button>
      </div>
      {error && <p className="bookmarks-message error">{error}</p>}
      {loading ? (
        <p className="bookmarks-message">Memuat bookmark…</p>
      ) : bookmarks.length === 0 ? (
        <p className="bookmarks-message">Belum ada bookmark.</p>
      ) : (
        <ul className="bookmark-list">
          {bookmarks.map((bookmark) => (
            <li className="bookmark-row" key={bookmark.id}>
              <button className="bookmark-item" onClick={() => onSelect(bookmark)}>
                <BookmarkIcon filled />
                <span>
                  <strong>{bookmark.label}</strong>
                  <small>{new Date(bookmark.createdAt).toLocaleDateString()}</small>
                </span>
              </button>
              <button
                className="bookmark-delete"
                onClick={() => onDelete(bookmark.id)}
                aria-label={`Hapus bookmark ${bookmark.label}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
