import type { ReactNode } from 'react'
import { SettingIcon, type SettingIconName } from './SettingsIcon'

function Label({ icon, children }: { icon?: SettingIconName; children: ReactNode }) {
  return (
    <span className="setting-label">
      {icon && (
        <span className="setting-icon">
          <SettingIcon name={icon} />
        </span>
      )}
      {children}
    </span>
  )
}

export function SettingGroup({
  label,
  icon,
  children,
}: {
  label?: string
  icon?: SettingIconName
  children: ReactNode
}) {
  return (
    <section className="setting-group">
      {label !== undefined && <Label icon={icon}>{label}</Label>}
      {children}
    </section>
  )
}

export function SettingRow({
  label,
  icon,
  children,
}: {
  label: string
  icon?: SettingIconName
  children: ReactNode
}) {
  return (
    <section className="setting-group">
      <div className="setting-row">
        <Label icon={icon}>{label}</Label>
        {children}
      </div>
    </section>
  )
}

interface SliderSettingProps {
  label: string
  icon?: SettingIconName
  display: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
}

export function SliderSetting({
  label,
  icon,
  display,
  min,
  max,
  step,
  value,
  onChange,
}: SliderSettingProps) {
  return (
    <section className="setting-group">
      <div className="setting-row">
        <Label icon={icon}>{label}</Label>
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
  icon?: SettingIconName
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}

export function SelectSetting({
  label,
  icon,
  value,
  options,
  onChange,
}: SelectSettingProps) {
  return (
    <SettingGroup label={label} icon={icon}>
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
