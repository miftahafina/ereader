export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

type RGB = { r: number; g: number; b: number }

const SCAN_WIDTH = 360
const DEFAULT_THRESHOLD = 34
const DILATE_RADIUS = 2
const MIN_COMPONENT_INK = 12
const MIN_COMPONENT_INK_RATIO = 0.00008

function sampleBackground(data: Uint8ClampedArray, width: number, height: number): RGB {
  const patch = Math.max(2, Math.round(Math.min(width, height) * 0.02))
  const corners = [
    [0, 0],
    [width - patch, 0],
    [0, height - patch],
    [width - patch, height - patch],
  ]
  const reds: number[] = []
  const greens: number[] = []
  const blues: number[] = []
  for (const [cx, cy] of corners) {
    for (let y = cy; y < cy + patch; y += 1) {
      for (let x = cx; x < cx + patch; x += 1) {
        const i = (y * width + x) * 4
        if (data[i + 3] < 128) continue
        reds.push(data[i])
        greens.push(data[i + 1])
        blues.push(data[i + 2])
      }
    }
  }
  if (reds.length === 0) return { r: 255, g: 255, b: 255 }
  const median = (values: number[]) => {
    values.sort((a, b) => a - b)
    return values[Math.floor(values.length / 2)]
  }
  return { r: median(reds), g: median(greens), b: median(blues) }
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
  const ink = new Uint8Array(scanWidth * scanHeight)
  const dilated = new Uint8Array(scanWidth * scanHeight)
  let hasInk = false

  for (let y = 0; y < scanHeight; y += 1) {
    for (let x = 0; x < scanWidth; x += 1) {
      const i = (y * scanWidth + x) * 4
      if (data[i + 3] < 24) continue
      const dr = data[i] - bg.r
      const dg = data[i + 1] - bg.g
      const db = data[i + 2] - bg.b
      if (dr * dr + dg * dg + db * db > limit) {
        ink[y * scanWidth + x] = 1
        hasInk = true
      }
    }
  }

  if (!hasInk) return { x: 0, y: 0, width: source.width, height: source.height }

  for (let y = 0; y < scanHeight; y += 1) {
    for (let x = 0; x < scanWidth; x += 1) {
      if (ink[y * scanWidth + x] !== 1) continue
      const top = Math.max(0, y - DILATE_RADIUS)
      const bottom = Math.min(scanHeight - 1, y + DILATE_RADIUS)
      const left = Math.max(0, x - DILATE_RADIUS)
      const right = Math.min(scanWidth - 1, x + DILATE_RADIUS)
      for (let ny = top; ny <= bottom; ny += 1) {
        for (let nx = left; nx <= right; nx += 1) {
          dilated[ny * scanWidth + nx] = 1
        }
      }
    }
  }

  const minInk = Math.max(MIN_COMPONENT_INK, Math.round(scanWidth * scanHeight * MIN_COMPONENT_INK_RATIO))
  let minX = scanWidth
  let minY = scanHeight
  let maxX = -1
  let maxY = -1
  const stack: number[] = []

  for (let start = 0; start < dilated.length; start += 1) {
    if (dilated[start] !== 1) continue
    dilated[start] = 0
    stack.length = 0
    stack.push(start)
    let inkCount = 0
    let componentMinX = scanWidth
    let componentMinY = scanHeight
    let componentMaxX = -1
    let componentMaxY = -1

    while (stack.length > 0) {
      const index = stack.pop() as number
      const x = index % scanWidth
      const y = (index - x) / scanWidth

      if (ink[index] === 1) {
        inkCount += 1
        if (x < componentMinX) componentMinX = x
        if (x > componentMaxX) componentMaxX = x
        if (y < componentMinY) componentMinY = y
        if (y > componentMaxY) componentMaxY = y
      }

      for (let ny = y - 1; ny <= y + 1; ny += 1) {
        if (ny < 0 || ny >= scanHeight) continue
        for (let nx = x - 1; nx <= x + 1; nx += 1) {
          if (nx < 0 || nx >= scanWidth) continue
          const neighbor = ny * scanWidth + nx
          if (dilated[neighbor] === 1) {
            dilated[neighbor] = 0
            stack.push(neighbor)
          }
        }
      }
    }

    if (inkCount >= minInk) {
      if (componentMinX < minX) minX = componentMinX
      if (componentMaxX > maxX) maxX = componentMaxX
      if (componentMinY < minY) minY = componentMinY
      if (componentMaxY > maxY) maxY = componentMaxY
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
