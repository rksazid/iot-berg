import test from 'node:test'
import assert from 'node:assert/strict'
import {
  autoAlign,
  checkCompliance,
  coverFit,
  faceFromLandmarks,
  frameCovered,
  layoutSheet,
  measureFace,
  panBy,
  zoomTo,
  outputSize,
  refineCrown,
  toOutput,
  toSource,
} from './geometry.js'
import { setJpegDpi } from './jpegDpi.js'
import { photoSpecs } from '../../data/photoSpecs.js'

const spec = (id) => photoSpecs.find((s) => s.id === id)
const near = (actual, expected, tolerance = 0.05) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`)

/** A face in a 2000 × 3000 photo, optionally rolled about its eye midpoint. */
function makeFace({ roll = 0, eyeMid = { x: 1000, y: 1200 }, chinDist = 300, foreheadDist = 180 } = {}) {
  const width = 2000
  const height = 3000
  const up = { x: Math.sin(roll), y: -Math.cos(roll) }
  const right = { x: Math.cos(roll), y: Math.sin(roll) }
  const landmarks = Array.from({ length: 478 }, () => ({ x: 0, y: 0 }))
  const place = (index, alongRight, alongUp) => {
    landmarks[index] = {
      x: (eyeMid.x + right.x * alongRight + up.x * alongUp) / width,
      y: (eyeMid.y + right.y * alongRight + up.y * alongUp) / height,
    }
  }
  place(33, -160, 0)
  place(133, -80, 0)
  place(362, 80, 0)
  place(263, 160, 0)
  place(10, 0, foreheadDist)
  place(152, 0, -chinDist)
  return { face: faceFromLandmarks(landmarks, width, height), source: { width, height } }
}

test('output size is the print size at 300 DPI', () => {
  assert.deepEqual(outputSize(spec('us-passport')), { width: 600, height: 600 })
  assert.deepEqual(outputSize(spec('uk-passport')), { width: 413, height: 531 })
})

test('landmarks reduce to eye midpoint, roll and head measurements', () => {
  const { face } = makeFace()
  near(face.eyeMid.x, 1000)
  near(face.eyeMid.y, 1200)
  near(face.roll, 0, 1e-9)
  near(face.chinDist, 300)
  near(face.foreheadDist, 180)
  near(face.crownDist, 180 + 0.24 * 480)
})

test('toSource undoes toOutput', () => {
  const transform = { zoom: 0.7, rotation: 0.3, cx: 420, cy: 910 }
  const out = { width: 600, height: 600 }
  const back = toSource(transform, out, toOutput(transform, out, { x: 123, y: 456 }))
  near(back.x, 123, 1e-6)
  near(back.y, 456, 1e-6)
})

test('dragging moves the photo with the pointer, even when rotated', () => {
  const out = { width: 600, height: 600 }
  const transform = { zoom: 0.5, rotation: 0.4, cx: 800, cy: 900 }
  const point = { x: 700, y: 650 }
  const before = toOutput(transform, out, point)
  const after = toOutput(panBy(transform, 30, -12), out, point)
  near(after.x - before.x, 30, 1e-6)
  near(after.y - before.y, -12, 1e-6)
})

test('zoom is clamped and keeps the frame centre fixed', () => {
  const transform = { zoom: 1, rotation: 0, cx: 10, cy: 20 }
  assert.deepEqual(zoomTo(transform, 9, { min: 0.5, max: 4 }), { ...transform, zoom: 4 })
  assert.deepEqual(zoomTo(transform, 0.1, { min: 0.5, max: 4 }), { ...transform, zoom: 0.5 })
})

for (const id of ['us-passport', 'uk-passport', 'schengen-visa', 'ca-passport', 'bd-passport', 'cn-passport']) {
  test(`auto-align meets the ${id} head and position rules`, () => {
    const s = spec(id)
    const out = outputSize(s)
    const { face, source } = makeFace()
    const transform = autoAlign(face, s, out)
    const m = measureFace(face, s, transform, out)

    near(m.headMm, (s.headMm[0] + s.headMm[1]) / 2)
    near(m.centreOffsetMm, 0)
    near(m.tiltDeg, 0)
    assert.ok(m.topSpaceMm > 1, 'room above the head')
    assert.ok(m.chinFromBottomMm > 1, 'room below the chin')

    const checks = checkCompliance({ face, spec: s, transform, out, source })
    assert.deepEqual(
      checks.filter((c) => c.status !== 'pass').map((c) => c.id),
      [],
    )
  })
}

test('US eye line lands inside the published 28–35 mm band', () => {
  const s = spec('us-passport')
  const out = outputSize(s)
  const { face } = makeFace()
  const m = measureFace(face, s, autoAlign(face, s, out), out)
  near(m.eyeFromBottomMm, 31.5)
})

test('a tilted head is levelled and still measured along its own axis', () => {
  const s = spec('uk-passport')
  const out = outputSize(s)
  const { face } = makeFace({ roll: (12 * Math.PI) / 180 })
  near(face.chinDist, 300)
  const transform = autoAlign(face, s, out)
  near(transform.rotation, (-12 * Math.PI) / 180, 1e-9)
  const m = measureFace(face, s, transform, out)
  near(m.tiltDeg, 0)
  near(m.centreOffsetMm, 0)
  near(m.headMm, 31.5)
})

test('compliance flags a head that is too small and tells the user to zoom in', () => {
  const s = spec('us-passport')
  const out = outputSize(s)
  const { face, source } = makeFace()
  const aligned = autoAlign(face, s, out)
  const checks = checkCompliance({ face, spec: s, transform: { ...aligned, zoom: aligned.zoom * 0.6 }, out, source })
  const head = checks.find((c) => c.id === 'head')
  assert.equal(head.status, 'warn')
  assert.match(head.detail, /zoom in/)
})

test('compliance warns when no face was found', () => {
  const s = spec('us-passport')
  const out = outputSize(s)
  const source = { width: 2000, height: 3000 }
  const checks = checkCompliance({ face: null, spec: s, transform: coverFit(source, out), out, source })
  assert.equal(checks.find((c) => c.id === 'face').status, 'warn')
  assert.equal(checks.find((c) => c.id === 'cover').status, 'pass')
})

test('cover fit fills the frame; zooming out past it does not', () => {
  const out = { width: 600, height: 600 }
  const source = { width: 2000, height: 3000 }
  const fit = coverFit(source, out)
  assert.equal(frameCovered(fit, out, source), true)
  assert.equal(frameCovered({ ...fit, zoom: fit.zoom * 0.8 }, out, source), false)
  assert.equal(frameCovered({ ...fit, cx: 0 }, out, source), false)
})

test('crown refinement follows the mask but stays within plausible bounds', () => {
  const { face } = makeFace()
  const faceLength = face.chinDist + face.foreheadDist
  const hairTopAt = (distAboveEyes) => (x, y) => y > face.eyeMid.y - distAboveEyes

  const normal = refineCrown(face, hairTopAt(300))
  near(normal.crownDist, 300, 3)
  near(normal.hairDist, 300, 3)
  // Tall hair says nothing about the skull: the proportional crown is kept,
  // but the real hair top is remembered for framing.
  const tall = refineCrown(face, hairTopAt(600))
  near(tall.crownDist, face.crownDist, 0.001)
  near(tall.hairDist, 600, 3)
  // Mask ends at the hairline (bald, or mask ate the hair): floored.
  near(refineCrown(face, hairTopAt(100)).crownDist, face.foreheadDist + 0.12 * faceLength, 0.001)
  // Mask never ends (person fills the photo): estimate left untouched.
  assert.equal(refineCrown(face, () => true), face)
})

for (const id of ['us-passport', 'schengen-visa', 'bd-passport']) {
  test(`tall hair stays in frame without breaking the ${id} rules`, () => {
    const s = spec(id)
    const out = outputSize(s)
    const { face, source } = makeFace()
    const tall = { ...face, hairDist: face.crownDist + 0.3 * (face.chinDist + face.foreheadDist) }
    const transform = autoAlign(tall, s, out)
    const m = measureFace(tall, s, transform, out)

    assert.ok(m.topSpaceMm >= 0.5, `hair is in frame (${m.topSpaceMm} mm clear)`)
    const checks = checkCompliance({ face: tall, spec: s, transform, out, source })
    assert.deepEqual(
      checks.filter((c) => c.status !== 'pass').map((c) => c.id),
      [],
    )
  })
}

test('hair too tall to fit is reported instead of silently cropped', () => {
  const s = spec('schengen-visa')
  const out = outputSize(s)
  const { face, source } = makeFace()
  const towering = { ...face, hairDist: face.crownDist * 3 }
  const transform = autoAlign(towering, s, out)
  const m = measureFace(towering, s, transform, out)
  near(m.headMm, s.headMm[0]) // shrunk as far as the rules allow, no further
  const frame = checkCompliance({ face: towering, spec: s, transform, out, source }).find((c) => c.id === 'frame')
  assert.equal(frame.status, 'warn')
  assert.match(frame.detail, /top of the head is cut off/)
})

test('4 × 6 in sheet fits six 2 × 2 in photos edge-to-edge', () => {
  const layout = layoutSheet({ width: 600, height: 600 }, { widthMm: 101.6, heightMm: 152.4 })
  assert.equal(layout.count, 6)
  assert.deepEqual([layout.width, layout.height].sort(), [1200, 1800])
  assert.equal(layout.gap, 0)
  for (const { x, y } of layout.positions) {
    assert.ok(x >= 0 && y >= 0 && x + 600 <= layout.width && y + 600 <= layout.height)
  }
  // No two photos overlap.
  const keys = new Set(layout.positions.map((p) => `${p.x},${p.y}`))
  assert.equal(keys.size, 6)
})

test('sheet layout honours a copy limit and reports zero when nothing fits', () => {
  const sheet = { widthMm: 101.6, heightMm: 152.4 }
  const spaced = layoutSheet({ width: 413, height: 531 }, sheet)
  assert.ok(spaced.gap > 0, 'smaller photos keep a cutting gap')
  assert.equal(layoutSheet({ width: 413, height: 531 }, sheet, { maxCopies: 4 }).count, 4)
  assert.equal(layoutSheet({ width: 5000, height: 5000 }, sheet).count, 0)
})

test('JPEG density is patched into an existing JFIF header', () => {
  const jpeg = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
    0x00, 0xff, 0xd9,
  ])
  const out = setJpegDpi(jpeg, 300)
  assert.equal(out.length, jpeg.length)
  assert.equal(out[13], 1)
  assert.equal((out[14] << 8) | out[15], 300)
  assert.equal((out[16] << 8) | out[17], 300)
  assert.equal(jpeg[13], 0, 'input is not mutated')
})

test('JPEG without a JFIF header gets one inserted', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x02, 0xff, 0xd9])
  const out = setJpegDpi(jpeg, 300)
  assert.equal(out.length, jpeg.length + 18)
  assert.deepEqual([...out.subarray(0, 4)], [0xff, 0xd8, 0xff, 0xe0])
  assert.equal((out[14] << 8) | out[15], 300)
  assert.deepEqual([...out.subarray(20)], [...jpeg.subarray(2)])
  assert.throws(() => setJpegDpi(new Uint8Array([1, 2, 3, 4]), 300), /Not a JPEG/)
})
