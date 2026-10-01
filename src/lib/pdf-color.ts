import { themePalette } from './settings'
import type { ReaderTheme } from './types'

interface RGB {
  r: number
  g: number
  b: number
}

function hexToRgb(hex: string): RGB {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value
  const int = Number.parseInt(full, 16)
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

function luminance(color: RGB): number {
  return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b
}

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

const SATURATION_THRESHOLD = 48

export function recolorForTheme(
  canvas: HTMLCanvasElement,
  theme: ReaderTheme,
  opacity = 1,
  remap = true,
): void {
  const alpha = Math.min(1, Math.max(0, opacity))
  if (theme === 'light' && alpha >= 1) return

  const palette = themePalette[theme]
  const backgroundTarget = hexToRgb(palette.readerBg)
  const textTarget = hexToRgb(palette.text)
  const doRemap = remap && theme !== 'light'

  const context = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D
  const image = context.getImageData(0, 0, canvas.width, canvas.height)
  const data = image.data
  const source = doRemap
    ? sampleBackground(data, canvas.width, canvas.height)
    : { r: 255, g: 255, b: 255 }
  const sourceLuminance = Math.max(1, luminance(source))

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 8) continue
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const grayscale = max - min <= SATURATION_THRESHOLD

    if (doRemap && grayscale) {
      const ink = Math.min(1, Math.max(0, 1 - luminance({ r, g, b }) / sourceLuminance))
      r = backgroundTarget.r + (textTarget.r - backgroundTarget.r) * ink
      g = backgroundTarget.g + (textTarget.g - backgroundTarget.g) * ink
      b = backgroundTarget.b + (textTarget.b - backgroundTarget.b) * ink
    }

    data[i] = backgroundTarget.r + (r - backgroundTarget.r) * alpha
    data[i + 1] = backgroundTarget.g + (g - backgroundTarget.g) * alpha
    data[i + 2] = backgroundTarget.b + (b - backgroundTarget.b) * alpha
  }

  context.putImageData(image, 0, 0)
}
