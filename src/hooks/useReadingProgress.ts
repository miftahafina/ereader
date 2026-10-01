import { useCallback, useEffect, useRef } from 'react'
import { getProgress, saveProgress } from '../lib/db'

export function useReadingProgress(bookId: string) {
  const latestRef = useRef<{ cfi: string; percentage: number } | null>(null)
  const timerRef = useRef<number | null>(null)

  const load = useCallback(() => getProgress(bookId), [bookId])

  const schedule = useCallback(
    (cfi: string, percentage: number) => {
      latestRef.current = { cfi, percentage }
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        void saveProgress({ id: bookId, cfi, percentage, updatedAt: Date.now() })
      }, 600)
    },
    [bookId],
  )

  const flush = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const latest = latestRef.current
    if (latest) {
      void saveProgress({
        id: bookId,
        cfi: latest.cfi,
        percentage: latest.percentage,
        updatedAt: Date.now(),
      })
    }
  }, [bookId])

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    },
    [],
  )

  return { load, schedule, flush }
}
