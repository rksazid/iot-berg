import { neon } from '@neondatabase/serverless'

let _sql = null
let _schemaReady = false

export function isNeonConfigured() {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim())
}

export function getSql() {
  if (!isNeonConfigured()) {
    return null
  }
  if (!_sql) {
    _sql = neon(process.env.DATABASE_URL)
  }
  return _sql
}

export async function ensureSchema(sql) {
  if (_schemaReady) return

  await sql`
    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY,
      client_po_ref TEXT,
      client_name TEXT,
      project_name TEXT,
      contract_value BIGINT DEFAULT 0,
      status TEXT DEFAULT 'active',
      payload_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS payment_receipts (
      id TEXT PRIMARY KEY,
      receipt_number TEXT,
      work_order_id TEXT,
      client_name TEXT,
      amount BIGINT DEFAULT 0,
      status TEXT DEFAULT 'pending_approval',
      payload_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS trusted_partners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      payload_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  _schemaReady = true
}

export async function readAllFromNeon() {
  const sql = getSql()
  if (!sql) return null
  await ensureSchema(sql)

  const [woRows, recRows, partnerRows] = await Promise.all([
    sql`SELECT payload_json FROM work_orders ORDER BY updated_at DESC`,
    sql`SELECT payload_json FROM payment_receipts ORDER BY updated_at DESC`,
    sql`SELECT payload_json FROM trusted_partners ORDER BY sort_order ASC, updated_at DESC`,
  ])

  const initialized = woRows.length > 0 || recRows.length > 0 || partnerRows.length > 0
  return {
    initialized,
    workOrders: woRows.map((r) => r.payload_json),
    receipts: recRows.map((r) => r.payload_json),
    partners: partnerRows.map((r) => r.payload_json),
    updatedAt: new Date().toISOString(),
  }
}

export async function upsertWorkOrderNeon(wo) {
  const sql = getSql()
  if (!sql || !wo?.id) return
  await ensureSchema(sql)
  await sql`
    INSERT INTO work_orders (id, client_po_ref, client_name, project_name, contract_value, status, payload_json, updated_at)
    VALUES (
      ${wo.id},
      ${wo.clientPoRef || null},
      ${wo.clientName || ''},
      ${wo.projectName || ''},
      ${Number(wo.contractValue) || 0},
      ${wo.status || 'active'},
      ${JSON.stringify(wo)}::jsonb,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      client_po_ref = EXCLUDED.client_po_ref,
      client_name = EXCLUDED.client_name,
      project_name = EXCLUDED.project_name,
      contract_value = EXCLUDED.contract_value,
      status = EXCLUDED.status,
      payload_json = EXCLUDED.payload_json,
      updated_at = NOW()
  `
}

export async function deleteWorkOrderNeon(id) {
  const sql = getSql()
  if (!sql || !id) return
  await ensureSchema(sql)
  await sql`DELETE FROM work_orders WHERE id = ${id}`
}

export async function upsertReceiptNeon(rec) {
  const sql = getSql()
  if (!sql || !rec?.id) return
  await ensureSchema(sql)
  await sql`
    INSERT INTO payment_receipts (id, receipt_number, work_order_id, client_name, amount, status, payload_json, updated_at)
    VALUES (
      ${rec.id},
      ${rec.receiptNumber || rec.id},
      ${rec.workOrderId || null},
      ${rec.clientName || ''},
      ${Number(rec.amount) || 0},
      ${rec.status || 'pending_approval'},
      ${JSON.stringify(rec)}::jsonb,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      receipt_number = EXCLUDED.receipt_number,
      work_order_id = EXCLUDED.work_order_id,
      client_name = EXCLUDED.client_name,
      amount = EXCLUDED.amount,
      status = EXCLUDED.status,
      payload_json = EXCLUDED.payload_json,
      updated_at = NOW()
  `
}

export async function deleteReceiptNeon(id) {
  const sql = getSql()
  if (!sql || !id) return
  await ensureSchema(sql)
  await sql`DELETE FROM payment_receipts WHERE id = ${id} OR receipt_number = ${id}`
}

export async function upsertPartnerNeon(partner) {
  const sql = getSql()
  if (!sql || !partner?.id) return
  await ensureSchema(sql)
  await sql`
    INSERT INTO trusted_partners (id, name, title, sort_order, active, payload_json, updated_at)
    VALUES (
      ${partner.id},
      ${partner.name || ''},
      ${partner.title || ''},
      ${Number(partner.sortOrder) || 0},
      ${partner.active !== false},
      ${JSON.stringify(partner)}::jsonb,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      title = EXCLUDED.title,
      sort_order = EXCLUDED.sort_order,
      active = EXCLUDED.active,
      payload_json = EXCLUDED.payload_json,
      updated_at = NOW()
  `
}

export async function deletePartnerNeon(id) {
  const sql = getSql()
  if (!sql || !id) return
  await ensureSchema(sql)
  await sql`DELETE FROM trusted_partners WHERE id = ${id}`
}

export async function seedNeonIfEmpty({ workOrders = [], receipts = [], partners = [] }) {
  const current = await readAllFromNeon()
  if (!current || current.initialized) return current
  for (const wo of workOrders) await upsertWorkOrderNeon(wo)
  for (const rec of receipts) await upsertReceiptNeon(rec)
  for (const p of partners) await upsertPartnerNeon(p)
  return await readAllFromNeon()
}
