import { Link, Navigate, useParams } from 'react-router-dom'
import { serviceCatalog } from '../data/services'
import { PdfPlayground } from '../components/pdf/PdfPlayground'
import { MdPlayground } from '../components/pdf/MdPlayground'
import { DocxPlayground } from '../components/pdf/DocxPlayground'

const tools = [
  {
    key: 'html',
    slug: 'html-to-pdf',
    label: 'HTML to PDF',
    shortLabel: 'HTML',
    badge: 'Puppeteer',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    Component: PdfPlayground,
  },
  {
    key: 'markdown',
    slug: 'md-to-pdf',
    label: 'Markdown to PDF',
    shortLabel: 'Markdown',
    badge: 'GFM Spec',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    Component: MdPlayground,
  },
  {
    key: 'docx',
    slug: 'docx-to-pdf',
    label: 'DOCX to PDF',
    shortLabel: 'Word (.docx)',
    badge: 'Word Engine',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6a2 2 0 0 0-2 2z" />
        <path d="M14 2v6h6" />
        <path d="M9 13v4" />
        <path d="M12 13v4" />
        <path d="M15 13v4" />
      </svg>
    ),
    Component: DocxPlayground,
  },
]

export function ConvertPage() {
  const { tool } = useParams()

  if (tool && !tools.some((t) => t.key === tool)) {
    return <Navigate to="/convert/html" replace />
  }

  const current = tools.find((t) => t.key === tool) ?? tools[0]
  const service = serviceCatalog.find((s) => s.slug === current.slug)
  const Playground = current.Component

  return (
    <div className="page page-convert">
      {/* Studio Header Bar */}
      <header className="workspace-head glass-panel">
        <div className="workspace-head-top">
          <div className="studio-breadcrumb">
            <Link to="/">Studio</Link>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">{current.label}</span>
          </div>

          <div className="engine-status-pill">
            <span className="status-ping-inline" />
            <span>Dual Clusters Online</span>
          </div>
        </div>

        <div className="workspace-head-body">
          <div className="workspace-title-wrap">
            <h1 className="workspace-title">{service.name} Studio</h1>
            <p className="workspace-desc">{service.description}</p>
          </div>

          <nav className="convert-tabs" aria-label="Converter formats">
            {tools.map((t) => {
              const isActive = t.key === current.key
              return (
                <Link
                  key={t.key}
                  to={`/convert/${t.key}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`convert-tab${isActive ? ' convert-tab-active' : ''}`}
                >
                  <span className="convert-tab-icon" aria-hidden="true">{t.icon}</span>
                  <span className="convert-tab-label convert-tab-label-full">{t.label}</span>
                  <span className="convert-tab-label convert-tab-label-short">{t.shortLabel}</span>
                  <span className="convert-tab-tag">{t.badge}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Compact Telemetry Strip */}
        <div className="workspace-meta-strip">
          <div className="meta-strip-item">
            <span className="strip-lbl">Active Format</span>
            <span className="strip-val">{service.name}</span>
          </div>
          <div className="meta-strip-item">
            <span className="strip-lbl">Rendering Engine</span>
            <span className="strip-val">{service.badge}</span>
          </div>
          <div className="meta-strip-item">
            <span className="strip-lbl">Routing Strategy</span>
            <span className="strip-val">Auto Failover (Render → Vercel)</span>
          </div>
          <div className="meta-strip-item">
            <span className="strip-lbl">Security Policy</span>
            <span className="strip-val">Ephemeral / Zero Storage</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="workspace">
        <section className="detail-grid">
          <aside className="detail-panel">
            <div className="detail-block">
              <span className="section-label">Engine Capabilities</span>
              <div className="detail-list">
                {service.highlights.map((item) => (
                  <div className="detail-list-item" key={item}>
                    <span className="mini-dot" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-block">
              <span className="section-label">Verified API Endpoints</span>
              <div className="endpoint-list">
                {service.endpoints.map((endpoint) => (
                  <div className="endpoint-card" key={endpoint.value}>
                    <div className="endpoint-card-head">
                      <strong>{endpoint.name}</strong>
                      <span className="status-dot-green" />
                    </div>
                    <span className="endpoint-url">{endpoint.value}</span>
                    <p>{endpoint.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-block support-box">
              <span className="section-label">Production SLA</span>
              <p className="support-copy">
                Need enterprise volume, dedicated headless clusters, or custom fonts? Our team provides turnkey cloud configurations.
              </p>
            </div>
          </aside>

          {/* key remounts the playground on tab change so each tool starts clean */}
          <div className="playground-wrap">
            <Playground key={current.key} />
          </div>
        </section>
      </div>
    </div>
  )
}
