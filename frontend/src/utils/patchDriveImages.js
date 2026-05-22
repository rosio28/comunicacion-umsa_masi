/**
 * patchDriveImages.js
 *
 * Convierte automáticamente URLs de Google Drive al formato
 * de miniatura directa que funciona sin autenticación.
 *
 * Formatos soportados:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID
 *   https://drive.google.com/uc?export=view&id=FILE_ID
 *   https://lh3.googleusercontent.com/...  (ya funciona)
 */

// ─── Extrae el File ID de cualquier formato de URL de Drive ─────────────────
export function fixDriveUrl(url) {
  if (!url || typeof url !== 'string') return url
  if (!url.includes('drive.google.com')) return url
  // Ya está convertida al formato thumbnail — no tocar
  if (url.includes('/thumbnail?')) return url

  let fileId = null

  // Formato: /file/d/FILE_ID/...
  const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (m1) fileId = m1[1]

  // Formato: ?id=FILE_ID o &id=FILE_ID
  // Cubre: open?id=, uc?id=, uc?export=view&id=, thumbnail?id=
  if (!fileId) {
    const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    if (m2) fileId = m2[1]
  }

  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`
  }

  return url
}

// ─── Aplica fix a una imagen concreta ───────────────────────────────────────
function fixImg(img) {
  try {
    const src = img.getAttribute('src') || ''
    if (src.includes('drive.google.com') && !src.includes('/thumbnail?')) {
      const fixed = fixDriveUrl(src)
      if (fixed !== src) {
        // Usar la propiedad directa para evitar loops con el observer
        Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'setAttribute')
          ?.value
          ? HTMLElement.prototype.setAttribute.call(img, 'src', fixed)
          : (img.src = fixed)
      }
    }
  } catch (_) {}
}

// ─── Parche 1: setAttribute ─────────────────────────────────────────────────
// React en desarrollo usa setAttribute; también lo usan librerías externas.
;(function patchSetAttribute() {
  const orig = Element.prototype.setAttribute
  Element.prototype.setAttribute = function patchedSetAttr(name, value) {
    if (
      name === 'src' &&
      typeof value === 'string' &&
      this instanceof HTMLImageElement
    ) {
      value = fixDriveUrl(value)
    }
    return orig.call(this, name, value)
  }
})()

// ─── Parche 2: img.src = '...' (propiedad directa) ──────────────────────────
// React en producción y muchos frameworks setean .src directamente.
;(function patchSrcSetter() {
  try {
    // El descriptor suele estar en HTMLImageElement.prototype o en Element.prototype
    const proto = HTMLImageElement.prototype
    const desc =
      Object.getOwnPropertyDescriptor(proto, 'src') ||
      Object.getOwnPropertyDescriptor(Element.prototype, 'src')

    if (!desc || !desc.set) return // no patcheable en este entorno

    Object.defineProperty(proto, 'src', {
      configurable: true,
      enumerable: desc.enumerable,
      get: desc.get,
      set(value) {
        desc.set.call(this, typeof value === 'string' ? fixDriveUrl(value) : value)
      },
    })
  } catch (_) {}
})()

// ─── Parche 3: MutationObserver ──────────────────────────────────────────────
// Captura imágenes añadidas dinámicamente al DOM (React re-renders, lazy load).
// Solo observa childList (addedNodes) para evitar loops de atributos.
;(function startMutationObserver() {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') continue
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return // solo elementos
        if (node.tagName === 'IMG') {
          fixImg(node)
        }
        // También busca imgs dentro del nodo añadido
        if (typeof node.querySelectorAll === 'function') {
          node.querySelectorAll('img').forEach(fixImg)
        }
      })
    }
  })

  const startObserving = () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
    // Fix any Drive images already in the DOM at mount time
    document.querySelectorAll('img').forEach(fixImg)
  }

  if (document.body) {
    startObserving()
  } else {
    document.addEventListener('DOMContentLoaded', startObserving, { once: true })
  }
})()