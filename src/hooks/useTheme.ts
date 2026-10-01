import { useEffect } from 'react'
import type { ReaderTheme } from '../lib/types'

const THEME_COLORS: Record<ReaderTheme, string> = {
  light: '#fbfbfd',
  sepia: '#f4ead5',
  dark: '#000000',
}

export function useTheme(theme: ReaderTheme) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme

    const color = THEME_COLORS[theme] ?? THEME_COLORS.light
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', color)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = color
      document.head.appendChild(meta)
    }
  }, [theme])
}
