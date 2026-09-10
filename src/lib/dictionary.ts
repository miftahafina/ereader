export interface WordDefinition {
  word: string
  phonetic?: string
  definitions: { partOfSpeech: string; meaning: string; example?: string }[]
}

interface WiktionaryDefinition {
  definition?: string
  parsedExamples?: { example?: string }[]
}

interface WiktionaryEntry {
  partOfSpeech?: string
  language?: string
  definitions?: WiktionaryDefinition[]
}

const API_BASE = 'https://en.wiktionary.org/api/rest_v1/page/definition'
const MAX_DEFINITIONS = 4
const TIMEOUT_MS = 10000

function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

export async function fetchDefinition(
  word: string,
  signal?: AbortSignal,
): Promise<WordDefinition | null> {
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(word)}`, {
      signal: controller.signal,
    })
    if (!response.ok) return null

    const data = (await response.json()) as Record<string, WiktionaryEntry[]>
    const entries = data.en ?? Object.values(data)[0] ?? []
    const definitions: WordDefinition['definitions'] = []

    for (const entry of entries) {
      for (const item of entry.definitions ?? []) {
        if (!item.definition) continue
        const meaning = htmlToText(item.definition)
        if (!meaning) continue
        const rawExample = item.parsedExamples?.[0]?.example
        definitions.push({
          partOfSpeech: entry.partOfSpeech ?? '',
          meaning,
          example: rawExample ? htmlToText(rawExample) : undefined,
        })
        if (definitions.length >= MAX_DEFINITIONS) break
      }
      if (definitions.length >= MAX_DEFINITIONS) break
    }

    if (definitions.length === 0) return null
    return { word, definitions }
  } finally {
    window.clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}
