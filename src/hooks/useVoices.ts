import { useEffect, useState } from 'react'

export function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() =>
    window.speechSynthesis.getVoices(),
  )

  useEffect(() => {
    const update = () => setVoices(window.speechSynthesis.getVoices())
    update()
    window.speechSynthesis.addEventListener('voiceschanged', update)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update)
  }, [])

  return voices
}
