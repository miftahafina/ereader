import type { PDFDocumentProxy } from 'pdfjs-dist'
import { useEffect, useState } from 'react'
import { extractReflowBlocks, type ReflowBlock } from '../lib/pdf-reflow'

export interface ReflowSection {
  page: number
  blocks: ReflowBlock[]
}

export function usePdfReflow(doc: PDFDocumentProxy | null, enabled: boolean) {
  const [sections, setSections] = useState<ReflowSection[]>([])
  const [loaded, setLoaded] = useState(0)

  useEffect(() => {
    if (!enabled || !doc) {
      // oxlint-disable-next-line react/set-state-in-effect -- reset progresi saat reflow dimatikan
      setSections([])
      setLoaded(0)
      return
    }

    let cancelled = false
    const target = doc
    const total = target.numPages

    async function run() {
      for (let pageNumber = 1; pageNumber <= total; pageNumber += 1) {
        if (cancelled) return
        let blocks: ReflowBlock[] = []
        try {
          const page = await target.getPage(pageNumber)
          blocks = await extractReflowBlocks(page)
          page.cleanup()
        } catch {
          blocks = []
        }
        if (cancelled) return
        setSections((previous) => [...previous, { page: pageNumber, blocks }])
        setLoaded(pageNumber)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [doc, enabled])

  return { sections, loaded, total: doc?.numPages ?? 0 }
}
