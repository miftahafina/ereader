import type { Contents } from 'epubjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchDefinition } from '../lib/dictionary'
import type { WordDefinition } from '../lib/dictionary'

export interface WordPopupState {
  word: string
  x: number
  y: number
  below: boolean
  status: 'loading' | 'done' | 'error'
  definition?: WordDefinition
}

function extractWord(text: string): string | null {
  const word = text.replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu, '')
  if (!word || /\s/.test(word)) return null
  return word
}

export function useWordLookup() {
  const [popup, setPopup] = useState<WordPopupState | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const close = useCallback(() => {
    abortRef.current?.abort()
    setPopup(null)
  }, [])

  const handleSelection = useCallback((contents: Contents) => {
    const selection = contents.window.getSelection()
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return
    const word = extractWord(selection.toString())
    if (!word) {
      setPopup(null)
      return
    }
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const frameRect = contents.window.frameElement?.getBoundingClientRect()
    const x = rect.left + (frameRect?.left ?? 0) + rect.width / 2
    const top = rect.top + (frameRect?.top ?? 0)
    const below = top < 170

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setPopup({
      word,
      x,
      y: below ? top + rect.height : top,
      below,
      status: 'loading',
    })

    if (contents.window.matchMedia('(pointer: coarse)').matches) {
      selection.removeAllRanges()
    }

    void fetchDefinition(word.toLowerCase(), controller.signal)
      .then((definition) => {
        setPopup((prev) =>
          prev && prev.word === word
            ? { ...prev, status: definition ? 'done' : 'error', definition: definition ?? undefined }
            : prev,
        )
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setPopup((prev) => (prev && prev.word === word ? { ...prev, status: 'error' } : prev))
      })
  }, [])

  useEffect(() => () => abortRef.current?.abort(), [])

  return { popup, close, handleSelection }
}
