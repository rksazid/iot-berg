import { Link } from 'react-router-dom'
import { serviceCatalog, stats } from '../data/services'
import { PageIntro } from '../components/ui/PageIntro'

const companyPillars = [
  {
    eyebrow: 'Positioning',
    title: 'A company website first, a service catalog second.',
    description:
      'IoT-Berg is presented as a software solution provider with a clear platform direction, not only a single tool landing page.',
  },
  {
    eyebrow: 'Delivery Model',
    title: 'Modern frontend, reusable service architecture.',
    description:
      'The site structure separates layout, shared UI, service configuration, and integration logic so future offerings can be added cleanly.',
  },
  {
    eyebrow: 'Current Offer',
    title: 'Three production-ready document conversion services.',
    description:
      'HTML-to-PDF, Markdown-to-PDF, and DOCX-to-PDF are all live, covering reports, invoices, documentation, and branded exports.',
  },
]

const deliverySteps = [
  {
    step: '01',
    title: 'Define the workflow',
    description:
      'We shape the product around the real business task, integration point, or internal process that needs to be improved.',
  },
  {
    step: '02',
    title: 'Build the service layer',
    description:
      'Each solution is packaged into a usable service with a stable interface, scalable structure, and room for future extension.',
  },
  {
    step: '03',
    title: 'Ship a client-ready experience',
    description:
      'The delivery is polished enough to be presented to customers, stakeholders, or internal teams without reworking the frontend later.',
  },
]

export function HomePage() {
  const featuredService = serviceCatalog.find((s) => s.slug === 'html-to-pdf')

  return (
    <div className="page page-home">
      <section className="hero-panel glass-panel glass-panel-strong">
        <div className="hero-copy">
          <p className="eyebrow">Practical software systems for growing businesses</p>
          <h1>IoT-Berg turns software ideas into reliable services with a polished client-ready experience.</h1>
          <p className="hero-text">
            We design and ship focused software products with a scalable architecture. The service catalog includes HTML-to-PDF, Markdown-to-PDF, and DOCX-to-PDF conversion, with the platform ready to grow further.
          </p>
          <div className="hero-meta-row">
            <span className="meta-chip">Software solutions</span>
            <span className="meta-chip">Service-first architecture</span>
            <span className="meta-chip">Client-ready delivery</span>
          </div>
          <div className="hero-actions">
            <Link className="button button-primary" to="/services">
              Explore Services
            </Link>
            <Link className="button button-secondary" to="/services/html-to-pdf">
              Try HTML to PDF
            </Link>
          </div>
        </div>
        <div className="hero-card">
          <div className="service-signal">
            <span className="signal-badge">Live Now</span>
            <h2>{featuredService.name}</h2>
            <p>{featuredService.summary}</p>
          </div>
          <div className="hero-service-metrics">
            {featuredService.metrics.map((metric) => (
              <div className="hero-service-metric" key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
          <div className="mini-stack">
            {featuredService.highlights.map((item) => (
              <div className="mini-stack-row" key={item}>
                <span className="mini-dot" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => (
          <article className="stat-card glass-panel" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section className="company-grid">
        {companyPillars.map((pillar) => (
          <article className="company-card glass-panel" key={pillar.title}>
            <p className="section-label">{pillar.eyebrow}</p>
            <h2>{pillar.title}</h2>
            <p>{pillar.description}</p>
          </article>
        ))}
      </section>

      <PageIntro
        eyebrow="Company focus"
        title="Software delivery shaped around services, integrations, and operational workflows."
        description="IoT-Berg is positioned to grow into a broader software provider. The website now emphasizes that structure with clearer storytelling, reusable sections, and a stronger service presentation."
      />

      <section className="feature-band">
        <div className="feature-copy glass-panel">
          <p className="section-label">Service spotlight</p>
          <h2>{featuredService.name}</h2>
          <p>{featuredService.description}</p>
          <div className="capability-list">
            {featuredService.capabilities.map((item) => (
              <div className="capability-row" key={item}>
                <span className="mini-dot" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="feature-panel glass-panel glass-panel-strong">
          <div className="feature-panel-copy">
            <p className="section-label">What clients can do</p>
            <h2>Generate PDFs from HTML, Markdown, or Word documents with real controls.</h2>
            <p>
              Each service page includes endpoint selection, live preview, PDF generation, and the API-supported rendering options in one operational UI.
            </p>
          </div>
          <div className="feature-actions">
            <Link className="button button-primary" to="/services/html-to-pdf">
              Open Playground
            </Link>
            <Link className="button button-secondary" to="/services">
              View Service Catalog
            </Link>
          </div>
        </div>
      </section>

      <section className="process-section glass-panel">
        <div className="section-shell">
          <div className="section-heading">
            <p className="section-label">How IoT-Berg works</p>
            <h2>Structured delivery from idea to usable software service.</h2>
          </div>
          <div className="process-grid">
            {deliverySteps.map((item) => (
              <article className="process-card" key={item.step}>
                <span className="process-step">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-panel glass-panel glass-panel-strong">
        <div className="cta-copy">
          <p className="section-label">Explore the live services</p>
          <h2>Convert HTML, Markdown, or DOCX to PDF and extend the platform over time.</h2>
          <p>
            Three document conversion services are live now. The platform is structured to keep growing with additional services without another redesign cycle.
          </p>
        </div>
        <div className="cta-actions">
          <Link className="button button-primary" to="/services">
            Explore Services
          </Link>
          <Link className="button button-secondary" to="/services/html-to-pdf">
            Try HTML to PDF
          </Link>
        </div>
      </section>
    </div>
  )
}
