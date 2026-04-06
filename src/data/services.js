import { configuredEndpoints } from '../config/pdfService'

export const serviceCatalog = [
  {
    slug: 'html-to-pdf',
    name: 'HTML to PDF',
    summary: 'Render real HTML, CSS, JavaScript, charts, fonts, and images into production-ready PDF documents.',
    description:
      'This service converts dynamic HTML into PDFs through a hardened rendering pipeline. It supports browser-grade layout, controlled JavaScript execution, external CDN assets, headers and footers, and page-level PDF controls.',
    endpoints: configuredEndpoints,
    highlights: [
      'Full HTML/CSS/JS rendering with Puppeteer',
      'Chart.js, QR code, canvas, SVG, and custom font support',
      'Security layers for sanitization, API lockdown, and network filtering',
      'Configurable format, scale, margins, orientation, and headers/footers',
    ],
    capabilities: [
      'Works with reports, invoices, dashboards, and branded exports',
      'Supports secure CDN usage for scripts, fonts, and styles',
      'Designed so new services can be added alongside it later',
    ],
  },
]

export const stats = [
  { value: '3', label: 'Security layers in the PDF pipeline' },
  { value: '5', label: 'Built-in paper formats supported' },
  { value: '2', label: 'Configurable live endpoints available' },
]
