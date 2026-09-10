import literataNormalUrl from '@fontsource-variable/literata/files/literata-latin-wght-normal.woff2?url'
import literataItalicUrl from '@fontsource-variable/literata/files/literata-latin-wght-italic.woff2?url'

export const LITERATA_FONT_FAMILY = 'Literata Variable'

function absolute(url: string): string {
  try {
    return new URL(url, document.baseURI).href
  } catch {
    return url
  }
}

export function literataFontFaces(): string {
  return `
    @font-face {
      font-family: '${LITERATA_FONT_FAMILY}';
      font-style: normal;
      font-weight: 200 900;
      font-display: swap;
      src: url('${absolute(literataNormalUrl)}') format('woff2-variations');
    }
    @font-face {
      font-family: '${LITERATA_FONT_FAMILY}';
      font-style: italic;
      font-weight: 200 900;
      font-display: swap;
      src: url('${absolute(literataItalicUrl)}') format('woff2-variations');
    }
  `
}
