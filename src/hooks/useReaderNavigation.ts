import type { Contents, Rendition } from 'epubjs'
import { useCallback, useRef } from 'react'
import { useLatest } from './useLatest'

interface ElementRef<T> {
  current: T | null
}

interface NavigationOptions {
  renditionRef: ElementRef<Rendition>
  viewerRef: ElementRef<HTMLDivElement>
  isCoarse: boolean
  onEscape: () => void
  onCenterTap: () => void
}

export function useReaderNavigation({
  renditionRef,
  viewerRef,
  isCoarse,
  onEscape,
  onCenterTap,
}: NavigationOptions) {
  const isCoarseRef = useLatest(isCoarse)
  const lastSwipeAtRef = useRef(0)
  const touchRef = useRef({ x: 0, y: 0, at: 0 })

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape()
        return
      }
      if (
        event.key === 'ArrowRight' ||
        event.key === 'PageDown' ||
        event.key === 'AudioVolumeUp'
      ) {
        event.preventDefault()
        void renditionRef.current?.next()
      } else if (
        event.key === 'ArrowLeft' ||
        event.key === 'PageUp' ||
        event.key === 'AudioVolumeDown'
      ) {
        event.preventDefault()
        void renditionRef.current?.prev()
      }
    },
    [renditionRef, onEscape],
  )

  const handleTap = useCallback(
    (event: MouseEvent, contents: Contents) => {
      if (!isCoarseRef.current) return
      if (Date.now() - lastSwipeAtRef.current < 400) return
      const target = event.target as Element | null
      if (target && typeof target.closest === 'function' && target.closest('a')) return
      const selection = contents.window.getSelection()
      if (selection && !selection.isCollapsed) return
      const viewer = viewerRef.current
      if (!viewer) return
      const frame = contents.window.frameElement
      const viewerRect = viewer.getBoundingClientRect()
      if (!viewerRect.width) return
      const frameRect = frame?.getBoundingClientRect()
      const visibleX = event.clientX + (frameRect ? frameRect.left : 0) - viewerRect.left
      const ratio = visibleX / viewerRect.width
      if (ratio < 0.3) {
        void renditionRef.current?.prev()
      } else if (ratio > 0.7) {
        void renditionRef.current?.next()
      } else {
        onCenterTap()
      }
    },
    [renditionRef, viewerRef, isCoarseRef, onCenterTap],
  )

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.changedTouches[0]
    if (!touch) return
    touchRef.current = { x: touch.clientX, y: touch.clientY, at: Date.now() }
  }, [])

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      if (!touch) return
      const { x, y, at } = touchRef.current
      const dx = touch.clientX - x
      const dy = touch.clientY - y
      const dt = Date.now() - at
      if (dt > 800) return
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return
      lastSwipeAtRef.current = Date.now()
      if (dx < 0) void renditionRef.current?.next()
      else void renditionRef.current?.prev()
    },
    [renditionRef],
  )

  return { handleKey, handleTap, handleTouchStart, handleTouchEnd }
}
