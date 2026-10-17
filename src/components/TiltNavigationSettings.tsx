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
      <p className="setting-help">Tutup panel, lalu pegang HP pada posisi nyaman sebentar untuk menentukan posisi awal. Miringkan ke kanan untuk berikutnya, ke kiri untuk sebelumnya. Kembali ke posisi awal sebelum mengulang. Ditahan miring hanya pindah satu halaman. Navigasi dijeda saat panel terbuka.</p>
      {settings.tiltNavigation && (
        <SliderSetting
          label="Sensitivitas kemiringan"
          display={`${settings.tiltSensitivity} / 5`}
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
