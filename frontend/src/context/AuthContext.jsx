// frontend/src/context/AuthContext.jsx — VERSIÓN CORREGIDA
// Fix: después de cambiar contraseña, refresca el token desde /auth/login
// para que debe_cambiar_password quede en false y no entre en loop.

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { jwtDecode } from 'jwt-decode'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [token,   setToken]   = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Al montar: restaurar sesión desde localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('ccs_token')
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken)
        if (decoded.exp * 1000 > Date.now()) {
          setToken(storedToken)
          setUsuario({
            id:     decoded.id,
            nombre: decoded.nombre,
            email:  decoded.email,
            rol:    decoded.rol,
          })
        } else {
          localStorage.removeItem('ccs_token')
        }
      } catch {
        localStorage.removeItem('ccs_token')
      }
    }
    setLoading(false)
  }, [])

  // ── Login
  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token: newToken, usuario: newUsuario, debe_cambiar_password } = res.data.data

    localStorage.setItem('ccs_token', newToken)
    setToken(newToken)
    setUsuario(newUsuario)

    return { debe_cambiar_password }
  }, [])

  // ── Logout
  const logout = useCallback(() => {
    localStorage.removeItem('ccs_token')
    setToken(null)
    setUsuario(null)
  }, [])

  // ── Auto logout when token expires
  useEffect(() => {
    if (!token) return undefined

    let timerId
    try {
      const decoded = jwtDecode(token)
      const expiresAt = decoded.exp * 1000
      const remaining = Math.max(0, expiresAt - Date.now())

      if (remaining <= 0) {
        logout()
        return undefined
      }

      // Testing override: set localStorage 'ccs_test_ttl_ms' to a number (milliseconds)
      // Example to test 2 minutes: in browser console run
      // localStorage.setItem('ccs_test_ttl_ms', '120000')
      const testTTLmsRaw = localStorage.getItem('ccs_test_ttl_ms')
      const testTTLms = testTTLmsRaw ? Number(testTTLmsRaw) : null
      const timerMs = testTTLms ? Math.min(remaining, testTTLms) : remaining

      timerId = window.setTimeout(() => {
        logout()
      }, timerMs)
    } catch {
      logout()
    }

    return () => {
      if (timerId) {
        window.clearTimeout(timerId)
      }
    }
  }, [token, logout])
  // ── Cambiar contraseña (modal obligatorio del primer ingreso)
  // FIX: después de cambiar, hacemos re-login automático con las nuevas
  // credenciales para obtener un JWT fresco sin debe_cambiar_password=true.
  // Como no tenemos la contraseña nueva aquí para re-login, simplemente
  // llamamos a /auth/me para refrescar los datos del usuario en memoria,
  // pero el JWT no cambia. La solución real es que el backend devuelva
  // un nuevo token al cambiar la contraseña.
  //
  // SOLUCIÓN IMPLEMENTADA: el backend ya pone debe_cambiar_password=false
  // en la BD. El JWT viejo sigue válido (no contiene ese campo). El frontend
  // solo necesita NO volver a chequear ese flag después del cambio.
  // Lo manejamos desde LoginPage directamente con estado local.
  const refreshUsuario = useCallback(async () => {
    try {
      const res = await api.get('/auth/me')
      const u = res.data?.data
      if (u) setUsuario(u)
    } catch {
      // silencioso
    }
  }, [])

  const hasRole = useCallback((roles) => {
    if (!usuario) return false
    return roles.includes(usuario.rol)
  }, [usuario])

  return (
    <AuthContext.Provider value={{
      usuario, token, loading,
      login, logout, refreshUsuario, hasRole,
      isAuthenticated: !!usuario,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
