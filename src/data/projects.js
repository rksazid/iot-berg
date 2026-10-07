export const featuredProjects = [
  {
    id: 'pdf-lagbe',
    title: 'pdf-lagbe — High-Throughput Document & PDF API',
    shortTitle: 'pdf-lagbe API',
    tagline: 'Public Developer API & Headless Document Rendering Engine',
    type: 'Public REST API & Developer Engine',
    badge: 'Public API',
    badgeVariant: 'brand',
    status: 'Live & Open Source',
    repoUrl: 'https://github.com/rksazid/pdf-lagbe',
    liveUrl: 'https://pdf-lagbe.onrender.com',
    secondaryUrl: 'https://pdf-lagbe.vercel.app',
    playgroundRoute: '/convert/html',
    summary:
      'A production-grade, developer-friendly document-to-PDF REST API microservice. Converts HTML, Markdown, and Microsoft Word (.docx) files to pixel-perfect PDFs with full JavaScript execution, Chart.js support, QR codes, Tailwind CSS, and 3-layer security isolation.',
    description:
      'Built for developers needing reliable, programmatic PDF generation in their web and cloud applications. Anyone can send HTTP POST requests with raw HTML, Markdown strings, or DOCX binaries to receive standards-compliant PDF byte streams with sub-second turnaround and zero data retention.',
    techStack: ['Node.js', 'TypeScript', 'Express', 'Puppeteer v130', 'DOMPurify', 'Docker'],
    metrics: [
      { label: 'Avg Latency', value: '<350ms' },
      { label: 'Security Shield', value: '3-Layer' },
      { label: 'Execution', value: 'Zero Retention' },
      { label: 'Cloud Failover', value: 'Multi-Region' },
    ],
    highlights: [
      'Full CSS & JS execution: renders dynamic Chart.js, QRCode.js, Google Fonts, and Tailwind CDN scripts',
      'GitHub Flavored Markdown parsing with syntax-highlighted code blocks, tables, and task lists',
      'Binary DOCX to PDF conversion preserving formatting and embedded graphics',
      '3-layer security shield: DOMPurify sanitization, runtime API overrides, and network interceptors',
      'Configurable print layout: paper format (A4, Letter, A3), custom margins, landscape toggle, scale, and header/footer templates',
      'Ephemeral in-memory buffers: document payloads are never saved to disk or external databases',
    ],
    hasApiDocs: true,
  },
  {
    id: 'quran-word-by-word',
    title: 'Al-Quran Word By Word',
    shortTitle: 'Quran Word By Word',
    tagline: 'Linguistic Study & Translation Progressive Web App',
    type: 'Progressive Web Application (PWA)',
    badge: 'Production PWA',
    badgeVariant: 'accent',
    status: 'Production Live',
    liveUrl: 'https://quranwordbyword.onrender.com/',
    summary:
      'A modern, privacy-first Progressive Web Application designed for in-depth Quranic study. Features word-by-word Bengali and English translations, root word analysis, offline Mushaf reading via Service Worker caching, and customizable Arabic typography.',
    description:
      'Al-Quran Word By Word provides learners and scholars with deep linguistic breakdown of the Holy Quran. Built as an offline-first PWA with zero telemetry or tracking, it stores bookmarks and reading positions strictly on the user device while offering 30 Juz page navigation, audio synchronization, and built-in Dua & Tasbeeh counters.',
    techStack: ['React', 'Progressive Web App (PWA)', 'Service Workers', 'Arabic NLP', 'Web Audio API', 'Cloud Hosted'],
    metrics: [
      { label: 'Mushaf Scope', value: '30 Juz (Para)' },
      { label: 'Translations', value: 'Bengali + English' },
      { label: 'Architecture', value: 'Offline First PWA' },
      { label: 'User Privacy', value: 'Zero Telemetry' },
    ],
    highlights: [
      'Interactive word-by-word Arabic vocabulary decomposition with Bengali and English meanings',
      'Complete 30 Juz Mushaf reader with page-by-page memorization (Hifz) tracking',
      'Progressive Web App (PWA) with Service Worker offline caching for uninterrupted reading without internet',
      'Zero-tracking privacy model: no remote databases or cookies; all reading state stays in local storage',
      'Customizable reading experience: multiple Arabic calligraphic fonts (Uthmani, Indo-Pak), dark & light themes, and auto-scroll',
      'Curated Dua collections with integrated digital Tasbeeh counter and audio recitation',
    ],
    hasApiDocs: false,
  },
  {
    id: 'new-age-kids-school',
    title: 'New Age Kids School Portal',
    shortTitle: 'New Age Kids School',
    tagline: 'Institutional Management Platform & Student Admissions Portal',
    type: 'Institutional Platform & LMS',
    badge: 'Live School Portal',
    badgeVariant: 'success',
    status: 'Production Live',
    liveUrl: 'https://newagekidsschool.com/',
    summary:
      'A comprehensive web portal and school management platform for New Age Kids School, serving hundreds of students across international cohorts in Japan, Bangladesh, and globally with admissions, digital academics, and Zoom integrations.',
    description:
      'New Age Kids School delivers an end-to-end academic management ecosystem. It powers the school digital presence, dynamic admission cycles, batch schedules, faculty profiles, video orientations, homework submissions, and digital academic syllabi tailored for multicultural multilingual education (Bangla, English, and Arabic).',
    techStack: ['Ruby on Rails', 'PostgreSQL', 'AWS S3 Asset Pipeline', 'Bootstrap 5', 'Zoom Cloud API', 'Responsive UI'],
    metrics: [
      { label: 'Active Students', value: '350+ Students' },
      { label: 'Academic Batches', value: '90+ Batches' },
      { label: 'Faculty Directory', value: '28 Teachers' },
      { label: 'International Reach', value: 'Japan & BD' },
    ],
    highlights: [
      'Automated multi-session digital admissions workflow with multi-currency fee schedules (USD, BDT, JPY, EUR)',
      'Academic batch and lesson portal coordinating dual-timezone schedules across Japan and Bangladesh',
      'Faculty directory showcasing specialized PhD and Master-level educators across languages and sciences',
      'High-throughput AWS S3 media pipeline for institutional notice boards, photo galleries, and digital magazines',
      'Integrated virtual classroom workflow with Zoom App schedule links and orientation video modules',
      'Multilingual curriculum management for Bangla, English, and Arabic foundational studies',
    ],
    hasApiDocs: false,
  },
]

export const apiDocumentation = {
  serviceName: 'pdf-lagbe API',
  version: 'v1.2.0',
  githubUrl: 'https://github.com/rksazid/pdf-lagbe',
  baseUrlRender: 'https://pdf-lagbe.onrender.com',
  baseUrlVercel: 'https://pdf-lagbe.vercel.app',
  localUrl: 'http://localhost:3000',
  description:
    'pdf-lagbe is an open, high-throughput document-to-PDF REST API. You can send JSON or multipart requests from any backend (Node.js, Python, PHP, Go, Ruby) or frontend application to generate high-resolution PDFs.',
  endpoints: [
    {
      id: 'html-to-pdf',
      method: 'POST',
      path: '/api/v1/html-to-pdf',
      title: 'HTML to PDF Conversion',
      description:
        'Compiles raw HTML or full document markup into a PDF using headless Chromium. Executes dynamic JavaScript, Chart.js, QR codes, Google Fonts, and custom @page print rules.',
      contentType: 'application/json',
      responseType: 'application/pdf',
      playgroundTool: 'html',
      params: [
        { name: 'html', type: 'string', required: true, default: '—', desc: 'Raw HTML markup or template string (max 2 MB).' },
        { name: 'format', type: 'string', required: false, default: '"A4"', desc: 'Paper format: "A4", "Letter", "A3", "Legal", "Tabloid".' },
        { name: 'landscape', type: 'boolean', required: false, default: 'false', desc: 'Render in landscape orientation.' },
        { name: 'margin', type: 'object', required: false, default: '1cm all sides', desc: 'Object specifying CSS margins: { top, right, bottom, left } (e.g. "12mm" or "0.5in").' },
        { name: 'printBackground', type: 'boolean', required: false, default: 'true', desc: 'Whether to render CSS background colors and images.' },
        { name: 'scale', type: 'number', required: false, default: '1.0', desc: 'Zoom/scale factor between 0.1 and 2.0.' },
        { name: 'displayHeaderFooter', type: 'boolean', required: false, default: 'false', desc: 'Display print header and footer templates.' },
        { name: 'headerTemplate', type: 'string', required: false, default: '—', desc: 'HTML snippet for page header (supports classes: date, title, pageNumber, totalPages).' },
        { name: 'footerTemplate', type: 'string', required: false, default: '—', desc: 'HTML snippet for page footer.' },
        { name: 'preferCSSPageSize', type: 'boolean', required: false, default: 'false', desc: 'Give precedence to @page size CSS declarations over the format option.' },
        { name: 'waitForSelector', type: 'string', required: false, default: '—', desc: 'CSS selector to wait for before capturing the PDF snapshot.' },
        { name: 'waitForTimeout', type: 'number', required: false, default: '—', desc: 'Additional delay in milliseconds (0 - 5000) for async charts or scripts to settle.' },
      ],
      curlSnippet: `curl -X POST https://pdf-lagbe.onrender.com/api/v1/html-to-pdf \\
  -H "Content-Type: application/json" \\
  -d '{
    "html": "<html><head><style>body{font-family:sans-serif;padding:32px;}h1{color:#4f46e5;}</style></head><body><h1>Invoice #INV-2026</h1><p>Amount: $1,450.00 USD</p></body></html>",
    "format": "A4",
    "landscape": false,
    "margin": { "top": "15mm", "right": "15mm", "bottom": "15mm", "left": "15mm" },
    "printBackground": true
  }' \\
  --output invoice.pdf`,
      jsSnippet: `// Node.js (fetch) or browser client
const response = await fetch('https://pdf-lagbe.onrender.com/api/v1/html-to-pdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    html: \`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Inter, sans-serif; padding: 2rem; color: #0f172a; }
            h1 { color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
          </style>
        </head>
        <body>
          <h1>Executive Report</h1>
          <p>Generated dynamically via IoT-Berg pdf-lagbe API.</p>
        </body>
      </html>
    \`,
    format: 'A4',
    printBackground: true,
    scale: 1,
  }),
});

if (!response.ok) {
  throw new Error(\`Failed to generate PDF: \${response.statusText}\`);
}

const pdfBlob = await response.blob();
// In browser: window.open(URL.createObjectURL(pdfBlob));
// In Node.js: fs.writeFileSync('report.pdf', Buffer.from(await response.arrayBuffer()));`,
      pythonSnippet: `import requests

url = "https://pdf-lagbe.onrender.com/api/v1/html-to-pdf"
payload = {
    "html": """
    <html>
      <body style="font-family: sans-serif; padding: 30px;">
        <h1 style="color: #4f46e5;">Automated Certificate</h1>
        <p>Recipient: Rezaul Karim</p>
      </body>
    </html>
    """,
    "format": "A4",
    "printBackground": True,
    "margin": {"top": "1cm", "right": "1cm", "bottom": "1cm", "left": "1cm"}
}

response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})

if response.status_code == 200:
    with open("certificate.pdf", "wb") as f:
        f.write(response.content)
    print("PDF saved successfully!")
else:
    print(f"Error {response.status_code}: {response.text}")`,
    },
    {
      id: 'md-to-pdf',
      method: 'POST',
      path: '/api/v1/md-to-pdf',
      title: 'Markdown to PDF Conversion',
      description:
        'Converts GitHub Flavored Markdown (GFM) strings into styled PDFs with syntax-highlighted code blocks, tables, task lists, and footnotes.',
      contentType: 'application/json',
      responseType: 'application/pdf',
      playgroundTool: 'markdown',
      params: [
        { name: 'markdown', type: 'string', required: true, default: '—', desc: 'Markdown source string (max 2 MB).' },
        { name: 'format', type: 'string', required: false, default: '"A4"', desc: 'Paper format: "A4", "Letter", "A3", "Legal", "Tabloid".' },
        { name: 'landscape', type: 'boolean', required: false, default: 'false', desc: 'Render in landscape orientation.' },
        { name: 'margin', type: 'object', required: false, default: '1cm all sides', desc: 'Object specifying margins: { top, right, bottom, left }.' },
        { name: 'printBackground', type: 'boolean', required: false, default: 'true', desc: 'Include background colors.' },
        { name: 'scale', type: 'number', required: false, default: '1.0', desc: 'Scale multiplier (0.1 - 2.0).' },
      ],
      curlSnippet: `curl -X POST https://pdf-lagbe.onrender.com/api/v1/md-to-pdf \\
  -H "Content-Type: application/json" \\
  -d '{
    "markdown": "# Technical Specification\\n\\n| Endpoint | Protocol | Latency |\\n|---|---|---|\\n| \`/api/v1/html-to-pdf\` | HTTP/2 | ~280ms |\\n\\n\`\`\`typescript\\ninterface ReportPayload {\\n  title: string;\\n  timestamp: number;\\n}\\n\`\`\`\\n\\n- [x] Security audit verified\\n- [x] Ephemeral sandbox active",
    "format": "A4"
  }' \\
  --output specification.pdf`,
      jsSnippet: `const response = await fetch('https://pdf-lagbe.onrender.com/api/v1/md-to-pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    markdown: \`
# Quarterly Changelog

## Core Improvements
- **Dual Cloud Routing**: Auto-failover across Render and Vercel.
- **Syntax Highlighting**: Prism themes for 20+ languages.

| Service | Status | Uptime |
|---------|--------|--------|
| Puppeteer Cluster | Online | 99.9% |
| DOCX Converter | Online | 99.9% |
    \`,
    format: 'A4',
    margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
  })
});

const pdfBlob = await response.blob();`,
      pythonSnippet: `import requests

url = "https://pdf-lagbe.onrender.com/api/v1/md-to-pdf"
payload = {
    "markdown": "# Architecture Blueprint\\n\\n- Ephemeral Chromium\\n- DOMPurify Isolation",
    "format": "Letter"
}

res = requests.post(url, json=payload)
with open("blueprint.pdf", "wb") as f:
    f.write(res.content)`,
    },
    {
      id: 'docx-to-pdf',
      method: 'POST',
      path: '/api/v1/docx-to-pdf',
      title: 'Word (.docx) to PDF Conversion',
      description:
        'Uploads binary Microsoft Word (.docx) files up to 5 MB and converts them into standardized PDFs while preserving embedded images, tables, and typography.',
      contentType: 'multipart/form-data',
      responseType: 'application/pdf',
      playgroundTool: 'docx',
      params: [
        { name: 'file', type: 'file (.docx)', required: true, default: '—', desc: 'Binary DOCX document file (max 5 MB).' },
        { name: 'format', type: 'string', required: false, default: '"A4"', desc: 'Optional output page size override.' },
        { name: 'landscape', type: 'string ("true"|"false")', required: false, default: '"false"', desc: 'Optional landscape orientation switch.' },
      ],
      curlSnippet: `curl -X POST https://pdf-lagbe.onrender.com/api/v1/docx-to-pdf \\
  -F "file=@annual-report.docx" \\
  -F "format=A4" \\
  --output annual-report.pdf`,
      jsSnippet: `const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('format', 'A4');

const response = await fetch('https://pdf-lagbe.onrender.com/api/v1/docx-to-pdf', {
  method: 'POST',
  body: formData,
});

const pdfBlob = await response.blob();`,
      pythonSnippet: `import requests

url = "https://pdf-lagbe.onrender.com/api/v1/docx-to-pdf"
files = {"file": open("contract.docx", "rb")}
data = {"format": "A4"}

response = requests.post(url, files=files, data=data)
with open("contract.pdf", "wb") as f:
    f.write(response.content)`,
    },
    {
      id: 'health-check',
      method: 'GET',
      path: '/health',
      title: 'Cluster Health & Telemetry',
      description:
        'Returns cluster connectivity status, Puppeteer browser pool health, process uptime, and memory usage statistics.',
      contentType: 'none',
      responseType: 'application/json',
      playgroundTool: 'html',
      params: [],
      curlSnippet: `curl -X GET https://pdf-lagbe.onrender.com/health`,
      jsSnippet: `const status = await fetch('https://pdf-lagbe.onrender.com/health').then(r => r.json());
console.log('Engine status:', status);`,
      pythonSnippet: `import requests
res = requests.get("https://pdf-lagbe.onrender.com/health")
print(res.json())`,
    },
  ],
}
