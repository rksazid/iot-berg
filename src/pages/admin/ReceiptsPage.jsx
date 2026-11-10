import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { workOrderStore } from '../../lib/workOrderStore'
import { formatCurrencyBDT } from '../../lib/numberToWords'
import { compileReceiptHtml } from '../../lib/receiptPdfCompiler'
import { generatePdf } from '../../lib/pdfClient'
import { useAuth } from '../../context/AuthContext'

export function ReceiptsPage() {
  const { hasRole } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [receipts, setReceipts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const justIssuedId = searchParams.get('issued')
  const approvedId = searchParams.get('approved')
  const savedId = searchParams.get('saved')

  useEffect(() => {
    loadReceipts()
  }, [])

  const loadReceipts = () => {
    setReceipts(workOrderStore.getReceipts())
  }

  const handleDownloadPdf = async (receipt) => {
    setDownloadingId(receipt.id)
    try {
      const html = await compileReceiptHtml(receipt, window.location.origin)
      const res = await generatePdf({
        endpointMode: 'auto',
        apiPath: 'html-to-pdf',
        payload: {
          html,
          format: 'A4',
          printBackground: true,
          margin: { top: '10mm', right: '12mm', bottom: '10mm', left: '12mm' },
        },
      })

      const blobUrl = URL.createObjectURL(res.blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `Receipt-${receipt.receiptNumber || receipt.id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Failed to compile PDF via pdf-lagbe:', err)
      alert(`PDF compilation failed: ${err.message}`)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleCopyLink = async (receiptId) => {
    const url = `${window.location.origin}/verify/${encodeURIComponent(receiptId)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(receiptId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      prompt('Copy verification URL:', url)
    }
  }

  const handleDelete = (id) => {
    if (confirm(`Are you sure you want to delete receipt ${id}?`)) {
      workOrderStore.deleteReceipt(id)
      loadReceipts()
    }
  }

  const filteredReceipts = receipts.filter((r) => {
    const q = searchQuery.toLowerCase()
    return (
      r.id.toLowerCase().includes(q) ||
      (r.receiptNumber && r.receiptNumber.toLowerCase().includes(q)) ||
      r.clientName.toLowerCase().includes(q) ||
      r.projectName.toLowerCase().includes(q)
    )
  })

  const pendingReceipt = receipts.find((r) => r.status === 'pending_approval')

  return (
    <div className="admin-subpage-view">
      {(justIssuedId || approvedId) && (
        <div className="alert-banner-success glass-panel">
          <div className="banner-icon">✓</div>
          <div className="banner-content">
            <strong>
              Receipt {approvedId || justIssuedId}{' '}
              {approvedId ? 'Approved & Authorized Successfully!' : 'Issued & Verified Successfully!'}
            </strong>
            <p>
              The money receipt has been digitally authorized and registered. Online QR verification and PDF download are now live.
            </p>
          </div>
          <button type="button" className="banner-dismiss" onClick={() => setSearchParams({})}>
            ✕
          </button>
        </div>
      )}

      {savedId && (
        <div className="review-mode-banner glass-panel">
          <div className="banner-icon">💾</div>
          <div className="banner-content" style={{ flex: 1 }}>
            <strong style={{ color: '#92400e' }}>
              Changes Saved for Receipt {savedId} (Still in Edit Mode)
            </strong>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: '#78350f' }}>
              Your edits and uploaded signature are saved. Click "Edit & Sign" anytime to review and approve.
            </p>
          </div>
          <button type="button" className="banner-dismiss" onClick={() => setSearchParams({})}>
            ✕
          </button>
        </div>
      )}

      {pendingReceipt && !savedId && !approvedId && (
        <div className="review-mode-banner glass-panel">
          <div className="banner-icon">⏳</div>
          <div className="banner-content" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <strong style={{ color: '#92400e', fontSize: '0.95rem' }}>
                Pending Verification & Signature: {pendingReceipt.receiptNumber || pendingReceipt.id}
              </strong>
              <span className="status-pending-chip">⏳ In Edit Mode</span>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: '#78350f' }}>
              Payment of {formatCurrencyBDT(pendingReceipt.amount)} recorded for {pendingReceipt.clientName}. Verify details, upload your signature image, and approve the receipt.
            </p>
          </div>
          <Link
            to={`/admin/receipts/${encodeURIComponent(pendingReceipt.id)}/edit`}
            className="button button-sm button-approve"
          >
            ✏️ Edit, Sign & Approve →
          </Link>
        </div>
      )}

      {/* Page Header */}
      <div className="subpage-header glass-panel">
        <div className="subpage-copy">
          <span className="section-label">Verified Vouchers</span>
          <h2 className="subpage-title">Payment Receipts</h2>
          <p className="subpage-desc">
            Tamper-evident payment receipts with online QR verification, authorized signatures, and instant PDF download.
          </p>
        </div>

        {hasRole(['admin', 'manager']) && (
          <Link to="/admin/receipts/new" className="button button-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Issue Receipt</span>
          </Link>
        )}
      </div>

      {/* Search / Filter Bar */}
      <div className="search-filter-bar glass-panel">
        <div className="search-input-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search receipt #, client, or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <span className="filter-count">
          {filteredReceipts.length} {filteredReceipts.length === 1 ? 'Receipt' : 'Receipts'}
        </span>
      </div>

      {/* Receipts Table Card */}
      <div className="receipts-table-card glass-panel">
        <div className="admin-table-scroller">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Issue Date</th>
                <th>Client / Payer</th>
                <th>Work Order & Scope</th>
                <th>Amount Paid</th>
                <th>Payment Mode</th>
                <th>Online Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                    No receipts found matching search query.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <strong className="mono-ref">{rec.receiptNumber || rec.id}</strong>
                      <span className="sign-author-sub">By {rec.signatoryName}</span>
                    </td>
                    <td>
                      <span className="date-sub">{rec.receiptDate || rec.paymentDate}</span>
                    </td>
                    <td>
                      <strong>{rec.clientName}</strong>
                      {rec.clientContactPerson && <span className="client-sub">{rec.clientContactPerson}</span>}
                    </td>
                    <td>
                      <div className="table-scope-cell">
                        <strong className="mono-ref-sm">{rec.workOrderId || 'WO-2026-001'}</strong>
                        <p>{rec.projectName}</p>
                      </div>
                    </td>
                    <td>
                      <strong className="amount-num-cell" style={{ color: '#0d9488' }}>
                        {formatCurrencyBDT(rec.amount)}
                      </strong>
                      <span className="payment-head-chip" style={{ marginTop: '2px', display: 'inline-block' }}>
                        {rec.paymentHead || rec.paymentCategory || 'Payment Voucher'}
                      </span>
                    </td>
                    <td>
                      <span className="mode-pill-tag">{rec.paymentMode}</span>
                    </td>
                    <td>
                      {rec.status === 'pending_approval' ? (
                        <span className="status-pending-chip">⏳ Under Review</span>
                      ) : (
                        <span className="status-live-chip">✓ Verified</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons-inline">
                        {rec.status === 'pending_approval' ? (
                          <Link
                            to={`/admin/receipts/${encodeURIComponent(rec.id)}/edit`}
                            className="button button-sm button-approve"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                            title="Verify, Edit, Upload Signature & Approve"
                          >
                            <span>✏️ Edit & Sign</span>
                          </Link>
                        ) : (
                          <Link
                            to={`/admin/receipts/${encodeURIComponent(rec.id)}/edit`}
                            className="table-action-icon-btn"
                            title="Edit Receipt & Signature"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </Link>
                        )}

                        <button
                          type="button"
                          className="button button-sm button-primary"
                          title="Compile & Download PDF Receipt via pdf-lagbe"
                          onClick={() => handleDownloadPdf(rec)}
                          disabled={downloadingId === rec.id}
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                        >
                          {downloadingId === rec.id ? (
                            <span>Generating...</span>
                          ) : (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                              <span>PDF</span>
                            </>
                          )}
                        </button>

                        <Link
                          to={`/verify/${rec.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="table-action-icon-btn"
                          title="Open Online QR Verification Page"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </Link>

                        <button
                          type="button"
                          className="table-action-icon-btn"
                          title="Copy Public QR Verification Link"
                          onClick={() => handleCopyLink(rec.id)}
                        >
                          {copiedId === rec.id ? (
                            <span style={{ fontSize: '11px', color: '#0d9488' }}>✓</span>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>

                        {hasRole(['admin']) && (
                          <button
                            type="button"
                            className="table-action-icon-btn danger"
                            title="Delete Receipt"
                            onClick={() => handleDelete(rec.id)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

