import { get, put } from '@vercel/blob'
import {
  isNeonConfigured,
  readAllFromNeon,
  upsertWorkOrderNeon,
  deleteWorkOrderNeon,
  upsertReceiptNeon,
  deleteReceiptNeon,
  upsertPartnerNeon,
  deletePartnerNeon,
  seedNeonIfEmpty,
} from './_db.js'

const REGISTRY_PATHNAME = 'registry/iotberg-registry-v2.json'

async function readBlobRegistry(token) {
  if (!token) return null
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
        initialized: true,
        workOrders: Array.isArray(data.workOrders) ? data.workOrders : [],
        receipts: Array.isArray(data.receipts) ? data.receipts : [],
        partners: Array.isArray(data.partners) ? data.partners : null,
        updatedAt: data.updatedAt || null,
      }
    }
    return null
  } catch (err) {
    if (err?.name === 'BlobNotFoundError' || err?.message?.toLowerCase().includes('not found')) {
      return null
    }
    console.warn('Registry read note:', err.message)
    return null
  }
}

async function writeBlobRegistry(token, state) {
  const payload = {
    workOrders: Array.isArray(state.workOrders) ? state.workOrders : [],
    receipts: Array.isArray(state.receipts) ? state.receipts : [],
    partners: Array.isArray(state.partners) ? state.partners : [],
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

  const useNeon = isNeonConfigured()
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN

  if (!useNeon && !blobToken) {
    return res.status(500).json({
      error: 'Neither DATABASE_URL (Neon Postgres) nor BLOB_READ_WRITE_TOKEN is configured.',
    })
  }

  try {
    if (req.method === 'GET') {
      const state = useNeon ? await readAllFromNeon() : await readBlobRegistry(blobToken)
      const { id } = req.query || {}
      const storageBackend = useNeon ? 'neon-postgres' : 'vercel-blob'

      if (id) {
        if (!state || !state.initialized) {
          return res.status(404).json({
            receipt: null,
            workOrder: null,
            initialized: false,
            storageBackend,
          })
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
                normalizeId(wo.workOrderRef) === normalizeId(receipt.workOrderId) ||
                (wo.clientPoRef && normalizeId(wo.clientPoRef) === normalizeId(receipt.workOrderId)),
            ) || null
          : null

        return res.status(receipt ? 200 : 404).json({
          receipt,
          workOrder,
          initialized: true,
          storageBackend,
        })
      }

      return res.status(200).json({
        initialized: Boolean(state?.initialized),
        workOrders: state?.initialized ? state.workOrders : null,
        receipts: state?.initialized ? state.receipts : null,
        partners: state?.partners || null,
        updatedAt: state?.updatedAt || null,
        storageBackend,
      })
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const { action, receipt, workOrder, partner, id, workOrders, receipts, partners, seed } =
        req.body || {}
      const storageBackend = useNeon ? 'neon-postgres' : 'vercel-blob'

      // NEON SERVERLESS POSTGRESQL PATH
      if (useNeon) {
        if (action === 'bootstrap') {
          const seeded = await seedNeonIfEmpty({ workOrders, receipts, partners })
          return res.status(200).json({ success: true, storageBackend, ...seeded })
        }

        // Ensure seed if DB was empty before mutation
        if (seed) {
          await seedNeonIfEmpty(seed)
        }

        if (action === 'saveReceipt' && receipt) {
          await upsertReceiptNeon(receipt)
        } else if (action === 'deleteReceipt' && id) {
          await deleteReceiptNeon(id)
        } else if (action === 'saveWorkOrder' && workOrder) {
          await upsertWorkOrderNeon(workOrder)
        } else if (action === 'deleteWorkOrder' && id) {
          await deleteWorkOrderNeon(id)
        } else if (action === 'savePartner' && partner) {
          await upsertPartnerNeon(partner)
        } else if (action === 'deletePartner' && id) {
          await deletePartnerNeon(id)
        } else if (action === 'syncAll') {
          for (const wo of workOrders || []) await upsertWorkOrderNeon(wo)
          for (const rec of receipts || []) await upsertReceiptNeon(rec)
          for (const p of partners || []) await upsertPartnerNeon(p)
        } else {
          return res.status(400).json({ error: 'Unsupported registry action or missing payload' })
        }

        const updated = await readAllFromNeon()
        return res.status(200).json({ success: true, storageBackend, ...updated })
      }

      // VERCEL BLOB JSON FALLBACK PATH
      let state = await readBlobRegistry(blobToken)
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
          partners: Array.isArray(seed?.partners)
            ? seed.partners
            : Array.isArray(partners)
            ? partners
            : [],
        }
      } else if (!Array.isArray(state.partners)) {
        state.partners = Array.isArray(seed?.partners) ? seed.partners : []
      }

      if (action === 'bootstrap') {
        const existing = await readBlobRegistry(blobToken)
        if (existing) {
          return res.status(200).json({ success: true, storageBackend, ...existing })
        }
        const saved = await writeBlobRegistry(blobToken, {
          workOrders: Array.isArray(workOrders) ? workOrders : state.workOrders,
          receipts: Array.isArray(receipts) ? receipts : state.receipts,
          partners: Array.isArray(partners) ? partners : state.partners,
        })
        return res.status(200).json({ success: true, storageBackend, ...saved })
      }

      if (action === 'syncAll') {
        const saved = await writeBlobRegistry(blobToken, {
          workOrders: Array.isArray(workOrders) ? workOrders : state.workOrders,
          receipts: Array.isArray(receipts) ? receipts : state.receipts,
          partners: Array.isArray(partners) ? partners : state.partners,
        })
        return res.status(200).json({ success: true, storageBackend, ...saved })
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
        const saved = await writeBlobRegistry(blobToken, state)
        return res.status(200).json({ success: true, storageBackend, receipt, ...saved })
      }

      if (action === 'deleteReceipt' && id) {
        const target = normalizeId(id)
        state.receipts = state.receipts.filter(
          (r) => normalizeId(r.id) !== target && normalizeId(r.receiptNumber) !== target,
        )
        const saved = await writeBlobRegistry(blobToken, state)
        return res.status(200).json({ success: true, storageBackend, ...saved })
      }

      if (action === 'saveWorkOrder' && workOrder) {
        const idx = state.workOrders.findIndex((wo) => wo.id === workOrder.id)
        if (idx >= 0) {
          state.workOrders[idx] = { ...state.workOrders[idx], ...workOrder }
        } else {
          state.workOrders.unshift(workOrder)
        }
        const saved = await writeBlobRegistry(blobToken, state)
        return res.status(200).json({ success: true, storageBackend, workOrder, ...saved })
      }

      if (action === 'deleteWorkOrder' && id) {
        const target = normalizeId(id)
        state.workOrders = state.workOrders.filter((wo) => normalizeId(wo.id) !== target)
        const saved = await writeBlobRegistry(blobToken, state)
        return res.status(200).json({ success: true, storageBackend, ...saved })
      }

      if (action === 'savePartner' && partner) {
        const idx = state.partners.findIndex((p) => p.id === partner.id)
        if (idx >= 0) {
          state.partners[idx] = { ...state.partners[idx], ...partner }
        } else {
          state.partners.push(partner)
        }
        const saved = await writeBlobRegistry(blobToken, state)
        return res.status(200).json({ success: true, storageBackend, partner, ...saved })
      }

      if (action === 'deletePartner' && id) {
        const target = normalizeId(id)
        state.partners = state.partners.filter((p) => normalizeId(p.id) !== target)
        const saved = await writeBlobRegistry(blobToken, state)
        return res.status(200).json({ success: true, storageBackend, ...saved })
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
