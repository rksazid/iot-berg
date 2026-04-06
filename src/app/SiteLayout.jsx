import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const navigationLinks = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
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
      <div className="ambient ambient-center" />

      <header className="site-header-wrap">
        <div className="site-header glass-panel glass-panel-strong">
          <NavLink className="brand" to="/">
            <span className="brand-mark">IB</span>
            <span className="brand-copy">
              <strong>IoT-Berg</strong>
              <small>Software Solution Provider</small>
            </span>
          </NavLink>

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
                  className={({ isActive }) =>
                    `nav-link${isActive ? ' nav-link-active' : ''}`
                  }
                  to={link.to}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <NavLink className="button button-secondary header-cta" to="/services">
              Explore Services
            </NavLink>
          </div>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer-wrap">
        <div className="site-footer glass-panel">
          <div className="footer-brand">
            <p className="footer-title">IoT-Berg</p>
            <p className="footer-copy">
              Scalable software products, cleaner workflows, and practical service delivery with room for the platform to expand.
            </p>
          </div>
          <div className="footer-links">
            <NavLink to="/services">Service Catalog</NavLink>
            <NavLink to="/services/html-to-pdf">HTML to PDF</NavLink>
            <NavLink to="/services/md-to-pdf">MD to PDF</NavLink>
            <NavLink to="/services/docx-to-pdf">DOCX to PDF</NavLink>
          </div>
        </div>
      </footer>
    </div>
  )
}
