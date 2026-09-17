import type { ReaderSettings } from './types'
import { literataFontFaces } from './fontFaces'
import { fontOptions, themePalette } from './settings'
import type { Rendition, Contents } from 'epubjs'

export function buildReaderCss(settings: ReaderSettings): string {
  const palette = themePalette[settings.theme]
  const font = fontOptions.find((option) => option.value === settings.fontFamily)
  const fontRule = font?.stack ? `font-family: ${font.stack} !important;` : ''
  const fontFaces = settings.fontFamily === 'literata' ? literataFontFaces() : ''

  return `
    ${fontFaces}
    html, body { background: ${palette.bg} !important; }
    html, body, body * {
      -webkit-touch-callout: none !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    body { line-height: ${settings.lineHeight} !important; }
    body, body * { color: ${palette.text} !important; ${fontRule} }
    body p { margin-top: 0 !important; margin-bottom: ${settings.paragraphSpacing}em !important; }
    a, a * { color: ${palette.link} !important; }
  `
}

export function applyReaderTheme(rendition: Rendition, settings: ReaderSettings) {
  const css = buildReaderCss(settings)
  const contents = rendition.getContents() as unknown as Contents[]
  contents.forEach((content) => {
    void content.addStylesheetCss(css, 'ereader')
  })
  rendition.themes.fontSize(`${settings.fontSize}%`)
}
