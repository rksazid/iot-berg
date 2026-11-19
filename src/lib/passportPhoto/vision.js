// On-device vision for the passport photo studio (MediaPipe Tasks, WebAssembly).
// The models are fetched from this site; the photo itself never leaves the browser.

import { faceFromLandmarks, headHeight } from './geometry.js'

const WASM_BASE = '/mediapipe/wasm' // served from node_modules by vite.config.js
const FACE_MODEL = '/models/passport/face_landmarker.task'
const SEGMENT_MODEL = '/models/passport/selfie_multiclass_256x256.tflite'

// Above this confidence a pixel is fully kept, below the lower bound fully
// dropped. Biased towards dropping so the old background does not halo.
const ALPHA_LOW = 0.4
const ALPHA_HIGH = 0.8

// How much photo around the head is segmented, in head heights. Cropping first
// spends the model's 256 × 256 input on the person instead of the whole scene.
const REGION_HEADS = 3.4

/** Cache a loader's promise, but forget a failure so the next call retries. */
function once(load) {
  let promise = null
  return () => {
    if (!promise) {
      promise = load().catch((error) => {
        promise = null
        throw error
      })
    }
    return promise
  }
}

const loadRuntime = once(async () => {
  const vision = await import('@mediapipe/tasks-vision')
  const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE)
  return { vision, fileset }
})

const loadFaceLandmarker = once(async () => {
  const { vision, fileset } = await loadRuntime()
  return vision.FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: FACE_MODEL, delegate: 'CPU' },
    runningMode: 'IMAGE',
    numFaces: 1,
  })
})

const loadSegmenter = once(async () => {
  const { vision, fileset } = await loadRuntime()
  return vision.ImageSegmenter.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: SEGMENT_MODEL, delegate: 'CPU' },
    runningMode: 'IMAGE',
    outputConfidenceMasks: true,
    outputCategoryMask: false,
  })
})

/** Find the face in `canvas`. Resolves to face measurements, or null if none. */
export async function detectFace(canvas) {
  const landmarker = await loadFaceLandmarker()
  const result = landmarker.detect(canvas)
  const landmarks = result.faceLandmarks?.[0]
  return landmarks ? faceFromLandmarks(landmarks, canvas.width, canvas.height) : null
}

/** The part of the photo worth segmenting: around the head, or everything. */
function segmentRegion(canvas, face) {
  if (!face) return { x: 0, y: 0, width: canvas.width, height: canvas.height }
  const half = (REGION_HEADS * headHeight(face)) / 2
  // Shifted down a little: shoulders matter more than the space above the hair.
  const centreY = face.eyeMid.y + 0.2 * headHeight(face)
  const x0 = Math.max(0, Math.floor(face.eyeMid.x - half))
  const y0 = Math.max(0, Math.floor(centreY - half))
  const x1 = Math.min(canvas.width, Math.ceil(face.eyeMid.x + half))
  const y1 = Math.min(canvas.height, Math.ceil(centreY + half))
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }
}

function smoothstep(low, high, value) {
  if (value <= low) return 0
  if (value >= high) return 1
  const t = (value - low) / (high - low)
  return t * t * (3 - 2 * t)
}

/**
 * Cut the person out of `canvas`. Resolves to a canvas of the same size
 * holding only the person, with a soft alpha edge and everything else
 * transparent.
 */
export async function cutOutPerson(canvas, face) {
  const segmenter = await loadSegmenter()
  const region = segmentRegion(canvas, face)

  const crop = document.createElement('canvas')
  crop.width = region.width
  crop.height = region.height
  const cropCtx = crop.getContext('2d', { willReadFrequently: true })
  cropCtx.drawImage(canvas, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height)

  const result = segmenter.segment(crop)
  let background
  let maskWidth
  let maskHeight
  try {
    const mask = result.confidenceMasks?.[0] // category 0 = background
    if (!mask) throw new Error('Segmentation returned no mask')
    maskWidth = mask.width
    maskHeight = mask.height
    background = Float32Array.from(mask.getAsFloat32Array())
  } finally {
    result.close()
  }

  // Bilinear-upsample the mask to the crop and write it into the alpha channel.
  const pixels = cropCtx.getImageData(0, 0, region.width, region.height)
  const data = pixels.data
  const scaleX = maskWidth / region.width
  const scaleY = maskHeight / region.height
  for (let y = 0; y < region.height; y += 1) {
    const my = Math.min(maskHeight - 1, Math.max(0, (y + 0.5) * scaleY - 0.5))
    const y0 = Math.floor(my)
    const y1 = Math.min(maskHeight - 1, y0 + 1)
    const fy = my - y0
    for (let x = 0; x < region.width; x += 1) {
      const mx = Math.min(maskWidth - 1, Math.max(0, (x + 0.5) * scaleX - 0.5))
      const x0 = Math.floor(mx)
      const x1 = Math.min(maskWidth - 1, x0 + 1)
      const fx = mx - x0
      const top = background[y0 * maskWidth + x0] * (1 - fx) + background[y0 * maskWidth + x1] * fx
      const bottom = background[y1 * maskWidth + x0] * (1 - fx) + background[y1 * maskWidth + x1] * fx
      const person = 1 - (top * (1 - fy) + bottom * fy)
      data[(y * region.width + x) * 4 + 3] = Math.round(255 * smoothstep(ALPHA_LOW, ALPHA_HIGH, person))
    }
  }

  const cutout = document.createElement('canvas')
  cutout.width = canvas.width
  cutout.height = canvas.height
  cutout.getContext('2d').putImageData(pixels, region.x, region.y)

  // Lets callers ask "is this source pixel part of the person?" without
  // re-reading the canvas.
  const isPerson = (x, y) => {
    const px = Math.round(x) - region.x
    const py = Math.round(y) - region.y
    if (px < 0 || py < 0 || px >= region.width || py >= region.height) return false
    return data[(py * region.width + px) * 4 + 3] >= 128
  }

  return { canvas: cutout, isPerson }
}
