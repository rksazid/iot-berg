import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const navigationLinks = [
  { to: '/', label: 'Home' },
  { to: '/convert', label: 'Convert' },
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
              Open Converter
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
            <NavLink to="/convert">Converter</NavLink>
            <NavLink to="/convert/html">HTML to PDF</NavLink>
            <NavLink to="/convert/markdown">Markdown to PDF</NavLink>
            <NavLink to="/convert/docx">DOCX to PDF</NavLink>
          </div>
        </div>
      </footer>
    </div>
  )
}
