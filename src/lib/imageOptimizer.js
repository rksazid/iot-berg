/**
 * Client-side high-performance image optimizer using HTML5 Canvas.
 * Resizes, downsamples, and compresses images (signatures, logos, stamps, work order files)
 * to keep sizes minimal (< 50 KB) while ensuring 300+ DPI print sharpness in generated PDFs.
 */

export async function optimizeImage(fileOrDataUrl, options = {}) {
  const {
    maxWidth = 600,
    maxHeight = 300,
    quality = 0.88,
    outputType = 'image/png', // 'image/png' preserves transparency for signatures
    trimWhitespace = false,
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width
        let height = img.naturalHeight || img.height

        // Calculate scaling ratio
        const scale = Math.min(1, maxWidth / width, maxHeight / height)
        const targetWidth = Math.round(width * scale)
        const targetHeight = Math.round(height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          throw new Error('Canvas 2D context unavailable')
        }

        // High quality interpolation
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

        // Optionally trim whitespace around signatures
        let finalCanvas = canvas
        if (trimWhitespace) {
          finalCanvas = trimTransparentOrWhiteBorders(canvas)
        }

        finalCanvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Image compression failed'))
              return
            }

            const dataUrl = finalCanvas.toDataURL(outputType, quality)
            const originalSize =
              fileOrDataUrl instanceof File ? fileOrDataUrl.size : Math.round(fileOrDataUrl.length * 0.75)

            resolve({
              blob,
              dataUrl,
              width: finalCanvas.width,
              height: finalCanvas.height,
              sizeBytes: blob.size,
              originalSizeBytes: originalSize,
              reductionPercent: Math.max(0, Math.round(((originalSize - blob.size) / originalSize) * 100)),
            })
          },
          outputType,
          quality,
        )
      } catch (err) {
        reject(err)
      }
    }

    img.onerror = () => reject(new Error('Failed to load image for optimization'))

    if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target.result
      }
      reader.onerror = () => reject(new Error('Failed to read image file'))
      reader.readAsDataURL(fileOrDataUrl)
    } else if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl
    } else {
      reject(new Error('Unsupported image input'))
    }
  })
}

/**
 * Trims transparent or near-white borders around canvas drawings/signatures
 */
function trimTransparentOrWhiteBorders(canvas) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const width = canvas.width
  const height = canvas.height
  const imgData = ctx.getImageData(0, 0, width, height)
  const data = imgData.data

  let top = height
  let bottom = 0
  let left = width
  let right = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const alpha = data[idx + 3]
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      // Check if pixel is non-transparent and not pure white
      const isVisible = alpha > 25 && !(r > 245 && g > 245 && b > 245)
      if (isVisible) {
        if (x < left) left = x
        if (x > right) right = x
        if (y < top) top = y
        if (y > bottom) bottom = y
      }
    }
  }

  // Add 8px padding
  const padding = 8
  left = Math.max(0, left - padding)
  top = Math.max(0, top - padding)
  right = Math.min(width, right + padding)
  bottom = Math.min(height, bottom + padding)

  const trimWidth = right - left
  const trimHeight = bottom - top

  if (trimWidth <= 0 || trimHeight <= 0) return canvas

  const trimmedCanvas = document.createElement('canvas')
  trimmedCanvas.width = trimWidth
  trimmedCanvas.height = trimHeight
  const trimmedCtx = trimmedCanvas.getContext('2d')

  trimmedCtx.drawImage(canvas, left, top, trimWidth, trimHeight, 0, 0, trimWidth, trimHeight)
  return trimmedCanvas
}

