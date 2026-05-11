import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { noticiasService, docentesService, alumnosService, whatsappService } from '../../services/services'
import { StatCard } from '../../components/ui/UI'

export default function DashboardPage() {
  const { usuario } = useAuth()
  const { data: noticias } = useQuery({ queryKey: ['dash-noticias'], queryFn: () => noticiasService.getAll({ limit: 5 }) })
  const { data: docentes  } = useQuery({ queryKey: ['dash-docentes'], queryFn: docentesService.getAll })
  const { data: alumnos   } = useQuery({ queryKey: ['dash-alumnos'],  queryFn: () => alumnosService.getAll({}) })
  const { data: grupos    } = useQuery({ queryKey: ['dash-wa'],       queryFn: whatsappService.getAll })

  const totalNoticias = noticias?.data?.pagination?.total || 0
  const totalDocentes = docentes?.data?.data?.length      || 0
  const totalAlumnos  = alumnos?.data?.data?.length       || 0
  const totalGrupos   = grupos?.data?.data?.length        || 0
  const ultimasNoticias = noticias?.data?.data || []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm">Bienvenido, <strong>{usuario?.nombre}</strong> · Rol: <span className="capitalize">{usuario?.rol}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Noticias publicadas" value={totalNoticias} icon="📰" color="bg-primary" />
        <StatCard label="Docentes activos"    value={totalDocentes} icon="👩‍🏫" color="bg-secondary" />
        <StatCard label="Mejores alumnos"     value={totalAlumnos}  icon="🏆"  color="bg-green-600" />
        <StatCard label="Grupos WhatsApp"     value={totalGrupos}   icon="💬"  color="bg-green-500" />
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <h2 className="col-span-full font-semibold text-gray-700">Acciones rápidas</h2>
        {[
          { to: '/admin/noticias/nueva', icon: '✍️', label: 'Nueva noticia',        color: 'border-primary' },
          { to: '/admin/eventos',        icon: '📅', label: 'Agregar evento',       color: 'border-secondary' },
          { to: '/admin/whatsapp',       icon: '💬', label: 'Actualizar WhatsApp',  color: 'border-green-500' },
          { to: '/admin/galeria',        icon: '📷', label: 'Subir imágenes',       color: 'border-yellow-500' },
          { to: '/admin/docentes',       icon: '👩‍🏫', label: 'Gestionar docentes',  color: 'border-purple-500' },
          { to: '/admin/institucional',  icon: '⚙️', label: 'Editar institucional', color: 'border-gray-400' },
        ].map(({ to, icon, label, color }) => (
          <Link key={to} to={to}
            className={`card p-4 flex items-center gap-3 hover:shadow-md transition-shadow border-l-4 ${color}`}>
            <span className="text-2xl">{icon}</span>
            <span className="font-medium text-sm text-gray-700">{label}</span>
          </Link>
        ))}
      </div>

      {/* Últimas noticias */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700">Últimas noticias</h2>
          <Link to="/admin/noticias" className="text-primary text-sm hover:underline">Ver todas →</Link>
        </div>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">TÍTULO</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">CATEGORÍA</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">ESTADO</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ultimasNoticias.map(n => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{n.titulo}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{n.categoria || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs px-2 py-0.5 ${n.publicado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {n.publicado ? 'Publicada' : 'Borrador'}
                    </span>
                  </td>
                </tr>
              ))}
              {ultimasNoticias.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-sm">Sin noticias</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
