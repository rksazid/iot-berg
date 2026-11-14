import { generateNonRevealingId } from './workOrderStore.js'
import { numberToWordsBDT } from './numberToWords.js'

const EMPLOYEES_STORAGE_KEY = 'iotberg_employees_v1'
const EMPLOYEE_DOCS_STORAGE_KEY = 'iotberg_employee_docs_v1'
const BACKEND_INFO_KEY = 'iotberg_storage_backend'

export const ROLE_CATEGORIES = [
  {
    id: 'intern',
    label: 'Intern',
    shortLabel: 'Intern',
    color: '#818cf8', // Indigo
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.3)',
    defaultDepartment: 'Software Engineering',
    defaultEmploymentType: 'Internship',
    defaultProbationMonths: 3,
    defaultSalaryBDT: 15000,
    salaryLabel: 'Monthly Stipend',
    defaultDesignations: [
      'Software Engineering Intern',
      'Frontend Developer Intern',
      'Backend & Cloud Intern',
      'Product & UI/UX Intern',
      'Accounts & Finance Intern',
      'Operations & Management Intern',
    ],
    defaultResponsibilities: [
      'Contribute to production web and cloud feature development under senior engineering mentorship.',
      'Participate in daily standups, technical sprint retrospectives, and architecture design discussions.',
      'Implement responsive UI components and backend REST/GraphQL endpoints with unit test coverage.',
      'Collaborate on bug triage, QA verification, and technical documentation.',
    ],
  },
  {
    id: 'developer_mid_junior',
    label: 'Software Developer (Mid-Junior Level)',
    shortLabel: 'Mid-Junior Dev',
    color: '#38bdf8', // Sky
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.3)',
    defaultDepartment: 'Software Engineering',
    defaultEmploymentType: 'Full-time',
    defaultProbationMonths: 3,
    defaultSalaryBDT: 38000,
    salaryLabel: 'Monthly Gross Salary',
    defaultDesignations: [
      'Software Developer (Junior Level)',
      'Software Developer (Mid-Junior Level)',
      'Associate Full-Stack Developer',
      'Associate Frontend Developer',
    ],
    defaultResponsibilities: [
      'Develop, test, and maintain client-facing web applications and cloud API integrations.',
      'Collaborate with Senior Engineers to write clean, modular, and maintainable production code.',
      'Participate in peer code reviews, CI/CD pipeline deployments, and bug resolution cycles.',
      'Ensure cross-browser compatibility, responsive performance, and high code test coverage.',
    ],
  },
  {
    id: 'developer_mid',
    label: 'Software Developer (Mid Level)',
    shortLabel: 'Mid Dev',
    color: '#2dd4bf', // Teal
    bg: 'rgba(45, 212, 191, 0.12)',
    border: 'rgba(45, 212, 191, 0.3)',
    defaultDepartment: 'Software Engineering',
    defaultEmploymentType: 'Full-time',
    defaultProbationMonths: 3,
    defaultSalaryBDT: 65000,
    salaryLabel: 'Monthly Gross Salary',
    defaultDesignations: [
      'Software Developer (Mid Level)',
      'Full-Stack Software Engineer',
      'Backend & Cloud Engineer',
      'Frontend Specialist',
    ],
    defaultResponsibilities: [
      'Architect, develop, and deliver scalable full-stack web applications and microservices.',
      'Manage database schemas, query optimizations, and API contracts (PostgreSQL / Neon, REST).',
      'Lead sprint technical tasks, review pull requests, and enforce high coding standards.',
      'Mentor junior engineers and interns to accelerate team productivity and technical skill growth.',
    ],
  },
  {
    id: 'developer_senior',
    label: 'Software Developer (Senior Level)',
    shortLabel: 'Senior Dev',
    color: '#34d399', // Emerald
    bg: 'rgba(52, 211, 153, 0.12)',
    border: 'rgba(52, 211, 153, 0.3)',
    defaultDepartment: 'Software Engineering',
    defaultEmploymentType: 'Full-time',
    defaultProbationMonths: 3,
    defaultSalaryBDT: 110000,
    salaryLabel: 'Monthly Gross Salary',
    defaultDesignations: [
      'Software Developer (Senior Level)',
      'Senior Full-Stack Engineer',
      'Lead Cloud Architect',
      'Principal Software Engineer',
    ],
    defaultResponsibilities: [
      'Provide architectural leadership for enterprise IoT, web, and distributed cloud applications.',
      'Drive core system performance, fault tolerance, security audits, and cloud infrastructure scalability.',
      'Direct technical RFCs, sprint planning, engineering standards, and release governance.',
      'Collaborate with Product Management to translate business goals into technical specifications.',
    ],
  },
  {
    id: 'product_manager',
    label: 'Product Manager',
    shortLabel: 'Product Manager',
    color: '#fb923c', // Orange
    bg: 'rgba(251, 146, 60, 0.12)',
    border: 'rgba(251, 146, 60, 0.3)',
    defaultDepartment: 'Product & Delivery',
    defaultEmploymentType: 'Full-time',
    defaultProbationMonths: 3,
    defaultSalaryBDT: 75000,
    salaryLabel: 'Monthly Gross Salary',
    defaultDesignations: [
      'Product Manager',
      'Associate Product Manager',
      'Senior Product Manager',
      'Technical Product Owner',
    ],
    defaultResponsibilities: [
      'Own product roadmap, sprint backlogs, user story definitions, and functional specifications.',
      'Bridge client expectations with engineering execution to guarantee on-time project deliveries.',
      'Define OKRs, track key delivery metrics, and coordinate user acceptance testing (UAT).',
      'Facilitate agile sprint planning, backlog grooming, and customer feedback iterations.',
    ],
  },
  {
    id: 'management',
    label: 'Management',
    shortLabel: 'Management',
    color: '#c084fc', // Purple
    bg: 'rgba(192, 132, 252, 0.12)',
    border: 'rgba(192, 132, 252, 0.3)',
    defaultDepartment: 'Executive Management',
    defaultEmploymentType: 'Full-time',
    defaultProbationMonths: 3,
    defaultSalaryBDT: 95000,
    salaryLabel: 'Monthly Gross Salary',
    defaultDesignations: [
      'Project Manager & Team Lead',
      'Engineering Manager',
      'Technical Operations Director',
      'Operations & Delivery Lead',
    ],
    defaultResponsibilities: [
      'Lead organizational operations, strategic client partnerships, and high-impact deliverables.',
      'Direct cross-functional squads, hiring pipelines, performance reviews, and operational budgets.',
      'Oversee corporate contracts, work order executions, and enterprise SLA compliance.',
      'Foster a culture of technical excellence, continuous improvement, and customer satisfaction.',
    ],
  },
  {
    id: 'accounts',
    label: 'Accounts',
    shortLabel: 'Accounts',
    color: '#2dd4bf', // Teal
    bg: 'rgba(45, 212, 191, 0.12)',
    border: 'rgba(45, 212, 191, 0.3)',
    defaultDepartment: 'Finance & Accounts',
    defaultEmploymentType: 'Full-time',
    defaultProbationMonths: 3,
    defaultSalaryBDT: 45000,
    salaryLabel: 'Monthly Gross Salary',
    defaultDesignations: [
      'Accounts & Finance Executive',
      'Finance & Payroll Specialist',
      'Senior Accountant',
      'Finance Manager',
    ],
    defaultResponsibilities: [
      'Manage company bookkeeping, bank reconciliations, accounts payable, and accounts receivable.',
      'Oversee monthly employee payroll calculations, stipend disbursements, and tax reporting.',
      'Track client payment receipts, milestone settlements, and project financial balances.',
      'Prepare periodic balance sheets, profit & loss summaries, and audit trail documentation.',
    ],
  },
]

export function generateEmployeeId(existingIds = []) {
  return generateNonRevealingId('IB-EMP', existingIds)
}

export function generateAppointmentRef(existingIds = []) {
  return generateNonRevealingId('IB-APP', existingIds)
}

export function generateDocRef(type = 'DOC', existingIds = []) {
  const prefix = type === 'internship' ? 'IB-INT' : type === 'appointment' ? 'IB-APP' : 'IB-DOC'
  return generateNonRevealingId(prefix, existingIds)
}

const INITIAL_EMPLOYEES = [
  {
    id: 'IB-EMP-2401',
    employeeId: 'IB-EMP-2401',
    fullName: 'MD. Rezaul Karim',
    email: 'rksazid@gmail.com',
    phone: '+880 1712-345678',
    designation: 'Project Manager & Team Lead',
    roleCategory: 'management',
    department: 'Executive Management',
    employmentType: 'Full-time',
    status: 'active',
    joiningDate: '2024-01-15',
    probationMonths: 3,
    salaryBDT: 95000,
    salaryInWords: 'Ninety-Five Thousand BDT Only',
    workplace: 'Hybrid (Dhaka Engineering Hub / Remote)',
    reportingTo: 'Board of Directors / Team IoT-Berg',
    address: 'Demra, Dhaka-1360, Bangladesh',
    nidOrPassport: 'NID-8219401829',
    emergencyContact: 'Mrs. Karim (+880 1711-000000)',
    responsibilities: [
      'Lead company technical operations, client partnerships, and high-impact deliverables.',
      'Oversee engineering squad sprint milestones, code governance, and architecture.',
      'Maintain corporate contracts, work order executions, and enterprise SLAs.',
    ],
    notes: 'Co-founder & Team Lead of IoT-Berg Software Engineering Team.',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2026-11-10T12:00:00.000Z',
  },
  {
    id: 'IB-EMP-2408',
    employeeId: 'IB-EMP-2408',
    fullName: 'Tanvir Hossain',
    email: 'tanvir.dev@iotberg.com',
    phone: '+880 1819-456789',
    designation: 'Software Developer (Senior Level)',
    roleCategory: 'developer_senior',
    department: 'Software Engineering',
    employmentType: 'Full-time',
    status: 'active',
    joiningDate: '2024-03-01',
    probationMonths: 3,
    salaryBDT: 110000,
    salaryInWords: 'One Lakh Ten Thousand BDT Only',
    workplace: 'Remote Coordination (Dhaka Hub)',
    reportingTo: 'MD. Rezaul Karim, Project Manager & Team Lead',
    address: 'Mirpur DOHS, Dhaka, Bangladesh',
    nidOrPassport: 'NID-7391028472',
    emergencyContact: 'Md. Rafiqul Hossain (+880 1819-000000)',
    responsibilities: [
      'Architect core distributed cloud microservices and scalable full-stack systems.',
      'Drive system performance optimizations, database schemas, and CI/CD automation.',
      'Conduct rigorous code reviews and mentor junior engineering colleagues.',
    ],
    notes: 'Senior technical anchor for enterprise web and serverless pipelines.',
    createdAt: '2024-03-01T10:00:00.000Z',
    updatedAt: '2026-11-10T12:00:00.000Z',
  },
  {
    id: 'IB-EMP-2419',
    employeeId: 'IB-EMP-2419',
    fullName: 'Fahim Shahriar',
    email: 'fahim.shahriar@iotberg.com',
    phone: '+880 1612-987654',
    designation: 'Software Developer (Mid Level)',
    roleCategory: 'developer_mid',
    department: 'Software Engineering',
    employmentType: 'Full-time',
    status: 'active',
    joiningDate: '2024-06-15',
    probationMonths: 3,
    salaryBDT: 65000,
    salaryInWords: 'Sixty-Five Thousand BDT Only',
    workplace: 'Hybrid (Dhaka Engineering Hub / Remote)',
    reportingTo: 'MD. Rezaul Karim, Project Manager & Team Lead',
    address: 'Mohakhali, Dhaka, Bangladesh',
    nidOrPassport: 'NID-6291048291',
    emergencyContact: 'Shahriar Alam (+880 1612-000000)',
    responsibilities: [
      'Build responsive UI applications and Node.js / Python backend microservices.',
      'Optimize database queries and REST APIs for multi-tenant deployments.',
      'Collaborate on client feature delivery and automated testing.',
    ],
    notes: 'Core contributor to industrial CMS and public web platforms.',
    createdAt: '2024-06-15T10:00:00.000Z',
    updatedAt: '2026-11-10T12:00:00.000Z',
  },
  {
    id: 'IB-EMP-2427',
    employeeId: 'IB-EMP-2427',
    fullName: 'Nusrat Jahan',
    email: 'nusrat.jahan@iotberg.com',
    phone: '+880 1723-654321',
    designation: 'Software Developer (Mid-Junior Level)',
    roleCategory: 'developer_mid_junior',
    department: 'Software Engineering',
    employmentType: 'Full-time',
    status: 'active',
    joiningDate: '2024-09-01',
    probationMonths: 3,
    salaryBDT: 38000,
    salaryInWords: 'Thirty-Eight Thousand BDT Only',
    workplace: 'Remote Coordination (Dhaka Hub)',
    reportingTo: 'Tanvir Hossain, Senior Software Developer',
    address: 'Uttara Sector 7, Dhaka, Bangladesh',
    nidOrPassport: 'NID-9182736450',
    emergencyContact: 'Anisur Rahman (+880 1723-000000)',
    responsibilities: [
      'Develop modern React / Vite components and integrate client-side state managers.',
      'Implement API endpoints with error handling, validations, and unit tests.',
      'Participate in sprint backlog planning and technical bug fixing.',
    ],
    notes: 'Demonstrates exceptional frontend velocity and design fidelity.',
    createdAt: '2024-09-01T10:00:00.000Z',
    updatedAt: '2026-11-10T12:00:00.000Z',
  },
  {
    id: 'IB-EMP-2435',
    employeeId: 'IB-EMP-2435',
    fullName: 'Sayed Mahmud',
    email: 'sayed.mahmud@gmail.com',
    phone: '+880 1912-334455',
    designation: 'Software Engineering Intern',
    roleCategory: 'intern',
    department: 'Software Engineering',
    employmentType: 'Internship',
    status: 'probation',
    joiningDate: '2024-10-01',
    probationMonths: 3,
    salaryBDT: 15000,
    salaryInWords: 'Fifteen Thousand BDT Only',
    workplace: 'Hybrid (Dhaka Engineering Hub / Remote)',
    reportingTo: 'Fahim Shahriar, Mid Level Developer',
    address: 'Dhanmondi, Dhaka, Bangladesh',
    nidOrPassport: 'STU-ID-CSE202409',
    emergencyContact: 'Mahmudul Hasan (+880 1912-000000)',
    responsibilities: [
      'Assist in feature prototyping, component styling, and test-case execution.',
      'Learn IoT-Berg development workflow, git branching, and cloud deployments.',
      'Contribute to bug fixes and technical documentation under direct mentorship.',
    ],
    notes: 'Final-year Computer Science undergrad intern with high enthusiasm.',
    createdAt: '2024-10-01T10:00:00.000Z',
    updatedAt: '2026-11-10T12:00:00.000Z',
  },
  {
    id: 'IB-EMP-2412',
    employeeId: 'IB-EMP-2412',
    fullName: 'Sadia Rahman',
    email: 'sadia.product@iotberg.com',
    phone: '+880 1515-889900',
    designation: 'Product Manager',
    roleCategory: 'product_manager',
    department: 'Product & Delivery',
    employmentType: 'Full-time',
    status: 'active',
    joiningDate: '2024-04-10',
    probationMonths: 3,
    salaryBDT: 75000,
    salaryInWords: 'Seventy-Five Thousand BDT Only',
    workplace: 'Hybrid (Dhaka Hub / Remote)',
    reportingTo: 'MD. Rezaul Karim, Project Manager & Team Lead',
    address: 'Gulshan 1, Dhaka, Bangladesh',
    nidOrPassport: 'NID-5192837461',
    emergencyContact: 'Mustafizur Rahman (+880 1515-000000)',
    responsibilities: [
      'Own product specifications, milestone schedules, and client communications.',
      'Conduct backlog refinement, user story writing, and acceptance criteria verification.',
      'Collaborate closely with clients to guarantee project success and scope alignment.',
    ],
    notes: 'Handles enterprise client communication, sprint delivery, and roadmap pacing.',
    createdAt: '2024-04-10T10:00:00.000Z',
    updatedAt: '2026-11-10T12:00:00.000Z',
  },
  {
    id: 'IB-EMP-2422',
    employeeId: 'IB-EMP-2422',
    fullName: 'Mehedi Hasan',
    email: 'mehedi.finance@iotberg.com',
    phone: '+880 1718-223344',
    designation: 'Accounts & Finance Executive',
    roleCategory: 'accounts',
    department: 'Finance & Accounts',
    employmentType: 'Full-time',
    status: 'active',
    joiningDate: '2024-07-01',
    probationMonths: 3,
    salaryBDT: 45000,
    salaryInWords: 'Forty-Five Thousand BDT Only',
    workplace: 'Hybrid (Dhaka Hub / Remote)',
    reportingTo: 'MD. Rezaul Karim, Project Manager & Team Lead',
    address: 'Banasree, Dhaka, Bangladesh',
    nidOrPassport: 'NID-4192830192',
    emergencyContact: 'Hasanuzzaman (+880 1718-000000)',
    responsibilities: [
      'Maintain corporate accounts ledger, cash disbursement registers, and payment vouchers.',
      'Reconcile work order client receipts, server fee renewals, and monthly team payroll.',
      'Prepare statutory audit documentation, vendor settlements, and financial reporting.',
    ],
    notes: 'Responsible for accurate accounts reconciliation and payroll processing.',
    createdAt: '2024-07-01T10:00:00.000Z',
    updatedAt: '2026-11-10T12:00:00.000Z',
  },
]

const INITIAL_EMPLOYEE_DOCS = [
  {
    id: 'IB-DOC-2611-AP01',
    documentRef: 'IB-APP-2611-AP01',
    employeeId: 'IB-EMP-2427',
    candidateName: 'Nusrat Jahan',
    designation: 'Software Developer (Mid-Junior Level)',
    roleCategory: 'developer_mid_junior',
    department: 'Software Engineering',
    documentType: 'appointment_letter',
    title: 'Official Letter of Appointment',
    issueDate: '2024-08-25',
    effectiveDate: '2024-09-01',
    probationMonths: 3,
    salaryBDT: 38000,
    salaryInWords: 'Thirty-Eight Thousand BDT Only',
    workplace: 'Remote Coordination (Dhaka Hub)',
    reportingTo: 'Tanvir Hossain, Senior Software Developer',
    signatoryName: 'MD. Rezaul Karim',
    signatoryRole: 'Project Manager & Team Lead',
    signatoryCompany: 'IoT-Berg Software Engineering Team',
    status: 'issued',
    createdAt: '2024-08-25T10:00:00.000Z',
    updatedAt: '2024-08-25T10:00:00.000Z',
  },
  {
    id: 'IB-DOC-2611-IN01',
    documentRef: 'IB-INT-2611-IN01',
    employeeId: 'IB-EMP-2435',
    candidateName: 'Sayed Mahmud',
    designation: 'Software Engineering Intern',
    roleCategory: 'intern',
    department: 'Software Engineering',
    documentType: 'internship_agreement',
    title: 'Internship Offer & Training Agreement',
    issueDate: '2024-09-28',
    effectiveDate: '2024-10-01',
    probationMonths: 3,
    salaryBDT: 15000,
    salaryInWords: 'Fifteen Thousand BDT Only',
    workplace: 'Hybrid (Dhaka Engineering Hub / Remote)',
    reportingTo: 'Fahim Shahriar, Mid Level Developer',
    signatoryName: 'MD. Rezaul Karim',
    signatoryRole: 'Project Manager & Team Lead',
    signatoryCompany: 'IoT-Berg Software Engineering Team',
    status: 'issued',
    createdAt: '2024-09-28T10:00:00.000Z',
    updatedAt: '2024-09-28T10:00:00.000Z',
  },
]

function readLocal(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function writeLocal(key, value) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn(`Failed to write local key ${key}:`, err.message)
  }
}

class EmployeeStore {
  constructor() {
    this.employees = []
    this.documents = []
    this.storageBackend = 'local-storage'
    this.initialized = false
    this.cloudSyncPromise = null
    this.loadFromLocal()
  }

  loadFromLocal() {
    this.employees = readLocal(EMPLOYEES_STORAGE_KEY, INITIAL_EMPLOYEES)
    this.documents = readLocal(EMPLOYEE_DOCS_STORAGE_KEY, INITIAL_EMPLOYEE_DOCS)
    if (typeof window !== 'undefined') {
      this.storageBackend = localStorage.getItem(BACKEND_INFO_KEY) || 'local-storage'
    }
  }

  saveToLocal() {
    writeLocal(EMPLOYEES_STORAGE_KEY, this.employees)
    writeLocal(EMPLOYEE_DOCS_STORAGE_KEY, this.documents)
  }

  getStorageBackend() {
    return this.storageBackend
  }

  getRoleCategories() {
    return ROLE_CATEGORIES
  }

  getRoleConfig(roleId) {
    return (
      ROLE_CATEGORIES.find((r) => r.id === roleId) ||
      ROLE_CATEGORIES.find((r) => r.id === 'developer_mid')
    )
  }

  getAllEmployees() {
    return [...this.employees]
  }

  getEmployeeById(id) {
    if (!id) return null
    const target = String(id).toLowerCase().trim()
    return (
      this.employees.find(
        (e) =>
          String(e.id).toLowerCase() === target ||
          String(e.employeeId).toLowerCase() === target,
      ) || null
    )
  }

  async saveEmployeeAsync(employeeData) {
    const isNew = !employeeData.id
    const id = employeeData.id || generateEmployeeId(this.employees.map((e) => e.employeeId))
    const employeeId = employeeData.employeeId || id
    const roleConfig = this.getRoleConfig(employeeData.roleCategory)

    const now = new Date().toISOString()
    const record = {
      id,
      employeeId,
      fullName: employeeData.fullName?.trim() || 'Team Member',
      email: employeeData.email?.trim() || '',
      phone: employeeData.phone?.trim() || '',
      designation: employeeData.designation?.trim() || roleConfig.defaultDesignations[0],
      roleCategory: employeeData.roleCategory || 'developer_mid',
      department: employeeData.department?.trim() || roleConfig.defaultDepartment,
      employmentType: employeeData.employmentType || roleConfig.defaultEmploymentType,
      status: employeeData.status || 'active',
      joiningDate: employeeData.joiningDate || new Date().toISOString().split('T')[0],
      probationMonths: Number(employeeData.probationMonths) || roleConfig.defaultProbationMonths,
      salaryBDT: Number(employeeData.salaryBDT) || roleConfig.defaultSalaryBDT,
      salaryInWords:
        employeeData.salaryInWords ||
        numberToWordsBDT(Number(employeeData.salaryBDT) || roleConfig.defaultSalaryBDT),
      workplace: employeeData.workplace || 'Hybrid (Dhaka Engineering Hub / Remote)',
      reportingTo:
        employeeData.reportingTo || 'MD. Rezaul Karim, Project Manager & Team Lead',
      address: employeeData.address || '',
      nidOrPassport: employeeData.nidOrPassport || '',
      emergencyContact: employeeData.emergencyContact || '',
      responsibilities: Array.isArray(employeeData.responsibilities)
        ? employeeData.responsibilities
        : roleConfig.defaultResponsibilities,
      notes: employeeData.notes || '',
      createdAt: employeeData.createdAt || now,
      updatedAt: now,
    }

    const index = this.employees.findIndex((e) => e.id === id || e.employeeId === employeeId)
    if (index >= 0) {
      this.employees[index] = { ...this.employees[index], ...record }
    } else {
      this.employees.unshift(record)
    }

    this.saveToLocal()

    // Sync to cloud API
    try {
      const response = await fetch('/api/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveEmployee', employee: record }),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.storageBackend) {
          this.storageBackend = data.storageBackend
          if (typeof window !== 'undefined') {
            localStorage.setItem(BACKEND_INFO_KEY, data.storageBackend)
          }
        }
      }
    } catch (err) {
      console.warn('Cloud registry employee save queued in local store:', err.message)
    }

    return record
  }

  async deleteEmployeeAsync(id) {
    const target = String(id).toLowerCase().trim()
    this.employees = this.employees.filter(
      (e) =>
        String(e.id).toLowerCase() !== target &&
        String(e.employeeId).toLowerCase() !== target,
    )
    this.saveToLocal()

    try {
      await fetch('/api/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteEmployee', id }),
      })
    } catch (err) {
      console.warn('Cloud registry employee delete failed:', err.message)
    }

    return true
  }

  getAllDocuments() {
    return [...this.documents]
  }

  getDocumentsByEmployeeId(empId) {
    if (!empId) return []
    const target = String(empId).toLowerCase().trim()
    return this.documents.filter(
      (d) =>
        String(d.employeeId).toLowerCase() === target ||
        String(d.id).toLowerCase() === target,
    )
  }

  async saveDocumentAsync(docData) {
    const now = new Date().toISOString()
    const id = docData.id || generateDocRef(docData.documentType, this.documents.map((d) => d.documentRef))
    const documentRef = docData.documentRef || id

    const record = {
      id,
      documentRef,
      employeeId: docData.employeeId,
      candidateName: docData.candidateName,
      designation: docData.designation,
      roleCategory: docData.roleCategory || 'developer_mid',
      department: docData.department || 'Software Engineering',
      documentType: docData.documentType || 'appointment_letter',
      title: docData.title || 'Official Letter of Appointment',
      issueDate: docData.issueDate || new Date().toISOString().split('T')[0],
      effectiveDate: docData.effectiveDate || docData.joiningDate || new Date().toISOString().split('T')[0],
      probationMonths: Number(docData.probationMonths) || 3,
      salaryBDT: Number(docData.salaryBDT) || 0,
      salaryInWords: docData.salaryInWords || numberToWordsBDT(Number(docData.salaryBDT) || 0),
      workplace: docData.workplace || 'Hybrid (Dhaka Engineering Hub / Remote)',
      reportingTo: docData.reportingTo || 'MD. Rezaul Karim, Project Manager & Team Lead',
      signatoryName: docData.signatoryName || 'MD. Rezaul Karim',
      signatoryRole: docData.signatoryRole || 'Project Manager & Team Lead',
      signatoryCompany: docData.signatoryCompany || 'IoT-Berg Software Engineering Team',
      status: docData.status || 'issued',
      responsibilities: Array.isArray(docData.responsibilities) ? docData.responsibilities : [],
      customClauses: docData.customClauses || '',
      verificationHash: docData.verificationHash || `${documentRef}-${Date.now()}`,
      createdAt: docData.createdAt || now,
      updatedAt: now,
    }

    const index = this.documents.findIndex((d) => d.id === id || d.documentRef === documentRef)
    if (index >= 0) {
      this.documents[index] = { ...this.documents[index], ...record }
    } else {
      this.documents.unshift(record)
    }

    this.saveToLocal()

    try {
      const response = await fetch('/api/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveEmployeeDocument', document: record }),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.storageBackend) {
          this.storageBackend = data.storageBackend
        }
      }
    } catch (err) {
      console.warn('Cloud registry document save queued locally:', err.message)
    }

    return record
  }

  async deleteDocumentAsync(id) {
    const target = String(id).toLowerCase().trim()
    this.documents = this.documents.filter(
      (d) =>
        String(d.id).toLowerCase() !== target &&
        String(d.documentRef).toLowerCase() !== target,
    )
    this.saveToLocal()

    try {
      await fetch('/api/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteEmployeeDocument', id }),
      })
    } catch (err) {
      console.warn('Cloud registry document delete failed:', err.message)
    }

    return true
  }

  async syncFromCloud() {
    if (this.cloudSyncPromise) return this.cloudSyncPromise
    this.cloudSyncPromise = (async () => {
      try {
        const res = await fetch('/api/registry', { method: 'GET' })
        if (!res.ok) return { storageBackend: this.storageBackend }
        const data = await res.json()

        if (data.storageBackend) {
          this.storageBackend = data.storageBackend
          if (typeof window !== 'undefined') {
            localStorage.setItem(BACKEND_INFO_KEY, data.storageBackend)
          }
        }

        let updated = false
        if (Array.isArray(data.employees) && data.employees.length > 0) {
          this.employees = data.employees
          updated = true
        } else if ((!data.employees || data.employees.length === 0) && this.employees.length > 0) {
          // Cloud has not yet initialized employees, push local seed
          this.pushSeedToCloud()
        }

        if (Array.isArray(data.employeeDocuments) && data.employeeDocuments.length > 0) {
          this.documents = data.employeeDocuments
          updated = true
        }

        if (updated) {
          this.saveToLocal()
        }

        return {
          storageBackend: this.storageBackend,
          employees: this.employees,
          documents: this.documents,
        }
      } catch (err) {
        console.warn('Employee cloud sync error:', err.message)
        return { storageBackend: this.storageBackend }
      } finally {
        this.cloudSyncPromise = null
      }
    })()

    return this.cloudSyncPromise
  }

  async pushSeedToCloud() {
    try {
      for (const emp of this.employees) {
        await fetch('/api/registry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'saveEmployee', employee: emp }),
        })
      }
      for (const doc of this.documents) {
        await fetch('/api/registry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'saveEmployeeDocument', document: doc }),
        })
      }
    } catch (err) {
      console.warn('Push seed to cloud note:', err.message)
    }
  }
}

export const employeeStore = new EmployeeStore()
