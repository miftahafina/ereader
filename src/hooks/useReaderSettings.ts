import { useCallback, useState } from 'react'
import { loadSettings, saveSettings } from '../lib/settings'
import type { ReaderSettings } from '../lib/types'

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(() => loadSettings())

  const update = useCallback((patch: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  return { settings, update }
}
