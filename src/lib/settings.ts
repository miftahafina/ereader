import type { DarkBackground, ReaderSettings, ReaderTheme, TextAlign } from './types'

export const defaultSettings: ReaderSettings = {
  theme: 'light',
  darkBackground: 1,
  fontSize: 100,
  fontFamily: 'literata',
  fontOpacity: 100,
  lineHeight: 1.6,
  paragraphSpacing: 0.5,
  flow: 'paginated',
  textAlign: 'default',
  maxWidth: 760,
  grain: 0,
  ttsRate: 1,
  ttsPitch: 1,
  ttsVoice: '',
  translateTo: 'id',
  debugMode: false,
  pdfSpread: 'auto',
  pdfCrop: false,
  pdfCropMargin: 8,
  pdfZoom: 1,
  pdfReflow: false,
  pdfScanTheme: true,
}

export const themePalette: Record<
  ReaderTheme,
  {
    bg: string
    text: string
    link: string
    muted: string
    surface: string
    border: string
    readerBg: string
  }
> = {
  light: {
    bg: '#ffffff',
    text: '#000000',
    link: '#000000',
    muted: '#6b7280',
    surface: '#ffffff',
    border: '#e5e7eb',
    readerBg: '#ffffff',
  },
  sepia: {
    bg: '#f6ecd6',
    text: '#5b4636',
    link: '#9a5b13',
    muted: '#8a7a63',
    surface: '#fbf5e6',
    border: '#e6d9bd',
    readerBg: '#f6ecd6',
  },
  dark: {
    bg: '#121417',
    text: '#c9ccd1',
    link: '#6ea8fe',
    muted: '#8b9099',
    surface: '#1a1d21',
    border: '#2a2e34',
    readerBg: '#1c1c1e',
  },
}


const darkBackgroundPalettes: Record<
  Exclude<DarkBackground, 1>,
  { bg: string; surface: string; border: string; readerBg: string }
> = {
  2: { bg: '#111315', surface: '#202226', border: '#303237', readerBg: '#232529' },
  3: { bg: '#1e2024', surface: '#27292d', border: '#3b3d42', readerBg: '#303236' },
  4: { bg: '#2c2e33', surface: '#35373c', border: '#494b51', readerBg: '#3b3e43' },
  5: { bg: '#3a3d42', surface: '#44474d', border: '#595c63', readerBg: '#474a50' },
}

export function getThemePalette(theme: ReaderTheme, darkBackground: DarkBackground) {
  const palette = themePalette[theme]
  if (theme !== 'dark' || darkBackground === 1) return palette
  return { ...palette, ...darkBackgroundPalettes[darkBackground] }
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

export const textAlignOptions: { value: TextAlign; label: string }[] = [
  { value: 'default', label: 'Bawaan' },
  { value: 'left', label: 'Kiri' },
  { value: 'center', label: 'Tengah' },
  { value: 'right', label: 'Kanan' },
  { value: 'justify', label: 'Rata' },
]

const STORAGE_KEY = 'ereader-web:settings'

export function loadSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultSettings }
    const parsed = JSON.parse(raw) as Partial<ReaderSettings> & { darkBackground?: unknown }
    const darkBackground =
      parsed.darkBackground === 'gray'
        ? 3
        : parsed.darkBackground === 'black'
          ? 1
          : typeof parsed.darkBackground === 'number' && parsed.darkBackground >= 1 && parsed.darkBackground <= 5
            ? (Math.round(parsed.darkBackground) as DarkBackground)
            : defaultSettings.darkBackground
    return { ...defaultSettings, ...parsed, darkBackground }
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
