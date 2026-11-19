// Canvas work for the passport photo studio: decoding the upload, drawing the
// finished photo (the preview and the download share one renderer, so what you
// see is what you get), print sheets and JPEG export.

import { DPI, layoutSheet } from './geometry.js'
import { setJpegDpi } from './jpegDpi.js'

// Photos are scaled down to this before any processing. A finished photo is at
// most ~1400 px tall, so nothing is lost, and phones stay within memory.
const MAX_SOURCE_EDGE = 2000

const JPEG_QUALITY = 0.95
const MIN_JPEG_QUALITY = 0.3
const CUT_LINE = '#c5cad3'
const PLACEHOLDER_FILL = '#eef1f5'
// The DPI header can add a few bytes after the size search has finished.
const HEADER_ALLOWANCE = 32

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // fall through to <img> decoding
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Decode an uploaded image file into a working canvas (EXIF rotation applied). */
export async function loadPhoto(file) {
  let image
  try {
    image = await decode(file)
  } catch {
    throw new Error('This file could not be opened as an image. Try a JPG, PNG or WebP photo.')
  }
  const width = image.width || image.naturalWidth
  const height = image.height || image.naturalHeight
  if (!width || !height) throw new Error('This image appears to be empty.')

  const scale = Math.min(1, MAX_SOURCE_EDGE / Math.max(width, height))
  const canvas = makeCanvas(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)))
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  image.close?.()
  return canvas
}

/** Brightness and contrast in -50..50, applied to colour only (alpha untouched). */
function adjustTone(ctx, width, height, brightness, contrast) {
  if (!brightness && !contrast) return
  const gain = 1 + contrast / 100
  const lift = (brightness / 100) * 255
  const lut = new Uint8ClampedArray(256)
  for (let i = 0; i < 256; i += 1) lut[i] = (i - 128) * gain + 128 + lift

  const pixels = ctx.getImageData(0, 0, width, height)
  const data = pixels.data
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]]
    data[i + 1] = lut[data[i + 1]]
    data[i + 2] = lut[data[i + 2]]
  }
  ctx.putImageData(pixels, 0, 0)
}

function drawTransformed(ctx, image, out, transform) {
  ctx.imageSmoothingQuality = 'high'
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.translate(out.width / 2, out.height / 2)
  ctx.rotate(transform.rotation)
  ctx.scale(transform.zoom, transform.zoom)
  ctx.translate(-transform.cx, -transform.cy)
  ctx.drawImage(image, 0, 0)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

/**
 * Draw the finished photo onto `target` (resized to `out`).
 * `image` is the original photo or the cut-out person; `background` is always
 * painted first, so a cut-out (or a photo that does not cover the frame)
 * sits on the chosen colour.
 */
export function renderPhoto(target, { image, out, transform, background, brightness = 0, contrast = 0 }) {
  if (target.width !== out.width) target.width = out.width
  if (target.height !== out.height) target.height = out.height

  const ctx = target.getContext('2d')
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = background
  ctx.fillRect(0, 0, out.width, out.height)

  if (!brightness && !contrast) {
    drawTransformed(ctx, image, out, transform)
    return
  }

  // Tone is applied to the photo on its own layer so the background colour
  // stays exactly the colour that was picked.
  const layer = makeCanvas(out.width, out.height)
  const layerCtx = layer.getContext('2d', { willReadFrequently: true })
  drawTransformed(layerCtx, image, out, transform)
  adjustTone(layerCtx, out.width, out.height, brightness, contrast)
  ctx.drawImage(layer, 0, 0)
}

/**
 * Draw a print sheet of `photo` copies onto `target` (a new canvas by default).
 * `photo` is a rendered photo canvas, or null to draw empty frames of `size`
 * as a layout placeholder. With `maxEdge` the sheet is scaled down to fit, so
 * the on-page preview and the full-size download share this one drawing.
 * Returns { canvas, count }.
 */
export function renderSheet({ photo = null, size, sheet, maxCopies, target = makeCanvas(1, 1), maxEdge }) {
  const layout = layoutSheet(size, sheet, { maxCopies })
  const scale = maxEdge ? Math.min(1, maxEdge / Math.max(layout.width, layout.height)) : 1
  target.width = Math.max(1, Math.round(layout.width * scale))
  target.height = Math.max(1, Math.round(layout.height * scale))

  const ctx = target.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, layout.width, layout.height)

  // Hairline outline: a cutting guide that also keeps a white background
  // distinguishable from the white paper. Kept one device pixel wide at any scale.
  const line = 1 / scale
  ctx.strokeStyle = CUT_LINE
  ctx.lineWidth = line
  for (const { x, y } of layout.positions) {
    if (photo) {
      ctx.drawImage(photo, x, y, size.width, size.height)
    } else {
      ctx.fillStyle = PLACEHOLDER_FILL
      ctx.fillRect(x, y, size.width, size.height)
    }
    ctx.strokeRect(x + line / 2, y + line / 2, size.width - line, size.height - line)
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  return { canvas: target, count: layout.count }
}

function toJpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The browser could not encode the image.'))),
      'image/jpeg',
      quality,
    )
  })
}

/**
 * Encode `canvas` as a 300-DPI JPEG. With `maxBytes`, quality is lowered until
 * the file fits (pixel dimensions are never changed: forms that cap the file
 * size usually fix the dimensions too). Resolves to { blob, fits }.
 */
export async function encodeJpeg(canvas, { maxBytes } = {}) {
  let blob = await toJpegBlob(canvas, JPEG_QUALITY)

  const budget = maxBytes ? maxBytes - HEADER_ALLOWANCE : 0
  if (maxBytes && blob.size > budget) {
    let low = MIN_JPEG_QUALITY
    let high = JPEG_QUALITY
    let best = null
    for (let i = 0; i < 7; i += 1) {
      const quality = (low + high) / 2
      const candidate = await toJpegBlob(canvas, quality)
      if (candidate.size <= budget) {
        best = candidate
        low = quality
      } else {
        high = quality
      }
    }
    blob = best ?? (await toJpegBlob(canvas, MIN_JPEG_QUALITY))
  }

  const bytes = setJpegDpi(new Uint8Array(await blob.arrayBuffer()), DPI)
  const tagged = new Blob([bytes], { type: 'image/jpeg' })
  return { blob: tagged, fits: !maxBytes || tagged.size <= maxBytes }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
