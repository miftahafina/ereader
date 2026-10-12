export type BookFormat = 'epub' | 'pdf'

export interface BookRecord {
  id: string
  title: string
  author: string
  fileName: string
  size: number
  addedAt: number
  cover?: string
  format?: BookFormat
  data: ArrayBuffer
}

export type BookMeta = Omit<BookRecord, 'data'>

export interface BookmarkRecord {
  id: string
  bookId: string
  format: BookFormat
  cfi?: string
  page?: number
  percentage: number
  label: string
  createdAt: number
}

export interface ProgressRecord {
  id: string
  cfi?: string
  page?: number
  percentage: number
  updatedAt: number
}

export type ReaderTheme = 'light' | 'sepia' | 'dark'

export type DarkBackground = 1 | 2 | 3 | 4 | 5

export type FlowMode = 'paginated' | 'scrolled'

export type TextAlign = 'default' | 'left' | 'center' | 'right' | 'justify'

export type PdfSpreadMode = 'auto' | 'single' | 'double'

export interface ReaderSettings {
  theme: ReaderTheme
  darkBackground: DarkBackground
  fontSize: number
  fontFamily: string
  fontOpacity: number
  lineHeight: number
  paragraphSpacing: number
  flow: FlowMode
  textAlign: TextAlign
  maxWidth: number
  grain: number
  ttsRate: number
  ttsPitch: number
  ttsVoice: string
  translateTo: string
  debugMode: boolean
  pdfSpread: PdfSpreadMode
  pdfCrop: boolean
  pdfCropMargin: number
  pdfZoom: number
  pdfReflow: boolean
  pdfScanTheme: boolean
}
