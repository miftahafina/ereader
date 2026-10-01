import type { ReactNode } from 'react'

export function SettingGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <section className="setting-group">
      {label !== undefined && <span className="setting-label">{label}</span>}
      {children}
    </section>
  )
}

export function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="setting-group">
      <div className="setting-row">
        <span className="setting-label">{label}</span>
        {children}
      </div>
    </section>
  )
}

interface SliderSettingProps {
  label: string
  display: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
}

export function SliderSetting({ label, display, min, max, step, value, onChange }: SliderSettingProps) {
  return (
    <section className="setting-group">
      <div className="setting-row">
        <span className="setting-label">{label}</span>
        <span className="setting-value">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </section>
  )
}

interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button
          key={option.value}
          className={value === option.value ? 'active' : ''}
          onClick={() => onChange(option.value)}
          aria-label={option.icon ? option.label : undefined}
          title={option.icon ? option.label : undefined}
        >
          {option.icon ?? option.label}
        </button>
      ))}
    </div>
  )
}

interface SelectOption {
  value: string
  label: string
}

interface SelectSettingProps {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}

export function SelectSetting({ label, value, options, onChange }: SelectSettingProps) {
  return (
    <SettingGroup label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </SettingGroup>
  )
}
