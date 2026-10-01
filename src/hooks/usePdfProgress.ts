import { useCallback, useEffect, useRef } from 'react'
import { getProgress, saveProgress } from '../lib/db'

export function usePdfProgress(bookId: string) {
  const latestRef = useRef<{ page: number; percentage: number } | null>(null)
  const timerRef = useRef<number | null>(null)

  const load = useCallback(async () => {
    const record = await getProgress(bookId)
    return record?.page ?? 1
  }, [bookId])

  const schedule = useCallback(
    (page: number, percentage: number) => {
      latestRef.current = { page, percentage }
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        const latest = latestRef.current
        if (!latest) return
        void saveProgress({
          id: bookId,
          page: latest.page,
          percentage: latest.percentage,
          updatedAt: Date.now(),
        })
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
        page: latest.page,
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
