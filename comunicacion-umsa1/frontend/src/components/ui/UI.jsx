import { Loader2, AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react'

// ─── SPINNER ───────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const s = { sm: 'h-4 w-4', md: 'h-7 w-7', lg: 'h-10 w-10' }[size]
  return <Loader2 className={`animate-spin text-primary ${s} ${className}`} />
}
export function LoadingCenter({ label = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  )
}

// ─── EMPTY STATE ───────────────────────────────────────────
export function EmptyState({ title = 'Sin contenido', subtitle = '', action }) {
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={24} className="text-gray-300" />
      </div>
      <p className="font-semibold text-gray-700 text-base">{title}</p>
      {subtitle && <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── BADGE ─────────────────────────────────────────────────
export function Badge({ children, color, variant = 'soft' }) {
  if (color) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: color }}>
        {children}
      </span>
    )
  }
  return <span className="badge badge-gray">{children}</span>
}

// ─── PAGINATION ────────────────────────────────────────────
export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500
                   hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft size={16} />
      </button>
      {Array.from({ length: Math.min(7, pages) }, (_, i) => {
        const p = pages <= 7 ? i + 1 : (page <= 4 ? i + 1 : page - 3 + i)
        if (p < 1 || p > pages) return null
        return (
          <button key={p} onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
              p === page ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            {p}
          </button>
        )
      })}
      <button onClick={() => onChange(Math.min(pages, page + 1))} disabled={page === pages}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500
                   hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

// ─── MODAL ─────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md', footer }) {
  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(2px)' }}
         onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[92vh] flex flex-col`}
           style={{ animation: 'slideUp 0.2s ease' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X size={17} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
        {footer && <div className="border-t border-gray-100 px-5 py-4">{footer}</div>}
      </div>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}

// ─── CONFIRM DIALOG ────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = true }) {
  return (
    <Modal open={open} onClose={onClose} title={title || 'Confirmar'} size="sm">
      <p className="text-gray-600 text-sm">{message || '¿Confirmas esta acción?'}</p>
      <div className="flex gap-2.5 mt-5 justify-end">
        <button onClick={onClose} className="btn btn-ghost btn-sm">Cancelar</button>
        <button onClick={() => { onConfirm(); onClose() }}
          className={`btn btn-sm ${danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-primary'}`}>
          Confirmar
        </button>
      </div>
    </Modal>
  )
}

// ─── SECTION HEADER (admin) ────────────────────────────────
export function SectionHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
      <div className="page-header mb-0">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  )
}

// ─── STAT CARD ─────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = 'bg-primary', trend }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        {Icon && <Icon size={22} />}
      </div>
      <div>
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
        {trend && <p className="text-xs text-green-600 mt-0.5">{trend}</p>}
      </div>
    </div>
  )
}

// ─── INFO ALERT ────────────────────────────────────────────
export function InfoAlert({ children, type = 'info' }) {
  const styles = {
    info:    'bg-secondary-50 border-secondary-100 text-secondary',
    warning: 'bg-amber-50 border-amber-100 text-amber-700',
    success: 'bg-green-50 border-green-100 text-green-700',
    error:   'bg-red-50 border-red-100 text-red-700',
  }[type]
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</div>
  )
}
