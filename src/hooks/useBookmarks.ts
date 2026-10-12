import { useCallback, useEffect, useState } from 'react'
import { deleteBookmark, listBookmarks, saveBookmark } from '../lib/db'
import type { BookmarkRecord } from '../lib/types'

type NewBookmark = Omit<BookmarkRecord, 'id' | 'bookId' | 'createdAt'>

export function useBookmarks(bookId: string) {
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([])
  const [loadedBookId, setLoadedBookId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void listBookmarks(bookId).then((records) => {
      if (!active) return
      setBookmarks(records)
      setError(null)
      setLoadedBookId(bookId)
    }).catch(() => {
      if (!active) return
      setError('Bookmark gagal dimuat.')
      setLoadedBookId(bookId)
    })
    return () => {
      active = false
    }
  }, [bookId])

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

  return { bookmarks, loading: loadedBookId !== bookId, error, add, remove }
}
