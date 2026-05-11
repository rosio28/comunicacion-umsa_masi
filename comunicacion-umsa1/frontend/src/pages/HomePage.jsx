import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  ArrowRight, ChevronRight, Calendar, Users, BookOpen,
  GraduationCap, Newspaper, MessageCircle, Award, Play,
  MapPin, Clock, ExternalLink
} from 'lucide-react'
import { noticiasService, institucionalService, eventosService, multimediaService } from '../services/services'
import { formatDate, truncate } from '../utils/helpers'

// ─────────────────────────────────────────────────────────
// HERO IMAGES — change these to real photos of the career
// ─────────────────────────────────────────────────────────
const HERO_SLIDES = [
  {
    img:     'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1600&q=80',
    eyebrow: 'Carrera de Comunicación Social — UMSA',
    title:   'Formamos la voz de Bolivia',
    sub:     'Más de 40 años formando comunicadores comprometidos con la realidad social, cultural y política de nuestro país.',
    cta:     { to: '/quienes-somos', label: 'Conocer la carrera' },
    cta2:    { to: '/malla-curricular', label: 'Plan de estudios' },
  },
  {
    img:     'https://images.unsplash.com/photo-1503428593586-e225b39bddfe?w=1600&q=80',
    eyebrow: 'Periodismo · Radio · Televisión · Digital',
    title:   'Comunicación que transforma',
    sub:     'Formación integral en medios, investigación y producción audiovisual para comunicadores del siglo XXI.',
    cta:     { to: '/multimedia', label: 'Ver producciones' },
    cta2:    { to: '/docentes',   label: 'Conocer docentes' },
  },
  {
    img:     'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1600&q=80',
    eyebrow: 'La Paz, Bolivia — Desde 1984',
    title:   'Excelencia académica y compromiso social',
    sub:     'Primera carrera de Comunicación Social acreditada internacionalmente en Bolivia.',
    cta:     { to: '/mejores-alumnos', label: 'Mejores estudiantes' },
    cta2:    { to: '/egresados',       label: 'Egresados destacados' },
  },
]

function HeroSlider() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setCurrent(c => (c + 1) % HERO_SLIDES.length)
    }, 6000)
    return () => clearInterval(t)
  }, [])

  const slide = HERO_SLIDES[current]

  return (
    <section className="relative h-screen min-h-[640px] max-h-[900px] overflow-hidden bg-secondary-dark flex items-center">

      {/* Todas las imágenes montadas, transición de opacidad suave */}
      {HERO_SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            opacity:    i === current ? 1 : 0,
            transition: 'opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex:     i === current ? 1 : 0,
          }}
        >
          <img
            src={s.img}
            alt=""
            className="w-full h-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/80 to-secondary/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      ))}

      {/* Red vertical accent — siempre encima */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary via-primary-light to-primary z-20" />

      {/* Content — encima de todo */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 w-full">
        <div className="max-w-2xl xl:max-w-3xl">
          {/* Eyebrow */}
          <div
            key={`ey-${current}`}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 anim-fade-in"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary anim-pulse-dot" />
            <span className="text-blue-100 text-xs font-medium tracking-wide">
              {slide.eyebrow}
            </span>
          </div>

          {/* Title — animado al cambiar */}
          <div
            key={`t-${current}`}
            className="anim-fade-up delay-100"
          >
            <h1 className="font-display text-5xl sm:text-6xl xl:text-7xl font-bold text-white leading-none mb-5">
              <span className="block">
                {slide.title.split(' ').slice(0, 3).join(' ')}
              </span>
              <span className="text-gradient block mt-1">
                {slide.title.split(' ').slice(3).join(' ')}
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p
            key={`s-${current}`}
            className="text-blue-100/85 text-lg leading-relaxed mb-8 max-w-xl anim-fade-up delay-200"
          >
            {slide.sub}
          </p>

          {/* CTAs */}
          <div
            key={`c-${current}`}
            className="flex flex-wrap gap-3 anim-fade-up delay-300"
          >
            <Link to={slide.cta.to} className="btn btn-primary btn-lg group">
              {slide.cta.label}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to={slide.cta2.to}
              className="btn btn-lg glass text-white hover:bg-white/20 border-white/30"
            >
              {slide.cta2.label}
            </Link>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 right-8 z-20 flex gap-2 items-center">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-500 ${
              i === current
                ? 'w-8 h-2 bg-primary shadow-glow-red'
                : 'w-2 h-2 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 hidden sm:flex flex-col items-center gap-1.5">
        <span className="text-white/40 text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-5 h-8 border border-white/30 rounded-full flex justify-center pt-1.5">
          <div className="w-1 h-1.5 bg-white/60 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  )
}


// ─── TICKER ───────────────────────────────────────────────
function NewsTicker({ items }) {
  if (!items.length) return null
  const doubled = [...items, ...items]
  return (
    <div className="bg-primary text-white py-2.5 overflow-hidden">
      <div className="flex items-center gap-0">
        <div className="flex-shrink-0 bg-primary-dark px-4 py-0.5 text-xs font-bold uppercase tracking-wider mr-4 z-10">
          Noticias
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex gap-12 animate-ticker whitespace-nowrap">
            {doubled.map((n, i) => (
              <Link key={i} to={`/noticias/${n.slug}`}
                className="text-sm text-white/90 hover:text-white transition-colors flex-shrink-0 hover-line">
                {n.titulo}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── NEWS CARD ────────────────────────────────────────────
function NewsCard({ n, size = 'normal' }) {
  if (size === 'featured') {
    return (
      <Link to={`/noticias/${n.slug}`} className="group block relative rounded-2xl overflow-hidden h-[380px] bg-gray-900">
        {n.imagen_url
          ? <img src={n.imagen_url} alt={n.titulo} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" />
          : <div className="absolute inset-0 bg-gradient-to-br from-secondary-dark to-primary" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {n.categoria && (
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-white/90
                             bg-primary rounded-full px-3 py-1 mb-3">
              {n.categoria}
            </span>
          )}
          <h2 className="text-white font-bold text-xl leading-snug group-hover:text-blue-200 transition-colors line-clamp-3">
            {n.titulo}
          </h2>
          <div className="flex items-center gap-2 mt-3">
            <Clock size={13} className="text-white/50" />
            <p className="text-white/50 text-xs">{formatDate(n.publicado_en)}</p>
          </div>
        </div>
        <div className="absolute top-4 right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center
                        opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <ArrowRight size={15} className="text-gray-900" />
        </div>
      </Link>
    )
  }
  return (
    <Link to={`/noticias/${n.slug}`} className="group flex gap-3.5 p-3.5 rounded-2xl hover:bg-gray-50 transition-colors">
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
        {n.imagen_url
          ? <img src={n.imagen_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full bg-gradient-to-br from-secondary-50 to-primary-50" />
        }
      </div>
      <div className="flex-1 min-w-0">
        {n.categoria && <span className="text-xs font-semibold text-primary">{n.categoria}</span>}
        <p className="font-semibold text-sm text-gray-800 group-hover:text-primary transition-colors line-clamp-2 mt-0.5 leading-snug">
          {n.titulo}
        </p>
        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
          <Clock size={11} />{formatDate(n.publicado_en)}
        </p>
      </div>
    </Link>
  )
}

// ─── QUICK ACCESS ─────────────────────────────────────────
function QuickCard({ to, icon: Icon, label, color, desc }) {
  return (
    <Link to={to} className="group card card-lift p-5 flex flex-col gap-3">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center
                       group-hover:scale-110 transition-transform duration-300 shadow-md`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5 leading-snug">{desc}</p>}
      </div>
      <ChevronRight size={15} className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all mt-auto self-end" />
    </Link>
  )
}

// ─── STAT ITEM ────────────────────────────────────────────
function StatItem({ value, label, color }) {
  return (
    <div className={`text-center px-6 py-5 rounded-2xl ${color}`}>
      <p className="text-3xl font-bold font-display text-white leading-none">{value}</p>
      <p className="text-white/70 text-xs mt-1.5 font-medium uppercase tracking-wide">{label}</p>
    </div>
  )
}

// ─── MAIN HOME ────────────────────────────────────────────
export default function HomePage() {
  const { data: nData }    = useQuery({ queryKey: ['noticias-home'],   queryFn: () => noticiasService.getAll({ limit: 7 }) })
  const { data: eData }    = useQuery({ queryKey: ['eventos-home'],    queryFn: () => eventosService.getAll({ limit: 4 }) })
  const { data: mision }   = useQuery({ queryKey: ['inst-mision'],     queryFn: () => institucionalService.get('mision') })
  const { data: vision }   = useQuery({ queryKey: ['inst-vision'],     queryFn: () => institucionalService.get('vision') })
  const { data: mediaData }= useQuery({ queryKey: ['media-home'],      queryFn: () => multimediaService.getAll({ limit: 4 }) })

  const noticias  = nData?.data?.data    || []
  const eventos   = eData?.data?.data    || []
  const media     = mediaData?.data?.data || []
  const featured  = noticias.find(n => n.destacado) || noticias[0]
  const rest      = noticias.filter(n => n.id !== featured?.id).slice(0, 4)

  return (
    <div>
      <HeroSlider />
      <NewsTicker items={noticias.slice(0, 6)} />

      {/* ── ACCESOS RÁPIDOS ─────────────────────── */}
      <section className="section-sm">
        <div className="container-main">
          <div className="text-center mb-8">
            <p className="eyebrow mb-2">Accesos directos</p>
            <h2 className="section-title">¿Qué estás buscando?</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { to: '/whatsapp',         icon: MessageCircle, label: 'WhatsApp',       desc: 'Grupos por materia',     color: 'bg-green-500' },
              { to: '/malla-curricular', icon: BookOpen,      label: 'Malla',          desc: 'Plan 2023',              color: 'bg-secondary' },
              { to: '/tramites',         icon: GraduationCap, label: 'Trámites',       desc: 'Formularios',            color: 'bg-primary' },
              { to: '/biblioteca',       icon: BookOpen,      label: 'Biblioteca',     desc: 'Recursos digitales',     color: 'bg-indigo-600' },
              { to: '/docentes',         icon: Users,         label: 'Docentes',       desc: 'Directorio',             color: 'bg-secondary-light' },
              { to: '/multimedia',       icon: Play,          label: 'Multimedia',     desc: 'Trabajos estudiantiles', color: 'bg-rose-500' },
            ].map(item => <QuickCard key={item.to} {...item} />)}
          </div>
        </div>
      </section>

      {/* ── NOTICIAS ────────────────────────────── */}
      <section className="section bg-gray-50/70">
        <div className="container-main">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="eyebrow mb-1.5">Actualidad</p>
              <h2 className="section-title">Últimas noticias</h2>
            </div>
            <Link to="/noticias" className="btn btn-outline btn-sm hidden sm:inline-flex">
              Ver todas <ChevronRight size={14} />
            </Link>
          </div>

          {noticias.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                {featured && <NewsCard n={featured} size="featured" />}
              </div>
              <div className="flex flex-col gap-1 justify-between">
                {rest.map(n => <NewsCard key={n.id} n={n} />)}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Newspaper size={40} className="mx-auto mb-3 opacity-30" />
              <p>Las noticias aparecerán aquí una vez publicadas.</p>
            </div>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Link to="/noticias" className="btn btn-outline">Ver todas las noticias</Link>
          </div>
        </div>
      </section>

      {/* ── MISIÓN Y VISIÓN ─────────────────────── */}
      <section className="section bg-secondary relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-dots opacity-5" />

        <div className="container-main relative">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-2">Identidad institucional</p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-white">
              Nuestra razón de ser
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {[
              { key: 'mision', data: mision, label: 'Misión', icon: '◈' },
              { key: 'vision', data: vision, label: 'Visión', icon: '◉' },
            ].map(({ key, data, label, icon }) => (
              <div key={key} className="glass rounded-2xl p-7">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                    <span className="text-primary-light text-lg">{icon}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg">{label}</h3>
                </div>
                <p className="text-blue-100/80 text-sm leading-relaxed">
                  {data?.data?.data?.contenido
                    ? truncate(data.data.data.contenido, 260)
                    : 'Cargando...'}
                </p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10 max-w-2xl mx-auto">
            {[
              { value: '1984', label: 'Fundación',       color: 'bg-white/10' },
              { value: '40+',  label: 'Años',            color: 'bg-primary/30' },
              { value: '5000+', label: 'Estudiantes',    color: 'bg-white/10' },
              { value: '#1',   label: 'Bolivia',         color: 'bg-primary/30' },
            ].map(s => <StatItem key={s.label} {...s} />)}
          </div>

          <div className="text-center mt-10">
            <Link to="/quienes-somos" className="btn btn-white">
              Historia de la carrera <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── EVENTOS ─────────────────────────────── */}
      {eventos.length > 0 && (
        <section className="section-sm">
          <div className="container-main">
            <div className="flex items-end justify-between mb-7">
              <div>
                <p className="eyebrow mb-1.5">Agenda</p>
                <h2 className="section-title">Próximos eventos</h2>
              </div>
              <Link to="/eventos" className="btn btn-outline btn-sm hidden sm:inline-flex">
                Ver calendario <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {eventos.map((e, i) => (
                <div key={e.id} className={`card p-4 hover:shadow-card-md transition-all duration-300 anim-fade-up delay-${(i+1) * 100}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white text-xs font-bold"
                         style={{ background: e.color || '#C0392B' }}>
                      <span className="text-base leading-none font-bold">
                        {new Date(e.fecha_inicio).getDate()}
                      </span>
                      <span className="text-xs opacity-80 leading-none">
                        {new Date(e.fecha_inicio).toLocaleDateString('es', { month: 'short' })}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wide"
                            style={{ color: e.color || '#C0392B' }}>{e.tipo}</span>
                      <p className="font-semibold text-sm text-gray-800 mt-0.5 line-clamp-2 leading-snug">{e.titulo}</p>
                    </div>
                  </div>
                  {e.lugar && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <MapPin size={11} />
                      <span className="truncate">{e.lugar}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── MULTIMEDIA ──────────────────────────── */}
      {media.length > 0 && (
        <section className="section bg-gray-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-dots opacity-10" />
          <div className="container-main relative">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary-light mb-1.5">Producción estudiantil</p>
                <h2 className="text-2xl lg:text-3xl font-bold text-white">Multimedia</h2>
              </div>
              <Link to="/multimedia" className="btn btn-sm glass text-white hover:bg-white/20">
                Ver todo <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {media.map(m => {
                const thumb = m.thumbnail_url || (m.url_contenido?.includes('youtube') ?
                  `https://img.youtube.com/vi/${m.url_contenido.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1]}/hqdefault.jpg` : null)
                return (
                  <a key={m.id} href={m.url_contenido} target="_blank" rel="noreferrer"
                     className="group relative rounded-2xl overflow-hidden bg-gray-800 h-44 block">
                    {thumb
                      ? <img src={thumb} alt={m.titulo} className="w-full h-full object-cover opacity-80 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500" />
                      : <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900" />
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play size={20} className="text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-xs font-semibold line-clamp-2">{m.titulo}</p>
                      <p className="text-white/50 text-xs mt-0.5">{m.autor_nombre}</p>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── COMUNIDAD ───────────────────────────── */}
      <section className="section">
        <div className="container-main">
          <div className="text-center mb-10">
            <p className="eyebrow mb-2">Comunidad académica</p>
            <h2 className="section-title">Parte de la familia CCS</h2>
            <p className="section-sub max-w-lg mx-auto mt-2">
              Docentes, estudiantes y egresados que construyen la comunicación boliviana.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                to:    '/docentes',
                icon:  Users,
                title: 'Cuerpo docente',
                desc:  'Profesionales con experiencia en medios, investigación y comunicación estratégica.',
                color: 'from-secondary to-secondary-light',
                bg:    'bg-secondary-50',
              },
              {
                to:    '/mejores-alumnos',
                icon:  Award,
                title: 'Mejores estudiantes',
                desc:  'Reconocimiento semestral a la excelencia académica y el compromiso estudiantil.',
                color: 'from-primary to-primary-light',
                bg:    'bg-primary-50',
              },
              {
                to:    '/egresados',
                icon:  GraduationCap,
                title: 'Egresados',
                desc:  'Comunicadores activos en los principales medios y organizaciones de Bolivia.',
                color: 'from-indigo-600 to-indigo-500',
                bg:    'bg-indigo-50',
              },
            ].map(({ to, icon: Icon, title, desc, color, bg }) => (
              <Link key={to} to={to} className="group card card-lift p-6">
                <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-5
                                 group-hover:scale-110 transition-transform duration-300 shadow-card-md`}>
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                <div className="flex items-center gap-1.5 mt-5 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Explorar <ArrowRight size={15} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────── */}
      <section className="relative bg-gradient-to-r from-primary-dark via-primary to-primary-light py-16 overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-10" />
        <div className="container-main relative text-center">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">
            ¿Tienes alguna consulta?
          </h2>
          <p className="text-white/80 text-base mb-7 max-w-md mx-auto">
            Contáctanos directamente. Estamos en el Edificio René Zavaleta, Piso 5.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/contacto" className="btn btn-white btn-lg">
              Contactar ahora <ArrowRight size={17} />
            </Link>
            <Link to="/tramites"
              className="btn btn-lg border-2 border-white/40 text-white bg-transparent hover:bg-white/10">
              Ver trámites
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
