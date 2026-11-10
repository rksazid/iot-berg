import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom'
import { workOrderStore, generateReceiptNumber } from '../../lib/workOrderStore'
import { numberToWordsBDT, formatCurrencyBDT } from '../../lib/numberToWords'
import { optimizeImage } from '../../lib/imageOptimizer'
import { uploadToVercelBlob } from '../../lib/blobStorage'
import { generateQrDataUrl } from '../../lib/qrCode'
import { useAuth } from '../../context/AuthContext'

const PRESET_PAYMENT_HEADS = [
  'Advance Payment',
  'Milestone 1 Payment',
  'Milestone 2 / Progress Payment',
  'Server & Cloud Hosting (1-Year)',
  'Software Maintenance & SLA Support (1-Year)',
  'Final Settlement & Handover',
]

export function CreateReceiptPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { receiptId: routeReceiptId } = useParams()
  const { currentUser } = useAuth()

  const editId = routeReceiptId || searchParams.get('edit') || null
  const isEditMode = Boolean(editId)

  const workOrders = workOrderStore.getWorkOrders()
  const preselectedWoId = searchParams.get('workOrderId') || (workOrders[0]?.id || '')

  const [selectedWoId, setSelectedWoId] = useState(preselectedWoId)
  const [selectedWo, setSelectedWo] = useState(null)
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false)
  const [existingReceiptNumber, setExistingReceiptNumber] = useState(() =>
    isEditMode ? '' : generateReceiptNumber(workOrderStore.getReceipts().map((r) => r.id)),
  )
  const [receiptStatus, setReceiptStatus] = useState('pending_approval')

  // Payment Particulars
  const [paymentHead, setPaymentHead] = useState('Advance Payment')
  const [amount, setAmount] = useState('90000')
  const [percentHelper, setPercentHelper] = useState('18.8')
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [transactionNote, setTransactionNote] = useState('')

  // Client & Work Order Context
  const [clientName, setClientName] = useState('')
  const [clientContactPerson, setClientContactPerson] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [projectName, setProjectName] = useState('')
  const [totalContractValue, setTotalContractValue] = useState(480000)
  const [coreContractValue, setCoreContractValue] = useState(450000)
  const [serverCharge, setServerCharge] = useState(30000)
  const [serverPeriod, setServerPeriod] = useState('1 Year')
  const [maintenanceCharge, setMaintenanceCharge] = useState(0)
  const [maintenancePeriod, setMaintenancePeriod] = useState('1 Year')
  const [totalAdditionalCharges, setTotalAdditionalCharges] = useState(30000)
  const [previouslyReceived, setPreviouslyReceived] = useState(0)
  const [currentBalanceDue, setCurrentBalanceDue] = useState(480000)

  // Signatory
  const [signatoryName, setSignatoryName] = useState('MD. Rezaul Karim')
  const [signatoryRole, setSignatoryRole] = useState('Project Manager & Team Lead')
  const [signatureUrl, setSignatureUrl] = useState('')
  const [signatureDataUrl, setSignatureDataUrl] = useState('')
  const [signatureStats, setSignatureStats] = useState(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Canvas drawing state
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signatureMode, setSignatureMode] = useState('upload') // 'upload' | 'draw' | 'seal'

  // QR Preview
  const [previewQr, setPreviewQr] = useState('')

  const populateFromExisting = (existing) => {
    setExistingReceiptNumber(existing.receiptNumber || existing.id)
    setSelectedWoId(existing.workOrderId || '')
    setPaymentHead(existing.paymentHead || existing.paymentCategory || 'Advance Payment')
    setAmount(String(existing.amount || ''))
    setPaymentMode(existing.paymentMode || 'Cash')
    setPaymentDate(existing.paymentDate || existing.receiptDate || new Date().toISOString().split('T')[0])
    setTransactionNote(existing.transactionNote || '')
    setClientName(existing.clientName || '')
    setClientContactPerson(existing.clientContactPerson || '')
    setClientEmail(existing.clientEmail || '')
    setClientAddress(existing.clientAddress || '')
    setProjectName(existing.projectName || '')
    const totVal = Number(existing.totalContractValue) || 480000
    setTotalContractValue(totVal)
    setCoreContractValue(existing.coreContractValue || 450000)
    setServerCharge(existing.serverCharge != null ? existing.serverCharge : 30000)
    setServerPeriod(existing.serverPeriod || '1 Year')
    setMaintenanceCharge(existing.maintenanceCharge != null ? existing.maintenanceCharge : 0)
    setMaintenancePeriod(existing.maintenancePeriod || '1 Year')
    setTotalAdditionalCharges(existing.totalAdditionalCharges || 30000)
    setSignatoryName(existing.signatoryName || 'MD. Rezaul Karim')
    setSignatoryRole(existing.signatoryRole || 'Project Manager & Team Lead')
    setSignatureUrl(existing.signatureUrl || existing.signatureDataUrl || '')
    setSignatureDataUrl(existing.signatureDataUrl || '')
    setReceiptStatus(existing.status || 'pending_approval')
    if (totVal > 0 && existing.amount) {
      setPercentHelper(((Number(existing.amount) / totVal) * 100).toFixed(1))
    }
  }

  // Load existing receipt if editing (syncs from cloud too so cross-device works seamlessly)
  useEffect(() => {
    let active = true
    async function init() {
      if (editId) {
        const localMatch = workOrderStore.getReceipt(editId)
        if (localMatch && active) {
          populateFromExisting(localMatch)
        }
        const remoteMatch = await workOrderStore.fetchReceiptById(editId)
        if (remoteMatch && active) {
          populateFromExisting(remoteMatch)
        }
      } else {
        await workOrderStore.syncFromCloud()
      }
      if (active) {
        setIsLoadedFromStorage(true)
      }
    }
    init()
    return () => {
      active = false
    }
  }, [editId])

  // Populate context from selected Work Order
  useEffect(() => {
    if (!isLoadedFromStorage) return
    if (selectedWoId) {
      const wo = workOrderStore.getWorkOrder(selectedWoId)
      if (wo) {
        setSelectedWo(wo)
        // If creating new OR switching work orders manually, sync WO defaults
        if (!isEditMode) {
          setClientName(wo.clientName)
          setClientContactPerson(wo.clientContactPerson || '')
          setClientEmail(wo.clientEmail || '')
          setClientAddress(wo.clientAddress || '')
          setProjectName(wo.projectName)
          setTotalContractValue(wo.contractValue)
          setCoreContractValue(
            wo.coreContractValue || wo.contractValue - (wo.totalAdditionalCharges || 30000),
          )
          setServerCharge(wo.serverCharge != null ? wo.serverCharge : 30000)
          setServerPeriod(wo.serverPeriod || '1 Year')
          setMaintenanceCharge(wo.maintenanceCharge != null ? wo.maintenanceCharge : 0)
          setMaintenancePeriod(wo.maintenancePeriod || '1 Year')
          setTotalAdditionalCharges(wo.totalAdditionalCharges || 30000)
        }

        // Existing payments under this work order (excluding current edited receipt)
        const existingPayments = (wo.payments || []).filter(
          (r) => !editId || (r.id !== editId && r.receiptNumber !== editId),
        )
        const prevRec = existingPayments.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
        setPreviouslyReceived(prevRec)
        const due = Math.max(0, wo.contractValue - prevRec)
        setCurrentBalanceDue(due)

        if (!isEditMode) {
          const defaultAmt = prevRec === 0 ? 90000 : due
          setAmount(String(defaultAmt))
          setPercentHelper(
            wo.contractValue > 0 ? ((defaultAmt / wo.contractValue) * 100).toFixed(1) : '',
          )
          setTransactionNote(
            `Received ${formatCurrencyBDT(defaultAmt)} via ${paymentMode.toLowerCase()} against Work Order ${wo.workOrderRef || wo.id} (${paymentHead}).`,
          )
        }
      }
    } else {
      setSelectedWo(null)
      setPreviouslyReceived(0)
      setCurrentBalanceDue(totalContractValue)
    }
  }, [selectedWoId, isLoadedFromStorage])

  useEffect(() => {
    const targetId = existingReceiptNumber || editId || 'IB-REC-PREVIEW'
    const previewUrl = `${window.location.origin}/verify/${encodeURIComponent(targetId)}`
    generateQrDataUrl(previewUrl, { width: 120, margin: 1 }).then(setPreviewQr)
  }, [editId, existingReceiptNumber])

  // Amount in words
  const amountNum = Number(amount) || 0
  const amountWords = numberToWordsBDT(amountNum)
  const balanceAfterThisPayment = Math.max(0, currentBalanceDue - amountNum)

  // Handle Amount change: auto-compute percentage
  const handleAmountChange = (val) => {
    setAmount(val)
    const num = Number(val) || 0
    if (totalContractValue > 0) {
      const computedPct = ((num / totalContractValue) * 100).toFixed(1)
      setPercentHelper(computedPct)
    }
  }

  // Handle Percentage helper change: auto-compute amount
  const handlePercentHelperChange = (pctStr) => {
    setPercentHelper(pctStr)
    const pct = Number(pctStr)
    if (!isNaN(pct) && totalContractValue > 0) {
      const computedAmt = Math.round((totalContractValue * pct) / 100)
      setAmount(String(computedAmt))
      if (selectedWoId) {
        setTransactionNote(
          `Received ${formatCurrencyBDT(computedAmt)} (${pct}% allocation) via ${paymentMode.toLowerCase()} against Work Order ${selectedWoId} for ${paymentHead}.`,
        )
      }
    }
  }

  // Apply Quick Helper Pill
  const applyQuickPill = (targetAmount, label) => {
    setAmount(String(targetAmount))
    if (totalContractValue > 0) {
      setPercentHelper(((targetAmount / totalContractValue) * 100).toFixed(1))
    }
    if (selectedWoId) {
      setTransactionNote(
        `Received ${formatCurrencyBDT(targetAmount)} (${label}) via ${paymentMode.toLowerCase()} against Work Order ${selectedWoId} for ${paymentHead}.`,
      )
    }
  }

  // Handle Signature File Upload & Optimization
  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsOptimizing(true)
    try {
      let dataUrl = ''
      let contentType = 'image/png'

      try {
        // 1. Optimize image locally in Canvas
        const optimized = await optimizeImage(file, {
          maxWidth: 600,
          maxHeight: 250,
          outputType: 'image/png',
          trimWhitespace: true,
        })
        dataUrl = optimized.dataUrl
        setSignatureStats({
          originalSize: Math.round(optimized.originalSizeBytes / 1024),
          optimizedSize: Math.round(optimized.sizeBytes / 1024),
          reduction: optimized.reductionPercent,
        })
      } catch (optErr) {
        console.warn('Canvas optimization fallback to raw file:', optErr)
        contentType = file.type || 'image/png'
        dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (ev) => resolve(ev.target.result)
          reader.onerror = () => reject(new Error('Failed to read signature file'))
          reader.readAsDataURL(file)
        })
      }

      // Set optimized preview & inline data fallback immediately
      setSignatureDataUrl(dataUrl)
      setSignatureUrl(dataUrl)

      // 2. Upload to Vercel Object Storage (Blob)
      setIsUploading(true)
      const uploadRes = await uploadToVercelBlob({
        filename: `signature-${Date.now()}.png`,
        base64Data: dataUrl,
        contentType,
      })

      if (uploadRes?.url) {
        setSignatureUrl(uploadRes.url)
      }
    } catch (err) {
      console.error('Signature optimization/upload failed:', err)
      alert(`Signature processing note: ${err.message}`)
    } finally {
      setIsOptimizing(false)
      setIsUploading(false)
    }
  }

  // Initialize and resize canvas with HiDPI support
  const initCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const dpr = window.devicePixelRatio || 1
    const targetWidth = Math.round(rect.width * dpr)
    const targetHeight = Math.round(rect.height * dpr)

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth
      canvas.height = targetHeight

      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.strokeStyle = '#0f766e'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }

  useEffect(() => {
    if (signatureMode === 'draw') {
      const raf = requestAnimationFrame(initCanvas)
      window.addEventListener('resize', initCanvas)
      return () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', initCanvas)
      }
    }
  }, [signatureMode])

  // Coordinate normalizer accurately mapping screen pointer to canvas space
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()

    let clientX = e.clientX
    let clientY = e.clientY

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    }

    const scaleX = (canvas.width / (window.devicePixelRatio || 1)) / (rect.width || 1)
    const scaleY = (canvas.height / (window.devicePixelRatio || 1)) / (rect.height || 1)

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  // Canvas Drawing Handlers with Pointer Events Support
  const startDrawing = (e) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    if (e.target.setPointerCapture && e.pointerId != null) {
      try {
        e.target.setPointerCapture(e.pointerId)
      } catch (err) {
        // ignore
      }
    }

    const { x, y } = getCanvasCoords(e)
    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const { x, y } = getCanvasCoords(e)
    const ctx = canvas.getContext('2d')
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = async (e) => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (!canvas) return

    if (e && e.target.releasePointerCapture && e.pointerId != null) {
      try {
        e.target.releasePointerCapture(e.pointerId)
      } catch (err) {
        // ignore
      }
    }

    try {
      const optimized = await optimizeImage(canvas.toDataURL('image/png'), {
        maxWidth: 600,
        maxHeight: 250,
        outputType: 'image/png',
        trimWhitespace: true,
      })
      setSignatureDataUrl(optimized.dataUrl)
      setSignatureUrl(optimized.dataUrl)

      setIsUploading(true)
      const uploadRes = await uploadToVercelBlob({
        filename: `drawn-sig-${Date.now()}.png`,
        base64Data: optimized.dataUrl,
        contentType: 'image/png',
      })
      if (uploadRes?.url) {
        setSignatureUrl(uploadRes.url)
      }
    } catch (err) {
      console.warn('Canvas optimization note:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
    setSignatureUrl('')
    setSignatureDataUrl('')
    setSignatureStats(null)
  }

  // Handle Form Submit (Create or Edit, Approve or Save Draft)
  const handleSaveReceipt = async (e, targetStatus = 'verified') => {
    if (e && e.preventDefault) e.preventDefault()
    setIsSaving(true)

    try {
      const finalSignatureUrl = signatureUrl || signatureDataUrl || null
      const finalSignatureDataUrl =
        signatureDataUrl || (signatureUrl && signatureUrl.startsWith('data:') ? signatureUrl : null)

      const savedReceipt = await workOrderStore.saveReceiptAsync({
        ...(isEditMode
          ? { id: editId, receiptNumber: existingReceiptNumber || editId }
          : existingReceiptNumber
          ? { id: existingReceiptNumber, receiptNumber: existingReceiptNumber }
          : {}),
        workOrderId: selectedWoId,
        workOrderRef: selectedWo?.workOrderRef || selectedWoId,
        clientName,
        clientContactPerson,
        clientEmail,
        clientAddress,
        projectName,
        amount: amountNum,
        amountInWords: amountWords,
        paymentHead,
        paymentCategory: paymentHead,
        paymentMode,
        paymentDate,
        receiptDate: paymentDate,
        transactionNote,
        totalContractValue,
        coreContractValue,
        serverCharge,
        serverPeriod,
        maintenanceCharge,
        maintenancePeriod,
        totalAdditionalCharges,
        balanceRemaining: balanceAfterThisPayment,
        signatoryName,
        signatoryRole,
        signatoryCompany: 'IoT-Berg Engineering',
        signatoryEmail: currentUser?.email || 'rksazid@gmail.com',
        signatureUrl: finalSignatureUrl,
        signatureDataUrl: finalSignatureDataUrl,
        sealEnabled: true,
        status: targetStatus,
      })

      if (targetStatus === 'verified') {
        navigate(`/admin/receipts?${isEditMode ? 'approved' : 'issued'}=${encodeURIComponent(savedReceipt.id)}`)
      } else {
        navigate(`/admin/receipts?saved=${encodeURIComponent(savedReceipt.id)}`)
      }
    } catch (err) {
      console.error('Failed to save receipt:', err)
      alert(`Receipt action failed: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="admin-subpage-view">
      {/* Header */}
      <div className="subpage-header glass-panel">
        <div className="subpage-copy">
          <span className="section-label">
            {isEditMode ? 'Verify, Edit & Approve Payment Receipt' : 'Payment & Receipt Issuer'}
          </span>
          <h2 className="subpage-title">
            {isEditMode
              ? `Edit & Review Receipt ${existingReceiptNumber || editId}`
              : 'Record Payment & Issue Receipt'}
          </h2>
          <p className="subpage-desc">
            {isEditMode
              ? 'Verify contract and payment details below, upload your authorized signature image, and approve the receipt.'
              : 'Record advance or milestone payments under an authorized work order with online QR verification and instant PDF generation.'}
          </p>
        </div>
        <div className="subpage-actions">
          <Link to="/admin/receipts" className="button button-secondary">
            ← Back to Receipts
          </Link>
        </div>
      </div>

      {isEditMode && (
        <div
          className="review-mode-banner glass-panel"
          style={
            receiptStatus === 'verified'
              ? {
                  background: 'linear-gradient(135deg, rgba(209, 250, 229, 0.7), rgba(167, 243, 208, 0.4))',
                  borderColor: '#6ee7b7',
                }
              : {}
          }
        >
          <div
            className="banner-icon"
            style={
              receiptStatus === 'verified'
                ? { background: '#d1fae5', borderColor: '#6ee7b7', color: '#059669' }
                : {}
            }
          >
            {receiptStatus === 'verified' ? '✓' : '⏳'}
          </div>
          <div className="banner-content" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <strong
                style={{
                  fontSize: '0.95rem',
                  color: receiptStatus === 'verified' ? '#065f46' : '#92400e',
                }}
              >
                {receiptStatus === 'verified'
                  ? `Receipt ${existingReceiptNumber || editId} is Currently Approved & Active`
                  : `Receipt ${existingReceiptNumber || editId} is in Edit & Review Mode`}
              </strong>
              <span className={receiptStatus === 'verified' ? 'status-live-chip' : 'status-pending-chip'}>
                {receiptStatus === 'verified' ? '✓ Approved & Verified' : '⏳ Pending Signature & Approval'}
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              {receiptStatus === 'verified'
                ? 'Modifying fields or replacing the signature here will immediately update the live online verification registry.'
                : 'Review all payment and client particulars, upload your signature image in Section 3 below, and click "Approve & Authorize Receipt".'}
            </p>
          </div>
        </div>
      )}

      <div className="create-receipt-layout">
        {/* Left: Input Form */}
        <form onSubmit={(e) => handleSaveReceipt(e, 'verified')} className="receipt-form-panel glass-panel">
          {/* 1. Work Order Selector */}
          <div className="form-section-block">
            <h3 className="panel-section-title">1. Link to Client Work Order</h3>

            <div className="form-group">
              <label htmlFor="wo-select">Select Work Order</label>
              <select
                id="wo-select"
                className="form-input"
                value={selectedWoId}
                onChange={(e) => setSelectedWoId(e.target.value)}
              >
                <option value="">-- Standalone Receipt (No Linked Order) --</option>
                {workOrders.map((wo) => (
                  <option key={wo.id} value={wo.id}>
                    {wo.id} — {wo.clientName} (Contract: {formatCurrencyBDT(wo.contractValue)} · Balance: {formatCurrencyBDT(wo.balanceDue)})
                  </option>
                ))}
              </select>
            </div>

            {selectedWo && (
              <div className="wo-linked-info-card glass-panel">
                <div className="wo-linked-header">
                  <div>
                    <span className="wo-tag">{selectedWo.id}</span>
                    <strong className="wo-linked-client">{selectedWo.clientName}</strong>
                  </div>
                  <span className={`status-chip-sm ${selectedWo.status}`}>{selectedWo.status}</span>
                </div>
                <p className="wo-linked-project">{selectedWo.projectName}</p>
                <div className="wo-linked-kpi-row">
                  <div className="linked-kpi">
                    <span>Total Contract:</span>
                    <strong>{formatCurrencyBDT(selectedWo.contractValue)}</strong>
                  </div>
                  <div className="linked-kpi">
                    <span>Already Received:</span>
                    <strong style={{ color: '#059669' }}>{formatCurrencyBDT(previouslyReceived)}</strong>
                  </div>
                  <div className="linked-kpi">
                    <span>Current Balance:</span>
                    <strong style={{ color: currentBalanceDue > 0 ? '#d97706' : '#059669' }}>
                      {formatCurrencyBDT(currentBalanceDue)}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            <div className="form-row-2col" style={{ marginTop: '0.75rem' }}>
              <div className="form-group">
                <label htmlFor="client-name">Payer / Client Company</label>
                <input
                  id="client-name"
                  type="text"
                  className="form-input"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="client-attn">Contact Person & Title</label>
                <input
                  id="client-attn"
                  type="text"
                  className="form-input"
                  value={clientContactPerson}
                  onChange={(e) => setClientContactPerson(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="project-title">Project Engagement Scope</label>
              <input
                id="project-title"
                type="text"
                className="form-input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* 2. Payment Head, Amount & Particulars */}
          <div className="form-section-block" style={{ marginTop: '1.25rem' }}>
            <h3 className="panel-section-title">2. Payment Particulars & Amount</h3>

            {/* Payment Head Selector with Presets */}
            <div className="form-group">
              <label htmlFor="pay-head">Payment Head (Category / Milestone)</label>
              <div className="payment-head-presets">
                {PRESET_PAYMENT_HEADS.map((head) => (
                  <button
                    key={head}
                    type="button"
                    className={`head-preset-chip ${paymentHead === head ? 'active' : ''}`}
                    onClick={() => {
                      setPaymentHead(head)
                      if (selectedWoId) {
                        setTransactionNote(
                          `Received ${formatCurrencyBDT(amountNum)} via ${paymentMode.toLowerCase()} against Work Order ${selectedWoId} for ${head}.`,
                        )
                      }
                    }}
                  >
                    {head}
                  </button>
                ))}
              </div>
              <input
                id="pay-head"
                type="text"
                className="form-input"
                placeholder="Or type custom payment head..."
                value={paymentHead}
                onChange={(e) => setPaymentHead(e.target.value)}
                required
                style={{ marginTop: '0.45rem' }}
              />
            </div>

            {/* Quick Amount Calculator Helpers */}
            {totalContractValue > 0 && (
              <div className="quick-amount-helper-box">
                <span className="helper-label">Quick Calculator Helpers:</span>
                <div className="quick-helper-pills">
                  <button
                    type="button"
                    className="quick-pill-btn"
                    onClick={() => applyQuickPill(Math.round(totalContractValue * 0.1), '10% Advance')}
                  >
                    10% ({formatCurrencyBDT(Math.round(totalContractValue * 0.1))})
                  </button>
                  <button
                    type="button"
                    className="quick-pill-btn"
                    onClick={() => applyQuickPill(Math.round(totalContractValue * 0.2), '20% Advance')}
                  >
                    20% ({formatCurrencyBDT(Math.round(totalContractValue * 0.2))})
                  </button>
                  <button
                    type="button"
                    className="quick-pill-btn"
                    onClick={() => applyQuickPill(Math.round(totalContractValue * 0.25), '25% Advance')}
                  >
                    25% ({formatCurrencyBDT(Math.round(totalContractValue * 0.25))})
                  </button>
                  <button
                    type="button"
                    className="quick-pill-btn"
                    onClick={() => applyQuickPill(Math.round(totalContractValue * 0.5), '50% Milestone')}
                  >
                    50% ({formatCurrencyBDT(Math.round(totalContractValue * 0.5))})
                  </button>
                  {currentBalanceDue > 0 && (
                    <button
                      type="button"
                      className="quick-pill-btn balance-fill"
                      onClick={() => applyQuickPill(currentBalanceDue, 'Full Remaining Balance')}
                    >
                      Remaining Balance ({formatCurrencyBDT(currentBalanceDue)})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Received Amount Input + Optional Percentage Helper */}
            <div className="form-row-2col" style={{ marginTop: '0.5rem' }}>
              <div className="form-group">
                <label htmlFor="pay-amount">Payment Amount (BDT)</label>
                <input
                  id="pay-amount"
                  type="number"
                  className="form-input font-mono"
                  style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0d9488' }}
                  placeholder="e.g. 90000"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  required
                />
                <span className="input-hint">Enter exact BDT amount. Does not need to be a rounded percentage.</span>
              </div>

              <div className="form-group">
                <label htmlFor="pct-helper">Percentage Helper (% of Contract)</label>
                <div className="input-suffix-wrap">
                  <input
                    id="pct-helper"
                    type="number"
                    step="0.1"
                    className="form-input font-mono"
                    placeholder="e.g. 20"
                    value={percentHelper}
                    onChange={(e) => handlePercentHelperChange(e.target.value)}
                  />
                  <span className="input-suffix">%</span>
                </div>
                <span className="input-hint">
                  {totalContractValue > 0 && amountNum > 0
                    ? `৳ ${amountNum.toLocaleString()} equals ${((amountNum / totalContractValue) * 100).toFixed(1)}% of ৳ ${totalContractValue.toLocaleString()}`
                    : 'Optional percentage converter'}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Amount in Words (Auto-generated)</label>
              <div className="form-readonly-val font-italic">{amountWords}</div>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label htmlFor="pay-mode">Payment Mode</label>
                <select
                  id="pay-mode"
                  className="form-input"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="Cash">Cash Handover</option>
                  <option value="Bank Wire">Bank Wire / Transfer</option>
                  <option value="Account Payee Cheque">Account Payee Cheque</option>
                  <option value="bKash / MFS">bKash / Nagad / MFS</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="pay-date">Payment Date</label>
                <input
                  id="pay-date"
                  type="date"
                  className="form-input"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tx-note">Payment Description & Particulars</label>
              <textarea
                id="tx-note"
                className="form-input textarea"
                rows="2"
                placeholder="Describe milestone particulars, cheque number, or transaction memo..."
                value={transactionNote}
                onChange={(e) => setTransactionNote(e.target.value)}
              />
            </div>

            {/* Real-time Post-Payment Balance Strip */}
            <div className="post-payment-balance-strip">
              <div className="balance-calc-item">
                <span className="lbl">Contract:</span>
                <strong>{formatCurrencyBDT(totalContractValue)}</strong>
              </div>
              <div className="balance-calc-item">
                <span className="lbl">Previously Paid:</span>
                <strong>{formatCurrencyBDT(previouslyReceived)}</strong>
              </div>
              <div className="balance-calc-item this-pay">
                <span className="lbl">This Payment:</span>
                <strong style={{ color: '#0d9488' }}>+{formatCurrencyBDT(amountNum)}</strong>
              </div>
              <div className="balance-calc-item remaining">
                <span className="lbl">Remaining Balance:</span>
                <strong style={{ color: balanceAfterThisPayment > 0 ? '#d97706' : '#059669' }}>
                  {formatCurrencyBDT(balanceAfterThisPayment)}
                </strong>
              </div>
            </div>
          </div>

          {/* 3. Signatory & Official Seal */}
          <div className="form-section-block" style={{ marginTop: '1.25rem' }}>
            <h3 className="panel-section-title">3. Signatory & Official Seal</h3>

            <div className="form-row-2col">
              <div className="form-group">
                <label htmlFor="sign-name">Authorized Signatory Name</label>
                <input
                  id="sign-name"
                  type="text"
                  className="form-input"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="sign-role">Designation / Title</label>
                <input
                  id="sign-role"
                  type="text"
                  className="form-input"
                  value={signatoryRole}
                  onChange={(e) => setSignatoryRole(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Signature Mode Selector */}
            <div className="signature-control-box">
              <div className="signature-tabs-row">
                <button
                  type="button"
                  className={`sig-tab-btn ${signatureMode === 'upload' ? 'active' : ''}`}
                  onClick={() => setSignatureMode('upload')}
                >
                  Upload Image File
                </button>
                <button
                  type="button"
                  className={`sig-tab-btn ${signatureMode === 'draw' ? 'active' : ''}`}
                  onClick={() => setSignatureMode('draw')}
                >
                  Draw on Canvas
                </button>
                <button
                  type="button"
                  className={`sig-tab-btn ${signatureMode === 'seal' ? 'active' : ''}`}
                  onClick={() => setSignatureMode('seal')}
                >
                  Cryptographic Text Seal
                </button>
              </div>

              {signatureMode === 'upload' && (
                <div className="signature-upload-zone">
                  <input
                    type="file"
                    id="sig-upload-input"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleSignatureUpload}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="sig-upload-input" className="sig-upload-dropzone">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>
                      {isOptimizing
                        ? 'Optimizing image with Canvas downscaler...'
                        : isUploading
                        ? 'Uploading to Vercel Object Storage...'
                        : signatureUrl
                        ? 'Upload / Replace Authorized Signature Image'
                        : 'Click to Upload Signature Image (PNG, JPG, WebP — Auto-optimized)'}
                    </span>
                  </label>

                  {!signatureUrl && (
                    <div className="sig-missing-warning">
                      <span>⚠️ No signature image uploaded yet. Upload your signature image above or draw below before approving.</span>
                    </div>
                  )}
                </div>
              )}

              {signatureMode === 'draw' && (
                <div className="signature-draw-zone">
                  <canvas
                    ref={canvasRef}
                    className="signature-canvas"
                    style={{ touchAction: 'none' }}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerCancel={stopDrawing}
                  />
                  <div className="draw-actions">
                    <button type="button" className="button button-sm button-secondary" onClick={clearCanvas}>
                      Clear Signature
                    </button>
                    <span className="draw-hint">Sign above with your mouse or stylus</span>
                  </div>
                </div>
              )}

              {signatureMode === 'seal' && (
                <div className="signature-seal-zone">
                  <div className="seal-preview-box">
                    <strong>{signatoryName}</strong>
                    <span>Digitally Authorized & Registered · IoT-Berg Engineering</span>
                    <code>SHA-256 Verified Seal Active</code>
                  </div>
                </div>
              )}

              {/* Signature Preview & Optimization Metrics */}
              {(signatureUrl || signatureDataUrl) && signatureMode !== 'seal' && (
                <div className="sig-attached-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <img
                      src={signatureUrl || signatureDataUrl}
                      alt="Active Signature"
                      className="sig-attached-preview"
                      onError={(e) => {
                        if (signatureDataUrl && e.currentTarget.src !== signatureDataUrl) {
                          e.currentTarget.src = signatureDataUrl
                        }
                      }}
                    />
                    <div>
                      <span className="stat-pill-sm green" style={{ display: 'inline-block', marginBottom: '0.2rem' }}>
                        ✓ Signature Attached
                      </span>
                      {signatureStats && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          Optimized: {signatureStats.optimizedSize} KB (Saved {signatureStats.reduction}%)
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="sig-remove-btn"
                    title="Remove uploaded signature"
                    onClick={() => {
                      setSignatureUrl('')
                      setSignatureDataUrl('')
                      setSignatureStats(null)
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-submit-row" style={{ marginTop: '1.5rem' }}>
            <div className="edit-submit-buttons-row">
              <button
                type="submit"
                className="button button-approve"
                disabled={isSaving || isOptimizing || isUploading}
                style={{ flex: 1, padding: '0.85rem 1.25rem', fontSize: '0.92rem' }}
              >
                {isOptimizing || isUploading ? (
                  <>
                    <span className="spinner-inline" />
                    <span>{isOptimizing ? 'Optimizing Signature...' : 'Uploading Signature...'}</span>
                  </>
                ) : isSaving ? (
                  <>
                    <span className="spinner-inline" />
                    <span>{isEditMode ? 'Approving Receipt...' : 'Issuing Payment Receipt...'}</span>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>
                      {isEditMode
                        ? `Approve & Authorize Receipt (${formatCurrencyBDT(amountNum)})`
                        : `Approve & Issue Receipt (${formatCurrencyBDT(amountNum)})`}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="button button-secondary"
                disabled={isSaving || isOptimizing || isUploading}
                onClick={(e) => handleSaveReceipt(e, 'pending_approval')}
                style={{ padding: '0.85rem 1.15rem', fontSize: '0.86rem' }}
              >
                <span>💾 Save Draft / Keep in Edit Mode</span>
              </button>
            </div>
          </div>
        </form>

        {/* Right: Live Interactive Receipt Card Preview */}
        <aside className="receipt-live-preview-panel glass-panel">
          <div className="preview-top-bar">
            <span className="preview-tag">Live Layout Preview</span>
            <span className={receiptStatus === 'verified' ? 'status-live-chip' : 'status-pending-chip'}>
              {receiptStatus === 'verified' ? '✓ Verified Voucher' : '⏳ Pending Approval'}
            </span>
          </div>

          <div className="mini-receipt-card">
            <div className="mini-brand-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <img
                  src="/icons/app-icon.png"
                  alt="IoT-Berg Logo"
                  width="32"
                  height="32"
                  style={{ borderRadius: '8px', border: '1px solid var(--stroke)', flexShrink: 0 }}
                />
                <div>
                  <strong className="mini-brand-name">IoT-Berg</strong>
                  <span className="mini-brand-sub" style={{ display: 'block' }}>
                    Official Money Receipt · {existingReceiptNumber || editId || 'Draft'}
                  </span>
                </div>
              </div>
              <div className="mini-qr-box">
                {previewQr && <img src={previewQr} alt="QR" className="mini-qr-img" />}
              </div>
            </div>

            <div className="mini-amount-box">
              <span className="mini-lbl">{paymentHead}</span>
              <div className="mini-val">{formatCurrencyBDT(amountNum)}</div>
              <div className="mini-words">{amountWords}</div>
            </div>

            <div className="mini-info-strip">
              <div className="mini-info-line">
                <span>Payer:</span>
                <strong>{clientName || 'Client Company'}</strong>
              </div>
              <div className="mini-info-line">
                <span>Order Ref:</span>
                <code style={{ color: 'var(--brand-strong)', fontWeight: 700 }}>
                  {selectedWo?.workOrderRef || selectedWoId || 'Standalone'}
                </code>
              </div>
              <div className="mini-info-line">
                <span>Project:</span>
                <strong>{projectName || 'Engineering Services'}</strong>
              </div>
              <div className="mini-info-line">
                <span>Payment Mode:</span>
                <strong>{paymentMode}</strong>
              </div>
              <div className="mini-info-line">
                <span>Remaining Due:</span>
                <strong style={{ color: balanceAfterThisPayment > 0 ? '#d97706' : '#059669' }}>
                  {formatCurrencyBDT(balanceAfterThisPayment)}
                </strong>
              </div>
            </div>

            <div className="mini-sign-block">
              {signatureUrl || signatureDataUrl ? (
                <img
                  src={signatureUrl || signatureDataUrl}
                  alt="Signature"
                  className="mini-sign-img"
                  onError={(e) => {
                    if (signatureDataUrl && e.currentTarget.src !== signatureDataUrl) {
                      e.currentTarget.src = signatureDataUrl
                    }
                  }}
                />
              ) : receiptStatus === 'pending_approval' ? (
                <div className="mini-sign-text" style={{ color: '#d97706' }}>
                  ⏳ Pending Signature Upload
                </div>
              ) : (
                <div className="mini-sign-text">{signatoryName} (Signed)</div>
              )}
              <div className="mini-sign-name">{signatoryName}</div>
              <div className="mini-sign-role">{signatoryRole}</div>
            </div>
          </div>

          <div className="preview-tip-box">
            <p>
              💡 This payment will be logged under <strong>{selectedWoId || 'Client Account'}</strong>. The money receipt receives an authentic SHA-256 seal, QR verification page, and instant PDF download powered by <code>pdf-lagbe</code>.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
