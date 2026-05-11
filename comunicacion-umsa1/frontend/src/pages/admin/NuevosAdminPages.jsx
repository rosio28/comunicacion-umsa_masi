// NuevosAdminPages.jsx
// Módulos nuevos: Sesiones de eventos, Convenios, Malla histórica
// Agregar estos exports a AdminPages.jsx o importarlos en App.jsx

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { LoadingCenter, EmptyState, Modal, ConfirmDialog, SectionHeader, Badge } from '../../components/ui/UI'
import { formatDate, formatDateTime } from '../../utils/helpers'
import api from '../../services/api'
import { Plus, Pencil, Trash2, Upload, ExternalLink, Calendar, Clock, Video, FileText, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react'

// ─── ImageField simple ────────────────────────────────────
function ImageField({ label, currentUrl, onFile, onUrl }) {
  const [preview, setPreview] = useState(currentUrl || '')
  const ref = useRef(null)
  useEffect(() => setPreview(currentUrl || ''), [currentUrl])
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2 mb-2">
        <input className="input flex-1" type="url" placeholder="https://..." value={preview}
          onChange={e => { setPreview(e.target.value); onUrl?.(e.target.value) }} />
        <button type="button" onClick={() => ref.current?.click()} className="btn btn-ghost btn-sm border border-dashed border-gray-300 flex-shrink-0">
          <Upload size={13} /> Subir
        </button>
        <input type="file" ref={ref} accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (!f) return; setPreview(URL.createObjectURL(f)); onFile?.(f) }} />
      </div>
      {preview && <img src={preview} alt="" className="h-16 w-auto rounded-lg border object-cover" onError={e => e.target.style.display = 'none'} />}
    </div>
  )
}

// ============================================================
// SESIONES DE EVENTOS
// Acceso: /admin/eventos/:eventoId/sesiones
// ============================================================
export function AdminEventoSesionesPage() {
  const { eventoId } = useParams()
  const qc = useQueryClient()
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  // Datos del evento padre
  const { data: evData } = useQuery({
    queryKey: ['evento-padre', eventoId],
    queryFn: () => api.get('/eventos').then(r => r.data?.data?.find(e => String(e.id) === eventoId))
  })
  const evento = evData

  // Sesiones del evento
  const { data, isLoading } = useQuery({
    queryKey: ['sesiones', eventoId],
    queryFn: () => api.get(`/eventos/${eventoId}/sesiones?all=1`).then(r => r.data)
  })
  const sesiones = data?.data || []

  const openEdit = (s) => {
    setEditing(s)
    reset({
      titulo: s.titulo || '',
      numero_sesion: s.numero_sesion || '',
      fecha: s.fecha?.slice(0, 16) || '',
      descripcion: s.descripcion || '',
      contenido_visto: s.contenido_visto || '',
      material_url: s.material_url || '',
      grabacion_url: s.grabacion_url || '',
      enlace_virtual: s.enlace_virtual || '',
      publicado: s.publicado,
    })
    setModal(true)
  }
  const openNew = () => {
    setEditing(null)
    reset({ titulo: '', numero_sesion: '', fecha: '', descripcion: '', contenido_visto: '', material_url: '', grabacion_url: '', enlace_virtual: '', publicado: true })
    setModal(true)
  }

  const save = useMutation({
    mutationFn: d => editing
      ? api.put(`/eventos/${eventoId}/sesiones/${editing.id}`, d)
      : api.post(`/eventos/${eventoId}/sesiones`, d),
    onSuccess: () => { qc.invalidateQueries(['sesiones', eventoId]); toast.success('Sesión guardada'); setModal(false) },
    onError: e => toast.error(e.response?.data?.message || 'Error')
  })
  const del = useMutation({
    mutationFn: id => api.delete(`/eventos/${eventoId}/sesiones/${id}`),
    onSuccess: () => { qc.invalidateQueries(['sesiones', eventoId]); toast.success('Sesión eliminada') }
  })

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link to="/admin/eventos" className="text-gray-400 text-sm hover:text-secondary">← Eventos</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600 font-medium">{evento?.titulo || `Evento #${eventoId}`}</span>
      </div>

      <SectionHeader
        title="Sesiones del evento"
        subtitle={`${sesiones.length} sesiones registradas — Los estudiantes pueden consultar el contenido de cada sesión`}>
        <button onClick={openNew} className="btn btn-primary btn-sm"><Plus size={15} /> Nueva sesión</button>
      </SectionHeader>

      {/* Explicación del módulo */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 text-sm text-secondary">
        <p className="font-semibold mb-1">¿Para qué sirven las sesiones?</p>
        <p className="text-blue-700">Permiten registrar el historial de cada clase/sesión de un evento largo (taller, seminario de múltiples fechas). Los estudiantes pueden ver qué se cubrió en cada sesión, descargar materiales y acceder a grabaciones, sin interferir con los eventos del calendario principal.</p>
      </div>

      {isLoading ? <LoadingCenter /> : sesiones.length === 0 ? (
        <EmptyState title="Sin sesiones registradas" subtitle="Agrega la primera sesión de este evento" />
      ) : (
        <div className="space-y-3">
          {sesiones.map(s => (
            <div key={s.id} className="card p-4">
              <div className="flex items-start gap-3">
                {/* Número de sesión */}
                <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {s.numero_sesion}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-800">{s.titulo}</p>
                    <span className={`badge text-xs ${s.publicado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {s.publicado ? 'Publicada' : 'Borrador'}
                    </span>
                  </div>
                  {s.fecha && <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11} />{formatDateTime(s.fecha)}</p>}
                  {s.descripcion && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{s.descripcion}</p>}
                  {s.contenido_visto && (
                    <div className="mt-2 bg-gray-50 rounded-lg p-2">
                      <p className="text-xs font-semibold text-gray-600 mb-0.5">Contenido visto:</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{s.contenido_visto}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2">
                    {s.material_url && (
                      <a href={s.material_url} target="_blank" rel="noreferrer"
                        className="text-xs text-secondary hover:underline flex items-center gap-1">
                        <FileText size={11} /> Descargar material
                      </a>
                    )}
                    {s.grabacion_url && (
                      <a href={s.grabacion_url} target="_blank" rel="noreferrer"
                        className="text-xs text-red-600 hover:underline flex items-center gap-1">
                        <Video size={11} /> Ver grabación
                      </a>
                    )}
                    {s.enlace_virtual && (
                      <a href={s.enlace_virtual} target="_blank" rel="noreferrer"
                        className="text-xs text-green-600 hover:underline flex items-center gap-1">
                        <ExternalLink size={11} /> Enlace sesión
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(s)} className="btn btn-ghost btn-sm p-1.5"><Pencil size={14} /></button>
                  <button onClick={() => setConfirmId(s.id)} className="btn btn-ghost btn-sm p-1.5 text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)}
        onConfirm={() => { del.mutate(confirmId); setConfirmId(null) }}
        title="Eliminar sesión" message="¿Eliminar esta sesión y su contenido?" />

      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? `Editar sesión ${editing.numero_sesion}` : 'Nueva sesión'} size="lg">
        <form onSubmit={handleSubmit(d => save.mutate(d))} className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Título de la sesión *</label>
            <input className="input" {...register('titulo', { required: true })} />
          </div>
          <div>
            <label className="label">N° de sesión</label>
            <input className="input" type="number" min="1" placeholder="Se calcula automáticamente" {...register('numero_sesion')} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Fecha y hora de la sesión</label>
            <input className="input" type="datetime-local" {...register('fecha')} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Descripción breve</label>
            <textarea className="input h-20 resize-none" {...register('descripcion')} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Contenido visto / Temario cubierto</label>
            <textarea className="input h-32 resize-y" placeholder="Describe los temas tratados en esta sesión..." {...register('contenido_visto')} />
          </div>
          <div>
            <label className="label">Link del material (PDF/Drive)</label>
            <input className="input" type="url" placeholder="https://drive.google.com/..." {...register('material_url')} />
          </div>
          <div>
            <label className="label">Grabación (YouTube/Drive)</label>
            <input className="input" type="url" placeholder="https://youtube.com/..." {...register('grabacion_url')} />
          </div>
          <div>
            <label className="label">Enlace sesión virtual (Zoom/Meet)</label>
            <input className="input" type="url" placeholder="https://zoom.us/..." {...register('enlace_virtual')} />
          </div>
          <div className="flex items-center gap-2 self-end">
            <input type="checkbox" id="pub_ses" {...register('publicado')} />
            <label htmlFor="pub_ses" className="text-sm">Publicar para estudiantes</label>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
              {isSubmitting ? 'Guardando...' : 'Guardar sesión'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ============================================================
// CONVENIOS INSTITUCIONALES
// ============================================================
function ConvenioEstado({ convenio }) {
  if (convenio.estado === 'vencido') return <span className="badge bg-red-100 text-red-700 text-xs font-semibold">● Vencido</span>
  if (convenio.estado === 'por_vencer') return <span className="badge bg-amber-100 text-amber-700 text-xs font-semibold">⚠ Vence en {convenio.dias_restantes} días</span>
  if (convenio.estado === 'vigente') return <span className="badge bg-green-100 text-green-700 text-xs font-semibold">● Vigente · {convenio.dias_restantes}d</span>
  return <span className="badge bg-gray-100 text-gray-500 text-xs">Sin fecha límite</span>
}

export function AdminConveniosPage() {
  const qc = useQueryClient()
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [filtro, setFiltro]     = useState('todos')
  const [logoFile, setLogoFile] = useState(null)
  const [logoUrl, setLogoUrl]   = useState('')
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['convenios-admin'],
    queryFn: () => api.get('/convenios?all=1').then(r => r.data)
  })
  const all  = data?.data || []
  const list = filtro === 'vigentes'   ? all.filter(c => c.estado === 'vigente')
             : filtro === 'por_vencer' ? all.filter(c => c.estado === 'por_vencer')
             : filtro === 'vencidos'   ? all.filter(c => c.estado === 'vencido')
             : all

  const openEdit = (c) => {
    setEditing(c); setLogoFile(null); setLogoUrl(c.logo_url || '')
    reset({
      nombre_institucion: c.nombre_institucion || '',
      tipo_institucion: c.tipo_institucion || 'empresa',
      tipo_convenio: c.tipo_convenio || 'pasantia',
      descripcion: c.descripcion || '',
      cupos_disponibles: c.cupos_disponibles || '',
      duracion_meses: c.duracion_meses || '',
      requisitos: c.requisitos || '',
      fecha_inicio: c.fecha_inicio || '',
      fecha_vencimiento: c.fecha_vencimiento || '',
      contacto_nombre: c.contacto_nombre || '',
      contacto_email: c.contacto_email || '',
      contacto_telefono: c.contacto_telefono || '',
      activo: c.activo,
      publicado: c.publicado,
    })
    setModal(true)
  }
  const openNew = () => {
    setEditing(null); setLogoFile(null); setLogoUrl('')
    reset({ nombre_institucion: '', tipo_institucion: 'empresa', tipo_convenio: 'pasantia', descripcion: '', cupos_disponibles: '', duracion_meses: '', requisitos: '', fecha_inicio: '', fecha_vencimiento: '', contacto_nombre: '', contacto_email: '', contacto_telefono: '', activo: true, publicado: true })
    setModal(true)
  }

  const save = useMutation({
    mutationFn: async (d) => {
      const fd = new FormData()
      Object.entries(d).forEach(([k, v]) => { if (v !== undefined && String(v) !== '') fd.append(k, String(v)) })
      if (logoFile instanceof File) fd.append('logo', logoFile)
      else if (logoUrl) fd.append('logo_url', logoUrl)
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } }
      return editing ? api.put(`/convenios/${editing.id}`, fd, cfg) : api.post('/convenios', fd, cfg)
    },
    onSuccess: () => { qc.invalidateQueries(['convenios-admin']); toast.success('Guardado'); setModal(false) },
    onError: e => toast.error(e.response?.data?.message || 'Error')
  })
  const del = useMutation({
    mutationFn: id => api.delete(`/convenios/${id}`),
    onSuccess: () => { qc.invalidateQueries(['convenios-admin']); toast.success('Desactivado') }
  })

  const tiposInst = [['empresa','Empresa privada'],['gobierno','Institución pública'],['ong','ONG / Fundación'],['academia','Universidad / Academia'],['medio','Medio de comunicación']]
  const tiposConv = [['pasantia','Pasantía'],['practica','Práctica profesional'],['investigacion','Investigación'],['academico','Convenio académico']]

  return (
    <div>
      <SectionHeader title="Convenios institucionales" subtitle={`${all.length} convenios registrados`}>
        <button onClick={openNew} className="btn btn-primary btn-sm"><Plus size={15} /> Nuevo convenio</button>
      </SectionHeader>

      {/* Resumen de alertas */}
      {all.some(c => c.estado === 'por_vencer') && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-amber-700">
          <AlertTriangle size={16} />
          <span><strong>{all.filter(c => c.estado === 'por_vencer').length} convenio(s)</strong> vencen en menos de 30 días. Considera renovarlos.</span>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-1.5 mb-4 flex-wrap items-center">
        {[['todos','Todos'],['vigentes','Vigentes'],['por_vencer','Por vencer'],['vencidos','Vencidos']].map(([v,l]) => (
          <button key={v} onClick={() => setFiltro(v)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${filtro===v?'bg-secondary text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {l}
          </button>
        ))}
        <span className="text-xs text-gray-400 ml-auto">{list.length} resultados</span>
      </div>

      {isLoading ? <LoadingCenter /> : list.length === 0 ? (
        <EmptyState title="Sin convenios" subtitle="Registra los convenios activos de pasantías" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {list.map(c => (
            <div key={c.id} className={`card p-4 ${c.estado === 'vencido' ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                {c.logo_url
                  ? <img src={c.logo_url} alt={c.nombre_institucion} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border" onError={e => e.target.style.display = 'none'} />
                  : <div className="w-12 h-12 rounded-xl bg-secondary-50 flex items-center justify-center text-secondary font-bold text-lg flex-shrink-0">
                      {c.nombre_institucion.charAt(0)}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-800">{c.nombre_institucion}</p>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(c)} className="btn btn-ghost btn-sm p-1"><Pencil size={13} /></button>
                      <button onClick={() => setConfirmId(c.id)} className="btn btn-ghost btn-sm p-1 text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                    <Badge color="#1A5276">{c.tipo_convenio}</Badge>
                    <ConvenioEstado convenio={c} />
                  </div>
                  {c.descripcion && <p className="text-xs text-gray-500 line-clamp-2">{c.descripcion}</p>}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2 text-xs text-gray-400">
                    {c.cupos_disponibles && <span>{c.cupos_disponibles} cupos disponibles</span>}
                    {c.duracion_meses && <span>Duración: {c.duracion_meses} mes(es)</span>}
                    {c.fecha_inicio && <span>Desde: {formatDate(c.fecha_inicio)}</span>}
                    {c.fecha_vencimiento && <span>Hasta: {formatDate(c.fecha_vencimiento)}</span>}
                    {c.contacto_email && <span className="col-span-2 truncate">{c.contacto_email}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)}
        onConfirm={() => { del.mutate(confirmId); setConfirmId(null) }}
        title="Desactivar convenio" message="¿Desactivar este convenio?" />

      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Editar convenio' : 'Nuevo convenio'} size="lg">
        <form onSubmit={handleSubmit(d => save.mutate(d))} className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Nombre de la institución *</label>
            <input className="input" {...register('nombre_institucion', { required: true })} />
          </div>
          <div>
            <label className="label">Tipo de institución</label>
            <select className="input" {...register('tipo_institucion')}>
              {tiposInst.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tipo de convenio</label>
            <select className="input" {...register('tipo_convenio')}>
              {tiposConv.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Descripción de la pasantía / convenio</label>
            <textarea className="input h-24 resize-none" {...register('descripcion')} />
          </div>
          <div>
            <label className="label">Cupos disponibles</label>
            <input className="input" type="number" min="0" {...register('cupos_disponibles')} />
          </div>
          <div>
            <label className="label">Duración en meses</label>
            <input className="input" type="number" min="1" max="24" {...register('duracion_meses')} />
          </div>
          <div>
            <label className="label">Fecha de inicio del convenio</label>
            <input className="input" type="date" {...register('fecha_inicio')} />
          </div>
          <div>
            <label className="label">Fecha de vencimiento</label>
            <input className="input" type="date" {...register('fecha_vencimiento')} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Requisitos para postular</label>
            <textarea className="input h-20 resize-none" placeholder="Semestre mínimo, promedio, etc." {...register('requisitos')} />
          </div>
          <div>
            <label className="label">Nombre del contacto</label>
            <input className="input" {...register('contacto_nombre')} />
          </div>
          <div>
            <label className="label">Correo de contacto</label>
            <input className="input" type="email" {...register('contacto_email')} />
          </div>
          <div>
            <label className="label">Teléfono de contacto</label>
            <input className="input" {...register('contacto_telefono')} />
          </div>
          <div>
            <ImageField label="Logo de la institución" currentUrl={logoUrl}
              onFile={f => { setLogoFile(f); setLogoUrl('') }}
              onUrl={u => { setLogoUrl(u); setLogoFile(null) }} />
          </div>
          <div className="sm:col-span-2 flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('activo')} /> Convenio activo
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('publicado')} /> Publicar en la web
            </label>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
              {isSubmitting ? 'Guardando...' : 'Guardar convenio'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ============================================================
// MALLA CURRICULAR ACTUALIZADA — con pensum 2023 y 2001
// (reemplaza el AdminMallaPage existente)
// ============================================================
export function AdminMallaPageActualizada() {
  const qc = useQueryClient()
  const [pensum, setPensum]     = useState('2023')
  const [editing, setEditing]   = useState(null)
  const [newModal, setNewModal] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const { data, isLoading } = useQuery({
    queryKey: ['mat-admin', pensum],
    queryFn: () => api.get(`/materias?pensum=${pensum}`).then(r => r.data)
  })
  const materias = data?.data || []
  const bySem = {}
  for (let i = 1; i <= 10; i++) bySem[i] = materias.filter(m => m.semestre === i)

  const { register: rE, handleSubmit: hE, reset: resetE } = useForm()
  const { register: rN, handleSubmit: hN, reset: resetN } = useForm()

  useEffect(() => {
    if (editing) resetE({ nombre: editing.nombre, creditos: editing.creditos || '', area: editing.area || '', tipo: editing.tipo || 'obligatoria' })
  }, [editing, resetE])

  const editMut = useMutation({ mutationFn: ({ id, ...d }) => api.put(`/materias/${id}`, d), onSuccess: () => { qc.invalidateQueries(['mat-admin', pensum]); toast.success('Actualizada'); setEditing(null) } })
  const newMut  = useMutation({ mutationFn: d => api.post('/materias', d), onSuccess: () => { qc.invalidateQueries(['mat-admin', pensum]); toast.success('Materia creada'); setNewModal(false); resetN() } })
  const delMut  = useMutation({ mutationFn: id => api.delete(`/materias/${id}`), onSuccess: () => { qc.invalidateQueries(['mat-admin', pensum]); toast.success('Desactivada') } })

  return (
    <div>
      <SectionHeader title="Malla curricular" subtitle="Gestiona los planes de estudios disponibles">
        <button onClick={() => setNewModal(true)} className="btn btn-primary btn-sm"><Plus size={15} /> Nueva materia</button>
      </SectionHeader>

      {/* Selector de pensum */}
      <div className="flex items-center gap-3 mb-5">
        <p className="text-sm font-semibold text-gray-600">Plan de estudios:</p>
        <div className="flex gap-2">
          <button onClick={() => setPensum('2023')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${pensum === '2023' ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Pensum 2023 <span className="ml-1 text-xs font-normal">(vigente)</span>
          </button>
          <button onClick={() => setPensum('2001')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${pensum === '2001' ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Pensum 2001 <span className="ml-1 text-xs font-normal">(histórico)</span>
          </button>
        </div>
        <span className="text-xs text-gray-400">{materias.length} materias</span>
        {pensum === '2001' && (
          <span className="badge bg-amber-100 text-amber-700 text-xs">Plan histórico — para estudiantes del plan 2001</span>
        )}
      </div>

      {isLoading ? <LoadingCenter /> : (
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 min-w-[640px]">
            {Object.entries(bySem).map(([sem, ms]) => (
              <div key={sem}>
                <div className={`text-white text-center text-xs font-bold py-2.5 rounded-t-xl ${pensum === '2001' ? 'bg-gray-600' : 'bg-secondary'}`}>
                  Semestre {sem}
                </div>
                <div className="space-y-1.5">
                  {ms.length === 0
                    ? <div className="card p-3 text-center text-xs text-gray-300">—</div>
                    : ms.map(m => (
                      <div key={m.id} className="card p-2.5 group hover:border-primary transition-colors cursor-pointer" onClick={() => setEditing(m)}>
                        <p className="text-xs font-semibold text-gray-700 line-clamp-2 leading-snug">{m.nombre}</p>
                        {m.creditos && <p className="text-xs text-gray-400 mt-0.5">{m.creditos} cred.</p>}
                        {m.area && <p className="text-xs text-gray-300">{m.area}</p>}
                        <div className="flex gap-1.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-secondary text-xs cursor-pointer">Editar</span>
                          <button onClick={e => { e.stopPropagation(); setConfirmId(m.id) }} className="text-red-400 text-xs ml-auto">Quitar</button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)}
        onConfirm={() => { delMut.mutate(confirmId); setConfirmId(null) }}
        title="Desactivar materia" message="¿Quitar esta materia de la malla?" />

      {editing && (
        <Modal open={!!editing} onClose={() => setEditing(null)} title={`Editar: ${editing.nombre}`}>
          <form onSubmit={hE(d => editMut.mutate({ id: editing.id, ...d }))} className="space-y-3">
            <div><label className="label">Nombre</label><input className="input" {...rE('nombre')} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Créditos</label><input className="input" type="number" {...rE('creditos')} /></div>
              <div><label className="label">Tipo</label>
                <select className="input" {...rE('tipo')}>
                  <option value="obligatoria">Obligatoria</option>
                  <option value="electiva">Electiva</option>
                  <option value="taller">Taller</option>
                </select>
              </div>
            </div>
            <div><label className="label">Área temática</label><input className="input" {...rE('area')} /></div>
            <button type="submit" className="btn btn-primary w-full">Guardar cambios</button>
          </form>
        </Modal>
      )}

      <Modal open={newModal} onClose={() => setNewModal(false)} title="Nueva materia">
        <form onSubmit={hN(d => newMut.mutate({ ...d, pensum }))} className="space-y-3">
          <div><label className="label">Nombre *</label><input className="input" {...rN('nombre', { required: true })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Semestre (1-10) *</label><input className="input" type="number" min="1" max="10" {...rN('semestre', { required: true })} /></div>
            <div><label className="label">Créditos</label><input className="input" type="number" {...rN('creditos')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Área</label><input className="input" {...rN('area')} /></div>
            <div><label className="label">Tipo</label>
              <select className="input" {...rN('tipo')}>
                <option value="obligatoria">Obligatoria</option>
                <option value="electiva">Electiva</option>
                <option value="taller">Taller</option>
              </select>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-xs text-secondary">
            Esta materia se agregará al <strong>Pensum {pensum}</strong>
          </div>
          <button type="submit" className="btn btn-primary w-full">Crear materia</button>
        </form>
      </Modal>
    </div>
  )
}

// ============================================================
// VISTA PÚBLICA: Sesiones de un evento
// Agregar esta página en PublicPages.jsx o como ruta separada
// Ruta sugerida: /eventos/:eventoId/sesiones
// ============================================================
export function EventoSesionesPublicPage() {
  const { eventoId } = useParams()
  const { data: evResp } = useQuery({
    queryKey: ['evento-pub', eventoId],
    queryFn: () => api.get('/eventos').then(r => r.data?.data?.find(e => String(e.id) === eventoId))
  })
  const evento = evResp

  const { data, isLoading } = useQuery({
    queryKey: ['sesiones-pub', eventoId],
    queryFn: () => api.get(`/eventos/${eventoId}/sesiones`).then(r => r.data)
  })
  const sesiones = data?.data || []

  return (
    <div className="section">
      <div className="container-main max-w-3xl">
        <div className="mb-2">
          <Link to="/eventos" className="text-sm text-gray-400 hover:text-secondary">← Volver a eventos</Link>
        </div>
        <p className="eyebrow">Material del evento</p>
        <h1 className="section-title">{evento?.titulo || 'Sesiones'}</h1>
        {evento?.descripcion && <p className="section-sub mb-8">{evento.descripcion}</p>}

        {isLoading ? <LoadingCenter /> : sesiones.length === 0 ? (
          <EmptyState title="Sin sesiones publicadas" subtitle="El contenido de las sesiones se irá publicando a medida que avance el evento" />
        ) : (
          <div className="space-y-4">
            {sesiones.map(s => (
              <div key={s.id} className="card p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {s.numero_sesion}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{s.titulo}</h3>
                    {s.fecha && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Clock size={11} />{formatDateTime(s.fecha)}</p>}
                  </div>
                </div>
                {s.descripcion && <p className="text-sm text-gray-600 mb-3">{s.descripcion}</p>}
                {s.contenido_visto && (
                  <div className="bg-blue-50 rounded-xl p-3 mb-3">
                    <p className="text-xs font-bold text-secondary mb-1 uppercase tracking-wide">Contenido cubierto</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{s.contenido_visto}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  {s.material_url && (
                    <a href={s.material_url} target="_blank" rel="noreferrer"
                      className="btn btn-outline btn-sm">
                      <FileText size={13} /> Descargar material
                    </a>
                  )}
                  {s.grabacion_url && (
                    <a href={s.grabacion_url} target="_blank" rel="noreferrer"
                      className="btn btn-sm bg-red-600 text-white hover:bg-red-700">
                      <Video size={13} /> Ver grabación
                    </a>
                  )}
                  {s.enlace_virtual && (
                    <a href={s.enlace_virtual} target="_blank" rel="noreferrer"
                      className="btn btn-sm bg-green-600 text-white hover:bg-green-700">
                      <ExternalLink size={13} /> Unirse a la sesión
                    </a>
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
// VISTA PÚBLICA: Convenios (actualiza ConvocatoriasPage o nueva ruta)
// Ruta: /convenios
// ============================================================
export function ConveniosPublicPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['convenios-pub'],
    queryFn: () => api.get('/convenios').then(r => r.data)
  })
  const list = data?.data || []

  return (
    <div className="section">
      <div className="container-main max-w-4xl">
        <p className="eyebrow">Oportunidades de práctica</p>
        <h1 className="section-title">Convenios institucionales</h1>
        <p className="section-sub mb-8">
          Empresas e instituciones con convenio activo para pasantías y prácticas profesionales de los estudiantes de la carrera.
        </p>

        {isLoading ? <LoadingCenter /> : list.length === 0 ? (
          <EmptyState title="Sin convenios activos" subtitle="Los convenios se actualizan periódicamente" />
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {list.map(c => (
              <div key={c.id} className="card p-5">
                <div className="flex items-start gap-3 mb-3">
                  {c.logo_url
                    ? <img src={c.logo_url} alt={c.nombre_institucion} className="w-14 h-14 rounded-xl object-cover border flex-shrink-0" onError={e => e.target.style.display = 'none'} />
                    : <div className="w-14 h-14 rounded-xl bg-secondary-50 flex items-center justify-center text-secondary font-bold text-2xl flex-shrink-0">
                        {c.nombre_institucion.charAt(0)}
                      </div>
                  }
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800">{c.nombre_institucion}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <Badge color="#1A5276">{c.tipo_convenio}</Badge>
                      <ConvenioEstado convenio={c} />
                    </div>
                  </div>
                </div>
                {c.descripcion && <p className="text-sm text-gray-600 mb-3 leading-relaxed">{c.descripcion}</p>}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                  {c.cupos_disponibles && <span className="flex items-center gap-1"><CheckCircle size={11} className="text-green-500" /> {c.cupos_disponibles} cupos</span>}
                  {c.duracion_meses && <span className="flex items-center gap-1"><Clock size={11} /> {c.duracion_meses} mes(es)</span>}
                  {c.fecha_vencimiento && <span className="col-span-2">Convenio hasta: {formatDate(c.fecha_vencimiento)}</span>}
                </div>
                {c.requisitos && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Requisitos</p>
                    <p className="text-xs text-gray-500">{c.requisitos}</p>
                  </div>
                )}
                {c.contacto_email && (
                  <a href={`mailto:${c.contacto_email}`}
                    className="btn btn-outline btn-sm w-full mt-1">
                    Contactar: {c.contacto_nombre || c.contacto_email}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
