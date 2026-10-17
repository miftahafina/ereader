import { useEffect, useRef, useState } from 'react'
import { createTiltDetector, horizontalTilt } from '../lib/tilt-navigation'
import { useLatest } from './useLatest'

type OrientationConstructor = typeof DeviceOrientationEvent & {
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
  const supported = window.isSecureContext && typeof DeviceOrientationEvent !== 'undefined'
  const needsPermission = supported && typeof (DeviceOrientationEvent as OrientationConstructor).requestPermission === 'function'
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
      const request = (DeviceOrientationEvent as OrientationConstructor).requestPermission
      const allowed = !request || await request.call(DeviceOrientationEvent) === 'granted'
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
    if (!options.enabled || options.paused || !granted || !supported) return
    let detector = createTiltDetector(options.sensitivity)
    let angle = screen.orientation?.angle ?? window.orientation ?? 0
    let received = false
    const timeout = window.setTimeout(() => {
      if (!received) setMessage('Data sensor tidak tersedia. Periksa dukungan dan izin sensor browser.')
    }, 4000)
    const reset = () => {
      detector = createTiltDetector(latest.current.sensitivity)
    }
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta == null || event.gamma == null || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return
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
      const direction = detector(horizontalTilt(event.beta, event.gamma, angle), performance.now())
      if (direction === 'next') latest.current.onNext()
      else if (direction === 'prev') latest.current.onPrev()
    }
    window.addEventListener('deviceorientation', onOrientation)
    document.addEventListener('visibilitychange', reset)
    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener('deviceorientation', onOrientation)
      document.removeEventListener('visibilitychange', reset)
    }
  }, [options.enabled, options.sensitivity, options.paused, granted, supported, latest])

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

export type TiltNavigationControl = ReturnType<typeof useTiltNavigation>
