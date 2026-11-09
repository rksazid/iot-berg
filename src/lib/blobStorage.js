/**
 * Client-side interface to upload optimized files/signatures into Vercel Object Storage (Blob).
 */

export async function uploadToVercelBlob({ filename, base64Data, contentType = 'image/png' }) {
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        base64Data,
        contentType,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.url) {
        return {
          success: true,
          url: data.url,
          storageType: 'vercel-blob',
        }
      }
    }
  } catch (err) {
    console.warn('Vercel Blob API upload request failed, falling back to local persistence:', err)
  }

  // Graceful fallback for local dev without dev server API or temporary network drops:
  return {
    success: true,
    url: base64Data, // data URL acts as standalone portable asset
    storageType: 'local-fallback',
  }
}

