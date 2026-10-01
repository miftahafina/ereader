import type { Contents, Rendition } from 'epubjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchTranslations } from '../lib/translate'
import {
  applyTranslation,
  collectSectionBlocks,
  expandContents,
  findCurrentContents,
  isTranslated,
  pruneOriginals,
  restoreTranslations,
} from '../lib/translate-dom'
import type { ReaderSettings } from '../lib/types'
import type { LatestRef } from './useLatest'

export type TranslateState = 'idle' | 'loading' | 'done' | 'error'

interface RenditionRef {
  current: Rendition | null
}

export function useSectionTranslation(
  renditionRef: RenditionRef,
  settingsRef: LatestRef<ReaderSettings>,
) {
  const [state, setState] = useState<TranslateState>('idle')
  const [note, setNote] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const originalsRef = useRef<Map<HTMLElement, string>>(new Map())
  const activeRef = useRef(false)
  const stateRef = useRef<TranslateState>('idle')
  const currentSectionRef = useRef<number | null>(null)
  const runRef = useRef(0)
  const noteTimerRef = useRef<number | null>(null)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(
    () => () => {
      if (noteTimerRef.current) window.clearTimeout(noteTimerRef.current)
    },
    [],
  )

  const reflowSection = useCallback(
    (contents: Contents) => {
      window.requestAnimationFrame(() => {
        expandContents(contents)
        window.setTimeout(() => {
          void renditionRef.current?.reportLocation()
        }, 80)
      })
    },
    [renditionRef],
  )

  const run = useCallback(async () => {
    const rendition = renditionRef.current
    if (!rendition) return
    const contents = findCurrentContents(rendition)
    if (!contents) {
      setState('error')
      return
    }
    const blocks = collectSectionBlocks(contents.window.document)
    if (blocks.length === 0) {
      setState('error')
      return
    }
    currentSectionRef.current = contents.sectionIndex

    if (blocks.every((block) => isTranslated(block))) {
      setState('done')
      return
    }

    const runId = ++runRef.current
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setState('loading')

    const texts = blocks.map((block) => (block.textContent ?? '').trim())
    const results = await fetchTranslations(texts, settingsRef.current.translateTo, controller.signal)
    if (controller.signal.aborted || runId !== runRef.current) return

    let failed = 0
    results.forEach((result, index) => {
      if (result) {
        applyTranslation(blocks[index], result.translated, originalsRef.current)
      } else {
        failed += 1
      }
    })
    pruneOriginals(originalsRef.current)

    reflowSection(contents)
    setState(failed === results.length ? 'error' : 'done')
    if (failed > 0) {
      setNote('Sebagian teks gagal diterjemahkan.')
      noteTimerRef.current = window.setTimeout(() => setNote(null), 4000)
    }
  }, [renditionRef, settingsRef, reflowSection])

  const stop = useCallback(() => {
    runRef.current += 1
    abortRef.current?.abort()
    const rendition = renditionRef.current
    if (rendition) {
      restoreTranslations(rendition, originalsRef.current)
    } else {
      originalsRef.current.clear()
    }
    activeRef.current = false
    setState('idle')
  }, [renditionRef])

  const toggle = useCallback(() => {
    if (state === 'loading' || state === 'done') {
      stop()
      return
    }
    activeRef.current = true
    void run()
  }, [state, stop, run])

  const handleRelocated = useCallback(
    (sectionIndex: number | null) => {
      if (!activeRef.current || stateRef.current !== 'done') return
      if (sectionIndex === null || sectionIndex === currentSectionRef.current) return
      currentSectionRef.current = sectionIndex
      void run()
    },
    [run],
  )

  const deactivate = useCallback(() => {
    activeRef.current = false
  }, [])

  const abort = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return { state, note, toggle, run, stop, handleRelocated, deactivate, abort }
}
