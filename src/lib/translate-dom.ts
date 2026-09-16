import type { Contents, Rendition } from 'epubjs'

export const SECTION_BLOCK_SELECTOR =
  'p, div, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, dt, dd, figcaption, figure, pre, section, article, aside, header, footer'

const TRANSLATED_CLASS = 'ereader-translated'
const HAS_LETTER = /\p{L}/u

export function collectSectionBlocks(doc: Document): HTMLElement[] {
  const candidates = Array.from(doc.querySelectorAll<HTMLElement>(SECTION_BLOCK_SELECTOR))
  const blocks: HTMLElement[] = []
  for (const element of candidates) {
    if (element.querySelector(SECTION_BLOCK_SELECTOR)) continue
    const text = (element.textContent ?? '').trim()
    if (!text || !HAS_LETTER.test(text)) continue
    blocks.push(element)
  }
  return blocks
}

export function isTranslated(element: HTMLElement): boolean {
  return element.classList.contains(TRANSLATED_CLASS)
}

export function applyTranslation(
  element: HTMLElement,
  translated: string,
  originals: Map<HTMLElement, string>,
): void {
  if (!originals.has(element)) originals.set(element, element.innerHTML)
  element.textContent = translated
  element.classList.add(TRANSLATED_CLASS)
}

export function restoreTranslations(
  rendition: Rendition,
  originals: Map<HTMLElement, string>,
): void {
  const contents = rendition.getContents() as unknown as Contents[]
  contents.forEach((content) => {
    content.document
      ?.querySelectorAll<HTMLElement>(`.${TRANSLATED_CLASS}`)
      .forEach((element) => {
        const original = originals.get(element)
        if (original !== undefined) element.innerHTML = original
        element.classList.remove(TRANSLATED_CLASS)
      })
  })
  originals.clear()
}

export function pruneOriginals(originals: Map<HTMLElement, string>): void {
  originals.forEach((_, element) => {
    if (!element.isConnected) originals.delete(element)
  })
}

export function findCurrentContents(rendition: Rendition): Contents | null {
  const contents = rendition.getContents() as unknown as Contents[]
  if (contents.length === 0) return null

  const location = rendition.currentLocation() as unknown as { start?: { index?: number } } | null
  const index = location?.start?.index
  if (typeof index === 'number') {
    const match = contents.find((content) => content.sectionIndex === index)
    if (match) return match
  }

  let best: Contents | null = null
  let bestArea = -1
  contents.forEach((content) => {
    const frame = content.window.frameElement as HTMLElement | null
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    const width = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0))
    const height = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0))
    const area = width * height
    if (area > bestArea) {
      bestArea = area
      best = content
    }
  })
  return best
}

export function expandContents(contents: Contents): void {
  try {
    ;(contents as unknown as { expand: () => void }).expand()
  } catch {
    return
  }
}
