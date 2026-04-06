import { Link } from 'react-router-dom'
import { serviceCatalog, stats } from '../data/services'
import { PageIntro } from '../components/ui/PageIntro'

export function HomePage() {
  const featuredService = serviceCatalog[0]

  return (
    <div className="page page-home">
      <section className="hero-panel glass-panel glass-panel-strong">
        <div className="hero-copy">
          <p className="eyebrow">Practical software systems for growing businesses</p>
          <h1>IoT-Berg turns software ideas into reliable services with a polished client-ready experience.</h1>
          <p className="hero-text">
            We design and ship focused software products with a scalable architecture. The current service catalog starts with HTML-to-PDF generation and is ready to grow into a broader solution platform.
          </p>
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

      <section className="split-section">
        <article className="content-card glass-panel">
          <p className="section-label">What IoT-Berg does</p>
          <h2>Product-grade engineering for services, integrations, and workflow automation.</h2>
          <p>
            IoT-Berg is presented as a software solution provider, not a one-off utility. The frontend structure, service catalog, and shared design system are prepared so additional products can be added without a redesign.
          </p>
        </article>
        <article className="content-card glass-panel">
          <p className="section-label">Current service focus</p>
          <h2>Document generation that handles modern web layouts correctly.</h2>
          <p>
            The HTML-to-PDF service supports styled documents, JavaScript-rendered visuals, external assets, custom fonts, and branded header/footer controls, making it useful for reports, invoices, dashboards, and exports.
          </p>
        </article>
      </section>

      <PageIntro
        eyebrow="Build approach"
        title="Professional structure for a service platform, not only a single page."
        description="The app now separates layout, shared UI, service configuration, and PDF integration logic so future services can reuse the same foundations cleanly."
      />

      <section className="feature-band glass-panel">
        <div className="feature-copy">
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
        <div className="feature-actions">
          <Link className="button button-primary" to="/services/html-to-pdf">
            Open Playground
          </Link>
          <Link className="button button-secondary" to="/services">
            View Service Catalog
          </Link>
        </div>
      </section>
    </div>
  )
}
