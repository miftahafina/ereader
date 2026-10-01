import { useCallback, useState } from 'react'

export type ReaderPanel = 'toc' | 'search' | 'settings'

export function useReaderChrome() {
  const [panel, setPanel] = useState<ReaderPanel | null>(null)
  const [chromeHidden, setChromeHidden] = useState(false)

  const togglePanel = useCallback((next: ReaderPanel) => {
    setPanel((current) => (current === next ? null : next))
  }, [])

  const closePanel = useCallback(() => setPanel(null), [])

  const toggleChrome = useCallback(() => {
    setChromeHidden((value) => !value)
    setPanel(null)
  }, [])

  return { panel, togglePanel, closePanel, chromeHidden, toggleChrome }
}
