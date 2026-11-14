import { numberToWordsBDT } from './numberToWords.js'
import { generateQrDataUrl } from './qrCode.js'

function formatPdfBDT(amount) {
  const num = Number(amount) || 0
  return `BDT ${num.toLocaleString('en-IN')}`
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

async function resolveImageDataUri(imageUrl, fallbackDataUrl = '', secondaryRemoteUrl = '') {
  if (imageUrl && /^data:image\//i.test(imageUrl)) {
    return imageUrl
  }

  const urlsToTry = [imageUrl, secondaryRemoteUrl].filter((u) => u && /^https?:\/\//i.test(u))
  for (const url of urlsToTry) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        const mime = response.headers.get('content-type') || 'image/png'
        if (typeof Buffer !== 'undefined') {
          const buf = Buffer.from(await response.arrayBuffer())
          return `data:${mime};base64,${buf.toString('base64')}`
        }
        const blob = await response.blob()
        const dataUri = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = () => reject(new Error('Failed to read image blob'))
          reader.readAsDataURL(blob)
        })
        if (typeof dataUri === 'string' && dataUri.startsWith('data:')) {
          return dataUri
        }
      }
    } catch (err) {
      console.warn('Image inline conversion fallback:', err.message)
    }
  }

  if (fallbackDataUrl && /^data:image\//i.test(fallbackDataUrl)) {
    return fallbackDataUrl
  }
  return imageUrl || ''
}

/**
 * Compiles a formal, publication-grade corporate Appointment Letter or Internship Agreement HTML
 * suitable for conversion to PDF via pdf-lagbe.
 */
export async function compileEmployeeDocumentHtml(doc, origin = 'https://iot-berg.vercel.app') {
  const docRef = doc.documentRef || doc.id || 'IB-APP-2611-XXXX'
  const verifyUrl = `${origin}/verify?doc=${encodeURIComponent(docRef)}`
  const logoUrl = `${origin}/icons/icon-192.png`

  const [qrDataUrl, resolvedSignatureSrc, resolvedLogoSrc] = await Promise.all([
    generateQrDataUrl(verifyUrl, { width: 140, margin: 1 }),
    resolveImageDataUri(doc.signatureUrl, doc.signatureDataUrl || ''),
    resolveImageDataUri(logoUrl, '', 'https://iot-berg.vercel.app/icons/icon-192.png'),
  ])

  const isInternship =
    doc.documentType === 'internship_agreement' ||
    doc.roleCategory === 'intern' ||
    /intern/i.test(doc.designation || '')

  const isCertificate = doc.documentType === 'experience_certificate'

  const salaryNum = Number(doc.salaryBDT) || 0
  const formattedSalary = formatPdfBDT(salaryNum)
  const salaryWords = doc.salaryInWords || numberToWordsBDT(salaryNum)
  const salaryTerm = isInternship ? 'Monthly Stipend' : 'Monthly Gross Remuneration'

  const candidateName = escapeHtml(doc.candidateName || doc.fullName || 'Candidate')
  const designation = escapeHtml(doc.designation || 'Software Engineer')
  const department = escapeHtml(doc.department || 'Software Engineering')
  const issueDateFormatted = formatDate(doc.issueDate)
  const effectiveDateFormatted = formatDate(doc.effectiveDate || doc.joiningDate)
  const probationMonths = Number(doc.probationMonths) || 3
  const workplace = escapeHtml(doc.workplace || 'Hybrid (Dhaka Engineering Hub / Remote)')
  const reportingTo = escapeHtml(doc.reportingTo || 'MD. Rezaul Karim, Project Manager & Team Lead')
  const signatoryName = escapeHtml(doc.signatoryName || 'MD. Rezaul Karim')
  const signatoryRole = escapeHtml(doc.signatoryRole || 'Project Manager & Team Lead')
  const signatoryCompany = escapeHtml(doc.signatoryCompany || 'IoT-Berg Software Engineering Team')

  const responsibilities = Array.isArray(doc.responsibilities) && doc.responsibilities.length > 0
    ? doc.responsibilities
    : [
        'Design, build, and maintain high-performance software modules and cloud architectures.',
        'Participate actively in sprint ceremonies, peer code reviews, and architecture discussions.',
        'Write clean, well-tested code in adherence with IoT-Berg technical quality standards.',
        'Collaborate with cross-functional team members to achieve sprint milestones on schedule.',
      ]

  const docTitle = isInternship
    ? 'INTERNSHIP APPOINTMENT & TRAINING AGREEMENT'
    : isCertificate
    ? 'OFFICIAL EMPLOYMENT & COMPENSATION CERTIFICATE'
    : 'OFFICIAL LETTER OF APPOINTMENT'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(docTitle)} - ${candidateName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 14mm 10mm 14mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.45;
      color: #1e293b;
      background: #ffffff;
    }
    .contract-page {
      padding: 0 4px;
      page-break-after: always;
      position: relative;
    }
    .contract-page.last-page {
      page-break-after: avoid;
    }

    /* Corporate Header */
    .corporate-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 2px solid #0f766e;
      margin-bottom: 14px;
    }
    .brand-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 48px;
      height: 48px;
      object-fit: contain;
      border-radius: 8px;
    }
    .company-title {
      font-size: 16pt;
      font-weight: 800;
      color: #0f766e;
      letter-spacing: -0.3px;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .company-subtitle {
      font-size: 7.5pt;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-top: 2px;
    }
    .company-contact {
      font-size: 8pt;
      color: #64748b;
      margin-top: 2px;
    }
    .header-meta {
      text-align: right;
    }
    .meta-ref-badge {
      display: inline-block;
      background: #0f766e;
      color: #ffffff;
      font-size: 8pt;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      font-family: monospace;
      margin-bottom: 4px;
    }
    .meta-date {
      font-size: 8.5pt;
      color: #475569;
      font-weight: 600;
    }

    /* Recipient & Subject */
    .recipient-block {
      margin-bottom: 12px;
      font-size: 9.5pt;
      line-height: 1.35;
      color: #334155;
    }
    .recipient-name {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
    }
    .subject-line {
      margin: 12px 0 10px 0;
      padding: 6px 10px;
      background: #f0fdf4;
      border-left: 4px solid #0f766e;
      font-size: 10.5pt;
      font-weight: 800;
      color: #0f766e;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }

    /* Salutation & Paragraphs */
    .salutation {
      font-weight: 700;
      margin-bottom: 8px;
      color: #0f172a;
    }
    .intro-paragraph {
      margin-bottom: 10px;
      text-align: justify;
      color: #334155;
      font-size: 9.5pt;
    }

    /* Numbered Clauses */
    .clause-section {
      margin-bottom: 9px;
    }
    .clause-title {
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f766e;
      margin-bottom: 2px;
    }
    .clause-body {
      font-size: 9pt;
      color: #334155;
      line-height: 1.35;
      text-align: justify;
    }

    /* Structured Remuneration Table */
    .remuneration-table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0 9px 0;
      font-size: 8.5pt;
    }
    .remuneration-table th {
      background: #f1f5f9;
      color: #0f766e;
      font-weight: 700;
      text-align: left;
      padding: 5px 8px;
      border: 1px solid #cbd5e1;
      text-transform: uppercase;
      font-size: 8pt;
    }
    .remuneration-table td {
      padding: 5px 8px;
      border: 1px solid #cbd5e1;
      color: #1e293b;
    }
    .salary-highlight {
      font-weight: 800;
      color: #0f766e;
      font-size: 9.5pt;
    }

    /* Responsibilities List */
    .resp-list {
      margin-left: 18px;
      margin-top: 3px;
      margin-bottom: 6px;
      font-size: 8.8pt;
      color: #334155;
      line-height: 1.35;
    }
    .resp-list li {
      margin-bottom: 2px;
    }

    /* Signatures Section */
    .signatures-block {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 18px;
      padding-top: 10px;
      page-break-inside: avoid;
    }
    .signature-col {
      width: 46%;
    }
    .sig-media {
      height: 48px;
      display: flex;
      align-items: flex-end;
      margin-bottom: 4px;
    }
    .sig-img {
      max-height: 46px;
      max-width: 150px;
      object-fit: contain;
    }
    .digital-seal-tag {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 700;
      color: #0f766e;
      background: #ccfbf1;
      border: 1px dashed #0d9488;
      padding: 2px 7px;
      border-radius: 4px;
    }
    .sig-line {
      border-top: 1.5px solid #0f172a;
      padding-top: 4px;
    }
    .sig-name {
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f172a;
    }
    .sig-role {
      font-size: 8pt;
      color: #475569;
    }

    /* Verification Strip */
    .verification-footer {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 14px;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      page-break-inside: avoid;
    }
    .qr-box {
      width: 54px;
      height: 54px;
      flex-shrink: 0;
      background: #ffffff;
      padding: 2px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
    }
    .qr-copy {
      font-size: 7.5pt;
      color: #64748b;
      line-height: 1.3;
    }
    .qr-copy strong {
      color: #0f172a;
      font-size: 8.5pt;
      display: block;
    }
    .verify-url {
      font-family: monospace;
      color: #0f766e;
      font-size: 7.5pt;
      margin-top: 1px;
    }
    .footer-watermark {
      text-align: center;
      font-size: 7pt;
      color: #94a3b8;
      margin-top: 6px;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: Terms, Compensation, & Responsibilities -->
  <div class="contract-page">
    <div class="corporate-header">
      <div class="brand-left">
        ${
          resolvedLogoSrc
            ? `<img src="${resolvedLogoSrc}" alt="IoT-Berg Logo" class="brand-logo">`
            : ''
        }
        <div>
          <div class="company-title">IoT-Berg Software Engineering Team</div>
          <div class="company-subtitle">IoT &amp; Cloud Systems · Enterprise Full-Stack Engineering</div>
          <div class="company-contact">Demra, Dhaka-1360, Bangladesh · contact@iotberg.com · https://iot-berg.vercel.app</div>
        </div>
      </div>
      <div class="header-meta">
        <div class="meta-ref-badge">${escapeHtml(docRef)}</div>
        <div class="meta-date">Date: ${issueDateFormatted}</div>
      </div>
    </div>

    <div class="recipient-block">
      <div>To:</div>
      <div class="recipient-name">${candidateName}</div>
      <div>Position: <strong>${designation}</strong></div>
      <div>Department: ${department}</div>
      ${doc.address ? `<div>Address: ${escapeHtml(doc.address)}</div>` : ''}
      ${doc.phone ? `<div>Phone: ${escapeHtml(doc.phone)} · Email: ${escapeHtml(doc.email || '')}</div>` : ''}
    </div>

    <div class="subject-line">
      ${escapeHtml(docTitle)} — ${designation}
    </div>

    <div class="salutation">Dear ${candidateName},</div>

    <div class="intro-paragraph">
      On behalf of <strong>IoT-Berg Software Engineering Team</strong>, we are pleased to offer you the position of 
      <strong>${designation}</strong> in our <strong>${department}</strong> department, effective from 
      <strong>${effectiveDateFormatted}</strong>. We were exceptionally impressed by your technical competence, 
      dedication to software engineering craftsmanship, and problem-solving mindset. We believe your contributions 
      will play a pivotal role in driving our engineering quality and client solutions.
    </div>

    <!-- Clause 1: Position & Reporting -->
    <div class="clause-section">
      <div class="clause-title">1. Position, Reporting &amp; Workplace</div>
      <div class="clause-body">
        You will serve as <strong>${designation}</strong> and will report directly to 
        <strong>${reportingTo}</strong>. Your primary work arrangement will be <strong>${workplace}</strong>. 
        You will be expected to commit a standard 40 working hours per week (Sunday through Thursday) with 
        coordination around daily standups and sprint planning milestones.
      </div>
    </div>

    <!-- Clause 2: Probation & Confirmation -->
    <div class="clause-section">
      <div class="clause-title">2. Probation Period &amp; Performance Review</div>
      <div class="clause-body">
        ${
          isInternship
            ? `Your internship will span an initial tenure of <strong>${probationMonths} months</strong>. During this structured program, you will work under senior engineering mentorship, participating in active product sprints, codebase reviews, and milestone demos. Upon exemplary completion, candidates will receive formal certification and priority consideration for full-time regular employment.`
            : `You will be on probation for an initial duration of <strong>${probationMonths} months</strong> from your effective joining date. Your performance, technical velocity, adherence to code quality standards, and collaboration will be formally evaluated at the conclusion of this period prior to issuing regular confirmation.`
        }
      </div>
    </div>

    <!-- Clause 3: Remuneration Breakdown -->
    <div class="clause-section">
      <div class="clause-title">3. Remuneration &amp; Compensation Package</div>
      <div class="clause-body">
        Your compensation package has been structured in accordance with your designation and role band:
      </div>
      <table class="remuneration-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Particulars &amp; Terms</th>
            <th style="text-align: right;">Amount (BDT)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${salaryTerm}</strong></td>
            <td>Gross monthly disbursement subject to monthly attendance &amp; deliverables</td>
            <td style="text-align: right;" class="salary-highlight">${formattedSalary}</td>
          </tr>
          <tr>
            <td><strong>Disbursement Schedule</strong></td>
            <td>Transferred on or before the 7th of every following month via Bank / MFS</td>
            <td style="text-align: right; color: #475569;">Monthly Cycle</td>
          </tr>
          <tr>
            <td><strong>Performance &amp; Allowances</strong></td>
            <td>Eligible for sprint milestone bonuses, server/cloud stipends, and festival benefits</td>
            <td style="text-align: right; color: #475569;">Company Policy</td>
          </tr>
        </tbody>
      </table>
      <div style="font-size: 8pt; color: #475569; margin-top: -4px;">
        * Total Monthly Amount in Words: <strong>${escapeHtml(salaryWords)}</strong>
      </div>
    </div>

    <!-- Clause 4: Duties & Key Deliverables -->
    <div class="clause-section">
      <div class="clause-title">4. Key Duties &amp; Core Deliverables</div>
      <div class="clause-body">
        In this role, your responsibilities will encompass, but are not limited to:
      </div>
      <ul class="resp-list">
        ${responsibilities.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}
      </ul>
    </div>
  </div>

  <!-- PAGE 2: IP, Confidentiality, Signatures & Acceptance -->
  <div class="contract-page last-page">
    <div class="corporate-header" style="padding-bottom: 8px; margin-bottom: 12px;">
      <div class="brand-left">
        <div>
          <div class="company-title" style="font-size: 13pt;">IoT-Berg Software Engineering Team</div>
          <div class="company-subtitle" style="font-size: 7pt;">Appointment Terms &amp; Conditions (Page 2 of 2)</div>
        </div>
      </div>
      <div class="header-meta">
        <div class="meta-ref-badge">${escapeHtml(docRef)}</div>
      </div>
    </div>

    <!-- Clause 5: IP & Confidentiality -->
    <div class="clause-section">
      <div class="clause-title">5. Intellectual Property, Source Code &amp; Non-Disclosure</div>
      <div class="clause-body">
        All software codes, algorithms, system architectures, technical documentation, database schemas, cryptographic keys, 
        and design assets produced by you during your employment or internship remain the sole, absolute, and exclusive 
        intellectual property of <strong>IoT-Berg</strong>. You agree to treat all proprietary client data, business logic, 
        and internal repositories with the strictest confidentiality both during and following your tenure with the team.
      </div>
    </div>

    <!-- Clause 6: Code of Conduct & Company Property -->
    <div class="clause-section">
      <div class="clause-title">6. Code of Conduct &amp; Professional Integrity</div>
      <div class="clause-body">
        You are expected to maintain the highest standards of professional conduct, technical honesty, and punctuality. 
        Any unauthorized disclosure of company intellectual property, malicious tampering with production infrastructure, 
        or breach of trust will constitute immediate grounds for termination without compensation.
      </div>
    </div>

    <!-- Clause 7: Separation & Notice Period -->
    <div class="clause-section">
      <div class="clause-title">7. Separation &amp; Notice Period</div>
      <div class="clause-body">
        During the probationary period, either party may terminate this engagement by providing 
        <strong>15 calendar days' written notice</strong> or gross remuneration in lieu thereof. Following successful 
        confirmation, a minimum notice period of <strong>30 calendar days</strong> shall apply. Upon resignation or termination, 
        all code repositories, credentials, documents, and company assets must be properly handed over.
      </div>
    </div>

    <!-- Clause 8: Governing Law -->
    <div class="clause-section">
      <div class="clause-title">8. Governing Law &amp; Jurisdiction</div>
      <div class="clause-body">
        This appointment and all associated terms shall be governed by and construed in accordance with the labor regulations 
        and laws of the People's Republic of Bangladesh.
      </div>
    </div>

    <!-- Signatures Block -->
    <div class="signatures-block">
      <!-- Authorized Corporate Signatory -->
      <div class="signature-col">
        <div class="sig-media">
          ${
            resolvedSignatureSrc
              ? `<img src="${resolvedSignatureSrc}" alt="Authorized Signature" class="sig-img">`
              : `<span class="digital-seal-tag">★ IoT-Berg Authorized ★</span>`
          }
        </div>
        <div class="sig-line">
          <div class="sig-name">${signatoryName}</div>
          <div class="sig-role">${signatoryRole}</div>
          <div class="sig-role" style="font-weight: 600; color: #0f766e;">${signatoryCompany}</div>
        </div>
      </div>

      <!-- Candidate Acceptance Sign-off -->
      <div class="signature-col">
        <div class="sig-media" style="align-items: center; justify-content: flex-end;">
          <span style="font-size: 7.5pt; color: #94a3b8; font-style: italic;">Candidate Acceptance</span>
        </div>
        <div class="sig-line">
          <div class="sig-name">${candidateName}</div>
          <div class="sig-role">Candidate Signature &amp; Date</div>
          <div class="sig-role" style="font-size: 7.5pt; color: #64748b;">"I accept the terms and conditions outlined above."</div>
        </div>
      </div>
    </div>

    <!-- QR Code Online Verification Strip -->
    <div class="verification-footer">
      <img src="${qrDataUrl}" alt="Online Document Verification QR Code" class="qr-box">
      <div class="qr-copy">
        <strong>Official Corporate Document Verification</strong>
        Scan this QR code with any smartphone camera or navigate to the URL below to dynamically verify 
        the authenticity and record status of this appointment letter on the IoT-Berg registry.
        <div class="verify-url">${escapeHtml(verifyUrl)}</div>
      </div>
    </div>

    <div class="footer-watermark">
      IoT-Berg Software Engineering Team · Document Integrity Hash: <code>${escapeHtml(doc.verificationHash || `${docRef}-VERIFIED`)}</code>
    </div>
  </div>

</body>
</html>`
}
