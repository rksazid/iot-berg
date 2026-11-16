import { useState, useEffect, useMemo } from 'react'
import {
  employeeStore,
  ROLE_CATEGORIES,
  generateEmployeeId,
  generateAppointmentRef,
} from '../../lib/employeeStore'
import { compileEmployeeDocumentHtml } from '../../lib/appointmentLetterCompiler'
import { generatePdf } from '../../lib/pdfClient'
import { numberToWordsBDT } from '../../lib/numberToWords'

export function EmployeesPage() {
  const [employees, setEmployees] = useState(() => employeeStore.getAllEmployees())
  const [documents, setDocuments] = useState(() => employeeStore.getAllDocuments())
  const [storageBackend, setStorageBackend] = useState(() => employeeStore.getStorageBackend())
  const [activeTab, setActiveTab] = useState('directory') // 'directory' | 'documents'

  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [employeeFormData, setEmployeeFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    roleCategory: 'developer_mid',
    designation: 'Software Developer (Mid Level)',
    department: 'Software Engineering',
    employmentType: 'Full-time',
    status: 'active',
    joiningDate: new Date().toISOString().split('T')[0],
    probationMonths: 3,
    salaryBDT: 65000,
    workplace: 'Hybrid (Dhaka Engineering Hub / Remote)',
    reportingTo: 'MD. Rezaul Karim, Project Manager & Team Lead',
    address: '',
    nidOrPassport: '',
    emergencyContact: '',
    responsibilitiesText: '',
    notes: '',
  })

  // Document Generation Modal
  const [showDocModal, setShowDocModal] = useState(false)
  const [targetEmployee, setTargetEmployee] = useState(null)
  const [docFormData, setDocFormData] = useState({
    documentType: 'appointment_letter',
    documentRef: '',
    issueDate: new Date().toISOString().split('T')[0],
    effectiveDate: '',
    salaryBDT: 0,
    probationMonths: 3,
    workplace: '',
    reportingTo: 'MD. Rezaul Karim, Project Manager & Team Lead',
    signatoryName: 'MD. Rezaul Karim',
    signatoryRole: 'Project Manager & Team Lead',
    signatoryCompany: 'IoT-Berg Software Engineering Team',
    responsibilitiesText: '',
  })

  // Action states
  const [isSaving, setIsSaving] = useState(false)
  const [generatingDocId, setGeneratingDocId] = useState(null)
  const [copiedDocId, setCopiedDocId] = useState(null)
  const [successToast, setSuccessToast] = useState(null)

  // Cloud Sync
  useEffect(() => {
    employeeStore.syncFromCloud().then((res) => {
      if (res?.storageBackend) setStorageBackend(res.storageBackend)
      if (res?.employees) setEmployees(res.employees)
      if (res?.documents) setDocuments(res.documents)
    })
  }, [])

  const showNotification = (msg) => {
    setSuccessToast(msg)
    setTimeout(() => setSuccessToast(null), 3500)
  }

  // Derived Statistics
  const stats = useMemo(() => {
    const total = employees.length
    const developers = employees.filter((e) =>
      ['developer_mid_junior', 'developer_mid', 'developer_senior'].includes(e.roleCategory),
    ).length
    const sqa = employees.filter((e) => e.roleCategory === 'sqa').length
    const hr = employees.filter((e) => e.roleCategory === 'hr').length
    const interns = employees.filter((e) => e.roleCategory === 'intern').length
    const productAndMgmt = employees.filter((e) =>
      ['product_manager', 'management'].includes(e.roleCategory),
    ).length
    const accounts = employees.filter((e) => e.roleCategory === 'accounts').length
    const probationCount = employees.filter((e) => e.status === 'probation').length

    return { total, developers, sqa, hr, interns, productAndMgmt, accounts, probationCount }
  }, [employees])

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (selectedCategory !== 'all' && emp.roleCategory !== selectedCategory) {
        return false
      }
      if (statusFilter !== 'all' && emp.status !== statusFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = (emp.fullName || '').toLowerCase().includes(q)
        const matchId = (emp.employeeId || '').toLowerCase().includes(q)
        const matchDesignation = (emp.designation || '').toLowerCase().includes(q)
        const matchEmail = (emp.email || '').toLowerCase().includes(q)
        const matchPhone = (emp.phone || '').toLowerCase().includes(q)
        if (!matchName && !matchId && !matchDesignation && !matchEmail && !matchPhone) {
          return false
        }
      }
      return true
    })
  }, [employees, selectedCategory, statusFilter, searchQuery])

  // Handle Category Change in Employee Form (auto-fills default role parameters)
  const handleRoleCategoryChange = (categoryKey) => {
    const roleConfig = employeeStore.getRoleConfig(categoryKey)
    setEmployeeFormData((prev) => ({
      ...prev,
      roleCategory: categoryKey,
      designation: roleConfig.defaultDesignations[0],
      department: roleConfig.defaultDepartment,
      employmentType: roleConfig.defaultEmploymentType,
      probationMonths: roleConfig.defaultProbationMonths,
      salaryBDT: roleConfig.defaultSalaryBDT,
      responsibilitiesText: roleConfig.defaultResponsibilities.join('\n'),
    }))
  }

  const handleOpenAddModal = () => {
    const defaultRole = employeeStore.getRoleConfig('developer_mid')
    setEditingEmployee(null)
    setEmployeeFormData({
      fullName: '',
      email: '',
      phone: '',
      roleCategory: 'developer_mid',
      designation: defaultRole.defaultDesignations[0],
      department: defaultRole.defaultDepartment,
      employmentType: defaultRole.defaultEmploymentType,
      status: 'active',
      joiningDate: new Date().toISOString().split('T')[0],
      probationMonths: defaultRole.defaultProbationMonths,
      salaryBDT: defaultRole.defaultSalaryBDT,
      workplace: 'Hybrid (Dhaka Engineering Hub / Remote)',
      reportingTo: 'MD. Rezaul Karim, Project Manager & Team Lead',
      address: '',
      nidOrPassport: '',
      emergencyContact: '',
      responsibilitiesText: defaultRole.defaultResponsibilities.join('\n'),
      notes: '',
    })
    setShowEmployeeModal(true)
  }

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp)
    const roleConfig = employeeStore.getRoleConfig(emp.roleCategory)
    const resp =
      Array.isArray(emp.responsibilities) && emp.responsibilities.length > 0
        ? emp.responsibilities
        : roleConfig.defaultResponsibilities

    setEmployeeFormData({
      fullName: emp.fullName || '',
      email: emp.email || '',
      phone: emp.phone || '',
      roleCategory: emp.roleCategory || 'developer_mid',
      designation: emp.designation || '',
      department: emp.department || 'Software Engineering',
      employmentType: emp.employmentType || 'Full-time',
      status: emp.status || 'active',
      joiningDate: emp.joiningDate || '',
      probationMonths: emp.probationMonths != null ? emp.probationMonths : 3,
      salaryBDT: emp.salaryBDT != null ? emp.salaryBDT : 0,
      workplace: emp.workplace || 'Hybrid (Dhaka Engineering Hub / Remote)',
      reportingTo: emp.reportingTo || 'MD. Rezaul Karim, Project Manager & Team Lead',
      address: emp.address || '',
      nidOrPassport: emp.nidOrPassport || '',
      emergencyContact: emp.emergencyContact || '',
      responsibilitiesText: resp.join('\n'),
      notes: emp.notes || '',
    })
    setShowEmployeeModal(true)
  }

  const handleSaveEmployee = async (e) => {
    e.preventDefault()
    if (!employeeFormData.fullName.trim()) {
      alert('Please enter employee full name')
      return
    }

    setIsSaving(true)
    try {
      const respArray = employeeFormData.responsibilitiesText
        .split('\n')
        .map((s) => s.trim().replace(/^[-*•\d.]+\s*/, ''))
        .filter(Boolean)

      const payload = {
        ...employeeFormData,
        id: editingEmployee ? editingEmployee.id : undefined,
        employeeId: editingEmployee ? editingEmployee.employeeId : undefined,
        responsibilities: respArray,
      }
      const saved = await employeeStore.saveEmployeeAsync(payload)
      setEmployees(employeeStore.getAllEmployees())
      setShowEmployeeModal(false)
      showNotification(
        editingEmployee
          ? `Updated record for ${saved.fullName} (${saved.employeeId})`
          : `Added new employee ${saved.fullName} (${saved.employeeId})`,
      )
    } catch (err) {
      console.error('Failed to save employee:', err)
      alert(`Error saving employee: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteEmployee = async (emp) => {
    if (confirm(`Are you sure you want to remove ${emp.fullName} (${emp.employeeId}) from records?`)) {
      await employeeStore.deleteEmployeeAsync(emp.id)
      setEmployees(employeeStore.getAllEmployees())
      showNotification(`Employee ${emp.fullName} removed.`)
    }
  }

  // Open Document Generator Modal for Employee
  const handleOpenDocModal = (emp) => {
    setTargetEmployee(emp)
    const isIntern = emp.roleCategory === 'intern'
    const newRef = generateAppointmentRef(documents.map((d) => d.documentRef))
    const respList =
      Array.isArray(emp.responsibilities) && emp.responsibilities.length > 0
        ? emp.responsibilities
        : employeeStore.getRoleConfig(emp.roleCategory).defaultResponsibilities

    setDocFormData({
      documentType: isIntern ? 'internship_agreement' : 'appointment_letter',
      documentRef: newRef,
      issueDate: new Date().toISOString().split('T')[0],
      effectiveDate: emp.joiningDate || new Date().toISOString().split('T')[0],
      salaryBDT: emp.salaryBDT || 0,
      probationMonths: emp.probationMonths || 3,
      workplace: emp.workplace || 'Hybrid (Dhaka Engineering Hub / Remote)',
      reportingTo: emp.reportingTo || 'MD. Rezaul Karim, Project Manager & Team Lead',
      signatoryName: 'MD. Rezaul Karim',
      signatoryRole: 'Project Manager & Team Lead',
      signatoryCompany: 'IoT-Berg Software Engineering Team',
      responsibilitiesText: respList.join('\n'),
    })
    setShowDocModal(true)
  }

  // Compile and Download PDF via pdf-lagbe
  const handleGeneratePdf = async (e) => {
    if (e) e.preventDefault()
    if (!targetEmployee) return

    setGeneratingDocId(targetEmployee.id)
    try {
      const respArray = docFormData.responsibilitiesText
        .split('\n')
        .map((s) => s.trim().replace(/^[-*•\d.]+\s*/, ''))
        .filter(Boolean)

      const docRecord = {
        employeeId: targetEmployee.employeeId,
        candidateName: targetEmployee.fullName,
        designation: targetEmployee.designation,
        roleCategory: targetEmployee.roleCategory,
        department: targetEmployee.department,
        documentType: docFormData.documentType,
        documentRef: docFormData.documentRef,
        issueDate: docFormData.issueDate,
        effectiveDate: docFormData.effectiveDate,
        salaryBDT: docFormData.salaryBDT,
        salaryInWords: numberToWordsBDT(docFormData.salaryBDT),
        probationMonths: docFormData.probationMonths,
        workplace: docFormData.workplace,
        reportingTo: docFormData.reportingTo,
        signatoryName: docFormData.signatoryName,
        signatoryRole: docFormData.signatoryRole,
        signatoryCompany: docFormData.signatoryCompany,
        address: targetEmployee.address,
        phone: targetEmployee.phone,
        email: targetEmployee.email,
        responsibilities: respArray,
      }

      // 1. Compile HTML
      const html = await compileEmployeeDocumentHtml(docRecord, window.location.origin)

      // 2. Call PDF Service
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

      // 3. Trigger Download
      const blobUrl = URL.createObjectURL(res.blob)
      const a = document.createElement('a')
      a.href = blobUrl
      const filename = `${docFormData.documentType === 'internship_agreement' ? 'Internship-Agreement' : 'Appointment-Letter'}-${targetEmployee.fullName.replace(/\s+/g, '_')}-${docFormData.documentRef}.pdf`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)

      // 4. Save to Document History in DB
      await employeeStore.saveDocumentAsync(docRecord)
      setDocuments(employeeStore.getAllDocuments())

      showNotification(`Generated & saved ${filename}`)
      setShowDocModal(false)
    } catch (err) {
      console.error('Failed to generate appointment letter PDF:', err)
      alert(`PDF Generation failed: ${err.message}`)
    } finally {
      setGeneratingDocId(null)
    }
  }

  // Download directly from Generated Documents list
  const handleDownloadSavedDoc = async (docRecord) => {
    setGeneratingDocId(docRecord.id)
    try {
      const html = await compileEmployeeDocumentHtml(docRecord, window.location.origin)
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
      a.download = `${docRecord.documentType === 'internship_agreement' ? 'Internship-Agreement' : 'Appointment-Letter'}-${(docRecord.candidateName || 'Document').replace(/\s+/g, '_')}-${docRecord.documentRef}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
      showNotification(`Downloaded ${docRecord.documentRef}`)
    } catch (err) {
      alert(`PDF Download error: ${err.message}`)
    } finally {
      setGeneratingDocId(null)
    }
  }

  const handleCopyVerifyUrl = async (docRef) => {
    const url = `${window.location.origin}/verify?doc=${encodeURIComponent(docRef)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedDocId(docRef)
      setTimeout(() => setCopiedDocId(null), 2000)
    } catch {
      prompt('Copy document verification link:', url)
    }
  }

  const handleDeleteDocument = async (id) => {
    if (confirm('Delete this generated document record?')) {
      await employeeStore.deleteDocumentAsync(id)
      setDocuments(employeeStore.getAllDocuments())
      showNotification('Document record deleted.')
    }
  }

  const currentRoleCfg = employeeStore.getRoleConfig(employeeFormData.roleCategory)

  return (
    <div className="admin-subpage-view">
      {/* Toast Notification */}
      {successToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 99999,
            background: 'linear-gradient(135deg, #0f766e, #0d9488)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            fontSize: '13.5px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✓</span>
          <span>{successToast}</span>
        </div>
      )}

      {/* Page Header matching Admin Design System */}
      <div className="subpage-header glass-panel">
        <div className="subpage-copy">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.2rem' }}>
            <span className="section-label">Team &amp; HR Operations</span>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: '700',
                padding: '1px 7px',
                borderRadius: '999px',
                background: storageBackend.includes('neon') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: storageBackend.includes('neon') ? '#10b981' : '#60a5fa',
                border: storageBackend.includes('neon') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              ● {storageBackend.includes('neon') ? 'Neon Postgres' : 'Cloud Blob'}
            </span>
          </div>
          <h2 className="subpage-title">Employee Management &amp; Documents</h2>
          <p className="subpage-desc">
            Assign team roles (Intern, Mid-Junior, Mid, Senior Developer, Product Manager, Management, Accounts),
            manage compensation, and issue official corporate appointment letter PDFs with digital verification.
          </p>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={handleOpenAddModal}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Key KPI Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card glass-panel">
          <div className="stat-card-icon emerald">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="stat-card-data">
            <span className="stat-label">Total Team</span>
            <strong className="stat-value">{stats.total}</strong>
            <span className="stat-subtext">Active &amp; Onboarding</span>
          </div>
        </div>

        <div className="admin-stat-card glass-panel">
          <div className="stat-card-icon blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <div className="stat-card-data">
            <span className="stat-label">Software Developers</span>
            <strong className="stat-value" style={{ color: '#0ea5e9' }}>{stats.developers}</strong>
            <span className="stat-subtext">Junior · Mid · Senior</span>
          </div>
        </div>

        <div className="admin-stat-card glass-panel">
          <div className="stat-card-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-card-data">
            <span className="stat-label">SQA Squad</span>
            <strong className="stat-value" style={{ color: '#ec4899' }}>{stats.sqa}</strong>
            <span className="stat-subtext">SQA · Junior · Senior</span>
          </div>
        </div>

        <div className="admin-stat-card glass-panel">
          <div className="stat-card-icon purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="stat-card-data">
            <span className="stat-label">Internship Squad</span>
            <strong className="stat-value" style={{ color: '#818cf8' }}>{stats.interns}</strong>
            <span className="stat-subtext">3-Month Training Programs</span>
          </div>
        </div>

        <div className="admin-stat-card glass-panel">
          <div className="stat-card-icon amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div className="stat-card-data">
            <span className="stat-label">HR, Product &amp; Leadership</span>
            <strong className="stat-value" style={{ color: '#f59e0b' }}>{stats.hr + stats.productAndMgmt + stats.accounts}</strong>
            <span className="stat-subtext">{stats.hr} HR · {stats.productAndMgmt} Prod/Mgmt · {stats.accounts} Acct</span>
          </div>
        </div>
      </div>

      {/* Main Tab Nav */}
      <div className="admin-tab-nav">
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className={`admin-tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
        >
          <span>👥 Employee Directory</span>
          <span className="admin-tab-badge">{employees.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`admin-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
        >
          <span>📄 Issued Appointment Letters &amp; Records</span>
          <span className="admin-tab-badge">{documents.length}</span>
        </button>
      </div>

      {activeTab === 'directory' && (
        <>
          {/* Search & Toolbar */}
          <div className="search-filter-bar glass-panel" style={{ flexWrap: 'wrap' }}>
            <div className="search-input-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, ID (e.g. IB-EMP), designation, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <select
                className="form-input"
                style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', minWidth: '130px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="probation">Probation / Intern</option>
                <option value="onboarding">Onboarding</option>
                <option value="former">Former</option>
              </select>

              <span className="filter-count">
                {filteredEmployees.length} {filteredEmployees.length === 1 ? 'Member' : 'Members'}
              </span>
            </div>
          </div>

          {/* Role Category Filter Pills */}
          <div className="role-filter-row">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`role-filter-pill ${selectedCategory === 'all' ? 'active' : ''}`}
            >
              All Roles ({employees.length})
            </button>

            {ROLE_CATEGORIES.map((cat) => {
              const count = employees.filter((e) => e.roleCategory === cat.id).length
              const isSelected = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`role-filter-pill ${isSelected ? 'active' : ''}`}
                  style={isSelected ? { borderColor: cat.color, color: cat.color, background: cat.bg } : undefined}
                >
                  {cat.label} ({count})
                </button>
              )
            })}
          </div>

          {/* Employees Table Card */}
          <div className="orders-table-card glass-panel">
            <div className="admin-table-scroller">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Employee &amp; ID</th>
                    <th>Role &amp; Category</th>
                    <th>Department</th>
                    <th>Compensation (BDT)</th>
                    <th>Joining Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
                        No employees match the selected criteria. Click "+ Add New Employee" to register team members.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const roleCfg = employeeStore.getRoleConfig(emp.roleCategory)
                      const isProbation = emp.status === 'probation' || emp.roleCategory === 'intern'

                      return (
                        <tr key={emp.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                className="emp-avatar-circle"
                                style={{
                                  background: roleCfg.bg,
                                  color: roleCfg.color,
                                  border: `1.5px solid ${roleCfg.color}`,
                                }}
                              >
                                {(emp.fullName || 'E').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.88rem' }}>
                                  {emp.fullName}
                                </div>
                                <div className="mono-ref-sm">
                                  {emp.employeeId} {emp.phone ? `· ${emp.phone}` : ''}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div>
                              <strong style={{ color: 'var(--text)', fontSize: '0.84rem' }}>
                                {emp.designation}
                              </strong>
                              <div>
                                <span
                                  className="emp-role-tag"
                                  style={{
                                    background: roleCfg.bg,
                                    color: roleCfg.color,
                                    border: `1px solid ${roleCfg.border}`,
                                  }}
                                >
                                  {roleCfg.label}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{emp.department}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{emp.employmentType || 'Full-time'}</div>
                          </td>

                          <td>
                            <div style={{ fontWeight: '700', color: 'var(--brand-strong)', fontSize: '0.88rem', fontFamily: 'var(--font-mono)' }}>
                              BDT {Number(emp.salaryBDT || 0).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                              {emp.roleCategory === 'intern' ? 'Monthly Stipend' : 'Monthly Gross'}
                            </div>
                          </td>

                          <td>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{emp.joiningDate || '—'}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                              Probation: {emp.probationMonths || 3} mo
                            </div>
                          </td>

                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: '0.68rem',
                                fontWeight: '700',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '999px',
                                background: isProbation ? 'rgba(251, 191, 36, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                                color: isProbation ? '#f59e0b' : '#10b981',
                                border: isProbation
                                  ? '1px solid rgba(251, 191, 36, 0.3)'
                                  : '1px solid rgba(52, 211, 153, 0.3)',
                              }}
                            >
                              ● {emp.status ? emp.status.toUpperCase() : 'ACTIVE'}
                            </span>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="button button-sm button-primary"
                                onClick={() => handleOpenDocModal(emp)}
                                title="Generate Appointment Letter PDF"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <span>📄</span>
                                <span>Generate Document</span>
                              </button>

                              <button
                                type="button"
                                className="button button-sm button-secondary"
                                onClick={() => handleOpenEditModal(emp)}
                                title="Edit Employee Details"
                              >
                                ✏️
                              </button>

                              <button
                                type="button"
                                className="button button-sm button-ghost"
                                onClick={() => handleDeleteEmployee(emp)}
                                title="Delete Employee Record"
                                style={{ color: '#ef4444' }}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Generated Documents Tab */}
      {activeTab === 'documents' && (
        <div className="orders-table-card glass-panel">
          <div className="admin-table-scroller">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Document Reference</th>
                  <th>Candidate Name &amp; Role</th>
                  <th>Document Type</th>
                  <th>Issue Date</th>
                  <th>Remuneration</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
                      No appointment letters or documents issued yet. Select an employee in the directory and click "Generate Document".
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => {
                    const isInternDoc = doc.documentType === 'internship_agreement'

                    return (
                      <tr key={doc.id}>
                        <td>
                          <strong className="mono-ref" style={{ fontSize: '0.88rem' }}>
                            {doc.documentRef}
                          </strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Emp ID: {doc.employeeId || '—'}</span>
                        </td>

                        <td>
                          <div style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.88rem' }}>
                            {doc.candidateName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{doc.designation}</div>
                        </td>

                        <td>
                          <span
                            className="emp-role-tag"
                            style={{
                              background: isInternDoc ? 'rgba(129, 140, 248, 0.15)' : 'rgba(15, 118, 110, 0.15)',
                              color: isInternDoc ? '#818cf8' : '#2dd4bf',
                              border: isInternDoc ? '1px solid rgba(129, 140, 248, 0.3)' : '1px solid rgba(15, 118, 110, 0.3)',
                            }}
                          >
                            {isInternDoc ? 'Internship Agreement' : 'Official Appointment Letter'}
                          </span>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{doc.issueDate}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Effective: {doc.effectiveDate}</div>
                        </td>

                        <td>
                          <div style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.84rem', fontFamily: 'var(--font-mono)' }}>
                            BDT {Number(doc.salaryBDT || 0).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                            {isInternDoc ? 'Monthly Stipend' : 'Monthly Gross'}
                          </div>
                        </td>

                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: '0.68rem',
                              fontWeight: '700',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '999px',
                              background: 'rgba(52, 211, 153, 0.15)',
                              color: '#10b981',
                              border: '1px solid rgba(52, 211, 153, 0.3)',
                            }}
                          >
                            ✓ ISSUED &amp; VERIFIED
                          </span>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="button button-sm button-primary"
                              onClick={() => handleDownloadSavedDoc(doc)}
                              disabled={generatingDocId === doc.id}
                              title="Download Official PDF"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <span>{generatingDocId === doc.id ? '⏳' : '📥'}</span>
                              <span>{generatingDocId === doc.id ? 'Compiling...' : 'PDF'}</span>
                            </button>

                            <button
                              type="button"
                              className="button button-sm button-secondary"
                              onClick={() => handleCopyVerifyUrl(doc.documentRef)}
                              title="Copy Dynamic Verification Link"
                            >
                              {copiedDocId === doc.documentRef ? '✓ Copied' : '🔗 Link'}
                            </button>

                            <button
                              type="button"
                              className="button button-sm button-ghost"
                              onClick={() => handleDeleteDocument(doc.id)}
                              title="Delete Document Record"
                              style={{ color: '#ef4444' }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT EMPLOYEE MODAL (Standard App Modal Design) */}
      {showEmployeeModal && (
        <div className="modal-backdrop" onClick={() => setShowEmployeeModal(false)}>
          <div
            className="modal-dialog modal-dialog-lg glass-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="section-label">Team &amp; HR Records</span>
                <h3 className="modal-title">
                  {editingEmployee ? `Edit Employee (${editingEmployee.fullName})` : 'Add New Employee to Team'}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowEmployeeModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="modal-form">
              {/* SECTION 1: ROLE CATEGORY & POSITION */}
              <div className="modal-section-heading">
                <span className="badge">01</span>
                <span>Role Category &amp; Designation</span>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="emp-role-cat">Company Role Category * (Auto-sets defaults)</label>
                  <select
                    id="emp-role-cat"
                    className="form-input"
                    value={employeeFormData.roleCategory}
                    onChange={(e) => handleRoleCategoryChange(e.target.value)}
                    style={{ fontWeight: '600' }}
                  >
                    {ROLE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label} ({cat.defaultDepartment})
                      </option>
                    ))}
                  </select>
                  <span className="input-hint">
                    Selecting a category pre-fills standard designations, department, salary, and responsibilities.
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="emp-desig">Job Designation / Title *</label>
                  <input
                    id="emp-desig"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Software Developer (Mid Level)"
                    value={employeeFormData.designation}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, designation: e.target.value })}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {currentRoleCfg.defaultDesignations.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setEmployeeFormData({ ...employeeFormData, designation: d })}
                        style={{
                          fontSize: '0.68rem',
                          background: 'var(--surface-3)',
                          border: '1px solid var(--stroke)',
                          borderRadius: '4px',
                          color: 'var(--text-secondary)',
                          padding: '1px 6px',
                          cursor: 'pointer',
                        }}
                      >
                        + {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-row-3col">
                <div className="form-group">
                  <label htmlFor="emp-dept">Department</label>
                  <input
                    id="emp-dept"
                    type="text"
                    className="form-input"
                    value={employeeFormData.department}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, department: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emp-emp-type">Employment Type</label>
                  <select
                    id="emp-emp-type"
                    className="form-input"
                    value={employeeFormData.employmentType}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, employmentType: e.target.value })}
                  >
                    <option value="Full-time">Full-time Regular</option>
                    <option value="Internship">Structured Internship</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Project Contract</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="emp-status">Record Status</label>
                  <select
                    id="emp-status"
                    className="form-input"
                    value={employeeFormData.status}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="probation">Probation / Intern</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="former">Former Employee</option>
                  </select>
                </div>
              </div>

              {/* SECTION 2: PERSONAL & CONTACT PARTICULARS */}
              <div className="modal-section-heading">
                <span className="badge">02</span>
                <span>Personal &amp; Contact Particulars</span>
              </div>

              <div className="form-row-3col">
                <div className="form-group">
                  <label htmlFor="emp-fullname">Full Name *</label>
                  <input
                    id="emp-fullname"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Tanvir Hossain"
                    value={employeeFormData.fullName}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, fullName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emp-email">Email Address</label>
                  <input
                    id="emp-email"
                    type="email"
                    className="form-input"
                    placeholder="e.g. employee@iotberg.com"
                    value={employeeFormData.email}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emp-phone">Phone Number</label>
                  <input
                    id="emp-phone"
                    type="text"
                    className="form-input"
                    placeholder="e.g. +880 1712 345678"
                    value={employeeFormData.phone}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="emp-addr">Residential Address</label>
                  <input
                    id="emp-addr"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Demra, Dhaka-1360, Bangladesh"
                    value={employeeFormData.address}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emp-nid">NID / Student ID (Optional)</label>
                  <input
                    id="emp-nid"
                    type="text"
                    className="form-input"
                    placeholder="e.g. NID-9182736450"
                    value={employeeFormData.nidOrPassport}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, nidOrPassport: e.target.value })}
                  />
                </div>
              </div>

              {/* SECTION 3: REMUNERATION & WORKING TERMS */}
              <div className="modal-section-heading">
                <span className="badge">03</span>
                <span>Compensation &amp; Working Terms</span>
              </div>

              <div className="form-row-3col">
                <div className="form-group">
                  <label htmlFor="emp-salary">
                    {employeeFormData.roleCategory === 'intern' ? 'Monthly Stipend (BDT) *' : 'Monthly Gross Salary (BDT) *'}
                  </label>
                  <input
                    id="emp-salary"
                    type="number"
                    min="0"
                    step="1000"
                    required
                    className="form-input font-mono"
                    value={employeeFormData.salaryBDT}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, salaryBDT: e.target.value })}
                  />
                  <div className="form-salary-preview">
                    <span>In Words:</span>
                    <strong>{numberToWordsBDT(Number(employeeFormData.salaryBDT) || 0)}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="emp-joining">Effective Joining Date *</label>
                  <input
                    id="emp-joining"
                    type="date"
                    required
                    className="form-input"
                    value={employeeFormData.joiningDate}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, joiningDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emp-probation">Probation Period (Months)</label>
                  <input
                    id="emp-probation"
                    type="number"
                    min="1"
                    max="12"
                    className="form-input"
                    value={employeeFormData.probationMonths}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, probationMonths: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="emp-workplace">Workplace Arrangement</label>
                  <input
                    id="emp-workplace"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Hybrid (Dhaka Engineering Hub / Remote)"
                    value={employeeFormData.workplace}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, workplace: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emp-reporting">Reporting Manager / Authority</label>
                  <input
                    id="emp-reporting"
                    type="text"
                    className="form-input"
                    placeholder="e.g. MD. Rezaul Karim, Project Manager & Team Lead"
                    value={employeeFormData.reportingTo}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, reportingTo: e.target.value })}
                  />
                </div>
              </div>

              {/* SECTION 4: CORE DUTIES & DELIVERABLES */}
              <div className="modal-section-heading">
                <span className="badge">04</span>
                <span>Core Job Duties &amp; Deliverables</span>
              </div>

              <div className="form-group">
                <label htmlFor="emp-duties">Deliverables &amp; Responsibilities (One per line)</label>
                <textarea
                  id="emp-duties"
                  rows="4"
                  className="form-input textarea"
                  placeholder="Enter each core duty on a new line..."
                  value={employeeFormData.responsibilitiesText}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, responsibilitiesText: e.target.value })}
                />
                <span className="input-hint">
                  These duties will be formatted into bullet points on the official Appointment Letter PDF.
                </span>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => setShowEmployeeModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving Record...' : editingEmployee ? 'Save Changes' : 'Create Employee Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE APPOINTMENT LETTER / DOCUMENT MODAL (Standard App Modal Design) */}
      {showDocModal && targetEmployee && (
        <div className="modal-backdrop" onClick={() => setShowDocModal(false)}>
          <div
            className="modal-dialog modal-dialog-lg glass-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="section-label">Official Document Generation</span>
                <h3 className="modal-title">
                  Generate Corporate Document — {targetEmployee.fullName}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowDocModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGeneratePdf} className="modal-form">
              {/* Document Template Selection */}
              <div className="form-group">
                <label htmlFor="doc-type">Select Document Template *</label>
                <select
                  id="doc-type"
                  className="form-input"
                  style={{ fontWeight: '700', color: 'var(--brand-strong)' }}
                  value={docFormData.documentType}
                  onChange={(e) => setDocFormData({ ...docFormData, documentType: e.target.value })}
                >
                  <option value="appointment_letter">Official Letter of Appointment (Comprehensive Contract)</option>
                  <option value="internship_agreement">Internship Offer &amp; Training Agreement</option>
                  <option value="experience_certificate">Official Employment &amp; Remuneration Certificate</option>
                </select>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="doc-ref">Document Reference No * (Non-revealing)</label>
                  <input
                    id="doc-ref"
                    type="text"
                    required
                    className="form-input font-mono"
                    style={{ fontWeight: '700', color: 'var(--brand-strong)' }}
                    value={docFormData.documentRef}
                    onChange={(e) => setDocFormData({ ...docFormData, documentRef: e.target.value })}
                  />
                  <span className="input-hint">Will be embedded in the document header and verification QR code.</span>
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label htmlFor="doc-issue">Issue Date *</label>
                    <input
                      id="doc-issue"
                      type="date"
                      required
                      className="form-input"
                      value={docFormData.issueDate}
                      onChange={(e) => setDocFormData({ ...docFormData, issueDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="doc-effective">Joining Date *</label>
                    <input
                      id="doc-effective"
                      type="date"
                      required
                      className="form-input"
                      value={docFormData.effectiveDate}
                      onChange={(e) => setDocFormData({ ...docFormData, effectiveDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="doc-salary">Remuneration (BDT / mo) *</label>
                  <input
                    id="doc-salary"
                    type="number"
                    required
                    min="0"
                    className="form-input font-mono"
                    value={docFormData.salaryBDT}
                    onChange={(e) => setDocFormData({ ...docFormData, salaryBDT: e.target.value })}
                  />
                  <div className="form-salary-preview">
                    <span>Spelled Words:</span>
                    <strong>{numberToWordsBDT(Number(docFormData.salaryBDT) || 0)}</strong>
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label htmlFor="doc-prob">Probation (Months)</label>
                    <input
                      id="doc-prob"
                      type="number"
                      min="1"
                      max="12"
                      className="form-input"
                      value={docFormData.probationMonths}
                      onChange={(e) => setDocFormData({ ...docFormData, probationMonths: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="doc-workplace">Workplace</label>
                    <input
                      id="doc-workplace"
                      type="text"
                      className="form-input"
                      value={docFormData.workplace}
                      onChange={(e) => setDocFormData({ ...docFormData, workplace: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="doc-duties">Deliverables &amp; Responsibilities (One per line)</label>
                <textarea
                  id="doc-duties"
                  rows="4"
                  className="form-input textarea"
                  value={docFormData.responsibilitiesText}
                  onChange={(e) => setDocFormData({ ...docFormData, responsibilitiesText: e.target.value })}
                />
              </div>

              {/* Authorized Signatory Block Preview */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  background: 'var(--surface-2)',
                  border: '1.5px dashed var(--stroke-strong)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--brand-strong)' }}>
                    Authorized Signatory &amp; Seal
                  </span>
                  <span className="addons-pill-badge">Tamper-Evident SHA-256</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Signatory: </span>
                    <strong style={{ color: 'var(--text)' }}>{docFormData.signatoryName}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Role: </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{docFormData.signatoryRole}</span>
                  </div>
                </div>
                <span className="input-hint" style={{ display: 'block', marginTop: '0.3rem' }}>
                  Includes IoT-Berg official logo, digital authorization seal, and tamper-evident online QR verification code.
                </span>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => setShowDocModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={generatingDocId === targetEmployee.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>{generatingDocId === targetEmployee.id ? '⏳' : '📥'}</span>
                  <span>{generatingDocId === targetEmployee.id ? 'Compiling PDF via Engine...' : 'Download Official PDF Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
