import type { PDFDocumentProxy } from 'pdfjs-dist'
import { useEffect, useState } from 'react'
import { getBook } from '../lib/db'
import { getPdfOutline, loadPdfDocument, type PdfOutlineItem } from '../lib/pdf'
import type { BookRecord } from '../lib/types'

export function usePdfDocument(bookId: string) {
  const [record, setRecord] = useState<BookRecord | null>(null)
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [outline, setOutline] = useState<PdfOutlineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let local: PDFDocumentProxy | null = null

    async function init() {
      setLoading(true)
      setError(null)
      setDoc(null)
      setOutline([])

      const loaded = await getBook(bookId)
      if (cancelled) return
      if (!loaded) {
        setError('Buku tidak ditemukan.')
        setLoading(false)
        return
      }
      setRecord(loaded)

      try {
        const pdf = await loadPdfDocument(loaded.data)
        if (cancelled) {
          void pdf.loadingTask.destroy()
          return
        }
        local = pdf
        setDoc(pdf)
        setLoading(false)

        const items = await getPdfOutline(pdf)
        if (!cancelled) setOutline(items)
      } catch {
        if (!cancelled) {
          setError('Gagal membuka PDF.')
          setLoading(false)
        }
      }
    }

    void init()
    return () => {
      cancelled = true
      void local?.loadingTask.destroy()
    }
  }, [bookId])

  return { record, doc, outline, loading, error }
}
