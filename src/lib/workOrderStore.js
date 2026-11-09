import { numberToWordsBDT } from './numberToWords.js'

const WO_STORAGE_KEY = 'iotberg_work_orders_v1'
const REC_STORAGE_KEY = 'iotberg_payment_receipts_v1'

const INITIAL_WORK_ORDERS = [
  {
    id: 'WO-2026-001',
    clientName: 'TechMatrix Solutions Ltd.',
    clientContactPerson: 'Mr. Tareq Hasan (Director of Technology)',
    clientEmail: 'tareq.hasan@techmatrix.com',
    clientPhone: '+880 1712-345678',
    clientAddress: 'Road 11, Block D, Banani, Dhaka-1213, Bangladesh',
    projectName: 'Enterprise Document Engine & Automated Cloud Pipeline',
    projectScope:
      'Full-cycle architecture, backend microservices development, and deployment of a resilient document-to-PDF rendering pipeline with sub-second turnaround, dynamic JavaScript chart execution, and multi-cloud failover.',
    contractValue: 450000,
    advancePercentage: 20,
    advanceAmount: 90000,
    totalReceived: 90000,
    balanceDue: 360000,
    status: 'active', // active, in_progress, completed, on_hold
    orderDate: '2026-11-09',
    deliveryDate: '2027-01-30',
    notes: '20% advance payment received in cash upon work order execution and signing.',
    createdAt: '2026-11-09T10:00:00.000Z',
    updatedAt: '2026-11-09T10:30:00.000Z',
  },
]

const INITIAL_RECEIPTS = [
  {
    id: 'IB-REC-2026-001',
    workOrderId: 'WO-2026-001',
    receiptNumber: 'IB-REC-2026-001',
    clientName: 'TechMatrix Solutions Ltd.',
    clientContactPerson: 'Mr. Tareq Hasan',
    clientEmail: 'tareq.hasan@techmatrix.com',
    clientAddress: 'Road 11, Block D, Banani, Dhaka-1213, Bangladesh',
    projectName: 'Enterprise Document Engine & Automated Cloud Pipeline',
    amount: 90000,
    amountInWords: 'Ninety Thousand BDT Only',
    paymentCategory: '20% Advance Payment on Work Order',
    paymentMode: 'Cash',
    paymentDate: '2026-11-09',
    receiptDate: '2026-11-09',
    transactionNote:
      'Official cash advance payment received in full as per Work Order WO-2026-001 milestone schedule.',
    totalContractValue: 450000,
    advancePercent: 20,
    balanceRemaining: 360000,
    signatoryName: 'MD. Rezaul Karim',
    signatoryRole: 'Project Manager & Team Lead',
    signatoryCompany: 'IoT-Berg Engineering',
    signatoryEmail: 'rksazid@gmail.com',
    signatureUrl: null, // Will render styled SVG digital cryptographic signature or uploaded image
    sealEnabled: true,
    status: 'verified', // verified, draft, revoked
    verificationHash: '9a4f8b2c1e7d0356ae29c54f8b190a3d4e7f81b0c3d2e5f6a7b8c9d0e1f2a3b4',
    createdAt: '2026-11-09T10:30:00.000Z',
    updatedAt: '2026-11-09T10:30:00.000Z',
  },
]

function loadStored(key, fallback) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback
    }
    const raw = localStorage.getItem(key)
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback))
      return fallback
    }
    return JSON.parse(raw)
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

export const workOrderStore = {
  getWorkOrders() {
    return loadStored(WO_STORAGE_KEY, INITIAL_WORK_ORDERS)
  },

  getWorkOrder(id) {
    const all = this.getWorkOrders()
    return all.find((item) => item.id === id) || null
  },

  saveWorkOrder(workOrderData) {
    const all = this.getWorkOrders()
    const now = new Date().toISOString()

    const contractVal = Number(workOrderData.contractValue) || 0
    const advPercent = Number(workOrderData.advancePercentage) || 0
    const calculatedAdv = Math.round((contractVal * advPercent) / 100)

    const existingIndex = all.findIndex((item) => item.id === workOrderData.id)

    let savedItem
    if (existingIndex >= 0) {
      savedItem = {
        ...all[existingIndex],
        ...workOrderData,
        contractValue: contractVal,
        advancePercentage: advPercent,
        advanceAmount: calculatedAdv,
        balanceDue: Math.max(0, contractVal - (Number(workOrderData.totalReceived) || 0)),
        updatedAt: now,
      }
      all[existingIndex] = savedItem
    } else {
      const generatedId =
        workOrderData.id || `WO-${new Date().getFullYear()}-${String(all.length + 1).padStart(3, '0')}`
      savedItem = {
        ...workOrderData,
        id: generatedId,
        contractValue: contractVal,
        advancePercentage: advPercent,
        advanceAmount: calculatedAdv,
        totalReceived: Number(workOrderData.totalReceived) || 0,
        balanceDue: Math.max(0, contractVal - (Number(workOrderData.totalReceived) || 0)),
        status: workOrderData.status || 'active',
        createdAt: now,
        updatedAt: now,
      }
      all.unshift(savedItem)
    }

    persist(WO_STORAGE_KEY, all)
    return savedItem
  },

  deleteWorkOrder(id) {
    const all = this.getWorkOrders().filter((item) => item.id !== id)
    persist(WO_STORAGE_KEY, all)
    return true
  },

  getReceipts() {
    return loadStored(REC_STORAGE_KEY, INITIAL_RECEIPTS)
  },

  getReceipt(id) {
    const all = this.getReceipts()
    return all.find((item) => item.id === id || item.receiptNumber === id) || null
  },

  saveReceipt(receiptData) {
    const all = this.getReceipts()
    const now = new Date().toISOString()

    const amountNum = Number(receiptData.amount) || 0
    const inWords = receiptData.amountInWords || numberToWordsBDT(amountNum)

    const existingIndex = all.findIndex((item) => item.id === receiptData.id)

    let savedItem
    if (existingIndex >= 0) {
      savedItem = {
        ...all[existingIndex],
        ...receiptData,
        amount: amountNum,
        amountInWords: inWords,
        updatedAt: now,
      }
      all[existingIndex] = savedItem
    } else {
      const generatedId =
        receiptData.id ||
        `IB-REC-${new Date().getFullYear()}-${String(all.length + 1).padStart(3, '0')}`

      // Generate a mock SHA-256 verification signature
      const randomSeed = Math.random().toString(36).substring(2, 15)
      const hash = `ib_${Date.now().toString(16)}_${randomSeed}_verified`

      savedItem = {
        ...receiptData,
        id: generatedId,
        receiptNumber: generatedId,
        amount: amountNum,
        amountInWords: inWords,
        status: receiptData.status || 'verified',
        verificationHash: receiptData.verificationHash || hash,
        createdAt: now,
        updatedAt: now,
      }
      all.unshift(savedItem)

      // Update linked work order's totalReceived if applicable
      if (savedItem.workOrderId) {
        const wo = this.getWorkOrder(savedItem.workOrderId)
        if (wo) {
          const newTotalReceived = (Number(wo.totalReceived) || 0) + amountNum
          this.saveWorkOrder({
            ...wo,
            totalReceived: newTotalReceived,
            balanceDue: Math.max(0, wo.contractValue - newTotalReceived),
          })
        }
      }
    }

    persist(REC_STORAGE_KEY, all)
    return savedItem
  },

  deleteReceipt(id) {
    const all = this.getReceipts().filter((item) => item.id !== id)
    persist(REC_STORAGE_KEY, all)
    return true
  },

  getSummaryStats() {
    const workOrders = this.getWorkOrders()
    const receipts = this.getReceipts()

    const totalContractValue = workOrders.reduce((sum, wo) => sum + (Number(wo.contractValue) || 0), 0)
    const totalPaymentsReceived = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
    const pendingBalance = Math.max(0, totalContractValue - totalPaymentsReceived)
    const activeProjectsCount = workOrders.filter((wo) => wo.status === 'active' || wo.status === 'in_progress').length

    return {
      totalContractValue,
      totalPaymentsReceived,
      pendingBalance,
      activeProjectsCount,
      workOrdersCount: workOrders.length,
      receiptsCount: receipts.length,
    }
  },
}

