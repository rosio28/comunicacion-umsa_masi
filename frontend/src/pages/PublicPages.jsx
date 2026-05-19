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
  Download, Send, Phone, Mail, Globe, ArrowRight
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
    <div className="section">
      <div className="container-main">
        <div className="mb-8"><p className="eyebrow">Actualidad</p><h1 className="section-title">Noticias</h1></div>
        {cats.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-7">
            <button onClick={() => { setCat(''); setPage(1) }}
              className={`badge cursor-pointer px-3 py-1.5 text-xs font-semibold transition-all ${!cat?'bg-primary text-white':'badge-gray hover:bg-gray-200'}`}>
              Todas
            </button>
            {cats.map(c => (
              <button key={c.id} onClick={() => { setCat(c.id); setPage(1) }}
                className={`badge cursor-pointer px-3 py-1.5 text-xs font-semibold transition-all ${cat===c.id?'bg-primary text-white':'badge-gray hover:bg-gray-200'}`}>
                {c.nombre}
              </button>
            ))}
          </div>
        )}
        {isLoading ? <LoadingCenter/> : list.length===0 ? <EmptyState title="No hay noticias publicadas"/> : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {list.map(n => (
                <Link key={n.id} to={`/noticias/${n.slug}`} className="card card-lift group">
                  <div className="h-44 overflow-hidden bg-gray-100">
                    {n.imagen_url
                      ? <img src={n.imagen_url} alt={n.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e=>e.target.style.display='none'}/>
                      : <div className="w-full h-full bg-gradient-to-br from-secondary-50 to-primary-50 flex items-center justify-center"><ChevronRight size={20} className="text-secondary"/></div>
                    }
                  </div>
                  <div className="p-4">
                    {n.categoria && <Badge color={n.color_hex||'#1A5276'}>{n.categoria}</Badge>}
                    <h2 className="font-semibold text-gray-800 mt-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug">{n.titulo}</h2>
                    {n.resumen && <p className="text-gray-500 text-sm mt-1.5 line-clamp-2">{n.resumen}</p>}
                    <p className="flex items-center gap-1.5 mt-3 text-xs text-gray-400"><Clock size={12}/>{formatDate(n.publicado_en)}</p>
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
    <div className="section">
      <div className="container-main">
        <div className="flex items-end justify-between mb-8">
          <div><p className="eyebrow">Agenda académica</p><h1 className="section-title">Eventos y actividades</h1></div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {['lista','calendario'].map(v=>(
              <button key={v} onClick={()=>setView(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${view===v?'bg-white shadow-sm text-secondary':'text-gray-500 hover:text-gray-700'}`}>{v}</button>
            ))}
          </div>
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
              <div>
                {proximos.length>0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"/>Próximos eventos</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{proximos.map(e=><EventCard key={e.id} e={e} onClick={()=>setSelected(e)}/>)}</div>
                  </div>
                )}
                {pasados.length>0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-500 mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block"/>Eventos anteriores</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">{pasados.slice(0,6).map(e=><EventCard key={e.id} e={e} onClick={()=>setSelected(e)} past/>)}</div>
                  </div>
                )}
                {eventos.length===0 && <EmptyState title="No hay eventos publicados"/>}
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

function EventCard({ e, onClick, past=false }) {
  const d = new Date(e.fecha_inicio)
  return (
    <div className={`card p-4 cursor-pointer hover:shadow-card-md transition-all ${past?'':'card-lift'}`} onClick={onClick}>
      <div className="flex gap-3 mb-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white" style={{background:e.color||'#C0392B'}}>
          <span className="text-lg font-bold leading-none">{d.getDate()}</span>
          <span className="text-xs opacity-80">{d.toLocaleDateString('es',{month:'short'})}</span>
        </div>
        <div className="min-w-0">
          <Badge color={e.color||'#C0392B'}>{e.tipo}</Badge>
          <p className="font-semibold text-sm text-gray-800 mt-1 line-clamp-2 leading-snug">{e.titulo}</p>
        </div>
      </div>
      <div className="flex flex-col gap-1 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><Clock size={11}/>{formatDateTime(e.fecha_inicio)}</span>
        {e.lugar && <span className="flex items-center gap-1.5"><MapPin size={11}/>{e.lugar}</span>}
        {e.latitud && e.longitud && <span className="text-blue-500">📍 Ver ubicación</span>}
      </div>
    </div>
  )
}

// ============================================================
// DOCENTES
// ============================================================
export function DocentesPage() {
  const { data, isLoading } = useQuery({ queryKey:['docentes-pub'], queryFn:docentesService.getAll })
  const list = data?.data?.data||[]
  return (
    <div className="section">
      <div className="container-main">
        <p className="eyebrow">Cuerpo académico</p><h1 className="section-title">Directorio de docentes</h1>
        <p className="section-sub mb-8">Profesionales con experiencia en medios, investigación y comunicación.</p>
        {isLoading ? <LoadingCenter/> : list.length===0 ? <EmptyState title="Sin docentes registrados"/> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {list.map(d => (
              <div key={d.id} className="card p-5 text-center hover:shadow-card-md transition-shadow">
                <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden bg-secondary-50 flex items-center justify-center">
                  {d.foto_url ? <img src={d.foto_url} alt={d.nombre_completo} className="w-full h-full object-cover" onError={e=>e.target.style.display='none'}/> : <span className="text-2xl font-bold text-secondary">{d.nombre_completo.charAt(0)}</span>}
                </div>
                <p className="font-bold text-sm text-gray-800">{d.nombre_completo}</p>
                {d.titulo_academico && <p className="text-primary text-xs font-semibold mt-0.5">{d.titulo_academico}</p>}
                {d.especialidad && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{d.especialidad}</p>}
                {d.email && <a href={`mailto:${d.email}`} className="text-secondary text-xs hover:underline mt-1.5 block truncate">{d.email}</a>}
                <div className="mt-2"><Badge color={d.tipo==='titular'?'#1A5276':'#C0392B'}>{d.tipo}</Badge></div>
              </div>
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
  const list = data?.data?.data||[]
  return (
    <div className="section">
      <div className="container-main max-w-3xl">
        <p className="eyebrow">Excelencia académica</p><h1 className="section-title">Mejores estudiantes</h1>
        <p className="section-sub mb-8">Reconocimiento semestral a los estudiantes destacados.</p>
        {isLoading ? <LoadingCenter/> : list.length===0 ? <EmptyState title="Sin datos registrados"/> : (
          <div className="space-y-3">
            {list.map((a,i) => (
              <div key={a.id} className="card p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${i===0?'bg-yellow-400':i===1?'bg-gray-400':i===2?'bg-yellow-700':'bg-secondary'}`}>{i+1}</div>
                {a.foto_url && <img src={a.foto_url} alt={a.nombre_completo} className="w-12 h-12 rounded-full object-cover flex-shrink-0" onError={e=>e.target.style.display='none'}/>}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800">{a.nombre_completo}</p>
                  <p className="text-sm text-gray-500">Semestre {a.semestre_actual} · Gestión {a.gestion}</p>
                  {a.logros && <p className="text-xs text-gray-400 mt-0.5">{a.logros}</p>}
                </div>
                <div className="text-right flex-shrink-0"><p className="text-2xl font-bold text-primary">{a.promedio}</p><p className="text-xs text-gray-400">promedio</p></div>
              </div>
            ))}
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
  const list = data?.data?.data||[]
  return (
    <div className="section">
      <div className="container-main">
        <p className="eyebrow">Comunidad</p><h1 className="section-title">Egresados destacados</h1>
        <p className="section-sub mb-8">Comunicadores que hacen historia en los medios y organizaciones de Bolivia.</p>
        {isLoading ? <LoadingCenter/> : list.length===0 ? <EmptyState title="Sin egresados registrados"/> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map(e => (
              <div key={e.id} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary-50 flex-shrink-0 flex items-center justify-center">
                    {e.foto_url ? <img src={e.foto_url} alt={e.nombre_completo} className="w-full h-full object-cover" onError={ev=>ev.target.style.display='none'}/> : <span className="text-xl font-bold text-secondary">{e.nombre_completo.charAt(0)}</span>}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 leading-tight">{e.nombre_completo}</p>
                    {e.anio_egreso && <p className="text-xs text-gray-400">Egresado {e.anio_egreso}</p>}
                  </div>
                </div>
                {e.ocupacion_actual && <p className="text-sm font-semibold text-primary">{e.ocupacion_actual}</p>}
                {e.empresa_institucion && <p className="text-xs text-gray-500">{e.empresa_institucion}</p>}
                {e.testimonio && <p className="text-xs text-gray-500 mt-2 italic border-l-2 border-primary pl-2 line-clamp-3">"{e.testimonio}"</p>}
                {e.linkedin_url && <a href={e.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-secondary text-xs hover:underline mt-2"><ExternalLink size={11}/> LinkedIn</a>}
              </div>
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
    <div className="section">
      <div className="container-main">
        <p className="eyebrow">Producción estudiantil</p><h1 className="section-title">Multimedia</h1>
        <p className="section-sub mb-6">Trabajos producidos por estudiantes de la carrera.</p>
        <div className="flex flex-wrap gap-2 mb-7">
          <button onClick={()=>setTipo('')} className={`badge cursor-pointer px-3 py-1.5 text-xs font-semibold ${!tipo?'bg-primary text-white':'badge-gray hover:bg-gray-200'}`}>Todos</button>
          {tipos.map(t=><button key={t} onClick={()=>setTipo(t)} className={`badge cursor-pointer px-3 py-1.5 text-xs font-semibold capitalize ${tipo===t?'bg-primary text-white':'badge-gray hover:bg-gray-200'}`}>{t}</button>)}
        </div>
        {isLoading ? <LoadingCenter/> : list.length===0 ? <EmptyState title="Sin trabajos publicados"/> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {list.map(m=>{
              const ytId  = m.url_contenido?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/)?.[1]
              const thumb = m.thumbnail_url||(ytId?`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`:null)
              return (
                <a key={m.id} href={m.url_contenido||'#'} target={m.url_contenido?'_blank':undefined} rel="noreferrer" className="group card overflow-hidden hover:shadow-card-md transition-all">
                  <div className="relative h-44 bg-gray-900 overflow-hidden">
                    {thumb ? <img src={thumb} alt={m.titulo} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-500" onError={e=>e.target.style.display='none'}/> : <div className="w-full h-full bg-gradient-to-br from-secondary to-primary opacity-60"/>}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"><Play size={20} className="text-white ml-0.5" fill="white"/></div>
                    </div>
                    <div className="absolute top-2 left-2"><span className="badge bg-primary text-white text-xs capitalize">{m.tipo}</span></div>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm text-gray-800 line-clamp-2 group-hover:text-primary transition-colors leading-snug">{m.titulo}</p>
                    <p className="text-xs text-gray-500 mt-1">Por {m.autor_nombre}</p>
                    {m.materia_origen && <p className="text-xs text-gray-400">{m.materia_origen}</p>}
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

  return (
    <div className="section">
      <div className="container-main">
        <p className="eyebrow">Fotografías</p><h1 className="section-title">Galería fotográfica</h1>
        <p className="section-sub mb-8">Momentos de la vida académica de la carrera.</p>
        {!albumId ? (
          albumes.length===0 ? <EmptyState title="Sin álbumes publicados"/> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {albumes.map(a=>(
                <button key={a.id} onClick={()=>setAlbumId(a.id)} className="group card overflow-hidden text-left hover:shadow-card-md transition-all">
                  <div className="h-48 bg-gray-100 overflow-hidden relative">
                    {a.portada_url ? <img src={a.portada_url} alt={a.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e=>e.target.style.display='none'}/> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">Sin portada</div>}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><span className="bg-white/90 text-secondary text-xs font-bold px-4 py-2 rounded-full">Ver fotos</span></div>
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-gray-800">{a.nombre}</p>
                    {a.descripcion && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{a.descripcion}</p>}
                    <p className="text-xs text-gray-400 mt-1.5">{a.total_imagenes||0} fotografías</p>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={()=>setAlbumId(null)} className="btn btn-ghost btn-sm">← Todos los álbumes</button>
              <div className="w-px h-5 bg-gray-200"/>
              <div><h2 className="font-bold text-gray-800">{albumActual?.nombre}</h2>{albumActual?.descripcion && <p className="text-sm text-gray-500">{albumActual.descripcion}</p>}</div>
            </div>
            {imgsLoading ? <LoadingCenter/> : imagenes.length===0 ? <EmptyState title="Sin imágenes en este álbum"/> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {imagenes.map(img=>(
                  <button key={img.id} onClick={()=>setLightbox(img)} className="group relative rounded-2xl overflow-hidden bg-gray-100 aspect-square">
                    <img src={img.thumbnail_url||img.url} alt={img.titulo||''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e=>e.target.style.display='none'}/>
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"/>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={()=>setLightbox(null)}>
          <div className="max-w-4xl max-h-full" onClick={e=>e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.titulo||''} className="max-w-full max-h-[85vh] object-contain rounded-xl"/>
            {lightbox.titulo && <p className="text-white text-center mt-3 text-sm">{lightbox.titulo}</p>}
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
  const { data } = useQuery({ queryKey:['streaming-pub'], queryFn:streamingService.getAll })
  const canales = data?.data?.data||[]
  return (
    <div className="section">
      <div className="container-main">
        <p className="eyebrow">Canales de comunicación</p><h1 className="section-title">Streaming y producciones</h1>
        {canales.length===0 ? <EmptyState title="Sin canales registrados"/> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {canales.map(c=>{
              const icons={youtube:'▶',tiktok:'♪',facebook:'f',radio:'📻'}
              const colors={youtube:'bg-red-600',tiktok:'bg-gray-900',facebook:'bg-blue-600',radio:'bg-primary'}
              return (
                <a key={c.id} href={c.url_canal} target="_blank" rel="noreferrer" className="card p-5 hover:shadow-card-md transition-shadow group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${colors[c.plataforma]||'bg-secondary'} flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform`}>{icons[c.plataforma]||c.plataforma[0].toUpperCase()}</div>
                    <div><p className="font-semibold text-sm text-gray-800 group-hover:text-primary transition-colors">{c.nombre}</p><p className="text-xs text-gray-400 capitalize">{c.plataforma}</p></div>
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
// WHATSAPP
// ============================================================
export function WhatsappPage() {
  const { data, isLoading } = useQuery({ queryKey:['wa-pub'], queryFn:whatsappService.getAll })
  const grupos = data?.data?.data||[]
  const bySemestre = grupos.reduce((acc,g)=>{ if(!acc[g.semestre]) acc[g.semestre]=[]; acc[g.semestre].push(g); return acc },{})
  return (
    <div className="section">
      <div className="container-main max-w-3xl">
        <p className="eyebrow">Comunicación estudiantil</p><h1 className="section-title">Grupos de WhatsApp</h1>
        <p className="section-sub mb-8">Accede al grupo de WhatsApp de tu materia.</p>
        {isLoading ? <LoadingCenter/> : Object.keys(bySemestre).length===0 ? <EmptyState title="Sin grupos registrados"/> : (
          Object.entries(bySemestre).sort(([a],[b])=>+a-+b).map(([sem,gs])=>(
            <div key={sem} className="mb-6">
              <h2 className="text-sm font-bold text-secondary mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-xs">{sem}</span>
                Semestre {sem}
              </h2>
              <div className="space-y-2">
                {gs.map(g=>(
                  <a key={g.id} href={g.enlace_wa} target="_blank" rel="noreferrer"
                    className="flex items-center justify-between card p-3.5 hover:border-green-400 hover:shadow-sm transition-all group">
                    <div><p className="font-semibold text-sm text-gray-800 group-hover:text-green-700">{g.materia_nombre}</p><p className="text-xs text-gray-400">Gestión {g.gestion}</p></div>
                    <span className="bg-green-500 hover:bg-green-600 text-white text-xs px-3.5 py-1.5 rounded-full font-semibold transition-colors flex-shrink-0">Unirse</span>
                  </a>
                ))}
              </div>
            </div>
          ))
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
  const bySem = {}; for(let i=1;i<=10;i++) bySem[i]=materias.filter(m=>m.semestre===i)
  return (
    <div className="section">
      <div className="container-main">
        <p className="eyebrow">Plan de estudios</p><h1 className="section-title">Malla curricular — Pensum 2023</h1>
        <p className="section-sub mb-8">Plan de formación de la Carrera de Comunicación Social UMSA.</p>
        {isLoading ? <LoadingCenter/> : (
          <div className="overflow-x-auto pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 min-w-[640px]">
              {Object.entries(bySem).map(([sem,ms])=>(
                <div key={sem}>
                  <div className="bg-secondary text-white text-center text-xs font-bold py-2.5 rounded-t-xl">Semestre {sem}</div>
                  <div className="space-y-1.5">
                    {ms.length===0 ? <div className="card p-3 text-center text-xs text-gray-300">—</div>
                      : ms.map(m=>(
                        <button key={m.id} onClick={()=>setSelected(m)} className="w-full card p-2.5 text-left hover:border-primary hover:shadow-sm transition-all border-l-2 border-gray-200">
                          <p className="text-xs font-semibold text-gray-700 line-clamp-2 leading-snug">{m.nombre}</p>
                          {m.creditos && <p className="text-xs text-gray-400 mt-0.5">{m.creditos} créditos</p>}
                        </button>
                      ))
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {selected && (
        <Modal open={!!selected} onClose={()=>setSelected(null)} title={selected.nombre} size="sm">
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-gray-400">Semestre</p><p className="font-semibold">{selected.semestre}</p></div>
              <div><p className="text-xs text-gray-400">Créditos</p><p className="font-semibold">{selected.creditos||'—'}</p></div>
              <div><p className="text-xs text-gray-400">Área</p><p className="font-semibold">{selected.area||'—'}</p></div>
              <div><p className="text-xs text-gray-400">Tipo</p><p className="font-semibold capitalize">{selected.tipo}</p></div>
            </div>
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
    <div className="section">
      <div className="container-main max-w-3xl">
        <p className="eyebrow">Gestión académica</p><h1 className="section-title">Trámites académicos</h1>
        <p className="section-sub mb-8">Guías para realizar gestiones en la carrera.</p>
        {isLoading ? <LoadingCenter/> : list.length===0 ? <EmptyState title="Sin trámites registrados"/> : (
          <div className="space-y-3">
            {list.map(t=>(
              <button key={t.id} onClick={()=>setSelected(t)} className="w-full card p-4 text-left hover:border-primary hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-primary transition-colors">{t.nombre}</p>
                    {t.descripcion && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{t.descripcion}</p>}
                    {t.contacto && <p className="text-xs text-secondary mt-1">Contacto: {t.contacto}</p>}
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-primary transition-colors flex-shrink-0 mt-0.5"/>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {selected && (
        <Modal open={!!selected} onClose={()=>setSelected(null)} title={selected.nombre} size="md">
          {selected.descripcion && <p className="text-gray-600 text-sm mb-4">{selected.descripcion}</p>}
          {selected.contacto && <p className="text-sm text-secondary mb-4">Contacto: {selected.contacto}</p>}
          {selected.archivo_url && (
            <a href={selected.archivo_url} target="_blank" rel="noreferrer" download className="btn btn-primary btn-sm">
              <Download size={14}/> Descargar formulario
            </a>
          )}
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
    <div className="section">
      <div className="container-main max-w-4xl">
        <p className="eyebrow">Rendición de cuentas</p>
        <h1 className="section-title">Transparencia institucional</h1>
        <p className="section-sub mb-8">Documentos normativos, resoluciones e informes de la carrera.</p>

        {isLoading ? <LoadingCenter/> : list.length===0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📂</p>
            <p className="font-semibold text-gray-700 text-base">Sin documentos publicados aún</p>
            <p className="text-sm text-gray-400 mt-1">Los documentos de transparencia se publican periódicamente.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {list.map(doc=>(
              <div key={doc.id} className="card p-4 hover:shadow-card-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{background:`${tipoColor[doc.tipo]||'#7F8C8D'}15`}}>
                    {tipoIcon[doc.tipo]||'📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-gray-800 leading-snug">{doc.titulo}</p>
                      <Badge color={tipoColor[doc.tipo]||'#7F8C8D'}>{doc.tipo}</Badge>
                    </div>
                    {doc.descripcion && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{doc.descripcion}</p>}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(doc.publicado_en)}</p>
                    {doc.archivo_url && (
                      <a href={doc.archivo_url} target="_blank" rel="noreferrer" download
                        className="inline-flex items-center gap-1 text-xs text-secondary hover:underline mt-2 font-medium">
                        <Download size={11}/> Descargar documento
                      </a>
                    )}
                  </div>
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
// CONVOCATORIAS
// ============================================================
export function ConvocatoriasPage() {
  const { data, isLoading } = useQuery({ queryKey:['conv-pub'], queryFn:convocatoriasService.getAll })
  const list = data?.data?.data||[]
  return (
    <div className="section">
      <div className="container-main max-w-3xl">
        <p className="eyebrow">Oportunidades</p><h1 className="section-title">Convocatorias</h1>
        <p className="section-sub mb-8">Pasantías, docentes, investigación y becas disponibles.</p>
        {isLoading ? <LoadingCenter/> : list.length===0 ? <EmptyState title="Sin convocatorias activas"/> : (
          <div className="space-y-4">
            {list.map(c=>(
              <div key={c.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Badge color="#C0392B">{c.tipo}</Badge>
                    <h2 className="font-bold text-gray-800 mt-1.5 text-base">{c.titulo}</h2>
                    {c.fecha_limite && <p className="text-xs text-primary font-semibold mt-0.5 flex items-center gap-1"><Clock size={11}/> Hasta el {formatDate(c.fecha_limite)}</p>}
                    <p className="text-gray-600 text-sm mt-2 leading-relaxed">{truncate(c.descripcion,250)}</p>
                  </div>
                  {c.archivo_url && (
                    <a href={c.archivo_url} target="_blank" rel="noreferrer" download className="btn btn-outline btn-sm flex-shrink-0"><Download size={13}/> Descargar</a>
                  )}
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
    <div className="section">
      <div className="container-main">
        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl">
          <div>
            <p className="eyebrow">Comunícate con nosotros</p>
            <h1 className="section-title">Contacto</h1>
            <div className="space-y-4 text-sm text-gray-600 mt-6">
              {[
                {icon:<MapPin size={15} className="text-primary flex-shrink-0 mt-0.5"/>, label:'Dirección', val:'Edificio René Zavaleta, Piso 5\nCalle Federizo Suazo, La Paz, Bolivia'},
                {icon:<Phone size={15} className="text-primary flex-shrink-0"/>, label:'Teléfonos', val:'(591-2) 2911880 · (591-2) 2911890'},
                {icon:<Mail size={15} className="text-primary flex-shrink-0"/>, label:'Correo', val:'comunicasocialumsa@gmail.com'},
                {icon:<Globe size={15} className="text-primary flex-shrink-0"/>, label:'Web', val:'comunicacion.umsa.bo'},
              ].map(({icon,label,val})=>(
                <div key={label} className="flex gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">{icon}</div>
                  <div><p className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-0.5">{label}</p><p className="whitespace-pre-line">{val}</p></div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl overflow-hidden border border-gray-100">
              <iframe title="Ubicación CCS UMSA" src="https://maps.google.com/maps?q=-16.505857,-68.127117&z=16&output=embed" className="w-full h-44" loading="lazy"/>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-5">Envíanos un mensaje</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Nombre completo *</label>
                <input className="input" {...register('nombre',{required:'Requerido'})}/>
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
              </div>
              <div>
                <label className="label">Correo electrónico *</label>
                <input className="input" type="email" {...register('email',{required:'Requerido'})}/>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="label">Asunto</label>
                <input className="input" {...register('asunto')}/>
              </div>
              <div>
                <label className="label">Mensaje *</label>
                <textarea className="input h-32 resize-none" {...register('mensaje',{required:'Requerido'})}/>
                {errors.mensaje && <p className="text-red-500 text-xs mt-1">{errors.mensaje.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full py-3">
                {isSubmitting
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Enviando...</span>
                  : <><Send size={16}/> Enviar mensaje</>
                }
              </button>
            </form>
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
  return (
    <div className="section">
      <div className="container-main max-w-2xl text-center">
        <p className="eyebrow">Recursos académicos</p><h1 className="section-title">Biblioteca digital</h1>
        <p className="section-sub max-w-md mx-auto mb-8">Accede a libros, revistas y recursos de investigación de la UMSA.</p>
        <a href="https://bibliotecas.umsa.bo" target="_blank" rel="noreferrer" className="btn btn-primary btn-lg">
          Ir a la biblioteca virtual de la UMSA <ExternalLink size={17}/>
        </a>
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
    { icon:'🤝', title:'Interacción Social', desc:'Proyectos de extensión universitaria. Vinculación de la carrera con comunidades y organizaciones sociales.', color:'bg-green-600', link:'https://ipicom.umsa.bo' },
    { icon:'📚', title:'Publicaciones', desc:'Revista académica indexada, libros y compilaciones de investigaciones en comunicación y ciencias sociales.', color:'bg-indigo-600', link:'https://ipicom.umsa.bo/publicaciones' },
    { icon:'🏛️', title:'Biblioteca especializada', desc:'Colección de textos especializados en comunicación, periodismo, semiótica y ciencias sociales.', color:'bg-amber-600', link:'https://bibliotecas.umsa.bo' },
    { icon:'🌐', title:'Cooperación internacional', desc:'Convenios con universidades y centros de investigación de América Latina y Europa.', color:'bg-teal-600', link:'https://ipicom.umsa.bo' },
  ]
  return (
    <div>
      {/* Hero */}
      <div className="bg-secondary py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-10"/>
        <div className="container-main relative text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-3">Carrera de Comunicación Social · UMSA</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">Instituto de Investigación,<br/>Posgrado e Interacción Social</h1>
          <p className="text-blue-100/80 text-lg max-w-2xl mx-auto mb-8">IpICOM es la unidad académica encargada de la investigación científica, formación de posgrado y extensión social de la carrera.</p>
          <a href="https://ipicom.umsa.bo" target="_blank" rel="noreferrer" className="btn btn-white btn-lg">
            Visitar ipicom.umsa.bo <ExternalLink size={16}/>
          </a>
        </div>
      </div>

      {/* Áreas */}
      <div className="section">
        <div className="container-main">
          <div className="text-center mb-10">
            <p className="eyebrow">Nuestras áreas</p>
            <h2 className="section-title">¿Qué hace IpICOM?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {areas.map(({icon,title,desc,color,link})=>(
              <a key={title} href={link} target="_blank" rel="noreferrer" className="card p-6 group hover:shadow-card-md transition-shadow">
                <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>{icon}</div>
                <h3 className="font-bold text-gray-900 text-base mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                <p className="text-xs text-secondary mt-3 group-hover:underline flex items-center gap-1">Ver más <ArrowRight size={11}/></p>
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
  return (
    <div className="section">
      <div className="container-main max-w-4xl">
        <p className="eyebrow">Institución</p><h1 className="section-title">Quiénes somos</h1>
        {queries.map((q,i) => {
          const item = q.data?.data?.data
          return item ? (
            <section key={claves[i]} className="mb-10">
              {item.imagen_url && <img src={item.imagen_url} alt={item.titulo} className="w-full max-h-64 object-cover rounded-2xl mb-5" onError={e=>e.target.style.display='none'}/>}
              <h2 className="text-xl font-bold text-secondary mb-3 border-l-4 border-primary pl-4">{item.titulo}</h2>
              <p className="text-gray-700 leading-relaxed text-base">{item.contenido}</p>
            </section>
          ) : null
        })}
      </div>
    </div>
  )
}
