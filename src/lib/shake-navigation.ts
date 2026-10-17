export interface ShakeSample {
  x: number
  y: number
  z: number
  at: number
}

export function createShakeDetector(sensitivity: number) {
  const threshold = 10 - Math.min(5, Math.max(1, sensitivity)) * 1.3
  let lastAt = 0
  let quietSince: number | null = null
  let armed = false
  let blockedUntil = 0
  let direction = 0
  let impulseSince = 0
  let samples = 0

  return ({ x, y, z, at }: ShakeSample): 'next' | 'prev' | null => {
    if (![x, y, z, at].every(Number.isFinite)) return null
    if (at - lastAt > 250) {
      armed = false
      quietSince = null
      direction = 0
    }
    lastAt = at
    const magnitude = Math.hypot(x, y, z)
    if (magnitude < 1.5) {
      quietSince ??= at
      if (at >= blockedUntil && at - quietSince >= 300) armed = true
      direction = 0
      return null
    }
    quietSince = null
    if (!armed || at < blockedUntil) return null
    if (Math.abs(x) < threshold || Math.abs(x) < Math.hypot(y, z) * 1.5) {
      direction = 0
      return null
    }
    const sign = Math.sign(x)
    if (direction !== sign) {
      direction = sign
      impulseSince = at
      samples = 1
      return null
    }
    samples += 1
    if (samples < 2 || at - impulseSince < 20) return null
    armed = false
    blockedUntil = at + 900
    direction = 0
    return sign > 0 ? 'next' : 'prev'
  }
}
