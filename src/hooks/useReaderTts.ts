import type { Contents, Rendition } from 'epubjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { collectVisibleChunks } from '../lib/tts-text'
import type { ReaderSettings } from '../lib/types'
import type { LatestRef } from './useLatest'

interface RenditionRef {
  current: Rendition | null
}

export function useReaderTts(renditionRef: RenditionRef, settingsRef: LatestRef<ReaderSettings>) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [debugLog, setDebugLog] = useState<string[]>([])
  const queueRef = useRef<{ chunks: string[]; index: number }>({ chunks: [], index: 0 })

  const log = useCallback(
    (msg: string) => {
      if (!settingsRef.current.debugMode) return
      console.log(`[TTS Debug] ${msg}`)
      setDebugLog((prev) => [...prev.slice(-4), msg])
    },
    [settingsRef],
  )

  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices()
    }
    loadVoices()
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    queueRef.current = { chunks: [], index: 0 }
  }, [])

  const toggle = useCallback(() => {
    log('Toggle clicked')
    if (isPlaying) {
      log('Stopping audio...')
      stop()
      return
    }

    const rendition = renditionRef.current
    if (!rendition) {
      log('Error: No rendition')
      return
    }

    const warmUp = new SpeechSynthesisUtterance('')
    window.speechSynthesis.speak(warmUp)
    log('Warm-up triggered')

    const contents = rendition.getContents() as unknown as Contents[]
    const chunks = collectVisibleChunks(contents)
    if (chunks === null) {
      log('Error: No active content visible')
      return
    }
    if (chunks.length === 0) {
      log('Error: No visible text found')
      return
    }

    window.speechSynthesis.cancel()

    queueRef.current = { chunks, index: 0 }

    const speakChunk = () => {
      const { chunks: currentChunks, index: currentIndex } = queueRef.current

      if (currentIndex >= currentChunks.length) {
        log('All chunks finished')
        setIsPlaying(false)
        return
      }

      const chunkText = currentChunks[currentIndex]
      if (!chunkText.trim()) {
        queueRef.current.index++
        speakChunk()
        return
      }

      log(`Speaking chunk ${currentIndex + 1}/${currentChunks.length}: ${chunkText.substring(0, 20)}...`)

      const settings = settingsRef.current
      const utterance = new SpeechSynthesisUtterance(chunkText)
      utterance.rate = settings.ttsRate
      utterance.pitch = settings.ttsPitch

      const voices = window.speechSynthesis.getVoices()
      if (settings.ttsVoice) {
        const selectedVoice = voices.find((v) => v.voiceURI === settings.ttsVoice)
        if (selectedVoice) utterance.voice = selectedVoice
      }

      utterance.onend = () => {
        queueRef.current.index++
        speakChunk()
      }

      utterance.onerror = (event) => {
        log(`TTS Error on chunk ${queueRef.current.index}: ${event.error}`)
        setIsPlaying(false)
      }

      window.speechSynthesis.speak(utterance)
    }

    setIsPlaying(true)
    speakChunk()
  }, [isPlaying, log, renditionRef, settingsRef, stop])

  useEffect(() => () => window.speechSynthesis.cancel(), [])

  return { isPlaying, toggle, debugLog }
}
