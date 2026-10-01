import type { Book, Rendition } from 'epubjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { searchBook } from '../lib/search'
import type { SearchResult } from '../lib/search'

export type SearchStatus = 'idle' | 'searching' | 'done' | 'error'

const SEARCH_LIMIT = 100

interface ElementRef<T> {
  current: T | null
}

function currentSectionIndices(rendition: Rendition | null): Set<number> {
  if (!rendition) return new Set()
  const contents = rendition.getContents() as unknown as { sectionIndex: number }[]
  return new Set(contents.map((content) => content.sectionIndex))
}

export function useBookSearch(bookRef: ElementRef<Book>, renditionRef: ElementRef<Rendition>) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [progress, setProgress] = useState({ scanned: 0, total: 0 })
  const runIdRef = useRef(0)

  const run = useCallback(async () => {
    const book = bookRef.current
    const term = query.trim()
    if (!book || !term) {
      setResults([])
      setStatus('idle')
      return
    }

    const runId = ++runIdRef.current
    setStatus('searching')
    setResults([])
    setProgress({ scanned: 0, total: 0 })

    try {
      const found = await searchBook(book, term, {
        limit: SEARCH_LIMIT,
        isCancelled: () => runId !== runIdRef.current,
        protectedSections: currentSectionIndices(renditionRef.current),
        onProgress: (scanned, total) => {
          if (runId === runIdRef.current) setProgress({ scanned, total })
        },
      })
      if (runId !== runIdRef.current) return
      setResults(found)
      setStatus('done')
    } catch {
      if (runId !== runIdRef.current) return
      setStatus('error')
    }
  }, [bookRef, renditionRef, query])

  const clear = useCallback(() => {
    runIdRef.current += 1
    setQuery('')
    setResults([])
    setStatus('idle')
    setProgress({ scanned: 0, total: 0 })
  }, [])

  useEffect(
    () => () => {
      runIdRef.current += 1
    },
    [],
  )

  return { query, setQuery, results, status, progress, run, clear }
}
