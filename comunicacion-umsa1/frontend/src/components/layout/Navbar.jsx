import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown, GraduationCap } from 'lucide-react'

const MENUS = [
  {
    label: 'La Carrera',
    items: [
      { to: '/quienes-somos',    label: 'Quiénes somos',       desc: 'Historia, misión y visión' },
      { to: '/malla-curricular', label: 'Malla curricular',     desc: 'Plan de estudios 2023' },
      { to: '/docentes',         label: 'Docentes',             desc: 'Cuerpo académico' },
      { to: '/ipicom',           label: 'IpICOM',               desc: 'Instituto de investigación' },
      { to: '/transparencia',    label: 'Transparencia',        desc: 'Normativa institucional' },
    ],
  },
  {
    label: 'Académico',
    items: [
      { to: '/tramites',      label: 'Trámites',         desc: 'Guías y formularios' },
      { to: '/convocatorias', label: 'Convocatorias',    desc: 'Pasantías y becas' },
      { to: '/eventos',       label: 'Calendario',       desc: 'Eventos y actividades' },
      { to: '/whatsapp',      label: 'Grupos WhatsApp',  desc: 'Por materia y semestre' },
      { to: '/biblioteca',    label: 'Biblioteca',       desc: 'Recursos digitales' },
    ],
  },
  { to: '/noticias',   label: 'Noticias',   single: true },
  { to: '/multimedia', label: 'Multimedia', single: true },
  {
    label: 'Comunidad',
    items: [
      { to: '/mejores-alumnos', label: 'Mejores estudiantes', desc: 'Ranking académico' },
      { to: '/egresados',       label: 'Egresados',           desc: 'Trayectorias profesionales' },
      { to: '/galeria',         label: 'Galería',             desc: 'Fotografías de la carrera' },
    ],
  },
  { to: '/contacto', label: 'Contacto', single: true },
]

function DropdownMenu({ items }) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-2xl shadow-card-lg border border-gray-100/80 overflow-hidden z-50"
         style={{ animation: 'scaleIn 0.18s ease' }}>
      <div className="p-1.5">
        {items.map(item => (
          <Link key={item.to} to={item.to}
            className="flex flex-col px-3.5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
            <span className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">
              {item.label}
            </span>
            {item.desc && <span className="text-xs text-gray-400 mt-0.5">{item.desc}</span>}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openMenu,   setOpenMenu]   = useState(null)
  const [scrolled,   setScrolled]   = useState(false)
  const location = useLocation()
  const timerRef = useRef(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setMobileOpen(false); setOpenMenu(null) }, [location.pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleMenuEnter = (i) => {
    clearTimeout(timerRef.current)
    setOpenMenu(i)
  }
  const handleMenuLeave = () => {
    timerRef.current = setTimeout(() => setOpenMenu(null), 120)
  }

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-secondary/98 backdrop-blur-md shadow-lg'
          : 'bg-secondary'
      }`}>
        {/* Top stripe */}
        <div className="h-0.5 bg-gradient-to-r from-primary via-primary-light to-primary" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center
                              group-hover:scale-105 transition-transform duration-200 shadow-glow-red">
                <GraduationCap size={18} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-white font-bold text-sm leading-none tracking-tight">Comunicación Social</p>
                <p className="text-blue-300 text-xs mt-0.5">UMSA · La Paz, Bolivia</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden xl:flex items-center gap-0.5">
              {MENUS.map((menu, i) =>
                menu.single ? (
                  <NavLink key={menu.to} to={menu.to}
                    className={({ isActive }) =>
                      `px-3.5 py-2 text-sm font-medium rounded-xl transition-all ${
                        isActive
                          ? 'bg-white/15 text-white'
                          : 'text-blue-100/80 hover:text-white hover:bg-white/10'
                      }`
                    }>
                    {menu.label}
                  </NavLink>
                ) : (
                  <div key={i} className="relative"
                    onMouseEnter={() => handleMenuEnter(i)}
                    onMouseLeave={handleMenuLeave}>
                    <button className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl transition-all ${
                      openMenu === i
                        ? 'bg-white/15 text-white'
                        : 'text-blue-100/80 hover:text-white hover:bg-white/10'
                    }`}>
                      {menu.label}
                      <ChevronDown size={13} className={`transition-transform duration-200 ${openMenu === i ? 'rotate-180' : ''}`} />
                    </button>
                    {openMenu === i && <DropdownMenu items={menu.items} />}
                  </div>
                )
              )}
            </nav>

            {/* CTA + hamburger */}
            <div className="flex items-center gap-2">
              <Link to="/admin"
                className="hidden sm:inline-flex btn btn-primary btn-sm">
                Panel Admin
              </Link>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="xl:hidden relative w-10 h-10 flex items-center justify-center rounded-xl
                           text-white hover:bg-white/10 transition-colors"
                aria-label="Menú">
                <span className={`absolute transition-all duration-200 ${mobileOpen ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`}>
                  <X size={22} />
                </span>
                <span className={`absolute transition-all duration-200 ${mobileOpen ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'}`}>
                  <Menu size={22} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 xl:hidden" style={{ top: '66px' }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
               onClick={() => setMobileOpen(false)} />

          {/* Menu panel */}
          <div className="relative bg-secondary h-full overflow-y-auto mobile-menu"
               style={{ maxHeight: 'calc(100vh - 66px)' }}>
            <div className="px-4 py-4 space-y-1">

              {/* Link to public site notice */}
              <div className="glass rounded-xl px-4 py-3 mb-4">
                <p className="text-blue-200 text-xs">Carrera de Ciencias de la Comunicación Social — UMSA</p>
              </div>

              {MENUS.map((menu, i) => (
                menu.single ? (
                  <NavLink key={menu.to} to={menu.to}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive ? 'bg-primary text-white' : 'text-white hover:bg-white/10'
                      }`
                    }>
                    {menu.label}
                  </NavLink>
                ) : (
                  <div key={i}>
                    <p className="px-4 pt-4 pb-2 text-xs font-bold text-blue-400/70 uppercase tracking-widest">
                      {menu.label}
                    </p>
                    {menu.items.map(item => (
                      <NavLink key={item.to} to={item.to}
                        className={({ isActive }) =>
                          `flex items-start gap-3 px-4 py-2.5 rounded-xl transition-all ${
                            isActive ? 'bg-white/15 text-white' : 'text-blue-100/80 hover:text-white hover:bg-white/10'
                          }`
                        }>
                        <div>
                          <p className="text-sm font-medium leading-none">{item.label}</p>
                          {item.desc && <p className="text-xs text-blue-300/70 mt-0.5">{item.desc}</p>}
                        </div>
                      </NavLink>
                    ))}
                  </div>
                )
              ))}

              {/* Admin button */}
              <div className="pt-4 pb-6 border-t border-white/10 mt-4">
                <Link to="/admin" className="btn btn-primary w-full py-3 rounded-xl">
                  Panel de Administración
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="h-16" />
    </>
  )
}
