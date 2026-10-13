import type { Contents, Rendition } from 'epubjs'

function intersects(rect: DOMRect, viewport: DOMRect, frame: DOMRect) {
  return rect.width > 0 && rect.height > 0 &&
    rect.right + frame.left > viewport.left + 1 &&
    rect.left + frame.left < viewport.right - 1 &&
    rect.bottom + frame.top > viewport.top + 1 &&
    rect.top + frame.top < viewport.bottom - 1
}

export function firstVisibleEpubWord(rendition: Rendition, viewer: HTMLElement) {
  const viewport = viewer.getBoundingClientRect()
  const contents = rendition.getContents() as unknown as Contents[]
  for (const content of contents) {
    const frame = content.window.frameElement?.getBoundingClientRect()
    if (!frame) continue
    const doc = content.document
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      const text = node.textContent ?? ''
      const parent = node.parentElement
      if (text.trim() && parent && !parent.closest('script, style, [hidden], [aria-hidden="true"]')) {
        const range = doc.createRange()
        range.selectNodeContents(node)
        if (Array.from(range.getClientRects()).some((rect) => intersects(rect, viewport, frame))) {
          for (const match of text.matchAll(/\S+/g)) {
            range.setStart(node, match.index)
            range.setEnd(node, match.index + match[0].length)
            if (!Array.from(range.getClientRects()).some((rect) => intersects(rect, viewport, frame))) continue
            range.collapse(true)
            return {
              cfi: content.cfiFromRange(range),
              text: text.slice(match.index, match.index + 120).replace(/\s+/g, ' ').trim(),
            }
          }
        }
      }
      node = walker.nextNode()
    }
  }
  return null
}

export function epubBookmarkIsVisible(rendition: Rendition, viewer: HTMLElement, cfi: string) {
  try {
    const range = rendition.getRange(cfi)
    if (!range) return false
    const content = (rendition.getContents() as unknown as Contents[]).find(
      (item) => item.document === range.startContainer.ownerDocument,
    )
    const frame = content?.window.frameElement?.getBoundingClientRect()
    if (!frame) return false
    if (range.collapsed && range.startContainer.nodeType === Node.TEXT_NODE) {
      const length = range.startContainer.textContent?.length ?? 0
      range.setEnd(range.startContainer, Math.min(range.startOffset + 1, length))
    }
    const viewport = viewer.getBoundingClientRect()
    return Array.from(range.getClientRects()).some((rect) => intersects(rect, viewport, frame))
  } catch {
    return false
  }
}
