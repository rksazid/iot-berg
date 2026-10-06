import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const navigationLinks = [
  { to: '/', label: 'Overview' },
  { to: '/convert', label: 'Document Studio' },
]

export function SiteLayout() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="site-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      <div className="grid-overlay" />

      <header className="site-header-wrap">
        <div className="site-header glass-panel">
          <NavLink className="brand" to="/">
            <div className="brand-mark">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="brand-copy">
              <span className="brand-name">IoT-Berg</span>
              <span className="brand-badge-text">Software Solutions</span>
            </div>
          </NavLink>

          <div className="header-status-indicator" title="Multi-region cloud clusters online">
            <span className="status-ping" />
            <span className="status-label">Cloud Engines Active</span>
          </div>

          <button
            className="menu-toggle"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span />
            <span />
          </button>

          <div className={`site-header-actions ${menuOpen ? 'site-header-actions-open' : ''}`}>
            <nav className={`site-nav ${menuOpen ? 'site-nav-open' : ''}`}>
              {navigationLinks.map((link) => (
                <NavLink
                  key={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `nav-link${isActive ? ' nav-link-active' : ''}`
                  }
                  to={link.to}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <NavLink className="button button-primary header-cta" to="/convert">
              <span>Launch Studio</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </NavLink>
          </div>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer-wrap">
        <div className="site-footer glass-panel">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="brand" style={{ marginBottom: '0.75rem' }}>
                <div className="brand-mark" style={{ width: '2rem', height: '2rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div className="brand-copy">
                  <span className="brand-name" style={{ fontSize: '1rem' }}>IoT-Berg</span>
                </div>
              </div>
              <p className="footer-copy">
                High-performance software solutions, automated document conversion pipelines, and resilient cloud architectures engineered for growing software platforms.
              </p>
              <div className="footer-status-pill">
                <span className="status-ping" />
                <span>All engines operational · 99.9% SLA</span>
              </div>
            </div>

            <div className="footer-links-group">
              <div className="footer-col">
                <h4>Conversion Engines</h4>
                <NavLink to="/convert/html">HTML to PDF Engine</NavLink>
                <NavLink to="/convert/markdown">Markdown to PDF Engine</NavLink>
                <NavLink to="/convert/docx">Word (.docx) to PDF Engine</NavLink>
                <NavLink to="/convert">Unified Studio</NavLink>
              </div>

              <div className="footer-col">
                <h4>Architecture</h4>
                <a href="#failover" onClick={(e) => { e.preventDefault(); window.location.href = '/#architecture'; }}>Multi-Cloud Failover</a>
                <a href="#sandbox" onClick={(e) => { e.preventDefault(); window.location.href = '/#architecture'; }}>Ephemeral Sandbox</a>
                <a href="#rest-api" onClick={(e) => { e.preventDefault(); window.location.href = '/convert'; }}>REST API Endpoints</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} IoT-Berg. Enterprise Document Systems & Software Solutions.</p>
            <div className="footer-legal-badges">
              <span className="legal-badge">Zero Data Persistence</span>
              <span className="legal-badge">TLS Encrypted</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
