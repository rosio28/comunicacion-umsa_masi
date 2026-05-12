// frontend/src/pages/admin/LoginPage.jsx — VERSIÓN CORREGIDA
// Fix principal: después del cambio de contraseña obligatorio,
// marcar localmente que ya NO necesita cambiar y navegar al admin.
// El JWT sigue siendo válido (no contiene debe_cambiar_password).

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/services'
import { Eye, EyeOff, AlertTriangle } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

// ── MODAL CAMBIO OBLIGATORIO DE CONTRASEÑA ────────────────
function CambioObligatorioModal({ onSuccess }) {
  const [show1, setShow1] = useState(false)
  const [show2, setShow2] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async ({ password_actual, password_nueva }) => {
    try {
      await api.post('/auth/cambiar-password', { password_actual, password_nueva })
      toast.success('¡Contraseña actualizada! Bienvenido al panel.')
      // FIX: llamar onSuccess para que LoginPage navegue al admin
      onSuccess()
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al cambiar contraseña'
      toast.error(msg)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

        {/* Alerta */}
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
          Ingresa la contraseña temporal que recibiste y elige una nueva (mínimo 8 caracteres).
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Contraseña actual (temporal) */}
          <div>
            <label className="label">Contraseña temporal (la que recibiste)</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={show1 ? 'text' : 'password'}
                placeholder="Tu contraseña temporal"
                {...register('password_actual', { required: 'Campo requerido' })}
              />
              <button
                type="button"
                onClick={() => setShow1(!show1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {show1 ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password_actual && (
              <p className="text-red-500 text-xs mt-1">{errors.password_actual.message}</p>
            )}
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="label">Nueva contraseña</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={show2 ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                {...register('password_nueva', {
                  required: 'Campo requerido',
                  minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                })}
              />
              <button
                type="button"
                onClick={() => setShow2(!show2)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {show2 ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password_nueva && (
              <p className="text-red-500 text-xs mt-1">{errors.password_nueva.message}</p>
            )}
          </div>

          {/* Confirmar */}
          <div>
            <label className="label">Confirmar nueva contraseña</label>
            <input
              className="input"
              type="password"
              placeholder="Repetir contraseña"
              {...register('confirmar', {
                required: 'Campo requerido',
                validate: v =>
                  v === watch('password_nueva') || 'Las contraseñas no coinciden',
              })}
            />
            {errors.confirmar && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmar.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full py-3 mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </span>
            ) : (
              'Establecer mi contraseña y entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── PÁGINA DE LOGIN ───────────────────────────────────────
export function AdminLoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [showPass,       setShowPass]       = useState(false)
  const [mostrarCambio,  setMostrarCambio]  = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async ({ email, password }) => {
    try {
      const res = await login(email, password)

      if (res?.debe_cambiar_password) {
        // Mostrar modal de cambio obligatorio — NO navegar todavía
        setMostrarCambio(true)
      } else {
        navigate('/admin')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Credenciales incorrectas')
    }
  }

  // FIX: cuando el modal llama onSuccess, navegamos directamente
  // El JWT actual sigue siendo válido aunque debe_cambiar_password
  // esté marcado en BD — el campo no está en el payload del token.
  const handleCambioExitoso = () => {
    setMostrarCambio(false)
    navigate('/admin')
  }

  return (
    <>
      {mostrarCambio && (
        <CambioObligatorioModal onSuccess={handleCambioExitoso} />
      )}

      <div className="min-h-screen flex">

        {/* Panel izquierdo decorativo */}
        <div className="hidden lg:flex lg:flex-1 bg-secondary relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80"
              alt=""
              className="w-full h-full object-cover opacity-20"
            />
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
              <blockquote className="text-blue-100/80 text-lg italic mb-4">
                "Luz, Cámara, Acción... adelante comunicación."
              </blockquote>
              <p className="text-blue-300 text-sm">Carrera de Ciencias de la Comunicación Social</p>
              <p className="text-blue-400 text-sm">Fundada el 20 de agosto de 1984</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="flex-1 lg:max-w-md flex items-center justify-center p-8">
          <div className="w-full max-w-sm">

            {/* Logo móvil */}
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">CCS</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Comunicación Social</p>
                <p className="text-gray-400 text-sm">UMSA · Panel Admin</p>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">Bienvenido</h1>
            <p className="text-gray-500 text-sm mb-6">
              Ingresa a tu cuenta del panel de administración
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              <div>
                <label className="label">Correo electrónico</label>
                <input
                  className="input"
                  type="email"
                  placeholder="admin@comunicacion.umsa.bo"
                  {...register('email', { required: 'Requerido' })}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="label">Contraseña</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Tu contraseña"
                    {...register('password', { required: 'Requerido' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="text-right">
                <Link to="/admin/recuperar" className="text-sm text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full py-3"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Ingresando...
                  </span>
                ) : (
                  'Ingresar al panel'
                )}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              Panel de administración — solo personal autorizado
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

// ── RECUPERAR CONTRASEÑA ──────────────────────────────────
export function RecuperarPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { isSubmitting } } = useForm()

  const onSubmit = async ({ email }) => {
    try {
      await authService.recuperar(email)
      setSent(true)
    } catch {
      // Siempre mostrar éxito para no revelar si el email existe
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-card-md w-full max-w-sm p-8">
        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✉️</span>
            </div>
            <h2 className="font-bold text-xl text-gray-900 mb-2">Revisa tu correo</h2>
            <p className="text-gray-500 text-sm mt-2 mb-6">
              Si la cuenta existe, recibirás un enlace para restablecer tu contraseña.
            </p>
            <Link to="/admin/login" className="btn btn-primary w-full">
              Volver al login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-bold text-xl text-gray-900 mb-1">Recuperar contraseña</h1>
            <p className="text-gray-500 text-sm mb-5">
              Ingresa tu correo y recibirás un enlace de recuperación.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Correo electrónico</label>
                <input
                  className="input"
                  type="email"
                  placeholder="tu@correo.com"
                  {...register('email', { required: true })}
                />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
                {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>
            <Link to="/admin/login" className="text-sm text-gray-400 block mt-4 text-center hover:text-gray-600">
              ← Volver al login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

// ── RESET PASSWORD (desde enlace del correo) ──────────────
export function ResetPasswordPage() {
  const [sent,        setSent]        = useState(false)
  const [tokenValido, setTokenValido] = useState(true)
  const [showPass,    setShowPass]    = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors },
  } = useForm()

  const token = new URLSearchParams(window.location.search).get('token')

  useEffect(() => {
    if (!token) setTokenValido(false)
  }, [token])

  const onSubmit = async ({ password, confirmar }) => {
    if (password !== confirmar) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    try {
      await authService.resetPassword(token, password)
      setSent(true)
      setTimeout(() => navigate('/admin/login'), 3000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Token inválido o expirado')
    }
  }

  if (!tokenValido) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-card-md w-full max-w-sm p-8 text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="font-bold text-xl text-gray-900 mb-2">Enlace inválido</h2>
        <p className="text-gray-500 text-sm mb-6">Este enlace no es válido o ya expiró.</p>
        <Link to="/admin/recuperar" className="btn btn-primary w-full">
          Solicitar nuevo enlace
        </Link>
      </div>
    </div>
  )

  if (sent) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-card-md w-full max-w-sm p-8 text-center">
        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✓</span>
        </div>
        <h2 className="font-bold text-xl text-gray-900 mb-2">¡Contraseña actualizada!</h2>
        <p className="text-gray-500 text-sm mb-4">Serás redirigido al login en unos segundos...</p>
        <Link to="/admin/login" className="btn btn-primary w-full">Ir al login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-card-md w-full max-w-sm p-8">
        <div className="mb-6">
          <h1 className="font-bold text-xl text-gray-900">Nueva contraseña</h1>
          <p className="text-gray-500 text-sm mt-1">Elige una contraseña segura para tu cuenta.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Nueva contraseña</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showPass ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                {...register('password', {
                  required: 'Requerido',
                  minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="label">Confirmar contraseña</label>
            <input
              className="input"
              type="password"
              placeholder="Repetir contraseña"
              {...register('confirmar', {
                required: 'Requerido',
                validate: v => v === watch('password') || 'Las contraseñas no coinciden',
              })}
            />
            {errors.confirmar && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmar.message}</p>
            )}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
            {isSubmitting ? 'Guardando...' : 'Establecer nueva contraseña'}
          </button>
        </form>
        <div className="text-center mt-5">
          <Link to="/admin/login" className="text-sm text-gray-400 hover:text-gray-600">
            ← Volver al login
          </Link>
        </div>
      </div>
    </div>
  )
}
