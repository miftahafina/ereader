export function extractWord(text: string): string | null {
  const word = text.replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu, '')
  if (!word || /\s/.test(word)) return null
  return word
}
