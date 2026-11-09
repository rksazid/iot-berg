import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { workOrderStore } from '../../lib/workOrderStore'
import { formatCurrencyBDT } from '../../lib/numberToWords'
import { compileReceiptHtml } from '../../lib/receiptPdfCompiler'
import { generatePdf } from '../../lib/pdfClient'
import { useAuth } from '../../context/AuthContext'

export function AdminDashboardPage() {
  const { currentUser, hasRole } = useAuth()
  const [stats, setStats] = useState(workOrderStore.getSummaryStats())
  const [workOrders, setWorkOrders] = useState(workOrderStore.getWorkOrders())
  const [receipts, setReceipts] = useState(workOrderStore.getReceipts())
  const [downloadingId, setDownloadingId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    refreshData()
  }, [])

  const refreshData = () => {
    setStats(workOrderStore.getSummaryStats())
    setWorkOrders(workOrderStore.getWorkOrders())
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
      console.error('Failed to download PDF:', err)
      alert(`PDF compilation error: ${err.message}`)
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

  return (
    <div className="admin-dashboard-view">
      {/* Top Welcome & Quick Actions */}
      <section className="dashboard-hero glass-panel">
        <div className="dashboard-hero-copy">
          <div className="hero-eyebrow-wrap">
            <span className="eyebrow">
              <span className="eyebrow-dot" /> Operations Overview
            </span>
            <span className="version-pill">Role: {currentUser.role.toUpperCase()}</span>
          </div>
          <h2 className="dashboard-hero-title">Dashboard Overview</h2>
          <p className="dashboard-hero-desc">
            Track active client work orders, advance cash payments, and tamper-verified receipts.
          </p>
        </div>

        <div className="dashboard-hero-actions">
          {hasRole(['admin', 'manager']) && (
            <>
              <Link to="/admin/work-orders?action=new" className="button button-secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>+ New Work Order</span>
              </Link>
              <Link to="/admin/receipts/new" className="button button-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>+ Issue Receipt</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* 4 Key Stat Cards */}
      <section className="admin-stats-grid">
        <div className="admin-stat-card glass-panel">
          <div className="stat-card-icon emerald">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="stat-card-data">
            <span className="stat-label">Advance Received</span>
            <strong className="stat-value" style={{ color: '#0d9488' }}>
              {formatCurrencyBDT(stats.totalPaymentsReceived)}
            </strong>
            <span className="stat-subtext">Cash advance (20%)</span>
          </div>
        </div>

        <div className="admin-stat-card glass-panel">
          <div className="stat-card-icon blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div className="stat-card-data">
            <span className="stat-label">Total Contract Value</span>
            <strong className="stat-value">{formatCurrencyBDT(stats.totalContractValue)}</strong>
            <span className="stat-subtext">
              {stats.workOrdersCount} {stats.workOrdersCount === 1 ? 'Authorized Order' : 'Authorized Orders'}
            </span>
          </div>
        </div>

        <div className="admin-stat-card glass-panel">
          <div className="stat-card-icon amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="stat-card-data">
            <span className="stat-label">Outstanding Balance</span>
            <strong className="stat-value" style={{ color: '#f59e0b' }}>
              {formatCurrencyBDT(stats.pendingBalance)}
            </strong>
            <span className="stat-subtext">Pending balance (80%)</span>
          </div>
        </div>

        <div className="admin-stat-card glass-panel">
          <div className="stat-card-icon purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="stat-card-data">
            <span className="stat-label">Active Projects</span>
            <strong className="stat-value">{stats.activeProjectsCount} Active</strong>
            <span className="stat-subtext">In delivery</span>
          </div>
        </div>
      </section>

      {/* Two-Column Section: Recent Work Orders & Recent Receipts */}
      <div className="admin-two-col-grid">
        {/* Left Column: Work Orders */}
        <section className="admin-card-section glass-panel">
          <div className="section-card-header">
            <div>
              <h3 className="section-card-title">Recent Work Orders</h3>
              <p className="section-card-sub">Authorized client contracts & scopes</p>
            </div>
            <Link to="/admin/work-orders" className="link-subtle">
              View All →
            </Link>
          </div>

          <div className="admin-table-scroller">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ref & Client</th>
                  <th>Contract</th>
                  <th>Advance Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((wo) => (
                  <tr key={wo.id}>
                    <td>
                      <div className="table-main-col">
                        <strong className="mono-ref">{wo.id}</strong>
                        <span className="client-sub">{wo.clientName}</span>
                      </div>
                    </td>
                    <td>
                      <strong>{formatCurrencyBDT(wo.contractValue)}</strong>
                    </td>
                    <td>
                      <span className="advance-tag paid">
                        {formatCurrencyBDT(wo.totalReceived)} ({wo.advancePercentage}%)
                      </span>
                    </td>
                    <td>
                      <span className={`status-chip-sm ${wo.status}`}>{wo.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Recent Payment Receipts */}
        <section className="admin-card-section glass-panel">
          <div className="section-card-header">
            <div>
              <h3 className="section-card-title">Recent Payment Receipts</h3>
              <p className="section-card-sub">Tamper-verified with QR verification</p>
            </div>
            <Link to="/admin/receipts" className="link-subtle">
              View All →
            </Link>
          </div>

          <div className="admin-table-scroller">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <div className="table-main-col">
                        <strong className="mono-ref">{rec.receiptNumber || rec.id}</strong>
                        <span className="date-sub">{rec.receiptDate || rec.paymentDate}</span>
                      </div>
                    </td>
                    <td>
                      <span className="client-sub">{rec.clientName}</span>
                      <span className="mode-sub">{rec.paymentMode} Receipt</span>
                    </td>
                    <td>
                      <strong style={{ color: '#0d9488' }}>{formatCurrencyBDT(rec.amount)}</strong>
                    </td>
                    <td>
                      <div className="action-buttons-inline">
                        <button
                          type="button"
                          className="table-action-icon-btn"
                          title="Download PDF Receipt (pdf-lagbe)"
                          onClick={() => handleDownloadPdf(rec)}
                          disabled={downloadingId === rec.id}
                        >
                          {downloadingId === rec.id ? (
                            <span className="spinner-mini" />
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          )}
                        </button>

                        <Link
                          to={`/verify/${rec.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="table-action-icon-btn"
                          title="View Online Verification Page"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 14 14" />
                          </svg>
                        </Link>

                        <button
                          type="button"
                          className="table-action-icon-btn"
                          title="Copy Public Verification Link"
                          onClick={() => handleCopyLink(rec.id)}
                        >
                          {copiedId === rec.id ? (
                            <span style={{ fontSize: '10px', color: '#0d9488' }}>✓</span>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

