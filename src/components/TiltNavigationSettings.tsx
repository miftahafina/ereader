import type { TiltNavigationControl } from '../hooks/useTiltNavigation'
import type { ReaderSettings } from '../lib/types'
import { wristSpeedThreshold } from '../lib/tilt-navigation'
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
      <p className="setting-help">Pegang HP sebentar, lalu putar atau puntir pergelangan tangan dengan cepat ke kanan untuk berikutnya, ke kiri untuk sebelumnya. Gerakan pelan diabaikan; tidak perlu sudut besar. Satu gerakan cepat memindahkan satu halaman. Diamkan sebentar sebelum mengulang agar gerakan balik tidak ikut dihitung.</p>
      {settings.tiltNavigation && (
        <div className="setting-group">
          <p className="setting-help" role="status">{motion.sensorStatus}. Panel terbuka: uji gerakan tanpa memindahkan halaman.</p>
          {motion.rotation && <p className="setting-help">Putaran: {Math.round(motion.rotation.roll)}°/dtk · Puntiran: {Math.round(motion.rotation.twist)}°/dtk</p>}
          <p className="setting-help" role="status">Gerakan terakhir: {motion.lastGesture}</p>
        </div>
      )}
      {settings.tiltNavigation && (
        <SliderSetting
          label="Sensitivitas gerakan cepat"
          display={`${settings.tiltSensitivity} / 5 · ≥ ${wristSpeedThreshold(settings.tiltSensitivity)}°/dtk`}
          min={1}
          max={5}
          step={1}
          value={settings.tiltSensitivity}
          onChange={(tiltSensitivity) => onChange({ tiltSensitivity })}
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
