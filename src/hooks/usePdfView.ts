import type { PDFDocumentProxy } from 'pdfjs-dist'
import { useCallback, useState } from 'react'
import type { ReaderSettings } from '../lib/types'
import { useMediaQuery } from './useMediaQuery'

export function usePdfView(doc: PDFDocumentProxy | null, settings: ReaderSettings) {
  const isWide = useMediaQuery('(min-width: 900px)')
  const [pageState, setPageState] = useState(1)

  const numPages = doc?.numPages ?? 0
  const columns =
    settings.pdfSpread === 'double' ? 2 : settings.pdfSpread === 'single' ? 1 : isWide ? 2 : 1

  const normalize = useCallback(
    (value: number, cols: number) => {
      const max = Math.max(1, numPages)
      const clamped = Math.min(Math.max(1, value), max)
      if (cols <= 1) return clamped
      return clamped - ((clamped - 1) % cols)
    },
    [numPages],
  )

  const page = normalize(pageState, columns)

  const setPage = useCallback(
    (value: number) => setPageState(normalize(value, columns)),
    [normalize, columns],
  )

  const goNext = useCallback(() => {
    setPageState((current) => normalize(normalize(current, columns) + columns, columns))
  }, [normalize, columns])

  const goPrev = useCallback(() => {
    setPageState((current) => normalize(normalize(current, columns) - columns, columns))
  }, [normalize, columns])

  const canPrev = page > 1
  const canNext = columns === 1 ? page < numPages : page + columns <= numPages
  const percentage = numPages <= 1 ? 0 : (page - 1) / (numPages - 1)

  const pages: number[] = []
  for (let index = 0; index < columns; index += 1) {
    const candidate = page + index
    if (candidate <= numPages) pages.push(candidate)
  }

  return { page, setPage, goNext, goPrev, canPrev, canNext, columns, numPages, percentage, pages }
}
