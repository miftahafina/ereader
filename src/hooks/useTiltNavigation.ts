import { useEffect, useRef, useState } from 'react'
import { createWristDetector, screenRotation } from '../lib/tilt-navigation'
import { useLatest } from './useLatest'

type MotionConstructor = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<string>
}

interface TiltNavigationOptions {
  enabled: boolean
  sensitivity: number
  paused: boolean
  onNext: () => void
  onPrev: () => void
}

export function useTiltNavigation(options: TiltNavigationOptions) {
  const latest = useLatest(options)
  const supported = window.isSecureContext && typeof DeviceMotionEvent !== 'undefined'
  const needsPermission = supported && typeof (DeviceMotionEvent as MotionConstructor).requestPermission === 'function'
  const [granted, setGranted] = useState(!needsPermission)
  const [message, setMessage] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [sensorStatus, setSensorStatus] = useState('Belum diuji')
  const [rotation, setRotation] = useState<{ roll: number; twist: number } | null>(null)
  const [lastGesture, setLastGesture] = useState('Belum ada')
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const requestPermission = async () => {
    if (!supported || requesting) return false
    setRequesting(true)
    try {
      const request = (DeviceMotionEvent as MotionConstructor).requestPermission
      const allowed = !request || await request.call(DeviceMotionEvent) === 'granted'
      if (mounted.current) {
        setGranted(allowed)
        setMessage(allowed ? '' : 'Izin sensor ditolak. Izinkan akses gerak di pengaturan browser, lalu coba lagi.')
      }
      return allowed
    } catch {
      if (mounted.current) setMessage('Tidak dapat mengakses sensor. Periksa izin gerak di browser, lalu coba lagi.')
      return false
    } finally {
      if (mounted.current) setRequesting(false)
    }
  }

  useEffect(() => {
    if (!options.enabled || !granted || !supported) return
    let detector = createWristDetector(options.sensitivity)
    let angle = screen.orientation?.angle ?? window.orientation ?? 0
    let received = false
    let updatedAt = 0
    const frame = requestAnimationFrame(() => {
      if (!received) {
        setSensorStatus('Menunggu giroskop…')
        setRotation(null)
      }
      setLastGesture('Belum ada')
    })
    const timeout = window.setTimeout(() => {
      if (!received) {
        setSensorStatus('Giroskop tidak terbaca')
        setMessage('Di Chrome Android, periksa Setelan → Setelan situs → Sensor gerakan. Pastikan diizinkan untuk situs ini, lalu muat ulang. Gunakan HTTPS.')
      }
    }, 4000)
    const reset = () => {
      detector = createWristDetector(latest.current.sensitivity)
    }
    const onMotion = (event: DeviceMotionEvent) => {
      const rate = event.rotationRate
      if (rate?.alpha == null || rate.beta == null || rate.gamma == null) return
      if (![rate.alpha, rate.beta, rate.gamma].every(Number.isFinite)) return
      if (!received) {
        received = true
        setSensorStatus('Giroskop terbaca')
        setMessage('')
        window.clearTimeout(timeout)
      }
      const nextAngle = screen.orientation?.angle ?? window.orientation ?? 0
      if (nextAngle !== angle) {
        angle = nextAngle
        reset()
        return
      }
      if (document.hidden) {
        reset()
        return
      }
      const now = performance.now()
      const rotation = screenRotation(rate.alpha, rate.beta, rate.gamma, angle)
      if (now - updatedAt >= 250) {
        updatedAt = now
        setRotation(rotation)
      }
      const direction = detector(rotation.roll, rotation.twist, now)
      if (direction) {
        setLastGesture(direction === 'next' ? 'Kanan → berikutnya' : 'Kiri → sebelumnya')
        if (!latest.current.paused) {
          if (direction === 'next') latest.current.onNext()
          else latest.current.onPrev()
        }
      }
    }
    window.addEventListener('devicemotion', onMotion)
    document.addEventListener('visibilitychange', reset)
    return () => {
      window.clearTimeout(timeout)
      cancelAnimationFrame(frame)
      window.removeEventListener('devicemotion', onMotion)
      document.removeEventListener('visibilitychange', reset)
    }
  }, [options.enabled, options.sensitivity, options.paused, granted, supported, latest])

  return {
    supported,
    granted,
    requesting,
    requestPermission,
    sensorStatus,
    rotation,
    lastGesture,
    message: !window.isSecureContext
      ? 'Sensor gerak memerlukan HTTPS.'
      : !supported
        ? 'Sensor gerak tidak didukung browser ini.'
        : message,
  }
}

export type TiltNavigationControl = ReturnType<typeof useTiltNavigation>
