// Browsers export canvas JPEGs with no (or 72/96 DPI) density information, so
// print kiosks and photo apps guess the physical size. Writing the density
// into the JFIF header makes a 600 × 600 px file open as exactly 2 × 2 in.

const SOI = [0xff, 0xd8]
const JFIF_ID = [0x4a, 0x46, 0x49, 0x46, 0x00] // "JFIF\0"

function hasJfifHeader(bytes) {
  return (
    bytes[2] === 0xff &&
    bytes[3] === 0xe0 &&
    JFIF_ID.every((value, index) => bytes[6 + index] === value)
  )
}

/** Return a copy of the JPEG `bytes` whose JFIF header declares `dpi`. */
export function setJpegDpi(bytes, dpi) {
  if (bytes.length < 4 || bytes[0] !== SOI[0] || bytes[1] !== SOI[1]) {
    throw new Error('Not a JPEG file')
  }
  const density = [(dpi >> 8) & 0xff, dpi & 0xff]

  if (hasJfifHeader(bytes)) {
    const patched = new Uint8Array(bytes)
    patched[13] = 1 // density unit: dots per inch
    patched.set(density, 14)
    patched.set(density, 16)
    return patched
  }

  // No JFIF segment (some encoders start with EXIF): insert one after SOI.
  const app0 = [0xff, 0xe0, 0x00, 0x10, ...JFIF_ID, 0x01, 0x02, 0x01, ...density, ...density, 0x00, 0x00]
  const patched = new Uint8Array(bytes.length + app0.length)
  patched.set(SOI, 0)
  patched.set(app0, 2)
  patched.set(bytes.subarray(2), 2 + app0.length)
  return patched
}
