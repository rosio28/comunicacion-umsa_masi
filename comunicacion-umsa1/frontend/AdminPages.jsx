// AdminPages.jsx — COMPLETO CON ESTADOS + ACCIONES
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import {
  noticiasService, docentesService, alumnosService, egresadosService,
  multimediaService, galeriaService, whatsappService, materiasService,
  institucionalService, tramitesService, convocatoriasService, usuariosService,
  eventosService, categoriasService,
} from '../../services/services'
import { LoadingCenter, EmptyState, Modal, ConfirmDialog, SectionHeader, Badge } from '../../components/ui/UI'
import { formatDate, formatDateTime } from '../../utils/helpers'
import api from '../../services/api'
import { Upload, Link2, X, Eye, EyeOff, Plus, Pencil, Trash2, RefreshCw, Clock, MapPin, Star, CheckCircle } from 'lucide-react'

// ─── COMPONENTES COMPARTIDOS ──────────────────────────────

function EstadoBadge({ publicado, onClick }) {
  return (
    <button onClick={onClick} title={publicado ? 'Publicado — clic para despublicar' : 'Borrador — clic para publicar'}
      className={`badge cursor-pointer text-xs font-semibold select-none transition-colors ${publicado ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}>
      {publicado ? '● Publicado' : '○ Borrador'}
    </button>
  )
}

function DestacadoBadge({ destacado, onClick }) {
  return (
    <button onClick={onClick} title={destacado ? 'Destacado — clic para quitar' : 'Sin destacar — clic para destacar'}
      className={`badge cursor-pointer text-xs font-semibold select-none ml-1 transition-colors ${destacado ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
      {destacado ? '★' : '☆'}
    </button>
  )
}

function FiltroEstado({ value, onChange, showDestacado = false }) {
  const opts = [['todos','Todos'],['publicado','Publicados'],['borrador','Borradores'], ...(showDestacado?[['destacado','Destacados']]:[])]
  return (
    <div className="flex gap-1.5 flex-wrap items-center">
      {opts.map(([v,l]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${value===v?'bg-secondary text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          {l}
        </button>
      ))}
    </div>
  )
}

function filtrar(list, filtro) {
  if (filtro === 'publicado') return list.filter(x => x.publicado)
  if (filtro === 'borrador')  return list.filter(x => !x.publicado)
  if (filtro === 'destacado') return list.filter(x => x.destacado)
  return list
}

function ImageField({ label='Imagen', currentUrl='', onFile, onUrl }) {
  const [mode, setMode]       = useState('url')
  const [preview, setPreview] = useState('')
  const [urlVal, setUrlVal]   = useState('')
  const fileRef = useRef(null)
  useEffect(() => { setPreview(currentUrl||''); setUrlVal(currentUrl||'') }, [currentUrl])
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2 mb-2">
        {['url','file'].map(m => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${mode===m?'bg-secondary text-white border-secondary':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {m==='url'?<><Link2 size={12}/> URL</>:<><Upload size={12}/> Subir foto</>}
          </button>
        ))}
      </div>
      {mode==='url'
        ? <input className="input" type="url" placeholder="https://..." value={urlVal}
            onChange={e=>{setUrlVal(e.target.value);setPreview(e.target.value);onUrl?.(e.target.value)}}/>
        : <>
            <input type="file" ref={fileRef} accept="image/*" className="hidden"
              onChange={e=>{const f=e.target.files?.[0];if(!f)return;setPreview(URL.createObjectURL(f));onFile?.(f)}}/>
            <button type="button" onClick={()=>fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl p-3 text-center hover:border-primary hover:bg-primary/5 transition-colors">
              <Upload size={18} className="mx-auto mb-1 text-gray-400"/>
              <p className="text-xs text-gray-500">Clic para seleccionar imagen</p>
            </button>
          </>
      }
      {preview && (
        <div className="mt-2 relative inline-block">
          <img src={preview} alt="" className="h-20 w-auto rounded-lg border object-cover" onError={e=>e.target.style.display='none'}/>
          <button type="button" onClick={()=>{setPreview('');setUrlVal('');onFile?.(null);onUrl?.('')}}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"><X size={10}/></button>
        </div>
      )}
    </div>
  )
}

async function sendForm(endpoint, formData, imgFile, imgUrl, method='POST', imgField='imagen') {
  const fd = new FormData()
  Object.entries(formData).forEach(([k,v])=>{if(v!==undefined&&v!==null&&String(v)!=='')fd.append(k,String(v))})
  if(imgFile instanceof File) fd.append(imgField,imgFile)
  else if(imgUrl) fd.append(`${imgField}_url`,imgUrl)
  const cfg={headers:{'Content-Type':'multipart/form-data'}}
  return method==='PUT'?api.put(endpoint,fd,cfg):api.post(endpoint,fd,cfg)
}

// ============================================================
// NOTICIAS
// ============================================================
export function AdminNoticiasPage() {
  const qc=useQueryClient()
  const [filtro,setFiltro]=useState('todos')
  const [confirmId,setConfirmId]=useState(null)
  const {data,isLoading}=useQuery({queryKey:['noticias-admin'],queryFn:()=>noticiasService.getAll({limit:200})})
  const all=data?.data?.data||[]; const list=filtrar(all,filtro)
  const del=useMutation({mutationFn:noticiasService.delete,onSuccess:()=>{qc.invalidateQueries(['noticias-admin']);toast.success('Eliminada')}})
  const pub=useMutation({mutationFn:noticiasService.publicar,onSuccess:()=>{qc.invalidateQueries(['noticias-admin']);toast.success('Estado actualizado')}})
  const dest=useMutation({mutationFn:n=>api.put(`/noticias/${n.id}`,{destacado:!n.destacado}),onSuccess:()=>{qc.invalidateQueries(['noticias-admin']);toast.success('Destacado actualizado')}})
  return (
    <div>
      <SectionHeader title="Noticias" subtitle={`${all.length} total`}>
        <Link to="/admin/noticias/nueva" className="btn btn-primary btn-sm"><Plus size={15}/> Nueva noticia</Link>
      </SectionHeader>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <FiltroEstado value={filtro} onChange={setFiltro} showDestacado/>
        <span className="text-xs text-gray-400 ml-auto">{list.length} resultados</span>
      </div>
      {isLoading?<LoadingCenter/>:(
        <div className="card overflow-hidden">
          <table className="table-pro w-full">
            <thead><tr><th>Noticia</th><th className="hidden md:table-cell">Categoría</th><th>Estado</th><th className="text-right pr-4">Acciones</th></tr></thead>
            <tbody>
              {list.length===0&&<tr><td colSpan={4} className="text-center py-10 text-gray-400">Sin resultados para este filtro</td></tr>}
              {list.map(n=>(
                <tr key={n.id}>
                  <td><div className="flex items-center gap-3">
                    {n.imagen_url&&<img src={n.imagen_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" onError={e=>e.target.style.display='none'}/>}
                    <div><p className="font-semibold text-sm truncate max-w-[200px]">{n.titulo}</p><p className="text-xs text-gray-400">{formatDate(n.creado_en)}</p></div>
                  </div></td>
                  <td className="hidden md:table-cell">{n.categoria&&<Badge color={n.color_hex||'#1A5276'}>{n.categoria}</Badge>}</td>
                  <td><div className="flex items-center gap-1 flex-wrap">
                    <EstadoBadge publicado={n.publicado} onClick={()=>pub.mutate(n.id)}/>
                    <DestacadoBadge destacado={n.destacado} onClick={()=>dest.mutate(n)}/>
                  </div></td>
                  <td className="text-right pr-4"><div className="flex gap-2 justify-end">
                    <Link to={`/admin/noticias/${n.id}/editar`} className="btn btn-ghost btn-sm p-1.5" title="Editar"><Pencil size={14}/></Link>
                    <button onClick={()=>setConfirmId(n.id)} className="btn btn-ghost btn-sm p-1.5 text-red-500" title="Eliminar"><Trash2 size={14}/></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog open={!!confirmId} onClose={()=>setConfirmId(null)} onConfirm={()=>{del.mutate(confirmId);setConfirmId(null)}} title="Eliminar noticia" message="¿Eliminar esta noticia permanentemente?"/>
    </div>
  )
}

export function NoticiaFormPage() {
  const {id}=useParams(); const isEdit=!!id
  const navigate=useNavigate(); const qc=useQueryClient()
  const [imgFile,setImgFile]=useState(null); const [imgUrl,setImgUrl]=useState('')
  const {register,handleSubmit,reset,formState:{errors,isSubmitting}}=useForm()
  const {data:catData}=useQuery({queryKey:['cats'],queryFn:()=>categoriasService.getAll('noticias')})
  const cats=catData?.data?.data||[]
  const {data:allN}=useQuery({queryKey:['n-form-all'],enabled:isEdit,queryFn:()=>noticiasService.getAll({limit:200}).then(r=>r.data?.data||[])})
  const nd=allN?.find(n=>String(n.id)===id)
  useEffect(()=>{
    if(nd){reset({titulo:nd.titulo||'',resumen:nd.resumen||'',contenido:nd.contenido||'',categoria_id:nd.categoria_id||'',destacado:nd.destacado,publicado:nd.publicado});setImgUrl(nd.imagen_url||'')}
  },[nd,reset])
  const onSubmit=async(d)=>{
    try{await sendForm(isEdit?`/noticias/${id}`:'/noticias',d,imgFile,imgUrl,isEdit?'PUT':'POST');toast.success(isEdit?'Noticia actualizada':'Noticia creada');qc.invalidateQueries(['noticias-admin']);navigate('/admin/noticias')}
    catch(e){toast.error(e.response?.data?.message||'Error al guardar')}
  }
  return (
    <div className="max-w-3xl">
      <SectionHeader title={isEdit?'Editar noticia':'Nueva noticia'}><Link to="/admin/noticias" className="btn btn-ghost btn-sm">← Volver</Link></SectionHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <div><label className="label">Título *</label><input className="input" {...register('titulo',{required:'Requerido'})}/>{errors.titulo&&<p className="text-red-500 text-xs mt-1">{errors.titulo.message}</p>}</div>
        <div><label className="label">Categoría</label><select className="input" {...register('categoria_id')}><option value="">Sin categoría</option>{cats.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
        <div><label className="label">Resumen</label><textarea className="input h-20 resize-none" {...register('resumen')}/></div>
        <div><label className="label">Contenido *</label><textarea className="input h-48 resize-y" {...register('contenido',{required:'Requerido'})}/>{errors.contenido&&<p className="text-red-500 text-xs mt-1">{errors.contenido.message}</p>}</div>
        <ImageField label="Imagen destacada" currentUrl={imgUrl} onFile={f=>{setImgFile(f);setImgUrl('')}} onUrl={u=>{setImgUrl(u);setImgFile(null)}}/>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" {...register('destacado')} className="w-4 h-4"/> <Star size={14} className="text-yellow-500"/> Destacar en inicio</label>
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" {...register('publicado')} className="w-4 h-4"/> <CheckCircle size={14} className="text-green-500"/> Publicar ahora</label>
        </div>
        <div className="flex gap-3"><button type="submit" disabled={isSubmitting} className="btn btn-primary">{isSubmitting?'Guardando...':isEdit?'Actualizar':'Crear noticia'}</button><Link to="/admin/noticias" className="btn btn-ghost">Cancelar</Link></div>
      </form>
    </div>
  )
}

// ============================================================
// DOCENTES
// ============================================================
export function AdminDocentesPage() {
  const qc=useQueryClient(); const [modal,setModal]=useState(false); const [editing,setEditing]=useState(null); const [confirmId,setConfirmId]=useState(null)
  const [imgFile,setImgFile]=useState(null); const [imgUrl,setImgUrl]=useState('')
  const {data,isLoading}=useQuery({queryKey:['doc-admin'],queryFn:docentesService.getAll}); const list=data?.data?.data||[]
  const {register,handleSubmit,reset,formState:{isSubmitting}}=useForm()
  const openEdit=d=>{setEditing(d);setImgFile(null);setImgUrl(d.foto_url||'');reset({nombre_completo:d.nombre_completo||'',titulo_academico:d.titulo_academico||'',especialidad:d.especialidad||'',email:d.email||'',bio_corta:d.bio_corta||'',tipo:d.tipo||'titular'});setModal(true)}
  const openNew=()=>{setEditing(null);setImgFile(null);setImgUrl('');reset({nombre_completo:'',titulo_academico:'',especialidad:'',email:'',bio_corta:'',tipo:'titular'});setModal(true)}
  const save=useMutation({
    mutationFn:async d=>{const fd=new FormData();Object.entries(d).forEach(([k,v])=>{if(v!==undefined&&String(v)!=='')fd.append(k,String(v))});if(imgFile instanceof File)fd.append('foto',imgFile);else if(imgUrl)fd.append('foto_url',imgUrl);const cfg={headers:{'Content-Type':'multipart/form-data'}};return editing?api.put(`/docentes/${editing.id}`,fd,cfg):api.post('/docentes',fd,cfg)},
    onSuccess:()=>{qc.invalidateQueries(['doc-admin']);toast.success(editing?'Actualizado':'Creado');setModal(false)},onError:e=>toast.error(e.response?.data?.message||'Error')
  })
  const del=useMutation({mutationFn:docentesService.delete,onSuccess:()=>{qc.invalidateQueries(['doc-admin']);toast.success('Desactivado')}})
  return (
    <div>
      <SectionHeader title="Docentes" subtitle={`${list.length} activos`}><button onClick={openNew} className="btn btn-primary btn-sm"><Plus size={15}/> Agregar docente</button></SectionHeader>
      {isLoading?<LoadingCenter/>:(
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.length===0&&<div className="col-span-full"><EmptyState title="Sin docentes"/></div>}
          {list.map(d=>(
            <div key={d.id} className="card p-4 flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-secondary-50 flex-shrink-0 flex items-center justify-center">
                {d.foto_url?<img src={d.foto_url} alt="" className="w-full h-full object-cover" onError={e=>e.target.style.display='none'}/>:<span className="text-secondary font-bold text-lg">{d.nombre_completo.charAt(0)}</span>}
              </div>
              <div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{d.nombre_completo}</p>{d.titulo_academico&&<p className="text-xs text-primary">{d.titulo_academico}</p>}{d.especialidad&&<p className="text-xs text-gray-500 line-clamp-1">{d.especialidad}</p>}<Badge color={d.tipo==='titular'?'#1A5276':'#C0392B'}>{d.tipo}</Badge></div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button onClick={()=>openEdit(d)} className="btn btn-ghost btn-sm p-1.5" title="Editar"><Pencil size={14}/></button>
                <button onClick={()=>setConfirmId(d.id)} className="btn btn-ghost btn-sm p-1.5 text-red-500" title="Desactivar"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!confirmId} onClose={()=>setConfirmId(null)} onConfirm={()=>{del.mutate(confirmId);setConfirmId(null)}} title="Desactivar" message="¿Desactivar este docente?"/>
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Editar docente':'Nuevo docente'} size="lg">
        <form onSubmit={handleSubmit(d=>save.mutate(d))} className="space-y-3">
          <div><label className="label">Nombre completo *</label><input className="input" {...register('nombre_completo',{required:true})}/></div>
          <div className="grid sm:grid-cols-2 gap-3"><div><label className="label">Título (M.Sc., Lic.)</label><input className="input" {...register('titulo_academico')}/></div><div><label className="label">Tipo</label><select className="input" {...register('tipo')}><option value="titular">Titular</option><option value="interino">Interino</option><option value="invitado">Invitado</option></select></div></div>
          <div><label className="label">Especialidad</label><input className="input" {...register('especialidad')}/></div>
          <div><label className="label">Correo</label><input className="input" type="email" {...register('email')}/></div>
          <div><label className="label">Bio corta</label><textarea className="input h-20 resize-none" {...register('bio_corta')}/></div>
          <ImageField label="Foto del docente" currentUrl={imgUrl} onFile={f=>{setImgFile(f);setImgUrl('')}} onUrl={u=>{setImgUrl(u);setImgFile(null)}}/>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">{isSubmitting?'Guardando...':'Guardar'}</button>
        </form>
      </Modal>
    </div>
  )
}

// ============================================================
// MEJORES ALUMNOS
// ============================================================
export function AdminAlumnosPage() {
  const qc=useQueryClient(); const [filtro,setFiltro]=useState('todos'); const [modal,setModal]=useState(false); const [editing,setEditing]=useState(null); const [confirmId,setConfirmId]=useState(null)
  const [imgFile,setImgFile]=useState(null); const [imgUrl,setImgUrl]=useState('')
  const {data,isLoading}=useQuery({queryKey:['al-admin'],queryFn:()=>api.get('/mejores-alumnos?all=1').then(r=>r.data)}); const all=data?.data||[]; const list=filtrar(all,filtro)
  const {register,handleSubmit,reset,formState:{isSubmitting}}=useForm()
  const openEdit=a=>{setEditing(a);setImgFile(null);setImgUrl(a.foto_url||'');reset({nombre_completo:a.nombre_completo||'',promedio:a.promedio||'',semestre_actual:a.semestre_actual||'',gestion:a.gestion||'',logros:a.logros||''});setModal(true)}
  const openNew=()=>{setEditing(null);setImgFile(null);setImgUrl('');reset({nombre_completo:'',promedio:'',semestre_actual:'',gestion:'',logros:''});setModal(true)}
  const save=useMutation({
    mutationFn:async d=>{const fd=new FormData();Object.entries(d).forEach(([k,v])=>{if(v!==undefined&&String(v)!=='')fd.append(k,String(v))});if(imgFile instanceof File)fd.append('foto',imgFile);else if(imgUrl)fd.append('foto_url',imgUrl);const cfg={headers:{'Content-Type':'multipart/form-data'}};return editing?api.put(`/mejores-alumnos/${editing.id}`,fd,cfg):api.post('/mejores-alumnos',fd,cfg)},
    onSuccess:()=>{qc.invalidateQueries(['al-admin']);toast.success('Guardado');setModal(false)}
  })
  const pub=useMutation({mutationFn:a=>api.put(`/mejores-alumnos/${a.id}`,{publicado:!a.publicado}),onSuccess:()=>{qc.invalidateQueries(['al-admin']);toast.success('Estado actualizado')}})
  const del=useMutation({mutationFn:id=>api.delete(`/mejores-alumnos/${id}`),onSuccess:()=>{qc.invalidateQueries(['al-admin']);toast.success('Eliminado')}})
  return (
    <div>
      <SectionHeader title="Mejores estudiantes" subtitle={`${all.length} registros`}><button onClick={openNew} className="btn btn-primary btn-sm"><Plus size={15}/> Agregar</button></SectionHeader>
      <div className="flex items-center gap-3 mb-4 flex-wrap"><FiltroEstado value={filtro} onChange={setFiltro}/><span className="text-xs text-gray-400 ml-auto">{list.length} resultados</span></div>
      {isLoading?<LoadingCenter/>:(
        <div className="card overflow-hidden"><table className="table-pro w-full">
          <thead><tr><th>#</th><th>Nombre</th><th>Promedio</th><th className="hidden sm:table-cell">Gestión</th><th>Estado</th><th className="text-right pr-4">Acciones</th></tr></thead>
          <tbody>
            {list.length===0&&<tr><td colSpan={6} className="text-center py-10 text-gray-400">Sin resultados</td></tr>}
            {list.map((a,i)=>(
              <tr key={a.id}>
                <td><span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold text-white ${i===0?'bg-yellow-400':i===1?'bg-gray-400':i===2?'bg-yellow-700':'bg-secondary'}`}>{i+1}</span></td>
                <td className="font-medium text-sm">{a.nombre_completo}</td>
                <td className="font-bold text-primary">{a.promedio}</td>
                <td className="hidden sm:table-cell text-gray-500 text-sm">{a.gestion}</td>
                <td><EstadoBadge publicado={a.publicado} onClick={()=>pub.mutate(a)}/></td>
                <td className="text-right pr-4"><div className="flex gap-2 justify-end">
                  <button onClick={()=>openEdit(a)} className="btn btn-ghost btn-sm p-1.5" title="Editar"><Pencil size={14}/></button>
                  <button onClick={()=>setConfirmId(a.id)} className="btn btn-ghost btn-sm p-1.5 text-red-500" title="Eliminar"><Trash2 size={14}/></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <ConfirmDialog open={!!confirmId} onClose={()=>setConfirmId(null)} onConfirm={()=>{del.mutate(confirmId);setConfirmId(null)}} title="Eliminar" message="¿Eliminar este alumno del ranking?"/>
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Editar alumno':'Agregar alumno'}>
        <form onSubmit={handleSubmit(d=>save.mutate(d))} className="space-y-3">
          <div><label className="label">Nombre completo *</label><input className="input" {...register('nombre_completo',{required:true})}/></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Promedio *</label><input className="input" type="number" step="0.01" min="0" max="100" {...register('promedio',{required:true})}/></div><div><label className="label">Semestre</label><input className="input" type="number" min="1" max="10" {...register('semestre_actual')}/></div></div>
          <div><label className="label">Gestión *</label><input className="input" placeholder="2026-I" {...register('gestion',{required:true})}/></div>
          <div><label className="label">Logros</label><textarea className="input h-20 resize-none" {...register('logros')}/></div>
          <ImageField label="Foto" currentUrl={imgUrl} onFile={f=>{setImgFile(f);setImgUrl('')}} onUrl={u=>{setImgUrl(u);setImgFile(null)}}/>
          <div className="flex items-center gap-2"><input type="checkbox" id="pub_al" {...register('publicado')}/><label htmlFor="pub_al" className="text-sm">Publicar</label></div>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">Guardar</button>
        </form>
      </Modal>
    </div>
  )
}

// ============================================================
// MULTIMEDIA
// ============================================================
export function AdminMultimediaPage() {
  const qc=useQueryClient(); const [filtro,setFiltro]=useState('todos'); const [modal,setModal]=useState(false); const [editing,setEditing]=useState(null); const [confirmId,setConfirmId]=useState(null)
  const [thumbFile,setThumbFile]=useState(null); const [thumbUrl,setThumbUrl]=useState('')
  const {data,isLoading}=useQuery({queryKey:['mm-admin'],queryFn:()=>api.get('/multimedia?all=1').then(r=>r.data)}); const all=data?.data||[]; const list=filtrar(all,filtro)
  const {register,handleSubmit,reset,formState:{isSubmitting}}=useForm()
  const openEdit=m=>{setEditing(m);setThumbFile(null);setThumbUrl(m.thumbnail_url||'');reset({titulo:m.titulo||'',tipo:m.tipo||'video',autor_nombre:m.autor_nombre||'',url_contenido:m.url_contenido||'',materia_origen:m.materia_origen||'',gestion:m.gestion||'',descripcion:m.descripcion||'',destacado:m.destacado,publicado:m.publicado});setModal(true)}
  const openNew=()=>{setEditing(null);setThumbFile(null);setThumbUrl('');reset({titulo:'',tipo:'video',autor_nombre:'',url_contenido:'',materia_origen:'',gestion:'',descripcion:'',destacado:false,publicado:true});setModal(true)}
  const save=useMutation({
    mutationFn:async d=>{const fd=new FormData();Object.entries(d).forEach(([k,v])=>{if(v!==undefined&&String(v)!=='')fd.append(k,String(v))});if(thumbFile instanceof File)fd.append('thumbnail',thumbFile);else if(thumbUrl)fd.append('thumbnail_url',thumbUrl);const cfg={headers:{'Content-Type':'multipart/form-data'}};return editing?api.put(`/multimedia/${editing.id}`,fd,cfg):api.post('/multimedia',fd,cfg)},
    onSuccess:()=>{qc.invalidateQueries(['mm-admin']);toast.success('Guardado');setModal(false)}
  })
  const pub=useMutation({mutationFn:multimediaService.publicar,onSuccess:()=>{qc.invalidateQueries(['mm-admin']);toast.success('Estado actualizado')}})
  const del=useMutation({mutationFn:id=>api.delete(`/multimedia/${id}`),onSuccess:()=>{qc.invalidateQueries(['mm-admin']);toast.success('Eliminado')}})
  return (
    <div>
      <SectionHeader title="Multimedia estudiantil" subtitle={`${all.length} trabajos`}><button onClick={openNew} className="btn btn-primary btn-sm"><Plus size={15}/> Registrar trabajo</button></SectionHeader>
      <div className="flex items-center gap-3 mb-4 flex-wrap"><FiltroEstado value={filtro} onChange={setFiltro}/><span className="text-xs text-gray-400 ml-auto">{list.length} resultados</span></div>
      {isLoading?<LoadingCenter/>:(
        <div className="card overflow-hidden"><table className="table-pro w-full">
          <thead><tr><th>Trabajo</th><th className="hidden sm:table-cell">Autor</th><th className="hidden md:table-cell">Tipo</th><th>Estado</th><th className="text-right pr-4">Acciones</th></tr></thead>
          <tbody>
            {list.length===0&&<tr><td colSpan={5} className="text-center py-10 text-gray-400">Sin resultados</td></tr>}
            {list.map(m=>{
              const ytId=m.url_contenido?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/)?.[1]
              const thumb=m.thumbnail_url||(ytId?`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`:null)
              return (<tr key={m.id}>
                <td><div className="flex items-center gap-3">{thumb&&<img src={thumb} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" onError={e=>e.target.style.display='none'}/>}<p className="font-medium text-sm truncate max-w-[180px]">{m.titulo}</p></div></td>
                <td className="hidden sm:table-cell text-gray-500 text-sm">{m.autor_nombre}</td>
                <td className="hidden md:table-cell"><Badge color="#1A5276">{m.tipo}</Badge></td>
                <td><EstadoBadge publicado={m.publicado} onClick={()=>pub.mutate(m.id)}/></td>
                <td className="text-right pr-4"><div className="flex gap-2 justify-end">
                  <button onClick={()=>openEdit(m)} className="btn btn-ghost btn-sm p-1.5" title="Editar"><Pencil size={14}/></button>
                  <button onClick={()=>setConfirmId(m.id)} className="btn btn-ghost btn-sm p-1.5 text-red-500" title="Eliminar"><Trash2 size={14}/></button>
                </div></td>
              </tr>)
            })}
          </tbody>
        </table></div>
      )}
      <ConfirmDialog open={!!confirmId} onClose={()=>setConfirmId(null)} onConfirm={()=>{del.mutate(confirmId);setConfirmId(null)}} title="Eliminar" message="¿Eliminar este trabajo multimedia?"/>
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Editar trabajo':'Registrar trabajo'} size="lg">
        <form onSubmit={handleSubmit(d=>save.mutate(d))} className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><label className="label">Título *</label><input className="input" {...register('titulo',{required:true})}/></div>
          <div><label className="label">Tipo</label><select className="input" {...register('tipo')}>{['video','podcast','fotografia','reportaje','otro'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="label">Autor *</label><input className="input" {...register('autor_nombre',{required:true})}/></div>
          <div className="sm:col-span-2"><label className="label">URL YouTube / SoundCloud</label><input className="input" type="url" placeholder="https://youtube.com/..." {...register('url_contenido')}/></div>
          <div><label className="label">Materia</label><input className="input" {...register('materia_origen')}/></div>
          <div><label className="label">Gestión</label><input className="input" placeholder="2026-I" {...register('gestion')}/></div>
          <div className="sm:col-span-2"><label className="label">Descripción</label><textarea className="input h-20 resize-none" {...register('descripcion')}/></div>
          <div className="sm:col-span-2"><ImageField label="Miniatura" currentUrl={thumbUrl} onFile={f=>{setThumbFile(f);setThumbUrl('')}} onUrl={u=>{setThumbUrl(u);setThumbFile(null)}}/></div>
          <div className="sm:col-span-2 flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" {...register('destacado')}/> Destacado</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" {...register('publicado')}/> Publicar ahora</label>
          </div>
          <div className="sm:col-span-2"><button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">Guardar</button></div>
        </form>
      </Modal>
    </div>
  )
}

// ============================================================
// WHATSAPP
// ============================================================
export function AdminWhatsappPage() {
  const qc=useQueryClient(); const [filtro,setFiltro]=useState('todos'); const [modal,setModal]=useState(false); const [editing,setEditing]=useState(null); const [confirmId,setConfirmId]=useState(null)
  const {data,isLoading}=useQuery({queryKey:['wa-admin'],queryFn:()=>api.get('/whatsapp/admin').then(r=>r.data)})
  const all=data?.data||[]; const list=filtro==='publicado'?all.filter(g=>g.activo):filtro==='borrador'?all.filter(g=>!g.activo):all
  const {register,handleSubmit,reset,formState:{isSubmitting}}=useForm()
  const openEdit=g=>{setEditing(g);reset({materia_nombre:g.materia_nombre||'',semestre:g.semestre||1,gestion:g.gestion||'',enlace_wa:g.enlace_wa||'',activo:g.activo});setModal(true)}
  const openNew=()=>{setEditing(null);reset({materia_nombre:'',semestre:1,gestion:'',enlace_wa:'',activo:true});setModal(true)}
  const save=useMutation({mutationFn:d=>editing?api.put(`/whatsapp/${editing.id}`,d):api.post('/whatsapp',d),onSuccess:()=>{qc.invalidateQueries(['wa-admin']);toast.success('Guardado');setModal(false)}})
  const del=useMutation({mutationFn:whatsappService.delete,onSuccess:()=>{qc.invalidateQueries(['wa-admin']);toast.success('Desactivado')}})
  return (
    <div>
      <SectionHeader title="Grupos de WhatsApp" subtitle={`${all.length} grupos`}><button onClick={openNew} className="btn btn-primary btn-sm"><Plus size={15}/> Agregar grupo</button></SectionHeader>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {[['todos','Todos'],['publicado','Activos'],['borrador','Inactivos']].map(([v,l])=>(<button key={v} onClick={()=>setFiltro(v)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${filtro===v?'bg-secondary text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{l}</button>))}
        <span className="text-xs text-gray-400 ml-auto">{list.length} resultados</span>
      </div>
      {isLoading?<LoadingCenter/>:(
        <div className="card overflow-hidden"><table className="table-pro w-full">
          <thead><tr><th>Materia</th><th>Sem.</th><th className="hidden sm:table-cell">Gestión</th><th>Estado</th><th className="text-right pr-4">Acciones</th></tr></thead>
          <tbody>
            {list.length===0&&<tr><td colSpan={5} className="text-center py-10 text-gray-400">Sin resultados</td></tr>}
            {list.map(g=>(<tr key={g.id}>
              <td className="font-medium text-sm">{g.materia_nombre}</td>
              <td className="text-gray-500 text-sm">{g.semestre}</td>
              <td className="hidden sm:table-cell text-gray-500 text-sm">{g.gestion}</td>
              <td><span className={`badge text-xs font-semibold ${g.activo?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{g.activo?'● Activo':'○ Inactivo'}</span></td>
              <td className="text-right pr-4"><div className="flex gap-2 justify-end">
                <button onClick={()=>openEdit(g)} className="btn btn-ghost btn-sm p-1.5" title="Editar"><Pencil size={14}/></button>
                <button onClick={()=>setConfirmId(g.id)} className="btn btn-ghost btn-sm p-1.5 text-red-500" title="Desactivar"><Trash2 size={14}/></button>
              </div></td>
            </tr>))}
          </tbody>
        </table></div>
      )}
      <ConfirmDialog open={!!confirmId} onClose={()=>setConfirmId(null)} onConfirm={()=>{del.mutate(confirmId);setConfirmId(null)}} title="Desactivar grupo" message="¿Desactivar este enlace de WhatsApp?"/>
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Editar grupo':'Nuevo grupo'}>
        <form onSubmit={handleSubmit(d=>save.mutate(d))} className="space-y-3">
          <div><label className="label">Materia *</label><input className="input" {...register('materia_nombre',{required:true})}/></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Semestre *</label><input className="input" type="number" min="1" max="10" {...register('semestre',{required:true})}/></div><div><label className="label">Gestión *</label><input className="input" placeholder="2026-I" {...register('gestion',{required:true})}/></div></div>
          <div><label className="label">Enlace WhatsApp *</label><input className="input" type="url" placeholder="https://chat.whatsapp.com/..." {...register('enlace_wa',{required:true})}/></div>
          {editing&&<div className="flex items-center gap-2"><input type="checkbox" id="act_wa" {...register('activo')}/><label htmlFor="act_wa" className="text-sm">Enlace activo</label></div>}
          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">Guardar</button>
        </form>
      </Modal>
    </div>
  )
}

// ============================================================
// EGRESADOS
// ============================================================
export function AdminEgresadosPage() {
  const qc=useQueryClient(); const [filtro,setFiltro]=useState('todos'); const [modal,setModal]=useState(false); const [editing,setEditing]=useState(null); const [confirmId,setConfirmId]=useState(null)
  const [imgFile,setImgFile]=useState(null); const [imgUrl,setImgUrl]=useState('')
  const {data,isLoading}=useQuery({queryKey:['eg-admin'],queryFn:()=>api.get('/egresados?all=1').then(r=>r.data)}); const all=data?.data||[]; const list=filtrar(all,filtro)
  const {register,handleSubmit,reset,formState:{isSubmitting}}=useForm()
  const openEdit=e=>{setEditing(e);setImgFile(null);setImgUrl(e.foto_url||'');reset({nombre_completo:e.nombre_completo||'',anio_egreso:e.anio_egreso||'',ocupacion_actual:e.ocupacion_actual||'',empresa_institucion:e.empresa_institucion||'',testimonio:e.testimonio||'',linkedin_url:e.linkedin_url||''});setModal(true)}
  const openNew=()=>{setEditing(null);setImgFile(null);setImgUrl('');reset({nombre_completo:'',anio_egreso:'',ocupacion_actual:'',empresa_institucion:'',testimonio:'',linkedin_url:''});setModal(true)}
  const save=useMutation({
    mutationFn:async d=>{const fd=new FormData();Object.entries(d).forEach(([k,v])=>{if(v!==undefined&&String(v)!=='')fd.append(k,String(v))});if(imgFile instanceof File)fd.append('foto',imgFile);else if(imgUrl)fd.append('foto_url',imgUrl);const cfg={headers:{'Content-Type':'multipart/form-data'}};return editing?api.put(`/egresados/${editing.id}`,fd,cfg):api.post('/egresados',fd,cfg)},
    onSuccess:()=>{qc.invalidateQueries(['eg-admin']);toast.success('Guardado');setModal(false)}
  })
  const pub=useMutation({mutationFn:e=>api.put(`/egresados/${e.id}`,{publicado:!e.publicado}),onSuccess:()=>{qc.invalidateQueries(['eg-admin']);toast.success('Estado actualizado')}})
  const del=useMutation({mutationFn:id=>api.delete(`/egresados/${id}`),onSuccess:()=>{qc.invalidateQueries(['eg-admin']);toast.success('Eliminado')}})
  return (
    <div>
      <SectionHeader title="Egresados destacados" subtitle={`${all.length} perfiles`}><button onClick={openNew} className="btn btn-primary btn-sm"><Plus size={15}/> Agregar egresado</button></SectionHeader>
      <div className="flex items-center gap-3 mb-4 flex-wrap"><FiltroEstado value={filtro} onChange={setFiltro}/><span className="text-xs text-gray-400 ml-auto">{list.length} resultados</span></div>
      {isLoading?<LoadingCenter/>:(
        <div className="grid sm:grid-cols-2 gap-4">
          {list.length===0&&<div className="col-span-full"><EmptyState title="Sin egresados"/></div>}
          {list.map(e=>(<div key={e.id} className="card p-4 flex gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-secondary-50 flex-shrink-0 flex items-center justify-center">
              {e.foto_url?<img src={e.foto_url} alt="" className="w-full h-full object-cover" onError={ev=>ev.target.style.display='none'}/>:<span className="text-secondary font-bold text-xl">{e.nombre_completo.charAt(0)}</span>}
            </div>
            <div className="flex-1 min-w-0"><p className="font-semibold text-sm">{e.nombre_completo}</p>{e.ocupacion_actual&&<p className="text-xs text-primary">{e.ocupacion_actual}</p>}{e.anio_egreso&&<p className="text-xs text-gray-400">Egresado {e.anio_egreso}</p>}<div className="mt-1"><EstadoBadge publicado={e.publicado} onClick={()=>pub.mutate(e)}/></div></div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button onClick={()=>openEdit(e)} className="btn btn-ghost btn-sm p-1.5" title="Editar"><Pencil size={14}/></button>
              <button onClick={()=>setConfirmId(e.id)} className="btn btn-ghost btn-sm p-1.5 text-red-500" title="Eliminar"><Trash2 size={14}/></button>
            </div>
          </div>))}
        </div>
      )}
      <ConfirmDialog open={!!confirmId} onClose={()=>setConfirmId(null)} onConfirm={()=>{del.mutate(confirmId);setConfirmId(null)}} title="Eliminar egresado" message="¿Eliminar este perfil?"/>
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Editar egresado':'Nuevo egresado'} size="lg">
        <form onSubmit={handleSubmit(d=>save.mutate(d))} className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><label className="label">Nombre completo *</label><input className="input" {...register('nombre_completo',{required:true})}/></div>
          <div><label className="label">Año de egreso</label><input className="input" type="number" min="1984" max="2030" {...register('anio_egreso')}/></div>
          <div><label className="label">Ocupación actual</label><input className="input" {...register('ocupacion_actual')}/></div>
          <div className="sm:col-span-2"><label className="label">Empresa / Institución</label><input className="input" {...register('empresa_institucion')}/></div>
          <div className="sm:col-span-2"><label className="label">Testimonio</label><textarea className="input h-20 resize-none" {...register('testimonio')}/></div>
          <div><label className="label">LinkedIn URL</label><input className="input" type="url" {...register('linkedin_url')}/></div>
          <div><ImageField label="Foto" currentUrl={imgUrl} onFile={f=>{setImgFile(f);setImgUrl('')}} onUrl={u=>{setImgUrl(u);setImgFile(null)}}/></div>
          <div className="sm:col-span-2"><button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">Guardar</button></div>
        </form>
      </Modal>
    </div>
  )
}

// ============================================================
// EVENTOS
// ============================================================
export function AdminEventosPage() {
  const qc=useQueryClient(); const [modal,setModal]=useState(false); const [editing,setEditing]=useState(null); const [selected,setSelected]=useState(null); const [confirmId,setConfirmId]=useState(null)
  const [imgFile,setImgFile]=useState(null); const [imgUrl,setImgUrl]=useState('')
  const {data,isLoading}=useQuery({queryKey:['ev-admin'],queryFn:()=>eventosService.getAll({})}); const list=data?.data?.data||[]
  const {register,handleSubmit,reset,formState:{isSubmitting}}=useForm()
  const openEdit=e=>{setEditing(e);setImgFile(null);setImgUrl(e.imagen_url||'');reset({titulo:e.titulo||'',tipo:e.tipo||'otro',color:e.color||'#C0392B',fecha_inicio:e.fecha_inicio?.slice(0,16)||'',fecha_fin:e.fecha_fin?.slice(0,16)||'',lugar:e.lugar||'',enlace_virtual:e.enlace_virtual||'',descripcion:e.descripcion||'',publicado:e.publicado});setModal(true)}
  const openNew=()=>{setEditing(null);setImgFile(null);setImgUrl('');reset({titulo:'',tipo:'otro',color:'#C0392B',fecha_inicio:'',fecha_fin:'',lugar:'',enlace_virtual:'',descripcion:'',publicado:true});setModal(true)}
  const save=useMutation({
    mutationFn:async d=>{const fd=new FormData();Object.entries(d).forEach(([k,v])=>{if(v!==undefined&&String(v)!=='')fd.append(k,String(v))});if(imgFile instanceof File)fd.append('imagen',imgFile);else if(imgUrl)fd.append('imagen_url',imgUrl);const cfg={headers:{'Content-Type':'multipart/form-data'}};return editing?api.put(`/eventos/${editing.id}`,fd,cfg):api.post('/eventos',fd,cfg)},
    onSuccess:()=>{qc.invalidateQueries(['ev-admin']);toast.success('Guardado');setModal(false)}
  })
  const del=useMutation({mutationFn:eventosService.delete,onSuccess:()=>{qc.invalidateQueries(['ev-admin']);toast.success('Eliminado');setSelected(null);setConfirmId(null)}})
  return (
    <div>
      <SectionHeader title="Eventos" subtitle="Calendario académico"><button onClick={openNew} className="btn btn-primary btn-sm"><Plus size={15}/> Nuevo evento</button></SectionHeader>
      <div className="card p-4 mb-5">
        <FullCalendar plugins={[dayGridPlugin,interactionPlugin]} initialView="dayGridMonth" locale="es" height="auto"
          events={list.map(e=>({id:String(e.id),title:e.titulo,start:e.fecha_inicio,end:e.fecha_fin||undefined,color:e.color||'#C0392B',extendedProps:e}))}
          eventClick={info=>setSelected(info.event.extendedProps)}
          headerToolbar={{left:'prev,next today',center:'title',right:'dayGridMonth,dayGridWeek'}}
          eventContent={arg=><div className="px-1.5 py-0.5 text-xs font-medium truncate rounded" style={{background:arg.event.backgroundColor,color:'white'}}>{arg.event.title}</div>}/>
        <p className="text-xs text-gray-400 text-center mt-1">Clic en un evento para ver detalle</p>
      </div>
      {isLoading?<LoadingCenter/>:(<div className="space-y-2">
        {list.map(e=>(
          <div key={e.id} className="card p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex-shrink-0 flex flex-col items-center justify-center text-white text-xs font-bold" style={{background:e.color||'#C0392B'}}>
              <span className="text-base leading-none">{new Date(e.fecha_inicio).getDate()}</span>
              <span className="text-xs opacity-80">{new Date(e.fecha_inicio).toLocaleDateString('es',{month:'short'})}</span>
            </div>
            {e.imagen_url&&<img src={e.imagen_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" onError={ev=>ev.target.style.display='none'}/>}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{e.titulo}</p>
              {e.descripcion&&<p className="text-xs text-gray-500 line-clamp-1">{e.descripcion}</p>}
              <p className="text-xs text-gray-400">{formatDateTime(e.fecha_inicio)}{e.lugar?` · ${e.lugar}`:''}</p>
            </div>
            <EstadoBadge publicado={e.publicado} onClick={()=>{}}/>
            <div className="flex gap-1.5 flex-shrink-0">
              <button onClick={()=>openEdit(e)} className="btn btn-ghost btn-sm p-1.5" title="Editar"><Pencil size={14}/></button>
              <button onClick={()=>setConfirmId(e.id)} className="btn btn-ghost btn-sm p-1.5 text-red-500" title="Eliminar"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>)}
      {selected&&(<Modal open={!!selected} onClose={()=>setSelected(null)} title={selected.titulo}>
        {selected.imagen_url&&<img src={selected.imagen_url} alt="" className="w-full h-40 object-cover rounded-xl mb-4" onError={e=>e.target.style.display='none'}/>}
        <div className="space-y-3">
          <Badge color={selected.color||'#C0392B'}>{selected.tipo}</Badge>
          {selected.descripcion&&<p className="text-sm text-gray-700">{selected.descripcion}</p>}
          <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-3 text-sm">
            <div><p className="text-xs text-gray-400">Inicio</p><p className="font-medium">{formatDateTime(selected.fecha_inicio)}</p></div>
            {selected.fecha_fin&&<div><p className="text-xs text-gray-400">Fin</p><p className="font-medium">{formatDateTime(selected.fecha_fin)}</p></div>}
            {selected.lugar&&<div className="col-span-2"><p className="text-xs text-gray-400">Lugar</p><p className="font-medium">{selected.lugar}</p></div>}
          </div>
          {selected.enlace_virtual&&<a href={selected.enlace_virtual} target="_blank" rel="noreferrer" className="btn btn-primary w-full">Enlace virtual</a>}
          <div className="flex gap-2">
            <button onClick={()=>{openEdit(selected);setSelected(null)}} className="btn btn-outline btn-sm"><Pencil size={13}/> Editar</button>
            <button onClick={()=>setConfirmId(selected.id)} className="btn btn-sm bg-red-50 text-red-600"><Trash2 size={13}/> Eliminar</button>
          </div>
        </div>
      </Modal>)}
      <ConfirmDialog open={!!confirmId} onClose={()=>setConfirmId(null)} onConfirm={()=>del.mutate(confirmId)} title="Eliminar evento" message="¿Eliminar este evento?"/>
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Editar evento':'Nuevo evento'} size="lg">
        <form onSubmit={handleSubmit(d=>save.mutate(d))} className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><label className="label">Título *</label><input className="input" {...register('titulo',{required:true})}/></div>
          <div><label className="label">Tipo</label><select className="input" {...register('tipo')}>{['taller','seminario','defensa','examen','fecha_admin','otro'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="label">Color</label><input className="input" type="color" {...register('color')}/></div>
          <div><label className="label">Inicio *</label><input className="input" type="datetime-local" {...register('fecha_inicio',{required:true})}/></div>
          <div><label className="label">Fin</label><input className="input" type="datetime-local" {...register('fecha_fin')}/></div>
          <div><label className="label">Lugar</label><input className="input" {...register('lugar')}/></div>
          <div><label className="label">Enlace virtual</label><input className="input" type="url" {...register('enlace_virtual')}/></div>
          <div className="sm:col-span-2"><label className="label">Descripción</label><textarea className="input h-20 resize-none" {...register('descripcion')}/></div>
          <div className="sm:col-span-2"><ImageField label="Imagen del evento" currentUrl={imgUrl} onFile={f=>{setImgFile(f);setImgUrl('')}} onUrl={u=>{setImgUrl(u);setImgFile(null)}}/></div>
          <div className="sm:col-span-2 flex items-center gap-2"><input type="checkbox" id="pub_ev" {...register('publicado')}/><label htmlFor="pub_ev" className="text-sm">Publicar en calendario público</label></div>
          <div className="sm:col-span-2"><button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">Guardar evento</button></div>
        </form>
      </Modal>
    </div>
  )
}

// ============================================================
// GALERÍA
// ============================================================
export function AdminGaleriaPage() {
  const qc=useQueryClient(); const [albumModal,setAlbumModal]=useState(false); const [editingAlbum,setEditingAlbum]=useState(null); const [selAlbum,setSelAlbum]=useState(null)
  const [confirmAlbum,setConfirmAlbum]=useState(null); const [confirmImg,setConfirmImg]=useState(null); const [uploading,setUploading]=useState(false)
  const [portadaFile,setPortadaFile]=useState(null); const [portadaUrl,setPortadaUrl]=useState('')
  const [showUrlBox,setShowUrlBox]=useState(false); const [newImgUrl,setNewImgUrl]=useState(''); const [newImgTitulo,setNewImgTitulo]=useState('')
  const {register:rA,handleSubmit:hA,reset:resetA}=useForm()
  const {data:albData}=useQuery({queryKey:['alb-admin'],queryFn:()=>api.get('/galeria/albumes?all=1').then(r=>r.data)}); const albumes=albData?.data||[]
  const albumActual=albumes.find(a=>a.id===selAlbum?.id)
  const {data:imgData,isLoading:imgsLoad,refetch:refImg}=useQuery({queryKey:['imgs-admin',selAlbum?.id],enabled:!!selAlbum,queryFn:()=>api.get(`/galeria/albumes/${selAlbum.id}/imagenes?all=1`).then(r=>r.data)})
  const imagenes=imgData?.data||[]
  const openNewAlbum=()=>{setEditingAlbum(null);setPortadaFile(null);setPortadaUrl('');resetA({nombre:'',descripcion:'',publicado:true});setAlbumModal(true)}
  const openEditAlbum=a=>{setEditingAlbum(a);setPortadaUrl(a.portada_url||'');setPortadaFile(null);resetA({nombre:a.nombre,descripcion:a.descripcion||'',publicado:a.publicado});setAlbumModal(true)}
  const albMut=useMutation({
    mutationFn:async d=>{const fd=new FormData();Object.entries(d).forEach(([k,v])=>{if(v!==undefined&&String(v)!=='')fd.append(k,String(v))});if(portadaFile instanceof File)fd.append('portada',portadaFile);else if(portadaUrl)fd.append('portada_url',portadaUrl);const cfg={headers:{'Content-Type':'multipart/form-data'}};return editingAlbum?api.put(`/galeria/albumes/${editingAlbum.id}`,fd,cfg):api.post('/galeria/albumes',fd,cfg)},
    onSuccess:()=>{qc.invalidateQueries(['alb-admin']);setAlbumModal(false);resetA();setEditingAlbum(null);setPortadaFile(null);setPortadaUrl('');toast.success(editingAlbum?'Álbum actualizado':'Álbum creado')}
  })
  const delAlbum=useMutation({mutationFn:id=>api.delete(`/galeria/albumes/${id}`),onSuccess:()=>{qc.invalidateQueries(['alb-admin']);setSelAlbum(null);toast.success('Álbum eliminado')}})
  const delImg=useMutation({mutationFn:galeriaService.eliminar,onSuccess:()=>{refImg();toast.success('Imagen eliminada')}})
  const uploadFiles=async e=>{const files=Array.from(e.target.files);if(!files.length)return;setUploading(true);let ok=0;for(const f of files){try{const fd=new FormData();fd.append('imagen',f);fd.append('album_id',selAlbum.id);await galeriaService.subirImagen(fd);ok++}catch{toast.error(`Error: ${f.name}`)}}refImg();setUploading(false);if(ok)toast.success(`${ok} imagen(es) agregada(s)`)}
  const addUrl=async()=>{if(!newImgUrl.trim())return toast.error('Escribe una URL válida');try{const fd=new FormData();fd.append('imagen_url',newImgUrl.trim());fd.append('album_id',selAlbum.id);if(newImgTitulo)fd.append('titulo',newImgTitulo);await galeriaService.subirImagen(fd);refImg();setNewImgUrl('');setNewImgTitulo('');setShowUrlBox(false);toast.success('Imagen agregada')}catch{toast.error('Error al agregar imagen')}}
  return (
    <div>
      <SectionHeader title="Galería fotográfica" subtitle="Álbumes e imágenes"><button onClick={openNewAlbum} className="btn btn-primary btn-sm"><Plus size={15}/> Nuevo álbum</button></SectionHeader>
      {!selAlbum?(
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {albumes.length===0&&<div className="col-span-full"><EmptyState title="Sin álbumes" subtitle="Crea el primer álbum fotográfico"/></div>}
          {albumes.map(a=>(
            <div key={a.id} className="card overflow-hidden group">
              <div className="h-44 bg-gray-100 overflow-hidden cursor-pointer" onClick={()=>setSelAlbum(a)}>
                {a.portada_url?<img src={a.portada_url} alt={a.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e=>e.target.style.display='none'}/>:<div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">Sin portada</div>}
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm">{a.nombre}</p>
                {a.descripcion&&<p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{a.descripcion}</p>}
                <p className="text-xs text-gray-400 mt-1">{a.total_imagenes||0} imágenes · {a.publicado?'Publicado':'Borrador'}</p>
                <div className="flex items-center justify-between mt-2">
                  <button onClick={()=>setSelAlbum(a)} className="text-secondary text-xs hover:underline">Ver imágenes →</button>
                  <div className="flex gap-1"><button onClick={()=>openEditAlbum(a)} className="btn btn-ghost btn-sm p-1" title="Editar"><Pencil size={13}/></button><button onClick={()=>setConfirmAlbum(a.id)} className="btn btn-ghost btn-sm p-1 text-red-500" title="Eliminar"><Trash2 size={13}/></button></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ):(
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3"><button onClick={()=>setSelAlbum(null)} className="btn btn-ghost btn-sm">← Álbumes</button><div className="w-px h-4 bg-gray-200"/><div><p className="font-semibold text-sm">{albumActual?.nombre}</p>{albumActual?.descripcion&&<p className="text-xs text-gray-400">{albumActual.descripcion}</p>}</div></div>
            <div className="flex gap-2">
              <label className={`btn btn-secondary btn-sm cursor-pointer ${uploading?'opacity-50':''}`}><Upload size={13}/> {uploading?'Subiendo...':'Subir fotos'}<input type="file" multiple accept="image/*" className="hidden" onChange={uploadFiles} disabled={uploading}/></label>
              <button onClick={()=>setShowUrlBox(!showUrlBox)} className="btn btn-ghost btn-sm border border-dashed border-gray-300"><Link2 size={13}/> Pegar URL</button>
            </div>
          </div>
          {showUrlBox&&(<div className="card p-3 mb-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <input className="input flex-1" type="url" placeholder="https://..." value={newImgUrl} onChange={e=>setNewImgUrl(e.target.value)}/>
            <input className="input sm:w-44" placeholder="Título (opcional)" value={newImgTitulo} onChange={e=>setNewImgTitulo(e.target.value)}/>
            <button onClick={addUrl} className="btn btn-primary btn-sm flex-shrink-0">Agregar</button>
            <button onClick={()=>setShowUrlBox(false)} className="btn btn-ghost btn-sm flex-shrink-0"><X size={14}/></button>
          </div>)}
          {imgsLoad?<LoadingCenter/>:imagenes.length===0?<div className="text-center py-12"><p className="text-gray-400 text-sm">Sin imágenes — sube fotos o agrega URLs</p></div>:(
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {imagenes.map(img=>(
                <div key={img.id} className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square">
                  <img src={img.thumbnail_url||img.url} alt={img.titulo||''} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={e=>e.target.style.display='none'}/>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={()=>setConfirmImg(img.id)} className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white"><Trash2 size={13}/></button>
                  </div>
                  {img.titulo&&<div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1"><p className="text-white text-xs truncate">{img.titulo}</p></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <ConfirmDialog open={!!confirmAlbum} onClose={()=>setConfirmAlbum(null)} onConfirm={()=>{delAlbum.mutate(confirmAlbum);setConfirmAlbum(null)}} title="Eliminar álbum" message="¿Eliminar este álbum y todas sus imágenes?"/>
      <ConfirmDialog open={!!confirmImg} onClose={()=>setConfirmImg(null)} onConfirm={()=>{delImg.mutate(confirmImg);setConfirmImg(null)}} title="Eliminar imagen" message="¿Eliminar esta imagen?"/>
      <Modal open={albumModal} onClose={()=>setAlbumModal(false)} title={editingAlbum?'Editar álbum':'Nuevo álbum'}>
        <form onSubmit={hA(d=>albMut.mutate(d))} className="space-y-3">
          <div><label className="label">Nombre del álbum *</label><input className="input" {...rA('nombre',{required:true})}/></div>
          <div><label className="label">Descripción</label><textarea className="input h-20 resize-none" {...rA('descripcion')}/></div>
          <ImageField label="Imagen de portada" currentUrl={portadaUrl} onFile={f=>{setPortadaFile(f);setPortadaUrl('')}} onUrl={u=>{setPortadaUrl(u);setPortadaFile(null)}}/>
          <div className="flex items-center gap-2"><input type="checkbox" id="pub_alb" {...rA('publicado')}/><label htmlFor="pub_alb" className="text-sm">Publicar álbum</label></div>
          <button type="submit" className="btn btn-primary w-full">Guardar álbum</button>
        </form>
      </Modal>
    </div>
  )
}

// ============================================================
// MALLA CURRICULAR
// ============================================================
export function AdminMallaPage() {
  const qc=useQueryClient(); const [editing,setEditing]=useState(null); const [newModal,setNewModal]=useState(false); const [confirmId,setConfirmId]=useState(null)
  const {data,isLoading}=useQuery({queryKey:['mat-admin'],queryFn:()=>materiasService.getAll('2023')}); const materias=data?.data?.data||[]
  const bySem={}; for(let i=1;i<=10;i++) bySem[i]=materias.filter(m=>m.semestre===i)
  const {register:rE,handleSubmit:hE,reset:resetE}=useForm()
  const {register:rN,handleSubmit:hN,reset:resetN}=useForm()
  useEffect(()=>{if(editing)resetE({nombre:editing.nombre,creditos:editing.creditos||'',area:editing.area||'',tipo:editing.tipo||'obligatoria'})},[editing,resetE])
  const editMut=useMutation({mutationFn:({id,...d})=>materiasService.update(id,d),onSuccess:()=>{qc.invalidateQueries(['mat-admin']);toast.success('Actualizada');setEditing(null)}})
  const newMut=useMutation({mutationFn:d=>api.post('/materias',d),onSuccess:()=>{qc.invalidateQueries(['mat-admin']);toast.success('Materia creada');setNewModal(false);resetN()}})
  const delMut=useMutation({mutationFn:id=>api.delete(`/materias/${id}`),onSuccess:()=>{qc.invalidateQueries(['mat-admin']);toast.success('Desactivada')}})
  return (
    <div>
      <SectionHeader title="Malla curricular — Pensum 2023" subtitle={`${materias.length} materias`}><button onClick={()=>setNewModal(true)} className="btn btn-primary btn-sm"><Plus size={15}/> Nueva materia</button></SectionHeader>
      {isLoading?<LoadingCenter/>:(
        <div className="overflow-x-auto pb-4"><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 min-w-[640px]">
          {Object.entries(bySem).map(([sem,ms])=>(<div key={sem}>
            <div className="bg-secondary text-white text-center text-xs font-bold py-2.5 rounded-t-xl">Semestre {sem}</div>
            <div className="space-y-1.5">{ms.length===0?<div className="card p-3 text-center text-xs text-gray-300">—</div>:ms.map(m=>(
              <div key={m.id} className="card p-2.5 group hover:border-primary transition-colors cursor-pointer" onClick={()=>setEditing(m)}>
                <p className="text-xs font-semibold text-gray-700 line-clamp-2 leading-snug">{m.nombre}</p>
                {m.creditos&&<p className="text-xs text-gray-400 mt-0.5">{m.creditos} cred.</p>}
                <div className="flex gap-1.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-secondary text-xs cursor-pointer">Editar</span>
                  <button onClick={e=>{e.stopPropagation();setConfirmId(m.id)}} className="text-red-400 text-xs ml-auto">Quitar</button>
                </div>
              </div>
            ))}</div>
          </div>))}
        </div></div>
      )}
      <ConfirmDialog open={!!confirmId} onClose={()=>setConfirmId(null)} onConfirm={()=>{delMut.mutate(confirmId);setConfirmId(null)}} title="Desactivar materia" message="¿Quitar esta materia de la malla?"/>
      {editing&&(<Modal open={!!editing} onClose={()=>setEditing(null)} title={`Editar: ${editing.nombre}`}>
        <form onSubmit={hE(d=>editMut.mutate({id:editing.id,...d}))} className="space-y-3">
          <div><label className="label">Nombre</label><input className="input" {...rE('nombre')}/></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Créditos</label><input className="input" type="number" {...rE('creditos')}/></div><div><label className="label">Tipo</label><select className="input" {...rE('tipo')}><option value="obligatoria">Obligatoria</option><option value="electiva">Electiva</option><option value="taller">Taller</option></select></div></div>
          <div><label className="label">Área temática</label><input className="input" {...rE('area')}/></div>
          <button type="submit" className="btn btn-primary w-full">Guardar cambios</button>
        </form>
      </Modal>)}
      <Modal open={newModal} onClose={()=>setNewModal(false)} title="Nueva materia">
        <form onSubmit={hN(d=>newMut.mutate(d))} className="space-y-3">
          <div><label className="label">Nombre *</label><input className="input" {...rN('nombre',{required:true})}/></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Semestre (1-10) *</label><input className="input" type="number" min="1" max="10" {...rN('semestre',{required:true})}/></div><div><label className="label">Créditos</label><input className="input" type="number" {...rN('creditos')}/></div></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Área</label><input className="input" {...rN('area')}/></div><div><label className="label">Tipo</label><select className="input" {...rN('tipo')}><option value="obligatoria">Obligatoria</option><option value="electiva">Electiva</option><option value="taller">Taller</option></select></div></div>
          <button type="submit" className="btn btn-primary w-full">Crear materia</button>
        </form>
      </Modal>
    </div>
  )
}

// ============================================================
// CONTENIDO INSTITUCIONAL
// ============================================================
export function AdminInstitucionalPage() {
  const qc=useQueryClient(); const [editing,setEditing]=useState(null)
  const claves=['mision','vision','historia','pensum_info']
  const queries=claves.map(c=>useQuery({queryKey:['inst-adm',c],queryFn:()=>institucionalService.get(c)}))
  const {register,handleSubmit,setValue,formState:{isSubmitting}}=useForm()
  const save=useMutation({mutationFn:({clave,...d})=>institucionalService.update(clave,d),onSuccess:()=>{claves.forEach(c=>qc.invalidateQueries(['inst-adm',c]));toast.success('Actualizado');setEditing(null)}})
  const openEdit=(item,clave)=>{setEditing({...item,clave});setValue('titulo',item.titulo||'');setValue('contenido',item.contenido||'')}
  return (
    <div>
      <SectionHeader title="Contenido institucional" subtitle="Misión, visión, historia, pensum"/>
      <div className="grid sm:grid-cols-2 gap-4">
        {queries.map((q,i)=>{const item=q.data?.data?.data;return item?(<div key={claves[i]} className="card p-5"><h3 className="font-bold text-secondary mb-2">{item.titulo||claves[i]}</h3><p className="text-sm text-gray-600 line-clamp-3">{item.contenido}</p><div className="flex items-center justify-between mt-3"><p className="text-xs text-gray-400">Actualizado: {formatDate(item.actualizado_en)}</p><button onClick={()=>openEdit(item,claves[i])} className="btn btn-outline btn-sm"><Pencil size={12}/> Editar</button></div></div>):(<div key={claves[i]} className="card p-4 h-32 animate-pulse bg-gray-50"/>)})}
      </div>
      <Modal open={!!editing} onClose={()=>setEditing(null)} title={`Editar: ${editing?.titulo||editing?.clave}`} size="lg">
        <form onSubmit={handleSubmit(d=>save.mutate({...d,clave:editing.clave}))} className="space-y-3">
          <div><label className="label">Título de la sección</label><input className="input" {...register('titulo')}/></div>
          <div><label className="label">Contenido *</label><textarea className="input h-48 resize-y" {...register('contenido',{required:true})}/></div>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">Guardar cambios</button>
        </form>
      </Modal>
    </div>
  )
}

// ============================================================
// CONVOCATORIAS
// ============================================================
export function AdminConvocatoriasPage() {
  const qc=useQueryClient(); const [filtro,setFiltro]=useState('todos'); const [modal,setModal]=useState(false); const [editing,setEditing]=useState(null); const [confirmId,setConfirmId]=useState(null)
  const [pdfFile,setPdfFile]=useState(null); const pdfRef=useRef(null)
  const {data,isLoading}=useQuery({queryKey:['conv-admin'],queryFn:()=>api.get('/convocatorias?all=1').then(r=>r.data)}); const all=data?.data||[]; const list=filtrar(all,filtro)
  const {register,handleSubmit,reset,formState:{isSubmitting}}=useForm()
  const openEdit=c=>{setEditing(c);setPdfFile(null);reset({titulo:c.titulo||'',tipo:c.tipo||'otro',descripcion:c.descripcion||'',fecha_limite:c.fecha_limite||'',archivo_url:c.archivo_url||'',publicado:c.publicado});setModal(true)}
  const openNew=()=>{setEditing(null);setPdfFile(null);reset({titulo:'',tipo:'otro',descripcion:'',fecha_limite:'',archivo_url:'',publicado:true});setModal(true)}
  const save=useMutation({
    mutationFn:async d=>{const fd=new FormData();Object.entries(d).forEach(([k,v])=>{if(v!==undefined&&String(v)!=='')fd.append(k,String(v))});if(pdfFile)fd.append('archivo',pdfFile);const cfg={headers:{'Content-Type':'multipart/form-data'}};return editing?api.put(`/convocatorias/${editing.id}`,fd,cfg):api.post('/convocatorias',fd,cfg)},
    onSuccess:()=>{qc.invalidateQueries(['conv-admin']);toast.success('Guardada');setModal(false)}
  })
  const pub=useMutation({mutationFn:c=>api.put(`/convocatorias/${c.id}`,{publicado:!c.publicado}),onSuccess:()=>{qc.invalidateQueries(['conv-admin']);toast.success('Estado actualizado')}})
  const del=useMutation({mutationFn:id=>api.delete(`/convocatorias/${id}`),onSuccess:()=>{qc.invalidateQueries(['conv-admin']);toast.success('Eliminada')}})
  return (
    <div>
      <SectionHeader title="Convocatorias" subtitle={`${all.length} registros`}><button onClick={openNew} className="btn btn-primary btn-sm"><Plus size={15}/> Nueva convocatoria</button></SectionHeader>
      <div className="flex items-center gap-3 mb-4 flex-wrap"><FiltroEstado value={filtro} onChange={setFiltro}/><span className="text-xs text-gray-400 ml-auto">{list.length} resultados</span></div>
      {isLoading?<LoadingCenter/>:(<div className="space-y-3">
        {list.length===0&&<EmptyState title="Sin convocatorias"/>}
        {list.map(c=>(<div key={c.id} className="card p-4"><div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 mb-1"><Badge color="#C0392B">{c.tipo}</Badge><EstadoBadge publicado={c.publicado} onClick={()=>pub.mutate(c)}/></div>
            <p className="font-semibold text-gray-800">{c.titulo}</p>
            {c.fecha_limite&&<p className="text-xs text-primary mt-0.5">Hasta: {formatDate(c.fecha_limite)}</p>}
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.descripcion}</p>
            {c.archivo_url&&<a href={c.archivo_url} target="_blank" rel="noreferrer" download className="text-xs text-secondary hover:underline mt-1 block">Descargar documento</a>}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={()=>openEdit(c)} className="btn btn-ghost btn-sm p-1.5" title="Editar"><Pencil size={14}/></button>
            <button onClick={()=>setConfirmId(c.id)} className="btn btn-ghost btn-sm p-1.5 text-red-500" title="Eliminar"><Trash2 size={14}/></button>
          </div>
        </div></div>))}
      </div>)}
      <ConfirmDialog open={!!confirmId} onClose={()=>setConfirmId(null)} onConfirm={()=>{del.mutate(confirmId);setConfirmId(null)}} title="Eliminar convocatoria" message="¿Eliminar esta convocatoria?"/>
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Editar convocatoria':'Nueva convocatoria'} size="lg">
        <form onSubmit={handleSubmit(d=>save.mutate(d))} className="space-y-3">
          <div><label className="label">Título *</label><input className="input" {...register('titulo',{required:true})}/></div>
          <div><label className="label">Tipo</label><select className="input" {...register('tipo')}>{['docentes','pasantias','investigacion','becas','otro'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="label">Descripción *</label><textarea className="input h-28 resize-none" {...register('descripcion',{required:true})}/></div>
          <div><label className="label">Fecha límite</label><input className="input" type="date" {...register('fecha_limite')}/></div>
          <div>
            <label className="label">Documento PDF</label>
            <div className="flex gap-2 mb-2"><button type="button" onClick={()=>pdfRef.current?.click()} className="btn btn-ghost btn-sm border border-dashed border-gray-300"><Upload size={13}/> {pdfFile?.name||'Subir PDF'}</button>{editing?.archivo_url&&!pdfFile&&<a href={editing.archivo_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm text-secondary text-xs">Ver actual</a>}</div>
            <input type="file" ref={pdfRef} accept=".pdf,.doc,.docx" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)setPdfFile(f)}}/>
            <input className="input text-xs" type="url" placeholder="O pega URL del documento..." {...register('archivo_url')}/>
          </div>
          <div className="flex items-center gap-2"><input type="checkbox" id="pub_c" {...register('publicado')}/><label htmlFor="pub_c" className="text-sm">Publicar inmediatamente</label></div>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">Guardar convocatoria</button>
        </form>
      </Modal>
    </div>
  )
}

// ============================================================
// TRÁMITES
// ============================================================
export function AdminTramitesPage() {
  const qc=useQueryClient(); const [modal,setModal]=useState(false); const [editing,setEditing]=useState(null); const [confirmId,setConfirmId]=useState(null)
  const [pdfFile,setPdfFile]=useState(null); const pdfRef=useRef(null)
  const {data,isLoading}=useQuery({queryKey:['tr-admin'],queryFn:()=>api.get('/tramites?all=1').then(r=>r.data)}); const list=data?.data||[]
  const {register,handleSubmit,reset,formState:{isSubmitting}}=useForm()
  const openEdit=t=>{setEditing(t);setPdfFile(null);reset({nombre:t.nombre||'',descripcion:t.descripcion||'',contacto:t.contacto||'',archivo_url:t.archivo_url||''});setModal(true)}
  const openNew=()=>{setEditing(null);setPdfFile(null);reset({nombre:'',descripcion:'',contacto:'',archivo_url:''});setModal(true)}
  const save=useMutation({
    mutationFn:async d=>{const fd=new FormData();Object.entries(d).forEach(([k,v])=>{if(v!==undefined&&String(v)!=='')fd.append(k,String(v))});if(pdfFile)fd.append('archivo',pdfFile);const cfg={headers:{'Content-Type':'multipart/form-data'}};return editing?api.put(`/tramites/${editing.id}`,fd,cfg):api.post('/tramites',fd,cfg)},
    onSuccess:()=>{qc.invalidateQueries(['tr-admin']);toast.success('Guardado');setModal(false)}
  })
  const del=useMutation({mutationFn:id=>api.delete(`/tramites/${id}`),onSuccess:()=>{qc.invalidateQueries(['tr-admin']);toast.success('Desactivado')}})
  return (
    <div>
      <SectionHeader title="Trámites académicos" subtitle={`${list.length} trámites`}><button onClick={openNew} className="btn btn-primary btn-sm"><Plus size={15}/> Agregar trámite</button></SectionHeader>
      {isLoading?<LoadingCenter/>:(<div className="space-y-3">
        {list.length===0&&<EmptyState title="Sin trámites"/>}
        {list.map(t=>(<div key={t.id} className="card p-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0"><p className="font-semibold text-gray-800">{t.nombre}</p>{t.descripcion&&<p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{t.descripcion}</p>}{t.contacto&&<p className="text-xs text-secondary mt-1">Contacto: {t.contacto}</p>}{t.archivo_url&&<a href={t.archivo_url} target="_blank" rel="noreferrer" download className="text-xs text-primary hover:underline">Descargar formulario</a>}</div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={()=>openEdit(t)} className="btn btn-ghost btn-sm p-1.5" title="Editar"><Pencil size={14}/></button>
            <button onClick={()=>setConfirmId(t.id)} className="btn btn-ghost btn-sm p-1.5 text-red-500" title="Eliminar"><Trash2 size={14}/></button>
          </div>
        </div>))}
      </div>)}
      <ConfirmDialog open={!!confirmId} onClose={()=>setConfirmId(null)} onConfirm={()=>{del.mutate(confirmId);setConfirmId(null)}} title="Desactivar trámite" message="¿Desactivar este trámite?"/>
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Editar trámite':'Nuevo trámite'} size="lg">
        <form onSubmit={handleSubmit(d=>save.mutate(d))} className="space-y-3">
          <div><label className="label">Nombre del trámite *</label><input className="input" {...register('nombre',{required:true})}/></div>
          <div><label className="label">Descripción y requisitos</label><textarea className="input h-24 resize-none" {...register('descripcion')}/></div>
          <div><label className="label">Contacto responsable</label><input className="input" {...register('contacto')}/></div>
          <div>
            <label className="label">Formulario PDF</label>
            <div className="flex gap-2 mb-1"><button type="button" onClick={()=>pdfRef.current?.click()} className="btn btn-ghost btn-sm border border-dashed border-gray-300"><Upload size={13}/> {pdfFile?.name||'Subir PDF'}</button>{editing?.archivo_url&&!pdfFile&&<a href={editing.archivo_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm text-secondary text-xs">Ver actual</a>}</div>
            <input type="file" ref={pdfRef} accept=".pdf" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)setPdfFile(f)}}/>
            <input className="input text-xs" type="url" placeholder="O pega URL del PDF..." {...register('archivo_url')}/>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">Guardar trámite</button>
        </form>
      </Modal>
    </div>
  )
}

// ============================================================
// USUARIOS
// ============================================================
export function AdminUsuariosPage() {
  const qc=useQueryClient(); const [createModal,setCreateModal]=useState(false); const [passModal,setPassModal]=useState(null); const [showPass,setShowPass]=useState(false)
  const {data,isLoading}=useQuery({queryKey:['usr-admin'],queryFn:usuariosService.getAll}); const list=data?.data?.data||[]
  const {register:rC,handleSubmit:hC,reset:resetC}=useForm()
  const {register:rP,handleSubmit:hP,reset:resetP}=useForm()
  const createMut=useMutation({mutationFn:usuariosService.create,onSuccess:res=>{qc.invalidateQueries(['usr-admin']);const tmp=res.data?.data?.temp_password;toast.success(`Usuario creado${tmp?`. Contraseña temporal: ${tmp}`:''}`);setCreateModal(false);resetC()},onError:e=>toast.error(e.response?.data?.message||'Error')})
  const updateMut=useMutation({mutationFn:({id,...d})=>usuariosService.update(id,d),onSuccess:()=>{qc.invalidateQueries(['usr-admin']);toast.success('Actualizado')}})
  const passMut=useMutation({mutationFn:({id,nueva_password})=>api.post(`/usuarios/${id}/reset-password`,{nueva_password}),onSuccess:()=>{toast.success('Contraseña actualizada');setPassModal(null);resetP()},onError:e=>toast.error(e.response?.data?.message||'Error')})
  return (
    <div>
      <SectionHeader title="Gestión de usuarios" subtitle="Solo el superadmin puede gestionar usuarios"><button onClick={()=>setCreateModal(true)} className="btn btn-primary btn-sm"><Plus size={15}/> Nuevo usuario</button></SectionHeader>
      {isLoading?<LoadingCenter/>:(<div className="card overflow-hidden"><table className="table-pro w-full">
        <thead><tr><th>Usuario</th><th className="hidden sm:table-cell">Correo</th><th>Rol</th><th>Estado</th><th className="text-right pr-4">Contraseña</th></tr></thead>
        <tbody>
          {list.map(u=>(<tr key={u.id}>
            <td><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">{u.nombre.charAt(0).toUpperCase()}</div><p className="font-medium text-sm">{u.nombre}</p></div></td>
            <td className="hidden sm:table-cell text-gray-500 text-sm">{u.email}</td>
            <td><select className="text-xs border rounded-lg px-2 py-1 bg-white" defaultValue={u.rol} onChange={e=>updateMut.mutate({id:u.id,rol:e.target.value})}>{['superadmin','admin','editor'].map(r=><option key={r} value={r}>{r}</option>)}</select></td>
            <td><button onClick={()=>updateMut.mutate({id:u.id,activo:!u.activo})} className={`badge cursor-pointer text-xs ${u.activo?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{u.activo?'Activo':'Inactivo'}</button></td>
            <td className="text-right pr-4"><button onClick={()=>{setPassModal(u);resetP()}} className="btn btn-ghost btn-sm text-xs flex items-center gap-1"><RefreshCw size={13}/> Cambiar</button></td>
          </tr>))}
        </tbody>
      </table></div>)}
      <Modal open={createModal} onClose={()=>setCreateModal(false)} title="Nuevo usuario administrador">
        <form onSubmit={hC(d=>createMut.mutate(d))} className="space-y-3">
          <div><label className="label">Nombre completo *</label><input className="input" {...rC('nombre',{required:true})}/></div>
          <div><label className="label">Correo electrónico *</label><input className="input" type="email" {...rC('email',{required:true})}/></div>
          <div><label className="label">Rol *</label><select className="input" {...rC('rol',{required:true})}><option value="editor">Editor — crea borradores de noticias</option><option value="admin">Admin — gestiona todo el contenido</option><option value="superadmin">Superadmin — acceso total</option></select></div>
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-secondary">Se mostrará la contraseña temporal en pantalla al crear el usuario.</div>
          <button type="submit" className="btn btn-primary w-full">Crear usuario</button>
        </form>
      </Modal>
      {passModal&&(<Modal open={!!passModal} onClose={()=>setPassModal(null)} title={`Cambiar contraseña — ${passModal.nombre}`} size="sm">
        <form onSubmit={hP(d=>passMut.mutate({id:passModal.id,...d}))} className="space-y-3">
          <p className="text-sm text-gray-500">Se enviará un correo a <strong>{passModal.email}</strong></p>
          <div><label className="label">Nueva contraseña *</label>
            <div className="relative"><input className="input pr-10" type={showPass?'text':'password'} placeholder="Mínimo 6 caracteres" {...rP('nueva_password',{required:true,minLength:6})}/>
              <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass?<EyeOff size={15}/>:<Eye size={15}/>}</button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full"><RefreshCw size={14}/> Actualizar contraseña</button>
        </form>
      </Modal>)}
    </div>
  )
}

