/**
 * patchDriveImages.js
 *
 * Convierte automáticamente URLs de Google Drive (share links)
 * al formato de miniatura directa, en cualquier <img> de la app.
 *
 * Formatos soportados:
 *   https://drive.google.com/file/d/FILE_ID/view?...
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID&...
 *   https://drive.google.com/uc?export=view&id=FILE_ID
 */

// ─── Función utilitaria exportable ─────────────────────────
// Úsala también en el código cuando necesites convertir una URL antes de usarla
export function fixDriveUrl(url) {
  if (!url || typeof url !== 'string') return url

  const match = url.match(
    /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^&]*&)*id=)([a-zA-Z0-9_-]+)/
  )
  if (match?.[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w2000`
  }
  return url
}

// ─── Parche global para setAttribute('src', ...) ───────────
const _origSetAttr = HTMLImageElement.prototype.setAttribute
HTMLImageElement.prototype.setAttribute = function (name, value) {
  if (name === 'src' && typeof value === 'string') {
    value = fixDriveUrl(value)
  }
  return _origSetAttr.call(this, name, value)
}

// ─── Parche global para img.src = '...' ────────────────────
const _origSrcDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')
Object.defineProperty(HTMLImageElement.prototype, 'src', {
  set(value) {
    _origSrcDesc.set.call(this, fixDriveUrl(value))
  },
  get() {
    return _origSrcDesc.get.call(this)
  },
  configurable: true,
})
