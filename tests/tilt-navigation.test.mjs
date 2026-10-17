import assert from 'node:assert/strict'
import test from 'node:test'
import { createTiltDetector, horizontalTilt } from '../src/lib/tilt-navigation.ts'

function harness(sensitivity = 3) {
  const detect = createTiltDetector(sensitivity)
  let at = 0
  const results = []
  const sample = (angle = 0, step = 20) => {
    at += step
    const result = detect(angle, at)
    if (result) results.push(result)
  }
  const hold = (angle = 0, count = 25) => {
    for (let i = 0; i < count; i++) sample(angle)
  }
  return { sample, hold, results }
}

test('right and left tilts navigate relative to the initial grip', () => {
  for (const [angle, expected] of [[35, 'next'], [-15, 'prev']]) {
    const h = harness()
    h.hold(10)
    h.hold(angle)
    assert.deepEqual(h.results, [expected])
  }
})

test('holding the phone tilted turns only one page', () => {
  const h = harness()
  h.hold()
  h.hold(30, 200)
  assert.deepEqual(h.results, ['next'])
})

test('requires returning to neutral, even before an opposite tilt', () => {
  const h = harness()
  h.hold()
  h.hold(30)
  h.hold(-30, 100)
  assert.deepEqual(h.results, ['next'])
  h.hold()
  h.hold(-30)
  assert.deepEqual(h.results, ['next', 'prev'])
})

test('slow deliberate tilts work without a shake impulse', () => {
  const h = harness()
  h.hold()
  for (let angle = 0; angle <= 30; angle += 0.5) h.sample(angle)
  assert.deepEqual(h.results, ['next'])
})

test('small movements and brief spikes are ignored', () => {
  const h = harness()
  h.hold()
  h.hold(5)
  h.sample(35)
  h.sample(-35)
  h.hold()
  assert.deepEqual(h.results, [])
})

test('initial calibration requires a stable grip', () => {
  const h = harness()
  for (let i = 0; i < 40; i++) h.sample(i % 2 ? 30 : -30)
  h.hold(15)
  assert.deepEqual(h.results, [])
  h.hold(40)
  assert.deepEqual(h.results, ['next'])
})

test('a suspended sensor stream recalibrates without turning a page', () => {
  const h = harness()
  h.hold()
  h.sample(30, 1000)
  h.hold(30)
  assert.deepEqual(h.results, [])
  h.hold(55)
  assert.deepEqual(h.results, ['next'])
})

test('higher sensitivity accepts smaller tilts', () => {
  const low = harness(1)
  const high = harness(5)
  for (const h of [low, high]) {
    h.hold()
    h.hold(15)
  }
  assert.deepEqual(low.results, [])
  assert.deepEqual(high.results, ['next'])
})

test('invalid readings are ignored', () => {
  const detect = createTiltDetector(3)
  assert.equal(detect(NaN, 20), null)
  assert.equal(detect(Infinity, 40), null)
  assert.equal(detect(0, NaN), null)
})

test('screen-relative tilt supports portrait, landscape and inverted portrait', () => {
  for (const [beta, gamma, orientation, expected] of [
    [0, 25, 0, 25],
    [0, -25, 0, -25],
    [-25, 0, 90, 25],
    [25, 0, 90, -25],
    [25, 0, 270, 25],
    [-25, 0, -90, -25],
    [0, -25, 180, 25],
    [65, 90, 0, 25],
  ]) {
    assert.ok(Math.abs(horizontalTilt(beta, gamma, orientation) - expected) < 0.001)
  }
})

test('forward and backward pitch alone does not trigger lateral navigation', () => {
  const h = harness()
  h.hold()
  for (let beta = 0; beta <= 100; beta += 2) {
    h.sample(horizontalTilt(beta, 0, 0))
  }
  assert.deepEqual(h.results, [])
})
