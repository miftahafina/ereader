import { useCallback, useEffect, useState } from 'react'
import { deleteBookmark, listBookmarks, saveBookmark } from '../lib/db'
import type { BookmarkRecord, BookFormat } from '../lib/types'

type NewBookmark = Omit<BookmarkRecord, 'id' | 'bookId' | 'createdAt'>

export function useBookmarks(bookId: string) {
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setBookmarks(await listBookmarks(bookId))
      setError(null)
    } catch {
      setError('Bookmark gagal dimuat.')
    } finally {
      setLoading(false)
    }
  }, [bookId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const add = useCallback(async (bookmark: NewBookmark) => {
    const id = crypto.randomUUID()
    const record: BookmarkRecord = {
      ...bookmark,
      id,
      bookId,
      createdAt: Date.now(),
    }
    await saveBookmark(record)
    setBookmarks((current) => [record, ...current])
    setError(null)
  }, [bookId])

  const remove = useCallback(async (id: string) => {
    await deleteBookmark(id)
    setBookmarks((current) => current.filter((bookmark) => bookmark.id !== id))
  }, [])

  return { bookmarks, loading, error, add, remove, refresh }
}

export function bookmarkFormatLabel(format: BookFormat) {
  return format === 'epub' ? 'Posisi' : 'Halaman'
}
