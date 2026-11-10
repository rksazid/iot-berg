import { get, put } from '@vercel/blob'

const REGISTRY_PATHNAME = 'registry/iotberg-registry-v1.json'

async function readRegistry(token) {
  try {
    const result = await get(REGISTRY_PATHNAME, {
      access: 'public',
      useCache: false,
      token,
    })

    if (!result || result.statusCode !== 200 || !result.stream) {
      return null
    }

    const text = await new Response(result.stream).text()
    const data = JSON.parse(text)
    if (data && typeof data === 'object') {
      return {
        workOrders: Array.isArray(data.workOrders) ? data.workOrders : [],
        receipts: Array.isArray(data.receipts) ? data.receipts : [],
        updatedAt: data.updatedAt || null,
      }
    }
    return null
  } catch (err) {
    // BlobNotFoundError on first write returns null cleanly
    if (err?.name === 'BlobNotFoundError' || err?.message?.toLowerCase().includes('not found')) {
      return null
    }
    console.warn('Registry read note:', err.message)
    return null
  }
}

async function writeRegistry(token, state) {
  const payload = {
    workOrders: Array.isArray(state.workOrders) ? state.workOrders : [],
    receipts: Array.isArray(state.receipts) ? state.receipts : [],
    updatedAt: new Date().toISOString(),
  }

  await put(REGISTRY_PATHNAME, JSON.stringify(payload), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    token,
  })

  return payload
}

function normalizeId(val) {
  return String(val || '').replace(/\s+/g, '').toLowerCase()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  )
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    return res.status(500).json({
      error: 'Vercel Blob token is missing in environment variables (BLOB_READ_WRITE_TOKEN)',
    })
  }

  try {
    if (req.method === 'GET') {
      const state = await readRegistry(token)
      const { id } = req.query || {}

      if (id) {
        if (!state) {
          return res.status(404).json({ receipt: null, workOrder: null, initialized: false })
        }
        const target = normalizeId(id)
        const receipt =
          state.receipts.find(
            (r) => normalizeId(r.id) === target || normalizeId(r.receiptNumber) === target,
          ) || null
        const workOrder = receipt
          ? state.workOrders.find(
              (wo) =>
                normalizeId(wo.id) === normalizeId(receipt.workOrderId) ||
                normalizeId(wo.workOrderRef) === normalizeId(receipt.workOrderId),
            ) || null
          : null

        return res.status(receipt ? 200 : 404).json({
          receipt,
          workOrder,
          initialized: true,
        })
      }

      return res.status(200).json({
        initialized: Boolean(state),
        workOrders: state ? state.workOrders : null,
        receipts: state ? state.receipts : null,
        updatedAt: state ? state.updatedAt : null,
      })
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const { action, receipt, workOrder, id, workOrders, receipts, seed } = req.body || {}

      let state = await readRegistry(token)
      if (!state) {
        state = {
          workOrders: Array.isArray(seed?.workOrders)
            ? seed.workOrders
            : Array.isArray(workOrders)
            ? workOrders
            : [],
          receipts: Array.isArray(seed?.receipts)
            ? seed.receipts
            : Array.isArray(receipts)
            ? receipts
            : [],
        }
      }

      if (action === 'bootstrap') {
        // Only write initial seed if registry didn't exist before
        const existing = await readRegistry(token)
        if (existing) {
          return res.status(200).json({ success: true, ...existing })
        }
        const saved = await writeRegistry(token, {
          workOrders: Array.isArray(workOrders) ? workOrders : state.workOrders,
          receipts: Array.isArray(receipts) ? receipts : state.receipts,
        })
        return res.status(200).json({ success: true, ...saved })
      }

      if (action === 'syncAll') {
        const saved = await writeRegistry(token, {
          workOrders: Array.isArray(workOrders) ? workOrders : state.workOrders,
          receipts: Array.isArray(receipts) ? receipts : state.receipts,
        })
        return res.status(200).json({ success: true, ...saved })
      }

      if (action === 'saveReceipt' && receipt) {
        const idx = state.receipts.findIndex(
          (r) =>
            r.id === receipt.id ||
            (receipt.receiptNumber && r.receiptNumber === receipt.receiptNumber),
        )
        if (idx >= 0) {
          state.receipts[idx] = { ...state.receipts[idx], ...receipt }
        } else {
          state.receipts.unshift(receipt)
        }
        const saved = await writeRegistry(token, state)
        return res.status(200).json({ success: true, receipt, ...saved })
      }

      if (action === 'deleteReceipt' && id) {
        const target = normalizeId(id)
        state.receipts = state.receipts.filter(
          (r) => normalizeId(r.id) !== target && normalizeId(r.receiptNumber) !== target,
        )
        const saved = await writeRegistry(token, state)
        return res.status(200).json({ success: true, ...saved })
      }

      if (action === 'saveWorkOrder' && workOrder) {
        const idx = state.workOrders.findIndex((wo) => wo.id === workOrder.id)
        if (idx >= 0) {
          state.workOrders[idx] = { ...state.workOrders[idx], ...workOrder }
        } else {
          state.workOrders.unshift(workOrder)
        }
        const saved = await writeRegistry(token, state)
        return res.status(200).json({ success: true, workOrder, ...saved })
      }

      if (action === 'deleteWorkOrder' && id) {
        const target = normalizeId(id)
        state.workOrders = state.workOrders.filter((wo) => normalizeId(wo.id) !== target)
        const saved = await writeRegistry(token, state)
        return res.status(200).json({ success: true, ...saved })
      }

      return res.status(400).json({ error: 'Unsupported registry action or missing payload' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Registry API error:', err)
    return res.status(500).json({
      error: err.message || 'Internal error interacting with cloud registry',
    })
  }
}
