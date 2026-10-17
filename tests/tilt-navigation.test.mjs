import assert from 'node:assert/strict'
import test from 'node:test'
import { createTiltDetector, orientationQuaternion } from '../src/lib/tilt-navigation.ts'

function harness(angle = 15, screenAngle = 0) {
  const detect = createTiltDetector(angle, screenAngle)
  let at = 0
  let reading = null
  const results = []
  const sample = (alpha = 0, beta = 0, gamma = 0, step = 20) => {
    at += step
    reading = detect(orientationQuaternion(alpha, beta, gamma), at)
    if (reading?.direction) results.push(reading.direction)
    return reading
  }
  const hold = (alpha = 0, beta = 0, gamma = 0, count = 25) => {
    for (let i = 0; i < count; i++) sample(alpha, beta, gamma)
    return reading
  }
  return { sample, hold, results }
}

test('15 degree right and left rolls turn pages', () => {
  for (const [alpha, expected] of [[-15, 'next'], [15, 'prev']]) {
    const h = harness()
    h.hold()
    const reading = h.hold(alpha)
    assert.ok(Math.abs(Math.abs(reading.roll) - 15) < 0.001)
    assert.deepEqual(h.results, [expected])
  }
})

test('15 degree twists turn pages while the phone is upright', () => {
  for (const [gamma, expected] of [[15, 'next'], [-15, 'prev']]) {
    const h = harness()
    h.hold(123, 90, 0)
    const reading = h.hold(123, 90, gamma)
    assert.ok(Math.abs(reading.twist - gamma) < 0.001)
    assert.deepEqual(h.results, [expected])
  }
})

test('heading rotation is detected even when the phone is upright', () => {
  const h = harness()
  h.hold(0, 90, 0)
  h.hold(20, 90, 0)
  assert.deepEqual(h.results, ['next'])
})

test('angles are relative to a comfortable tilted reading position', () => {
  const h = harness()
  h.hold(123, 65, 20)
  const reading = h.hold(123, 65, 35)
  assert.ok(Math.abs(reading.twist - 15) < 0.001)
  assert.deepEqual(h.results, ['next'])
})

test('a slow tilt triggers without any speed requirement', () => {
  const h = harness()
  h.hold()
  for (let gamma = 0; gamma <= 20; gamma += 0.1) h.sample(0, 0, gamma)
  assert.deepEqual(h.results, ['next'])
})

test('holding tilted turns just one page and requires neutral before another', () => {
  const h = harness()
  h.hold()
  h.hold(0, 0, 20, 150)
  h.hold(0, 0, -20, 100)
  assert.deepEqual(h.results, ['next'])
  h.hold(0, 0, 4)
  h.hold(0, 0, -20)
  assert.deepEqual(h.results, ['next', 'prev'])
})

test('returning to neutral does not turn a page', () => {
  const h = harness()
  h.hold()
  h.hold(0, 0, 20)
  h.hold()
  assert.deepEqual(h.results, ['next'])
  h.hold(0, 0, 20)
  assert.deepEqual(h.results, ['next', 'next'])
})

test('both axes must return within five degrees before rearming', () => {
  const h = harness()
  h.hold()
  h.hold(-20, 0, 0)
  h.hold(0, 0, 8, 60)
  h.hold(0, 0, -20)
  assert.deepEqual(h.results, ['next'])
})

test('motion below threshold, noise and brief spikes are ignored', () => {
  const h = harness()
  h.hold()
  h.hold(0, 0, 14)
  h.sample(0, 0, 30)
  h.hold()
  assert.deepEqual(h.results, [])
})

test('calibration waits for a steady initial grip', () => {
  const h = harness()
  for (let i = 0; i < 50; i++) h.sample(0, 0, i % 2 ? 25 : -25)
  assert.deepEqual(h.results, [])
  assert.equal(h.hold(0, 0, 10).calibrated, true)
  h.hold(0, 0, 30)
  assert.deepEqual(h.results, ['next'])
})

test('sensor gaps recalibrate at the new grip without navigating', () => {
  const h = harness()
  h.hold()
  h.sample(0, 0, 30, 1000)
  h.hold(0, 0, 30)
  assert.deepEqual(h.results, [])
  h.hold(0, 0, 45)
  assert.deepEqual(h.results, ['next'])
})

test('configurable thresholds are clamped between ten and thirty degrees', () => {
  for (const [threshold, gamma, expected] of [[10, 10, ['next']], [30, 29, []], [30, 30, ['next']], [1, 9, []], [100, 30, ['next']], [NaN, 10, ['next']]]) {
    const h = harness(threshold)
    h.hold()
    h.hold(0, 0, gamma)
    assert.deepEqual(h.results, expected)
  }
})

test('orientation wraparound does not create a large angle', () => {
  const h = harness()
  h.hold(355)
  const reading = h.hold(5)
  assert.ok(Math.abs(reading.roll + 10) < 0.001)
  assert.deepEqual(h.results, [])
  h.hold(15)
  assert.deepEqual(h.results, ['prev'])
})

test('relative angles follow portrait, landscape and inverted portrait', () => {
  for (const [screenAngle, beta, gamma] of [[0, 0, 20], [90, -20, 0], [270, 20, 0], [180, 0, -20]]) {
    const h = harness(15, screenAngle)
    h.hold()
    const reading = h.hold(0, beta, gamma)
    assert.ok(Math.abs(reading.twist - 20) < 0.001)
    assert.deepEqual(h.results, ['next'])
  }
})

test('forward and backward pitch alone does not navigate', () => {
  const h = harness()
  h.hold()
  h.hold(0, 40)
  h.hold(0, -40)
  assert.deepEqual(h.results, [])
})

test('invalid sensor readings are ignored', () => {
  const detect = createTiltDetector(15)
  assert.equal(detect(orientationQuaternion(NaN, 0, 0), 20), null)
  assert.equal(detect(orientationQuaternion(0, 0, 0), NaN), null)
})
