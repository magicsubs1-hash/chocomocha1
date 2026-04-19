import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('dxtoken'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch(api('/api/auth/me'), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(u => { setUser(u); setLoading(false) })
      .catch(() => { logout(); setLoading(false) })
  }, [token])

  function saveAuth(data) {
    localStorage.setItem('dxtoken', data.token)
    setToken(data.token)
    setUser(data.user)
  }

  function logout() {
    localStorage.removeItem('dxtoken')
    setToken(null)
    setUser(null)
  }

  async function refreshUser() {
    if (!token) return
    const r = await fetch(api('/api/auth/me'), { headers: { Authorization: `Bearer ${token}` } })
    if (r.ok) setUser(await r.json())
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, saveAuth, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
