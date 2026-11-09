import QRCode from 'qrcode'

/**
 * Generates a high-resolution QR code Data URL (Base64 PNG).
 * Uses high error correction (Level H) so it scans reliably even when printed or on screen.
 */
export async function generateQrDataUrl(text, options = {}) {
  const {
    width = 240,
    margin = 1,
    darkColor = '#0f172a',
    lightColor = '#ffffff',
    errorCorrectionLevel = 'H',
  } = options

  try {
    return await QRCode.toDataURL(text, {
      width,
      margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel,
    })
  } catch (err) {
    console.error('Failed to generate QR code data URL', err)
    return ''
  }
}

/**
 * Generates an SVG string for vector-sharp rendering in modern browsers.
 */
export async function generateQrSvg(text, options = {}) {
  const {
    width = 200,
    margin = 1,
    darkColor = '#0f172a',
    lightColor = '#ffffff',
  } = options

  try {
    return await QRCode.toString(text, {
      type: 'svg',
      width,
      margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: 'H',
    })
  } catch (err) {
    console.error('Failed to generate QR code SVG', err)
    return ''
  }
}

