import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { workOrderStore, generateWorkOrderRef } from '../../lib/workOrderStore'
import { formatCurrencyBDT } from '../../lib/numberToWords'
import { compileReceiptHtml } from '../../lib/receiptPdfCompiler'
import { generatePdf } from '../../lib/pdfClient'
import { useAuth } from '../../context/AuthContext'

export function WorkOrdersPage() {
  const { hasRole } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [workOrders, setWorkOrders] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [selectedWoForPayments, setSelectedWoForPayments] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  // Work Order Form State (Strictly Work Order scope — no forced advance fields)
  const [formData, setFormData] = useState({
    id: '',
    clientPoRef: '',
    clientName: '',
    clientContactPerson: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    projectName: '',
    projectScope: '',
    coreContractValue: '450000',
    serverCharge: '30000',
    serverPeriod: '1 Year',
    maintenanceCharge: '0',
    maintenancePeriod: '1 Year',
    otherAdditionalCharge: '0',
    otherAdditionalNote: 'Yearly Server Charge & Maintenance Fee',
    contractValue: '480000',
    status: 'active',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    notes: '',
  })

  useEffect(() => {
    loadOrders()
    workOrderStore.syncFromCloud().then(() => loadOrders())
    if (searchParams.get('action') === 'new') {
      handleOpenCreate()
    }
  }, [searchParams])

  const loadOrders = () => {
    const orders = workOrderStore.getWorkOrders()
    setWorkOrders(orders)
    if (selectedWoForPayments) {
      const refreshed = orders.find((o) => o.id === selectedWoForPayments.id)
      setSelectedWoForPayments(refreshed || null)
    }
  }

  const handleOpenCreate = () => {
    setEditingOrder(null)
    const freshId = generateWorkOrderRef(workOrderStore.getWorkOrders().map((w) => w.id))
    setFormData({
      id: freshId,
      clientPoRef: '',
      clientName: '',
      clientContactPerson: '',
      clientEmail: '',
      clientPhone: '',
      clientAddress: '',
      projectName: '',
      projectScope: '',
      coreContractValue: '450000',
      serverCharge: '30000',
      serverPeriod: '1 Year',
      maintenanceCharge: '0',
      maintenancePeriod: '1 Year',
      otherAdditionalCharge: '0',
      otherAdditionalNote: 'Yearly Server Charge & Maintenance Fee',
      contractValue: '480000',
      status: 'active',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      notes: '',
    })
    setShowModal(true)
  }

  const handleOpenEdit = (wo) => {
    setEditingOrder(wo)
    const core =
      wo.coreContractValue != null
        ? String(wo.coreContractValue)
        : String(Math.max(0, (wo.contractValue || 450000) - (wo.totalAdditionalCharges || 100000)))
    setFormData({
      id: wo.id,
      clientPoRef: wo.clientPoRef || '',
      clientName: wo.clientName,
      clientContactPerson: wo.clientContactPerson || '',
      clientEmail: wo.clientEmail || '',
      clientPhone: wo.clientPhone || '',
      clientAddress: wo.clientAddress || '',
      projectName: wo.projectName,
      projectScope: wo.projectScope || '',
      coreContractValue: core,
      serverCharge: String(wo.serverCharge != null ? wo.serverCharge : 60000),
      serverPeriod: wo.serverPeriod || '1 Year',
      maintenanceCharge: String(wo.maintenanceCharge != null ? wo.maintenanceCharge : 40000),
      maintenancePeriod: wo.maintenancePeriod || '1 Year',
      otherAdditionalCharge: String(wo.otherAdditionalCharge || 0),
      otherAdditionalNote: wo.otherAdditionalNote || '',
      contractValue: String(wo.contractValue),
      status: wo.status,
      orderDate: wo.orderDate || '',
      deliveryDate: wo.deliveryDate || '',
      notes: wo.notes || '',
    })
    setShowModal(true)
  }

  const calculatedAddons =
    (Number(formData.serverCharge) || 0) +
    (Number(formData.maintenanceCharge) || 0) +
    (Number(formData.otherAdditionalCharge) || 0)
  const calculatedGrandTotal = (Number(formData.coreContractValue) || 0) + calculatedAddons

  const handleSubmit = async (e) => {
    e.preventDefault()
    await workOrderStore.saveWorkOrderAsync({
      ...formData,
      coreContractValue: Number(formData.coreContractValue) || 0,
      serverCharge: Number(formData.serverCharge) || 0,
      maintenanceCharge: Number(formData.maintenanceCharge) || 0,
      otherAdditionalCharge: Number(formData.otherAdditionalCharge) || 0,
      contractValue: calculatedGrandTotal,
      totalAdditionalCharges: calculatedAddons,
    })
    setShowModal(false)
    setSearchParams({})
    loadOrders()
  }

  const handleDelete = async (id) => {
    if (confirm(`Are you sure you want to delete work order ${id}?`)) {
      await workOrderStore.deleteWorkOrderAsync(id)
      loadOrders()
    }
  }

  const handleDeleteReceiptFromModal = async (receiptId) => {
    if (confirm(`Are you sure you want to delete payment receipt ${receiptId}?`)) {
      await workOrderStore.deleteReceiptAsync(receiptId)
      loadOrders()
    }
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
          margin: { top: '8mm', right: '10mm', bottom: '8mm', left: '10mm' },
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

  const filteredOrders = workOrders.filter((wo) => {
    const q = searchQuery.toLowerCase()
    return (
      wo.id.toLowerCase().includes(q) ||
      (wo.clientPoRef && wo.clientPoRef.toLowerCase().includes(q)) ||
      wo.clientName.toLowerCase().includes(q) ||
      wo.projectName.toLowerCase().includes(q)
    )
  })

  return (
    <div className="admin-subpage-view">
      {/* Page Header */}
      <div className="subpage-header glass-panel">
        <div className="subpage-copy">
          <span className="section-label">Client Contracts</span>
          <h2 className="subpage-title">Work Orders</h2>
          <p className="subpage-desc">
            Manage authorized client engineering work orders, operational service add-ons, and payment schedules.
          </p>
        </div>

        {hasRole(['admin', 'manager']) && (
          <button type="button" className="button button-primary" onClick={handleOpenCreate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Work Order</span>
          </button>
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
            placeholder="Search client, project, or work order reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <span className="filter-count">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'Work Order' : 'Work Orders'}
        </span>
      </div>

      {/* 5-Column Proportional Table */}
      <div className="work-orders-table-card glass-panel">
        <div className="admin-table-scroller">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Work Order & Client</th>
                <th style={{ width: '30%' }}>Project Scope & Services</th>
                <th style={{ width: '15%' }}>Contract Value</th>
                <th style={{ width: '16%' }}>Payments Logged</th>
                <th style={{ width: '14%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--muted)' }}>
                    No work orders found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((wo) => (
                  <tr key={wo.id}>
                    <td>
                      <div className="table-client-cell">
                        <strong className="client-title">{wo.clientName}</strong>
                        <div className="client-meta-line">
                          <span className="wo-tag">{wo.id}</span>
                          <span className="dot-sep">·</span>
                          <span className="date-tag">{wo.orderDate}</span>
                          {wo.clientContactPerson && (
                            <>
                              <span className="dot-sep">·</span>
                              <span className="contact-tag">{wo.clientContactPerson.split('(')[0].trim()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="table-scope-cell">
                        <div className="project-title-line">
                          <strong className="project-title">{wo.projectName}</strong>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {wo.clientPoRef && (
                              <span className="addon-scope-pill" title="Client External PO Reference">
                                PO: {wo.clientPoRef}
                              </span>
                            )}
                            {wo.pdfDocUrl && (
                              <a
                                href={wo.pdfDocUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="wo-scan-pill"
                                title="Open Original Signed Work Order Document (PDF)"
                              >
                                📄 WO Scan
                              </a>
                            )}
                          </div>
                        </div>
                        <p className="project-desc-clamp" title={wo.projectScope}>
                          {wo.projectScope}
                        </p>
                        {wo.totalAdditionalCharges > 0 && (
                          <div className="table-addon-pills">
                            <span className="addon-scope-pill" title="Yearly Operational Services">
                              ⚙ Server & Maintenance Fee: {formatCurrencyBDT(wo.serverCharge || wo.totalAdditionalCharges)}/yr
                            </span>
                            {wo.maintenanceCharge > 0 && (
                              <span className="addon-scope-pill" title="1-Year Software Maintenance & SLA">
                                🛡 Maintenance: {formatCurrencyBDT(wo.maintenanceCharge)}/yr
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="table-contract-col">
                        <strong className="contract-num">{formatCurrencyBDT(wo.contractValue)}</strong>
                        {wo.totalAdditionalCharges > 0 && (
                          <span className="contract-breakdown-sub">
                            <span>Core: {formatCurrencyBDT(wo.coreContractValue || wo.contractValue - wo.totalAdditionalCharges)}</span>
                            <span className="sub-addon">+{formatCurrencyBDT(wo.totalAdditionalCharges)} Add-ons</span>
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="table-payment-cell">
                        {wo.totalReceived > 0 ? (
                          <>
                            <span className="advance-tag paid">
                              ✓ {formatCurrencyBDT(wo.totalReceived)} Received
                            </span>
                            <span className="payments-count-txt">
                              {wo.paymentsCount} {wo.paymentsCount === 1 ? 'payment logged' : 'payments logged'}
                            </span>
                            <span
                              className="balance-due-txt"
                              style={{ color: wo.balanceDue > 0 ? '#d97706' : '#059669' }}
                            >
                              {formatCurrencyBDT(wo.balanceDue)} Due
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="advance-tag unpaid">
                              No Payments (৳ 0)
                            </span>
                            <span className="balance-due-txt" style={{ color: '#d97706' }}>
                              Full {formatCurrencyBDT(wo.contractValue)} Due
                            </span>
                          </>
                        )}
                        <button
                          type="button"
                          className="link-payments-btn"
                          onClick={() => setSelectedWoForPayments(wo)}
                        >
                          View Payments ({wo.paymentsCount || 0}) →
                        </button>
                      </div>
                    </td>

                    <td>
                      <div className="status-balance-actions-cell">
                        <span className={`status-chip-sm ${wo.status}`}>{wo.status}</span>

                        <div className="action-buttons-inline" style={{ marginTop: '0.45rem' }}>
                          {hasRole(['admin', 'manager']) && (
                            <Link
                              to={`/admin/receipts/new?workOrderId=${encodeURIComponent(wo.id)}`}
                              className="button button-sm button-primary"
                              title="Add Payment / Issue Receipt for this Work Order"
                              style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                            >
                              <span>+ Payment</span>
                            </Link>
                          )}

                          {hasRole(['admin', 'manager']) && (
                            <button
                              type="button"
                              className="table-action-icon-btn"
                              title="Edit Work Order"
                              onClick={() => handleOpenEdit(wo)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          )}

                          {hasRole(['admin']) && (
                            <button
                              type="button"
                              className="table-action-icon-btn danger"
                              title="Delete Work Order"
                              onClick={() => handleDelete(wo.id)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Create / Edit Work Order (Strictly Work Order scope) */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="section-label">Contract Management</span>
                <h3 className="modal-title">
                  {editingOrder ? `Edit Work Order (${editingOrder.id})` : 'Record Received Work Order'}
                </h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body-form">
              <div className="form-row-3col">
                <div className="form-group">
                  <label htmlFor="wo-ref">Our Work Order ID (IB / IBSET)</label>
                  <input
                    id="wo-ref"
                    type="text"
                    className="form-input font-mono"
                    placeholder="IBSET-WO-2611-XXXX"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="client-po-ref">Client PO Ref (Optional)</label>
                  <input
                    id="client-po-ref"
                    type="text"
                    className="form-input font-mono"
                    placeholder="e.g. Buyer PO Ref"
                    value={formData.clientPoRef}
                    onChange={(e) => setFormData({ ...formData, clientPoRef: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="wo-status">Status</label>
                  <select
                    id="wo-status"
                    className="form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="client-name">Client Company Name</label>
                  <input
                    id="client-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Client Industrial Systems Ltd."
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-person">Contact Person & Title</label>
                  <input
                    id="contact-person"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mr. Tareq Hasan (Director)"
                    value={formData.clientContactPerson}
                    onChange={(e) => setFormData({ ...formData, clientContactPerson: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="client-email">Client Email Address</label>
                  <input
                    id="client-email"
                    type="email"
                    className="form-input"
                    placeholder="client@example.com"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="client-phone">Phone / Mobile</label>
                  <input
                    id="client-phone"
                    type="text"
                    className="form-input"
                    placeholder="+880 1712-345678"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="client-address">Billing / Office Address</label>
                <input
                  id="client-address"
                  type="text"
                  className="form-input"
                  placeholder="Street, City, Country"
                  value={formData.clientAddress}
                  onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="proj-name">Project / Engagement Title</label>
                <input
                  id="proj-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Enterprise Document Engine & Cloud Pipeline"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="proj-scope">Project Scope & Key Deliverables</label>
                <textarea
                  id="proj-scope"
                  className="form-input textarea"
                  rows="3"
                  placeholder="Describe the scope of work, modules, and architecture..."
                  value={formData.projectScope}
                  onChange={(e) => setFormData({ ...formData, projectScope: e.target.value })}
                />
              </div>

              {/* Core Development Scope Value */}
              <div className="form-group">
                <label htmlFor="core-contract-val">Core Project Development Scope (BDT)</label>
                <input
                  id="core-contract-val"
                  type="number"
                  className="form-input"
                  placeholder="350000"
                  value={formData.coreContractValue}
                  onChange={(e) => setFormData({ ...formData, coreContractValue: e.target.value })}
                  required
                />
                <span className="input-hint">Core engineering, architecture, microservices, and deliverable features.</span>
              </div>

              {/* Additional Operational Services (Distinct Section) */}
              <div className="modal-addons-box glass-panel">
                <div className="addons-box-header">
                  <span className="addons-pill-badge">Additional Operational Services</span>
                  <p className="addons-box-sub">
                    Cloud server hosting and maintenance support charges are additional operational allocations, billed separately from the core software deliverables.
                  </p>
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label htmlFor="server-charge">Server Charge (1 Year Cloud Hosting)</label>
                    <input
                      id="server-charge"
                      type="number"
                      className="form-input"
                      placeholder="60000"
                      value={formData.serverCharge}
                      onChange={(e) => setFormData({ ...formData, serverCharge: e.target.value })}
                    />
                    <span className="input-hint">Managed cloud servers, cluster uptime & storage</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="maint-charge">Software Maintenance & Support (1 Year)</label>
                    <input
                      id="maint-charge"
                      type="number"
                      className="form-input"
                      placeholder="40000"
                      value={formData.maintenanceCharge}
                      onChange={(e) => setFormData({ ...formData, maintenanceCharge: e.target.value })}
                    />
                    <span className="input-hint">24/7 security updates, bug fixes & SLA</span>
                  </div>
                </div>
              </div>

              {/* Total Financial Summary (Work order scope total) */}
              <div className="modal-financial-summary-strip">
                <div className="summary-item">
                  <span className="summary-item-label">Core Scope:</span>
                  <span className="summary-item-val">{formatCurrencyBDT(Number(formData.coreContractValue) || 0)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-item-label">+ Operational Add-ons:</span>
                  <span className="summary-item-val" style={{ color: '#4f46e5' }}>+{formatCurrencyBDT(calculatedAddons)}</span>
                </div>
                <div className="summary-item total">
                  <span className="summary-item-label">= Total Contract Value:</span>
                  <span className="summary-item-val">{formatCurrencyBDT(calculatedGrandTotal)}</span>
                </div>
              </div>

              <div className="form-row-2col" style={{ marginTop: '0.75rem' }}>
                <div className="form-group">
                  <label htmlFor="order-date">Work Order Date</label>
                  <input
                    id="order-date"
                    type="date"
                    className="form-input"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="delivery-date">Expected Delivery Date</label>
                  <input
                    id="delivery-date"
                    type="date"
                    className="form-input"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Engagement Notes & Terms</label>
                <textarea
                  id="notes"
                  className="form-input textarea"
                  rows="2"
                  placeholder="Terms, operational agreements, milestone notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="modal-actions-bar">
                <button type="button" className="button button-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  {editingOrder ? 'Update Work Order' : 'Save Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Work Order Payments History & Actions */}
      {selectedWoForPayments && (
        <div className="modal-backdrop" onClick={() => setSelectedWoForPayments(null)}>
          <div className="modal-dialog modal-dialog-lg glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="section-label">Payment Ledger</span>
                <h3 className="modal-title">
                  Payments under {selectedWoForPayments.id}
                </h3>
                <p className="modal-sub-client">
                  <strong>{selectedWoForPayments.clientName}</strong> · {selectedWoForPayments.projectName}
                </p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedWoForPayments(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body-content">
              {/* Financial KPI Summary Bar */}
              <div className="modal-payment-kpi-bar">
                <div className="kpi-metric">
                  <span className="kpi-label">Total Contract Value</span>
                  <strong className="kpi-val">{formatCurrencyBDT(selectedWoForPayments.contractValue)}</strong>
                </div>
                <div className="kpi-metric">
                  <span className="kpi-label">Total Payments Received</span>
                  <strong className="kpi-val" style={{ color: '#059669' }}>
                    {formatCurrencyBDT(selectedWoForPayments.totalReceived)}
                  </strong>
                </div>
                <div className="kpi-metric">
                  <span className="kpi-label">Remaining Balance</span>
                  <strong
                    className="kpi-val"
                    style={{ color: selectedWoForPayments.balanceDue > 0 ? '#d97706' : '#059669' }}
                  >
                    {formatCurrencyBDT(selectedWoForPayments.balanceDue)}
                  </strong>
                </div>
              </div>

              {/* Payments List Table */}
              {(!selectedWoForPayments.payments || selectedWoForPayments.payments.length === 0) ? (
                <div className="empty-payments-state">
                  <p>No payments recorded under this work order yet.</p>
                  <Link
                    to={`/admin/receipts/new?workOrderId=${encodeURIComponent(selectedWoForPayments.id)}`}
                    className="button button-primary"
                    style={{ display: 'inline-flex', marginTop: '0.5rem' }}
                  >
                    <span>+ Add Advance or Milestone Payment</span>
                  </Link>
                </div>
              ) : (
                <div className="admin-table-scroller" style={{ marginTop: '1rem' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Receipt #</th>
                        <th>Payment Head</th>
                        <th>Date & Mode</th>
                        <th>Particulars / Description</th>
                        <th>Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedWoForPayments.payments.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <strong className="mono-ref">{p.receiptNumber || p.id}</strong>
                          </td>
                          <td>
                            <span className="payment-head-chip">{p.paymentHead || p.paymentCategory}</span>
                          </td>
                          <td>
                            <span className="date-sub">{p.paymentDate || p.receiptDate}</span>
                            <span className="mode-sub">{p.paymentMode}</span>
                          </td>
                          <td>
                            <p className="payment-desc-clamp" title={p.transactionNote}>
                              {p.transactionNote || '—'}
                            </p>
                          </td>
                          <td>
                            <strong style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>
                              {formatCurrencyBDT(p.amount)}
                            </strong>
                          </td>
                          <td>
                            <div className="action-buttons-inline">
                              <button
                                type="button"
                                className="table-action-icon-btn"
                                title="Download PDF Voucher (pdf-lagbe)"
                                onClick={() => handleDownloadPdf(p)}
                                disabled={downloadingId === p.id}
                              >
                                {downloadingId === p.id ? (
                                  <span className="spinner-mini" />
                                ) : (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                  </svg>
                                )}
                              </button>

                              <Link
                                to={`/verify/${p.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="table-action-icon-btn"
                                title="Open Online Verification"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 14 14" />
                                </svg>
                              </Link>

                              {hasRole(['admin']) && (
                                <button
                                  type="button"
                                  className="table-action-icon-btn danger"
                                  title="Delete Payment"
                                  onClick={() => handleDeleteReceiptFromModal(p.id)}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-actions-bar" style={{ marginTop: '1.25rem', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setSelectedWoForPayments(null)}
              >
                Close
              </button>

              <Link
                to={`/admin/receipts/new?workOrderId=${encodeURIComponent(selectedWoForPayments.id)}`}
                className="button button-primary"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add Payment for this Order</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
