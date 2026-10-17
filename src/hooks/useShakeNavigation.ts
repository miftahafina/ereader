import { useEffect, useRef, useState } from 'react'
import { createShakeDetector } from '../lib/shake-navigation'
import { useLatest } from './useLatest'

type MotionConstructor = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<string>
}

interface ShakeNavigationOptions {
  enabled: boolean
  sensitivity: number
  paused: boolean
  onNext: () => void
  onPrev: () => void
}

export function useShakeNavigation(options: ShakeNavigationOptions) {
  const latest = useLatest(options)
  const supported = window.isSecureContext && typeof DeviceMotionEvent !== 'undefined'
  const needsPermission = supported && typeof (DeviceMotionEvent as MotionConstructor).requestPermission === 'function'
  const [granted, setGranted] = useState(!needsPermission)
  const [message, setMessage] = useState('')
  const [requesting, setRequesting] = useState(false)
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
    let detector = createShakeDetector(options.sensitivity)
    let angle = screen.orientation?.angle ?? window.orientation ?? 0
    let received = false
    const timeout = window.setTimeout(() => {
      if (!received) setMessage('Data sensor tidak tersedia. Periksa dukungan dan izin sensor browser.')
    }, 4000)
    const reset = () => {
      detector = createShakeDetector(latest.current.sensitivity)
    }
    const onMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.acceleration
      if (acceleration?.x == null || acceleration.y == null || acceleration.z == null) return
      if (!received) {
        received = true
        setMessage('')
        window.clearTimeout(timeout)
      }
      const nextAngle = screen.orientation?.angle ?? window.orientation ?? 0
      if (nextAngle !== angle) {
        angle = nextAngle
        reset()
        return
      }
      if (document.hidden || latest.current.paused) {
        reset()
        return
      }
      const radians = angle * Math.PI / 180
      const x = acceleration.x * Math.cos(radians) + acceleration.y * Math.sin(radians)
      const y = -acceleration.x * Math.sin(radians) + acceleration.y * Math.cos(radians)
      const direction = detector({ x, y, z: acceleration.z, at: performance.now() })
      if (direction === 'next') latest.current.onNext()
      else if (direction === 'prev') latest.current.onPrev()
    }
    window.addEventListener('devicemotion', onMotion)
    document.addEventListener('visibilitychange', reset)
    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener('devicemotion', onMotion)
      document.removeEventListener('visibilitychange', reset)
    }
  }, [options.enabled, options.sensitivity, granted, supported, latest])

  return {
    supported,
    granted,
    requesting,
    requestPermission,
    message: !window.isSecureContext
      ? 'Sensor gerak memerlukan HTTPS.'
      : !supported
        ? 'Sensor gerak tidak didukung browser ini.'
        : message,
  }
}

export type ShakeNavigationControl = ReturnType<typeof useShakeNavigation>
