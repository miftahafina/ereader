import { useCallback, useEffect, useState } from 'react'
import { deleteBookmark, listBookmarks, saveBookmark } from '../lib/db'
import type { BookmarkRecord } from '../lib/types'

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
    try {
      const record: BookmarkRecord = {
        ...bookmark,
        id: crypto.randomUUID(),
        bookId,
        createdAt: Date.now(),
      }
      await saveBookmark(record)
      setBookmarks((current) => [record, ...current])
      setError(null)
    } catch {
      setError('Bookmark gagal disimpan.')
    }
  }, [bookId])

  const remove = useCallback(async (id: string) => {
    try {
      await deleteBookmark(id)
      setBookmarks((current) => current.filter((bookmark) => bookmark.id !== id))
      setError(null)
    } catch {
      setError('Bookmark gagal dihapus.')
    }
  }, [])

  return { bookmarks, loading, error, add, remove, refresh }
}
