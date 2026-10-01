import { useCallback, useEffect, useState } from 'react'
import { addBook, deleteBook, getAllProgress, listBooks } from '../lib/db'
import { sampleBooks } from '../lib/samples'
import type { BookMeta, ProgressRecord } from '../lib/types'

const isEpub = (file: File) =>
  file.name.toLowerCase().endsWith('.epub') || file.type === 'application/epub+zip'

export function useLibrary() {
  const [books, setBooks] = useState<BookMeta[]>([])
  const [progress, setProgress] = useState<Record<string, ProgressRecord>>({})
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
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), 4000)
    return () => window.clearTimeout(timer)
  }, [message])

  const importFiles = useCallback(
    async (files: File[]) => {
      const epubs = files.filter(isEpub)
      const rejected = files.length - epubs.length
      if (epubs.length === 0) {
        setMessage('Hanya file .epub yang didukung.')
        return
      }

      setImporting(true)
      const { extractMetadata } = await import('../lib/epub')
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

  const loadSamples = useCallback(async () => {
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
    await importFiles(files)
  }, [books, importFiles])

  const remove = useCallback(
    async (id: string) => {
      const book = books.find((item) => item.id === id)
      if (!window.confirm(`Hapus "${book?.title ?? 'buku ini'}" dari perpustakaan?`)) return
      await deleteBook(id)
      await refresh()
    },
    [books, refresh],
  )

  return { books, progress, importing, message, refresh, importFiles, loadSamples, remove }
}
