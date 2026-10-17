export function horizontalTilt(beta: number, gamma: number, screenAngle: number): number {
  const radians = Math.PI / 180
  const x = Math.cos(beta * radians) * Math.sin(gamma * radians)
  const y = Math.sin(beta * radians)
  const horizontal = x * Math.cos(screenAngle * radians) - y * Math.sin(screenAngle * radians)
  return Math.asin(Math.max(-1, Math.min(1, horizontal))) / radians
}

export function createTiltDetector(sensitivity: number) {
  const threshold = 32 - Math.min(5, Math.max(1, sensitivity)) * 4
  let baseline: number | null = null
  let candidate: number | null = null
  let stableSince = 0
  let lastAt = 0
  let neutralSince: number | null = null
  let armed = true
  let direction = 0
  let tiltedSince = 0
  let blockedUntil = 0

  return (angle: number, at: number): 'next' | 'prev' | null => {
    if (![angle, at].every(Number.isFinite)) return null
    if (at - lastAt > 600) {
      baseline = null
      candidate = null
      direction = 0
      neutralSince = null
      armed = true
    }
    lastAt = at
    if (baseline === null) {
      if (candidate === null || Math.abs(angle - candidate) > 3) {
        candidate = angle
        stableSince = at
      } else if (at - stableSince >= 350) {
        baseline = candidate
      }
      return null
    }
    const delta = angle - baseline
    if (Math.abs(delta) <= 6) {
      neutralSince ??= at
      if (at >= blockedUntil && at - neutralSince >= 200) armed = true
      direction = 0
      return null
    }
    neutralSince = null
    if (!armed || at < blockedUntil || Math.abs(delta) < threshold) {
      direction = 0
      return null
    }
    const sign = Math.sign(delta)
    if (direction !== sign) {
      direction = sign
      tiltedSince = at
      return null
    }
    if (at - tiltedSince < 120) return null
    armed = false
    blockedUntil = at + 600
    direction = 0
    return sign > 0 ? 'next' : 'prev'
  }
}
