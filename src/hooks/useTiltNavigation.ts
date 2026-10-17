import { useEffect, useRef, useState } from 'react'
import { createTiltDetector, orientationQuaternion } from '../lib/tilt-navigation'
import type { OrientationQuaternion } from '../lib/tilt-navigation'
import { useLatest } from './useLatest'

type OrientationConstructor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<string>
}

interface TiltNavigationOptions {
  enabled: boolean
  angle: number
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
  const [sensorStatus, setSensorStatus] = useState('Belum diuji')
  const [rotation, setRotation] = useState<{ roll: number; twist: number } | null>(null)
  const [lastGesture, setLastGesture] = useState('Belum ada')
  const [calibration, setCalibration] = useState(0)
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
    if (!options.enabled || !granted || !supported) return
    let screenAngle = screen.orientation?.angle ?? window.orientation ?? 0
    let detector = createTiltDetector(options.angle, screenAngle)
    let received = false
    let calibrated = false
    let orientation: OrientationQuaternion | null = null
    let updatedAt = 0
    const frame = requestAnimationFrame(() => {
      if (!received) {
        setSensorStatus('Menunggu sensor orientasi…')
        setRotation(null)
      }
      setLastGesture('Belum ada')
    })
    const timeout = window.setTimeout(() => {
      if (!received) {
        setSensorStatus('Sensor orientasi tidak terbaca')
        setMessage('Di Chrome Android, periksa Setelan → Setelan situs → Sensor gerakan. Pastikan diizinkan untuk situs ini, lalu muat ulang. Gunakan HTTPS.')
      }
    }, 4000)
    const reset = () => {
      screenAngle = screen.orientation?.angle ?? window.orientation ?? 0
      detector = createTiltDetector(latest.current.angle, screenAngle)
      orientation = null
      calibrated = false
      setSensorStatus('Kalibrasi: pegang HP dengan nyaman dan diam sebentar…')
      setRotation(null)
      setLastGesture('Belum ada')
    }
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha == null || event.beta == null || event.gamma == null) return
      if (![event.alpha, event.beta, event.gamma].every(Number.isFinite)) return
      if (!received) {
        received = true
        setSensorStatus('Sensor terbaca. Kalibrasi: diamkan HP sebentar…')
        setMessage('')
        window.clearTimeout(timeout)
      }
      if ((screen.orientation?.angle ?? window.orientation ?? 0) !== screenAngle) reset()
      orientation = orientationQuaternion(event.alpha, event.beta, event.gamma)
    }
    const sampleOrientation = () => {
      if ((screen.orientation?.angle ?? window.orientation ?? 0) !== screenAngle) {
        reset()
        return
      }
      if (document.hidden || !orientation) return
      const now = performance.now()
      const reading = detector(orientation, now)
      if (!reading) return
      if (reading.calibrated !== calibrated) {
        calibrated = reading.calibrated
        setSensorStatus(calibrated ? 'Siap — sudut dihitung dari posisi awal' : 'Kalibrasi: diamkan HP sebentar…')
      }
      if (now - updatedAt >= 100 || reading.direction) {
        updatedAt = now
        setRotation(reading.calibrated ? { roll: reading.roll, twist: reading.twist } : null)
      }
      if (reading.direction) {
        setLastGesture(reading.direction === 'next' ? 'Kanan → berikutnya' : 'Kiri → sebelumnya')
        if (!latest.current.paused) {
          if (reading.direction === 'next') latest.current.onNext()
          else latest.current.onPrev()
        }
      }
    }
    const sampling = window.setInterval(sampleOrientation, 50)
    window.addEventListener('deviceorientation', onOrientation)
    document.addEventListener('visibilitychange', reset)
    return () => {
      window.clearTimeout(timeout)
      window.clearInterval(sampling)
      cancelAnimationFrame(frame)
      window.removeEventListener('deviceorientation', onOrientation)
      document.removeEventListener('visibilitychange', reset)
    }
  }, [options.enabled, options.angle, options.paused, granted, supported, latest, calibration])

  return {
    supported,
    granted,
    requesting,
    requestPermission,
    recalibrate: () => setCalibration((value) => value + 1),
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
