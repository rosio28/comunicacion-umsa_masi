import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/services'
import { Eye, EyeOff, Lock, Mail, AlertTriangle } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

// ── MODAL CAMBIO OBLIGATORIO DE CONTRASEÑA ────────────────
function CambioObligatorioModal({ onSuccess }) {
  const [show1, setShow1] = useState(false)
  const [show2, setShow2] = useState(false)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async ({ password_actual, password_nueva }) => {
    try {
      await api.post('/auth/cambiar-password', { password_actual, password_nueva })
      toast.success('¡Contraseña actualizada! Ya puedes usar el sistema.')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cambiar contraseña')
    }
  }

  return (
    // Overlay que bloquea toda la pantalla — no se puede cerrar
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Alerta visual */}
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <AlertTriangle size={22} className="text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Cambio de contraseña obligatorio</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Es tu primer ingreso. Debes establecer una contraseña personal antes de continuar.
            </p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1">Crea tu contraseña</h2>
        <p className="text-gray-500 text-sm mb-6">
          Ingresa la contraseña temporal que recibiste y elige una nueva contraseña segura.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Contraseña temporal (la que recibiste)</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={show1 ? 'text' : 'password'}
                placeholder="Tu contraseña temporal"
                {...register('password_actual', { required: 'Requerido' })}
              />
              <button type="button" onClick={() => setShow1(!show1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {show1 ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password_actual && <p className="text-red-500 text-xs mt-1">{errors.password_actual.message}</p>}
          </div>

          <div>
            <label className="label">Nueva contraseña</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={show2 ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                {...register('password_nueva', {
                  required: 'Requerido',
                  minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                })}
              />
              <button type="button" onClick={() => setShow2(!show2)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {show2 ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password_nueva && <p className="text-red-500 text-xs mt-1">{errors.password_nueva.message}</p>}
          </div>

          <div>
            <label className="label">Confirmar nueva contraseña</label>
            <input
              className="input"
              type="password"
              placeholder="Repetir contraseña"
              {...register('confirmar', {
                required: 'Requerido',
                validate: v => v === watch('password_nueva') || 'Las contraseñas no coinciden',
              })}
            />
            {errors.confirmar && <p className="text-red-500 text-xs mt-1">{errors.confirmar.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full py-3 mt-2">
            {isSubmitting
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </span>
              : 'Establecer mi contraseña y entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── LOGIN ────────────────────────────────────────────────
export function AdminLoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [showPass, setShowPass]               = useState(false)
  const [mostrarCambio, setMostrarCambio]     = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async ({ email, password }) => {
    try {
      const res = await login(email, password)
      // login() devuelve la respuesta completa — chequeamos debe_cambiar_password
      if (res?.debe_cambiar_password) {
        // Mostrar modal bloqueante antes de entrar al panel
        setMostrarCambio(true)
      } else {
        navigate('/admin')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Credenciales incorrectas')
    }
  }

  return (
    <>
      {/* Modal bloqueante de cambio obligatorio */}
      {mostrarCambio && (
        <CambioObligatorioModal onSuccess={() => {
          setMostrarCambio(false)
          navigate('/admin')
        }} />
      )}

      <div className="min-h-screen flex">
        {/* Left panel */}
        <div className="hidden lg:flex lg:flex-1 bg-secondary relative overflow-hidden">
          <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80"
                 alt="" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/95 to-secondary/80" />
          </div>
          <div className="relative flex flex-col justify-between p-10 w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">CCS</span>
              </div>
              <div>
                <p className="text-white font-semibold">Comunicación Social</p>
                <p className="text-blue-300 text-sm">UMSA · La Paz, Bolivia</p>
              </div>
            </div>
            <div>
              <blockquote className="text-blue-100/80 text-lg leading-relaxed italic mb-4">
                "Luz, Cámara, Acción... adelante comunicación."
              </blockquote>
              <p className="text-blue-300 text-sm">Carrera de Ciencias de la Comunicación Social</p>
              <p className="text-blue-400 text-sm">Fundada el 20 de agosto de 1984</p>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 lg:max-w-md flex items-center justify-center p-8">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-5 lg:hidden">
                <span className="text-white font-bold">CCS</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Bienvenido</h1>
              <p className="text-gray-500 text-sm mt-1">Ingresa a tu cuenta del panel de administración</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Correo electrónico</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className="input pl-10" type="email" placeholder="admin@comunicacion.umsa.bo"
                    autoComplete="email" {...register('email', { required: 'Requerido' })} />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label">Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className="input pl-10 pr-10" type={showPass ? 'text' : 'password'}
                    autoComplete="current-password" {...register('password', { required: 'Requerido' })} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              <div className="flex justify-end">
                <Link to="/admin/recuperar" className="text-sm text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button type="submit" disabled={isSubmitting}
                className="btn btn-primary w-full py-3 text-base mt-1">
                {isSubmitting
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Ingresando...
                    </span>
                  : 'Ingresar al panel'}
              </button>
            </form>

            <div className="border-t border-gray-100 mt-6 pt-5 text-center">
              <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                ← Volver al sitio público
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── RECUPERAR ────────────────────────────────────────────
export function RecuperarPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { isSubmitting } } = useForm()
  const onSubmit = async ({ email }) => {
    try { await authService.recuperar(email); setSent(true) }
    catch { toast.error('Error al procesar la solicitud') }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-card-md w-full max-w-sm p-8">
        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={24} className="text-green-600" />
            </div>
            <h2 className="font-bold text-xl text-gray-900 mb-2">Revisa tu correo</h2>
            <p className="text-gray-500 text-sm mb-6">Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.</p>
            <Link to="/admin/login" className="btn btn-primary w-full">Volver al login</Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="font-bold text-xl text-gray-900">Recuperar contraseña</h1>
              <p className="text-gray-500 text-sm mt-1">Ingresa tu correo y te enviaremos un enlace de recuperación.</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Correo electrónico</label>
                <input className="input" type="email" {...register('email', { required: true })} />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
                {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>
            <div className="text-center mt-5">
              <Link to="/admin/login" className="text-sm text-gray-400 hover:text-gray-600">← Volver al login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}