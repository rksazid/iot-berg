import { numberToWordsBDT } from './numberToWords.js'
import { generateQrDataUrl } from './qrCode.js'

/**
 * PDF-safe currency formatting using 'BDT ' prefix so headless Linux Chromium
 * never renders missing-glyph tofu boxes for the Unicode Taka sign (৳).
 */
function formatPdfBDT(amount) {
  const num = Number(amount) || 0
  return `BDT ${num.toLocaleString('en-IN')}`
}

/**
 * Truncates long free-form strings so any dynamic content stays cleanly within
 * a single A4 receipt page without spilling onto page 2.
 */
function clampText(text, maxChars = 140) {
  if (!text) return ''
  const normalized = String(text).replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxChars) return normalized
  return `${normalized.slice(0, maxChars - 1).trimEnd()}…`
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Converts a remote image URL (Vercel Blob signature or company logo) into an inline data: URI
 * so headless Chromium in pdf-lagbe renders images immediately with zero network fetch race conditions.
 */
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
 * Compiles a single-page A4 HTML document for the official payment receipt.
 * Designed with strict vertical budget + content clamping so it NEVER splits to 2 pages.
 */
export async function compileReceiptHtml(receipt, origin = 'https://iot-berg.vercel.app') {
  const receiptRef = receipt.receiptNumber || receipt.id
  const verifyUrl = `${origin}/verify/${encodeURIComponent(receiptRef)}`
  const logoUrl = receipt.companyLogoUrl || `${origin}/icons/icon-192.png`
  const [qrDataUrl, resolvedSignatureSrc, resolvedLogoSrc] = await Promise.all([
    generateQrDataUrl(verifyUrl, { width: 150, margin: 1 }),
    resolveImageDataUri(receipt.signatureUrl, receipt.signatureDataUrl),
    resolveImageDataUri(logoUrl, '', 'https://iot-berg.vercel.app/icons/icon-192.png'),
  ])

  const formattedAmount = formatPdfBDT(receipt.amount)
  const amountWords = clampText(
    receipt.amountInWords || numberToWordsBDT(receipt.amount),
    105,
  )
  const formattedTotal = receipt.totalContractValue
    ? formatPdfBDT(receipt.totalContractValue)
    : '-'
  const formattedBalance = receipt.balanceRemaining != null
    ? formatPdfBDT(receipt.balanceRemaining)
    : '-'

  const coreVal = receipt.coreContractValue != null ? Number(receipt.coreContractValue) : 450000
  const serverCharge = receipt.serverCharge != null ? Number(receipt.serverCharge) : 0
  const serverPeriod = clampText(receipt.serverPeriod || '1 Year', 24)
  const maintenanceCharge = receipt.maintenanceCharge != null ? Number(receipt.maintenanceCharge) : 0
  const maintenancePeriod = clampText(receipt.maintenancePeriod || '1 Year', 24)
  const totalAdditional =
    serverCharge + maintenanceCharge + (Number(receipt.otherAdditionalCharge) || 0)

  const formattedCore = formatPdfBDT(coreVal)
  const formattedServer = formatPdfBDT(serverCharge)
  const formattedMaintenance = formatPdfBDT(maintenanceCharge)
  const formattedAdditional = formatPdfBDT(totalAdditional)
  const hasAdditional = totalAdditional > 0

  const isPending = receipt.status === 'pending_approval'
  const clientNameSafe = escapeHtml(clampText(receipt.clientName || 'Valued Client', 70))
  const clientContactSafe = escapeHtml(clampText(receipt.clientContactPerson || '', 65))
  const clientEmailSafe = escapeHtml(clampText(receipt.clientEmail || '', 55))
  const clientAddressSafe = escapeHtml(clampText(receipt.clientAddress || '', 85))
  const workOrderSafe = escapeHtml(
    clampText(receipt.workOrderRef || receipt.workOrderId || 'Contract Attached', 40),
  )
  const projectNameSafe = escapeHtml(
    clampText(receipt.projectName || 'Engineering Services', 85),
  )
  const paymentHeadSafe = escapeHtml(
    clampText(receipt.paymentHead || receipt.paymentCategory || 'Work Order Payment', 60),
  )
  const paymentModeSafe = escapeHtml(clampText(receipt.paymentMode || 'Cash', 30))
  const txNoteSafe = escapeHtml(
    clampText(
      receipt.transactionNote || 'Payment received against authorized engineering work order.',
      195,
    ),
  )
  const signatoryNameSafe = escapeHtml(clampText(receipt.signatoryName || 'MD. Rezaul Karim', 50))
  const signatoryRoleSafe = escapeHtml(
    clampText(receipt.signatoryRole || 'Project Manager & Team Lead', 55),
  )

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt - ${escapeHtml(receiptRef)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 11.5px;
      line-height: 1.38;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .receipt-container {
      width: 100%;
      max-width: 780px;
      margin: 0 auto;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      padding: 15px 18px;
      background: #ffffff;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .top-banner {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 10px;
      margin-bottom: 11px;
    }
    .brand-col {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .brand-header-row {
      display: flex;
      align-items: center;
      gap: 9px;
    }
    .company-logo-img {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      object-fit: cover;
      border: 1px solid #cbd5e1;
      flex-shrink: 0;
    }
    .company-title {
      font-size: 19px;
      font-weight: 800;
      color: #0f766e;
      letter-spacing: -0.4px;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .company-subtitle {
      font-size: 9px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      margin-top: 1px;
    }
    .company-contact {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
      line-height: 1.35;
    }
    .meta-col {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 3px;
    }
    .doc-badge {
      display: inline-block;
      background: #0f766e;
      color: #ffffff;
      font-weight: 700;
      font-size: 10.5px;
      padding: 3px 10px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .receipt-id {
      font-family: monospace;
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }
    .receipt-date {
      font-size: 10.5px;
      color: #64748b;
      font-weight: 500;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 9.5px;
      font-weight: 700;
      color: ${isPending ? '#b45309' : '#059669'};
      background: ${isPending ? '#fef3c7' : '#ecfdf5'};
      border: 1px solid ${isPending ? '#fde68a' : '#a7f3d0'};
      padding: 2px 7px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .amount-highlight-card {
      background: #f0fdfa;
      border: 1.5px solid #5eead4;
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 11px;
    }
    .amount-left strong {
      display: block;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0d9488;
      margin-bottom: 1px;
    }
    .amount-left .amount-num {
      font-size: 22px;
      font-weight: 800;
      color: #0f766e;
      font-family: monospace;
      line-height: 1.15;
    }
    .amount-left .amount-words {
      font-size: 10.5px;
      font-style: italic;
      color: #334155;
      margin-top: 2px;
    }
    .amount-right {
      text-align: right;
    }
    .payment-mode-pill {
      display: inline-block;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      padding: 3px 9px;
      border-radius: 6px;
    }
    .grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 11px;
      margin-bottom: 11px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 7px;
      padding: 9px 11px;
    }
    .box-heading {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #64748b;
      margin-bottom: 5px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
    }
    .info-line {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 3px;
      font-size: 10.5px;
      line-height: 1.32;
    }
    .info-line:last-child {
      margin-bottom: 0;
    }
    .info-label {
      color: #64748b;
      font-weight: 500;
      white-space: nowrap;
    }
    .info-value {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
      word-break: break-word;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 10.5px;
    }
    .details-table th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      text-align: left;
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      font-size: 9.5px;
      text-transform: uppercase;
    }
    .details-table td {
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
      vertical-align: top;
    }
    .addons-panel {
      margin-bottom: 10px;
      padding: 7px 10px;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .addons-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .addons-title {
      font-size: 9.5px;
      text-transform: uppercase;
      color: #1e293b;
      letter-spacing: 0.4px;
      font-weight: 700;
    }
    .addons-badge {
      font-size: 9.5px;
      font-weight: 700;
      color: #4338ca;
      background: #e0e7ff;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .addons-table {
      width: 100%;
      font-size: 10px;
      color: #334155;
      border-collapse: collapse;
    }
    .addons-note {
      font-size: 9px;
      color: #64748b;
      margin-top: 3px;
      font-style: italic;
      border-top: 1px dotted #e2e8f0;
      padding-top: 3px;
    }
    .verification-strip {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 7px;
      padding: 8px 11px;
      margin-bottom: 12px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .qr-img {
      width: 62px;
      height: 62px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      background: #ffffff;
      padding: 2px;
      flex-shrink: 0;
    }
    .qr-copy strong {
      font-size: 10.5px;
      color: #0f172a;
      display: block;
      margin-bottom: 1px;
    }
    .qr-copy p {
      font-size: 9.5px;
      color: #64748b;
      line-height: 1.32;
      margin-bottom: 2px;
    }
    .qr-copy .verify-url {
      font-family: monospace;
      font-size: 9px;
      color: #0f766e;
      word-break: break-all;
    }
    .sign-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 10px;
      padding-top: 4px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .sign-box {
      width: 44%;
      text-align: center;
    }
    .signature-media {
      height: 46px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      margin-bottom: 4px;
    }
    .signature-img {
      max-height: 44px;
      max-width: 165px;
      width: auto;
      height: auto;
      object-fit: contain;
    }
    .digital-seal-svg {
      display: inline-block;
      font-family: monospace;
      font-size: 10px;
      font-weight: 700;
      color: #0f766e;
      border-bottom: 1.5px dashed #0f766e;
      padding-bottom: 3px;
    }
    .sign-line {
      border-top: 1px solid #94a3b8;
      padding-top: 5px;
    }
    .sign-name {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
    }
    .sign-title {
      font-size: 9.5px;
      color: #64748b;
    }
    .official-seal {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 9px;
      font-weight: 700;
      color: #0f766e;
      border: 1px solid #0f766e;
      padding: 2px 7px;
      border-radius: 4px;
      margin-top: 3px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .footer-note {
      text-align: center;
      font-size: 8.8px;
      color: #94a3b8;
      margin-top: 10px;
      border-top: 1px solid #f1f5f9;
      padding-top: 7px;
      line-height: 1.3;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- Top Header -->
    <div class="top-banner">
      <div class="brand-col">
        <div class="brand-header-row">
          ${resolvedLogoSrc ? `<img src="${resolvedLogoSrc}" alt="IoT-Berg Logo" class="company-logo-img">` : ''}
          <div>
            <h1 class="company-title">IoT-Berg</h1>
            <div class="company-subtitle">${escapeHtml(receipt.signatoryCompany || 'IoT-Berg Engineering')} · Web · Cloud · APIs</div>
          </div>
        </div>
        <div class="company-contact">
          Technical Direction: MD. Rezaul Karim (${signatoryRoleSafe})<br>
          Web: https://iot-berg.vercel.app · Contact: ${escapeHtml(receipt.signatoryEmail || 'rksazid@gmail.com')}
        </div>
      </div>
      <div class="meta-col">
        <div class="doc-badge">Money Receipt</div>
        <div class="receipt-id">${escapeHtml(receiptRef)}</div>
        <div class="receipt-date">Date: ${escapeHtml(receipt.receiptDate || receipt.paymentDate)}</div>
        <div class="status-pill">
          ${isPending ? '⏳ Pending Signature' : '✓ Verified & Authorized'}
        </div>
      </div>
    </div>

    <!-- Amount Highlight Box -->
    <div class="amount-highlight-card">
      <div class="amount-left">
        <strong>Received Payment Amount</strong>
        <div class="amount-num">${formattedAmount}</div>
        <div class="amount-words">In Words: ${escapeHtml(amountWords)}</div>
      </div>
      <div class="amount-right">
        <div class="payment-mode-pill">${paymentModeSafe} Receipt</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 3px;">${paymentHeadSafe}</div>
      </div>
    </div>

    <!-- Client & Work Order Context -->
    <div class="grid-2col">
      <div class="info-box">
        <div class="box-heading">Received From (Client)</div>
        <div class="info-line">
          <span class="info-label">Company:</span>
          <span class="info-value">${clientNameSafe}</span>
        </div>
        ${
          clientContactSafe
            ? `<div class="info-line">
                <span class="info-label">Contact:</span>
                <span class="info-value">${clientContactSafe}</span>
              </div>`
            : ''
        }
        ${
          clientEmailSafe
            ? `<div class="info-line">
                <span class="info-label">Email:</span>
                <span class="info-value">${clientEmailSafe}</span>
              </div>`
            : ''
        }
        ${
          clientAddressSafe
            ? `<div class="info-line">
                <span class="info-label">Address:</span>
                <span class="info-value">${clientAddressSafe}</span>
              </div>`
            : ''
        }
      </div>

      <div class="info-box">
        <div class="box-heading">Project & Financial Breakdown</div>
        <div class="info-line">
          <span class="info-label">Work Order Ref:</span>
          <span class="info-value" style="font-family: monospace;">${workOrderSafe}</span>
        </div>
        <div class="info-line">
          <span class="info-label">Project Scope:</span>
          <span class="info-value">${projectNameSafe}</span>
        </div>
        <div class="info-line">
          <span class="info-label">Core Engineering:</span>
          <span class="info-value">${formattedCore}</span>
        </div>
        ${
          hasAdditional
            ? `<div class="info-line">
                <span class="info-label">Operational Add-ons:</span>
                <span class="info-value" style="color: #4338ca; font-weight: 600;">${formattedAdditional} (Separate)</span>
              </div>`
            : ''
        }
        <div class="info-line">
          <span class="info-label">Total Contract Value:</span>
          <span class="info-value" style="font-weight: 700;">${formattedTotal}</span>
        </div>
        <div class="info-line">
          <span class="info-label">Remaining Balance:</span>
          <span class="info-value" style="color: #b91c1c; font-weight: 700;">${formattedBalance}</span>
        </div>
      </div>
    </div>

    <!-- Transaction Summary Table -->
    <table class="details-table">
      <thead>
        <tr>
          <th style="width: 56%;">Description / Milestone Particulars</th>
          <th style="width: 24%;">Payment Category</th>
          <th style="width: 20%; text-align: right;">Amount Paid</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${paymentHeadSafe}</strong><br>
            <span style="color: #64748b; font-size: 9.8px;">${txNoteSafe}</span>
          </td>
          <td>${paymentModeSafe} · ${paymentHeadSafe}</td>
          <td style="text-align: right; font-weight: 700; font-family: monospace; font-size: 11.5px;">
            ${formattedAmount}
          </td>
        </tr>
      </tbody>
    </table>

    ${
      hasAdditional
        ? `<div class="addons-panel">
            <div class="addons-header">
              <span class="addons-title">Additional Operational Services (Separate from Core Project Deliverables)</span>
              <span class="addons-badge">Total: ${formattedAdditional}</span>
            </div>
            <table class="addons-table">
              <tr>
                <td style="padding: 1px 0;">• <strong>Managed Server &amp; Cloud Infrastructure:</strong> ${formattedServer}</td>
                <td style="text-align: right; color: #64748b;">${serverPeriod} Cloud Hosting &amp; Storage</td>
              </tr>
              <tr>
                <td style="padding: 1px 0;">• <strong>Software Maintenance &amp; Security SLA:</strong> ${formattedMaintenance}</td>
                <td style="text-align: right; color: #64748b;">${maintenanceCharge === 0 ? 'Bundled within yearly SLA fee' : `${maintenancePeriod} Security Patches &amp; Uptime SLA`}</td>
              </tr>
            </table>
            <div class="addons-note">
              * Note: Server management and software maintenance charges are operational allocations separate from core software engineering deliverables.
            </div>
          </div>`
        : ''
    }

    <!-- QR Code Online Verification Strip -->
    <div class="verification-strip">
      <img src="${qrDataUrl}" alt="Online Verification QR Code" class="qr-img">
      <div class="qr-copy">
        <strong>Online Digital Verification &amp; Authenticity Proof</strong>
        <p>
          Scan this QR code with any smartphone camera to dynamically verify the authenticity of this payment receipt on the IoT-Berg cloud registry.
        </p>
        <div class="verify-url">${escapeHtml(verifyUrl)}</div>
      </div>
    </div>

    <!-- Signatures Section -->
    <div class="sign-row">
      <div class="sign-box">
        <div class="signature-media">
          <span style="font-size: 10px; color: #94a3b8; font-style: italic;">Authorized Handover</span>
        </div>
        <div class="sign-line">
          <div class="sign-name">${clientContactSafe || clientNameSafe}</div>
          <div class="sign-title">Payer / Authorized Signature</div>
        </div>
      </div>

      <div class="sign-box">
        <div class="signature-media">
          ${
            resolvedSignatureSrc
              ? `<img src="${resolvedSignatureSrc}" alt="Authorized Signature" class="signature-img">`
              : isPending
              ? `<div class="digital-seal-svg" style="color: #d97706; border-color: #fde68a;">DRAFT · Awaiting Signature</div>`
              : `<div class="digital-seal-svg">${signatoryNameSafe} (Digitally Signed)</div>`
          }
        </div>
        <div class="sign-line">
          <div class="sign-name">${signatoryNameSafe}</div>
          <div class="sign-title">${signatoryRoleSafe}</div>
          ${
            isPending
              ? `<div class="official-seal" style="color: #d97706; border-color: #fde68a; background: #fffbeb;">⏳ Pending Signature Approval</div>`
              : receipt.sealEnabled !== false
              ? `<div class="official-seal">★ IoT-Berg Verified Official ★</div>`
              : ''
          }
        </div>
      </div>
    </div>

    <!-- Footer Security Note -->
    <div class="footer-note">
      System-generated official payment receipt issued by Team IoT-Berg Engineering · Rendered via pdf-lagbe.<br>
      Integrity Hash: <code>${escapeHtml(receipt.verificationHash || 'ib_verified_sha256')}</code>
    </div>
  </div>
</body>
</html>`
}
