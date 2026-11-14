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
    responsibilities: [],
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
    const interns = employees.filter((e) => e.roleCategory === 'intern').length
    const productAndMgmt = employees.filter((e) =>
      ['product_manager', 'management'].includes(e.roleCategory),
    ).length
    const accounts = employees.filter((e) => e.roleCategory === 'accounts').length
    const probationCount = employees.filter((e) => e.status === 'probation').length

    return { total, developers, interns, productAndMgmt, accounts, probationCount }
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
      responsibilities: [...roleConfig.defaultResponsibilities],
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
      responsibilities: [...defaultRole.defaultResponsibilities],
      notes: '',
    })
    setShowEmployeeModal(true)
  }

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp)
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
      responsibilities: Array.isArray(emp.responsibilities) ? [...emp.responsibilities] : [],
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
      const payload = {
        ...employeeFormData,
        id: editingEmployee ? editingEmployee.id : undefined,
        employeeId: editingEmployee ? editingEmployee.employeeId : undefined,
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

  return (
    <div className="admin-page-container">
      {/* Toast Notification */}
      {successToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #0f766e, #0d9488)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(15, 118, 110, 0.4)',
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

      {/* Header Row */}
      <div className="admin-header-row">
        <div>
          <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Company HR &amp; Team Roster</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '999px',
                background: storageBackend.includes('neon') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: storageBackend.includes('neon') ? '#10b981' : '#60a5fa',
                border: storageBackend.includes('neon') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              ● {storageBackend.includes('neon') ? 'Neon Serverless Postgres' : 'Vercel Cloud Blob'}
            </span>
          </div>
          <h1 className="admin-page-title">Employee Management &amp; Documents</h1>
          <p className="admin-page-desc">
            Assign team roles (Intern, Mid-Junior, Mid, Senior Developer, Product Manager, Management, Accounts),
            manage compensation, and generate official, tamper-evident appointment letter PDFs on corporate letterhead.
          </p>
        </div>

        <div className="admin-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="button button-primary"
            onClick={handleOpenAddModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>+</span>
            <span>Add New Employee</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="stat-card glass-panel">
          <div className="stat-label">Total Team Members</div>
          <div className="stat-val" style={{ color: '#0f766e' }}>{stats.total}</div>
          <div className="stat-sub">Active &amp; Onboarding</div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-label">Software Developers</div>
          <div className="stat-val" style={{ color: '#0ea5e9' }}>{stats.developers}</div>
          <div className="stat-sub">Junior · Mid · Senior</div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-label">Internship Squad</div>
          <div className="stat-val" style={{ color: '#818cf8' }}>{stats.interns}</div>
          <div className="stat-sub">Structured 3-Mo Programs</div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-label">Product &amp; Management</div>
          <div className="stat-val" style={{ color: '#fb923c' }}>{stats.productAndMgmt}</div>
          <div className="stat-sub">Delivery &amp; Leadership</div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-label">Accounts &amp; Finance</div>
          <div className="stat-val" style={{ color: '#10b981' }}>{stats.accounts}</div>
          <div className="stat-sub">Payroll &amp; Ledger</div>
        </div>
      </div>

      {/* Main Tab Nav */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-color, #334155)',
          marginBottom: '1.25rem',
          paddingBottom: '2px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px 6px 0 0',
            fontWeight: '600',
            fontSize: '14px',
            background: activeTab === 'directory' ? 'rgba(15, 118, 110, 0.15)' : 'transparent',
            color: activeTab === 'directory' ? '#2dd4bf' : '#94a3b8',
            border: 'none',
            borderBottom: activeTab === 'directory' ? '2px solid #2dd4bf' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>👥 Employee Directory</span>
          <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '999px' }}>
            {employees.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px 6px 0 0',
            fontWeight: '600',
            fontSize: '14px',
            background: activeTab === 'documents' ? 'rgba(15, 118, 110, 0.15)' : 'transparent',
            color: activeTab === 'documents' ? '#2dd4bf' : '#94a3b8',
            border: 'none',
            borderBottom: activeTab === 'documents' ? '2px solid #2dd4bf' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>📄 Issued Appointment Letters &amp; Records</span>
          <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '999px' }}>
            {documents.length}
          </span>
        </button>
      </div>

      {activeTab === 'directory' && (
        <>
          {/* Filters Bar */}
          <div className="filter-controls-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '1.25rem' }}>
            {/* Search Input */}
            <div style={{ flex: '1 1 240px', minWidth: '220px' }}>
              <input
                type="text"
                placeholder="Search by name, ID (e.g. IB-EMP), designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-search-input"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: '#fff',
                  fontSize: '13.5px',
                }}
              />
            </div>

            {/* Status Select */}
            <div style={{ minWidth: '150px' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: '#fff',
                  fontSize: '13.5px',
                }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="probation">Probation / Intern</option>
                <option value="onboarding">Onboarding</option>
                <option value="former">Former</option>
              </select>
            </div>
          </div>

          {/* Role Category Pills */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              marginBottom: '1.25rem',
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '5px 12px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                background: selectedCategory === 'all' ? '#0f766e' : 'rgba(30, 41, 59, 0.7)',
                color: selectedCategory === 'all' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
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
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    border: `1px solid ${isSelected ? cat.color : 'rgba(148, 163, 184, 0.2)'}`,
                    cursor: 'pointer',
                    background: isSelected ? cat.bg : 'rgba(30, 41, 59, 0.7)',
                    color: isSelected ? cat.color : '#94a3b8',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat.label} ({count})
                </button>
              )
            })}
          </div>

          {/* Employees Table */}
          <div className="admin-table-scroller glass-panel" style={{ borderRadius: '12px', overflow: 'hidden' }}>
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
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
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
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: roleCfg.bg,
                                color: roleCfg.color,
                                border: `1.5px solid ${roleCfg.color}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '700',
                                fontSize: '13.5px',
                                flexShrink: 0,
                              }}
                            >
                              {(emp.fullName || 'E').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '14px' }}>
                                {emp.fullName}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                                {emp.employeeId} {emp.phone ? `· ${emp.phone}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div>
                            <div style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '13px' }}>
                              {emp.designation}
                            </div>
                            <span
                              style={{
                                display: 'inline-block',
                                marginTop: '3px',
                                fontSize: '10.5px',
                                fontWeight: '700',
                                padding: '1px 7px',
                                borderRadius: '4px',
                                background: roleCfg.bg,
                                color: roleCfg.color,
                                border: `1px solid ${roleCfg.border}`,
                              }}
                            >
                              {roleCfg.label}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '13px', color: '#cbd5e1' }}>{emp.department}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{emp.employmentType || 'Full-time'}</div>
                        </td>

                        <td>
                          <div style={{ fontWeight: '700', color: '#2dd4bf', fontSize: '13.5px' }}>
                            BDT {Number(emp.salaryBDT || 0).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {emp.roleCategory === 'intern' ? 'Monthly Stipend' : 'Monthly Gross'}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '13px', color: '#cbd5e1' }}>{emp.joiningDate || '—'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Probation: {emp.probationMonths || 3} mo
                          </div>
                        </td>

                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: isProbation ? 'rgba(251, 191, 36, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                              color: isProbation ? '#fbbf24' : '#34d399',
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
        </>
      )}

      {/* Generated Documents Tab */}
      {activeTab === 'documents' && (
        <div className="admin-table-scroller glass-panel" style={{ borderRadius: '12px', overflow: 'hidden' }}>
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
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    No appointment letters or documents issued yet. Select an employee in the directory and click "Generate Document".
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const isInternDoc = doc.documentType === 'internship_agreement'

                  return (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ fontWeight: '700', color: '#2dd4bf', fontFamily: 'monospace', fontSize: '13.5px' }}>
                          {doc.documentRef}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Emp ID: {doc.employeeId || '—'}</div>
                      </td>

                      <td>
                        <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '13.5px' }}>
                          {doc.candidateName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{doc.designation}</div>
                      </td>

                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: isInternDoc ? 'rgba(129, 140, 248, 0.15)' : 'rgba(15, 118, 110, 0.15)',
                            color: isInternDoc ? '#818cf8' : '#2dd4bf',
                            border: isInternDoc ? '1px solid rgba(129, 140, 248, 0.3)' : '1px solid rgba(15, 118, 110, 0.3)',
                          }}
                        >
                          {isInternDoc ? 'Internship Agreement' : 'Official Appointment Letter'}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '13px', color: '#cbd5e1' }}>{doc.issueDate}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Effective: {doc.effectiveDate}</div>
                      </td>

                      <td>
                        <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '13px' }}>
                          BDT {Number(doc.salaryBDT || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                          {isInternDoc ? 'Monthly Stipend' : 'Monthly Gross'}
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '10.5px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: 'rgba(52, 211, 153, 0.15)',
                            color: '#34d399',
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
      )}

      {/* ADD / EDIT EMPLOYEE MODAL */}
      {showEmployeeModal && (
        <div className="admin-modal-overlay" onClick={() => setShowEmployeeModal(false)}>
          <div
            className="admin-modal-card glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header-row">
              <div>
                <span className="section-label">Team Directory Configuration</span>
                <h3 className="modal-title">
                  {editingEmployee ? `Edit Employee (${editingEmployee.fullName})` : 'Add New Employee'}
                </h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowEmployeeModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="modal-body-form" style={{ marginTop: '1rem' }}>
              {/* Role Category Selector with Highlighting */}
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#f1f5f9' }}>
                  Company Role Category * (Auto-configures defaults)
                </label>
                <select
                  value={employeeFormData.roleCategory}
                  onChange={(e) => handleRoleCategoryChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1.5px solid #0f766e',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  {ROLE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label} ({cat.defaultDepartment})
                    </option>
                  ))}
                </select>
              </div>

              {/* Full Name & Designation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Hossain"
                    value={employeeFormData.fullName}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, fullName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Exact Job Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Developer (Mid Level)"
                    value={employeeFormData.designation}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, designation: e.target.value })}
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Corporate or Personal Email</label>
                  <input
                    type="email"
                    placeholder="e.g. employee@iotberg.com"
                    value={employeeFormData.email}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +880 1712 345678"
                    value={employeeFormData.phone}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Department & Employment Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={employeeFormData.department}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, department: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Employment Classification</label>
                  <select
                    value={employeeFormData.employmentType}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, employmentType: e.target.value })}
                  >
                    <option value="Full-time">Full-time Regular</option>
                    <option value="Internship">Structured Internship</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Project Contract</option>
                  </select>
                </div>
              </div>

              {/* Salary BDT, Joining Date, Probation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '12px' }}>
                <div className="form-group">
                  <label>
                    {employeeFormData.roleCategory === 'intern' ? 'Monthly Stipend (BDT)' : 'Monthly Gross Salary (BDT)'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={employeeFormData.salaryBDT}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, salaryBDT: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Joining Date</label>
                  <input
                    type="date"
                    required
                    value={employeeFormData.joiningDate}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, joiningDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Probation (Mo)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={employeeFormData.probationMonths}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, probationMonths: e.target.value })}
                  />
                </div>
              </div>

              {/* Workplace & Reporting Manager */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Workplace Arrangement</label>
                  <input
                    type="text"
                    value={employeeFormData.workplace}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, workplace: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Reporting Manager / Authority</label>
                  <input
                    type="text"
                    value={employeeFormData.reportingTo}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, reportingTo: e.target.value })}
                  />
                </div>
              </div>

              {/* Residential Address */}
              <div className="form-group">
                <label>Candidate Address</label>
                <input
                  type="text"
                  placeholder="e.g. Demra, Dhaka-1360, Bangladesh"
                  value={employeeFormData.address}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, address: e.target.value })}
                />
              </div>

              {/* Status */}
              <div className="form-group">
                <label>Employment Record Status</label>
                <select
                  value={employeeFormData.status}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, status: e.target.value })}
                >
                  <option value="active">Active Employee</option>
                  <option value="probation">Probation / Intern Assessment</option>
                  <option value="onboarding">Onboarding / Pre-Joining</option>
                  <option value="former">Former Employee</option>
                </select>
              </div>

              <div className="modal-actions-row" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="button button-ghost" onClick={() => setShowEmployeeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={isSaving}>
                  {isSaving ? 'Saving Record...' : editingEmployee ? 'Save Changes' : 'Create Employee Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE APPOINTMENT LETTER / DOCUMENT MODAL */}
      {showDocModal && targetEmployee && (
        <div className="admin-modal-overlay" onClick={() => setShowDocModal(false)}>
          <div
            className="admin-modal-card glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header-row">
              <div>
                <span className="section-label">Official Document Generator</span>
                <h3 className="modal-title">
                  Generate Corporate Document for {targetEmployee.fullName}
                </h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowDocModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleGeneratePdf} className="modal-body-form" style={{ marginTop: '1rem' }}>
              {/* Document Type Selector */}
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#f1f5f9' }}>
                  Document Template
                </label>
                <select
                  value={docFormData.documentType}
                  onChange={(e) => setDocFormData({ ...docFormData, documentType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1.5px solid #0f766e',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  <option value="appointment_letter">Official Letter of Appointment (Comprehensive Contract)</option>
                  <option value="internship_agreement">Internship Offer &amp; Training Agreement</option>
                  <option value="experience_certificate">Official Employment &amp; Remuneration Certificate</option>
                </select>
              </div>

              {/* Ref Number & Issue Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Document Reference Number *</label>
                  <input
                    type="text"
                    required
                    value={docFormData.documentRef}
                    onChange={(e) => setDocFormData({ ...docFormData, documentRef: e.target.value })}
                    style={{ fontFamily: 'monospace', fontWeight: '700', color: '#2dd4bf' }}
                  />
                </div>

                <div className="form-group">
                  <label>Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={docFormData.issueDate}
                    onChange={(e) => setDocFormData({ ...docFormData, issueDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Effective Date & Compensation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Effective Date of Joining *</label>
                  <input
                    type="date"
                    required
                    value={docFormData.effectiveDate}
                    onChange={(e) => setDocFormData({ ...docFormData, effectiveDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Remuneration (BDT / mo) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={docFormData.salaryBDT}
                    onChange={(e) => setDocFormData({ ...docFormData, salaryBDT: e.target.value })}
                  />
                </div>
              </div>

              {/* Reporting & Workplace */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Reporting Line</label>
                  <input
                    type="text"
                    value={docFormData.reportingTo}
                    onChange={(e) => setDocFormData({ ...docFormData, reportingTo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Workplace Arrangement</label>
                  <input
                    type="text"
                    value={docFormData.workplace}
                    onChange={(e) => setDocFormData({ ...docFormData, workplace: e.target.value })}
                  />
                </div>
              </div>

              {/* Responsibilities Text Area */}
              <div className="form-group">
                <label>Key Duties &amp; Responsibilities (One per line)</label>
                <textarea
                  rows="4"
                  value={docFormData.responsibilitiesText}
                  onChange={(e) => setDocFormData({ ...docFormData, responsibilitiesText: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#fff',
                    fontSize: '12.5px',
                    lineHeight: '1.4',
                  }}
                />
              </div>

              {/* Signatory Information */}
              <div style={{ padding: '10px 12px', background: 'rgba(15, 118, 110, 0.1)', border: '1px solid rgba(15, 118, 110, 0.3)', borderRadius: '8px', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#2dd4bf', marginBottom: '6px' }}>
                  Authorized Signatory &amp; Seal
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12.5px' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Signatory: </span>
                    <strong style={{ color: '#fff' }}>{docFormData.signatoryName}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Role: </span>
                    <span style={{ color: '#cbd5e1' }}>{docFormData.signatoryRole}</span>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  * Includes IoT-Berg official logo, digital authorization seal, and tamper-evident QR verification code.
                </div>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="button button-ghost" onClick={() => setShowDocModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={generatingDocId === targetEmployee.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>{generatingDocId === targetEmployee.id ? '⏳' : '📥'}</span>
                  <span>{generatingDocId === targetEmployee.id ? 'Compiling Official PDF...' : 'Download Official PDF'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
