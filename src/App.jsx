import { NavLink, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import { HomePage } from './pages/HomePage'
import { ServicesPage } from './pages/ServicesPage'
import { HtmlToPdfPage } from './pages/HtmlToPdfPage'

const navigationLinks = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/services/html-to-pdf', label: 'HTML to PDF' },
]

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="site-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      <header className="site-header">
        <NavLink className="brand" to="/" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">IB</span>
          <span>
            IoT-Berg
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
        <nav className={`site-nav ${menuOpen ? 'site-nav-open' : ''}`}>
          {navigationLinks.map((link) => (
            <NavLink
              key={link.to}
              className={({ isActive }) =>
                `nav-link${isActive ? ' nav-link-active' : ''}`
              }
              to={link.to}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/html-to-pdf" element={<HtmlToPdfPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div>
          <p className="footer-title">IoT-Berg</p>
          <p className="footer-copy">
            Focused software products with practical delivery, clean integrations, and room to scale into more services.
          </p>
        </div>
        <div className="footer-links">
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/services/html-to-pdf">Try HTML to PDF</NavLink>
        </div>
      </footer>
    </div>
  )
}
