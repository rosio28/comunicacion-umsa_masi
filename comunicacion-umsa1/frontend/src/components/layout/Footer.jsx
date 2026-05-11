import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Globe } from 'lucide-react'

const COLS = [
  {
    title: 'La carrera',
    links: [
      { to: '/quienes-somos',    label: 'Quiénes somos' },
      { to: '/malla-curricular', label: 'Malla curricular' },
      { to: '/docentes',         label: 'Docentes' },
      { to: '/tramites',         label: 'Trámites académicos' },
      { to: '/transparencia',    label: 'Transparencia' },
    ],
  },
  {
    title: 'Comunidad',
    links: [
      { to: '/noticias',        label: 'Noticias' },
      { to: '/eventos',         label: 'Eventos' },
      { to: '/convocatorias',   label: 'Convocatorias' },
      { to: '/mejores-alumnos', label: 'Mejores estudiantes' },
      { to: '/egresados',       label: 'Egresados' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { to: '/multimedia',   label: 'Multimedia estudiantil' },
      { to: '/galeria',      label: 'Galería fotográfica' },
      { to: '/streaming',    label: 'Streaming y radio' },
      { to: '/whatsapp',     label: 'Grupos de WhatsApp' },
      { to: '/biblioteca',   label: 'Biblioteca digital' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-secondary mt-auto">
      <div className="h-0.5 bg-primary" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">

          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">CCS</span>
              </div>
              <div>
                <p className="text-white font-semibold text-base leading-tight">Comunicación Social</p>
                <p className="text-blue-300 text-sm">Universidad Mayor de San Andrés</p>
              </div>
            </div>
            <p className="text-blue-200/70 text-sm leading-relaxed mb-5">
              Formando comunicadores comprometidos con la realidad boliviana desde 1984.
            </p>
            <div className="space-y-2.5 text-sm text-blue-200/80">
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="text-blue-300 flex-shrink-0 mt-0.5" />
                <span>Edificio René Zavaleta, Piso 5<br />Calle Federizo Suazo, La Paz</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={15} className="text-blue-300 flex-shrink-0" />
                <span>(591-2) 2911880 · 2911890</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={15} className="text-blue-300 flex-shrink-0" />
                <span>comunicasocialumsa@gmail.com</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Globe size={15} className="text-blue-300 flex-shrink-0" />
                <a href="https://comunicacion.umsa.bo" target="_blank" rel="noreferrer"
                   className="hover:text-white transition-colors">comunicacion.umsa.bo</a>
              </div>
            </div>
          </div>

          {/* Link cols */}
          {COLS.map(col => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-blue-200/70 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-blue-300/60 text-xs">
            © {new Date().getFullYear()} Carrera de Ciencias de la Comunicación Social — UMSA. La Paz, Bolivia.
          </p>
          <div className="flex gap-4">
            <a href="https://www.facebook.com/comunicacion.umsa.bo" target="_blank" rel="noreferrer"
               className="text-blue-300/60 hover:text-white text-xs transition-colors">Facebook</a>
            <a href="https://tiktok.com/@comunicacion_social_umsa" target="_blank" rel="noreferrer"
               className="text-blue-300/60 hover:text-white text-xs transition-colors">TikTok</a>
            <Link to="/admin" className="text-blue-300/60 hover:text-white text-xs transition-colors">Panel Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
