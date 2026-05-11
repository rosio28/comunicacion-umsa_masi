import api from './api'

export const noticiasService = {
  getAll:    (p) => api.get('/noticias', { params: p }),
  getBySlug: (s) => api.get(`/noticias/${s}`),
  create:    (d) => api.post('/noticias', d),
  update:    (id, d) => api.put(`/noticias/${id}`, d),
  publicar:  (id) => api.patch(`/noticias/${id}/publicar`),
  delete:    (id) => api.delete(`/noticias/${id}`),
}
export const categoriasService = {
  getAll: (tipo) => api.get('/categorias', { params: tipo ? { tipo } : {} }),
  create: (d) => api.post('/categorias', d),
  delete: (id) => api.delete(`/categorias/${id}`),
}
export const eventosService = {
  getAll:  (p) => api.get('/eventos', { params: p }),
  create:  (d) => api.post('/eventos', d),
  update:  (id, d) => api.put(`/eventos/${id}`, d),
  delete:  (id) => api.delete(`/eventos/${id}`),
}
export const convocatoriasService = {
  getAll: (p) => api.get('/convocatorias', { params: p }),
  create: (d) => api.post('/convocatorias', d),
  update: (id, d) => api.put(`/convocatorias/${id}`, d),
  delete: (id) => api.delete(`/convocatorias/${id}`),
}
export const docentesService = {
  getAll:  () => api.get('/docentes'),
  create:  (d) => api.post('/docentes', d),
  update:  (id, d) => api.put(`/docentes/${id}`, d),
  delete:  (id) => api.delete(`/docentes/${id}`),
}
export const alumnosService = {
  getAll:  (p) => api.get('/mejores-alumnos', { params: p }),
  create:  (d) => api.post('/mejores-alumnos', d),
  update:  (id, d) => api.put(`/mejores-alumnos/${id}`, d),
  delete:  (id) => api.delete(`/mejores-alumnos/${id}`),
}
export const egresadosService = {
  getAll:  () => api.get('/egresados'),
  create:  (d) => api.post('/egresados', d),
  update:  (id, d) => api.put(`/egresados/${id}`, d),
  delete:  (id) => api.delete(`/egresados/${id}`),
}
export const multimediaService = {
  getAll:   (p) => api.get('/multimedia', { params: p }),
  create:   (d) => api.post('/multimedia', d),
  update:   (id, d) => api.put(`/multimedia/${id}`, d),
  publicar: (id) => api.patch(`/multimedia/${id}/publicar`),
  delete:   (id) => api.delete(`/multimedia/${id}`),
}
export const galeriaService = {
  getAlbumes:  () => api.get('/galeria/albumes'),
  crearAlbum:  (d) => api.post('/galeria/albumes', d),
  updateAlbum: (id, d) => api.put(`/galeria/albumes/${id}`, d),
  deleteAlbum: (id) => api.delete(`/galeria/albumes/${id}`),
  getImagenes: (aid) => api.get(`/galeria/albumes/${aid}/imagenes`),
  subirImagen: (fd) => api.post('/galeria/imagenes', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  eliminar:    (id) => api.delete(`/galeria/imagenes/${id}`),
}
export const streamingService = {
  getAll: () => api.get('/streaming'),
  create: (d) => api.post('/streaming', d),
  delete: (id) => api.delete(`/streaming/${id}`),
}
export const whatsappService = {
  getAll:  () => api.get('/whatsapp'),
  getAdmin:() => api.get('/whatsapp/admin'),
  create:  (d) => api.post('/whatsapp', d),
  update:  (id, d) => api.put(`/whatsapp/${id}`, d),
  delete:  (id) => api.delete(`/whatsapp/${id}`),
}
export const materiasService = {
  getAll:  (p) => api.get('/materias', { params: { pensum: p || '2023' } }),
  create:  (d) => api.post('/materias', d),
  update:  (id, d) => api.put(`/materias/${id}`, d),
  delete:  (id) => api.delete(`/materias/${id}`),
}
export const institucionalService = {
  get:    (c) => api.get(`/institucional/${c}`),
  update: (c, d) => api.put(`/institucional/${c}`, d),
}
export const tramitesService = {
  getAll:  () => api.get('/tramites'),
  create:  (d) => api.post('/tramites', d),
  update:  (id, d) => api.put(`/tramites/${id}`, d),
  delete:  (id) => api.delete(`/tramites/${id}`),
}
export const usuariosService = {
  getAll:        () => api.get('/usuarios'),
  create:        (d) => api.post('/usuarios', d),
  update:        (id, d) => api.put(`/usuarios/${id}`, d),
  delete:        (id) => api.delete(`/usuarios/${id}`),
  resetPassword: (id, p) => api.post(`/usuarios/${id}/reset-password`, { nueva_password: p }),
}
export const authService = {
  login:           (email, pass) => api.post('/auth/login', { email, password: pass }),
  me:              () => api.get('/auth/me'),
  cambiarPassword: (d) => api.post('/auth/cambiar-password', d),
  recuperar:       (email) => api.post('/auth/recuperar', { email }),
  resetPassword:   (token, pass) => api.post('/auth/reset-password', { token, password: pass }),
}
export const contactoService = { enviar: (d) => api.post('/contacto', d) }
