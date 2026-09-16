export interface TranslationResult {
  translated: string
  from: string
  to: string
}

const API_BASE = 'https://translate.googleapis.com/translate_a/single'
const MAX_CHARS = 4500
const TIMEOUT_MS = 15000
const BATCH_SEPARATOR = '\n\n'

function parseResponse(data: unknown): TranslationResult | null {
  if (!Array.isArray(data) || !Array.isArray(data[0])) return null
  const segments = data[0] as unknown[]
  const translated = segments
    .map((seg) => (Array.isArray(seg) && typeof seg[0] === 'string' ? seg[0] : ''))
    .join('')
  if (!translated.trim()) return null
  const from = typeof data[2] === 'string' && data[2] ? data[2] : 'auto'
  return { translated, from, to: '' }
}

async function translateChunk(
  text: string,
  target: string,
  signal: AbortSignal,
): Promise<TranslationResult> {
  const url = `${API_BASE}?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Translate failed: ${response.status}`)
  const result = parseResponse(await response.json())
  if (!result) throw new Error('Translate response malformed')
  return { translated: result.translated, from: result.from, to: target }
}

function splitChunks(text: string): string[] {
  if (text.length <= MAX_CHARS) return [text]
  const sentences = text.match(/[^.!?。！？]+[.!?。！？]*/gu) ?? [text]
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if ((current + sentence).length > MAX_CHARS && current) {
      chunks.push(current)
      current = ''
    }
    current += sentence
    if (current.length > MAX_CHARS) {
      while (current.length > MAX_CHARS) {
        chunks.push(current.slice(0, MAX_CHARS))
        current = current.slice(MAX_CHARS)
      }
    }
  }
  if (current.trim()) chunks.push(current)
  return chunks
}

async function translateText(
  text: string,
  target: string,
  signal?: AbortSignal,
): Promise<TranslationResult | null> {
  const trimmed = text.trim()
  if (!trimmed) return null
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const chunks = splitChunks(trimmed)
    const results = await Promise.all(
      chunks.map((chunk) => translateChunk(chunk, target, controller.signal)),
    )
    const first = results[0]
    if (!first) return null
    return {
      translated: results.map((result) => result.translated).join(' '),
      from: first.from,
      to: target,
    }
  } finally {
    window.clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

function normalizeBlock(text: string): string {
  return text.replace(/\s*\n+\s*/g, ' ').replace(/[ \t]{2,}/g, ' ').trim()
}

async function safeTranslate(
  text: string,
  target: string,
  signal?: AbortSignal,
): Promise<TranslationResult | null> {
  try {
    return await translateText(text, target, signal)
  } catch {
    return null
  }
}

export async function fetchTranslation(
  text: string,
  target: string,
  signal?: AbortSignal,
): Promise<TranslationResult | null> {
  return safeTranslate(text, target, signal)
}

export async function fetchTranslations(
  texts: string[],
  target: string,
  signal?: AbortSignal,
): Promise<(TranslationResult | null)[]> {
  const results: (TranslationResult | null)[] = texts.map(() => null)
  if (texts.length === 0) return results

  const groups: number[][] = []
  let group: number[] = []
  let groupLength = 0
  texts.forEach((text, index) => {
    const size = normalizeBlock(text).length + BATCH_SEPARATOR.length
    if (group.length > 0 && groupLength + size > MAX_CHARS) {
      groups.push(group)
      group = []
      groupLength = 0
    }
    group.push(index)
    groupLength += size
  })
  if (group.length > 0) groups.push(group)

  await Promise.all(
    groups.map(async (indices) => {
      if (indices.length === 1) {
        results[indices[0]] = await safeTranslate(texts[indices[0]], target, signal)
        return
      }
      const combined = indices.map((index) => normalizeBlock(texts[index])).join(BATCH_SEPARATOR)
      try {
        const result = await translateText(combined, target, signal)
        if (!result) throw new Error('Empty translation')
        const parts = result.translated
          .split(/\n+/)
          .map((part) => part.trim())
          .filter(Boolean)
        if (parts.length !== indices.length) throw new Error('Batch mismatch')
        indices.forEach((index, position) => {
          results[index] = { translated: parts[position], from: result.from, to: target }
        })
      } catch {
        if (signal?.aborted) return
        const fallback = await Promise.all(
          indices.map((index) => safeTranslate(texts[index], target, signal)),
        )
        indices.forEach((index, position) => {
          results[index] = fallback[position]
        })
      }
    }),
  )

  return results
}

export const translateLanguageOptions: { value: string; label: string }[] = [
  { value: 'id', label: 'Indonesia' },
  { value: 'en', label: 'Inggris' },
  { value: 'ms', label: 'Melayu' },
  { value: 'ja', label: 'Jepang' },
  { value: 'ko', label: 'Korea' },
  { value: 'zh-CN', label: 'Mandarin' },
  { value: 'es', label: 'Spanyol' },
  { value: 'fr', label: 'Prancis' },
  { value: 'de', label: 'Jerman' },
  { value: 'ar', label: 'Arab' },
  { value: 'pt', label: 'Portugis' },
  { value: 'th', label: 'Thailand' },
  { value: 'vi', label: 'Vietnam' },
  { value: 'hi', label: 'Hindi' },
  { value: 'it', label: 'Italia' },
  { value: 'ru', label: 'Rusia' },
  { value: 'tr', label: 'Turki' },
  { value: 'nl', label: 'Belanda' },
  { value: 'pl', label: 'Polandia' },
]
