import type { Book } from 'epubjs'

export interface SearchResult {
  cfi: string
  excerpt: string
  sectionIndex: number
}

interface SearchableSection {
  index: number
  contents?: unknown
  load(request?: unknown): Promise<unknown>
  find(query: string): { cfi: string; excerpt: string }[]
  unload(): void
}

interface BookSpine {
  spineItems: SearchableSection[]
}

export interface SearchOptions {
  limit?: number
  protectedSections?: Set<number>
  isCancelled?: () => boolean
  onProgress?: (scanned: number, total: number) => void
}

function cleanExcerpt(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export async function searchBook(
  book: Book,
  rawQuery: string,
  options: SearchOptions = {},
): Promise<SearchResult[]> {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return []

  const { limit = 100, protectedSections, isCancelled, onProgress } = options
  const spine = (book.spine as unknown as BookSpine | undefined)?.spineItems ?? []
  const request = (book.load as (path: string) => Promise<unknown>).bind(book)
  const results: SearchResult[] = []

  for (let index = 0; index < spine.length; index += 1) {
    if (isCancelled?.()) return results
    onProgress?.(index, spine.length)

    const section = spine[index]
    const wasLoaded = Boolean(section.contents)
    try {
      await section.load(request)
      for (const match of section.find(query)) {
        results.push({
          cfi: match.cfi,
          excerpt: cleanExcerpt(match.excerpt),
          sectionIndex: section.index,
        })
        if (results.length >= limit) break
      }
      if (!wasLoaded && !protectedSections?.has(section.index)) section.unload()
    } catch {
      // lewati section yang gagal dimuat
    }

    if (results.length >= limit) break
  }

  onProgress?.(spine.length, spine.length)
  return results
}
