import { getEndpointCandidates } from '../config/pdfService'

function getErrorMessage(data, fallbackMessage) {
  if (typeof data === 'string' && data.trim()) {
    return data
  }

  if (data && typeof data === 'object') {
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message
    }

    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error
    }
  }

  return fallbackMessage
}

function canFallback(status) {
  return status === 408 || status === 429 || status >= 500
}

export async function generatePdf({ endpointMode, payload }) {
  const candidates = getEndpointCandidates(endpointMode)
  let lastError = new Error('PDF generation failed.')

  for (let index = 0; index < candidates.length; index += 1) {
    const baseUrl = candidates[index]
    const shouldAllowFallback = endpointMode === 'auto' && index < candidates.length - 1

    try {
      const response = await fetch(`${baseUrl}/api/v1/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        let problemData = null

        try {
          problemData = await response.json()
        } catch {}

        const message = getErrorMessage(
          problemData,
          `Request failed with status ${response.status}.`,
        )

        if (shouldAllowFallback && canFallback(response.status)) {
          lastError = new Error(message)
          continue
        }

        throw new Error(message)
      }

      return {
        blob: await response.blob(),
        usedEndpoint: baseUrl,
        generationTime: response.headers.get('X-Generation-Time') || '',
      }
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error('Something went wrong while generating the PDF.')

      if (!shouldAllowFallback) {
        throw lastError
      }
    }
  }

  throw lastError
}
