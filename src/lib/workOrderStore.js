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
    // Financial Breakdown: Core Engineering vs Additional Operational Services
    coreContractValue: 350000,
    serverCharge: 60000,
    serverPeriod: '1 Year',
    maintenanceCharge: 40000,
    maintenancePeriod: '1 Year',
    otherAdditionalCharge: 0,
    otherAdditionalNote: '',
    totalAdditionalCharges: 100000,
    contractValue: 450000, // Core (৳350,000) + Additional Operational Services (৳100,000)
    hasAdditionalCharges: true,
    status: 'active', // active, in_progress, completed, on_hold
    orderDate: '2026-11-09',
    deliveryDate: '2027-01-30',
    notes:
      'Client engagement includes 1-year managed cloud server hosting and 1-year software maintenance support billed as separate operational allocations.',
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
    paymentHead: 'Advance Payment',
    paymentCategory: 'Advance Payment',
    paymentMode: 'Cash',
    paymentDate: '2026-11-09',
    receiptDate: '2026-11-09',
    transactionNote:
      'Official cash advance payment received in full as per Work Order WO-2026-001 payment schedule.',
    totalContractValue: 450000,
    coreContractValue: 350000,
    serverCharge: 60000,
    serverPeriod: '1 Year',
    maintenanceCharge: 40000,
    maintenancePeriod: '1 Year',
    totalAdditionalCharges: 100000,
    balanceRemaining: 360000,
    signatoryName: 'MD. Rezaul Karim',
    signatoryRole: 'Project Manager & Team Lead',
    signatoryCompany: 'IoT-Berg Engineering',
    signatoryEmail: 'rksazid@gmail.com',
    signatureUrl: null,
    sealEnabled: true,
    status: 'verified',
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
    const data = JSON.parse(raw)
    // Defensive migration: ensure coreContractValue & additional services are populated
    if (Array.isArray(data)) {
      return data.map((item) => {
        if (key === WO_STORAGE_KEY && item.coreContractValue == null) {
          const server = item.serverCharge != null ? Number(item.serverCharge) : 60000
          const maint = item.maintenanceCharge != null ? Number(item.maintenanceCharge) : 40000
          const totalAddons = server + maint
          const totalContract = Number(item.contractValue) || 450000
          return {
            ...item,
            coreContractValue: Math.max(0, totalContract - totalAddons),
            serverCharge: server,
            serverPeriod: item.serverPeriod || '1 Year',
            maintenanceCharge: maint,
            maintenancePeriod: item.maintenancePeriod || '1 Year',
            otherAdditionalCharge: Number(item.otherAdditionalCharge) || 0,
            otherAdditionalNote: item.otherAdditionalNote || '',
            totalAdditionalCharges: totalAddons,
            hasAdditionalCharges: totalAddons > 0,
          }
        }
        if (key === REC_STORAGE_KEY && item.coreContractValue == null) {
          const server = item.serverCharge != null ? Number(item.serverCharge) : 60000
          const maint = item.maintenanceCharge != null ? Number(item.maintenanceCharge) : 40000
          const totalAddons = server + maint
          const totalContract = Number(item.totalContractValue) || 450000
          return {
            ...item,
            coreContractValue: Math.max(0, totalContract - totalAddons),
            serverCharge: server,
            serverPeriod: item.serverPeriod || '1 Year',
            maintenanceCharge: maint,
            maintenancePeriod: item.maintenancePeriod || '1 Year',
            totalAdditionalCharges: totalAddons,
          }
        }
        return item
      })
    }
    return data
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
      // Find all payments linked to this work order
      const payments = receipts.filter(
        (r) => r.workOrderId === wo.id && r.status !== 'revoked',
      )
      const actualReceived = payments.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
      const contractVal = Number(wo.contractValue) || 0
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
    return all.find((item) => item.id === id) || null
  },

  getPaymentsForWorkOrder(workOrderId) {
    const receipts = this.getReceipts()
    return receipts.filter((r) => r.workOrderId === workOrderId && r.status !== 'revoked')
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
      const fallbackTotal = Number(workOrderData.contractValue) || 450000
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
        workOrderData.id || `WO-${new Date().getFullYear()}-${String(all.length + 1).padStart(3, '0')}`
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
    return all.find((item) => item.id === id || item.receiptNumber === id) || null
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
        : linkedWo?.coreContractValue || 350000
    const serverCharge =
      receiptData.serverCharge != null
        ? Number(receiptData.serverCharge)
        : linkedWo?.serverCharge || 60000
    const serverPeriod = receiptData.serverPeriod || linkedWo?.serverPeriod || '1 Year'
    const maintenanceCharge =
      receiptData.maintenanceCharge != null
        ? Number(receiptData.maintenanceCharge)
        : linkedWo?.maintenanceCharge || 40000
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
            r.workOrderId === linkedWo.id &&
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
      receiptData.paymentHead || receiptData.paymentCategory || 'Project Payment'

    const existingIndex = all.findIndex((item) => item.id === receiptData.id)

    let savedItem
    if (existingIndex >= 0) {
      savedItem = {
        ...all[existingIndex],
        ...receiptData,
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
        status: receiptData.status || 'verified',
        verificationHash: receiptData.verificationHash || hash,
        createdAt: now,
        updatedAt: now,
      }
      all.unshift(savedItem)
    }

    persist(REC_STORAGE_KEY, all)
    return savedItem
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
