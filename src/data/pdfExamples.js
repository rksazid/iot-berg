export const starterTemplate = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
        background: #ffffff;
        padding: 48px;
        line-height: 1.5;
        font-size: 14px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 24px;
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 32px;
      }
      .brand-title {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: #0f172a;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .brand-badge {
        display: inline-block;
        padding: 4px 10px;
        background: #eef2ff;
        color: #4f46e5;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .doc-meta {
        text-align: right;
        color: #64748b;
        font-size: 12px;
        line-height: 1.6;
      }
      .doc-meta strong {
        color: #0f172a;
        font-size: 14px;
        display: block;
      }
      .hero-banner {
        background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
        color: #ffffff;
        border-radius: 12px;
        padding: 24px 28px;
        margin-bottom: 28px;
      }
      .hero-banner h1 {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 6px;
      }
      .hero-banner p {
        font-size: 13px;
        opacity: 0.9;
      }
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 28px;
      }
      .metric-box {
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 16px;
        background: #f8fafc;
      }
      .metric-label {
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 4px;
      }
      .metric-value {
        font-size: 20px;
        font-weight: 700;
        color: #0f172a;
      }
      .table-card {
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 28px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }
      th {
        background: #f1f5f9;
        color: #475569;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 12px 16px;
      }
      td {
        padding: 12px 16px;
        border-top: 1px solid #f1f5f9;
        font-size: 13px;
      }
      .badge-success {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        background: #dcfce7;
        color: #15803d;
        font-size: 11px;
        font-weight: 600;
      }
      .footer-note {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
        color: #94a3b8;
        font-size: 11px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="brand-title">
          <span>IoT-Berg</span>
          <span class="brand-badge">Automated Report</span>
        </div>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Enterprise Document Generation Pipeline</p>
      </div>
      <div class="doc-meta">
        <strong>DOC-2026-9481</strong>
        <div>Date: October 6, 2026</div>
        <div>Status: Approved & Verified</div>
      </div>
    </div>

    <div class="hero-banner">
      <h1>Production Verification Summary</h1>
      <p>Automated PDF document rendered via IoT-Berg serverless rendering engine.</p>
    </div>

    <div class="metrics-grid">
      <div class="metric-box">
        <div class="metric-label">Execution Latency</div>
        <div class="metric-value">284 ms</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Pipeline Reliability</div>
        <div class="metric-value">99.99%</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Security Sandbox</div>
        <div class="metric-value">Isolated</div>
      </div>
    </div>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>Module Name</th>
            <th>Specification</th>
            <th>Performance</th>
            <th>Validation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>HTML-to-PDF Core</strong></td>
            <td>Puppeteer Chromium v130</td>
            <td>1.2s render</td>
            <td><span class="badge-success">Passing</span></td>
          </tr>
          <tr>
            <td><strong>CSS Grid & Flexbox</strong></td>
            <td>CSS Print Media standard</td>
            <td>Pixel Perfect</td>
            <td><span class="badge-success">Passing</span></td>
          </tr>
          <tr>
            <td><strong>Dynamic Font Injection</strong></td>
            <td>Woff2 / OpenType embed</td>
            <td>Instant</td>
            <td><span class="badge-success">Passing</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer-note">
      <span>Generated securely with IoT-Berg API Infrastructure</span>
      <span>Confidential · Enterprise Document Engine</span>
    </div>
  </body>
</html>`

export const headerTemplateExample = `<div style="width:100%;font-size:9px;padding:0 24px;color:#94a3b8;font-family:sans-serif;display:flex;justify-content:space-between;">
  <span>IoT-Berg Document Pipeline</span>
  <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
</div>`

export const footerTemplateExample = `<div style="width:100%;font-size:9px;padding:0 24px;color:#94a3b8;font-family:sans-serif;text-align:center;">
  Confidential · Generated by IoT-Berg Cloud API
</div>`
