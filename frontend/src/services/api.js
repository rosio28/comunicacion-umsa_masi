import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ccs_token')
  if (token) {
    try {
      const payload = jwtDecode(token)
      const expiresAt = payload.exp ? payload.exp * 1000 : null
      const iatMs = payload.iat ? payload.iat * 1000 : null
      const testTTLmsRaw = localStorage.getItem('ccs_test_ttl_ms')
      const testTTLms = testTTLmsRaw ? Number(testTTLmsRaw) : null
      const overrideExpiry = (iatMs && testTTLms) ? (iatMs + testTTLms) : null
      const finalExpiry = overrideExpiry && expiresAt ? Math.min(overrideExpiry, expiresAt) : (overrideExpiry || expiresAt)
      if (finalExpiry && Date.now() > finalExpiry) {
        localStorage.removeItem('ccs_token')
        window.location.href = '/admin/login'
        return Promise.reject({ message: 'Token expirado' })
      }
    } catch (e) {
      // decode falló: remover token y forzar login
      localStorage.removeItem('ccs_token')
      window.location.href = '/admin/login'
      return Promise.reject(e)
    }
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ccs_token')
      window.location.href = '/admin/login'
    }
    return Promise.reject(err)
  }
)

export default api
