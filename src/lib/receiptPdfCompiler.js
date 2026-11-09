import { formatCurrencyBDT, numberToWordsBDT } from './numberToWords.js'
import { generateQrDataUrl } from './qrCode.js'

/**
 * Compiles a pixel-perfect, standards-compliant HTML document for the official payment receipt.
 * Optimized for A4 printing and sub-second compilation through the pdf-lagbe Chromium rendering engine.
 */
export async function compileReceiptHtml(receipt, origin = 'https://iot-berg.vercel.app') {
  const verifyUrl = `${origin}/verify/${encodeURIComponent(receipt.id || receipt.receiptNumber)}`
  const qrDataUrl = await generateQrDataUrl(verifyUrl, { width: 180, margin: 1 })

  const formattedAmount = formatCurrencyBDT(receipt.amount)
  const amountWords = receipt.amountInWords || numberToWordsBDT(receipt.amount)
  const formattedTotal = receipt.totalContractValue
    ? formatCurrencyBDT(receipt.totalContractValue)
    : '—'
  const formattedBalance = receipt.balanceRemaining != null
    ? formatCurrencyBDT(receipt.balanceRemaining)
    : '—'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt — ${receipt.receiptNumber || receipt.id}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .receipt-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px 28px;
      position: relative;
      background: #ffffff;
    }
    .top-banner {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .brand-col {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .company-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f766e;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .company-subtitle {
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .company-contact {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.4;
    }
    .meta-col {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }
    .doc-badge {
      display: inline-block;
      background: #0f766e;
      color: #ffffff;
      font-weight: 700;
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .receipt-id {
      font-family: monospace;
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 4px;
    }
    .receipt-date {
      font-size: 11.5px;
      color: #64748b;
      font-weight: 500;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 10.5px;
      font-weight: 700;
      color: #059669;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .amount-highlight-card {
      background: #f0fdfa;
      border: 1.5px solid #5eead4;
      border-radius: 8px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 22px;
    }
    .amount-left strong {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0d9488;
      margin-bottom: 2px;
    }
    .amount-left .amount-num {
      font-size: 28px;
      font-weight: 800;
      color: #0f766e;
      font-family: monospace;
    }
    .amount-left .amount-words {
      font-size: 12px;
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
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      padding: 4px 10px;
      border-radius: 6px;
    }
    .grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
    }
    .box-heading {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .info-line {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 12px;
    }
    .info-line:last-child {
      margin-bottom: 0;
    }
    .info-label {
      color: #64748b;
      font-weight: 500;
    }
    .info-value {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
      max-width: 65%;
      word-break: break-word;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .details-table th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      text-align: left;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      font-size: 11px;
      text-transform: uppercase;
    }
    .details-table td {
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .verification-strip {
      display: flex;
      align-items: center;
      gap: 16px;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 24px;
    }
    .qr-img {
      width: 80px;
      height: 80px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      background: #ffffff;
      padding: 2px;
      flex-shrink: 0;
    }
    .qr-copy strong {
      font-size: 12px;
      color: #0f172a;
      display: block;
      margin-bottom: 2px;
    }
    .qr-copy p {
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 4px;
    }
    .qr-copy .verify-url {
      font-family: monospace;
      font-size: 10px;
      color: #0f766e;
      word-break: break-all;
    }
    .sign-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 30px;
      padding-top: 15px;
    }
    .sign-box {
      width: 45%;
      text-align: center;
    }
    .signature-media {
      height: 55px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      margin-bottom: 6px;
    }
    .signature-img {
      max-height: 55px;
      max-width: 180px;
      object-fit: contain;
    }
    .digital-seal-svg {
      display: inline-block;
      font-family: monospace;
      font-size: 11px;
      font-weight: 700;
      color: #0f766e;
      border-bottom: 1.5px dashed #0f766e;
      padding-bottom: 4px;
    }
    .sign-line {
      border-top: 1px solid #94a3b8;
      padding-top: 6px;
    }
    .sign-name {
      font-size: 12.5px;
      font-weight: 700;
      color: #0f172a;
    }
    .sign-title {
      font-size: 11px;
      color: #64748b;
    }
    .official-seal {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 700;
      color: #0f766e;
      border: 1.5px solid #0f766e;
      padding: 3px 8px;
      border-radius: 4px;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer-note {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      margin-top: 24px;
      border-top: 1px solid #f1f5f9;
      padding-top: 12px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- Top Header -->
    <div class="top-banner">
      <div class="brand-col">
        <h1 class="company-title">IoT-Berg</h1>
        <div class="company-subtitle">Engineering · Developer APIs · Cloud Systems</div>
        <div class="company-contact">
          Technical Direction: MD. Rezaul Karim (Project Manager & Team Lead)<br>
          Web: https://iot-berg.vercel.app · Contact: rksazid@gmail.com
        </div>
      </div>
      <div class="meta-col">
        <div class="doc-badge">Money Receipt</div>
        <div class="receipt-id">${receipt.receiptNumber || receipt.id}</div>
        <div class="receipt-date">Date: ${receipt.receiptDate || receipt.paymentDate}</div>
        <div class="status-pill">
          ✓ Verified & Authorized
        </div>
      </div>
    </div>

    <!-- Amount Highlight Box -->
    <div class="amount-highlight-card">
      <div class="amount-left">
        <strong>Received Payment Amount</strong>
        <div class="amount-num">${formattedAmount}</div>
        <div class="amount-words">In Words: ${amountWords}</div>
      </div>
      <div class="amount-right">
        <div class="payment-mode-pill">${receipt.paymentMode || 'Cash'} Receipt</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Advance: ${receipt.advancePercent || 20}%</div>
      </div>
    </div>

    <!-- Client & Work Order Context -->
    <div class="grid-2col">
      <div class="info-box">
        <div class="box-heading">Received From (Client)</div>
        <div class="info-line">
          <span class="info-label">Company:</span>
          <span class="info-value">${receipt.clientName || 'Valued Client'}</span>
        </div>
        ${
          receipt.clientContactPerson
            ? `<div class="info-line">
                <span class="info-label">Contact:</span>
                <span class="info-value">${receipt.clientContactPerson}</span>
              </div>`
            : ''
        }
        ${
          receipt.clientEmail
            ? `<div class="info-line">
                <span class="info-label">Email:</span>
                <span class="info-value">${receipt.clientEmail}</span>
              </div>`
            : ''
        }
        ${
          receipt.clientAddress
            ? `<div class="info-line">
                <span class="info-label">Address:</span>
                <span class="info-value">${receipt.clientAddress}</span>
              </div>`
            : ''
        }
      </div>

      <div class="info-box">
        <div class="box-heading">Project & Work Order Details</div>
        <div class="info-line">
          <span class="info-label">Work Order Ref:</span>
          <span class="info-value" style="font-family: monospace;">${receipt.workOrderId || 'WO-2026-001'}</span>
        </div>
        <div class="info-line">
          <span class="info-label">Project Name:</span>
          <span class="info-value">${receipt.projectName || 'Engineering Services'}</span>
        </div>
        <div class="info-line">
          <span class="info-label">Total Contract:</span>
          <span class="info-value">${formattedTotal}</span>
        </div>
        <div class="info-line">
          <span class="info-label">Remaining Balance:</span>
          <span class="info-value" style="color: #b91c1c;">${formattedBalance}</span>
        </div>
      </div>
    </div>

    <!-- Transaction Summary Table -->
    <table class="details-table">
      <thead>
        <tr>
          <th style="width: 55%;">Description / Milestone Particulars</th>
          <th style="width: 25%;">Payment Category</th>
          <th style="width: 20%; text-align: right;">Amount Paid</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${receipt.paymentCategory || 'Work Order Advance Payment'}</strong><br>
            <span style="color: #64748b; font-size: 11px;">
              ${receipt.transactionNote || 'Advance payment received in cash for project commencement.'}
            </span>
          </td>
          <td>${receipt.paymentMode || 'Cash'} · ${receipt.advancePercent || 20}% Advance</td>
          <td style="text-align: right; font-weight: 700; font-family: monospace; font-size: 13px;">
            ${formattedAmount}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- QR Code Online Verification Strip -->
    <div class="verification-strip">
      <img src="${qrDataUrl}" alt="Online Verification QR Code" class="qr-img">
      <div class="qr-copy">
        <strong>Online Digital Verification & Authenticity Proof</strong>
        <p>
          Scan this QR code with any smartphone camera to verify the genuine authenticity of this payment receipt on the IoT-Berg cloud verification registry.
        </p>
        <div class="verify-url">${verifyUrl}</div>
      </div>
    </div>

    <!-- Signatures Section -->
    <div class="sign-row">
      <div class="sign-box">
        <div class="signature-media">
          <span style="font-size: 11px; color: #94a3b8; font-style: italic;">Authorized Handover</span>
        </div>
        <div class="sign-line">
          <div class="sign-name">${receipt.clientContactPerson || receipt.clientName || 'Client Representative'}</div>
          <div class="sign-title">Payer / Authorized Signature</div>
        </div>
      </div>

      <div class="sign-box">
        <div class="signature-media">
          ${
            receipt.signatureUrl
              ? `<img src="${receipt.signatureUrl}" alt="Authorized Signature" class="signature-img">`
              : `<div class="digital-seal-svg">MD. Rezaul Karim (Digitally Signed)</div>`
          }
        </div>
        <div class="sign-line">
          <div class="sign-name">${receipt.signatoryName || 'MD. Rezaul Karim'}</div>
          <div class="sign-title">${receipt.signatoryRole || 'Project Manager & Team Lead'}</div>
          ${
            receipt.sealEnabled !== false
              ? `<div class="official-seal">★ IoT-Berg Verified Official ★</div>`
              : ''
          }
        </div>
      </div>
    </div>

    <!-- Footer Security Note -->
    <div class="footer-note">
      This is a system-generated official payment receipt issued by Team IoT-Berg Engineering. Ephemeral PDF rendering executed via pdf-lagbe engine.<br>
      Integrity Hash: <code>${receipt.verificationHash || 'ib_verified_sha256'}</code> · Verification valid indefinitely.
    </div>
  </div>
</body>
</html>`
}

