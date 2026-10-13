import type { PdfReflowAnchor } from './types'

function textRange(element: HTMLElement, offset: number) {
  const node = element.firstChild
  if (!node || node.nodeType !== Node.TEXT_NODE || !node.textContent?.length) return null
  const start = Math.min(Math.max(0, offset), node.textContent.length - 1)
  const range = document.createRange()
  range.setStart(node, start)
  range.setEnd(node, start + 1)
  return range
}

function columnAt(content: HTMLElement, element: HTMLElement, offset: number, step: number) {
  const range = textRange(element, offset)
  if (!range) return null
  return Math.max(0, Math.floor(
    (range.getBoundingClientRect().left - content.getBoundingClientRect().left + 1) / step,
  ))
}

export function reflowAnchorColumn(content: HTMLElement, anchor: PdfReflowAnchor, step: number) {
  const element = content.querySelector<HTMLElement>(
    `[data-pdf-page="${anchor.page}"] [data-reflow-block="${anchor.block}"]`,
  )
  return element ? columnAt(content, element, anchor.offset, step) : null
}

export function firstReflowAnchor(content: HTMLElement, column: number, step: number): PdfReflowAnchor | null {
  for (const element of content.querySelectorAll<HTMLElement>('[data-reflow-block]')) {
    const text = element.textContent ?? ''
    if (!text.length) continue
    const node = element.firstChild
    if (!node) continue
    const range = document.createRange()
    range.selectNodeContents(element)
    const left = content.getBoundingClientRect().left
    const visible = Array.from(range.getClientRects()).some((rect) =>
      Math.floor((rect.left - left + 1) / step) === column,
    )
    if (!visible) continue
    let low = 0
    let high = text.length - 1
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      const current = columnAt(content, element, middle, step)
      if (current === null) break
      if (current < column) low = middle + 1
      else high = middle
    }
    while (low < text.length - 1 && /\s/.test(text[low])) low++
    return {
      page: Number(element.closest<HTMLElement>('[data-pdf-page]')?.dataset.pdfPage),
      block: Number(element.dataset.reflowBlock),
      offset: low,
      text: text.slice(low, low + 120).trim(),
    }
  }
  return null
}
