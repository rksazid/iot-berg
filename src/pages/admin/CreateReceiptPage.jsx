import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { workOrderStore } from '../../lib/workOrderStore'
import { numberToWordsBDT, formatCurrencyBDT } from '../../lib/numberToWords'
import { optimizeImage } from '../../lib/imageOptimizer'
import { uploadToVercelBlob } from '../../lib/blobStorage'
import { generateQrDataUrl } from '../../lib/qrCode'
import { useAuth } from '../../context/AuthContext'

export function CreateReceiptPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentUser } = useAuth()

  const workOrders = workOrderStore.getWorkOrders()
  const preselectedWoId = searchParams.get('workOrderId') || (workOrders[0]?.id || '')

  const [selectedWoId, setSelectedWoId] = useState(preselectedWoId)
  const [amount, setAmount] = useState('90000')
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [paymentCategory, setPaymentCategory] = useState('20% Advance Payment on Work Order')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [transactionNote, setTransactionNote] = useState(
    'Received 90,000 BDT in cash as authorized 20% advance payment against Work Order.',
  )

  const [clientName, setClientName] = useState('')
  const [clientContactPerson, setClientContactPerson] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [projectName, setProjectName] = useState('')
  const [totalContractValue, setTotalContractValue] = useState(450000)
  const [coreContractValue, setCoreContractValue] = useState(350000)
  const [serverCharge, setServerCharge] = useState(60000)
  const [serverPeriod, setServerPeriod] = useState('1 Year')
  const [maintenanceCharge, setMaintenanceCharge] = useState(40000)
  const [maintenancePeriod, setMaintenancePeriod] = useState('1 Year')
  const [totalAdditionalCharges, setTotalAdditionalCharges] = useState(100000)
  const [advancePercent, setAdvancePercent] = useState(20)

  // Signatory
  const [signatoryName, setSignatoryName] = useState('MD. Rezaul Karim')
  const [signatoryRole, setSignatoryRole] = useState('Project Manager & Team Lead')
  const [signatureUrl, setSignatureUrl] = useState('')
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

  // Populate from selected Work Order
  useEffect(() => {
    if (selectedWoId) {
      const wo = workOrderStore.getWorkOrder(selectedWoId)
      if (wo) {
        setClientName(wo.clientName)
        setClientContactPerson(wo.clientContactPerson || '')
        setClientEmail(wo.clientEmail || '')
        setClientAddress(wo.clientAddress || '')
        setProjectName(wo.projectName)
        setTotalContractValue(wo.contractValue)
        setCoreContractValue(wo.coreContractValue || (wo.contractValue - (wo.totalAdditionalCharges || 100000)))
        setServerCharge(wo.serverCharge != null ? wo.serverCharge : 60000)
        setServerPeriod(wo.serverPeriod || '1 Year')
        setMaintenanceCharge(wo.maintenanceCharge != null ? wo.maintenanceCharge : 40000)
        setMaintenancePeriod(wo.maintenancePeriod || '1 Year')
        setTotalAdditionalCharges(wo.totalAdditionalCharges || 100000)
        setAdvancePercent(wo.advancePercentage || 20)
        setAmount(String(wo.advanceAmount || Math.round((wo.contractValue * 20) / 100)))
        setTransactionNote(
          `Received ${formatCurrencyBDT(wo.advanceAmount || Math.round((wo.contractValue * 20) / 100))} in ${paymentMode.toLowerCase()} as authorized ${wo.advancePercentage}% advance payment against Work Order ${wo.id}.`,
        )
      }
    }
  }, [selectedWoId])

  useEffect(() => {
    const previewUrl = `${window.location.origin}/verify/IB-REC-PREVIEW`
    generateQrDataUrl(previewUrl, { width: 120, margin: 1 }).then(setPreviewQr)
  }, [])

  // Amount in words
  const amountNum = Number(amount) || 0
  const amountWords = numberToWordsBDT(amountNum)
  const balanceRemaining = Math.max(0, totalContractValue - amountNum)

  // Handle Signature File Upload & Optimization
  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsOptimizing(true)
    try {
      // 1. Optimize image locally in Canvas
      const optimized = await optimizeImage(file, {
        maxWidth: 600,
        maxHeight: 250,
        outputType: 'image/png',
        trimWhitespace: true,
      })

      setSignatureStats({
        originalSize: Math.round(optimized.originalSizeBytes / 1024),
        optimizedSize: Math.round(optimized.sizeBytes / 1024),
        reduction: optimized.reductionPercent,
      })

      // Set optimized preview immediately
      setSignatureUrl(optimized.dataUrl)

      // 2. Upload to Vercel Object Storage (Blob)
      setIsUploading(true)
      const uploadRes = await uploadToVercelBlob({
        filename: `signature-${Date.now()}.png`,
        base64Data: optimized.dataUrl,
        contentType: 'image/png',
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

  // Canvas Drawing Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.strokeStyle = '#0f766e'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = async () => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const optimized = await optimizeImage(canvas.toDataURL('image/png'), {
        maxWidth: 600,
        maxHeight: 250,
        outputType: 'image/png',
        trimWhitespace: true,
      })
      setSignatureUrl(optimized.dataUrl)
    } catch (err) {
      console.warn('Canvas optimization note:', err)
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureUrl('')
  }

  // Handle Form Submit
  const handleCreateReceipt = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const newReceipt = workOrderStore.saveReceipt({
        workOrderId: selectedWoId,
        clientName,
        clientContactPerson,
        clientEmail,
        clientAddress,
        projectName,
        amount: amountNum,
        amountInWords: amountWords,
        paymentCategory,
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
        advancePercent,
        balanceRemaining,
        signatoryName,
        signatoryRole,
        signatoryCompany: 'IoT-Berg Engineering',
        signatoryEmail: currentUser?.email || 'rksazid@gmail.com',
        signatureUrl: signatureUrl || null,
        sealEnabled: true,
        status: 'verified',
      })

      navigate(`/admin/receipts?issued=${encodeURIComponent(newReceipt.id)}`)
    } catch (err) {
      console.error('Failed to issue receipt:', err)
      alert(`Receipt issuance failed: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="admin-subpage-view">
      {/* Header */}
      <div className="subpage-header glass-panel">
        <div className="subpage-copy">
          <span className="section-label">Receipt Generator</span>
          <h2 className="subpage-title">Issue Payment Receipt</h2>
          <p className="subpage-desc">
            Create an authenticated receipt with online QR verification, authorized signature, and PDF export.
          </p>
        </div>
      </div>

      <div className="create-receipt-layout">
        {/* Left: Input Form */}
        <form onSubmit={handleCreateReceipt} className="receipt-form-panel glass-panel">
          <h3 className="panel-section-title">1. Client & Project Details</h3>

          <div className="form-group">
            <label htmlFor="wo-select">Link to Work Order</label>
            <select
              id="wo-select"
              className="form-input"
              value={selectedWoId}
              onChange={(e) => setSelectedWoId(e.target.value)}
            >
              <option value="">-- Standalone Receipt (No Linked Order) --</option>
              {workOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>
                  {wo.id} — {wo.clientName} ({formatCurrencyBDT(wo.contractValue)})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label htmlFor="client-name">Payer Company Name</label>
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
              <label htmlFor="client-attn">Contact Person</label>
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
            <label htmlFor="project-title">Project / Engagement Scope</label>
            <input
              id="project-title"
              type="text"
              className="form-input"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>

          <h3 className="panel-section-title" style={{ marginTop: '1.5rem' }}>
            2. Payment Details
          </h3>

          <div className="form-row-3col">
            <div className="form-group">
              <label htmlFor="pay-amount">Received Amount (BDT)</label>
              <input
                id="pay-amount"
                type="number"
                className="form-input font-mono"
                style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0d9488' }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

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
            <label>Amount in Words (Auto-generated)</label>
            <div className="form-readonly-val font-italic">{amountWords}</div>
          </div>

          <div className="form-group">
            <label htmlFor="pay-category">Payment Category / Milestone</label>
            <input
              id="pay-category"
              type="text"
              className="form-input"
              value={paymentCategory}
              onChange={(e) => setPaymentCategory(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tx-note">Voucher Transaction Memo</label>
            <textarea
              id="tx-note"
              className="form-input textarea"
              rows="2"
              value={transactionNote}
              onChange={(e) => setTransactionNote(e.target.value)}
            />
          </div>

          <h3 className="panel-section-title" style={{ marginTop: '1.5rem' }}>
            3. Signatory & Official Seal
          </h3>

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
                      : 'Choose signature image (auto-optimized & compressed < 35KB)'}
                  </span>
                </label>
              </div>
            )}

            {signatureMode === 'draw' && (
              <div className="signature-draw-zone">
                <canvas
                  ref={canvasRef}
                  width="360"
                  height="120"
                  className="signature-canvas"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
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
                  <strong>MD. Rezaul Karim</strong>
                  <span>Digitally Authorized & Registered · IoT-Berg Engineering</span>
                  <code>SHA-256 Verified Seal Active</code>
                </div>
              </div>
            )}

            {/* Signature Preview & Optimization Metrics */}
            {signatureUrl && signatureMode !== 'seal' && (
              <div className="signature-preview-strip">
                <div className="sig-img-wrap">
                  <img src={signatureUrl} alt="Active Signature" className="sig-preview-thumb" />
                </div>
                {signatureStats && (
                  <div className="sig-stats-text">
                    <span className="stat-pill-sm green">Optimized: {signatureStats.optimizedSize} KB</span>
                    <span className="stat-pill-sm">Saved {signatureStats.reduction}%</span>
                  </div>
                )}
                <button
                  type="button"
                  className="sig-remove-btn"
                  onClick={() => {
                    setSignatureUrl('')
                    setSignatureStats(null)
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="form-submit-row">
            <button type="submit" className="button button-primary button-full" disabled={isSaving}>
              {isSaving ? (
                <>
                  <span className="spinner-inline" />
                  <span>Issuing Receipt...</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Authorize & Issue Receipt</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right: Live Interactive Receipt Card Preview */}
        <aside className="receipt-live-preview-panel glass-panel">
          <div className="preview-top-bar">
            <span className="preview-tag">Live Layout Preview</span>
            <span className="preview-status-pill">✓ Verified</span>
          </div>

          <div className="mini-receipt-card">
            <div className="mini-brand-row">
              <div>
                <strong className="mini-brand-name">IoT-Berg</strong>
                <span className="mini-brand-sub">Official Money Receipt</span>
              </div>
              <div className="mini-qr-box">
                {previewQr && <img src={previewQr} alt="QR" className="mini-qr-img" />}
              </div>
            </div>

            <div className="mini-amount-box">
              <span className="mini-lbl">Payment Received</span>
              <div className="mini-val">{formatCurrencyBDT(amountNum)}</div>
              <div className="mini-words">{amountWords}</div>
            </div>

            <div className="mini-info-strip">
              <div className="mini-info-line">
                <span>Payer:</span>
                <strong>{clientName || 'Client Company'}</strong>
              </div>
              <div className="mini-info-line">
                <span>Project:</span>
                <strong>{projectName || 'Engineering Services'}</strong>
              </div>
              <div className="mini-info-line">
                <span>Category:</span>
                <strong>{paymentCategory}</strong>
              </div>
              <div className="mini-info-line">
                <span>Mode:</span>
                <strong>{paymentMode}</strong>
              </div>
              <div className="mini-info-line">
                <span>Balance Due:</span>
                <strong style={{ color: '#ef4444' }}>{formatCurrencyBDT(balanceRemaining)}</strong>
              </div>
            </div>

            <div className="mini-sign-block">
              {signatureUrl ? (
                <img src={signatureUrl} alt="Signature" className="mini-sign-img" />
              ) : (
                <div className="mini-sign-text">MD. Rezaul Karim (Signed)</div>
              )}
              <div className="mini-sign-name">{signatoryName}</div>
              <div className="mini-sign-role">{signatoryRole}</div>
            </div>
          </div>

          <div className="preview-tip-box">
            <p>
              💡 Upon submission, this receipt is registered on the online verification registry with a unique QR code and made ready for instant PDF compilation via <code>pdf-lagbe</code>.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

