// Pure geometry for the passport photo studio: no DOM, no ML. Everything here
// works in two coordinate spaces:
//   source: pixels of the (downscaled) uploaded photo
//   output: pixels of the finished photo at print resolution
// and a `transform` { zoom, rotation, cx, cy } maps between them: the source
// point (cx, cy) lands on the output centre, rotated by `rotation` radians and
// scaled by `zoom` output-px per source-px.

export const DPI = 300
const MM_PER_INCH = 25.4

export function mmToPx(mm, dpi = DPI) {
  return Math.round((mm / MM_PER_INCH) * dpi)
}

export function outputSize(spec, dpi = DPI) {
  return { width: mmToPx(spec.widthMm, dpi), height: mmToPx(spec.heightMm, dpi) }
}

const mid = ([a, b]) => (a + b) / 2

function rotate({ x, y }, angle) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return { x: x * cos - y * sin, y: x * sin + y * cos }
}

export function toOutput(transform, out, point) {
  const r = rotate({ x: point.x - transform.cx, y: point.y - transform.cy }, transform.rotation)
  return { x: out.width / 2 + r.x * transform.zoom, y: out.height / 2 + r.y * transform.zoom }
}

export function toSource(transform, out, point) {
  const r = rotate(
    { x: (point.x - out.width / 2) / transform.zoom, y: (point.y - out.height / 2) / transform.zoom },
    -transform.rotation,
  )
  return { x: transform.cx + r.x, y: transform.cy + r.y }
}

/** Slide the photo by a distance given in output pixels (a drag on the preview). */
export function panBy(transform, dx, dy) {
  const d = rotate({ x: dx / transform.zoom, y: dy / transform.zoom }, -transform.rotation)
  return { ...transform, cx: transform.cx - d.x, cy: transform.cy - d.y }
}

/** Scale about the centre of the frame, keeping zoom within [min, max]. */
export function zoomTo(transform, zoom, { min, max }) {
  return { ...transform, zoom: Math.min(max, Math.max(min, zoom)) }
}

// MediaPipe face-mesh landmark indices.
const LEFT_EYE = [33, 133] // image-left eye corners
const RIGHT_EYE = [362, 263] // image-right eye corners
const FOREHEAD_TOP = 10
const CHIN = 152

// The face mesh stops at the hairline; the crown of the skull sits roughly a
// quarter of the hairline-to-chin length above it.
const CROWN_ABOVE_HAIRLINE = 0.24
const CROWN_MIN = 0.12
const CROWN_MAX = 0.4

/**
 * Reduce face-mesh landmarks (normalised 0..1) to the few measurements a
 * passport crop needs, in source pixels. Distances are measured along the
 * face's own vertical axis so a tilted head still measures correctly.
 */
export function faceFromLandmarks(landmarks, width, height) {
  if (!landmarks || landmarks.length <= CHIN) return null
  const px = (i) => ({ x: landmarks[i].x * width, y: landmarks[i].y * height })
  const avg = (ids) => {
    const pts = ids.map(px)
    return {
      x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
      y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
    }
  }

  const leftEye = avg(LEFT_EYE)
  const rightEye = avg(RIGHT_EYE)
  const eyeMid = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 }
  const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x)
  const up = { x: Math.sin(roll), y: -Math.cos(roll) }
  const along = (p) => (p.x - eyeMid.x) * up.x + (p.y - eyeMid.y) * up.y

  const chinDist = -along(px(CHIN))
  const foreheadDist = along(px(FOREHEAD_TOP))
  if (!(chinDist > 0) || !(foreheadDist > 0)) return null

  const faceLength = chinDist + foreheadDist
  return {
    eyeMid,
    roll,
    chinDist,
    foreheadDist,
    crownDist: foreheadDist + CROWN_ABOVE_HAIRLINE * faceLength,
  }
}

export function faceUpAxis(face) {
  return { x: Math.sin(face.roll), y: -Math.cos(face.roll) }
}

export function headHeight(face) {
  return face.chinDist + face.crownDist
}

// How far above the hairline the top of the hair is searched for, in face lengths.
const HAIR_SEARCH = 1.5

/**
 * Use the person mask to find the top of the hair, walking up from the
 * hairline until the mask ends. That gives two things:
 *   hairDist:  where the hair actually ends, so framing can keep it in shot
 *   crownDist: the skull crown. Short hair hugs the skull, so its top is a
 *               better crown than the proportional guess; hair taller than a
 *               skull could be (big hair, a hat, a noisy mask) says nothing
 *               about the skull, so the guess is kept.
 * `isPerson(x, y)` answers for a source pixel.
 */
export function refineCrown(face, isPerson) {
  const up = faceUpAxis(face)
  const faceLength = face.chinDist + face.foreheadDist
  const min = face.foreheadDist + CROWN_MIN * faceLength
  const max = face.foreheadDist + CROWN_MAX * faceLength
  const limit = face.foreheadDist + HAIR_SEARCH * faceLength
  const step = Math.max(1, faceLength / 200)

  let dist = face.foreheadDist
  while (dist <= limit && isPerson(face.eyeMid.x + up.x * dist, face.eyeMid.y + up.y * dist)) {
    dist += step
  }
  if (dist > limit) return face // mask never ended: not a usable outline

  const hairDist = Math.max(min, dist)
  return { ...face, crownDist: hairDist <= max ? hairDist : face.crownDist, hairDist }
}

/** Distance from the eye line to the highest part of the head that must stay in frame. */
export function headTopDist(face) {
  return Math.max(face.crownDist, face.hairDist ?? 0)
}

/** Where the eye line should sit in the finished photo, in output px from the top. */
function targetEyeY(spec, out, headPx, crownShare) {
  const pxPerMm = out.height / spec.heightMm
  if (spec.eyeFromBottomMm) {
    return out.height - mid(spec.eyeFromBottomMm) * pxPerMm
  }
  // No published eye line: leave a bit over a third of the spare height above the crown.
  const topMargin = 0.35 * (out.height - headPx)
  return topMargin + headPx * crownShare
}

// Clear space kept above the hair and below the chin, as a share of the height.
const MIN_TOP_SPACE = 0.035
const MIN_BOTTOM_SPACE = 0.04
const SHRINK_STEPS = 12

/**
 * Level the eyes, scale the head to the middle of the allowed range and centre
 * it. If tall hair would be cropped, the photo is first moved down, then the
 * head scaled down towards the smallest allowed size, until the hair fits.
 */
export function autoAlign(face, spec, out) {
  const head = headHeight(face)
  const pxPerMm = out.height / spec.heightMm
  const [minHeadMm, maxHeadMm] = spec.headMm
  const topLimit = MIN_TOP_SPACE * out.height
  // Lowest the eye line may go: chin clear of the bottom edge, and inside the
  // published eye band where there is one.
  const lowestEyeY = (zoom) => {
    const chinLimit = out.height * (1 - MIN_BOTTOM_SPACE) - face.chinDist * zoom
    const bandLimit = spec.eyeFromBottomMm ? out.height - spec.eyeFromBottomMm[0] * pxPerMm : Infinity
    return Math.min(chinLimit, bandLimit)
  }

  let zoom = 0
  let eyeY = 0
  for (let i = 0; i <= SHRINK_STEPS; i += 1) {
    const headMm = (minHeadMm + maxHeadMm) / 2 - ((maxHeadMm - minHeadMm) / 2) * (i / SHRINK_STEPS)
    const headPx = headMm * pxPerMm
    zoom = headPx / head
    eyeY = targetEyeY(spec, out, headPx, face.crownDist / head)
    const overflow = topLimit - (eyeY - headTopDist(face) * zoom)
    if (overflow <= 0) break
    eyeY = Math.max(eyeY, Math.min(eyeY + overflow, lowestEyeY(zoom)))
    if (topLimit - (eyeY - headTopDist(face) * zoom) <= 0.5) break
  }

  const rotation = -face.roll
  // Solve for the source point that must sit at the output centre so the eye
  // midpoint lands on (width / 2, eyeY).
  const offset = rotate({ x: 0, y: (eyeY - out.height / 2) / zoom }, -rotation)
  return { zoom, rotation, cx: face.eyeMid.x - offset.x, cy: face.eyeMid.y - offset.y }
}

/** Fallback when no face is found: fill the frame with the middle of the photo. */
export function coverFit(source, out) {
  return {
    zoom: Math.max(out.width / source.width, out.height / source.height),
    rotation: 0,
    cx: source.width / 2,
    cy: source.height / 2,
  }
}

/** True when every corner of the output frame falls inside the source photo. */
export function frameCovered(transform, out, source) {
  const corners = [
    { x: 0, y: 0 },
    { x: out.width, y: 0 },
    { x: 0, y: out.height },
    { x: out.width, y: out.height },
  ]
  return corners.every((corner) => {
    const p = toSource(transform, out, corner)
    return p.x >= -1 && p.y >= -1 && p.x <= source.width + 1 && p.y <= source.height + 1
  })
}

/** Where the face landed in the finished photo, in millimetres. */
export function measureFace(face, spec, transform, out) {
  const pxPerMm = out.height / spec.heightMm
  const up = faceUpAxis(face)
  const at = (dist) =>
    toOutput(transform, out, { x: face.eyeMid.x + up.x * dist, y: face.eyeMid.y + up.y * dist })
  const eye = at(0)
  const top = at(headTopDist(face))
  const chin = at(-face.chinDist)
  return {
    headMm: (headHeight(face) * transform.zoom) / pxPerMm,
    eyeFromBottomMm: (out.height - eye.y) / pxPerMm,
    topSpaceMm: top.y / pxPerMm,
    chinFromBottomMm: (out.height - chin.y) / pxPerMm,
    centreOffsetMm: (eye.x - out.width / 2) / pxPerMm,
    tiltDeg: ((face.roll + transform.rotation) * 180) / Math.PI,
  }
}

const fmt = (n) => (Math.round(n * 10) / 10).toFixed(1)

/**
 * Checklist shown beside the preview. Each item is { id, status, label, detail }
 * with status 'pass' | 'warn'.
 */
export function checkCompliance({ face, spec, transform, out, source }) {
  const checks = []
  const add = (id, ok, label, detail) => checks.push({ id, status: ok ? 'pass' : 'warn', label, detail })

  if (face) {
    const m = measureFace(face, spec, transform, out)
    const [minHead, maxHead] = spec.headMm
    const headOk = m.headMm >= minHead - 0.05 && m.headMm <= maxHead + 0.05
    add(
      'head',
      headOk,
      'Head size',
      headOk
        ? `${fmt(m.headMm)} mm (allowed ${minHead}–${maxHead} mm)`
        : `${fmt(m.headMm)} mm, ${m.headMm < minHead ? 'zoom in' : 'zoom out'} to reach ${minHead}–${maxHead} mm`,
    )

    if (spec.eyeFromBottomMm) {
      const [minEye, maxEye] = spec.eyeFromBottomMm
      const eyeOk = m.eyeFromBottomMm >= minEye - 0.05 && m.eyeFromBottomMm <= maxEye + 0.05
      add(
        'eyes',
        eyeOk,
        'Eye line',
        eyeOk
          ? `${fmt(m.eyeFromBottomMm)} mm from the bottom (allowed ${minEye}–${maxEye} mm)`
          : `${fmt(m.eyeFromBottomMm)} mm from the bottom, move the photo ${m.eyeFromBottomMm < minEye ? 'up' : 'down'} to reach ${minEye}–${maxEye} mm`,
      )
    }

    const inFrame = m.topSpaceMm >= 0.5 && m.chinFromBottomMm >= 0.5
    add(
      'frame',
      inFrame,
      'Whole head in frame',
      inFrame
        ? `${fmt(m.topSpaceMm)} mm above the head, ${fmt(m.chinFromBottomMm)} mm below the chin`
        : m.topSpaceMm < 0.5
          ? 'The top of the head is cut off. Move the photo down or zoom out'
          : 'The chin is cut off. Move the photo up or zoom out',
    )

    const centred = Math.abs(m.centreOffsetMm) <= spec.widthMm * 0.04
    add('centre', centred, 'Centred', centred ? 'Face is centred left to right' : 'Face is off-centre. Drag it to the middle')

    const level = Math.abs(m.tiltDeg) <= 2
    add('tilt', level, 'Head straight', level ? 'Eyes are level' : `Eyes are tilted ${fmt(Math.abs(m.tiltDeg))}°. Adjust the rotation`)
  } else {
    add('face', false, 'Face not detected', 'Line the head up with the guides by hand')
  }

  const covered = frameCovered(transform, out, source)
  add(
    'cover',
    covered,
    'Photo fills the frame',
    covered ? 'No empty edges' : 'Part of the frame is outside your photo and is filled with the background colour',
  )

  const sharp = transform.zoom <= 1.3
  add(
    'resolution',
    sharp,
    'Resolution',
    sharp
      ? `${out.width} × ${out.height} px at ${DPI} DPI`
      : `Enlarged ${fmt(transform.zoom)}×. Use a higher-resolution photo for a sharp print`,
  )

  return checks
}

/** Target guide positions for the overlay, in millimetres from the top-left. */
export function guideLines(spec) {
  const out = { width: spec.widthMm, height: spec.heightMm }
  const head = mid(spec.headMm)
  // 0.5: on a typical face the eye line halves the chin-to-crown height.
  const eyeY = targetEyeY(spec, out, head, 0.5)
  return { headMm: head, crownY: eyeY - head * 0.5, eyeY, chinY: eyeY + head * 0.5, centreX: spec.widthMm / 2 }
}

const MIN_SPACED_COPIES = 4

/**
 * Tile copies of a photo on a print sheet, in whichever sheet orientation
 * fits more. Copies are spaced for cutting, with a margin that survives a
 * kiosk's borderless crop; only when that leaves fewer than four copies does
 * it pack edge-to-edge (six 2 × 2 in photos exactly fill a 4 × 6 in sheet).
 * Returns { width, height, cols, rows, count, gap, positions: [{ x, y }] } in px.
 */
export function layoutSheet(photo, sheet, { dpi = DPI, gapMm = 2, marginMm = 4, maxCopies = Infinity } = {}) {
  const fit = (width, height, gap, margin) => {
    const cols = Math.max(0, Math.floor((width - 2 * margin + gap) / (photo.width + gap)))
    const rows = Math.max(0, Math.floor((height - 2 * margin + gap) / (photo.height + gap)))
    return { width, height, cols, rows, gap }
  }

  const short = mmToPx(sheet.widthMm, dpi)
  const long = mmToPx(sheet.heightMm, dpi)
  const gap = mmToPx(gapMm, dpi)
  const margin = mmToPx(marginMm, dpi)
  const copies = (c) => c.cols * c.rows
  const better = (a, b) => (copies(b) > copies(a) ? b : a)
  const spaced = better(fit(short, long, gap, margin), fit(long, short, gap, margin))
  const tight = better(fit(short, long, 0, 0), fit(long, short, 0, 0))
  const best = copies(spaced) >= MIN_SPACED_COPIES ? spaced : better(spaced, tight)

  const count = Math.min(best.cols * best.rows, maxCopies)
  if (count === 0) return { ...best, count: 0, positions: [] }

  const rows = Math.ceil(count / best.cols)
  const blockWidth = best.cols * photo.width + (best.cols - 1) * best.gap
  const blockHeight = rows * photo.height + (rows - 1) * best.gap
  const left = Math.round((best.width - blockWidth) / 2)
  const top = Math.round((best.height - blockHeight) / 2)

  const positions = []
  for (let i = 0; i < count; i += 1) {
    positions.push({
      x: left + (i % best.cols) * (photo.width + best.gap),
      y: top + Math.floor(i / best.cols) * (photo.height + best.gap),
    })
  }
  return { ...best, rows, count, positions }
}
