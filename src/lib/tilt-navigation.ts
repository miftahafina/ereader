export interface OrientationQuaternion {
  x: number
  y: number
  z: number
  w: number
}

export interface TiltReading {
  roll: number
  twist: number
  calibrated: boolean
  direction: 'next' | 'prev' | null
}

export function orientationQuaternion(alpha: number, beta: number, gamma: number): OrientationQuaternion {
  const halfRadians = Math.PI / 360
  const a = alpha * halfRadians
  const b = beta * halfRadians
  const g = gamma * halfRadians
  return {
    x: Math.cos(a) * Math.sin(b) * Math.cos(g) - Math.sin(a) * Math.cos(b) * Math.sin(g),
    y: Math.cos(a) * Math.cos(b) * Math.sin(g) + Math.sin(a) * Math.sin(b) * Math.cos(g),
    z: Math.sin(a) * Math.cos(b) * Math.cos(g) + Math.cos(a) * Math.sin(b) * Math.sin(g),
    w: Math.cos(a) * Math.cos(b) * Math.cos(g) - Math.sin(a) * Math.sin(b) * Math.sin(g),
  }
}

function relativeRotation(origin: OrientationQuaternion, current: OrientationQuaternion) {
  const sign = origin.x * current.x + origin.y * current.y + origin.z * current.z + origin.w * current.w < 0 ? -1 : 1
  const x = (origin.w * current.x - origin.x * current.w - origin.y * current.z + origin.z * current.y) * sign
  const y = (origin.w * current.y + origin.x * current.z - origin.y * current.w - origin.z * current.x) * sign
  const z = (origin.w * current.z - origin.x * current.y + origin.y * current.x - origin.z * current.w) * sign
  const w = (origin.w * current.w + origin.x * current.x + origin.y * current.y + origin.z * current.z) * sign
  const length = Math.hypot(x, y, z)
  const degrees = 2 * Math.atan2(length, Math.max(0, w)) * 180 / Math.PI
  const scale = length > 0.000001 ? degrees / length : 0
  return { x: x * scale, y: y * scale, z: z * scale, degrees }
}

export function createTiltDetector(angle: number, screenAngle = 0) {
  const threshold = Number.isFinite(angle) ? Math.min(30, Math.max(10, angle)) : 10
  const radians = screenAngle * Math.PI / 180
  let baseline: OrientationQuaternion | null = null
  let candidate: OrientationQuaternion | null = null
  let stableSince = 0
  let lastAt: number | null = null
  let armed = true
  let neutralSince: number | null = null
  let pending = 0
  let pendingSince = 0
  let blockedUntil = 0

  return (orientation: OrientationQuaternion, at: number): TiltReading | null => {
    if (![orientation.x, orientation.y, orientation.z, orientation.w, at].every(Number.isFinite)) return null
    if (lastAt !== null && (at - lastAt > 750 || at < lastAt)) {
      baseline = null
      candidate = null
      armed = true
      pending = 0
      neutralSince = null
      blockedUntil = 0
    }
    lastAt = at
    if (!baseline) {
      if (!candidate || relativeRotation(candidate, orientation).degrees > 2) {
        candidate = orientation
        stableSince = at
      } else if (at - stableSince >= 350) {
        baseline = candidate
      }
      return { roll: 0, twist: 0, calibrated: !!baseline, direction: null }
    }
    const rotation = relativeRotation(baseline, orientation)
    const roll = -rotation.z
    const twist = rotation.y * Math.cos(radians) - rotation.x * Math.sin(radians)
    const reading: TiltReading = { roll, twist, calibrated: true, direction: null }
    if (Math.max(Math.abs(roll), Math.abs(twist)) <= 5.000001) {
      neutralSince ??= at
      if (at >= blockedUntil && at - neutralSince >= 150) armed = true
      pending = 0
      return reading
    }
    neutralSince = null
    const displacement = Math.abs(roll) >= Math.abs(twist) ? roll : twist
    if (!armed || at < blockedUntil || Math.abs(displacement) + 0.000001 < threshold) {
      pending = 0
      return reading
    }
    const direction = Math.sign(displacement)
    if (pending !== direction) {
      pending = direction
      pendingSince = at
      return reading
    }
    if (at - pendingSince < 80) return reading
    armed = false
    blockedUntil = at + 500
    pending = 0
    reading.direction = direction > 0 ? 'next' : 'prev'
    return reading
  }
}
