import { Link, Navigate, useParams } from 'react-router-dom'
import { serviceCatalog } from '../data/services'
import { PdfPlayground } from '../components/pdf/PdfPlayground'
import { MdPlayground } from '../components/pdf/MdPlayground'
import { DocxPlayground } from '../components/pdf/DocxPlayground'

const tools = [
  { key: 'html', slug: 'html-to-pdf', label: 'HTML', icon: 'H', Component: PdfPlayground },
  { key: 'markdown', slug: 'md-to-pdf', label: 'Markdown', icon: 'M', Component: MdPlayground },
  { key: 'docx', slug: 'docx-to-pdf', label: 'DOCX', icon: 'W', Component: DocxPlayground },
]

export function ConvertPage() {
  const { tool } = useParams()

  // Unknown tool slug → fall back to the first tab.
  if (tool && !tools.some((t) => t.key === tool)) {
    return <Navigate to="/convert/html" replace />
  }

  const current = tools.find((t) => t.key === tool) ?? tools[0]
  const service = serviceCatalog.find((s) => s.slug === current.slug)
  const Playground = current.Component

  return (
    <div className="page page-convert">
      <header className="workspace-head">
        <p className="eyebrow">Converter workspace</p>
        <h1>Convert documents to PDF</h1>
        <p className="page-intro-text">
          Choose a source format, edit or upload your content, preview the result, and generate a
          production-ready PDF — all from one workspace.
        </p>
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
                {t.label} to PDF
              </Link>
            )
          })}
        </nav>
      </header>

      <div className="workspace">
        <section className="service-summary-grid">
          {service.metrics.map((metric) => (
            <article className="summary-card" key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          ))}
        </section>

        <section className="detail-grid">
          <aside className="detail-panel">
            <div className="detail-block">
              <p className="section-label">Highlights</p>
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
              <p className="section-label">Verified endpoints</p>
              <div className="endpoint-list">
                {service.endpoints.map((endpoint) => (
                  <div className="endpoint-card" key={endpoint.value}>
                    <strong>{endpoint.name}</strong>
                    <span>{endpoint.value}</span>
                    <p>{endpoint.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* key remounts the playground on tab change so each tool starts clean */}
          <Playground key={current.key} />
        </section>
      </div>
    </div>
  )
}
