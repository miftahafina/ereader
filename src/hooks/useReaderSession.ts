import type { Rendition } from 'epubjs'
import { useCallback, useEffect, useRef } from 'react'
import { applyReaderTheme } from '../lib/reader-theme'
import type { ReaderSettings } from '../lib/types'
import { useEpubRendition } from './useEpubRendition'
import { useLatest } from './useLatest'
import { useMediaQuery } from './useMediaQuery'
import { useReaderChrome } from './useReaderChrome'
import { useReaderLayout } from './useReaderLayout'
import { useReaderNavigation } from './useReaderNavigation'
import { useReaderTts } from './useReaderTts'
import { useSectionTranslation } from './useSectionTranslation'
import { useWordLookup } from './useWordLookup'

export function useReaderSession(bookId: string, settings: ReaderSettings) {
  const settingsRef = useLatest(settings)
  const isCoarse = useMediaQuery('(pointer: coarse)')

  const viewerRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const renditionRef = useRef<Rendition | null>(null)

  const chrome = useReaderChrome()
  const wordLookup = useWordLookup()
  const tts = useReaderTts(renditionRef, settingsRef)
  const translation = useSectionTranslation(renditionRef, settingsRef)

  const { setShowToc } = chrome
  const { close: closeWord, handleSelection } = wordLookup
  const {
    handleRelocated,
    abort: abortTranslation,
    deactivate: deactivateTranslation,
  } = translation

  const navigation = useReaderNavigation({
    renditionRef,
    viewerRef,
    isCoarse,
    onEscape: closeWord,
    onCenterTap: chrome.toggleChrome,
  })

  const engine = useEpubRendition({
    bookId,
    flow: settings.flow,
    settingsRef,
    viewerRef,
    renditionRef,
    handlers: {
      onSelection: handleSelection,
      onDismissPopup: closeWord,
      onSectionChange: handleRelocated,
      onKey: navigation.handleKey,
      onTap: navigation.handleTap,
      onTouchStart: navigation.handleTouchStart,
      onTouchEnd: navigation.handleTouchEnd,
    },
  })

  const layout = useReaderLayout(bodyRef, settings)

  const goNext = useCallback(() => {
    void renditionRef.current?.next()
  }, [])

  const goPrev = useCallback(() => {
    void renditionRef.current?.prev()
  }, [])

  const handleTocSelect = useCallback(
    (href: string) => {
      void renditionRef.current?.display(href)
      setShowToc(false)
    },
    [setShowToc],
  )

  useEffect(() => {
    if (renditionRef.current) applyReaderTheme(renditionRef.current, settings)
  }, [settings])

  useEffect(
    () => () => {
      closeWord()
      abortTranslation()
      deactivateTranslation()
      window.speechSynthesis.cancel()
    },
    [closeWord, abortTranslation, deactivateTranslation],
  )

  return {
    record: engine.record,
    toc: engine.toc,
    percentage: engine.percentage,
    currentHref: engine.currentHref,
    loading: engine.loading,
    error: engine.error,
    showToc: chrome.showToc,
    setShowToc: chrome.setShowToc,
    showSettings: chrome.showSettings,
    setShowSettings: chrome.setShowSettings,
    chromeHidden: chrome.chromeHidden,
    twoColumn: layout.twoColumn,
    stageMaxWidth: layout.stageMaxWidth,
    goNext,
    goPrev,
    handleTocSelect,
    viewerRef,
    bodyRef,
    popup: wordLookup.popup,
    closeWord: wordLookup.close,
    translateState: translation.state,
    note: translation.note,
    toggleTranslate: translation.toggle,
    isPlaying: tts.isPlaying,
    toggleTts: tts.toggle,
    debugLog: tts.debugLog,
    isCoarse,
  }
}
