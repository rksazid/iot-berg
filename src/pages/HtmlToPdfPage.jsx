import { serviceCatalog } from '../data/services'
import { PageIntro } from '../components/ui/PageIntro'
import { PdfPlayground } from '../components/pdf/PdfPlayground'

export function HtmlToPdfPage() {
  const service = serviceCatalog[0]

  return (
    <div className="page page-service-detail">
      <PageIntro
        eyebrow="Service detail"
        title={service.name}
        description={service.description}
        compact
      />

      <section className="detail-grid">
        <aside className="detail-panel glass-panel">
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

        <PdfPlayground />
      </section>
    </div>
  )
}
