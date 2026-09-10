import { useCallback, useEffect, useState } from 'react'

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const supported =
    typeof document !== 'undefined' && (document.fullscreenEnabled ?? false)

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    onChange()
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => undefined)
    } else {
      void document.documentElement.requestFullscreen?.().catch(() => undefined)
    }
  }, [])

  return { isFullscreen, supported, toggle }
}
