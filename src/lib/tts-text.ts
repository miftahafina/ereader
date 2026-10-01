import type { Contents } from 'epubjs'

const BLOCK_SELECTOR = 'p, div, li, h1, h2, h3, h4, h5, h6'
const MAX_CHUNK_SIZE = 1024

function isVisible(el: Element): boolean {
  const body = el.ownerDocument.body
  const rect = el.getBoundingClientRect()
  return (
    rect.top < body.clientHeight &&
    rect.bottom > 0 &&
    rect.left < body.clientWidth &&
    rect.right > 0
  )
}

function splitIntoChunks(blocks: string[]): string[] {
  const chunks: string[] = []
  blocks.forEach((block) => {
    block.split(/\n+/).forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed) return
      if (trimmed.length <= MAX_CHUNK_SIZE) {
        chunks.push(trimmed)
        return
      }
      let rest = trimmed
      while (rest.length > 0) {
        if (rest.length <= MAX_CHUNK_SIZE) {
          chunks.push(rest)
          break
        }
        const splitIndex = rest.slice(0, MAX_CHUNK_SIZE).lastIndexOf(' ')
        const actualIndex = splitIndex > 100 ? splitIndex : MAX_CHUNK_SIZE
        chunks.push(rest.slice(0, actualIndex))
        rest = rest.slice(actualIndex).trim()
      }
    })
  })
  return chunks
}

export function collectVisibleChunks(contents: Contents[]): string[] | null {
  const active = contents.find((content) =>
    Array.from(content.window.document.querySelectorAll(BLOCK_SELECTOR)).some(isVisible),
  )
  if (!active) return null

  const blocks = Array.from(active.window.document.querySelectorAll(BLOCK_SELECTOR))
    .filter(isVisible)
    .map((el) => (el as HTMLElement).innerText)
    .filter((text) => text.trim().length > 0)

  return splitIntoChunks(blocks)
}
