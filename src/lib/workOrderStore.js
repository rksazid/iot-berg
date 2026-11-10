import { numberToWordsBDT } from './numberToWords.js'

const WO_STORAGE_KEY = 'iotberg_work_orders_v4'
const REC_STORAGE_KEY = 'iotberg_payment_receipts_v4'

// Safe, non-revealing reference number generator (YYMM + 4-char opaque alphanumeric code)
const SAFE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

export function generateNonRevealingId(prefix = 'IB-REC', existingIds = []) {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')

  for (let attempt = 0; attempt < 20; attempt += 1) {
    let suffix = ''
    for (let i = 0; i < 4; i += 1) {
      suffix += SAFE_ALPHABET.charAt(Math.floor(Math.random() * SAFE_ALPHABET.length))
    }
    const candidate = `${prefix}-${yy}${mm}-${suffix}`
    if (!existingIds.includes(candidate)) {
      return candidate
    }
  }
  return `${prefix}-${yy}${mm}-${Date.now().toString(36).slice(-4).toUpperCase()}`
}

export function generateWorkOrderRef(existingIds = []) {
  return generateNonRevealingId('IB-WO', existingIds)
}

export function generateReceiptNumber(existingIds = []) {
  return generateNonRevealingId('IB-REC', existingIds)
}

const INITIAL_WORK_ORDERS = [
  {
    id: 'SIIL-A10003',
    workOrderRef: 'SIIL - A10003',
    clientName: 'Sazin Innovative Industries Ltd.',
    clientContactPerson: 'Engr. Mr. Sabbir Ahmed',
    clientContactPhone: '01303-215742',
    requestedBy: 'Rakibul Milon (Rakib)',
    clientDepartment: 'IT (Website)',
    clientEmail: 'sazin.ltd@gmail.com',
    clientBillingEmail: 'sazin.ltd2020@gmail.com',
    clientPhone: '+88-02-9007014',
    clientAddress: 'Road-30, House-432, Mohakhali DOHS, Dhaka, Bangladesh',
    clientWebsite: 'www.sazin.com.bd',
    projectName: 'Sazin Business Website (Canada & Bangladesh)',
    projectScope:
      'Industrial B2B Website & Dual CMS (Canada & Bangladesh). Includes Public Website Shell, Homepage & Corporate, Product Catalogue, Technical PDP, Product Comparison (MVP), Industries & Applications, CAD & Document Center. Canadian Domain: www.flxcore.ca | BD Domain: To be shared later.',
    jobType: 'Industrial B2B Website',
    billTo: 'MD. Rezaul Karim',
    // Financial Breakdown as per Work Order SIIL - A10003
    coreContractValue: 450000,
    serverCharge: 30000, // Yearly Server Charge & Maintenance Fee
    serverPeriod: '1 Year',
    maintenanceCharge: 0, // Bundled into yearly operational fee
    maintenancePeriod: '1 Year',
    otherAdditionalCharge: 0,
    otherAdditionalNote: 'Yearly Server Charge & Maintenance Fee',
    totalAdditionalCharges: 30000,
    contractValue: 480000, // Subtotal + Additional = 480,000 BDT
    hasAdditionalCharges: true,
    status: 'active',
    orderDate: '2026-11-02', // 02.11.26
    deliveryDate: '2027-01-31',
    specialInstructions: [
      '01. Initial 90-Days Post-Launch Warranty & Free Support',
      '02. 3-Year Service & Maintenance Agreement + 2-Year Extension Option',
      '03. Major revisions will be billed according to the scope of work (negotiable)',
      '04. Client is responsible for Yearly domain charge',
    ],
    milestones: [
      { step: '01', pct: '20%', desc: 'Scope freeze, UX baseline, deployment plan (Advance)', amount: 96000 },
      { step: '02', pct: '30%', desc: 'Catalogue, comparison MVP, CMS, revisions hardened', amount: 144000 },
      { step: '03', pct: '30%', desc: 'Search, filters, CAD center, RFQ, launch dataset', amount: 144000 },
      { step: '04', pct: '20%', desc: 'SQA verification, SSL/CDN cutover, final handover', amount: 96000 },
    ],
    notes:
      'Official signed Work Order SIIL - A10003. Initial 90-Days post-launch warranty & free support included. 3-Year service & maintenance agreement with 2-year extension option. Client responsible for yearly domain charge.',
    scannedDocUrl: '/work-orders/SIIL-A10003-scan.jpg',
    pdfDocUrl: '/work-orders/SIIL-A10003-work-order.pdf',
    createdAt: '2026-11-02T10:00:00.000Z',
    updatedAt: '2026-11-08T11:00:00.000Z',
  },
]

const INITIAL_RECEIPTS = [
  {
    id: 'IB-REC-2611-7C4N',
    receiptNumber: 'IB-REC-2611-7C4N',
    workOrderId: 'SIIL-A10003',
    workOrderRef: 'SIIL - A10003',
    clientName: 'Sazin Innovative Industries Ltd.',
    clientContactPerson: 'Engr. Mr. Sabbir Ahmed (Mob: 01303-215742)',
    clientEmail: 'sazin.ltd@gmail.com',
    clientAddress: 'Road-30, House-432, Mohakhali DOHS, Dhaka, Bangladesh',
    projectName: 'Sazin Business Website (Canada & Bangladesh)',
    amount: 90000,
    amountInWords: 'Ninety Thousand BDT Only',
    paymentHead: 'Advance Payment',
    paymentCategory: 'Advance Payment',
    paymentMode: 'Cash',
    paymentDate: '2026-11-08',
    receiptDate: '2026-11-08',
    transactionNote:
      'Advance cash payment received against Work Order SIIL - A10003 for Milestone 01 (Scope freeze, UX baseline & deployment plan).',
    totalContractValue: 480000,
    coreContractValue: 450000,
    serverCharge: 30000,
    serverPeriod: '1 Year',
    maintenanceCharge: 0,
    maintenancePeriod: '1 Year',
    totalAdditionalCharges: 30000,
    balanceRemaining: 390000, // 480,000 - 90,000
    signatoryName: 'MD. Rezaul Karim',
    signatoryRole: 'Project Manager & Team Lead',
    signatoryCompany: 'IoT-Berg Engineering',
    signatoryEmail: 'rksazid@gmail.com',
    signatureUrl: null,
    signatureDataUrl: null,
    sealEnabled: true,
    status: 'pending_approval',
    verificationHash: '9a4f8b2c1e7d0356ae29c54f8b190a3d4e7f81b0c3d2e5f6a7b8c9d0e1f2a3b4',
    createdAt: '2026-11-08T14:30:00.000Z',
    updatedAt: '2026-11-08T14:30:00.000Z',
  },
]

function loadStored(key, fallback) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback
    }
    const raw = localStorage.getItem(key)
    if (raw === null) {
      localStorage.setItem(key, JSON.stringify(fallback))
      return fallback
    }
    const data = JSON.parse(raw)
    if (Array.isArray(data)) {
      return data
    }
    return fallback
  } catch (err) {
    console.warn(`Failed to read ${key} from storage:`, err)
    return fallback
  }
}

function persist(key, data) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.warn(`Failed to persist ${key} to storage:`, err)
  }
}

async function postRegistryAction(payload) {
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return null
  }
  try {
    const res = await fetch('/api/registry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        seed: {
          workOrders: INITIAL_WORK_ORDERS,
          receipts: INITIAL_RECEIPTS,
        },
      }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.warn('Cloud registry sync warning:', err.message)
    return null
  }
}

export const workOrderStore = {
  /**
   * Synchronize local cache with cloud Vercel Blob registry (/api/registry).
   */
  async syncFromCloud() {
    if (typeof window === 'undefined' || typeof fetch !== 'function') {
      return { workOrders: this.getWorkOrders(), receipts: this.getReceipts() }
    }
    try {
      const res = await fetch('/api/registry', { cache: 'no-store' })
      if (!res.ok) {
        return { workOrders: this.getWorkOrders(), receipts: this.getReceipts() }
      }
      const data = await res.json()
      if (data.initialized && Array.isArray(data.workOrders) && Array.isArray(data.receipts)) {
        const localRecs = loadStored(REC_STORAGE_KEY, INITIAL_RECEIPTS)
        const remoteRecs = data.receipts.map((remoteRec) => {
          const localMatch = localRecs.find(
            (l) => l.id === remoteRec.id || l.receiptNumber === remoteRec.receiptNumber,
          )
          if (
            localMatch?.updatedAt &&
            remoteRec?.updatedAt &&
            new Date(localMatch.updatedAt) > new Date(remoteRec.updatedAt)
          ) {
            return localMatch
          }
          return remoteRec
        })
        persist(WO_STORAGE_KEY, data.workOrders)
        persist(REC_STORAGE_KEY, remoteRecs)
        return { workOrders: this.getWorkOrders(), receipts: this.getReceipts(), synced: true }
      }
      // Registry is empty on cloud -> seed it with initial data cleanly
      const localWos = loadStored(WO_STORAGE_KEY, INITIAL_WORK_ORDERS)
      const localRecs = loadStored(REC_STORAGE_KEY, INITIAL_RECEIPTS)
      await postRegistryAction({
        action: 'bootstrap',
        workOrders: localWos,
        receipts: localRecs,
      })
      return { workOrders: this.getWorkOrders(), receipts: this.getReceipts(), bootstrapped: true }
    } catch (err) {
      console.warn('Cloud sync skipped:', err.message)
      return { workOrders: this.getWorkOrders(), receipts: this.getReceipts() }
    }
  },

  /**
   * Dynamic single-receipt fetch from cloud registry (falls back cleanly to local storage).
   */
  async fetchReceiptById(id) {
    if (!id) return null
    const localCached = this.getReceipt(id)
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      try {
        const res = await fetch(`/api/registry?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data?.receipt) {
            if (
              localCached?.updatedAt &&
              data.receipt?.updatedAt &&
              new Date(localCached.updatedAt) > new Date(data.receipt.updatedAt)
            ) {
              return localCached
            }
            // Merge into local cache
            const current = loadStored(REC_STORAGE_KEY, INITIAL_RECEIPTS)
            const idx = current.findIndex(
              (r) => r.id === data.receipt.id || r.receiptNumber === data.receipt.receiptNumber,
            )
            if (idx >= 0) {
              current[idx] = data.receipt
            } else {
              current.unshift(data.receipt)
            }
            persist(REC_STORAGE_KEY, current)
            return data.receipt
          }
        } else if (res.status === 404) {
          const body = await res.json().catch(() => null)
          if (body?.initialized) {
            return localCached
          }
        }
      } catch (err) {
        console.warn('Dynamic receipt lookup fallback to local:', err.message)
      }
    }
    return localCached
  },

  getWorkOrders() {
    const rawOrders = loadStored(WO_STORAGE_KEY, INITIAL_WORK_ORDERS)
    const receipts = this.getReceipts()

    return rawOrders.map((wo) => {
      const woNormId = (wo.id || '').replace(/\s+/g, '').toLowerCase()
      const woNormRef = (wo.workOrderRef || '').replace(/\s+/g, '').toLowerCase()

      const payments = receipts.filter((r) => {
        if (r.status === 'revoked') return false
        const rNormWo = (r.workOrderId || '').replace(/\s+/g, '').toLowerCase()
        const rNormRef = (r.workOrderRef || '').replace(/\s+/g, '').toLowerCase()
        return (
          rNormWo === woNormId ||
          rNormWo === woNormRef ||
          rNormRef === woNormId ||
          rNormRef === woNormRef
        )
      })

      const actualReceived = payments.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
      const contractVal = Number(wo.contractValue) || 480000
      const balanceDue = Math.max(0, contractVal - actualReceived)

      return {
        ...wo,
        contractValue: contractVal,
        totalReceived: actualReceived,
        balanceDue,
        payments,
        paymentsCount: payments.length,
        hasPayments: actualReceived > 0,
        isFullyPaid: actualReceived >= contractVal && contractVal > 0,
      }
    })
  },

  getWorkOrder(id) {
    const all = this.getWorkOrders()
    const norm = (id || '').replace(/\s+/g, '').toLowerCase()
    return (
      all.find(
        (item) =>
          item.id === id ||
          (item.id || '').replace(/\s+/g, '').toLowerCase() === norm ||
          (item.workOrderRef || '').replace(/\s+/g, '').toLowerCase() === norm,
      ) || null
    )
  },

  getPaymentsForWorkOrder(workOrderId) {
    const receipts = this.getReceipts()
    const norm = (workOrderId || '').replace(/\s+/g, '').toLowerCase()
    return receipts.filter((r) => {
      if (r.status === 'revoked') return false
      const rNormWo = (r.workOrderId || '').replace(/\s+/g, '').toLowerCase()
      const rNormRef = (r.workOrderRef || '').replace(/\s+/g, '').toLowerCase()
      return rNormWo === norm || rNormRef === norm
    })
  },

  _prepareWorkOrder(workOrderData) {
    const all = loadStored(WO_STORAGE_KEY, INITIAL_WORK_ORDERS)
    const now = new Date().toISOString()

    const coreVal = Number(workOrderData.coreContractValue) || Number(workOrderData.contractValue) || 0
    const serverCharge = Number(workOrderData.serverCharge) || 0
    const maintenanceCharge = Number(workOrderData.maintenanceCharge) || 0
    const otherAdditionalCharge = Number(workOrderData.otherAdditionalCharge) || 0
    const totalAdditionalCharges = serverCharge + maintenanceCharge + otherAdditionalCharge
    const contractVal = coreVal + totalAdditionalCharges

    const existingIndex = all.findIndex((item) => item.id === workOrderData.id)

    let savedItem
    if (existingIndex >= 0) {
      savedItem = {
        ...all[existingIndex],
        ...workOrderData,
        coreContractValue: coreVal,
        serverCharge,
        serverPeriod: workOrderData.serverPeriod || '1 Year',
        maintenanceCharge,
        maintenancePeriod: workOrderData.maintenancePeriod || '1 Year',
        otherAdditionalCharge,
        otherAdditionalNote: workOrderData.otherAdditionalNote || '',
        totalAdditionalCharges,
        hasAdditionalCharges: totalAdditionalCharges > 0,
        contractValue: contractVal,
        updatedAt: now,
      }
      all[existingIndex] = savedItem
    } else {
      const existingIds = all.map((item) => item.id)
      const generatedId = workOrderData.id || generateWorkOrderRef(existingIds)
      savedItem = {
        ...workOrderData,
        id: generatedId,
        workOrderRef: workOrderData.workOrderRef || generatedId,
        coreContractValue: coreVal,
        serverCharge,
        serverPeriod: workOrderData.serverPeriod || '1 Year',
        maintenanceCharge,
        maintenancePeriod: workOrderData.maintenancePeriod || '1 Year',
        otherAdditionalCharge,
        otherAdditionalNote: workOrderData.otherAdditionalNote || '',
        totalAdditionalCharges,
        hasAdditionalCharges: totalAdditionalCharges > 0,
        contractValue: contractVal,
        status: workOrderData.status || 'active',
        createdAt: now,
        updatedAt: now,
      }
      all.unshift(savedItem)
    }

    persist(WO_STORAGE_KEY, all)
    return savedItem
  },

  saveWorkOrder(workOrderData) {
    const savedItem = this._prepareWorkOrder(workOrderData)
    postRegistryAction({ action: 'saveWorkOrder', workOrder: savedItem })
    return savedItem
  },

  async saveWorkOrderAsync(workOrderData) {
    const savedItem = this._prepareWorkOrder(workOrderData)
    await postRegistryAction({ action: 'saveWorkOrder', workOrder: savedItem })
    return savedItem
  },

  deleteWorkOrder(id) {
    const all = loadStored(WO_STORAGE_KEY, INITIAL_WORK_ORDERS).filter((item) => item.id !== id)
    persist(WO_STORAGE_KEY, all)
    postRegistryAction({ action: 'deleteWorkOrder', id })
    return true
  },

  async deleteWorkOrderAsync(id) {
    const all = loadStored(WO_STORAGE_KEY, INITIAL_WORK_ORDERS).filter((item) => item.id !== id)
    persist(WO_STORAGE_KEY, all)
    await postRegistryAction({ action: 'deleteWorkOrder', id })
    return true
  },

  getReceipts() {
    return loadStored(REC_STORAGE_KEY, INITIAL_RECEIPTS)
  },

  getReceipt(id) {
    const all = this.getReceipts()
    const norm = (id || '').replace(/\s+/g, '').toLowerCase()
    return (
      all.find(
        (item) =>
          item.id === id ||
          item.receiptNumber === id ||
          (item.id || '').replace(/\s+/g, '').toLowerCase() === norm ||
          (item.receiptNumber || '').replace(/\s+/g, '').toLowerCase() === norm,
      ) || null
    )
  },

  _prepareReceipt(receiptData) {
    const all = this.getReceipts()
    const now = new Date().toISOString()

    const amountNum = Number(receiptData.amount) || 0
    const inWords = receiptData.amountInWords || numberToWordsBDT(amountNum)

    const linkedWo = receiptData.workOrderId ? this.getWorkOrder(receiptData.workOrderId) : null
    const coreVal =
      receiptData.coreContractValue != null
        ? Number(receiptData.coreContractValue)
        : linkedWo?.coreContractValue || 450000
    const serverCharge =
      receiptData.serverCharge != null
        ? Number(receiptData.serverCharge)
        : linkedWo?.serverCharge != null
        ? linkedWo.serverCharge
        : 30000
    const serverPeriod = receiptData.serverPeriod || linkedWo?.serverPeriod || '1 Year'
    const maintenanceCharge =
      receiptData.maintenanceCharge != null
        ? Number(receiptData.maintenanceCharge)
        : linkedWo?.maintenanceCharge || 0
    const maintenancePeriod =
      receiptData.maintenancePeriod || linkedWo?.maintenancePeriod || '1 Year'
    const totalAdditionalCharges =
      serverCharge + maintenanceCharge + (Number(receiptData.otherAdditionalCharge) || 0)
    const totalContractValue = receiptData.totalContractValue
      ? Number(receiptData.totalContractValue)
      : coreVal + totalAdditionalCharges

    const otherReceiptsForWo = linkedWo
      ? all.filter(
          (r) =>
            (r.workOrderId === linkedWo.id || r.workOrderId === linkedWo.workOrderRef) &&
            r.id !== receiptData.id &&
            r.receiptNumber !== receiptData.receiptNumber &&
            r.status !== 'revoked',
        )
      : []
    const previouslyReceived = otherReceiptsForWo.reduce(
      (sum, r) => sum + (Number(r.amount) || 0),
      0,
    )
    const balanceRemaining = Math.max(0, totalContractValue - (previouslyReceived + amountNum))

    const paymentHead =
      receiptData.paymentHead || receiptData.paymentCategory || 'Advance Payment'

    const existingIndex = all.findIndex(
      (item) =>
        item.id === receiptData.id ||
        (receiptData.receiptNumber && item.receiptNumber === receiptData.receiptNumber),
    )

    const resolvedWorkOrderRef =
      receiptData.workOrderRef || linkedWo?.workOrderRef || linkedWo?.id || receiptData.workOrderId

    let savedItem
    if (existingIndex >= 0) {
      savedItem = {
        ...all[existingIndex],
        ...receiptData,
        workOrderRef: resolvedWorkOrderRef,
        paymentHead,
        paymentCategory: paymentHead,
        coreContractValue: coreVal,
        serverCharge,
        serverPeriod,
        maintenanceCharge,
        maintenancePeriod,
        totalAdditionalCharges,
        totalContractValue,
        balanceRemaining,
        amount: amountNum,
        amountInWords: inWords,
        status: receiptData.status || all[existingIndex].status || 'pending_approval',
        signatureUrl:
          receiptData.signatureUrl !== undefined
            ? receiptData.signatureUrl
            : all[existingIndex].signatureUrl,
        signatureDataUrl:
          receiptData.signatureDataUrl !== undefined
            ? receiptData.signatureDataUrl
            : all[existingIndex].signatureDataUrl,
        updatedAt: now,
      }
      if (savedItem.status === 'verified' && !savedItem.approvedAt) {
        savedItem.approvedAt = now
      }
      all[existingIndex] = savedItem
    } else {
      const existingIds = all.map((item) => item.id)
      const generatedId = receiptData.id || generateReceiptNumber(existingIds)

      const randomSeed = Math.random().toString(36).substring(2, 15)
      const hash = `ib_${Date.now().toString(16)}_${randomSeed}_verified`

      savedItem = {
        ...receiptData,
        id: generatedId,
        receiptNumber: generatedId,
        workOrderRef: resolvedWorkOrderRef,
        paymentHead,
        paymentCategory: paymentHead,
        coreContractValue: coreVal,
        serverCharge,
        serverPeriod,
        maintenanceCharge,
        maintenancePeriod,
        totalAdditionalCharges,
        totalContractValue,
        balanceRemaining,
        amount: amountNum,
        amountInWords: inWords,
        status: receiptData.status || 'pending_approval',
        verificationHash: receiptData.verificationHash || hash,
        createdAt: now,
        updatedAt: now,
      }
      if (savedItem.status === 'verified') {
        savedItem.approvedAt = now
      }
      all.unshift(savedItem)
    }

    persist(REC_STORAGE_KEY, all)
    return savedItem
  },

  saveReceipt(receiptData) {
    const savedItem = this._prepareReceipt(receiptData)
    postRegistryAction({ action: 'saveReceipt', receipt: savedItem })
    return savedItem
  },

  async saveReceiptAsync(receiptData) {
    const savedItem = this._prepareReceipt(receiptData)
    await postRegistryAction({ action: 'saveReceipt', receipt: savedItem })
    return savedItem
  },

  approveReceipt(id, signatureUrl = null, signatureDataUrl = null) {
    const all = this.getReceipts()
    const index = all.findIndex((r) => r.id === id || r.receiptNumber === id)
    if (index >= 0) {
      const now = new Date().toISOString()
      const randomSeed = Math.random().toString(36).substring(2, 15)
      const hash = `ib_${Date.now().toString(16)}_${randomSeed}_approved`
      all[index] = {
        ...all[index],
        status: 'verified',
        verificationHash: hash,
        signatureUrl: signatureUrl !== null ? signatureUrl : all[index].signatureUrl,
        signatureDataUrl:
          signatureDataUrl !== null ? signatureDataUrl : all[index].signatureDataUrl,
        approvedAt: now,
        updatedAt: now,
      }
      persist(REC_STORAGE_KEY, all)
      postRegistryAction({ action: 'saveReceipt', receipt: all[index] })
      return all[index]
    }
    return null
  },

  async approveReceiptAsync(id, signatureUrl = null, signatureDataUrl = null) {
    const approved = this.approveReceipt(id, signatureUrl, signatureDataUrl)
    if (approved) {
      await postRegistryAction({ action: 'saveReceipt', receipt: approved })
    }
    return approved
  },

  deleteReceipt(id) {
    const all = this.getReceipts().filter((item) => item.id !== id && item.receiptNumber !== id)
    persist(REC_STORAGE_KEY, all)
    postRegistryAction({ action: 'deleteReceipt', id })
    return true
  },

  async deleteReceiptAsync(id) {
    const all = this.getReceipts().filter((item) => item.id !== id && item.receiptNumber !== id)
    persist(REC_STORAGE_KEY, all)
    await postRegistryAction({ action: 'deleteReceipt', id })
    return true
  },

  getSummaryStats() {
    const workOrders = this.getWorkOrders()
    const receipts = this.getReceipts()

    const totalContractValue = workOrders.reduce(
      (sum, wo) => sum + (Number(wo.contractValue) || 0),
      0,
    )
    const totalCoreValue = workOrders.reduce(
      (sum, wo) =>
        sum +
        (Number(wo.coreContractValue) ||
          Number(wo.contractValue) - (Number(wo.totalAdditionalCharges) || 0)),
      0,
    )
    const totalServerValue = workOrders.reduce((sum, wo) => sum + (Number(wo.serverCharge) || 0), 0)
    const totalMaintenanceValue = workOrders.reduce(
      (sum, wo) => sum + (Number(wo.maintenanceCharge) || 0),
      0,
    )
    const totalAdditionalCharges = totalServerValue + totalMaintenanceValue

    const totalPaymentsReceived = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
    const pendingBalance = Math.max(0, totalContractValue - totalPaymentsReceived)
    const activeProjectsCount = workOrders.filter(
      (wo) => wo.status === 'active' || wo.status === 'in_progress',
    ).length
    const collectionRate =
      totalContractValue > 0 ? Math.round((totalPaymentsReceived / totalContractValue) * 100) : 0

    return {
      totalContractValue,
      totalCoreValue,
      totalServerValue,
      totalMaintenanceValue,
      totalAdditionalCharges,
      totalPaymentsReceived,
      pendingBalance,
      collectionRate,
      activeProjectsCount,
      workOrdersCount: workOrders.length,
      receiptsCount: receipts.length,
    }
  },
}
