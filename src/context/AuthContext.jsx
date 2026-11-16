import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const USERS = [
  {
    id: 'usr_lead',
    name: 'MD. Rezaul Karim',
    username: 'rksazid',
    email: 'rksazid@gmail.com',
    alternateEmails: ['admin@iotberg.com', 'admin@iot-berg.com', 'lead@iotberg.com'],
    role: 'admin',
    designation: 'Project Manager & Team Lead',
    company: 'IoT-Berg Engineering',
    avatar: '/team/rezaul-karim-avatar.png',
    passwords: [
      'IoTberg#2026@Lead',
      'IB@Admin#2026!',
      'iotberg2026',
      'rksazid',
    ],
  },
  {
    id: 'usr_mgr',
    name: 'Finance & Ops Manager',
    username: 'manager',
    email: 'finance@iotberg.com',
    alternateEmails: ['finance@iotberg.cloud', 'manager@iotberg.com'],
    role: 'manager',
    designation: 'Finance & Accounts Specialist',
    company: 'IoT-Berg Engineering',
    avatar: null,
    passwords: [
      'IoTberg#2026@Finance',
      'IB@Manager#2026!',
      'finance2026',
    ],
  },
  {
    id: 'usr_audit',
    name: 'Compliance Auditor',
    username: 'auditor',
    email: 'auditor@iotberg.com',
    alternateEmails: ['auditor@iotberg.cloud'],
    role: 'auditor',
    designation: 'External Audit & Verification',
    company: 'Audit Compliance',
    avatar: null,
    passwords: [
      'IoTberg#2026@Audit',
      'IB@Audit#2026!',
      'audit2026',
    ],
  },
]

const STORAGE_KEY = 'iotberg_auth_session'

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [loading, setLoading] = useState(false)

  const login = async (identifier, password) => {
    setLoading(true)
    try {
      const cleanId = (identifier || '').trim().toLowerCase()
      const cleanPass = (password || '').trim()

      const user = USERS.find(
        (u) =>
          (u.email.toLowerCase() === cleanId ||
            u.username.toLowerCase() === cleanId ||
            (Array.isArray(u.alternateEmails) &&
              u.alternateEmails.some((em) => em.toLowerCase() === cleanId))) &&
          u.passwords.includes(cleanPass),
      )

      if (!user) {
        throw new Error('Invalid email/username or password. Please check your credentials.')
      }

      const sessionUser = {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        designation: user.designation,
        company: user.company,
        avatar: user.avatar,
        token: `ib_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        loginAt: new Date().toISOString(),
      }

      setCurrentUser(sessionUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser))
      return { success: true, user: sessionUser }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const hasRole = (allowedRoles = []) => {
    if (!currentUser) return false
    if (currentUser.role === 'admin') return true // Admin has full super-powers
    return allowedRoles.includes(currentUser.role)
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        loading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

