// AdminTransparenciaPage.jsx — Página de administración de Transparencia Institucional
// Importar en App.jsx y agregar ruta /admin/transparencia

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { LoadingCenter, EmptyState, Modal, ConfirmDialog, SectionHeader, Badge } from '../../components/ui/UI'
import { formatDate } from '../../utils/helpers'
import api from '../../services/api'
import { Plus, Pencil, Trash2, Upload, Download, Eye } from 'lucide-react'

function parseBool(v) {
  if (v===true||v===1||v==='1') return true
  if (v===false||v===0||v==='0') return false
  if (typeof v==='string') { const s=v.toLowerCase().trim(); return s==='true'||s==='t'||s==='yes' }
  return false
}

const TIPOS = [
  ['reglamento','📋 Reglamento'],
  ['resolucion','📜 Resolución'],
  ['acta','📝 Acta'],
  ['convocatoria','📢 Convocatoria'],
  ['informe','📊 Informe de gestión'],
  ['plan','🗓️ Plan estratégico'],
  ['otro','📄 Otro'],
]

const TIPO_COLOR = {
  reglamento:'#1A5276', resolucion:'#C0392B', acta:'#27AE60',
  convocatoria:'#F39C12', informe:'#8E44AD', plan:'#16A085', otro:'#7F8C8D'
}

export default function AdminTransparenciaPage() {
  const qc = useQueryClient()
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [pdfFile, setPdfFile]     = useState(null)
  const [pdfUrl,  setPdfUrl]      = useState('')
  const pdfRef = useRef(null)

  const { data, isLoading } = useQuery({
    queryKey: ['transp-admin'],
    queryFn:  () => api.get('/transparencia?all=1').then(r => r.data),
  })
  const all  = data?.data || []
  const list = filtroTipo ? all.filter(d => d.tipo === filtroTipo) : all

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const openEdit = d => {
    setEditing(d); setPdfFile(null); setPdfUrl(d.archivo_url || '')
    reset({
      titulo:       d.titulo       || '',
      tipo:         d.tipo         || 'otro',
      descripcion:  d.descripcion  || '',
      publicado_en: d.publicado_en || '',
      publicado:    parseBool(d.publicado),
    })
    setModal(true)
  }
  const openNew = () => {
    setEditing(null); setPdfFile(null); setPdfUrl('')
    reset({ titulo: '', tipo: 'otro', descripcion: '', publicado_en: new Date().toISOString().slice(0,10), publicado: true })
    setModal(true)
  }

  const save = useMutation({
    mutationFn: async d => {
      const fd = new FormData()
      Object.entries(d).forEach(([k,v]) => {
        if (v !== undefined && String(v) !== '') fd.append(k, String(v))
      })
      if (pdfFile instanceof File) fd.append('archivo', pdfFile)
      else if (pdfUrl?.trim())     fd.append('archivo_url', pdfUrl.trim())
      const cfg = {}
      return editing
        ? api.put(`/transparencia/${editing.id}`, fd, cfg)
        : api.post('/transparencia', fd, cfg)
    },
    onSuccess: () => {
      qc.invalidateQueries(['transp-admin'])
      toast.success(editing ? 'Documento actualizado' : 'Documento agregado')
      setModal(false)
    },
    onError: e => toast.error(e.response?.data?.message || 'Error al guardar'),
  })

  const del = useMutation({
    mutationFn: id => api.delete(`/transparencia/${id}`),
    onSuccess: () => { qc.invalidateQueries(['transp-admin']); toast.success('Eliminado') },
  })

  const togglePublicado = useMutation({
    mutationFn: d => api.put(`/transparencia/${d.id}`, { publicado: !parseBool(d.publicado) }),
    onSuccess: () => { qc.invalidateQueries(['transp-admin']); toast.success('Estado actualizado') },
  })

  return (
    <div>
      <SectionHeader
        title="Transparencia institucional"
        subtitle={`${all.length} documentos — Reglamentos, resoluciones e informes`}>
        <button onClick={openNew} className="btn btn-primary btn-sm">
          <Plus size={15}/> Agregar documento
        </button>
      </SectionHeader>

      {/* Filtro por tipo */}
      <div className="flex flex-wrap gap-1.5 mb-4 items-center">
        <button onClick={() => setFiltroTipo('')}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${!filtroTipo?'bg-secondary text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Todos
        </button>
        {TIPOS.map(([v,l]) => (
          <button key={v} onClick={() => setFiltroTipo(v)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${filtroTipo===v?'bg-secondary text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {l}
          </button>
        ))}
        <span className="text-xs text-gray-400 ml-auto">{list.length} resultados</span>
      </div>

      {isLoading ? <LoadingCenter/> : list.length===0 ? (
        <EmptyState
          title="Sin documentos"
          subtitle="Agrega reglamentos, resoluciones e informes de gestión"/>
      ) : (
        <div className="card overflow-hidden">
          <table className="table-pro w-full">
            <thead>
              <tr>
                <th>Documento</th>
                <th className="hidden sm:table-cell">Tipo</th>
                <th className="hidden md:table-cell">Fecha</th>
                <th>Estado</th>
                <th className="text-right pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{doc.titulo}</p>
                      {doc.descripcion && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{doc.descripcion}</p>}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell">
                    <Badge color={TIPO_COLOR[doc.tipo]||'#7F8C8D'}>{doc.tipo}</Badge>
                  </td>
                  <td className="hidden md:table-cell text-gray-500 text-sm">
                    {formatDate(doc.publicado_en)}
                  </td>
                  <td>
                    <button
                      onClick={() => togglePublicado.mutate(doc)}
                      className={`badge cursor-pointer text-xs font-semibold select-none transition-colors ${
                        parseBool(doc.publicado)
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}>
                      {parseBool(doc.publicado) ? '● Publicado' : '○ Borrador'}
                    </button>
                  </td>
                  <td className="text-right pr-4">
                    <div className="flex gap-1.5 justify-end items-center">
                      {doc.archivo_url && (
                        <a href={doc.archivo_url} target="_blank" rel="noreferrer"
                          className="btn btn-ghost btn-sm p-1.5 text-secondary" title="Ver documento">
                          <Eye size={14}/>
                        </a>
                      )}
                      <button onClick={() => openEdit(doc)} className="btn btn-ghost btn-sm p-1.5" title="Editar">
                        <Pencil size={14}/>
                      </button>
                      <button onClick={() => setConfirmId(doc.id)} className="btn btn-ghost btn-sm p-1.5 text-red-500" title="Eliminar">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => { del.mutate(confirmId); setConfirmId(null) }}
        title="Eliminar documento"
        message="¿Eliminar este documento de transparencia permanentemente?"/>

      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Editar documento' : 'Nuevo documento de transparencia'}
        size="lg">
        <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-3">
          <div>
            <label className="label">Título del documento *</label>
            <input className="input" placeholder="Ej: Reglamento de Titulación 2024" {...register('titulo',{required:true})}/>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo de documento</label>
              <select className="input" {...register('tipo')}>
                {TIPOS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fecha de publicación</label>
              <input className="input" type="date" {...register('publicado_en')}/>
            </div>
          </div>
          <div>
            <label className="label">Descripción breve</label>
            <textarea className="input h-20 resize-none" placeholder="Describe brevemente el contenido del documento..." {...register('descripcion')}/>
          </div>

          {/* Archivo: subir o URL */}
          <div>
            <label className="label">Archivo del documento</label>
            <div className="flex gap-2 mb-2 flex-wrap items-center">
              <button type="button" onClick={() => pdfRef.current?.click()}
                className="btn btn-ghost btn-sm border border-dashed border-gray-300">
                <Upload size={13}/> {pdfFile?.name || 'Subir PDF / DOC'}
              </button>
              {editing?.archivo_url && !pdfFile && (
                <a href={editing.archivo_url} target="_blank" rel="noreferrer"
                  className="btn btn-ghost btn-sm text-secondary text-xs">
                  <Eye size={13}/> Ver actual
                </a>
              )}
              {pdfFile && (
                <button type="button" onClick={() => { setPdfFile(null) }}
                  className="text-xs text-red-500 hover:underline">✕ quitar</button>
              )}
            </div>
            <input type="file" ref={pdfRef} accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden"
              onChange={e => { const f=e.target.files?.[0]; if(f){setPdfFile(f);setPdfUrl('')} }}/>
            <input className="input text-xs" type="url"
              placeholder="O pega el enlace directo al documento (Google Drive, etc.)..."
              value={pdfUrl} onChange={e => { setPdfUrl(e.target.value); setPdfFile(null) }}/>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="pub_transp" {...register('publicado')}/>
            <label htmlFor="pub_transp" className="text-sm">Publicar inmediatamente</label>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
            {isSubmitting ? 'Guardando...' : editing ? 'Actualizar documento' : 'Agregar documento'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
