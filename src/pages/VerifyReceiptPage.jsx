import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { workOrderStore } from '../lib/workOrderStore'
import { formatCurrencyBDT } from '../lib/numberToWords'
import { generateQrDataUrl } from '../lib/qrCode'
import { compileReceiptHtml } from '../lib/receiptPdfCompiler'
import { generatePdf } from '../lib/pdfClient'

export function VerifyReceiptPage() {
  const { receiptId } = useParams()
  const navigate = useNavigate()
  const [lookupInput, setLookupInput] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(receiptId))
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfError, setPdfError] = useState(null)

  useEffect(() => {
    let active = true
    async function load() {
      if (!receiptId) {
        setReceipt(null)
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      // Show cached version immediately if present, then sync dynamically from cloud registry
      const cached = workOrderStore.getReceipt(receiptId)
      if (cached && active) {
        setReceipt(cached)
        generateQrDataUrl(window.location.href, { width: 140, margin: 1 }).then((qr) => {
          if (active) setQrCodeUrl(qr)
        })
      }

      const fresh = await workOrderStore.fetchReceiptById(receiptId)
      if (active) {
        setReceipt(fresh)
        if (fresh) {
          generateQrDataUrl(window.location.href, { width: 140, margin: 1 }).then((qr) => {
            if (active) setQrCodeUrl(qr)
          })
        }
        setIsLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [receiptId])

  const handleLookupSubmit = (e) => {
    e.preventDefault()
    const clean = lookupInput.trim()
    if (!clean) return
    navigate(`/verify/${encodeURIComponent(clean)}`)
  }

  const handleDownloadPdf = async () => {
    if (!receipt) return
    setIsGeneratingPdf(true)
    setPdfError(null)

    try {
      const htmlPayload = await compileReceiptHtml(receipt, window.location.origin)
      const result = await generatePdf({
        endpointMode: 'auto',
        apiPath: 'html-to-pdf',
        payload: {
          html: htmlPayload,
          format: 'A4',
          printBackground: true,
          margin: { top: '8mm', right: '10mm', bottom: '8mm', left: '10mm' },
        },
      })

      // Trigger download
      const url = URL.createObjectURL(result.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Receipt-${receipt.receiptNumber || receipt.id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation failed:', err)
      setPdfError(err.message || 'Failed to download PDF receipt from engine.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Dynamic Receipt Verification Lookup Portal (/verify without an ID)
  if (!receiptId) {
    return (
      <div className="page verify-page">
        <div className="verify-container glass-panel" style={{ maxWidth: '580px', margin: '2rem auto', padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.1rem', padding: '0.45rem 0.9rem', background: 'var(--surface-2)', border: '1px solid var(--stroke)', borderRadius: '12px' }}>
            <img
              src="/icons/app-icon.png"
              alt="IoT-Berg Logo"
              width="32"
              height="32"
              style={{ borderRadius: '8px' }}
            />
            <div style={{ textAlign: 'left' }}>
              <strong style={{ display: 'block', fontSize: '0.95rem', letterSpacing: '0.02em', color: 'var(--text)' }}>IoT-BERG</strong>
              <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Engineering Registry</span>
            </div>
          </div>
          <span className="verify-kicker" style={{ display: 'block' }}>IoT-Berg Online Verification Registry</span>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, margin: '0.35rem 0 0.65rem' }}>
            Verify Official Money Receipt
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
            Enter your Receipt Number from a digital or printed IoT-Berg voucher, or scan the receipt QR code directly with your phone camera.
          </p>

          <form onSubmit={handleLookupSubmit} style={{ display: 'flex', gap: '0.6rem', maxWidth: '460px', margin: '0 auto 1.25rem' }}>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="e.g. IB-REC-2611-7C4N"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              style={{ flex: 1 }}
              required
            />
            <button type="submit" className="button button-primary">
              Verify Receipt
            </button>
          </form>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
            <Link to="/" className="button button-secondary button-sm">
              ← Back Home
            </Link>
            <Link to="/admin/receipts" className="button button-secondary button-sm">
              Admin Receipts Portal
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading && !receipt) {
    return (
      <div className="page verify-page">
        <div className="verify-container glass-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <span className="spinner-inline" style={{ width: '28px', height: '28px', margin: '0 auto 1rem', display: 'block' }} />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Verifying Receipt in Cloud Registry...</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Looking up <code style={{ color: 'var(--brand-strong)' }}>{receiptId}</code>
          </p>
        </div>
      </div>
    )
  }

  if (!receipt) {
    return (
      <div className="page verify-page">
        <div className="verify-container glass-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div className="verify-badge-missing">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>Receipt Not Found</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            No payment receipt matches verification identifier <code style={{ color: 'var(--brand-strong)' }}>{receiptId}</code> in the IoT-Berg registry.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/verify" className="button button-secondary">
              Search Another Receipt
            </Link>
            <Link to="/" className="button button-primary">
              Back to IoT-Berg Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isPending = receipt.status === 'pending_approval'

  return (
    <div className="page verify-page">
      <div className="verify-shell">
        {/* Verification Header Card */}
        <section
          className="verify-banner-panel glass-panel"
          style={isPending ? { borderColor: '#fcd34d' } : undefined}
        >
          <div className="verify-status-badge-row">
            <div
              className="verified-shield-icon"
              style={
                isPending
                  ? { background: '#fef3c7', borderColor: '#fde68a', color: '#d97706' }
                  : undefined
              }
            >
              {isPending ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              )}
            </div>
            <div className="verify-status-copy">
              <span className="verify-kicker">IoT-Berg Cloud Registry</span>
              <h1 className="verify-heading" style={isPending ? { color: '#b45309' } : undefined}>
                {isPending ? 'Receipt Under Review / Pending Signature Approval' : 'Payment Receipt Verified'}
              </h1>
            </div>
          </div>
          <p className="verify-desc">
            {isPending
              ? 'This payment voucher is currently in edit & review mode and awaiting final authorized signature approval.'
              : 'Authentic payment record verified against the IoT-Berg cloud security registry.'}
          </p>
          <div className="verify-meta-strip">
            <span className="meta-tag">
              <strong>Receipt No:</strong> <code>{receipt.receiptNumber || receipt.id}</code>
            </span>
            <span className="meta-tag">
              <strong>Status:</strong>{' '}
              {isPending ? (
                <span style={{ color: '#d97706', fontWeight: 700 }}>⏳ Pending Signature & Approval</span>
              ) : (
                <span className="status-live-txt">✓ Active & Authorized</span>
              )}
            </span>
            <span className="meta-tag">
              <strong>Registry Date:</strong> {receipt.receiptDate || receipt.paymentDate}
            </span>
          </div>
          {isPending && (
            <div style={{ marginTop: '0.85rem' }}>
              <Link
                to={`/admin/receipts/${encodeURIComponent(receipt.id)}/edit`}
                className="button button-sm button-approve"
              >
                ✏️ Open in Admin Edit & Approval Portal →
              </Link>
            </div>
          )}
        </section>

        {/* Receipt Content Card */}
        <div className="verify-main-grid">
          <section className="receipt-view-card glass-panel">
            {/* Issuing Company Brand Strip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                paddingBottom: '1rem',
                marginBottom: '1rem',
                borderBottom: '2px solid #0f766e',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img
                  src="/icons/app-icon.png"
                  alt="IoT-Berg Logo"
                  width="44"
                  height="44"
                  style={{ borderRadius: '10px', border: '1px solid var(--stroke)', flexShrink: 0 }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '1.25rem', fontWeight: 800, color: '#0f766e', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    IoT-BERG
                  </strong>
                  <span style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>
                    {receipt.signatoryCompany || 'IoT-Berg Engineering'} · Web · Cloud · APIs
                  </span>
                </div>
              </div>

              <div className="receipt-number-box">
                <span className="receipt-num-label">Official Payment Receipt</span>
                <span className="receipt-num-val">{receipt.receiptNumber || receipt.id}</span>
              </div>
            </div>

            {/* Top Row: Client Context */}
            <div className="receipt-view-header" style={{ paddingTop: 0, borderBottom: 'none', marginBottom: '0.75rem' }}>
              <div className="receipt-header-left">
                <span className="receipt-sublabel">Received From (Client)</span>
                <h2 className="receipt-client-title">{receipt.clientName}</h2>
                {receipt.clientContactPerson && (
                  <p className="receipt-client-contact">Attn: {receipt.clientContactPerson}</p>
                )}
                {receipt.clientEmail && (
                  <p className="receipt-client-contact">{receipt.clientEmail}</p>
                )}
              </div>
            </div>

            {/* Amount Banner */}
            <div className="receipt-amount-display">
              <div className="amount-headline-col">
                <span className="amount-label">Amount Received</span>
                <span className="amount-value">{formatCurrencyBDT(receipt.amount)}</span>
                <span className="amount-words-line">In Words: {receipt.amountInWords}</span>
              </div>
              <div className="payment-mode-box">
                <span className="payment-mode-badge">{receipt.paymentMode} Payment</span>
                <span className="payment-adv-note">{receipt.paymentHead || receipt.paymentCategory || 'Verified Payment'}</span>
              </div>
            </div>

            {/* Context Matrix */}
            <div className="receipt-spec-grid">
              <div className="spec-tile">
                <span className="tile-lbl">Work Order Reference</span>
                <code className="tile-val-mono">{receipt.workOrderRef || receipt.workOrderId || 'Contract Attached'}</code>
              </div>
              <div className="spec-tile">
                <span className="tile-lbl">Payment Purpose</span>
                <span className="tile-val">{receipt.paymentCategory}</span>
              </div>
              <div className="spec-tile">
                <span className="tile-lbl">Total Work Order Value</span>
                <span className="tile-val">
                  {receipt.totalContractValue ? formatCurrencyBDT(receipt.totalContractValue) : '—'}
                </span>
              </div>
              <div className="spec-tile">
                <span className="tile-lbl">Balance Remaining</span>
                <span className="tile-val" style={{ color: '#ef4444' }}>
                  {receipt.balanceRemaining != null ? formatCurrencyBDT(receipt.balanceRemaining) : '—'}
                </span>
              </div>
            </div>

            {/* Operational Add-ons & Financial Separation */}
            {(receipt.totalAdditionalCharges > 0 || receipt.serverCharge > 0 || receipt.maintenanceCharge > 0) && (
              <div className="receipt-addons-callout glass-panel">
                <div className="addons-callout-header">
                  <span className="addons-callout-badge">Additional Operational Services</span>
                  <span className="addons-callout-total">
                    Add-ons: {formatCurrencyBDT(receipt.totalAdditionalCharges ?? 0)}
                  </span>
                </div>
                <div className="addons-callout-grid">
                  <div className="addons-callout-tile">
                    <span className="tile-subtitle">Core Software Deliverables</span>
                    <strong className="tile-amount">
                      {formatCurrencyBDT(receipt.coreContractValue ?? (receipt.totalContractValue - (receipt.totalAdditionalCharges ?? 0)))}
                    </strong>
                    <span className="tile-detail">Base engineering & architecture</span>
                  </div>
                  <div className="addons-callout-tile">
                    <span className="tile-subtitle">Server Management (1 Year)</span>
                    <strong className="tile-amount" style={{ color: '#4f46e5' }}>
                      {formatCurrencyBDT(receipt.serverCharge ?? 0)}
                    </strong>
                    <span className="tile-detail">Managed cloud & object storage</span>
                  </div>
                  <div className="addons-callout-tile">
                    <span className="tile-subtitle">Software Maintenance (1 Year)</span>
                    <strong className="tile-amount" style={{ color: '#4f46e5' }}>
                      {formatCurrencyBDT(receipt.maintenanceCharge ?? 0)}
                    </strong>
                    <span className="tile-detail">
                      {(receipt.maintenanceCharge ?? 0) === 0 ? 'Bundled in yearly SLA fee' : 'Security patches & uptime SLA'}
                    </span>
                  </div>
                </div>
                <p className="addons-callout-disclaimer">
                  * Notice: Server management and software maintenance charges are additional operational allocations, billed separately from the core software engineering deliverables.
                </p>
              </div>
            )}

            {/* Project Scope Description */}
            <div className="receipt-desc-box">
              <span className="desc-box-label">Project / Work Order Scope</span>
              <p className="desc-box-text">
                {receipt.projectName} — {receipt.transactionNote}
              </p>
            </div>

            {/* Authorized Signatory Block */}
            <div className="receipt-auth-row">
              <div className="signatory-col">
                <div className="sign-signature-frame">
                  {receipt.signatureUrl || receipt.signatureDataUrl ? (
                    <img
                      src={receipt.signatureUrl || receipt.signatureDataUrl}
                      alt="Authorized Signature"
                      className="auth-sign-img"
                      onError={(e) => {
                        if (receipt.signatureDataUrl && e.currentTarget.src !== receipt.signatureDataUrl) {
                          e.currentTarget.src = receipt.signatureDataUrl
                        }
                      }}
                    />
                  ) : isPending ? (
                    <div className="auth-sign-digital" style={{ color: '#d97706', borderColor: '#fde68a', background: '#fffbeb' }}>
                      ⏳ Pending Signature Approval
                    </div>
                  ) : (
                    <div className="auth-sign-digital">{receipt.signatoryName || 'MD. Rezaul Karim'} (Signed)</div>
                  )}
                </div>
                <div className="sign-details">
                  <strong>{receipt.signatoryName || 'MD. Rezaul Karim'}</strong>
                  <span>{receipt.signatoryRole || 'Project Manager & Team Lead'}</span>
                  <span className="sign-team-text">IoT-Berg Engineering</span>
                </div>
              </div>

              <div className="qr-col">
                {qrCodeUrl && (
                  <div className="qr-box-wrap">
                    <img src={qrCodeUrl} alt="Scan QR Code" className="qr-thumb-img" />
                    <span className="qr-thumb-caption">Online Verified</span>
                  </div>
                )}
              </div>
            </div>

            {/* Hash & Security Stamp */}
            <div className="receipt-hash-footer">
              <div className="hash-line">
                <span className="hash-label">Security Integrity Hash:</span>
                <code className="hash-code">{receipt.verificationHash || 'ib_verified_sha256'}</code>
              </div>
            </div>
          </section>

          {/* Right Action Sidebar */}
          <aside className="verify-action-sidebar glass-panel">
            <h3 className="sidebar-title">Receipt Actions</h3>
            <p className="sidebar-desc">
              Download a publication-grade PDF rendered by IoT-Berg’s Chromium engine, or print directly.
            </p>

            {pdfError && <div className="pdf-error-banner">{pdfError}</div>}

            <button
              type="button"
              className="button button-primary button-full"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? (
                <>
                  <span className="spinner-inline" />
                  <span>Compiling PDF...</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Download Official PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="button button-secondary button-full"
              onClick={handlePrint}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print Money Receipt</span>
            </button>

            <hr className="sidebar-divider" />

            <div className="security-notice-card">
              <div className="notice-icon">🛡️</div>
              <div className="notice-text">
                <strong>Tamper-Proof Guarantee</strong>
                <p>
                  Any discrepancy between a paper receipt and this registry URL indicates an unauthorized document.
                </p>
              </div>
            </div>

            <div className="lead-contact-strip">
              <span className="contact-label">Technical Direction & Project Management:</span>
              <a
                href="https://rksazid.github.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="lead-contact-link"
              >
                MD. Rezaul Karim ↗
              </a>
              <span className="contact-email">rksazid@gmail.com</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

