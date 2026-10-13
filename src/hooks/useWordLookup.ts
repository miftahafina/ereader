import type { Contents } from 'epubjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchDefinition } from '../lib/dictionary'
import type { WordDefinition } from '../lib/dictionary'
import { fetchTranslations } from '../lib/translate'
import type { TranslationResult } from '../lib/translate'

interface TranslationSettingsRef {
  current: { translateTo: string }
}

export interface WordPopupState {
  id: number
  selectedText: string
  x: number
  y: number
  below: boolean
  definitionStatus: 'none' | 'loading' | 'done' | 'error'
  definition?: WordDefinition
  translationStatus: 'loading' | 'done' | 'error'
  translation?: TranslationResult
}

function extractWord(text: string): string | null {
  const word = text.replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu, '')
  if (!word || /\s/.test(word)) return null
  return word
}

export function useWordLookup(settingsRef: TranslationSettingsRef) {
  const [popup, setPopup] = useState<WordPopupState | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

  const close = useCallback(() => {
    requestIdRef.current += 1
    abortRef.current?.abort()
    setPopup(null)
  }, [])

  const handleSelection = useCallback(
    (contents: Contents) => {
      const selection = contents.window.getSelection()
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return
      const selectedText = selection.toString().trim()
      if (!selectedText) {
        setPopup(null)
        return
      }
      const word = extractWord(selectedText)
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const frameRect = contents.window.frameElement?.getBoundingClientRect()
      const x = rect.left + (frameRect?.left ?? 0) + rect.width / 2
      const top = rect.top + (frameRect?.top ?? 0)
      const below = top < 170

      requestIdRef.current += 1
      const requestId = requestIdRef.current
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setPopup({
        id: requestId,
        selectedText,
        x,
        y: below ? top + rect.height : top,
        below,
        definitionStatus: word ? 'loading' : 'none',
        translationStatus: 'loading',
      })

      if (contents.window.matchMedia('(pointer: coarse)').matches) {
        selection.removeAllRanges()
      }

      if (word) {
        void fetchDefinition(word.toLowerCase(), controller.signal)
          .then((definition) => {
            if (controller.signal.aborted) return
            setPopup((prev) =>
              prev && prev.id === requestId
                ? {
                    ...prev,
                    definitionStatus: definition ? 'done' : 'error',
                    definition: definition ?? undefined,
                  }
                : prev,
            )
          })
          .catch(() => {
            if (controller.signal.aborted) return
            setPopup((prev) =>
              prev && prev.id === requestId ? { ...prev, definitionStatus: 'error' } : prev,
            )
          })
      }

      void fetchTranslations([selectedText], settingsRef.current.translateTo, controller.signal)
        .then(([translation]) => {
          if (controller.signal.aborted) return
          setPopup((prev) =>
            prev && prev.id === requestId
              ? {
                  ...prev,
                  translationStatus: translation ? 'done' : 'error',
                  translation: translation ?? undefined,
                }
              : prev,
          )
        })
        .catch(() => {
          if (controller.signal.aborted) return
          setPopup((prev) =>
            prev && prev.id === requestId ? { ...prev, translationStatus: 'error' } : prev,
          )
        })
    },
    [settingsRef],
  )

  useEffect(() => () => abortRef.current?.abort(), [])

  return { popup, close, handleSelection }
}
