import assert from 'node:assert/strict'
import test from 'node:test'
import { createWristDetector, screenRotation, wristSpeedThreshold } from '../src/lib/tilt-navigation.ts'

function harness(sensitivity = 3) {
  const detect = createWristDetector(sensitivity)
  let at = 0
  const results = []
  const sample = (roll = 0, twist = 0, step = 20) => {
    at += step
    const result = detect(roll, twist, at)
    if (result) results.push(result)
  }
  const move = (roll = 0, twist = 0, count = 25) => {
    for (let i = 0; i < count; i++) sample(roll, twist)
  }
  return { sample, move, results }
}

test('clockwise and counterclockwise wrist rolls navigate', () => {
  for (const [rate, expected] of [[120, 'next'], [-120, 'prev']]) {
    const h = harness()
    h.move()
    h.move(rate)
    assert.deepEqual(h.results, [expected])
  }
})

test('wrist twists work while the phone is upright without a gravity change', () => {
  for (const [rate, expected] of [[120, 'next'], [-120, 'prev']]) {
    const h = harness()
    h.move()
    h.move(0, rate)
    assert.deepEqual(h.results, [expected])
  }
})

test('immediate rebound is ignored, another fast gesture works after settling', () => {
  const h = harness()
  h.move()
  h.move(120, 0, 5)
  h.move(-120, 0, 5)
  assert.deepEqual(h.results, ['next'])
  h.move(0, 0, 50)
  assert.deepEqual(h.results, ['next'])
  h.move(-120, 0, 5)
  assert.deepEqual(h.results, ['next', 'prev'])
})

test('continuous rotation cannot turn multiple pages', () => {
  const h = harness()
  h.move()
  h.move(90, 0, 100)
  assert.deepEqual(h.results, ['next'])
})

test('small jitter and isolated short impulses are ignored', () => {
  const h = harness()
  h.move()
  for (let i = 0; i < 100; i++) h.sample(i % 2 ? 4 : -4)
  h.sample(100)
  h.move()
  assert.deepEqual(h.results, [])
})

test('calibration waits for a steady grip', () => {
  const h = harness()
  h.move(120)
  assert.deepEqual(h.results, [])
  h.move()
  h.move(120)
  assert.deepEqual(h.results, ['next'])
})

test('sensor gaps recalibrate without turning pages', () => {
  const h = harness()
  h.move()
  h.sample(120, 0, 1000)
  h.move(120)
  assert.deepEqual(h.results, [])
  h.move()
  h.move(120)
  assert.deepEqual(h.results, ['next'])
})

test('higher sensitivity accepts lower speeds', () => {
  const low = harness(1)
  const high = harness(5)
  for (const h of [low, high]) {
    h.move()
    h.move(50, 0, 5)
  }
  assert.deepEqual(low.results, [])
  assert.deepEqual(high.results, ['next'])
})

test('a brief fast rotation with a small angle triggers immediately', () => {
  const h = harness()
  h.move()
  h.sample(100)
  h.sample(100)
  assert.deepEqual(h.results, ['next'])
})

test('slow rotations are ignored regardless of their total angle', () => {
  const h = harness()
  h.move()
  h.move(30, 0, 200)
  h.move()
  h.move(0, -30, 200)
  assert.deepEqual(h.results, [])
})

test('changing direction or axis cannot combine unrelated fast readings', () => {
  const h = harness()
  h.move()
  for (let i = 0; i < 20; i++) h.sample(i % 2 ? 120 : -120)
  h.move()
  for (let i = 0; i < 20; i++) h.sample(i % 2 ? 120 : 0, i % 2 ? 0 : 120)
  assert.deepEqual(h.results, [])
})

test('speed thresholds match settings and are bounded', () => {
  assert.equal(wristSpeedThreshold(1), 95)
  assert.equal(wristSpeedThreshold(3), 65)
  assert.equal(wristSpeedThreshold(5), 35)
  assert.equal(wristSpeedThreshold(0), 95)
  assert.equal(wristSpeedThreshold(10), 35)
})

test('invalid readings are ignored', () => {
  const detect = createWristDetector(3)
  assert.equal(detect(NaN, 0, 20), null)
  assert.equal(detect(0, Infinity, 40), null)
  assert.equal(detect(0, 0, NaN), null)
})

test('screen-relative axes support portrait, landscape and inverted portrait', () => {
  for (const [alpha, beta, gamma, angle, roll, twist] of [
    [-40, 0, 30, 0, 40, 30],
    [-40, -30, 0, 90, 40, 30],
    [-40, 30, 0, 270, 40, 30],
    [-40, 0, -30, 180, 40, 30],
  ]) {
    const result = screenRotation(alpha, beta, gamma, angle)
    assert.ok(Math.abs(result.roll - roll) < 0.001)
    assert.ok(Math.abs(result.twist - twist) < 0.001)
  }
})

test('forward and backward pitch alone does not navigate', () => {
  const h = harness()
  h.move()
  for (let i = 0; i < 50; i++) {
    const { roll, twist } = screenRotation(0, i % 2 ? 60 : -60, 0, 0)
    h.sample(roll, twist)
  }
  assert.deepEqual(h.results, [])
})
