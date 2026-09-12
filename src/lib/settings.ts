import type { ReaderSettings, ReaderTheme } from './types'

export const defaultSettings: ReaderSettings = {
  theme: 'light',
  fontSize: 100,
  fontFamily: 'literata',
  lineHeight: 1.6,
  paragraphSpacing: 0.5,
  flow: 'paginated',
  maxWidth: 760,
  grain: 0,
  ttsRate: 1,
  ttsPitch: 1,
  ttsVoice: '',
  debugMode: false,
}

export const themePalette: Record<
  ReaderTheme,
  { bg: string; text: string; link: string; muted: string; surface: string; border: string }
> = {
  light: {
    bg: '#ffffff',
    text: '#000000',
    link: '#000000',
    muted: '#6b7280',
    surface: '#ffffff',
    border: '#e5e7eb',
  },
  sepia: {
    bg: '#f6ecd6',
    text: '#5b4636',
    link: '#9a5b13',
    muted: '#8a7a63',
    surface: '#fbf5e6',
    border: '#e6d9bd',
  },
  dark: {
    bg: '#121417',
    text: '#c9ccd1',
    link: '#6ea8fe',
    muted: '#8b9099',
    surface: '#1a1d21',
    border: '#2a2e34',
  },
}

export const fontOptions: { value: string; label: string; stack: string }[] = [
  { value: 'literata', label: 'Literata', stack: "'Literata Variable', Georgia, serif" },
  { value: 'default', label: 'Default', stack: '' },
  { value: 'serif', label: 'Serif', stack: 'Georgia, "Times New Roman", serif' },
  {
    value: 'sans',
    label: 'Sans-serif',
    stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  { value: 'mono', label: 'Monospace', stack: 'ui-monospace, "SFMono-Regular", Menlo, monospace' },
]

const STORAGE_KEY = 'ereader-web:settings'

export function loadSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultSettings }
    const parsed = JSON.parse(raw) as Partial<ReaderSettings>
    return { ...defaultSettings, ...parsed }
  } catch {
    return { ...defaultSettings }
  }
}

export function saveSettings(settings: ReaderSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore quota / privacy mode errors
  }
}
