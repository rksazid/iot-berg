import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { workOrderStore } from '../../lib/workOrderStore'
import { formatCurrencyBDT } from '../../lib/numberToWords'
import { useAuth } from '../../context/AuthContext'

export function WorkOrdersPage() {
  const { hasRole } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [workOrders, setWorkOrders] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    clientName: '',
    clientContactPerson: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    projectName: '',
    projectScope: '',
    coreContractValue: '350000',
    serverCharge: '60000',
    serverPeriod: '1 Year',
    maintenanceCharge: '40000',
    maintenancePeriod: '1 Year',
    otherAdditionalCharge: '0',
    otherAdditionalNote: '',
    contractValue: '450000',
    advancePercentage: '20',
    status: 'active',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    notes: '',
  })

  useEffect(() => {
    loadOrders()
    if (searchParams.get('action') === 'new') {
      handleOpenCreate()
    }
  }, [searchParams])

  const loadOrders = () => {
    setWorkOrders(workOrderStore.getWorkOrders())
  }

  const handleOpenCreate = () => {
    setEditingOrder(null)
    setFormData({
      id: `WO-${new Date().getFullYear()}-${String(workOrders.length + 1).padStart(3, '0')}`,
      clientName: '',
      clientContactPerson: '',
      clientEmail: '',
      clientPhone: '',
      clientAddress: '',
      projectName: '',
      projectScope: '',
      coreContractValue: '350000',
      serverCharge: '60000',
      serverPeriod: '1 Year',
      maintenanceCharge: '40000',
      maintenancePeriod: '1 Year',
      otherAdditionalCharge: '0',
      otherAdditionalNote: '',
      contractValue: '450000',
      advancePercentage: '20',
      status: 'active',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      notes: '',
    })
    setShowModal(true)
  }

  const handleOpenEdit = (wo) => {
    setEditingOrder(wo)
    const core = wo.coreContractValue != null ? String(wo.coreContractValue) : String(Math.max(0, (wo.contractValue || 450000) - (wo.totalAdditionalCharges || 100000)))
    setFormData({
      id: wo.id,
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
      advancePercentage: String(wo.advancePercentage || 20),
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
  const calculatedAdvanceAmount = Math.round(
    (calculatedGrandTotal * (Number(formData.advancePercentage) || 0)) / 100,
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    workOrderStore.saveWorkOrder({
      ...formData,
      contractValue: calculatedGrandTotal,
      advanceAmount: calculatedAdvanceAmount,
      totalAdditionalCharges: calculatedAddons,
    })
    setShowModal(false)
    setSearchParams({})
    loadOrders()
  }

  const handleDelete = (id) => {
    if (confirm(`Are you sure you want to delete work order ${id}?`)) {
      workOrderStore.deleteWorkOrder(id)
      loadOrders()
    }
  }

  const filteredOrders = workOrders.filter((wo) => {
    const q = searchQuery.toLowerCase()
    return (
      wo.id.toLowerCase().includes(q) ||
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
            Manage client engineering contracts, project scopes, and milestone payment terms.
          </p>
        </div>

        {hasRole(['admin', 'manager']) && (
          <button type="button" className="button button-primary" onClick={handleOpenCreate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ New Work Order</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
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

      {/* Work Orders List / Table */}
      <div className="orders-table-card glass-panel">
        <div className="admin-table-scroller">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Work Order Ref</th>
                <th>Client Company</th>
                <th>Project Scope</th>
                <th>Agreed Value</th>
                <th>Advance Payment</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                    No work orders found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((wo) => (
                  <tr key={wo.id}>
                    <td>
                      <strong className="mono-ref">{wo.id}</strong>
                      <span className="date-sub">Date: {wo.orderDate}</span>
                    </td>
                    <td>
                      <strong>{wo.clientName}</strong>
                      {wo.clientContactPerson && <span className="client-sub">{wo.clientContactPerson}</span>}
                      {wo.clientEmail && <span className="date-sub">{wo.clientEmail}</span>}
                    </td>
                    <td>
                      <div className="table-scope-cell">
                        <strong>{wo.projectName}</strong>
                        <p>{wo.projectScope}</p>
                        {wo.totalAdditionalCharges > 0 && (
                          <div className="table-addon-pills">
                            <span className="addon-scope-pill" title="Operational Service (1 Year)">
                              ⚙ Server: {formatCurrencyBDT(wo.serverCharge || 60000)}/yr
                            </span>
                            <span className="addon-scope-pill" title="Operational Service (1 Year)">
                              🛡 Maintenance: {formatCurrencyBDT(wo.maintenanceCharge || 40000)}/yr
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="table-contract-col">
                        <strong className="contract-num">{formatCurrencyBDT(wo.contractValue)}</strong>
                        {wo.totalAdditionalCharges > 0 && (
                          <div className="contract-breakdown-sub">
                            <span className="sub-core">Core: {formatCurrencyBDT(wo.coreContractValue || (wo.contractValue - wo.totalAdditionalCharges))}</span>
                            <span className="sub-addon">+ {formatCurrencyBDT(wo.totalAdditionalCharges)} Add-ons</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="advance-pill-box">
                        <span className="advance-tag paid">
                          {formatCurrencyBDT(wo.totalReceived)}
                        </span>
                        <span className="advance-percent">({wo.advancePercentage}% Adv)</span>
                      </div>
                    </td>
                    <td>
                      <span className="balance-due-txt" style={{ color: wo.balanceDue > 0 ? '#f59e0b' : '#0d9488' }}>
                        {formatCurrencyBDT(wo.balanceDue)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-chip-sm ${wo.status}`}>{wo.status}</span>
                    </td>
                    <td>
                      <div className="action-buttons-inline">
                        {hasRole(['admin', 'manager']) && (
                          <Link
                            to={`/admin/receipts/new?workOrderId=${encodeURIComponent(wo.id)}`}
                            className="button button-sm button-primary"
                            title="Issue Payment Receipt for this Work Order"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                          >
                            <span>Issue Receipt</span>
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create or Edit Work Order */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingOrder ? `Edit Work Order ${formData.id}` : 'New Work Order'}
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="wo-id">Work Order Reference</label>
                  <input
                    id="wo-id"
                    type="text"
                    className="form-input"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    required
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
                    placeholder="e.g. TechMatrix Solutions Ltd."
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

              {/* Total Financial Summary & Advance */}
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
                  <label htmlFor="adv-pct">Advance Percentage Agreed (%)</label>
                  <input
                    id="adv-pct"
                    type="number"
                    className="form-input"
                    placeholder="20"
                    value={formData.advancePercentage}
                    onChange={(e) => setFormData({ ...formData, advancePercentage: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Calculated Advance Amount</label>
                  <div className="form-readonly-val" style={{ color: '#0d9488', fontWeight: 700 }}>
                    {formatCurrencyBDT(calculatedAdvanceAmount)}
                  </div>
                </div>
              </div>

              <div className="form-row-2col">
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

              <div className="modal-actions-row">
                <button type="button" className="button button-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  <span>{editingOrder ? 'Update Work Order' : 'Save Work Order'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

