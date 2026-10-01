import { defaultSettings, fontOptions, textAlignOptions } from '../lib/settings'
import type { PdfSpreadMode, ReaderSettings, ReaderTheme, TextAlign } from '../lib/types'
import { SegmentedControl, SelectSetting, SettingGroup, SettingRow, SliderSetting } from './SettingsControls'
import { SettingIcon } from './SettingsIcon'

interface PdfSettingsPanelProps {
  settings: ReaderSettings
  onChange: (patch: Partial<ReaderSettings>) => void
}

const themeOptions: { value: ReaderTheme; label: string }[] = [
  { value: 'light', label: 'Terang' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'dark', label: 'Gelap' },
]

const spreadOptions: { value: PdfSpreadMode; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'single', label: '1' },
  { value: 'double', label: '2' },
]

const reflowAlignOptions = textAlignOptions.filter((option) => option.value !== 'default')

export function PdfSettingsPanel({ settings, onChange }: PdfSettingsPanelProps) {
  return (
    <div className="settings">
      <h2 className="sidebar-title">Tampilan PDF</h2>

      <SettingGroup label="Tema" icon="theme">
        <SegmentedControl
          options={themeOptions}
          value={settings.theme}
          onChange={(theme) => onChange({ theme })}
        />
      </SettingGroup>

      <SettingRow label="Halaman per layar" icon="spread">
        <SegmentedControl
          options={spreadOptions}
          value={settings.pdfSpread}
          onChange={(pdfSpread) => onChange({ pdfSpread })}
        />
      </SettingRow>

      <SliderSetting
        label="Zoom"
        icon="zoom"
        display={`${Math.round(settings.pdfZoom * 100)}%`}
        min={0.5}
        max={3}
        step={0.1}
        value={settings.pdfZoom}
        onChange={(pdfZoom) => onChange({ pdfZoom })}
      />

      <SliderSetting
        label="Transparansi teks"
        icon="opacity"
        display={`${settings.fontOpacity}%`}
        min={10}
        max={100}
        step={5}
        value={settings.fontOpacity}
        onChange={(fontOpacity) => onChange({ fontOpacity })}
      />

      <SettingRow label="Hapus margin teks" icon="crop">
        <input
          type="checkbox"
          checked={settings.pdfCrop}
          onChange={(event) => onChange({ pdfCrop: event.target.checked })}
        />
      </SettingRow>

      {settings.pdfCrop && (
        <SliderSetting
          label="Sisa margin"
          icon="margin"
          display={`${settings.pdfCropMargin}px`}
          min={0}
          max={40}
          step={1}
          value={settings.pdfCropMargin}
          onChange={(pdfCropMargin) => onChange({ pdfCropMargin })}
        />
      )}

      <SettingRow label="Tema untuk halaman scan" icon="scan">
        <input
          type="checkbox"
          checked={settings.pdfScanTheme}
          onChange={(event) => onChange({ pdfScanTheme: event.target.checked })}
        />
      </SettingRow>

      <h2 className="sidebar-title">Reflowable</h2>

      <SettingRow label="Mode reflow" icon="reflow">
        <input
          type="checkbox"
          checked={settings.pdfReflow}
          onChange={(event) => onChange({ pdfReflow: event.target.checked })}
        />
      </SettingRow>

      <SliderSetting
        label="Ukuran huruf"
        icon="fontSize"
        display={`${settings.fontSize}%`}
        min={70}
        max={220}
        step={5}
        value={settings.fontSize}
        onChange={(fontSize) => onChange({ fontSize })}
      />

      <SliderSetting
        label="Tinggi baris"
        icon="lineHeight"
        display={settings.lineHeight.toFixed(1)}
        min={1.2}
        max={2.4}
        step={0.1}
        value={settings.lineHeight}
        onChange={(lineHeight) => onChange({ lineHeight })}
      />

      <SelectSetting
        label="Jenis huruf"
        icon="fontFamily"
        value={settings.fontFamily}
        options={fontOptions}
        onChange={(fontFamily) => onChange({ fontFamily })}
      />

      <SettingGroup label="Rata teks" icon="align">
        <SegmentedControl
          options={reflowAlignOptions as { value: TextAlign; label: string }[]}
          value={settings.textAlign}
          onChange={(textAlign) => onChange({ textAlign })}
        />
      </SettingGroup>

      <button className="ghost-btn" onClick={() => onChange({ ...defaultSettings })}>
        <SettingIcon name="reset" />
        Reset pengaturan
      </button>
    </div>
  )
}
