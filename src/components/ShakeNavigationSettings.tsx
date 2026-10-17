import type { ShakeNavigationControl } from '../hooks/useShakeNavigation'
import type { ReaderSettings } from '../lib/types'
import { SliderSetting } from './SettingsControls'

interface ShakeNavigationSettingsProps {
  settings: ReaderSettings
  onChange: (patch: Partial<ReaderSettings>) => void
  motion: ShakeNavigationControl
}

export function ShakeNavigationSettings({ settings, onChange, motion }: ShakeNavigationSettingsProps) {
  const toggle = async () => {
    if (settings.shakeNavigation) {
      onChange({ shakeNavigation: false })
      return
    }
    if (await motion.requestPermission()) onChange({ shakeNavigation: true })
  }

  return (
    <section className="setting-group">
      <h2 className="sidebar-title">Navigasi gerak</h2>
      <label className="setting-row">
        <span className="setting-label">Goyang untuk pindah halaman</span>
        <input
          type="checkbox"
          checked={settings.shakeNavigation}
          disabled={!motion.supported || motion.requesting}
          onChange={() => { void toggle() }}
        />
      </label>
      <p className="setting-help">Sentakkan HP ke kanan untuk berikutnya, ke kiri untuk sebelumnya. Bukan dimiringkan. Diamkan sebentar sebelum mengulang. Navigasi dijeda saat panel terbuka.</p>
      {settings.shakeNavigation && (
        <SliderSetting
          label="Sensitivitas goyangan"
          display={`${settings.shakeSensitivity} / 5`}
          min={1}
          max={5}
          step={1}
          value={settings.shakeSensitivity}
          onChange={(shakeSensitivity) => onChange({ shakeSensitivity })}
        />
      )}
      {settings.shakeNavigation && !motion.granted && motion.supported && (
        <button className="ghost-btn" disabled={motion.requesting} onClick={() => { void motion.requestPermission() }}>
          Aktifkan izin sensor
        </button>
      )}
      {motion.message && <p className="setting-help" role="status">{motion.message}</p>}
    </section>
  )
}
