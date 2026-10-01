export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

type RGB = { r: number; g: number; b: number }

const SCAN_WIDTH = 360
const DEFAULT_THRESHOLD = 34

function sampleBackground(data: Uint8ClampedArray, width: number, height: number): RGB {
  const patch = Math.max(2, Math.round(Math.min(width, height) * 0.02))
  const corners = [
    [0, 0],
    [width - patch, 0],
    [0, height - patch],
    [width - patch, height - patch],
  ]
  let r = 0
  let g = 0
  let b = 0
  let count = 0
  for (const [cx, cy] of corners) {
    for (let y = cy; y < cy + patch; y += 1) {
      for (let x = cx; x < cx + patch; x += 1) {
        const i = (y * width + x) * 4
        if (data[i + 3] < 128) continue
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
        count += 1
      }
    }
  }
  if (count === 0) return { r: 255, g: 255, b: 255 }
  return { r: r / count, g: g / count, b: b / count }
}

export function detectContentBounds(source: HTMLCanvasElement, threshold = DEFAULT_THRESHOLD): CropRect {
  const scanWidth = Math.min(SCAN_WIDTH, source.width)
  const scanHeight = Math.max(1, Math.round(source.height * (scanWidth / source.width)))
  const scan = document.createElement('canvas')
  scan.width = scanWidth
  scan.height = scanHeight
  const context = scan.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D
  context.drawImage(source, 0, 0, scanWidth, scanHeight)
  const { data } = context.getImageData(0, 0, scanWidth, scanHeight)
  const bg = sampleBackground(data, scanWidth, scanHeight)

  const limit = threshold * threshold
  let minX = scanWidth
  let minY = scanHeight
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < scanHeight; y += 1) {
    for (let x = 0; x < scanWidth; x += 1) {
      const i = (y * scanWidth + x) * 4
      if (data[i + 3] < 24) continue
      const dr = data[i] - bg.r
      const dg = data[i + 1] - bg.g
      const db = data[i + 2] - bg.b
      if (dr * dr + dg * dg + db * db > limit) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < 0) return { x: 0, y: 0, width: source.width, height: source.height }

  const scaleX = source.width / scanWidth
  const scaleY = source.height / scanHeight
  return {
    x: Math.max(0, Math.round(minX * scaleX)),
    y: Math.max(0, Math.round(minY * scaleY)),
    width: Math.min(source.width, Math.round((maxX - minX + 1) * scaleX)),
    height: Math.min(source.height, Math.round((maxY - minY + 1) * scaleY)),
  }
}

export function cropCanvas(source: HTMLCanvasElement, rect: CropRect, margin: number): HTMLCanvasElement {
  const x = Math.max(0, rect.x - margin)
  const y = Math.max(0, rect.y - margin)
  const right = Math.min(source.width, rect.x + rect.width + margin)
  const bottom = Math.min(source.height, rect.y + rect.height + margin)
  const width = Math.max(1, right - x)
  const height = Math.max(1, bottom - y)

  const out = document.createElement('canvas')
  out.width = width
  out.height = height
  const context = out.getContext('2d') as CanvasRenderingContext2D
  context.drawImage(source, x, y, width, height, 0, 0, width, height)
  return out
}
