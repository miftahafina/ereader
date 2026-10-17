import assert from 'node:assert/strict'
import test from 'node:test'
import { createShakeDetector } from '../src/lib/shake-navigation.ts'

function harness(sensitivity = 3) {
  const detect = createShakeDetector(sensitivity)
  let at = 0
  const results = []
  const sample = (x = 0, y = 0, z = 0, step = 20) => {
    at += step
    const result = detect({ x, y, z, at })
    if (result) results.push(result)
  }
  const rest = (count = 20) => {
    for (let i = 0; i < count; i++) sample()
  }
  const impulse = (x, y = 0, z = 0) => {
    sample(x, y, z)
    sample(x, y, z)
    sample(x, y, z)
  }
  return { sample, rest, impulse, results }
}

test('right and left impulses navigate in the requested direction', () => {
  for (const [x, expected] of [[8, 'next'], [-8, 'prev']]) {
    const h = harness()
    h.rest()
    h.impulse(x)
    assert.deepEqual(h.results, [expected])
  }
})

test('rebound and repeated shaking cannot turn multiple pages', () => {
  const h = harness()
  h.rest()
  h.impulse(8)
  h.impulse(-12)
  for (let i = 0; i < 30; i++) h.impulse(i % 2 ? 8 : -8)
  assert.deepEqual(h.results, ['next'])
  h.rest(60)
  h.impulse(-8)
  assert.deepEqual(h.results, ['next', 'prev'])
})

test('noise, isolated spikes, vertical and depth motion are ignored', () => {
  const h = harness()
  h.rest()
  h.impulse(2)
  h.sample(12)
  h.sample()
  h.impulse(8, 10)
  h.impulse(8, 0, 10)
  h.rest()
  assert.deepEqual(h.results, [])
})

test('requires a quiet grip before the first gesture', () => {
  const h = harness()
  h.impulse(8)
  h.rest(5)
  h.impulse(8)
  assert.deepEqual(h.results, [])
})

test('a suspended sensor stream requires settling again', () => {
  const h = harness()
  h.rest()
  h.sample(8, 0, 0, 1000)
  h.impulse(8)
  assert.deepEqual(h.results, [])
  h.rest()
  h.impulse(8)
  assert.deepEqual(h.results, ['next'])
})

test('higher sensitivity accepts lighter gestures', () => {
  const low = harness(1)
  const high = harness(5)
  for (const h of [low, high]) {
    h.rest()
    h.impulse(5)
  }
  assert.deepEqual(low.results, [])
  assert.deepEqual(high.results, ['next'])
})

test('invalid readings are ignored', () => {
  const detect = createShakeDetector(3)
  assert.equal(detect({ x: NaN, y: 0, z: 0, at: 20 }), null)
  assert.equal(detect({ x: Infinity, y: 0, z: 0, at: 40 }), null)
})
