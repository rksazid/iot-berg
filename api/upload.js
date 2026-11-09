import { put } from '@vercel/blob'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { filename, base64Data, contentType } = req.body || {}

    if (!base64Data) {
      return res.status(400).json({ error: 'Missing base64Data in request payload' })
    }

    const cleanName = filename || `upload-${Date.now()}.png`
    const mime = contentType || 'image/png'

    // Extract raw buffer from base64
    const base64PrefixMatch = base64Data.match(/^data:([^;]+);base64,(.+)$/)
    const rawData = base64PrefixMatch ? base64PrefixMatch[2] : base64Data
    const buffer = Buffer.from(rawData, 'base64')

    const token = process.env.BLOB_READ_WRITE_TOKEN

    if (!token) {
      return res.status(500).json({
        error: 'Vercel Blob token is missing in environment variables (BLOB_READ_WRITE_TOKEN)',
      })
    }

    const blob = await put(cleanName, buffer, {
      access: 'public',
      contentType: mime,
      token,
      addRandomSuffix: true,
    })

    return res.status(200).json({
      success: true,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: buffer.length,
    })
  } catch (err) {
    console.error('Vercel Blob upload failed:', err)
    return res.status(500).json({
      error: err.message || 'Internal server error while uploading to Vercel Object Storage',
    })
  }
}

