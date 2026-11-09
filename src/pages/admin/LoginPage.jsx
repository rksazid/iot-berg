import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function LoginPage() {
  const { login, isAuthenticated, currentUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [identifier, setIdentifier] = useState('rksazid@gmail.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/admin'

  if (isAuthenticated) {
    return (
      <div className="page admin-login-page">
        <div className="login-card glass-panel text-center">
          <div className="user-logged-avatar">
            <img
              src={currentUser.avatar || '/team/rezaul-karim-avatar.png'}
              alt={currentUser.name}
              className="avatar-img-circle"
            />
          </div>
          <h2 className="login-title">Already Signed In</h2>
          <p className="login-sub">
            Signed in as <strong>{currentUser.name}</strong> ({currentUser.designation})
          </p>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/admin" className="button button-primary">
              Go to Admin Panel
            </Link>
            <Link to="/" className="button button-secondary">
              Website Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(identifier, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  const setPreset = (email, pass) => {
    setIdentifier(email)
    setPassword(pass)
    setError(null)
  }

  return (
    <div className="page admin-login-page">
      <div className="login-shell">
        <div className="login-card glass-panel">
          <div className="login-header">
            <div className="login-logo-row">
              <img
                src="/icons/app-icon.png"
                alt="IoT-Berg Logo"
                className="login-brand-icon"
                width="36"
                height="36"
              />
              <span className="login-badge-pill">Internal Portal</span>
            </div>
            <h1 className="login-title">IoT-Berg Engineering</h1>
            <p className="login-sub">
              Sign in to manage received work orders, advance payments, and authorized money receipts.
            </p>
          </div>

          {error && <div className="login-error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="identifier">Email Address or Username</label>
              <input
                id="identifier"
                type="text"
                className="form-input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="rksazid@gmail.com"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Security Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="button button-primary button-full" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-inline" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Panel</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Quick preset credentials */}
          <div className="login-presets-box">
            <span className="presets-label">Quick Sign-In Credentials (Demo Roles):</span>
            <div className="preset-buttons-row">
              <button
                type="button"
                className="preset-btn active-preset"
                onClick={() => setPreset('rksazid@gmail.com', 'admin123')}
              >
                <strong>Admin (Team Lead)</strong>
                <span>MD. Rezaul Karim</span>
              </button>

              <button
                type="button"
                className="preset-btn"
                onClick={() => setPreset('finance@iotberg.cloud', 'manager123')}
              >
                <strong>Manager</strong>
                <span>Finance & Ops</span>
              </button>

              <button
                type="button"
                className="preset-btn"
                onClick={() => setPreset('auditor@iotberg.cloud', 'auditor123')}
              >
                <strong>Auditor</strong>
                <span>Read-Only Compliance</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

