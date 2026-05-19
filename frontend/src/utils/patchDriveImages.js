// src/utils/patchDriveImages.js

const originalSetAttribute = HTMLImageElement.prototype.setAttribute

HTMLImageElement.prototype.setAttribute = function (name, value) {

  if (
    name === 'src' &&
    typeof value === 'string' &&
    value.includes('drive.google.com')
  ) {

    const match = value.match(/\/d\/([^/]+)/)

    if (match?.[1]) {
      value = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w2000`
    }
  }

  return originalSetAttribute.call(this, name, value)
}

const originalSrc = Object.getOwnPropertyDescriptor(
  HTMLImageElement.prototype,
  'src'
)

Object.defineProperty(HTMLImageElement.prototype, 'src', {
  set(value) {

    if (
      typeof value === 'string' &&
      value.includes('drive.google.com')
    ) {

      const match = value.match(/\/d\/([^/]+)/)

      if (match?.[1]) {
        value = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w2000`
      }
    }

    originalSrc.set.call(this, value)
  },

  get() {
    return originalSrc.get.call(this)
  },
})