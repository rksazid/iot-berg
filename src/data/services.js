import { configuredEndpoints } from '../config/pdfService'

export const serviceCatalog = [
  {
    slug: 'html-to-pdf',
    name: 'HTML to PDF',
    category: 'Document Automation',
    status: 'Live Service',
    summary: 'Render real HTML, CSS, JavaScript, charts, fonts, and images into production-ready PDF documents.',
    description:
      'This service converts dynamic HTML into PDFs through a hardened rendering pipeline. It supports browser-grade layout, controlled JavaScript execution, external CDN assets, headers and footers, and page-level PDF controls.',
    endpoints: configuredEndpoints,
    metrics: [
      { value: String(configuredEndpoints.length), label: 'Live endpoints' },
      { value: '5', label: 'Paper formats' },
      { value: 'Auto', label: 'Fallback mode' },
    ],
    highlights: [
      'Full HTML/CSS/JS rendering with Puppeteer',
      'Chart.js, QR code, canvas, SVG, and custom font support',
      'Security layers for sanitization, API lockdown, and network filtering',
      'Configurable format, scale, margins, orientation, and headers/footers',
    ],
    capabilities: [
      'Works with reports, invoices, dashboards, and branded exports',
      'Supports secure CDN usage for scripts, fonts, and styles',
      'Live HTML preview before generating the final PDF',
    ],
  },
  {
    slug: 'md-to-pdf',
    name: 'Markdown to PDF',
    category: 'Document Automation',
    status: 'Live Service',
    summary: 'Write or paste Markdown and convert it to a formatted PDF with live preview.',
    description:
      'This service converts Markdown content into styled PDF documents. It supports GitHub Flavored Markdown including headings, lists, code blocks with syntax highlighting, tables, and task lists. Preview the rendered output before generating the final PDF.',
    endpoints: configuredEndpoints,
    metrics: [
      { value: String(configuredEndpoints.length), label: 'Live endpoints' },
      { value: '5', label: 'Paper formats' },
      { value: 'Auto', label: 'Fallback mode' },
    ],
    highlights: [
      'GitHub Flavored Markdown with tables, task lists, and strikethrough',
      'Code block syntax highlighting out of the box',
      'Live preview of rendered Markdown before PDF generation',
      'Same PDF options as HTML: format, margins, orientation, scale',
    ],
    capabilities: [
      'Works with documentation, notes, READMEs, and structured text content',
      'Preview panel shows exactly how the Markdown will render',
      'Shares endpoint infrastructure and fallback logic with other services',
    ],
  },
  {
    slug: 'docx-to-pdf',
    name: 'DOCX to PDF',
    category: 'Document Automation',
    status: 'Live Service',
    summary: 'Upload a .docx file and convert it to PDF with optional format and orientation controls.',
    description:
      'This service converts Microsoft Word documents (.docx) into PDF files. Upload a file up to 5 MB, optionally set paper format and orientation, and download the result. The conversion preserves document formatting and embedded images.',
    endpoints: configuredEndpoints,
    metrics: [
      { value: String(configuredEndpoints.length), label: 'Live endpoints' },
      { value: '5 MB', label: 'Max file size' },
      { value: 'Auto', label: 'Fallback mode' },
    ],
    highlights: [
      'Direct .docx file upload with drag-and-drop support',
      'Server-side conversion preserving document formatting',
      'Embedded images and styling carried over to PDF',
      'Optional paper format and landscape orientation controls',
    ],
    capabilities: [
      'Works with contracts, letters, reports, and any Word document',
      'Simple upload interface with file validation and size checking',
      'Shares endpoint infrastructure and fallback logic with other services',
    ],
  },
]

export const stats = [
  { value: '3', label: 'Live services in the catalog' },
  { value: '2', label: 'Production-grade endpoints' },
  { value: '3', label: 'Input formats supported' },
]
