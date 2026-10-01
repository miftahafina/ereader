import { useCallback, useState } from 'react'

export function useReaderChrome() {
  const [showToc, setShowToc] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [chromeHidden, setChromeHidden] = useState(false)

  const toggleChrome = useCallback(() => {
    setChromeHidden((value) => !value)
    setShowToc(false)
    setShowSettings(false)
  }, [])

  return { showToc, setShowToc, showSettings, setShowSettings, chromeHidden, toggleChrome }
}
