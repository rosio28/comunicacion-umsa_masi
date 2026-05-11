// Formatear fecha legible
export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-BO', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('es-BO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// Truncar texto
export function truncate(text, len = 120) {
  if (!text) return ''
  return text.length > len ? text.slice(0, len) + '…' : text
}

// Generar slug
export function toSlug(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Extraer ID de video de YouTube
export function getYouTubeId(url) {
  const match = url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/)
  return match ? match[1] : null
}

// Thumbnail de YouTube
export function getYouTubeThumbnail(url) {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

// Clase de badge por rol
export function rolColor(rol) {
  const map = {
    superadmin: 'bg-red-100 text-red-700',
    admin:      'bg-blue-100 text-blue-700',
    editor:     'bg-green-100 text-green-700',
    visitante:  'bg-gray-100 text-gray-600',
  }
  return map[rol] || 'bg-gray-100 text-gray-600'
}
