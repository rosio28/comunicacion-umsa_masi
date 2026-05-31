// PublicPages.jsx — VERSIÓN CORREGIDA COMPLETA
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import {
  noticiasService, docentesService, alumnosService, egresadosService,
  multimediaService, galeriaService, whatsappService, materiasService,
  tramitesService, streamingService, institucionalService, contactoService,
  convocatoriasService, eventosService, transparenciaService,
} from '../services/services'
import { formatDate, formatDateTime, truncate } from '../utils/helpers'
import { LoadingCenter, EmptyState, Badge, Pagination, Modal } from '../components/ui/UI'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import {
  Clock, MapPin, ExternalLink, ChevronRight, Play, FileText,
  Download, Send, Phone, Mail, Globe, ArrowRight, Award
} from 'lucide-react'
import apiPublic from '../services/apiPublic'

// ─── helper ──────────────────────────────────────────────────
const api = apiPublic

// ============================================================
// NOTICIAS
// ============================================================
export function NoticiasPage() {
  const [page, setPage] = useState(1)
  const [cat,  setCat]  = useState('')
  const { data: catData } = useQuery({ queryKey:['cats-pub'], queryFn:()=>api.get('/categorias?tipo=noticias').then(r=>r.data) })
  const cats = catData?.data||[]
  const { data, isLoading } = useQuery({
    queryKey: ['noticias-pub', page, cat],
    queryFn:  () => noticiasService.getAll({ page, limit:9, ...(cat?{categoria:cat}:{}) }),
  })
  const list       = data?.data?.data        || []
  const pagination = data?.data?.pagination  || {}

  return (
    <div className="section bg-secondary/5">
      <div className="container-main">
        <div className="rounded-[32px] border border-secondary/10 bg-white p-10 shadow-card-lg mb-10">
          <div className="max-w-3xl">
            <p className="eyebrow">Actualidad</p>
            <h1 className="section-title">Noticias</h1>
            <p className="section-sub mt-4 text-gray-600">Mantente informado sobre las últimas noticias, eventos y novedades de la Carrera de Comunicación Social UMSA.</p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-gray-500">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-primary">Contenido actualizado</span>
              <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-2">Múltiples categorías</span>
            </div>
          </div>
        </div>

        {cats.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-3">
            <button 
              onClick={() => { setCat(''); setPage(1) }}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                !cat 
                  ? 'bg-primary text-white shadow-md' 
                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Todas
            </button>
            {cats.map(c => (
              <button 
                key={c.id} 
                onClick={() => { setCat(c.id); setPage(1) }}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  cat === c.id 
                    ? 'bg-secondary text-white shadow-md' 
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {c.nombre}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <LoadingCenter />
        ) : list.length === 0 ? (
          <EmptyState title="No hay noticias publicadas" />
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {list.map(n => (
                <Link 
                  key={n.id} 
                  to={`/noticias/${n.slug}`} 
                  className="group overflow-hidden rounded-[28px] border border-secondary/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-card-md"
                >
                  <div className="h-48 overflow-hidden bg-gray-100">
                    {n.imagen_url ? (
                      <img 
                        src={n.imagen_url} 
                        alt={n.titulo} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        onError={e => e.target.style.display = 'none'}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center">
                        <ChevronRight size={24} className="text-secondary/40" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    {n.categoria && (
                      <Badge color={n.color_hex || '#1A5276'}>{n.categoria}</Badge>
                    )}
                    <h2 className="mt-4 font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug text-base">
                      {n.titulo}
                    </h2>
                    {n.resumen && (
                      <p className="text-gray-600 text-sm mt-2.5 line-clamp-2 leading-relaxed">
                        {n.resumen}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock size={14} className="text-secondary" />
                      {formatDate(n.publicado_en)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Pagination page={page} pages={pagination.pages||1} onChange={setPage}/>
          </>
        )}
      </div>
    </div>
  )
}

export function NoticiaDetallePage() {
  const { slug } = useParams()
  const { data, isLoading } = useQuery({ queryKey:['noticia',slug], queryFn:()=>noticiasService.getBySlug(slug) })
  const n = data?.data?.data
  if (isLoading) return <LoadingCenter/>
  if (!n) return <div className="section text-center"><p className="text-gray-500 mb-4">Noticia no encontrada.</p><Link to="/noticias" className="btn btn-outline">← Volver</Link></div>
  return (
    <article className="section">
      <div className="container-main max-w-3xl">
        {n.categoria && <Badge color={n.color_hex||'#1A5276'}>{n.categoria}</Badge>}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-3 mb-2 leading-tight">{n.titulo}</h1>
        <div className="flex items-center gap-3 text-sm text-gray-400 mb-6">
          <span className="flex items-center gap-1"><Clock size={13}/>{formatDate(n.publicado_en)}</span>
          {n.autor && <span>Por {n.autor}</span>}
        </div>
        {n.imagen_url && <img src={n.imagen_url} alt={n.titulo} className="w-full rounded-2xl mb-7 max-h-96 object-cover shadow-card-md" onError={e=>e.target.style.display='none'}/>}
        {n.resumen && <p className="text-lg text-gray-600 font-medium mb-5 leading-relaxed border-l-4 border-primary pl-4">{n.resumen}</p>}
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{__html:n.contenido}}/>
        <div className="mt-10 pt-6 border-t border-gray-100"><Link to="/noticias" className="btn btn-outline btn-sm">← Todas las noticias</Link></div>
      </div>
    </article>
  )
}

// ============================================================
// EVENTOS — con mapa GPS
// ============================================================
export function EventosPage() {
  const [selected, setSelected] = useState(null)
  const [view, setView]         = useState('lista')
  const { data, isLoading } = useQuery({ queryKey:['eventos-pub'], queryFn:()=>eventosService.getAll({}) })
  const eventos = data?.data?.data||[]
  const hoy     = new Date()
  const proximos = eventos.filter(e=>new Date(e.fecha_inicio)>=hoy).sort((a,b)=>new Date(a.fecha_inicio)-new Date(b.fecha_inicio))
  const pasados  = eventos.filter(e=>new Date(e.fecha_inicio)<hoy).sort((a,b)=>new Date(b.fecha_inicio)-new Date(a.fecha_inicio))

  return (
    <div className="section bg-secondary/5">
      <div className="container-main">
        <div className="rounded-[32px] border border-secondary/10 bg-white p-10 shadow-card-lg mb-10">
          <div className="max-w-3xl">
            <p className="eyebrow">Agenda académica</p>
            <h1 className="section-title">Eventos y actividades</h1>
            <p className="section-sub mt-4 text-gray-600">Participa en encuentros, talleres y presentaciones diseñadas para la comunidad estudiantil y profesional.</p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-gray-500">
              <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-2">Próximos encuentros</span>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-primary">Fechas claras y ubicación visible</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 rounded-3xl border border-secondary/10 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm">
            <span className="font-semibold text-secondary">Ver como:</span>
            {['lista', 'calendario'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`rounded-full px-4 py-2 transition ${view===v ? 'bg-secondary/10 text-secondary' : 'hover:bg-gray-100 text-gray-600'}`}>
                {v === 'lista' ? 'Lista' : 'Calendario'}
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-500">Eventos publicados: <span className="font-semibold text-gray-900">{eventos.length}</span></div>
        </div>
        {isLoading ? <LoadingCenter/> : (
          <>
            {view==='calendario' && (
              <div className="card p-4 mb-6">
                <FullCalendar plugins={[dayGridPlugin,interactionPlugin]} initialView="dayGridMonth" locale="es" events={eventos.map(e=>({id:String(e.id),title:e.titulo,start:e.fecha_inicio,end:e.fecha_fin||undefined,color:new Date(e.fecha_inicio)<hoy?'#9ca3af':e.color||'#C0392B',extendedProps:e}))}
                  height="auto" eventClick={info=>setSelected(info.event.extendedProps)}
                  headerToolbar={{left:'prev,next today',center:'title',right:'dayGridMonth,dayGridWeek'}}/>
              </div>
            )}
            {view==='lista' && (
              <div className="space-y-8">
                {proximos.length > 0 ? (
                  <>
                    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                      <div className="rounded-[32px] border border-secondary/10 bg-white p-8 shadow-card-lg">
                        <h2 className="text-xl font-semibold text-gray-900">Siguiente evento</h2>
                        <p className="mt-3 text-gray-600 leading-relaxed">No te pierdas la siguiente actividad programada por la carrera.</p>
                        <div className="mt-8">
                          <EventCard e={proximos[0]} onClick={() => setSelected(proximos[0])} featured />
                        </div>
                      </div>
                      <div className="rounded-[32px] border border-secondary/10 bg-white p-8 shadow-sm">
                        <h3 className="text-base font-semibold text-gray-900 uppercase tracking-[0.18em] text-secondary">Próximos eventos</h3>
                        <p className="mt-3 text-sm text-gray-600">Encuentra el resto de actividades próximas en una vista clara y directa.</p>
                        <div className="mt-6 space-y-4">
                          {proximos.length > 1 ? (
                            proximos.slice(1, 5).map(e => (
                              <EventCard key={e.id} e={e} onClick={() => setSelected(e)} compact />
                            ))
                          ) : (
                            <div className="rounded-3xl border border-secondary/10 bg-secondary/10 p-5 text-sm text-gray-600">
                              <p className="font-medium text-gray-900">Solo hay un evento programado por ahora.</p>
                              <p className="mt-2">Mantente atento a nuevas actividades en el calendario o regresa pronto para más actualizaciones.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {proximos.length > 5 && (
                      <div className="rounded-[28px] border border-secondary/10 bg-white p-6 shadow-sm">
                        <h3 className="font-semibold text-gray-900">Más eventos</h3>
                        <p className="mt-2 text-sm text-gray-500">Hay más actividades programadas. Usa el calendario para verlas todas en un solo lugar.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <EmptyState title="No hay eventos próximos" subtitle="Pronto publicaremos nuevas actividades para la comunidad." />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <Modal open={!!selected} onClose={()=>setSelected(null)} title={selected.titulo} size="md">
          {selected.imagen_url && <img src={selected.imagen_url} alt="" className="w-full h-44 object-cover rounded-xl mb-4" onError={e=>e.target.style.display='none'}/>}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge color={selected.color||'#C0392B'}>{selected.tipo}</Badge>
              {new Date(selected.fecha_inicio)<hoy && <span className="badge bg-gray-100 text-gray-500 text-xs">✓ Completado</span>}
            </div>
            {selected.descripcion && <p className="text-gray-700 text-sm leading-relaxed">{selected.descripcion}</p>}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
              <div><p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Inicio</p><p className="text-sm font-semibold text-gray-800">{formatDateTime(selected.fecha_inicio)}</p></div>
              {selected.fecha_fin && <div><p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Fin</p><p className="text-sm font-semibold text-gray-800">{formatDateTime(selected.fecha_fin)}</p></div>}
              {selected.lugar && <div className="col-span-2"><p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Lugar</p><p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><MapPin size={13} className="text-primary"/>{selected.lugar}</p></div>}
            </div>
            {/* Mapa GPS si tiene coordenadas */}
            {selected.latitud && selected.longitud && (
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <iframe
                  title="Ubicación del evento"
                  src={`https://maps.google.com/maps?q=${selected.latitud},${selected.longitud}&z=16&output=embed`}
                  className="w-full h-44" loading="lazy"/>
                <a href={`https://maps.google.com/maps?q=${selected.latitud},${selected.longitud}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 text-xs text-secondary hover:underline py-2 bg-gray-50">
                  <MapPin size={12}/> Abrir en Google Maps
                </a>
              </div>
            )}
            {selected.enlace_virtual && (
              <a href={selected.enlace_virtual} target="_blank" rel="noreferrer" className="btn btn-primary w-full">
                <ExternalLink size={15}/> Unirse al evento virtual
              </a>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

function EventCard({ e, onClick, featured = false, compact = false }) {
  const d = new Date(e.fecha_inicio)
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full text-left overflow-hidden rounded-[28px] border border-secondary/10 bg-white p-6 transition hover:-translate-y-1 hover:shadow-card-md ${featured ? 'shadow-card-lg' : 'shadow-sm'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Badge color={e.color || '#C0392B'}>{e.tipo}</Badge>
          <h3 className={`mt-4 font-semibold text-gray-900 ${featured ? 'text-xl' : 'text-base'} leading-snug line-clamp-2`}>{e.titulo}</h3>
        </div>
        <div className="rounded-3xl bg-secondary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
          {d.toLocaleDateString('es', { day: 'numeric', month: 'short' }).toUpperCase()}
        </div>
      </div>

      {!compact && e.descripcion && (
        <p className="mt-4 text-sm leading-6 text-gray-600 line-clamp-3">{e.descripcion}</p>
      )}

      <div className="mt-5 grid gap-3 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-secondary" />
          <span>{formatDateTime(e.fecha_inicio)}</span>
        </div>
        {e.lugar && (
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-secondary" />
            <span>{e.lugar}</span>
          </div>
        )}
        {e.enlace_virtual && (
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">Enlace virtual</span>
        )}
      </div>
    </button>
  )
}

// ============================================================
// DOCENTES
// ============================================================
export function DocentesPage() {
  const { data, isLoading } = useQuery({ queryKey:['docentes-pub'], queryFn:docentesService.getAll })
  const list = data?.data?.data || []

  return (
    <div className="section bg-secondary/5">
      <div className="container-main max-w-6xl">
        <div className="rounded-[32px] border border-secondary/10 bg-white p-10 shadow-card-lg mb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Cuerpo académico</p>
              <h1 className="section-title">Directorio de docentes</h1>
              <p className="section-sub mt-3 text-gray-600">Profesionales con experiencia en medios, investigación y comunicación, listos para acompañarte en tu formación.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-primary/10 bg-primary/5 px-5 py-4 text-center">
                <p className="text-xs uppercase tracking-[0.22em] text-primary/80">Docentes activos</p>
                <p className="mt-2 text-3xl font-bold text-primary">{list.length}</p>
              </div>
              <div className="rounded-3xl border border-secondary/10 bg-secondary/5 px-5 py-4 text-center">
                <p className="text-xs uppercase tracking-[0.22em] text-secondary/80">Especialidades</p>
                <p className="mt-2 text-3xl font-bold text-secondary">{[...new Set(list.map(d => d.especialidad).filter(Boolean))].length}</p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingCenter />
        ) : list.length === 0 ? (
          <EmptyState title="Sin docentes registrados" />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map(d => (
              <article key={d.id} className="group overflow-hidden rounded-[28px] border border-secondary/10 bg-white shadow-card-lg transition hover:-translate-y-1 hover:shadow-card-xl">
                <div className="relative overflow-hidden bg-secondary/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 to-primary/20" />
                  <div className="relative flex h-52 items-center justify-center">
                    {d.foto_url ? (
                      <img
                        src={d.foto_url}
                        alt={d.nombre_completo}
                        className="h-full w-full object-cover"
                        onError={e => (e.target.style.display = 'none')}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-white opacity-80">
                        {d.nombre_completo?.charAt(0) || 'D'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 p-6 text-center">
                  <p className="text-lg font-semibold text-gray-900 leading-tight">{d.nombre_completo}</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-secondary">{d.titulo_academico || 'Docente'}</p>
                  {d.especialidad && <p className="text-sm text-gray-500 line-clamp-2">{d.especialidad}</p>}

                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge color={d.tipo === 'titular' ? '#1A5276' : '#C0392B'}>{d.tipo}</Badge>
                    {d.especialidad && <span className="rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">Área {d.especialidad}</span>}
                  </div>

                  {d.email && (
                    <a
                      href={`mailto:${d.email}`}
                      className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/15"
                    >
                      {d.email}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// MEJORES ALUMNOS
// ============================================================
export function MejoresAlumnosPage() {
  const { data, isLoading } = useQuery({ queryKey:['alumnos-pub'], queryFn:()=>alumnosService.getAll({}) })
  const list = data?.data?.data || []
  const top = list.slice(0, 3)
  return (
    <div className="section bg-secondary/5">
      <div className="container-main max-w-6xl">
        <div className="rounded-[32px] border border-secondary/10 bg-white p-10 shadow-card-lg mb-10">
          <div className="max-w-2xl">
            <p className="eyebrow">Excelencia académica</p>
            <h1 className="section-title">Mejores estudiantes</h1>
            <p className="section-sub mt-3 text-gray-600">Un reconocimiento claro a quienes lideran el rendimiento académico y representan el espíritu de la carrera.</p>
          </div>
        </div>

        {isLoading ? (
          <LoadingCenter />
        ) : list.length === 0 ? (
          <EmptyState title="Sin datos registrados" />
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 xl:grid-cols-3">
              {top.map((a, i) => (
                <div
                  key={a.id}
                  className="group rounded-[28px] border border-secondary/10 bg-white p-6 shadow-card-lg transition hover:-translate-y-1 hover:shadow-card-xl"
                >
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-secondary/10 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Ranking académico</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900">Puesto {i + 1}</p>
                    </div>
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-semibold text-white ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-secondary' : 'bg-yellow-700'}`}>
                      {i + 1}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="relative overflow-hidden rounded-3xl bg-secondary/10 w-24 h-24 flex items-center justify-center">
                      {a.foto_url ? (
                        <img
                          src={a.foto_url}
                          alt={a.nombre_completo}
                          className="h-full w-full object-cover"
                          onError={ev => (ev.target.style.display = 'none')}
                        />
                      ) : (
                        <span className="text-2xl font-bold text-secondary">{a.nombre_completo?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl font-semibold text-gray-900 truncate">{a.nombre_completo}</p>
                      <p className="mt-2 text-sm text-gray-500">Semestre {a.semestre_actual} · Gestión {a.gestion}</p>
                      {a.logros && <p className="mt-3 text-sm text-gray-600 line-clamp-2">{a.logros}</p>}
                    </div>
                  </div>

                  <div className="mt-6 inline-flex items-center justify-between rounded-3xl bg-secondary/5 border border-secondary/10 px-4 py-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Promedio</p>
                      <p className="text-3xl font-bold text-primary">{a.promedio || '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Logro</p>
                      <p className="text-sm font-semibold text-gray-700">{a.logros ? 'Contenido disponible' : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[32px] border border-secondary/10 bg-white p-6 shadow-card-lg">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-secondary">Lista completa</p>
                  <p className="text-lg font-semibold text-gray-900">Todos los estudiantes destacados</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  <Award className="h-4 w-4" /> Ranking oficial
                </div>
              </div>

              <div className="space-y-3">
                {list.map((a, i) => (
                  <div key={a.id} className="grid gap-4 rounded-3xl border border-secondary/10 bg-secondary/5 p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-semibold text-primary shadow-sm">{i + 1}</div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{a.nombre_completo}</p>
                      <p className="text-sm text-gray-500 mt-1">Semestre {a.semestre_actual} · Gestión {a.gestion}</p>
                      {a.logros && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{a.logros}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{a.promedio || '-'}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Promedio</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// EGRESADOS
// ============================================================
export function EgresadosPage() {
  const { data, isLoading } = useQuery({ queryKey:['egresados-pub'], queryFn:egresadosService.getAll })
  const list = data?.data?.data || []
  return (
    <div className="section bg-secondary/5">
      <div className="container-main max-w-6xl">
        <div className="rounded-[32px] border border-secondary/10 bg-white p-10 shadow-card-lg mb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Comunidad</p>
              <h1 className="section-title">Egresados destacados</h1>
              <p className="section-sub mt-3 text-gray-600">Historias de egresados que representan a la comunicación boliviana en medios, instituciones y emprendimientos.</p>
            </div>
            <div className="rounded-3xl border border-primary/10 bg-primary/5 px-6 py-5 text-right">
              <p className="text-xs uppercase tracking-[0.22em] text-primary/80">Red profesional</p>
              <p className="mt-2 text-4xl font-bold text-primary">{list.length}</p>
              <p className="text-sm text-gray-500">Egresados disponibles</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingCenter />
        ) : list.length === 0 ? (
          <EmptyState title="Sin egresados registrados" />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map(e => (
              <article key={e.id} className="overflow-hidden rounded-[28px] border border-secondary/10 bg-white shadow-card-lg transition hover:-translate-y-1 hover:shadow-card-xl">
                <div className="relative h-48 overflow-hidden bg-secondary/10">
                  {e.foto_url ? (
                    <img
                      src={e.foto_url}
                      alt={e.nombre_completo}
                      className="h-full w-full object-cover"
                      onError={ev => (ev.target.style.display = 'none')}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl font-bold text-secondary">{e.nombre_completo?.charAt(0)}</div>
                  )}
                  <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-primary shadow-sm">
                    Egresado
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary text-lg font-semibold">
                      {e.nombre_completo?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-gray-900 truncate">{e.nombre_completo}</p>
                      <p className="text-xs text-gray-500 mt-1">Egresado {e.anio_egreso || '—'}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {e.ocupacion_actual && <p className="text-sm font-semibold text-primary">{e.ocupacion_actual}</p>}
                    {e.empresa_institucion && <p className="text-sm text-gray-500">{e.empresa_institucion}</p>}
                  </div>

                  {e.testimonio && (
                    <p className="mt-5 text-sm leading-6 text-gray-600 line-clamp-3">"{e.testimonio}"</p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {e.linkedin_url && (
                      <a href={e.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-2 text-primary transition hover:bg-primary/10">
                        <ExternalLink className="h-3.5 w-3.5" /> LinkedIn
                      </a>
                    )}
                    <span className="rounded-full bg-secondary/10 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-secondary">{e.anio_egreso ? `Promoción ${e.anio_egreso}` : 'Promoción disponible'}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// MULTIMEDIA
// ============================================================
export function MultimediaPage() {
  const [tipo, setTipo] = useState('')
  const { data, isLoading } = useQuery({ queryKey:['multimedia-pub',tipo], queryFn:()=>multimediaService.getAll(tipo?{tipo}:{}) })
  const list  = data?.data?.data||[]
  const tipos = ['video','podcast','fotografia','reportaje','otro']
  
  return (
    <div className="section bg-secondary/5">
      <div className="container-main">
        <div className="rounded-[32px] border border-secondary/10 bg-white p-10 shadow-card-lg mb-10">
          <div className="max-w-3xl">
            <p className="eyebrow">Producción estudiantil</p>
            <h1 className="section-title">Multimedia</h1>
            <p className="section-sub mt-4 text-gray-600">Explora los trabajos producidos por estudiantes de la carrera: videos, podcasts, reportajes y fotografías que reflejan la creatividad y profesionalismo en acción.</p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-gray-500">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-primary">Diversos formatos</span>
              <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-2">Trabajos destacados</span>
            </div>
          </div>
        </div>

        <div className="mb-10 flex flex-wrap gap-3">
          <button 
            onClick={() => setTipo('')} 
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              !tipo 
                ? 'bg-primary text-white shadow-md' 
                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Todos
          </button>
          {tipos.map(t => (
            <button 
              key={t} 
              onClick={() => setTipo(t)} 
              className={`rounded-full px-5 py-2.5 text-sm font-semibold capitalize transition-all ${
                tipo === t 
                  ? 'bg-secondary text-white shadow-md' 
                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <LoadingCenter />
        ) : list.length === 0 ? (
          <EmptyState title="Sin trabajos publicados" />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {list.map(m => {
              const ytId = m.url_contenido?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/)?.[1]
              const thumb = m.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null)
              return (
                <a 
                  key={m.id} 
                  href={m.url_contenido || '#'} 
                  target={m.url_contenido ? '_blank' : undefined} 
                  rel="noreferrer" 
                  className="group overflow-hidden rounded-[28px] border border-secondary/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-card-md"
                >
                  <div className="relative h-48 bg-gray-900 overflow-hidden">
                    {thumb ? (
                      <img 
                        src={thumb} 
                        alt={m.titulo} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        onError={e => e.target.style.display = 'none'}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary/40 to-primary/40 flex items-center justify-center">
                        <Play size={32} className="text-white/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all duration-300 opacity-0 group-hover:opacity-100">
                      <div className="w-14 h-14 bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play size={24} className="text-white ml-1" fill="white" />
                      </div>
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-primary text-white text-xs font-bold px-3 py-1.5 capitalize">
                        {m.tipo}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                      {m.titulo}
                    </p>
                    <div className="mt-3 space-y-2 text-xs text-gray-600">
                      <p className="font-medium">Por {m.autor_nombre}</p>
                      {m.materia_origen && (
                        <p className="text-gray-500">{m.materia_origen}</p>
                      )}
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// GALERÍA
// ============================================================
export function GaleriaPage() {
  const [albumId, setAlbumId]   = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const { data: albumesData }   = useQuery({ queryKey:['albumes-pub'], queryFn:galeriaService.getAlbumes })
  const albumes = albumesData?.data?.data||[]
  const albumActual = albumes.find(a=>a.id===albumId)
  const { data: imagenesData, isLoading: imgsLoading } = useQuery({ queryKey:['imagenes-pub',albumId], enabled:!!albumId, queryFn:()=>galeriaService.getImagenes(albumId) })
  const imagenes = imagenesData?.data?.data||[]

  const totalImages = albumes.reduce((sum, a) => sum + (a.total_imagenes || 0), 0)

  return (
    <div className="section bg-secondary/5">
      <div className="container-main max-w-7xl">
        <div className="rounded-[32px] border border-secondary/10 bg-white p-10 shadow-card-lg mb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Fotografías</p>
              <h1 className="section-title">Galería fotográfica</h1>
              <p className="section-sub mt-3 text-gray-600">Momentos de la vida académica de la carrera, capturados con estilo y ordenados por álbumes.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-primary/10 bg-primary/5 px-5 py-4 text-center">
                <p className="text-xs uppercase tracking-[0.22em] text-primary/80">Álbumes</p>
                <p className="mt-2 text-3xl font-bold text-primary">{albumes.length}</p>
              </div>
              <div className="rounded-3xl border border-secondary/10 bg-secondary/5 px-5 py-4 text-center">
                <p className="text-xs uppercase tracking-[0.22em] text-secondary/80">Fotos totales</p>
                <p className="mt-2 text-3xl font-bold text-secondary">{totalImages}</p>
              </div>
            </div>
          </div>
        </div>

        {!albumId ? (
          albumes.length===0 ? (
            <EmptyState title="Sin álbumes publicados" />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {albumes.map(a => (
                <button
                  key={a.id}
                  onClick={() => setAlbumId(a.id)}
                  className="group overflow-hidden rounded-[28px] border border-secondary/10 bg-white shadow-card-lg text-left transition hover:-translate-y-1 hover:shadow-card-xl"
                >
                  <div className="relative h-56 overflow-hidden bg-gray-100">
                    {a.portada_url ? (
                      <img
                        src={a.portada_url}
                        alt={a.nombre}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        onError={e => (e.target.style.display = 'none')}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300 text-sm">Sin portada</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary shadow-sm">
                      Ver fotos
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{a.nombre}</p>
                        {a.descripcion && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{a.descripcion}</p>}
                      </div>
                      <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">{a.total_imagenes||0} fotos</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          <div>
            <div className="mb-8 grid gap-4 lg:grid-cols-[auto_1fr] lg:items-center">
              <button onClick={() => setAlbumId(null)} className="btn btn-ghost btn-sm">← Todos los álbumes</button>
              <div className="rounded-[28px] border border-secondary/10 bg-white p-6 shadow-card-lg">
                <h2 className="font-semibold text-gray-900 text-2xl">{albumActual?.nombre}</h2>
                {albumActual?.descripcion && <p className="text-sm text-gray-500 mt-2">{albumActual.descripcion}</p>}
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-500">
                  <span className="rounded-full bg-secondary/10 px-3 py-2">{imagenes.length} imágenes</span>
                  <span className="rounded-full bg-secondary/10 px-3 py-2">Álbum activo</span>
                </div>
              </div>
            </div>

            {imgsLoading ? (
              <LoadingCenter />
            ) : imagenes.length===0 ? (
              <EmptyState title="Sin imágenes en este álbum" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {imagenes.map(img => (
                  <button
                    key={img.id}
                    onClick={() => setLightbox(img)}
                    className="group overflow-hidden rounded-[28px] bg-white shadow-card-lg transition hover:-translate-y-1 hover:shadow-card-xl"
                  >
                    <div className="relative overflow-hidden aspect-[4/3] bg-gray-100">
                      <img
                        src={img.thumbnail_url || img.url}
                        alt={img.titulo || ''}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={e => (e.target.style.display = 'none')}
                      />
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-4">
                      {img.titulo ? (
                        <p className="font-semibold text-gray-900 truncate">{img.titulo}</p>
                      ) : (
                        <p className="font-semibold text-gray-900">Fotografía</p>
                      )}
                      {img.descripcion && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{img.descripcion}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="max-w-5xl max-h-[92vh] w-full" onClick={e => e.stopPropagation()}>
            <div className="overflow-hidden rounded-[32px] bg-black shadow-2xl">
              <img
                src={lightbox.url}
                alt={lightbox.titulo || ''}
                className="mx-auto max-h-[80vh] w-full object-contain"
              />
              {lightbox.titulo && <div className="border-t border-white/10 bg-black/80 px-5 py-4 text-center text-sm text-white">{lightbox.titulo}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// STREAMING
// ============================================================
export function StreamingPage() {
  const [activeCanal, setActiveCanal] = useState(null)
  const { data } = useQuery({
    queryKey: ['streaming-pub'],
    queryFn: streamingService.getAll,
  })
  const canales = data?.data?.data || []
 
  // Extrae el ID de YouTube del campo embed_id o de la URL
  function getYouTubeEmbedId(canal) {
    if (canal.embed_id) return canal.embed_id
    const match = canal.url_canal?.match(
      /(?:youtube\.com\/(?:channel\/|c\/|@|watch\?v=)|youtu\.be\/)([^&\n?#/]+)/
    )
    return match?.[1] || null
  }
 
  const icons  = { youtube: '▶', tiktok: '♪', facebook: 'f', radio: '📻' }
  const colors = { youtube: 'bg-red-600', tiktok: 'bg-gray-900', facebook: 'bg-blue-600', radio: 'bg-primary' }
 
  return (
    <div className="section">
      <div className="container-main">
        <p className="eyebrow">Canales de comunicación</p>
        <h1 className="section-title">Streaming y producciones</h1>
        <p className="section-sub mb-8">
          Sigue los canales oficiales de la Carrera de Comunicación Social.
        </p>
 
        {canales.length === 0 ? (
          <EmptyState title="Sin canales registrados" />
        ) : (
          <div className="space-y-8">
 
            {/* Reproductor activo */}
            {activeCanal && (
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                  <p className="font-semibold text-gray-800">{activeCanal.nombre}</p>
                  <button
                    onClick={() => setActiveCanal(null)}
                    className="text-xs text-gray-400 hover:text-gray-700"
                  >
                    ✕ Cerrar
                  </button>
                </div>
                {activeCanal.plataforma === 'youtube' ? (
                  <div className="aspect-video bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeEmbedId(activeCanal)}?autoplay=1`}
                      title={activeCanal.nombre}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : activeCanal.plataforma === 'radio' ? (
                  <div className="p-6 text-center bg-gray-900">
                    <p className="text-white text-lg font-semibold mb-3">🎙️ {activeCanal.nombre}</p>
                    <audio
                      controls
                      autoPlay
                      className="w-full max-w-md mx-auto"
                      src={activeCanal.url_canal}
                    >
                      Tu navegador no soporta audio.
                    </audio>
                  </div>
                ) : (
                  <div className="aspect-video">
                    <iframe
                      src={activeCanal.url_canal}
                      title={activeCanal.nombre}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            )}
 
            {/* Lista de canales */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {canales.map(c => {
                const ytId = getYouTubeEmbedId(c)
                const thumb = ytId
                  ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                  : null
                const isActive = activeCanal?.id === c.id
 
                return (
                  <div
                    key={c.id}
                    className={`card overflow-hidden group cursor-pointer transition-all
                      ${isActive ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-card-md'}`}
                    onClick={() => setActiveCanal(isActive ? null : c)}
                  >
                    {/* Miniatura o color */}
                    <div className="relative h-36 bg-gray-900 overflow-hidden">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={c.nombre}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-70 transition-opacity"
                        />
                      ) : (
                        <div className={`w-full h-full ${colors[c.plataforma] || 'bg-secondary'} flex items-center justify-center`}>
                          <span className="text-5xl opacity-40">{icons[c.plataforma] || '📡'}</span>
                        </div>
                      )}
                      {/* Botón play superpuesto */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl
                          backdrop-blur-sm transition-transform group-hover:scale-110
                          ${isActive ? 'bg-primary' : 'bg-black/50'}`}>
                          {isActive ? '■' : '▶'}
                        </div>
                      </div>
                    </div>
 
                    {/* Info */}
                    <div className="p-3 flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg ${colors[c.plataforma] || 'bg-secondary'} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {icons[c.plataforma] || '📡'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">{c.nombre}</p>
                        <p className="text-xs text-gray-400 capitalize">{c.plataforma}</p>
                      </div>
                      <a
                        href={c.url_canal}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="ml-auto text-xs text-secondary hover:underline flex-shrink-0"
                      >
                        Abrir ↗
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
 
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// WHATSAPP
// ============================================================
export function WhatsappPage() {
  const { data, isLoading } = useQuery({ queryKey:['wa-pub'], queryFn:whatsappService.getAll })
  const grupos = data?.data?.data||[]
  const bySemestre = grupos.reduce((acc,g)=>{ if(!acc[g.semestre]) acc[g.semestre]=[]; acc[g.semestre].push(g); return acc },{})
  
  return (
    <div className="section bg-secondary/5">
      <div className="container-main">
        <div className="rounded-[32px] border border-secondary/10 bg-white p-10 shadow-card-lg mb-10">
          <div className="max-w-3xl">
            <p className="eyebrow">Comunicación estudiantil</p>
            <h1 className="section-title">Grupos de WhatsApp por materia</h1>
            <p className="section-sub mt-4 text-gray-600">Conecta con tus compañeros en los grupos oficiales de WhatsApp de cada materia. Acceso directo, rápido y seguro.</p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-gray-500">
              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-2 text-green-700">Organizado por semestre</span>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-primary">Únete en 1 clic</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingCenter />
        ) : Object.keys(bySemestre).length === 0 ? (
          <EmptyState title="Sin grupos registrados" />
        ) : (
          <div className="space-y-8">
            {Object.entries(bySemestre)
              .sort(([a], [b]) => +a - +b)
              .map(([sem, gs]) => (
                <div key={sem} className="rounded-[28px] border border-secondary/10 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-white text-sm font-bold">
                      {sem}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Semestre {sem}</h2>
                      <p className="text-sm text-gray-500">{gs.length} grupo{gs.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {gs.map(g => (
                      <a
                        key={g.id}
                        href={g.enlace_wa}
                        target="_blank"
                        rel="noreferrer"
                        className="group overflow-hidden rounded-[24px] border border-green-100 bg-gradient-to-br from-green-50 to-white p-5 transition hover:-translate-y-1 hover:shadow-card-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-green-700">
                              {g.materia_nombre}
                            </h3>
                            <p className="mt-2 text-xs text-gray-500">Gestión {g.gestion}</p>
                          </div>
                          <div className="rounded-full bg-green-500 px-3 py-2 text-xs font-bold text-white group-hover:bg-green-600 transition-colors flex-shrink-0">
                            Unirse
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// MALLA CURRICULAR
// ============================================================
export function MallaCurricularPage() {
  const [selected, setSelected] = useState(null)
  const { data, isLoading } = useQuery({ queryKey:['materias-pub'], queryFn:()=>materiasService.getAll('2023') })
  const materias = data?.data?.data||[]
  const totalMaterias = materias.length
  const totalConPrerrequisitos = materias.filter(m => m.prerrequisitos?.trim()).length
  const bySem = {}
  for (let i = 1; i <= 10; i++) bySem[i] = materias.filter(m => m.semestre === i)

  return (
    <div className="section bg-secondary/5">
      <div className="container-main">
        <div className="rounded-[32px] border border-secondary/10 bg-white shadow-card-lg p-8 mb-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">Plan de estudios</p>
              <h1 className="section-title">Malla curricular — Pensum 2023</h1>
              <p className="section-sub mt-3 text-gray-600">Plan de formación de la Carrera de Comunicación Social UMSA.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-3xl bg-secondary/10 px-4 py-3 text-center text-sm font-semibold text-secondary">10 semestres</div>
              <div className="rounded-3xl bg-primary/10 px-4 py-3 text-center text-sm font-semibold text-primary">{totalMaterias} materias</div>
              <div className="rounded-3xl bg-secondary/10 px-4 py-3 text-center text-sm font-semibold text-secondary">{totalConPrerrequisitos} con prerrequisitos</div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingCenter />
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 min-w-[700px]">
              {Object.entries(bySem).map(([sem, ms]) => (
                <div key={sem} className="rounded-[30px] overflow-hidden border border-secondary/10 bg-white shadow-sm">
                  <div className="bg-secondary text-white text-center text-xs font-bold uppercase tracking-[0.18em] py-3 px-4">
                    Semestre {sem}
                  </div>
                  <div className="space-y-3 p-4">
                    {ms.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center text-sm text-gray-400">
                        Sin materias registradas
                      </div>
                    ) : ms.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setSelected(m)}
                        className="group w-full rounded-3xl border border-gray-200 bg-slate-50 p-4 text-left transition-all hover:border-primary/40 hover:bg-secondary/5 hover:shadow-card-md"
                      >
                        <div className="space-y-2">
                          <p className="font-semibold text-sm text-gray-800 line-clamp-2 leading-snug">{m.nombre}</p>
                          {m.area && <p className="text-xs text-gray-500">Área {m.area}</p>}
                        </div>
                        {m.prerrequisitos && (
                          <div className="mt-3 flex flex-col gap-2">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                              Requisitos
                            </span>
                            <p className="text-xs text-gray-500 line-clamp-2">{m.prerrequisitos}</p>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={selected.nombre || 'Detalle de materia'} size="sm">
          <div className="space-y-4 text-sm text-gray-700">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400">Semestre</p>
                <p className="font-semibold text-gray-900">{selected.semestre}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Prerrequisitos</p>
                <p className="font-semibold text-gray-900">{selected.prerrequisitos || '—'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400">Área</p>
                <p className="font-semibold text-gray-900">{selected.area || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Tipo</p>
                <p className="font-semibold capitalize text-gray-900">{selected.tipo || '—'}</p>
              </div>
            </div>
            {selected.descripcion && <p className="text-sm text-gray-600">{selected.descripcion}</p>}
          </div>
        </Modal>
      )}
    </div>
  )
}

// ============================================================
// TRÁMITES
// ============================================================
export function TramitesPage() {
  const [selected, setSelected] = useState(null)
  const { data, isLoading } = useQuery({ queryKey:['tramites-pub'], queryFn:tramitesService.getAll })
  const list = data?.data?.data||[]

  return (
    <div className="section bg-secondary/5">
      <div className="container-main">
        <div className="rounded-[32px] border border-secondary/10 bg-white p-10 shadow-card-lg mb-10">
          <div className="max-w-3xl">
            <p className="eyebrow">Gestión académica</p>
            <h1 className="section-title">Trámites académicos</h1>
            <p className="section-sub mt-4 text-gray-600">Encuentra el trámite que necesitas y accede rápidamente a los requisitos, formularios y contactos.</p>
          </div>
        </div>

        {isLoading ? (
          <LoadingCenter />
        ) : list.length === 0 ? (
          <EmptyState title="Sin trámites registrados" />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {list.map(tramite => (
              <button
                key={tramite.id}
                onClick={() => setSelected(tramite)}
                className="group overflow-hidden rounded-[28px] border border-secondary/10 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-card-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-gray-900 group-hover:text-primary transition-colors leading-snug">{tramite.nombre}</p>
                    {tramite.descripcion && <p className="mt-3 text-sm leading-6 text-gray-600 line-clamp-3">{tramite.descripcion}</p>}
                  </div>
                  <div className="flex shrink-0 items-center justify-center rounded-3xl bg-secondary/10 px-3 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
                    Trámite
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  {tramite.contacto && <span className="rounded-full border border-secondary/10 bg-secondary/5 px-3 py-2">Contacto: {tramite.contacto}</span>}
                  {tramite.archivo_url && <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-2 text-primary">Formulario disponible</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={selected.nombre} size="md">
          <div className="space-y-4 text-sm text-gray-700">
            {selected.descripcion && <p>{selected.descripcion}</p>}
            {selected.contacto && <p className="text-secondary">Contacto: {selected.contacto}</p>}
            {selected.archivo_url ? (
              <a href={selected.archivo_url} target="_blank" rel="noreferrer" download className="btn btn-primary btn-sm">
                <Download size={14}/> Descargar formulario
              </a>
            ) : (
              <p className="text-sm text-gray-500">No hay formulario disponible para este trámite.</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

// ============================================================
// TRANSPARENCIA — ahora funcional con BD
// ============================================================
export function TransparenciaPage() {
  const [selected, setSelected] = useState(null)
  const { data, isLoading } = useQuery({ queryKey:['transparencia-pub'], queryFn:transparenciaService.getAll })
  const list = data?.data?.data||[]

  const tipoColor = { reglamento:'#1A5276', resolucion:'#C0392B', acta:'#27AE60', convocatoria:'#F39C12', informe:'#8E44AD', plan:'#16A085', otro:'#7F8C8D' }
  const tipoIcon  = { reglamento:'📋', resolucion:'📜', acta:'📝', convocatoria:'📢', informe:'📊', plan:'🗓️', otro:'📄' }

  return (
    <div className="overflow-hidden">
      <div className="bg-secondary/5 py-16">
        <div className="container-main rounded-[40px] border border-secondary/10 bg-white shadow-2xl p-10 lg:p-14">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-secondary/80 mb-4">Rendición de cuentas · Carrera de Comunicación Social</p>
            <h1 className="text-4xl font-black text-gray-900 sm:text-5xl">Transparencia institucional</h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">Accede directamente a los documentos oficiales, informes y resoluciones que sustentan la gestión académica y administrativa. Todo está aquí, sin distracciones.</p>
          </div>
        </div>
      </div>

      <div className="section pb-20 pt-10">
        <div className="container-main">
          {isLoading ? (
            <LoadingCenter />
          ) : list.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-gray-200 bg-white py-16 text-center shadow-sm">
              <p className="text-5xl">📂</p>
              <p className="mt-4 text-xl font-semibold text-gray-800">Sin documentos publicados aún</p>
              <p className="mt-2 text-sm text-gray-500">Los materiales de transparencia se publican periódicamente en este espacio.</p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {list.map(doc => (
                <div key={doc.id} className="group overflow-hidden rounded-[32px] border border-secondary/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-card-lg">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-3xl text-2xl" style={{ backgroundColor: `${tipoColor[doc.tipo] || '#7F8C8D'}20` }}>
                        {tipoIcon[doc.tipo] || '📄'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{doc.titulo}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{doc.tipo || 'Otro'}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">{formatDate(doc.publicado_en)}</span>
                  </div>

                  {doc.descripcion && <p className="mt-4 text-sm leading-6 text-gray-600">{doc.descripcion}</p>}

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {doc.archivo_url && (
                      <a href={doc.archivo_url} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary/15">
                        <Download size={14}/> Descargar
                      </a>
                    )}
                    <span className="rounded-full border border-secondary/10 bg-secondary/5 px-4 py-2 text-sm text-gray-500">ID {doc.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// CONVOCATORIAS
// ============================================================
export function ConvocatoriasPage() {
  const { data, isLoading } = useQuery({ queryKey:['conv-pub'], queryFn:convocatoriasService.getAll })
  const list = data?.data?.data||[]

  return (
    <div className="section bg-secondary/5">
      <div className="container-main">
        <div className="rounded-[32px] border border-secondary/10 bg-white p-10 shadow-card-lg mb-10">
          <div className="max-w-3xl">
            <p className="eyebrow">Oportunidades</p>
            <h1 className="section-title">Convocatorias abiertas</h1>
            <p className="section-sub mt-4 text-gray-600">Descubre pasantías, convocatorias docentes, becas e investigación con la información clara y accesible.</p>
          </div>
        </div>

        {isLoading ? (
          <LoadingCenter />
        ) : list.length === 0 ? (
          <EmptyState title="Sin convocatorias activas" />
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {list.map(conv => (
              <div key={conv.id} className="group overflow-hidden rounded-[28px] border border-secondary/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-card-md">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Badge color="#C0392B" className="uppercase text-[11px] tracking-[0.2em]">{conv.tipo}</Badge>
                    <h2 className="mt-4 text-lg font-semibold text-gray-900 leading-snug">{conv.titulo}</h2>
                  </div>
                  {conv.fecha_limite && (
                    <div className="rounded-3xl bg-secondary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
                      Cierra el {formatDate(conv.fecha_limite)}
                    </div>
                  )}
                </div>

                <p className="mt-4 text-sm leading-6 text-gray-600">{truncate(conv.descripcion, 220)}</p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {conv.archivo_url ? (
                    <a href={conv.archivo_url} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15">
                      <Download size={14}/> Descargar bases
                    </a>
                  ) : (
                    <span className="text-sm text-gray-500">Sin archivo adjunto</span>
                  )}
                  <a href="#participa" className="text-sm font-semibold text-secondary hover:underline">Cómo postular</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// CONTACTO — envía correo real
// ============================================================
export function ContactoPage() {
  const { register, handleSubmit, reset, formState:{errors,isSubmitting} } = useForm()
  const onSubmit = async data => {
    try {
      await contactoService.enviar(data)
      toast.success('¡Mensaje enviado! Te responderemos pronto.')
      reset()
    } catch(e) {
      toast.error(e.response?.data?.message || 'Error al enviar. Intenta de nuevo.')
    }
  }
  return (
    <div className="section bg-secondary/5">
      <div className="container-main max-w-6xl">
        <div className="rounded-[32px] border border-secondary/10 bg-white p-10 shadow-card-lg mb-10">
          <div className="max-w-2xl">
            <p className="eyebrow">Comunícate con nosotros</p>
            <h1 className="section-title">Contacto</h1>
            <p className="section-sub mt-4 text-gray-600">Escríbenos tus dudas, sugerencias o consultas. Nuestro equipo responderá lo más pronto posible.</p>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-secondary/10 bg-white p-8 shadow-card-lg">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: <MapPin size={18} className="text-primary" />, title: 'Dirección', value: 'Edificio René Zavaleta, Piso 5\nCalle Federizo Suazo, La Paz, Bolivia' },
                  { icon: <Phone size={18} className="text-primary" />, title: 'Teléfonos', value: '(591-2) 2911880 · (591-2) 2911890' },
                  { icon: <Mail size={18} className="text-primary" />, title: 'Correo', value: 'comunicasocialumsa@gmail.com' },
                  { icon: <Globe size={18} className="text-primary" />, title: 'Sitio web', value: 'comunicacion.umsa.bo' },
                ].map(item => (
                  <div key={item.title} className="flex gap-4 rounded-3xl border border-secondary/10 bg-secondary/5 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">{item.icon}</div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-gray-700 whitespace-pre-line">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-secondary/10 shadow-card-lg">
              <div className="bg-primary/5 px-6 py-5">
                <p className="text-sm uppercase tracking-[0.22em] text-primary">Nuestra ubicación</p>
                <p className="mt-2 text-gray-600 text-sm">Visítanos en el campus para consultas presenciales o inicia tu contacto aquí mismo.</p>
              </div>
              <iframe
                title="Ubicación CCS UMSA"
                src="https://maps.google.com/maps?q=-16.505857,-68.127117&z=16&output=embed"
                className="w-full h-72"
                loading="lazy"
              />
            </div>
          </div>

          <div className="rounded-[32px] border border-secondary/10 bg-white p-8 shadow-card-lg">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.24em] text-secondary">Formulario de contacto</p>
              <h2 className="mt-3 text-3xl font-semibold text-gray-900">Escribe tu mensaje</h2>
              <p className="mt-3 text-sm text-gray-600">Cuéntanos qué necesitas y te daremos una respuesta rápida y personalizada.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Nombre completo *</label>
                  <input className="input" {...register('nombre', { required: 'Requerido' })} />
                  {errors.nombre && <p className="text-red-500 text-xs mt-2">{errors.nombre.message}</p>}
                </div>
                <div>
                  <label className="label">Correo electrónico *</label>
                  <input className="input" type="email" {...register('email', { required: 'Requerido' })} />
                  {errors.email && <p className="text-red-500 text-xs mt-2">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <label className="label">Asunto</label>
                <input className="input" {...register('asunto')} />
              </div>

              <div>
                <label className="label">Mensaje *</label>
                <textarea className="input h-36 resize-none" {...register('mensaje', { required: 'Requerido' })} />
                {errors.mensaje && <p className="text-red-500 text-xs mt-2">{errors.mensaje.message}</p>}
              </div>

              <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full py-3">
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2"><Send size={16} /> Enviar mensaje</span>
                )}
              </button>
            </form>

            <div className="mt-8 rounded-[28px] border border-secondary/10 bg-secondary/5 p-5 text-sm text-gray-600">
              <p className="font-semibold text-gray-900">Consejo rápido</p>
              <p className="mt-2">Incluye tu nombre, correo y un resumen breve del motivo. Así podemos atender tu solicitud con mayor rapidez.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// BIBLIOTECA
// ============================================================
export function BibliotecaPage() {
  const recursos = [
    { icon:'📚', title:'Libros y referencias', desc:'Colección especializada en comunicación social, periodismo, semiótica y ciencias sociales.' },
    { icon:'📰', title:'Revistas académicas', desc:'Publicaciones indexadas sobre investigación en comunicación y medios.' },
    { icon:'📄', title:'Tesis y trabajos', desc:'Repositorio de investigaciones de postgrado y trabajos de grado de la carrera.' },
    { icon:'🔗', title:'Bases de datos', desc:'Acceso a plataformas de investigación académica y artículos científicos internacionales.' },
  ]

  return (
    <div className="section bg-secondary/5">
      <div className="container-main">
        <div className="rounded-[32px] border border-secondary/10 bg-white p-10 shadow-card-lg mb-10">
          <div className="max-w-3xl">
            <p className="eyebrow">Recursos académicos</p>
            <h1 className="section-title">Biblioteca digital UMSA</h1>
            <p className="section-sub mt-4 text-gray-600">Accede a miles de recursos: libros, revistas académicas, tesis y bases de datos especializadas para tu investigación y aprendizaje.</p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-gray-500">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-blue-700">Acceso 24/7</span>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-primary">Recursos especializados</span>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr] mb-10">
          <div className="rounded-[28px] border border-secondary/10 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">¿Qué encontrarás?</h2>
            <div className="space-y-4">
              {recursos.map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <span className="text-2xl flex-shrink-0">{icon}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{title}</p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-secondary/10 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Acceso rápido</h2>
            <div className="space-y-4">
              <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-6">
                <p className="text-sm text-gray-600 mb-4">Entra a la biblioteca virtual con tu cuenta UMSA y explora miles de recursos académicos.</p>
                <a href="https://bibliotecas.umsa.bo" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-blue-600 text-white px-6 py-3 text-sm font-semibold hover:bg-blue-700 transition-colors">
                  Abrir biblioteca virtual <ExternalLink size={15} />
                </a>
              </div>
              <div className="rounded-[24px] border border-secondary/10 bg-secondary/5 p-6">
                <p className="text-xs text-gray-600 uppercase tracking-[0.18em] font-semibold mb-2 text-secondary">Horario de atención</p>
                <p className="text-sm text-gray-900 font-semibold">Lunes a viernes: 8:00 a.m. - 6:00 p.m.</p>
                <p className="text-sm text-gray-600 mt-1">Sábados: 9:00 a.m. - 1:00 p.m.</p>
                <p className="text-xs text-gray-500 mt-3">Ubicación: Edificio René Zavaleta, Planta Baja</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-secondary/10 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">¿Necesitas ayuda?</h2>
          <p className="text-gray-600 text-sm mb-6">El equipo de la biblioteca digital está disponible para atender consultas sobre acceso, búsqueda de recursos y orientación académica.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-gray-100 bg-gray-50 p-5">
              <p className="text-xs text-gray-500 uppercase tracking-[0.18em] font-semibold mb-2">Correo de contacto</p>
              <a href="mailto:biblioteca@umsa.bo" className="text-sm font-semibold text-secondary hover:underline">biblioteca@umsa.bo</a>
            </div>
            <div className="rounded-[24px] border border-gray-100 bg-gray-50 p-5">
              <p className="text-xs text-gray-500 uppercase tracking-[0.18em] font-semibold mb-2">Teléfono</p>
              <a href="tel:+591229118800" className="text-sm font-semibold text-secondary hover:underline">(591-2) 2911880</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// IPICOM — rediseñado
// ============================================================
export function IpicomPage() {
  const areas = [
    { icon:'🔬', title:'Investigación', desc:'Proyectos activos sobre comunicación, medios y sociedad boliviana. Publicaciones anuales con resultados de investigación.', color:'bg-secondary', link:'https://ipicom.umsa.bo' },
    { icon:'🎓', title:'Posgrado', desc:'Maestría en Comunicación Social. Programa de alta especialización para profesionales en ejercicio.', color:'bg-primary', link:'https://ipicom.umsa.bo/posgrado' },
    { icon:'🤝', title:'Interacción Social', desc:'Proyectos de extensión universitaria. Vinculación de la carrera con comunidades y organizaciones sociales.', color:'bg-secondary/80', link:'https://ipicom.umsa.bo' },
    { icon:'📚', title:'Publicaciones', desc:'Revista académica indexada, libros y compilaciones de investigaciones en comunicación y ciencias sociales.', color:'bg-blue-800', link:'https://ipicom.umsa.bo/publicaciones' },
    { icon:'🏛️', title:'Biblioteca especializada', desc:'Colección de textos especializados en comunicación, periodismo, semiótica y ciencias sociales.', color:'bg-amber-500', link:'https://bibliotecas.umsa.bo' },
    { icon:'🌐', title:'Cooperación internacional', desc:'Convenios con universidades y centros de investigación de América Latina y Europa.', color:'bg-teal-600', link:'https://ipicom.umsa.bo' },
  ]

  return (
    <div className="overflow-hidden">
      <div className="bg-secondary px-4 py-16 sm:px-6 lg:px-8">
        <div className="container-main relative rounded-[40px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute -right-16 top-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute left-1/2 top-0 h-24 w-24 -translate-x-1/2 rounded-full bg-white/10 blur-2xl" />
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-100/70 mb-4">Carrera de Comunicación Social · UMSA</p>
              <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">IpICOM: investigación, posgrado e interacción social</h1>
              <p className="mt-6 max-w-2xl text-lg text-blue-100/85 leading-8">El Instituto de Investigación, Posgrado e Interacción Social impulsa proyectos académicos, publicaciones especializadas y programas de formación avanzados para los comunicadores del país.</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <a href="https://ipicom.umsa.bo" target="_blank" rel="noreferrer" className="btn btn-white btn-lg inline-flex items-center justify-center gap-2">
                  Visitar IpICOM <ExternalLink size={16}/>
                </a>
                <a href="#areas" className="btn btn-primary btn-lg bg-white/10 text-white hover:bg-white/20 border border-white/20">
                  Ver áreas clave
                </a>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 text-white shadow-2xl">
              <div className="mb-6 rounded-3xl bg-white/5 p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-blue-100/70">Impacto reciente</p>
                <h2 className="mt-4 text-2xl font-bold">+120 proyectos</h2>
                <p className="mt-2 text-sm text-blue-100/75 leading-relaxed">Investigación, extensión y formación de postgrado en comunicación social.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white/5 p-5">
                  <p className="text-3xl font-black text-white">24</p>
                  <p className="mt-2 text-sm text-blue-100/70">Años de experiencia en investigación</p>
                </div>
                <div className="rounded-3xl bg-white/5 p-5">
                  <p className="text-3xl font-black text-white">8</p>
                  <p className="mt-2 text-sm text-blue-100/70">Programas de posgrado y diplomados</p>
                </div>
                <div className="rounded-3xl bg-white/5 p-5">
                  <p className="text-3xl font-black text-white">300+</p>
                  <p className="mt-2 text-sm text-blue-100/70">Publicaciones académicas y proyectos sociales</p>
                </div>
                <div className="rounded-3xl bg-white/5 p-5">
                  <p className="text-3xl font-black text-white">20</p>
                  <p className="mt-2 text-sm text-blue-100/70">Convenios con socios nacionales e internacionales</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section pb-16 pt-12">
        <div className="container-main">
          <div className="text-center mb-10">
            <p className="eyebrow">Nuestras áreas</p>
            <h2 className="section-title">¿Qué hace IpICOM?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-500">Cada área está diseñada para fortalecer la formación académica, la investigación aplicada y el vínculo con la sociedad.</p>
          </div>

          <div id="areas" className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {areas.map(({ icon, title, desc, color, link }) => (
              <a
                key={title}
                href={link}
                target="_blank"
                rel="noreferrer"
                className="group overflow-hidden rounded-[28px] border border-secondary/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-card-lg"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-3xl text-2xl text-white ${color}`}>
                  {icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-500">{desc}</p>
                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-secondary transition group-hover:text-secondary/90">
                  <span>Ver más</span>
                  <ArrowRight size={14}/>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// QUIÉNES SOMOS
// ============================================================
export function QuienesSomosPage() {
  const claves  = ['mision','vision','historia']
  const queries = claves.map(c => useQuery({ queryKey:['inst-pub',c], queryFn:()=>institucionalService.get(c) }))
  const items   = queries.map(q => q.data?.data?.data).filter(Boolean)

  return (
    <div className="section bg-slate-50">
      <div className="container-main max-w-6xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card-lg mb-12">
          <div className="relative grid gap-8 lg:grid-cols-[1.5fr_1fr] p-8 md:p-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary mb-4">Carrera de Comunicación Social</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-slate-900">Quiénes somos</h1>
              <p className="mt-5 max-w-2xl text-base md:text-lg leading-relaxed text-slate-600">La Carrera de Comunicación Social forma profesionales capaces de comunicar con rigor, creatividad y responsabilidad social. Somos un espacio académico comprometido con la cultura paceña, los medios bolivianos y la democracia participativa.</p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-card-sm">
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">Comunicadores</span>
                <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-secondary">Investigación</span>
                <span className="rounded-full bg-amber-100/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Extensión social</span>
              </div>
              <div className="space-y-4 text-sm leading-7 text-slate-700">
                <p><span className="font-semibold text-slate-900">Fundación:</span> 20 de agosto de 1984.</p>
                <p><span className="font-semibold text-slate-900">Misión:</span> formar líderes de la comunicación social boliviana.</p>
                <p><span className="font-semibold text-slate-900">Visión:</span> ser referente académico y social en La Paz y el país.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {claves.map((clave, index) => {
            const item = queries[index].data?.data?.data
            return item ? (
              <article key={clave} className="group rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-card-sm transition hover:-translate-y-1 hover:shadow-card-md">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600/90 mb-2">{item.titulo}</p>
                    <h2 className="text-2xl font-bold text-slate-900">{item.titulo}</h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-50 text-blue-700 text-xl font-bold">{index + 1}</div>
                </div>
                {item.imagen_url && (
                  <img src={item.imagen_url} alt={item.titulo} className="w-full h-48 object-cover rounded-3xl mb-5 shadow-inner" onError={e=>e.target.style.display='none'} />
                )}
                <p className="text-sm leading-7 text-slate-600">{item.contenido}</p>
              </article>
            ) : null
          })}
        </div>

        <div className="mt-12 rounded-[2rem] bg-white border border-slate-200/80 p-8 shadow-card-md">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-blue-500">Sello académico</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">Orgullo paceño y compromiso social</h2>
            </div>
            <p className="max-w-2xl text-slate-600 leading-relaxed">En la UMSA de La Paz, Comunicación Social impulsa el análisis crítico de los medios, la investigación social y la formación de profesionales que acompañan el cambio del país desde la cultura, la educación y la ciudadanía.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
