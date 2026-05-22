import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { SectionHeader } from '../../components/ui/UI'
import api from '../../services/api'
import { Eye, EyeOff, User, Mail, Phone, Shield, Key } from 'lucide-react'

export default function AdminPerfilPage() {
  const { usuario, refreshUsuario } = useAuth()
  const qc = useQueryClient()
  const [showActual, setShowActual] = useState(false)
  const [showNueva,  setShowNueva]  = useState(false)

  // ── Formulario datos personales
  const {
    register: rD,
    handleSubmit: hD,
    formState: { isSubmitting: loadingDatos },
  } = useForm({
    defaultValues: {
      nombre:    usuario?.nombre    || '',
      telefono:  usuario?.telefono  || '',
    },
  })

  // ── Formulario cambio de contraseña
  const {
    register: rP,
    handleSubmit: hP,
    reset: resetPass,
    watch,
    formState: { isSubmitting: loadingPass, errors: errPass },
  } = useForm()

  const guardarDatos = useMutation({
    mutationFn: (d) => api.put(`/usuarios/${usuario.id}`, d),
    onSuccess: () => {
      toast.success('Datos actualizados')
      refreshUsuario()
      qc.invalidateQueries(['usr-admin'])
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  })

  const cambiarPass = useMutation({
    mutationFn: (d) => api.post('/auth/cambiar-password', {
      password_actual: d.password_actual,
      password_nueva:  d.password_nueva,
    }),
    onSuccess: () => {
      toast.success('Contraseña actualizada correctamente')
      resetPass()
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Contraseña actual incorrecta'),
  })

  return (
    <div className="max-w-2xl">
      <SectionHeader title="Mi perfil" subtitle="Administra tu cuenta y contraseña" />

      {/* ── Info de la cuenta ──────────────────────────── */}
      <div className="card p-5 mb-5">
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {usuario?.nombre?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{usuario?.nombre}</p>
            <p className="text-gray-500 text-sm">{usuario?.email}</p>
            <span className="badge bg-secondary text-white text-xs capitalize mt-1">
              {usuario?.rol}
            </span>
          </div>
        </div>

        {/* Datos no editables */}
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <Mail size={15} className="text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Correo</p>
              <p className="text-sm font-medium text-gray-700">{usuario?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <Shield size={15} className="text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Rol asignado</p>
              <p className="text-sm font-medium text-gray-700 capitalize">{usuario?.rol}</p>
            </div>
          </div>
        </div>

        {/* Formulario datos editables */}
        <form onSubmit={hD((d) => guardarDatos.mutate(d))} className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <User size={14} /> Datos personales
          </p>
          <div>
            <label className="label">Nombre para mostrar</label>
            <input className="input" {...rD('nombre', { required: true })} />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input className="input" type="tel" placeholder="Ej: 70000000" {...rD('telefono')} />
          </div>
          <button
            type="submit"
            disabled={loadingDatos}
            className="btn btn-secondary btn-sm"
          >
            {loadingDatos ? 'Guardando...' : 'Guardar datos'}
          </button>
        </form>
      </div>

      {/* ── Cambiar contraseña ─────────────────────────── */}
      <div className="card p-5">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
          <Key size={14} /> Cambiar contraseña
        </p>

        <form onSubmit={hP((d) => cambiarPass.mutate(d))} className="space-y-3">
          {/* Contraseña actual */}
          <div>
            <label className="label">Contraseña actual *</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showActual ? 'text' : 'password'}
                placeholder="Tu contraseña actual"
                {...rP('password_actual', { required: 'Requerido' })}
              />
              <button
                type="button"
                onClick={() => setShowActual(!showActual)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showActual ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errPass.password_actual && (
              <p className="text-red-500 text-xs mt-1">{errPass.password_actual.message}</p>
            )}
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="label">Nueva contraseña *</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showNueva ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                {...rP('password_nueva', {
                  required: 'Requerido',
                  minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                })}
              />
              <button
                type="button"
                onClick={() => setShowNueva(!showNueva)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showNueva ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errPass.password_nueva && (
              <p className="text-red-500 text-xs mt-1">{errPass.password_nueva.message}</p>
            )}
          </div>

          {/* Confirmar */}
          <div>
            <label className="label">Confirmar nueva contraseña *</label>
            <input
              className="input"
              type="password"
              placeholder="Repetir contraseña"
              {...rP('confirmar', {
                required: 'Requerido',
                validate: (v) =>
                  v === watch('password_nueva') || 'Las contraseñas no coinciden',
              })}
            />
            {errPass.confirmar && (
              <p className="text-red-500 text-xs mt-1">{errPass.confirmar.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loadingPass}
            className="btn btn-primary w-full"
          >
            {loadingPass ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}