import { numberToWordsBDT } from './numberToWords.js'

const WO_STORAGE_KEY = 'iotberg_work_orders_v3'
const REC_STORAGE_KEY = 'iotberg_payment_receipts_v3'

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
    id: 'IB-REC-2026-001',
    receiptNumber: 'IB-REC-2026-001',
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

export const workOrderStore = {
  getWorkOrders() {
    const rawOrders = loadStored(WO_STORAGE_KEY, INITIAL_WORK_ORDERS)
    const receipts = this.getReceipts()

    return rawOrders.map((wo) => {
      // Find all payments linked to this work order (matching id or workOrderRef)
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

  saveWorkOrder(workOrderData) {
    const all = loadStored(WO_STORAGE_KEY, INITIAL_WORK_ORDERS)
    const now = new Date().toISOString()

    const serverCharge = Number(workOrderData.serverCharge) || 0
    const maintenanceCharge = Number(workOrderData.maintenanceCharge) || 0
    const otherAdditionalCharge = Number(workOrderData.otherAdditionalCharge) || 0
    const totalAdditionalCharges = serverCharge + maintenanceCharge + otherAdditionalCharge

    let coreVal = Number(workOrderData.coreContractValue)
    if (isNaN(coreVal) || coreVal <= 0) {
      const fallbackTotal = Number(workOrderData.contractValue) || 480000
      coreVal = Math.max(0, fallbackTotal - totalAdditionalCharges)
    }

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
      const generatedId =
        workOrderData.id || `SIIL-${new Date().getFullYear()}-${String(all.length + 1).padStart(3, '0')}`
      savedItem = {
        ...workOrderData,
        id: generatedId,
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

  deleteWorkOrder(id) {
    const all = loadStored(WO_STORAGE_KEY, INITIAL_WORK_ORDERS).filter((item) => item.id !== id)
    persist(WO_STORAGE_KEY, all)
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

  saveReceipt(receiptData) {
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

    // Compute previous payments for this work order to calculate correct remaining balance
    const otherReceiptsForWo = linkedWo
      ? all.filter(
          (r) =>
            (r.workOrderId === linkedWo.id || r.workOrderId === linkedWo.workOrderRef) &&
            r.id !== receiptData.id &&
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
        updatedAt: now,
      }
      if (savedItem.status === 'verified' && !savedItem.approvedAt) {
        savedItem.approvedAt = now
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

  approveReceipt(id, signatureUrl = null) {
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
        approvedAt: now,
        updatedAt: now,
      }
      persist(REC_STORAGE_KEY, all)
      return all[index]
    }
    return null
  },

  deleteReceipt(id) {
    const all = this.getReceipts().filter((item) => item.id !== id && item.receiptNumber !== id)
    persist(REC_STORAGE_KEY, all)
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
