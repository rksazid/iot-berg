import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { workOrderStore } from '../lib/workOrderStore'
import { formatCurrencyBDT } from '../lib/numberToWords'
import { generateQrDataUrl } from '../lib/qrCode'
import { compileReceiptHtml } from '../lib/receiptPdfCompiler'
import { generatePdf } from '../lib/pdfClient'

export function VerifyReceiptPage() {
  const { receiptId } = useParams()
  const [receipt, setReceipt] = useState(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfError, setPdfError] = useState(null)

  useEffect(() => {
    const found = workOrderStore.getReceipt(receiptId)
    setReceipt(found)

    if (found) {
      generateQrDataUrl(window.location.href, { width: 140, margin: 1 }).then(setQrCodeUrl)
    }
  }, [receiptId])

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
          margin: { top: '10mm', right: '12mm', bottom: '10mm', left: '12mm' },
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
            <Link to="/" className="button button-secondary">
              Back to IoT-Berg Home
            </Link>
            <Link to="/admin/login" className="button button-primary">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page verify-page">
      <div className="verify-shell">
        {/* Verification Success Header Card */}
        <section className="verify-banner-panel glass-panel">
          <div className="verify-status-badge-row">
            <div className="verified-shield-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <div className="verify-status-copy">
              <span className="verify-kicker">IoT-Berg Cloud Verification Registry</span>
              <h1 className="verify-heading">Official Payment Receipt Verified</h1>
            </div>
          </div>
          <p className="verify-desc">
            This digital record confirms that the payment below was received and authorized by Team IoT-Berg Engineering. The physical receipt matches our cloud security registry.
          </p>
          <div className="verify-meta-strip">
            <span className="meta-tag">
              <strong>Receipt No:</strong> <code>{receipt.receiptNumber || receipt.id}</code>
            </span>
            <span className="meta-tag">
              <strong>Status:</strong> <span className="status-live-txt">✓ Active & Authorized</span>
            </span>
            <span className="meta-tag">
              <strong>Registry Date:</strong> {receipt.receiptDate || receipt.paymentDate}
            </span>
          </div>
        </section>

        {/* Receipt Content Card */}
        <div className="verify-main-grid">
          <section className="receipt-view-card glass-panel">
            {/* Top Row: Client & Work Order */}
            <div className="receipt-view-header">
              <div className="receipt-header-left">
                <span className="receipt-sublabel">Payment Issued By</span>
                <h2 className="receipt-client-title">{receipt.clientName}</h2>
                {receipt.clientContactPerson && (
                  <p className="receipt-client-contact">Attn: {receipt.clientContactPerson}</p>
                )}
                {receipt.clientEmail && (
                  <p className="receipt-client-contact">{receipt.clientEmail}</p>
                )}
              </div>

              <div className="receipt-header-right">
                <div className="receipt-number-box">
                  <span className="receipt-num-label">Official Money Receipt</span>
                  <span className="receipt-num-val">{receipt.receiptNumber || receipt.id}</span>
                </div>
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
                <span className="payment-adv-note">{receipt.advancePercent || 20}% Advance Paid</span>
              </div>
            </div>

            {/* Context Matrix */}
            <div className="receipt-spec-grid">
              <div className="spec-tile">
                <span className="tile-lbl">Work Order Reference</span>
                <code className="tile-val-mono">{receipt.workOrderId || 'WO-2026-001'}</code>
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
                  {receipt.signatureUrl ? (
                    <img src={receipt.signatureUrl} alt="Signature" className="auth-sign-img" />
                  ) : (
                    <div className="auth-sign-digital">MD. Rezaul Karim (Signed)</div>
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

