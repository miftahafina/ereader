import ePub from 'epubjs'

export interface ExtractedMetadata {
  title: string
  author: string
  cover?: string
}

function blobUrlToDataUrl(url: string): Promise<string> {
  return fetch(url)
    .then((res) => res.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(blob)
        }),
    )
}

export async function extractMetadata(data: ArrayBuffer): Promise<ExtractedMetadata> {
  const book = ePub(data)
  try {
    await book.ready
    const metadata = await book.loaded.metadata

    let cover: string | undefined
    try {
      const coverUrl = await book.coverUrl()
      if (coverUrl) {
        cover = await blobUrlToDataUrl(coverUrl)
      }
    } catch {
      cover = undefined
    }

    return {
      title: metadata?.title?.trim() || 'Tanpa judul',
      author: metadata?.creator?.trim() || 'Penulis tidak diketahui',
      cover,
    }
  } finally {
    book.destroy()
  }
}
