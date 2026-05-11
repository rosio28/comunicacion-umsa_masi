import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { jwtDecode } from 'jwt-decode'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('ccs_token')
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken)
        if (decoded.exp * 1000 > Date.now()) {
          setToken(storedToken)
          setUsuario({ id: decoded.id, nombre: decoded.nombre, email: decoded.email, rol: decoded.rol })
        } else {
          localStorage.removeItem('ccs_token')
        }
      } catch { localStorage.removeItem('ccs_token') }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token: newToken, usuario: user } = res.data.data
    localStorage.setItem('ccs_token', newToken)
    setToken(newToken)
    setUsuario(user)
    return user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ccs_token')
    setToken(null)
    setUsuario(null)
  }, [])

  const hasRole = useCallback((roles) => {
    if (!usuario) return false
    return roles.includes(usuario.rol)
  }, [usuario])

  return (
    <AuthContext.Provider value={{ usuario, token, loading, login, logout, hasRole, isAuthenticated: !!usuario }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
