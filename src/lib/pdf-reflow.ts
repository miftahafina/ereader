import type { PDFPageProxy } from 'pdfjs-dist'

export interface ReflowBlock {
  kind: 'heading' | 'paragraph'
  text: string
}

interface TextLine {
  y: number
  height: number
  x: number
  parts: string[]
}

function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export async function extractReflowBlocks(page: PDFPageProxy): Promise<ReflowBlock[]> {
  const content = await page.getTextContent()
  const raw = content.items
    .filter((item) => 'str' in item && item.str.trim().length > 0)
    .map((item) => {
      const textItem = item as { str: string; transform: number[]; height?: number; width?: number }
      return {
        str: textItem.str,
        x: textItem.transform[4],
        y: textItem.transform[5],
        height: textItem.height || Math.abs(textItem.transform[3]) || 10,
      }
    })

  if (raw.length === 0) return []

  raw.sort((a, b) => b.y - a.y || a.x - b.x)

  const lines: TextLine[] = []
  for (const item of raw) {
    const tolerance = Math.max(2, item.height * 0.6)
    const line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= tolerance)
    if (line) {
      line.parts.push(item.str)
      line.height = Math.max(line.height, item.height)
      line.x = Math.min(line.x, item.x)
    } else {
      lines.push({ y: item.y, height: item.height, x: item.x, parts: [item.str] })
    }
  }

  const heights = lines.map((line) => line.height).sort((a, b) => a - b)
  const median = heights[Math.floor(heights.length / 2)] || 10
  const headingThreshold = median * 1.35
  const paragraphGap = median * 1.9

  const blocks: ReflowBlock[] = []
  let paragraph: string[] = []
  let previousY: number | null = null

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: 'paragraph', text: collapse(paragraph.join(' ')) })
      paragraph = []
    }
  }

  for (const line of lines) {
    const text = collapse(line.parts.join(' '))
    if (!text) continue

    if (line.height >= headingThreshold) {
      flushParagraph()
      blocks.push({ kind: 'heading', text })
      previousY = line.y
      continue
    }

    if (previousY !== null && previousY - line.y > paragraphGap) {
      flushParagraph()
    }

    paragraph.push(text)
    previousY = line.y
  }

  flushParagraph()
  return blocks
}
