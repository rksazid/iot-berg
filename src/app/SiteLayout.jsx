import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const navigationLinks = [
  { to: '/', label: 'Overview' },
  { to: '/projects', label: 'Projects & APIs' },
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
          <NavLink className="brand" to="/" aria-label="IoT-Berg Home">
            <div className="brand-mark">
              <img
                src="/icons/app-icon.png"
                alt="IoT-Berg Icon"
                className="brand-logo-img"
                width="38"
                height="38"
              />
            </div>
            <div className="brand-copy">
              <span className="brand-name">
                <span className="brand-highlight">IoT</span>-BERG
              </span>
              <span className="brand-badge-text">Web · Mobile · Cloud · APIs</span>
            </div>
          </NavLink>

          <div className="header-status-indicator" title="Multi-region cloud clusters online">
            <span className="status-ping" />
            <span className="status-label">Cloud Engines Active</span>
          </div>

          <button
            className={`menu-toggle ${menuOpen ? 'menu-toggle-open' : ''}`}
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
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
              <a
                href="https://rksazid.github.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link nav-link-external"
                title="MD. Rezaul Karim — Project Manager & Team Lead Portfolio"
                onClick={() => setMenuOpen(false)}
              >
                <span>Team Lead</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </nav>
            <NavLink
              className="button button-primary header-cta"
              to="/convert"
              onClick={() => setMenuOpen(false)}
            >
              <span>Launch Studio</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </NavLink>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer-wrap">
        <div className="site-footer glass-panel">
          <div className="footer-top">
            <div className="footer-brand">
              <NavLink className="footer-brand-badge" to="/" aria-label="IoT-Berg Home">
                <img
                  src="/brand/iotberg-logo-horizontal.png"
                  alt="IoT-Berg — Web, Mobile, API, Cloud, IoT"
                  className="footer-brand-logo"
                  width="180"
                  height="60"
                />
              </NavLink>
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
                <h4>Featured Projects & APIs</h4>
                <NavLink to="/projects?tab=api">pdf-lagbe API Docs</NavLink>
                <a href="https://github.com/rksazid/pdf-lagbe" target="_blank" rel="noopener noreferrer">pdf-lagbe GitHub</a>
                <a href="https://quranwordbyword.onrender.com/" target="_blank" rel="noopener noreferrer">Quran Word by Word PWA</a>
                <a href="https://newagekidsschool.com/" target="_blank" rel="noopener noreferrer">New Age Kids School</a>
              </div>

              <div className="footer-col">
                <h4>Conversion Engines</h4>
                <NavLink to="/convert/html">HTML to PDF Engine</NavLink>
                <NavLink to="/convert/markdown">Markdown to PDF Engine</NavLink>
                <NavLink to="/convert/docx">Word (.docx) to PDF Engine</NavLink>
                <NavLink to="/convert">Unified Studio</NavLink>
              </div>

              <div className="footer-col">
                <h4>Architecture</h4>
                <NavLink to="/#architecture">Multi-Cloud Failover</NavLink>
                <NavLink to="/#architecture">Ephemeral Sandbox</NavLink>
                <NavLink to="/projects?tab=api">REST API Reference</NavLink>
              </div>

              <div className="footer-col">
                <h4>Leadership & Team</h4>
                <a
                  href="https://rksazid.github.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-lead-link"
                >
                  <strong>MD. Rezaul Karim</strong>
                  <span className="footer-subtext">PM & Team Lead Portfolio ↗</span>
                </a>
                <a href="https://github.com/rksazid" target="_blank" rel="noopener noreferrer">
                  GitHub (@rksazid)
                </a>
                <a href="https://www.linkedin.com/in/rksazid/" target="_blank" rel="noopener noreferrer">
                  LinkedIn Profile
                </a>
                <a href="mailto:rksazid@gmail.com">
                  Contact Team Lead
                </a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              © {new Date().getFullYear()} IoT-Berg · Technical Leadership & Project Management by{' '}
              <a
                href="https://rksazid.github.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-lead-inline"
              >
                MD. Rezaul Karim (rksazid)
              </a>
            </p>
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
