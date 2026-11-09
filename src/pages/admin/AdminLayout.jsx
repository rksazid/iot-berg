import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function AdminLayout() {
  const { currentUser, isAuthenticated, logout } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return (
    <div className="page admin-portal-page">
      <div className="admin-shell">
        {/* Admin Header Navigation Bar */}
        <header className="admin-header glass-panel">
          <div className="admin-brand-section">
            <div className="admin-badge-indicator">
              <span className="status-ping-inline" />
              <span>IoT-Berg Workspaces</span>
            </div>
            <h1 className="admin-title">Work Orders & Receipts Portal</h1>
          </div>

          <div className="admin-user-pill">
            <img
              src={currentUser.avatar || '/team/rezaul-karim-avatar.png'}
              alt={currentUser.name}
              className="admin-avatar-small"
              width="28"
              height="28"
            />
            <div className="admin-user-info">
              <span className="admin-user-name">{currentUser.name}</span>
              <span className="admin-user-role-tag">
                {currentUser.role.toUpperCase()} · {currentUser.designation}
              </span>
            </div>
            <button
              type="button"
              className="admin-logout-btn"
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Minimalist Sub-Navigation Tabs */}
        <nav className="admin-nav-tabs" aria-label="Admin Navigation">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `admin-tab-link ${isActive ? 'admin-tab-active' : ''}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Overview & Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/work-orders"
            className={({ isActive }) => `admin-tab-link ${isActive ? 'admin-tab-active' : ''}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            className={({ isActive }) => `admin-tab-link ${isActive ? 'admin-tab-active' : ''}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>Payment Receipts</span>
          </NavLink>

          <NavLink
            to="/admin/receipts/new"
            className={({ isActive }) => `admin-tab-link admin-tab-cta ${isActive ? 'admin-tab-active' : ''}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Issue Payment Receipt</span>
          </NavLink>
        </nav>

        {/* Child Views */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

