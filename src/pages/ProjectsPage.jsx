import { useState, useId } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { featuredProjects, apiDocumentation } from '../data/projects'

export function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'api' ? 'api' : 'showcase'
  const [activeTab, setActiveTab] = useState(initialTab)

  const [selectedEndpointId, setSelectedEndpointId] = useState('html-to-pdf')
  const [activeLang, setActiveLang] = useState('curl')
  const [copied, setCopied] = useState(false)

  const selectedEndpoint =
    apiDocumentation.endpoints.find((ep) => ep.id === selectedEndpointId) ||
    apiDocumentation.endpoints[0]

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchParams(tab === 'api' ? { tab: 'api' } : {})
  }

  const getCodeSnippet = () => {
    if (activeLang === 'js') return selectedEndpoint.jsSnippet
    if (activeLang === 'python') return selectedEndpoint.pythonSnippet
    return selectedEndpoint.curlSnippet
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(getCodeSnippet())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.warn('Clipboard write failed', e)
    }
  }

  return (
    <div className="page page-projects">
      {/* Projects Header */}
      <section className="projects-head glass-panel">
        <div className="projects-head-copy">
          <div className="hero-eyebrow-wrap">
            <span className="eyebrow">
              <span className="eyebrow-dot" /> IoT-Berg Engineering
            </span>
            <span className="version-pill">Portfolio & APIs</span>
          </div>

          <h1 className="projects-head-title">
            Production Software Systems & Public APIs
          </h1>

          <p className="projects-head-desc">
            Explore our open-access developer engines, high-performance web applications, and cloud-native software platforms. All systems are maintained with production SLAs.
          </p>

          <div className="projects-nav-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'showcase'}
              className={`project-tab-btn ${activeTab === 'showcase' ? 'project-tab-active' : ''}`}
              onClick={() => handleTabChange('showcase')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
              <span className="tab-text-desktop">Featured Projects ({featuredProjects.length})</span>
              <span className="tab-text-mobile">Projects ({featuredProjects.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'api'}
              className={`project-tab-btn ${activeTab === 'api' ? 'project-tab-active' : ''}`}
              onClick={() => handleTabChange('api')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span className="tab-text-desktop">pdf-lagbe API Docs & Quickstart</span>
              <span className="tab-text-mobile">API Docs & Code</span>
            </button>
          </div>
        </div>

        <div className="projects-head-meta">
          <div className="head-stat-box">
            <strong>3</strong>
            <span>Active Deployments</span>
          </div>
          <div className="head-stat-box">
            <strong>100%</strong>
            <span>Public Access</span>
          </div>
          <div className="head-stat-box">
            <strong>Dual</strong>
            <span>Cloud Clusters</span>
          </div>
        </div>
      </section>

      {/* VIEW 1: PROJECT SHOWCASE CARDS */}
      {activeTab === 'showcase' && (
        <section className="projects-cards-section">
          <div className="projects-cards-grid">
            {featuredProjects.map((project) => (
              <article className="project-card glass-panel" key={project.id}>
                <div className="project-card-header">
                  <div className="project-badge-row">
                    <span className={`project-tag-pill tag-${project.badgeVariant || 'brand'}`}>
                      {project.badge}
                    </span>
                    <span className="project-status-indicator">
                      <span className="status-ping-inline" />
                      {project.status}
                    </span>
                  </div>

                  <h2 className="project-title">{project.title}</h2>
                  <p className="project-tagline">{project.tagline}</p>
                </div>

                <p className="project-summary">{project.summary}</p>

                {/* Key Metrics */}
                <div className="project-metrics-row">
                  {project.metrics.map((m) => (
                    <div className="project-metric-pill" key={m.label}>
                      <strong>{m.value}</strong>
                      <span>{m.label}</span>
                    </div>
                  ))}
                </div>

                {/* Tech Stack Pills */}
                <div className="project-tech-stack">
                  <span className="stack-label">Technologies:</span>
                  <div className="tech-tags-wrap">
                    {project.techStack.map((tech) => (
                      <span className="tech-tag" key={tech}>{tech}</span>
                    ))}
                  </div>
                </div>

                {/* Highlights List */}
                <div className="project-highlights">
                  {project.highlights.slice(0, 3).map((item) => (
                    <div className="project-highlight-item" key={item}>
                      <span className="mini-dot" />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="project-actions-row">
                  {project.hasApiDocs ? (
                    <>
                      <button
                        type="button"
                        className="button button-primary project-btn-main"
                        onClick={() => handleTabChange('api')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                        </svg>
                        <span>View API Documentation</span>
                      </button>

                      <div className="project-actions-subrow">
                        <Link className="button button-secondary" to="/convert">
                          <span>Launch Studio Demo</span>
                        </Link>

                        {project.repoUrl && (
                          <a
                            className="button button-ghost icon-only-btn"
                            href={project.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View on GitHub"
                            aria-label="View on GitHub"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <a
                        className="button button-primary project-btn-main"
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>Visit Live Platform</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>

                      <div className="project-actions-subrow">
                        <a
                          className="button button-secondary"
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>Open Details</span>
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* VIEW 2: PDF-LAGBE API DOCUMENTATION & QUICKSTART */}
      {activeTab === 'api' && (
        <section className="api-docs-section">
          {/* Quickstart Header Card */}
          <div className="api-overview-card glass-panel">
            <div className="api-overview-copy">
              <div className="api-badge-row">
                <span className="project-tag-pill tag-brand">REST API v1.2</span>
                <span className="status-ping-inline">Online · Sub-350ms</span>
              </div>
              <h2 className="api-overview-title">pdf-lagbe API Reference</h2>
              <p className="api-overview-desc">
                Programmatically convert HTML strings, Markdown documents, and Word (.docx) files to PDF using our public endpoints. Ephemeral memory execution with zero persistent storage.
              </p>

              <div className="api-clusters-grid">
                <div className="cluster-card">
                  <span className="cluster-label">Primary Cloud Cluster (Render)</span>
                  <code className="cluster-url">{apiDocumentation.baseUrlRender}</code>
                </div>
                <div className="cluster-card">
                  <span className="cluster-label">Failover Cloud Cluster (Vercel)</span>
                  <code className="cluster-url">{apiDocumentation.baseUrlVercel}</code>
                </div>
              </div>
            </div>

            <div className="api-overview-actions">
              <a
                className="button button-secondary"
                href={apiDocumentation.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub Repository</span>
              </a>

              <Link className="button button-primary" to="/convert">
                <span>Interactive Studio</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Interactive Endpoint Inspector */}
          <div className="api-workspace-layout">
            {/* Left Nav: Endpoint List */}
            <aside className="api-endpoints-sidebar glass-panel">
              <span className="section-label">Endpoints</span>
              <nav className="endpoints-nav" aria-label="API Endpoints">
                {apiDocumentation.endpoints.map((ep) => {
                  const isSelected = ep.id === selectedEndpoint.id
                  return (
                    <button
                      key={ep.id}
                      type="button"
                      className={`endpoint-selector-btn ${isSelected ? 'endpoint-selected' : ''}`}
                      onClick={() => setSelectedEndpointId(ep.id)}
                    >
                      <span className={`method-tag method-${ep.method.toLowerCase()}`}>
                        {ep.method}
                      </span>
                      <div className="endpoint-selector-info">
                        <strong>{ep.path}</strong>
                        <span>{ep.title}</span>
                      </div>
                    </button>
                  )
                })}
              </nav>

              <div className="sidebar-tip-box">
                <span className="tip-badge">Public & Free</span>
                <p>No API key required for standard rate-limited evaluation tiers.</p>
              </div>
            </aside>

            {/* Right Main: Endpoint Documentation & Code Snippets */}
            <main className="endpoint-detail-main glass-panel">
              {/* Endpoint Header */}
              <div className="endpoint-detail-head">
                <div className="endpoint-meta-badge-row">
                  <span className={`method-pill method-${selectedEndpoint.method.toLowerCase()}`}>
                    {selectedEndpoint.method}
                  </span>
                  <code className="endpoint-path-code">{selectedEndpoint.path}</code>
                </div>

                <h3 className="endpoint-detail-title">{selectedEndpoint.title}</h3>
                <p className="endpoint-detail-desc">{selectedEndpoint.description}</p>

                <div className="endpoint-specs-strip">
                  <div className="spec-item">
                    <span className="spec-lbl">Content-Type</span>
                    <code className="spec-val">{selectedEndpoint.contentType}</code>
                  </div>
                  <div className="spec-item">
                    <span className="spec-lbl">Response Format</span>
                    <code className="spec-val">{selectedEndpoint.responseType}</code>
                  </div>
                  <div className="spec-item">
                    <span className="spec-lbl">Sandbox Execution</span>
                    <span className="spec-val">Ephemeral / Zero Storage</span>
                  </div>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="code-snippet-box">
                <div className="code-snippet-toolbar">
                  <div className="snippet-lang-tabs">
                    <button
                      type="button"
                      className={`lang-tab ${activeLang === 'curl' ? 'lang-tab-active' : ''}`}
                      onClick={() => setActiveLang('curl')}
                    >
                      cURL
                    </button>
                    <button
                      type="button"
                      className={`lang-tab ${activeLang === 'js' ? 'lang-tab-active' : ''}`}
                      onClick={() => setActiveLang('js')}
                    >
                      Node.js / Fetch
                    </button>
                    <button
                      type="button"
                      className={`lang-tab ${activeLang === 'python' ? 'lang-tab-active' : ''}`}
                      onClick={() => setActiveLang('python')}
                    >
                      Python
                    </button>
                  </div>

                  <button
                    type="button"
                    className="copy-snippet-btn"
                    onClick={handleCopyCode}
                    aria-label="Copy code snippet"
                  >
                    {copied ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Copy Snippet</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="code-editor-viewport">
                  <pre className="code-block">
                    <code>{getCodeSnippet()}</code>
                  </pre>
                </div>
              </div>

              {/* Parameters Table */}
              {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
                <div className="endpoint-params-wrap">
                  <h4 className="params-heading">Request Body Parameters</h4>
                  <div className="params-table-scroller">
                    <table className="params-table">
                      <thead>
                        <tr>
                          <th>Parameter</th>
                          <th>Type</th>
                          <th>Required</th>
                          <th>Default</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEndpoint.params.map((param) => (
                          <tr key={param.name}>
                            <td>
                              <code className="param-name">{param.name}</code>
                            </td>
                            <td>
                              <span className="param-type">{param.type}</span>
                            </td>
                            <td>
                              {param.required ? (
                                <span className="param-req required">Yes</span>
                              ) : (
                                <span className="param-req optional">Optional</span>
                              )}
                            </td>
                            <td>
                              <code className="param-default">{param.default}</code>
                            </td>
                            <td className="param-desc">{param.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Interactive Test CTA */}
              <div className="endpoint-test-cta">
                <div className="test-cta-copy">
                  <strong>Want to test this endpoint live in your browser?</strong>
                  <p>Open the IoT-Berg Document Studio to test inputs with instant PDF preview.</p>
                </div>
                <Link
                  className="button button-primary"
                  to={`/convert/${selectedEndpoint.playgroundTool || 'html'}`}
                >
                  <span>Launch in Playground</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </main>
          </div>
        </section>
      )}
    </div>
  )
}
