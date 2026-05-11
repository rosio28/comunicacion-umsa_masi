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

  // En AuthContext.jsx — el login debe devolver los datos de la respuesta
const login = async (email, password) => {
  const res = await authService.login(email, password)
  const { token, usuario, debe_cambiar_password } = res.data.data
  localStorage.setItem('token', token)
  setToken(token)
  setUsuario(usuario)
  // IMPORTANTE: retornar para que LoginPage pueda leer debe_cambiar_password
  return { debe_cambiar_password }
}

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
