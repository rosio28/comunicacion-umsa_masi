import { useState } from 'react'
import { NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Newspaper, CalendarDays, Users, GraduationCap,
  Image, MessageSquare, BookOpen, Settings, LogOut, Menu, X,
  Award, Video, FileText, Megaphone
} from 'lucide-react'

const ROLE_LEVEL = { superadmin: 4, admin: 3, editor: 2, visitante: 1 }

const NAV = [
  { section: 'General' },
  { to: '/admin',                icon: LayoutDashboard, label: 'Dashboard',           min: 'editor' },
  { section: 'Contenido' },
  { to: '/admin/noticias',       icon: Newspaper,       label: 'Noticias',            min: 'editor' },
  { to: '/admin/eventos',        icon: CalendarDays,    label: 'Eventos',             min: 'admin'  },
  { to: '/admin/convocatorias',  icon: Megaphone,       label: 'Convocatorias',       min: 'admin'  },
  { section: 'Personas' },
  { to: '/admin/docentes',       icon: Users,           label: 'Docentes',            min: 'admin'  },
  { to: '/admin/alumnos',        icon: Award,           label: 'Mejores estudiantes', min: 'admin'  },
  { to: '/admin/egresados',      icon: GraduationCap,   label: 'Egresados',           min: 'admin'  },
  { section: 'Multimedia' },
  { to: '/admin/multimedia',     icon: Video,           label: 'Multimedia',          min: 'editor' },
  { to: '/admin/galeria',        icon: Image,           label: 'Galería',             min: 'editor' },
  { section: 'Académico' },
  { to: '/admin/whatsapp',       icon: MessageSquare,   label: 'Grupos WhatsApp',     min: 'admin'  },
  { to: '/admin/malla',          icon: BookOpen,        label: 'Malla curricular',    min: 'admin'  },
  { to: '/admin/tramites',       icon: FileText,        label: 'Trámites',            min: 'admin'  },
  { section: 'Configuración' },
  { to: '/admin/institucional',  icon: Settings,        label: 'Contenido institucional', min: 'admin' },
  { to: '/admin/usuarios',       icon: Users,           label: 'Usuarios',            min: 'superadmin' },
]

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const userLevel = ROLE_LEVEL[usuario?.rol] || 0

  const handleLogout = () => { logout(); navigate('/admin/login') }

  const Sidebar = () => (
    <aside className="w-64 bg-secondary flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">CCS</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Panel Admin</p>
            <p className="text-blue-300 text-xs mt-0.5">CCS · UMSA</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV.map((item, i) => {
          if (item.section) {
            return (
              <p key={i} className="text-xs font-semibold text-blue-400/60 uppercase tracking-widest px-2 pt-4 pb-1 first:pt-2">
                {item.section}
              </p>
            )
          }
          const level = ROLE_LEVEL[item.min] || 0
          if (userLevel < level) return null
          const Icon = item.icon
          return (
            <NavLink key={item.to} to={item.to} end={item.to === '/admin'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-blue-100/70 hover:text-white hover:bg-white/10'
                }`
              }>
              <Icon size={16} className="flex-shrink-0" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {usuario?.nombre?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{usuario?.nombre}</p>
            <p className="text-blue-300 text-xs capitalize">{usuario?.rol}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-blue-200/60 hover:text-white hover:bg-white/10 transition-all text-xs font-medium">
          <LogOut size={14} />
          Cerrar sesión
        </button>
        <Link to="/" className="block text-center text-blue-400/50 hover:text-blue-300 text-xs mt-1 py-1 transition-colors">
          Ver sitio público
        </Link>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden"
               onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 flex flex-col lg:hidden">
            <Sidebar />
          </div>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3.5 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <Menu size={20} />
          </button>
          <div className="hidden lg:block w-px h-5 bg-gray-200" />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full capitalize font-medium">
              {usuario?.rol}
            </span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
              {usuario?.nombre?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
