import * as pdfjs from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export interface PdfMetadata {
  title: string
  author: string
  cover?: string
  pages: number
}

export interface PdfOutlineItem {
  title: string
  page: number
  items?: PdfOutlineItem[]
}

export interface RenderedPage {
  canvas: HTMLCanvasElement
  task: RenderTask
}

export function loadPdfDocument(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  const task = pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) })
  return task.promise
}

export function renderPage(page: PDFPageProxy, scale: number, background = '#ffffff'): RenderedPage {
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(viewport.width))
  canvas.height = Math.max(1, Math.floor(viewport.height))
  const task = page.render({ canvas, viewport, background })
  return { canvas, task }
}

async function renderPageToDataUrl(page: PDFPageProxy, targetWidth: number): Promise<string> {
  const base = page.getViewport({ scale: 1 })
  const scale = Math.min(2, targetWidth / base.width)
  const { canvas, task } = renderPage(page, scale)
  await task.promise
  return canvas.toDataURL('image/jpeg', 0.72)
}

export async function extractPdfMetadata(data: ArrayBuffer): Promise<PdfMetadata> {
  const doc = await loadPdfDocument(data)
  try {
    const info = await doc.getMetadata().catch(() => null)
    const raw = info?.info as { Title?: string; Author?: string } | undefined
    let cover: string | undefined
    try {
      const page = await doc.getPage(1)
      cover = await renderPageToDataUrl(page, 320)
    } catch {
      cover = undefined
    }
    return {
      title: raw?.Title?.trim() || 'Tanpa judul',
      author: raw?.Author?.trim() || 'Penulis tidak diketahui',
      cover,
      pages: doc.numPages,
    }
  } finally {
    await doc.loadingTask.destroy()
  }
}

interface RawOutlineItem {
  title: string
  dest: string | unknown[] | null
  items?: RawOutlineItem[]
}

async function resolveOutline(
  doc: PDFDocumentProxy,
  items: RawOutlineItem[],
): Promise<PdfOutlineItem[]> {
  return Promise.all(
    items.map(async (item) => {
      let page = 1
      try {
        const dest =
          typeof item.dest === 'string' ? await doc.getDestination(item.dest) : item.dest
        const ref = Array.isArray(dest) ? dest[0] : null
        if (ref && typeof ref === 'object' && 'num' in ref) {
          page = (await doc.getPageIndex(ref as { num: number; gen: number })) + 1
        }
      } catch {
        page = 1
      }
      const children = await resolveOutline(doc, item.items ?? [])
      return children.length > 0
        ? { title: item.title, page, items: children }
        : { title: item.title, page }
    }),
  )
}

export async function getPdfOutline(doc: PDFDocumentProxy): Promise<PdfOutlineItem[]> {
  const outline = (await doc.getOutline().catch(() => null)) as RawOutlineItem[] | null
  return outline ? resolveOutline(doc, outline) : []
}
