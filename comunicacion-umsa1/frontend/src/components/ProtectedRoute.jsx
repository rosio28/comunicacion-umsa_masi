import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_HIERARCHY = { superadmin: 4, admin: 3, editor: 2, visitante: 1 }

export default function ProtectedRoute({ children, minRole = 'editor' }) {
  const { usuario, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!usuario) return <Navigate to="/admin/login" replace />

  const userLevel = ROLE_HIERARCHY[usuario.rol] || 0
  const minLevel  = ROLE_HIERARCHY[minRole] || 0

  if (userLevel < minLevel) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-bold text-gray-700">Acceso denegado</h2>
        <p className="text-gray-500">No tienes permiso para acceder a esta sección.</p>
        <a href="/admin" className="btn-primary">Volver al panel</a>
      </div>
    )
  }

  return children
}
