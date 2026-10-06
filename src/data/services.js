import { configuredEndpoints } from '../config/pdfService'

export const serviceCatalog = [
  {
    slug: 'html-to-pdf',
    name: 'HTML to PDF',
    badge: 'Chromium Engine',
    category: 'Document Automation',
    status: 'Live Service',
    summary: 'Render full modern HTML5, CSS3, JavaScript charts, web fonts, and dynamic vector assets into crisp, publication-grade PDF documents.',
    description:
      'Hardened Chromium rendering engine with deterministic print media emulation. Supports client-side JavaScript execution (Chart.js, Canvas), custom web fonts, SVG graphics, automated pagination, and granular header/footer templating.',
    endpoints: configuredEndpoints,
    metrics: [
      { value: 'Sub-350ms', label: 'Average Latency' },
      { value: '5 Formats', label: 'Standard Paper Sizes' },
      { value: 'Auto-Failover', label: 'Multi-Region Routing' },
    ],
    highlights: [
      'Full modern CSS Grid, Flexbox, and print media emulation',
      'JavaScript charts (Chart.js), Canvas, SVG, and dynamic font rendering',
      'Ephemeral sandbox runtime with zero persistent file storage',
      'Precision page options: custom margins, scaling, format, and orientation',
    ],
    capabilities: [
      'Financial invoices, audit reports, executive decks, and statements',
      'Dynamic visual dashboards and data visualizations with wait-for-render',
      'Interactive split-screen developer studio with live preview',
    ],
  },
  {
    slug: 'md-to-pdf',
    name: 'Markdown to PDF',
    badge: 'GFM Compliant',
    category: 'Document Automation',
    status: 'Live Service',
    summary: 'Convert GitHub Flavored Markdown into beautifully formatted, structured PDF documents with real-time preview.',
    description:
      'Engineered for technical documentation, engineering runbooks, release notes, and formal briefs. Parses GFM tables, fenced code blocks with syntax highlighting, task lists, and blockquotes into clean, publication-grade PDFs.',
    endpoints: configuredEndpoints,
    metrics: [
      { value: 'GFM Spec', label: 'Syntax Standard' },
      { value: 'Live Sync', label: 'Interactive Preview' },
      { value: 'Instant', label: 'Client-Side Parsing' },
    ],
    highlights: [
      'GitHub Flavored Markdown with tables, task lists, and strikethrough',
      'Code block syntax highlighting with token-level styling',
      'Live reactive side-by-side preview with synchronized scrolling',
      'Granular PDF print controls: margins, orientation, and zoom scale',
    ],
    capabilities: [
      'Developer documentation, API reference guides, and engineering runbooks',
      'Technical briefs, research articles, whitepapers, and changelogs',
      'Unified multi-endpoint failover architecture with instant fallback',
    ],
  },
  {
    slug: 'docx-to-pdf',
    name: 'DOCX to PDF',
    badge: 'Native Parser',
    category: 'Document Automation',
    status: 'Live Service',
    summary: 'High-accuracy Word document conversion preserving typography, complex tables, embedded media, and page layouts.',
    description:
      'Convert Microsoft Word (.docx) documents up to 5 MB into PDF files seamlessly. Preserves styles, paragraph geometry, embedded photos, vector shapes, and document hierarchies with sub-second turnaround.',
    endpoints: configuredEndpoints,
    metrics: [
      { value: '5 MB', label: 'Max File Size' },
      { value: 'High Fidelity', label: 'Layout Retention' },
      { value: 'Zero Store', label: 'Ephemeral Pipeline' },
    ],
    highlights: [
      'Native .docx format parsing with drag-and-drop workflow',
      'High-fidelity preservation of tables, images, and fonts',
      'Client-side size validation and file integrity checks',
      'Flexible orientation and paper size overrides',
    ],
    capabilities: [
      'Commercial agreements, NDA templates, and legal filings',
      'Corporate letterheads, forms, resumes, and business proposals',
      'Instant multi-region cloud conversion with zero storage retention',
    ],
  },
]

export const stats = [
  { value: '99.9%', label: 'Pipeline Uptime SLA', desc: 'Continuous multi-cloud health monitoring' },
  { value: '< 350ms', label: 'Sub-Second Latency', desc: 'Optimized serverless rendering pipeline' },
  { value: '3 Engines', label: 'Production Formats', desc: 'HTML5, GFM Markdown, and Microsoft Word' },
  { value: '100% Private', label: 'Zero Retention', desc: 'Ephemeral in-memory document processing' },
]
