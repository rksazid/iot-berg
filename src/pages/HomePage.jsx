import { Link } from 'react-router-dom'
import { serviceCatalog, stats } from '../data/services'

export function HomePage() {
  const featuredService = serviceCatalog[0]

  return (
    <div className="page page-home">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Practical software systems for growing businesses</p>
          <h1>IoT-Berg builds focused digital services that solve real operational work.</h1>
          <p className="hero-text">
            We design and deliver software solutions with a strong product mindset. The first live service in the catalog is a production-ready HTML-to-PDF API, and the platform is prepared to expand as more tools are added.
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
          <article className="stat-card" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section className="split-section">
        <article className="content-card">
          <p className="section-label">What IoT-Berg does</p>
          <h2>Software delivery shaped around products, integrations, and workflow automation.</h2>
          <p>
            IoT-Berg is positioned as a software solution provider, not just a single-purpose tool. The site is structured so new services can be added later without redesigning the experience.
          </p>
        </article>
        <article className="content-card">
          <p className="section-label">Current service focus</p>
          <h2>Reliable document generation from modern web content.</h2>
          <p>
            The HTML-to-PDF service supports formatted documents, JavaScript-rendered visuals, custom fonts, and secure asset loading, making it suitable for reports, invoices, dashboards, and branded exports.
          </p>
        </article>
      </section>

      <section className="feature-band">
        <div className="feature-copy">
          <p className="section-label">Service spotlight</p>
          <h2>{featuredService.name}</h2>
          <p>{featuredService.description}</p>
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
