import { defaultSettings, fontOptions, textAlignOptions } from '../lib/settings'
import { translateLanguageOptions } from '../lib/translate'
import { useVoices } from '../hooks/useVoices'
import type { FlowMode, ReaderSettings, ReaderTheme, TextAlign } from '../lib/types'
import {
  SegmentedControl,
  SelectSetting,
  SettingGroup,
  SettingRow,
  SliderSetting,
} from './SettingsControls'

interface SettingsPanelProps {
  settings: ReaderSettings
  onChange: (patch: Partial<ReaderSettings>) => void
}

const themeOptions: { value: ReaderTheme; label: string }[] = [
  { value: 'light', label: 'Terang' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'dark', label: 'Gelap' },
]

const flowOptions: { value: FlowMode; label: string }[] = [
  { value: 'paginated', label: 'Halaman' },
  { value: 'scrolled', label: 'Gulir' },
]

function AlignIcon({ value }: { value: TextAlign }) {
  if (value === 'default') {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="6" />
      </svg>
    )
  }

  const lines = {
    left: ['M4 6h16', 'M4 12h10', 'M4 18h14'],
    center: ['M4 6h16', 'M7 12h10', 'M5 18h14'],
    right: ['M4 6h16', 'M10 12h10', 'M6 18h14'],
    justify: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  }[value]

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {lines.map((d, index) => (
        <path key={index} d={d} />
      ))}
    </svg>
  )
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const voices = useVoices()
  const alignOptions = textAlignOptions.map((option) => ({
    value: option.value,
    label: option.label,
    icon: <AlignIcon value={option.value} />,
  }))
  const voiceOptions = [
    { value: '', label: 'Default' },
    ...voices.map((voice) => ({ value: voice.voiceURI, label: `${voice.name} (${voice.lang})` })),
  ]

  return (
    <div className="settings">
      <h2 className="sidebar-title">Tampilan</h2>

      <SettingGroup label="Tema">
        <SegmentedControl
          options={themeOptions}
          value={settings.theme}
          onChange={(theme) => onChange({ theme })}
        />
      </SettingGroup>

      <SliderSetting
        label="Ukuran huruf"
        display={`${settings.fontSize}%`}
        min={70}
        max={200}
        step={5}
        value={settings.fontSize}
        onChange={(fontSize) => onChange({ fontSize })}
      />

      <SelectSetting
        label="Jenis huruf"
        value={settings.fontFamily}
        options={fontOptions}
        onChange={(fontFamily) => onChange({ fontFamily })}
      />

      <SliderSetting
        label="Transparansi teks"
        display={`${settings.fontOpacity}%`}
        min={10}
        max={100}
        step={5}
        value={settings.fontOpacity}
        onChange={(fontOpacity) => onChange({ fontOpacity })}
      />

      <SliderSetting
        label="Jarak baris"
        display={settings.lineHeight.toFixed(1)}
        min={1.2}
        max={2.4}
        step={0.1}
        value={settings.lineHeight}
        onChange={(lineHeight) => onChange({ lineHeight })}
      />

      <SliderSetting
        label="Jarak antar paragraf"
        display={`${settings.paragraphSpacing.toFixed(1)}em`}
        min={0}
        max={2}
        step={0.1}
        value={settings.paragraphSpacing}
        onChange={(paragraphSpacing) => onChange({ paragraphSpacing })}
      />

      <SettingGroup label="Rata teks">
        <SegmentedControl
          options={alignOptions}
          value={settings.textAlign}
          onChange={(textAlign) => onChange({ textAlign })}
        />
      </SettingGroup>

      <SettingRow label="Mode baca">
        <SegmentedControl
          options={flowOptions}
          value={settings.flow}
          onChange={(flow) => onChange({ flow })}
        />
      </SettingRow>

      <SliderSetting
        label="Lebar kolom"
        display={`${settings.maxWidth}px`}
        min={480}
        max={1200}
        step={20}
        value={settings.maxWidth}
        onChange={(maxWidth) => onChange({ maxWidth })}
      />

      <SliderSetting
        label="Tekstur kertas"
        display={`${settings.grain}%`}
        min={0}
        max={100}
        step={5}
        value={settings.grain}
        onChange={(grain) => onChange({ grain })}
      />

      <h2 className="sidebar-title">Terjemahan</h2>

      <SelectSetting
        label="Bahasa tujuan"
        value={settings.translateTo}
        options={translateLanguageOptions}
        onChange={(translateTo) => onChange({ translateTo })}
      />

      <h2 className="sidebar-title">Audiobook (beta)</h2>

      <SliderSetting
        label="Kecepatan"
        display={`${settings.ttsRate}x`}
        min={0.5}
        max={2}
        step={0.1}
        value={settings.ttsRate}
        onChange={(ttsRate) => onChange({ ttsRate })}
      />

      <SliderSetting
        label="Nada"
        display={`${settings.ttsPitch}`}
        min={0}
        max={2}
        step={0.1}
        value={settings.ttsPitch}
        onChange={(ttsPitch) => onChange({ ttsPitch })}
      />

      <SelectSetting
        label="Suara"
        value={settings.ttsVoice}
        options={voiceOptions}
        onChange={(ttsVoice) => onChange({ ttsVoice })}
      />

      <h2 className="sidebar-title">DEVELOPMENT</h2>

      <SettingRow label="Mode Debug">
        <input
          type="checkbox"
          checked={settings.debugMode}
          onChange={(event) => onChange({ debugMode: event.target.checked })}
        />
      </SettingRow>

      <button className="ghost-btn" onClick={() => onChange({ ...defaultSettings })}>
        Reset pengaturan
      </button>
    </div>
  )
}
