import { Link } from 'react-router-dom'
import { serviceCatalog, stats } from '../data/services'
import { featuredProjects } from '../data/projects'

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

      {/* Featured Projects & Developer APIs Showcase */}
      <section id="projects" className="featured-projects-section">
        <div className="section-head-center">
          <div className="hero-eyebrow-wrap">
            <span className="section-label">Engineering Showcase</span>
            <span className="version-pill">3 Live Deployments</span>
          </div>
          <h2 className="section-title">Production systems, public APIs & web platforms.</h2>
          <p className="section-subtitle">
            Explore active software built and operated by IoT-Berg, from high-throughput public PDF APIs to progressive web apps and institutional portals.
          </p>
        </div>

        <div className="home-projects-grid">
          {featuredProjects.map((project) => (
            <article className="home-project-card glass-panel" key={project.id}>
              <div className="home-project-card-top">
                <span className={`project-tag-pill tag-${project.badgeVariant || 'brand'}`}>
                  {project.badge}
                </span>
                <span className="project-status-indicator">
                  <span className="status-ping-inline" />
                  {project.status}
                </span>
              </div>

              <h3 className="home-project-title">{project.title}</h3>
              <p className="home-project-desc">{project.summary}</p>

              <div className="home-project-metrics">
                {project.metrics.slice(0, 3).map((m) => (
                  <div className="home-project-metric-box" key={m.label}>
                    <strong>{m.value}</strong>
                    <span>{m.label}</span>
                  </div>
                ))}
              </div>

              <div className="home-project-tags">
                {project.techStack.slice(0, 4).map((tech) => (
                  <span className="tech-tag" key={tech}>{tech}</span>
                ))}
              </div>

              <div className="home-project-actions">
                {project.hasApiDocs ? (
                  <>
                    <Link className="button button-primary button-sm btn-action-main" to="/projects?tab=api">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                      </svg>
                      <span>API Docs & Code</span>
                    </Link>
                    <div className="home-project-subactions">
                      <Link className="button button-secondary button-sm" to="/convert">
                        <span>Test in Studio</span>
                      </Link>
                      {project.repoUrl && (
                        <a
                          className="button button-ghost button-sm icon-btn"
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="GitHub Repository"
                          aria-label="GitHub Repository"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <a
                      className="button button-primary button-sm btn-action-main"
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>Visit Live Platform</span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                    <div className="home-project-subactions">
                      <Link className="button button-secondary button-sm" to="/projects">
                        <span>View Case Study</span>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="section-footer-cta">
          <Link className="button button-secondary" to="/projects">
            <span>Explore All Projects & API Quickstart</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
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
