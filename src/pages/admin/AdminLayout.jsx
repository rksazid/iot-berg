import { useState, useEffect } from 'react'
import { NavLink, Link, Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function AdminLayout() {
  const { currentUser, isAuthenticated, logout, hasRole } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auto-close mobile sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // Derive current page title for the minimal topbar
  const getPageTitle = () => {
    if (location.pathname === '/admin/work-orders') return 'Work Orders'
    if (location.pathname === '/admin/receipts/new') return 'Issue Receipt'
    if (location.pathname.startsWith('/admin/receipts')) return 'Payment Receipts'
    return 'Dashboard'
  }

  return (
    <div className="admin-app-root">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Traditional Left Admin Sidebar */}
      <aside className={`admin-app-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-section">
          <Link to="/admin" className="sidebar-brand-link">
            <div className="sidebar-brand-mark">
              <img
                src="/icons/app-icon.png"
                alt="IoT-Berg"
                className="sidebar-brand-logo"
                width="30"
                height="30"
              />
            </div>
            <div className="sidebar-brand-copy">
              <span className="sidebar-brand-name">
                <span className="brand-highlight">IoT</span>-BERG
              </span>
              <span className="sidebar-brand-badge">Admin Portal</span>
            </div>
          </Link>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <div className="sidebar-scroll-area">
          <div className="sidebar-nav-group">
            <span className="sidebar-group-label">Management</span>
            <nav className="sidebar-nav-list">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`
                }
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                </svg>
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/admin/work-orders"
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`
                }
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>Work Orders</span>
              </NavLink>

              <NavLink
                to="/admin/receipts"
                end
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`
                }
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
                  <line x1="8" y1="8" x2="16" y2="8" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="8" y1="16" x2="12" y2="16" />
                </svg>
                <span>Payment Receipts</span>
              </NavLink>
            </nav>
          </div>

          <div className="sidebar-nav-group">
            <span className="sidebar-group-label">Quick Actions</span>
            <nav className="sidebar-nav-list">
              {hasRole(['admin', 'manager']) && (
                <NavLink
                  to="/admin/receipts/new"
                  className={({ isActive }) =>
                    `sidebar-nav-item sidebar-cta-item ${isActive ? 'sidebar-nav-item-active' : ''}`
                  }
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Issue Receipt</span>
                </NavLink>
              )}

              <Link
                to="/verify/IB-REC-2026-001"
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-nav-item"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
                <span>Public Verification ↗</span>
              </Link>

              <Link to="/" className="sidebar-nav-item">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                <span>Website Home ↗</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* User Card at Bottom of Sidebar */}
        <div className="sidebar-user-footer">
          <div className="sidebar-user-card">
            <img
              src={currentUser.avatar || '/team/rezaul-karim-avatar.png'}
              alt={currentUser.name}
              className="sidebar-user-avatar"
              width="36"
              height="36"
            />
            <div className="sidebar-user-text">
              <span className="sidebar-user-name">{currentUser.name}</span>
              <span className="sidebar-user-role">
                {currentUser.role.toUpperCase()} · {currentUser.designation?.split('&')[0] || 'Lead'}
              </span>
            </div>
            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="admin-app-main-col">
        {/* Minimal Top Navbar */}
        <header className="admin-app-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div className="topbar-breadcrumbs">
              <span className="breadcrumb-root">Workspace</span>
              <span className="breadcrumb-divider">/</span>
              <h1 className="breadcrumb-current">{getPageTitle()}</h1>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-status-pill" title="Vercel Object Storage connected and operational">
              <span className="status-ping-inline" />
              <span className="status-label-text">Blob Storage Active</span>
            </div>

            {hasRole(['admin', 'manager']) && (
              <NavLink to="/admin/receipts/new" className="button button-primary button-sm topbar-cta">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>+ Issue Receipt</span>
              </NavLink>
            )}
          </div>
        </header>

        {/* Admin Content Area (Viewport Scroll) */}
        <main className="admin-app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
