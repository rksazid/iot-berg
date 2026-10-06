import { Link } from 'react-router-dom'
import { serviceCatalog, stats } from '../data/services'

const companyPillars = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    eyebrow: 'Performance',
    title: 'High-Throughput Rendering Pipeline',
    description:
      'Engineered with optimized Chromium instances to process heavy CSS layouts, live JavaScript charts, and vector assets with deterministic sub-second latency.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    eyebrow: 'Security & Privacy',
    title: 'Zero-Retention Ephemeral Execution',
    description:
      'Documents are processed in strictly isolated in-memory memory sandboxes. Payload data is never persisted to disk or external databases.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    eyebrow: 'High Availability',
    title: 'Multi-Region Intelligent Failover',
    description:
      'Automated circuit breakers route traffic across multi-cloud clusters to ensure uninterrupted production document generation for critical workflows.',
  },
]

const deliverySteps = [
  {
    step: '01',
    title: 'Submit Payload & Layout Rules',
    description:
      'Send raw HTML, Markdown strings, or binary DOCX files. Specify print margins, orientation, scale, and custom CSS print stylesheets.',
  },
  {
    step: '02',
    title: 'Isolated Sandbox Compilation',
    description:
      'Headless Chromium renders DOM structures, evaluates dynamic JavaScript charts (Chart.js), and applies precise headers and footers.',
  },
  {
    step: '03',
    title: 'Instant Binary Stream Delivery',
    description:
      'Receive a standards-compliant, lightweight PDF buffer ready for immediate client download, automated email dispatch, or cloud storage.',
  },
]

export function HomePage() {
  const htmlService = serviceCatalog.find((s) => s.slug === 'html-to-pdf')

  return (
    <div className="page page-home">
      {/* Hero Section */}
      <section className="hero-panel glass-panel glass-panel-strong">
        <div className="hero-copy">
          <div className="hero-eyebrow-wrap">
            <span className="eyebrow">
              <span className="eyebrow-dot" /> Enterprise Document Systems
            </span>
            <span className="version-pill">v2.4 Active</span>
          </div>
          
          <h1 className="hero-title">
            High-performance software systems & automated document engines.
          </h1>
          
          <p className="hero-text">
            IoT-Berg engineers resilient cloud software, developer APIs, and production-grade PDF pipelines. Transform dynamic HTML, Markdown, and Microsoft Word documents into pixel-perfect PDFs with sub-second turnaround.
          </p>

          <div className="hero-meta-row">
            <span className="meta-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Sub-350ms Latency
            </span>
            <span className="meta-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Zero-Persistence Sandbox
            </span>
            <span className="meta-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Dual-Cloud Failover
            </span>
          </div>

          <div className="hero-actions">
            <Link className="button button-primary" to="/convert">
              <span>Open Document Studio</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </Link>
            <Link className="button button-secondary" to="/convert/html">
              <span>Try HTML to PDF Demo</span>
            </Link>
          </div>
        </div>

        {/* Hero Interactive Telemetry Card */}
        <div className="hero-card">
          <div className="hero-card-header">
            <div className="console-indicator">
              <span className="console-dot red" />
              <span className="console-dot yellow" />
              <span className="console-dot green" />
              <span className="console-title">engine.iotberg.cloud · active</span>
            </div>
            <span className="signal-badge">99.9% Uptime</span>
          </div>

          <div className="telemetry-block">
            <div className="telemetry-main">
              <span className="telemetry-badge">Live Pipeline</span>
              <h2 className="telemetry-title">{htmlService.name}</h2>
              <p className="telemetry-desc">{htmlService.summary}</p>
            </div>

            <div className="hero-service-metrics">
              {htmlService.metrics.map((metric) => (
                <div className="hero-service-metric" key={metric.label}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>

            <div className="console-code-preview">
              <div className="code-line"><span className="code-keyword">POST</span> <span className="code-string">/api/v1/html-to-pdf</span> <span className="code-status">200 OK</span></div>
              <div className="code-line"><span className="code-comment">// Render pipeline: Puppeteer v130 · Latency: 284ms</span></div>
              <div className="code-line"><span className="code-var">buffer</span>: <span className="code-type">application/pdf (34.2 KB)</span></div>
            </div>

            <div className="mini-stack">
              {htmlService.highlights.slice(0, 3).map((item) => (
                <div className="mini-stack-row" key={item}>
                  <span className="mini-dot" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-grid">
        {stats.map((stat) => (
          <article className="stat-card glass-panel" key={stat.label}>
            <div className="stat-value-wrap">
              <strong>{stat.value}</strong>
            </div>
            <span className="stat-label">{stat.label}</span>
            <p className="stat-desc">{stat.desc}</p>
          </article>
        ))}
      </section>

      {/* Architecture & Engineering Pillars */}
      <section id="architecture" className="pillars-section">
        <div className="section-head-center">
          <span className="section-label">Core Architecture</span>
          <h2 className="section-title">Engineered for deterministic scale and developer agility.</h2>
          <p className="section-subtitle">
            Every document pipeline is isolated in an ephemeral runtime designed to maintain sub-second turnaround without cold starts.
          </p>
        </div>

        <div className="company-grid">
          {companyPillars.map((pillar) => (
            <article className="company-card glass-panel" key={pillar.title}>
              <div className="pillar-icon-box">{pillar.icon}</div>
              <span className="pillar-eyebrow">{pillar.eyebrow}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Services Showcase Matrix */}
      <section className="catalog-section">
        <div className="section-head-center">
          <span className="section-label">Production Engines</span>
          <h2 className="section-title">Three dedicated document conversion pipelines.</h2>
          <p className="section-subtitle">
            Test, preview, and generate documents in our unified developer workspace.
          </p>
        </div>

        <div className="services-showcase-grid">
          {serviceCatalog.map((service) => (
            <article className="service-showcase-card glass-panel" key={service.slug}>
              <div className="service-card-top">
                <span className="service-badge">{service.badge}</span>
                <span className="status-ping-inline">Ready</span>
              </div>
              <h3 className="service-card-name">{service.name}</h3>
              <p className="service-card-summary">{service.summary}</p>
              
              <div className="service-card-metrics">
                {service.metrics.map((m) => (
                  <div className="service-mini-metric" key={m.label}>
                    <span className="m-val">{m.value}</span>
                    <span className="m-lbl">{m.label}</span>
                  </div>
                ))}
              </div>

              <div className="service-card-features">
                {service.highlights.slice(0, 3).map((h) => (
                  <div className="feature-tick-row" key={h}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              <div className="service-card-action">
                <Link className="button button-secondary button-full" to={`/convert/${service.slug.replace('-to-pdf', '')}`}>
                  <span>Open {service.name} Studio</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Execution Pipeline / How It Works */}
      <section className="process-section glass-panel">
        <div className="section-shell">
          <div className="section-heading">
            <span className="section-label">Execution Lifecycle</span>
            <h2>How the document rendering pipeline operates.</h2>
            <p>From initial REST request or interactive editor input to verified PDF byte stream.</p>
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

      {/* Enterprise Call To Action */}
      <section className="cta-panel glass-panel glass-panel-strong">
        <div className="cta-copy">
          <span className="section-label">Deploy Today</span>
          <h2>Automate your document generation pipeline with zero overhead.</h2>
          <p>
            Start converting HTML, Markdown, and Word documents in our live developer workspace. Integrate our REST endpoints into your apps in minutes.
          </p>
        </div>
        <div className="cta-actions">
          <Link className="button button-primary" to="/convert">
            <span>Launch Studio</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </Link>
          <Link className="button button-secondary" to="/convert/html">
            <span>Live HTML Playground</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
