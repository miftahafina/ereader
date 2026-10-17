import type { TiltNavigationControl } from '../hooks/useTiltNavigation'
import type { ReaderSettings } from '../lib/types'
import { SliderSetting } from './SettingsControls'

interface TiltNavigationSettingsProps {
  settings: ReaderSettings
  onChange: (patch: Partial<ReaderSettings>) => void
  motion: TiltNavigationControl
}

export function TiltNavigationSettings({ settings, onChange, motion }: TiltNavigationSettingsProps) {
  const toggle = async () => {
    if (settings.tiltNavigation) {
      onChange({ tiltNavigation: false })
      return
    }
    if (await motion.requestPermission()) onChange({ tiltNavigation: true })
  }

  return (
    <section className="setting-group">
      <h2 className="sidebar-title">Navigasi gerak</h2>
      <label className="setting-row">
        <span className="setting-label">Miringkan untuk pindah halaman</span>
        <input
          type="checkbox"
          checked={settings.tiltNavigation}
          disabled={!motion.supported || motion.requesting}
          onChange={() => { void toggle() }}
        />
      </label>
      <p className="setting-help">Pegang HP dengan nyaman dan diam sebentar untuk menentukan posisi awal. Miringkan atau puntir ke kanan {settings.tiltAngle}° untuk berikutnya, ke kiri {settings.tiltAngle}° untuk sebelumnya. Tidak perlu cepat. Ditahan miring hanya pindah satu halaman. Kembali mendekati posisi awal (±5°) sebelum mengulang. Posisi awal ditentukan ulang setelah panel ditutup.</p>
      {settings.tiltNavigation && (
        <div className="setting-group">
          <p className="setting-help" role="status">{motion.sensorStatus}. Panel terbuka: uji gerakan tanpa memindahkan halaman.</p>
          {motion.rotation && <p className="setting-help">Kemiringan: {Math.round(motion.rotation.roll)}° · Puntiran: {Math.round(motion.rotation.twist)}°</p>}
          <p className="setting-help" role="status">Gerakan terakhir: {motion.lastGesture}</p>
          <button className="ghost-btn" onClick={motion.recalibrate}>Kalibrasi ulang posisi awal</button>
        </div>
      )}
      {settings.tiltNavigation && (
        <SliderSetting
          label="Sudut pindah halaman"
          display={`${settings.tiltAngle}°`}
          min={10}
          max={30}
          step={1}
          value={settings.tiltAngle}
          onChange={(tiltAngle) => onChange({ tiltAngle })}
        />
      )}
      {settings.tiltNavigation && !motion.granted && motion.supported && (
        <button className="ghost-btn" disabled={motion.requesting} onClick={() => { void motion.requestPermission() }}>
          Aktifkan izin sensor
        </button>
      )}
      {motion.message && <p className="setting-help" role="status">{motion.message}</p>}
    </section>
  )
}
