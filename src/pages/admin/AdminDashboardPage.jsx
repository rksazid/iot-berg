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

  // Calculate percentage splits for revenue pipeline
  const totalVal = stats.totalContractValue || 1
  const corePct = Math.round(((stats.totalCoreValue || 0) / totalVal) * 100)
  const serverPct = Math.round(((stats.totalServerValue || 0) / totalVal) * 100)
  const maintPct = Math.max(0, 100 - corePct - serverPct)

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
            Track active client work orders, advance cash payments, operational add-ons, and tamper-verified receipts.
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
                <span>New Work Order</span>
              </Link>
              <Link to="/admin/receipts/new" className="button button-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Issue Receipt</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* 4 Key Stat Cards */}
      <section className="admin-stats-grid">
        <div className="admin-stat-card glass-panel">
          <div className={`stat-card-icon ${stats.totalPaymentsReceived > 0 ? 'emerald' : 'amber'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="stat-card-data">
            <span className="stat-label">Payments Received</span>
            <strong
              className="stat-value"
              style={{ color: stats.totalPaymentsReceived > 0 ? '#0d9488' : '#d97706' }}
            >
              {formatCurrencyBDT(stats.totalPaymentsReceived)}
            </strong>
            <span className="stat-subtext">
              {stats.totalPaymentsReceived > 0
                ? `${stats.collectionRate}% of total contracts collected`
                : 'No payments recorded yet'}
            </span>
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
            <span className="stat-subtext">
              {stats.totalContractValue > 0
                ? `${Math.round((stats.pendingBalance / stats.totalContractValue) * 100)}% Milestone Balance`
                : 'No pending balance'}
            </span>
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
            <span className="stat-subtext">Engineering Deliveries</span>
          </div>
        </div>
      </section>

      {/* Expanded Operations & Financial Intelligence Row */}
      <div className="admin-insights-grid">
        {/* Revenue Pipeline Breakdown */}
        <section className="insight-card glass-panel">
          <div className="insight-header">
            <div>
              <span className="section-label">Financial Architecture</span>
              <h3 className="insight-title">Revenue & Service Distribution</h3>
            </div>
            <span className="insight-total-pill">
              Total: {formatCurrencyBDT(stats.totalContractValue)}
            </span>
          </div>

          <p className="insight-desc">
            Contract value partitioned between core engineering development and recurring operational services (cloud hosting & annual SLA maintenance).
          </p>

          {/* Segmented visual progress bar */}
          <div className="segmented-progress-bar">
            <div
              className="segment-bar segment-core"
              style={{ width: `${corePct}%` }}
              title={`Core Engineering: ${corePct}%`}
            />
            <div
              className="segment-bar segment-server"
              style={{ width: `${serverPct}%` }}
              title={`Server Hosting (1-Yr): ${serverPct}%`}
            />
            <div
              className="segment-bar segment-maint"
              style={{ width: `${maintPct}%` }}
              title={`Maintenance SLA (1-Yr): ${maintPct}%`}
            />
          </div>

          {/* 3 Metric Breakdown Boxes */}
          <div className="insight-breakdown-row">
            <div className="breakdown-metric-box">
              <div className="metric-indicator core-dot" />
              <div className="metric-meta">
                <span className="metric-title">Core Development</span>
                <strong className="metric-num">{formatCurrencyBDT(stats.totalCoreValue)}</strong>
                <span className="metric-sub">{corePct}% of total pipeline</span>
              </div>
            </div>

            <div className="breakdown-metric-box">
              <div className="metric-indicator server-dot" />
              <div className="metric-meta">
                <span className="metric-title">Cloud Server (1-Yr)</span>
                <strong className="metric-num">{formatCurrencyBDT(stats.totalServerValue)}</strong>
                <span className="metric-sub">{serverPct}% operational</span>
              </div>
            </div>

            <div className="breakdown-metric-box">
              <div className="metric-indicator maint-dot" />
              <div className="metric-meta">
                <span className="metric-title">Software Maintenance</span>
                <strong className="metric-num">{formatCurrencyBDT(stats.totalMaintenanceValue)}</strong>
                <span className="metric-sub">{maintPct}% SLA support</span>
              </div>
            </div>
          </div>

          {/* Cash Realization Sub-bar */}
          <div className="realization-footer">
            <div className="realization-labels">
              <span>Overall Revenue Realization ({stats.collectionRate}%)</span>
              <span>
                {formatCurrencyBDT(stats.totalPaymentsReceived)} / {formatCurrencyBDT(stats.totalContractValue)}
              </span>
            </div>
            <div className="mini-progress-track">
              <div
                className="mini-progress-fill"
                style={{
                  width: `${Math.min(100, stats.collectionRate)}%`,
                  backgroundColor: stats.totalPaymentsReceived > 0 ? '#10b981' : '#f59e0b',
                }}
              />
            </div>
          </div>
        </section>

        {/* Operational Infrastructure & Security Health */}
        <section className="insight-card glass-panel">
          <div className="insight-header">
            <div>
              <span className="section-label">Platform Telemetry</span>
              <h3 className="insight-title">Cloud & Engine Infrastructure</h3>
            </div>
            <span className="status-live-chip">All Systems Operational</span>
          </div>

          <p className="insight-desc">
            Verified backend integrations supporting live document generation, tamper-proof storage, and cryptographic receipts.
          </p>

          <div className="infra-status-list">
            <div className="infra-item">
              <div className="infra-icon-wrap emerald">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="infra-info">
                <div className="infra-title-line">
                  <strong>Vercel Blob Storage</strong>
                  <span className="infra-tag">IAD1 Edge</span>
                </div>
                <span className="infra-sub">Client signatures & seals optimized & stored under 1MB</span>
              </div>
            </div>

            <div className="infra-item">
              <div className="infra-icon-wrap blue">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className="infra-info">
                <div className="infra-title-line">
                  <strong>pdf-lagbe Engine</strong>
                  <span className="infra-tag">Chromium Node</span>
                </div>
                <span className="infra-sub">300 DPI vector PDF compilation with A4 background</span>
              </div>
            </div>

            <div className="infra-item">
              <div className="infra-icon-wrap purple">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="infra-info">
                <div className="infra-title-line">
                  <strong>Digital Seal & QR Registry</strong>
                  <span className="infra-tag">SHA-256</span>
                </div>
                <span className="infra-sub">Public verification gateway at /verify/:id</span>
              </div>
            </div>
          </div>
        </section>
      </div>

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
              View All ({workOrders.length}) →
            </Link>
          </div>

          <div className="admin-table-scroller">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client & Ref</th>
                  <th>Contract Value</th>
                  <th>Payment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--muted)' }}>
                      No work orders recorded yet. Click <strong>New Work Order</strong> to start.
                    </td>
                  </tr>
                ) : (
                  workOrders.slice(0, 5).map((wo) => (
                    <tr key={wo.id}>
                      <td>
                        <div className="table-client-cell">
                          <strong className="client-title">{wo.clientName}</strong>
                          <div className="client-meta-line">
                            <span className="wo-tag">{wo.id}</span>
                            <span className="dot-sep">·</span>
                            <span className="date-tag">{wo.orderDate}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="table-contract-col">
                          <strong>{formatCurrencyBDT(wo.contractValue)}</strong>
                          {wo.totalAdditionalCharges > 0 && (
                            <span className="contract-breakdown-sub">
                              <span>Core {formatCurrencyBDT(wo.coreContractValue || wo.contractValue - wo.totalAdditionalCharges)}</span>
                              <span className="sub-addon">+{formatCurrencyBDT(wo.totalAdditionalCharges)} Add-ons</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {wo.totalReceived > 0 ? (
                          <div className="table-payment-cell">
                            <span className="advance-tag paid">
                              ✓ {formatCurrencyBDT(wo.totalReceived)}
                            </span>
                            <span className="advance-percent">
                              {wo.paymentsCount || 1} {wo.paymentsCount === 1 ? 'payment' : 'payments'} · {formatCurrencyBDT(wo.balanceDue)} Due
                            </span>
                          </div>
                        ) : (
                          <div className="table-payment-cell">
                            <span className="advance-tag unpaid">
                              No Payments (৳ 0)
                            </span>
                            <span className="advance-percent pending">
                              Balance: {formatCurrencyBDT(wo.contractValue)} Due
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons-inline">
                          <Link
                            to={`/admin/receipts/new?workOrderId=${encodeURIComponent(wo.id)}`}
                            className="button button-sm button-primary"
                            title="Issue Payment Receipt"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                          >
                            <span>Receipt</span>
                          </Link>
                          <Link
                            to="/admin/work-orders"
                            className="table-action-icon-btn"
                            title="View Full Order Details"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Recent Payment Receipts */}
        <section className="admin-card-section glass-panel">
          <div className="section-card-header">
            <div>
              <h3 className="section-card-title">Recent Payment Receipts</h3>
              <p className="section-card-sub">Tamper-verified vouchers with QR verification</p>
            </div>
            <Link to="/admin/receipts" className="link-subtle">
              View All ({receipts.length}) →
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
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--muted)' }}>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}>No payment receipts recorded yet.</p>
                      <Link
                        to="/admin/receipts/new"
                        className="button button-sm button-primary"
                        style={{ display: 'inline-flex', margin: '0 auto' }}
                      >
                        Issue Advance Receipt
                      </Link>
                    </td>
                  </tr>
                ) : (
                  receipts.slice(0, 5).map((rec) => (
                    <tr key={rec.id}>
                      <td>
                        <div className="table-main-col">
                          <strong className="mono-ref">{rec.receiptNumber || rec.id}</strong>
                          <span className="date-sub">{rec.receiptDate || rec.paymentDate}</span>
                        </div>
                      </td>
                      <td>
                        <span className="client-sub" style={{ fontWeight: 600, color: 'var(--text)' }}>
                          {rec.clientName}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginTop: '2px' }}>
                          <span className="mode-sub">{rec.paymentHead || rec.paymentCategory || `${rec.paymentMode} Receipt`}</span>
                          {rec.status === 'pending_approval' ? (
                            <span className="status-pending-chip" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>⏳ Edit Mode</span>
                          ) : (
                            <span className="status-live-chip" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>✓ Approved</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#0d9488' }}>{formatCurrencyBDT(rec.amount)}</strong>
                      </td>
                      <td>
                        <div className="action-buttons-inline">
                          <Link
                            to={`/admin/receipts/${encodeURIComponent(rec.id)}/edit`}
                            className={rec.status === 'pending_approval' ? 'button button-sm button-approve' : 'table-action-icon-btn'}
                            style={rec.status === 'pending_approval' ? { padding: '0.2rem 0.5rem', fontSize: '0.68rem' } : undefined}
                            title="Verify, Edit & Upload Signature"
                          >
                            {rec.status === 'pending_approval' ? (
                              <span>✏️ Edit & Sign</span>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            )}
                          </Link>

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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
