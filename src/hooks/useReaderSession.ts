import type { Book, Contents, Rendition } from 'epubjs'
import { useCallback, useEffect, useRef } from 'react'
import { applyReaderTheme } from '../lib/reader-theme'
import type { SearchResult } from '../lib/search'
import type { BookmarkRecord, ReaderSettings } from '../lib/types'
import { useBookmarks } from './useBookmarks'
import { useBookSearch } from './useBookSearch'
import { useEpubRendition } from './useEpubRendition'
import { useLatest } from './useLatest'
import { useMediaQuery } from './useMediaQuery'
import { useReaderChrome } from './useReaderChrome'
import { useReaderLayout } from './useReaderLayout'
import { useReaderNavigation } from './useReaderNavigation'
import { useReaderTts } from './useReaderTts'
import { useSectionTranslation } from './useSectionTranslation'
import { useWordLookup } from './useWordLookup'

function firstWordCfi(rendition: Rendition, cfi: string): string {
  try {
    const range = rendition.getRange(cfi)
    if (!range || range.startContainer.nodeType !== 3) return cfi

    const textNode = range.startContainer
    const text = textNode.textContent ?? ''
    let offset = range.startOffset
    if (!text.length || offset >= text.length) return cfi

    if (!/\s/.test(text[offset] ?? '')) {
      while (offset > 0 && !/\s/.test(text[offset - 1] ?? '')) offset -= 1
    }

    const match = /\S+/.exec(text.slice(offset))
    if (!match) return cfi
    const wordStart = offset + match.index
    const document = textNode.ownerDocument
    if (!document) return cfi

    const wordRange = document.createRange()
    wordRange.setStart(textNode, wordStart)
    wordRange.setEnd(textNode, wordStart + match[0].length)
    const rect = wordRange.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return cfi

    const anchorRange = document.createRange()
    anchorRange.setStart(textNode, wordStart)
    anchorRange.collapse(true)
    const contents = (rendition.getContents() as unknown as Contents[]).find(
      (item) => item.document === document,
    )
    return contents?.cfiFromRange(anchorRange) ?? cfi
  } catch {
    return cfi
  }
}

export function useReaderSession(bookId: string, settings: ReaderSettings) {
  const settingsRef = useLatest(settings)
  const isCoarse = useMediaQuery('(pointer: coarse)')

  const viewerRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const renditionRef = useRef<Rendition | null>(null)
  const bookRef = useRef<Book | null>(null)
  const highlightRef = useRef<string | null>(null)

  const chrome = useReaderChrome()
  const wordLookup = useWordLookup(settingsRef)
  const tts = useReaderTts(renditionRef, settingsRef)
  const translation = useSectionTranslation(renditionRef, settingsRef)
  const search = useBookSearch(bookRef, renditionRef)
  const {
    bookmarks: bookmarkRecords,
    add: addStoredBookmark,
    remove: removeStoredBookmark,
    loading: bookmarksLoading,
    error: bookmarksError,
  } = useBookmarks(bookId)

  const { close: closeWord, handleSelection } = wordLookup
  const closePanel = chrome.closePanel
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
    bookRef,
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
      closePanel()
    },
    [closePanel],
  )

  const addBookmark = useCallback(async () => {
    const rendition = renditionRef.current
    const location = rendition?.currentLocation() as
      | { start?: { cfi?: string } }
      | undefined
    const cfi = location?.start?.cfi
    if (!cfi || !rendition) return
    await addStoredBookmark({
      format: 'epub',
      cfi: firstWordCfi(rendition, cfi),
      percentage: engine.percentage,
      label: `Posisi ${Math.round(engine.percentage * 100)}%`,
    })
  }, [addStoredBookmark, engine.percentage])

  const selectBookmark = useCallback(
    async (bookmark: BookmarkRecord) => {
      const rendition = renditionRef.current
      if (bookmark.cfi && rendition) await rendition.display(bookmark.cfi)
      closePanel()
    },
    [closePanel],
  )

  const clearHighlight = useCallback(() => {
    const rendition = renditionRef.current
    if (rendition && highlightRef.current) {
      try {
        rendition.annotations.remove(highlightRef.current, 'highlight')
      } catch {
        // abaikan bila anotasi sudah tidak ada
      }
      highlightRef.current = null
    }
  }, [])

  const selectSearchResult = useCallback(
    async (result: SearchResult) => {
      const rendition = renditionRef.current
      if (!rendition) return
      await rendition.display(result.cfi)
      clearHighlight()
      rendition.annotations.highlight(result.cfi, {}, undefined, 'search-hit', {
        fill: '#f5b301',
        'fill-opacity': '0.35',
      })
      highlightRef.current = result.cfi
    },
    [clearHighlight],
  )

  const isBookmarked = bookmarkRecords.some(
    (bookmark) => bookmark.cfi === engine.currentCfi,
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
    currentCfi: engine.currentCfi,
    loading: engine.loading,
    error: engine.error,
    panel: chrome.panel,
    togglePanel: chrome.togglePanel,
    closePanel,
    chromeHidden: chrome.chromeHidden,
    twoColumn: layout.twoColumn,
    stageMaxWidth: layout.stageMaxWidth,
    goNext,
    goPrev,
    handleTocSelect,
    viewerRef,
    bodyRef,
    popup: wordLookup.popup,
    closeWord,
    translateState: translation.state,
    note: translation.note,
    toggleTranslate: translation.toggle,
    isPlaying: tts.isPlaying,
    toggleTts: tts.toggle,
    debugLog: tts.debugLog,
    isCoarse,
    searchQuery: search.query,
    setSearchQuery: search.setQuery,
    searchResults: search.results,
    searchStatus: search.status,
    searchProgress: search.progress,
    runSearch: search.run,
    clearSearch: search.clear,
    selectSearchResult,
    bookmarks: bookmarkRecords,
    bookmarksLoading,
    bookmarksError,
    addBookmark,
    removeBookmark: removeStoredBookmark,
    selectBookmark,
    isBookmarked,
  }
}
