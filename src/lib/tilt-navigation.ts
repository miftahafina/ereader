export function screenRotation(alpha: number, beta: number, gamma: number, screenAngle: number) {
  const radians = screenAngle * Math.PI / 180
  return {
    roll: -alpha,
    twist: gamma * Math.cos(radians) - beta * Math.sin(radians),
  }
}

export function createWristDetector(sensitivity: number) {
  const threshold = 22 - Math.min(5, Math.max(1, sensitivity)) * 3
  let lastAt: number | null = null
  let stableSince: number | null = null
  let calibrated = false
  let rollAngle = 0
  let twistAngle = 0
  let armed = true
  let blockedUntil = 0

  return (roll: number, twist: number, at: number): 'next' | 'prev' | null => {
    if (![roll, twist, at].every(Number.isFinite)) return null
    const elapsed = lastAt === null ? 0 : at - lastAt
    lastAt = at
    if (elapsed < 0 || elapsed > 250) {
      calibrated = false
      stableSince = null
      rollAngle = 0
      twistAngle = 0
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
    rollAngle += (Math.abs(roll) >= 2 ? roll : 0) * elapsed / 1000
    twistAngle += (Math.abs(twist) >= 2 ? twist : 0) * elapsed / 1000
    if (Math.max(Math.abs(rollAngle), Math.abs(twistAngle)) <= 5 && speed < 8) {
      stableSince ??= at
      if (at >= blockedUntil && at - stableSince >= 200) {
        armed = true
        rollAngle = 0
        twistAngle = 0
      }
      return null
    }
    stableSince = null
    if (!armed || at < blockedUntil || speed < 12) return null
    const displacement = Math.abs(rollAngle) >= Math.abs(twistAngle) ? rollAngle : twistAngle
    if (Math.abs(displacement) < threshold) return null
    armed = false
    blockedUntil = at + 650
    return displacement > 0 ? 'next' : 'prev'
  }
}
