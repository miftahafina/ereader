export function screenRotation(alpha: number, beta: number, gamma: number, screenAngle: number) {
  const radians = screenAngle * Math.PI / 180
  return {
    roll: -alpha,
    twist: gamma * Math.cos(radians) - beta * Math.sin(radians),
  }
}

export function wristSpeedThreshold(sensitivity: number) {
  return 110 - Math.min(5, Math.max(1, sensitivity)) * 15
}

export function createWristDetector(sensitivity: number) {
  const threshold = wristSpeedThreshold(sensitivity)
  let lastAt: number | null = null
  let stableSince: number | null = null
  let calibrated = false
  let candidate = 0
  let fastSince = 0
  let armed = true
  let blockedUntil = 0

  return (roll: number, twist: number, at: number): 'next' | 'prev' | null => {
    if (![roll, twist, at].every(Number.isFinite)) return null
    const elapsed = lastAt === null ? 0 : at - lastAt
    lastAt = at
    if (elapsed < 0 || elapsed > 250) {
      calibrated = false
      stableSince = null
      candidate = 0
      armed = true
      return null
    }
    const speed = Math.hypot(roll, twist)
    if (!calibrated) {
      if (speed > 8) stableSince = null
      else {
        stableSince ??= at
        if (at - stableSince >= 300) {
          calibrated = true
          stableSince = null
        }
      }
      return null
    }
    if (speed < 12) {
      stableSince ??= at
      if (at >= blockedUntil && at - stableSince >= 200) {
        armed = true
      }
      candidate = 0
      return null
    }
    stableSince = null
    const rate = Math.abs(roll) >= Math.abs(twist) ? roll : twist
    if (!armed || at < blockedUntil || Math.abs(rate) < threshold) {
      candidate = 0
      return null
    }
    const nextCandidate = Math.sign(rate) * (Math.abs(roll) >= Math.abs(twist) ? 1 : 2)
    if (candidate !== nextCandidate) {
      candidate = nextCandidate
      fastSince = at
      return null
    }
    if (at - fastSince < 20) return null
    armed = false
    blockedUntil = at + 700
    candidate = 0
    return rate > 0 ? 'next' : 'prev'
  }
}
