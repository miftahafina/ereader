export interface BookRecord {
  id: string
  title: string
  author: string
  fileName: string
  size: number
  addedAt: number
  cover?: string
  data: ArrayBuffer
}

export type BookMeta = Omit<BookRecord, 'data'>

export interface ProgressRecord {
  id: string
  cfi?: string
  percentage: number
  updatedAt: number
}

export type ReaderTheme = 'light' | 'sepia' | 'dark'

export type FlowMode = 'paginated' | 'scrolled'

export interface ReaderSettings {
  theme: ReaderTheme
  fontSize: number
  fontFamily: string
  lineHeight: number
  paragraphSpacing: number
  flow: FlowMode
  maxWidth: number
  grain: number
  ttsRate: number
  ttsPitch: number
  ttsVoice: string
  debugMode: boolean
}
