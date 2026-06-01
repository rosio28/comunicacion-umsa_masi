-- Seed formal content for Comunicación Social UMSA
-- NOTE: Avoids duplicate inserts by checking existing rows.

BEGIN;

-- Update institucional content to formal campus branding
UPDATE contenido_institucional
SET titulo = 'Misión',
    contenido = 'Formar profesionales líderes en Comunicación Social, con pensamiento crítico, creatividad y compromiso social, capaces de impulsar la transformación democrática, cultural y educativa de Bolivia.',
    actualizado_por = 1,
    actualizado_en = NOW()
WHERE clave = 'mision';

UPDATE contenido_institucional
SET titulo = 'Visión',
    contenido = 'Ser la Carrera de Comunicación Social de referencia nacional, reconocida por su excelencia académica, investigación innovadora y vinculación efectiva con la comunidad.',
    actualizado_por = 1,
    actualizado_en = NOW()
WHERE clave = 'vision';

UPDATE contenido_institucional
SET titulo = 'Historia',
    contenido = 'Desde su fundación en 1984, la Carrera de Comunicación Social de la UMSA ha formado profesionales capaces de enfrentar los retos de la información, la comunicación institucional y las estrategias multimedia en un mundo globalizado.',
    actualizado_por = 1,
    actualizado_en = NOW()
WHERE clave = 'historia';

UPDATE contenido_institucional
SET titulo = 'Pensum 2023',
    contenido = 'El pensum 2023 incorpora asignaturas actualizadas en periodismo digital, producción audiovisual, investigación aplicada y comunicación para el desarrollo, garantizando una formación integral para los desafíos contemporáneos.',
    actualizado_por = 1,
    actualizado_en = NOW()
WHERE clave = 'pensum_info';

-- Add imagen_url column if missing so institucional CRUD can store images
ALTER TABLE contenido_institucional
ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- Improve existing album and gallery seed values
UPDATE albumes
SET nombre = 'Actividades Académicas 2026',
    descripcion = 'Galería de eventos, talleres y actividades institucionales de la Carrera de Comunicación Social.',
    portada_url = 'https://placehold.co/1200x600?text=Actividades+Acad%C3%A9micas+2026',
    publicado = true
WHERE id = 1;

UPDATE galeria_imagenes
SET titulo = 'Inauguración del Taller de Comunicación Visual',
    thumbnail_url = 'https://placehold.co/320x240?text=Taller+Visual',
    album_id = 1,
    subido_por = 1,
    publicado = true
WHERE id = 1;

UPDATE grupos_whatsapp
SET materia_nombre = 'Grupo Oficial: Taller de Redacción Digital',
    semestre = 3,
    gestion = '2026-I',
    enlace_wa = 'https://chat.whatsapp.com/FormalConexionRedaccion',
    activo = true,
    actualizado_por = 1,
    actualizado_en = NOW()
WHERE id = 1;

-- Insert formal albums
INSERT INTO albumes (nombre, descripcion, portada_url, publicado)
SELECT 'Convocatorias y Eventos', 'Álbum con imágenes de convocatorias, presentaciones académicas, actividades culturales y eventos institucionales.', 'https://placehold.co/1200x600?text=Convocatorias+y+Eventos', true
WHERE NOT EXISTS (SELECT 1 FROM albumes WHERE nombre = 'Convocatorias y Eventos');

INSERT INTO albumes (nombre, descripcion, portada_url, publicado)
SELECT 'Proyectos Estudiantiles', 'Galería de los proyectos multimedia y trabajos destacados de los estudiantes de Comunicación Social.', 'https://placehold.co/1200x600?text=Proyectos+Estudiantiles', true
WHERE NOT EXISTS (SELECT 1 FROM albumes WHERE nombre = 'Proyectos Estudiantiles');

-- Insert formal gallery images
INSERT INTO galeria_imagenes (titulo, url, thumbnail_url, album_id, subido_por, publicado)
SELECT 'Taller de Periodismo Digital',
       'https://placehold.co/900x600?text=Taller+de+Periodismo+Digital',
       'https://placehold.co/320x240?text=Periodismo+Digital',
       a.id,
       1,
       true
FROM albumes a
WHERE a.nombre = 'Convocatorias y Eventos'
  AND NOT EXISTS (SELECT 1 FROM galeria_imagenes WHERE url = 'https://placehold.co/900x600?text=Taller+de+Periodismo+Digital');

INSERT INTO galeria_imagenes (titulo, url, thumbnail_url, album_id, subido_por, publicado)
SELECT 'Jornada de Comunicación para el Desarrollo',
       'https://placehold.co/900x600?text=Comunicación+para+el+Desarrollo',
       'https://placehold.co/320x240?text=Desarrollo+Social',
       a.id,
       1,
       true
FROM albumes a
WHERE a.nombre = 'Convocatorias y Eventos'
  AND NOT EXISTS (SELECT 1 FROM galeria_imagenes WHERE url = 'https://placehold.co/900x600?text=Comunicación+para+el+Desarrollo');

INSERT INTO galeria_imagenes (titulo, url, thumbnail_url, album_id, subido_por, publicado)
SELECT 'Producción audiovisual estudiantil',
       'https://placehold.co/900x600?text=Producción+Audiovisual',
       'https://placehold.co/320x240?text=Audiovisual',
       a.id,
       1,
       true
FROM albumes a
WHERE a.nombre = 'Proyectos Estudiantiles'
  AND NOT EXISTS (SELECT 1 FROM galeria_imagenes WHERE url = 'https://placehold.co/900x600?text=Producción+Audiovisual');

-- Insert WhatsApp groups
INSERT INTO grupos_whatsapp (materia_nombre, semestre, gestion, enlace_wa, activo, actualizado_por)
SELECT 'Comunicación Organizacional - 2026-I', 5, '2026-I', 'https://chat.whatsapp.com/FormalConexionOrganizacional', true, 1
WHERE NOT EXISTS (SELECT 1 FROM grupos_whatsapp WHERE materia_nombre = 'Comunicación Organizacional - 2026-I');

INSERT INTO grupos_whatsapp (materia_nombre, semestre, gestion, enlace_wa, activo, actualizado_por)
SELECT 'Investigación en Comunicación - 2026-I', 7, '2026-I', 'https://chat.whatsapp.com/FormalConexionInvestigacion', true, 1
WHERE NOT EXISTS (SELECT 1 FROM grupos_whatsapp WHERE materia_nombre = 'Investigación en Comunicación - 2026-I');

INSERT INTO grupos_whatsapp (materia_nombre, semestre, gestion, enlace_wa, activo, actualizado_por)
SELECT 'Marketing y Publicidad - 2026-I', 8, '2026-I', 'https://chat.whatsapp.com/FormalConexionPublicidad', true, 1
WHERE NOT EXISTS (SELECT 1 FROM grupos_whatsapp WHERE materia_nombre = 'Marketing y Publicidad - 2026-I');

-- Insert convocatorias
INSERT INTO convocatorias (titulo, tipo, descripcion, fecha_limite, archivo_url, publicado)
SELECT 'Pasantías en Comunicación Digital', 'pasantias', 'Convocatoria para estudiantes interesados en prácticas profesionales en medios digitales y redes sociales.', '2026-05-20', 'https://ccs.umsa.bo/documentos/convocatoria-pasantias-digital.pdf', true
WHERE NOT EXISTS (SELECT 1 FROM convocatorias WHERE titulo = 'Pasantías en Comunicación Digital');

INSERT INTO convocatorias (titulo, tipo, descripcion, fecha_limite, archivo_url, publicado)
SELECT 'Becas de Investigación en Comunicación', 'becas', 'Beca para investigación aplicada en temas de comunicación social, periodismo y comunicación comunitaria.', '2026-06-15', 'https://ccs.umsa.bo/documentos/becas-investigacion.pdf', true
WHERE NOT EXISTS (SELECT 1 FROM convocatorias WHERE titulo = 'Becas de Investigación en Comunicación');

INSERT INTO convocatorias (titulo, tipo, descripcion, fecha_limite, archivo_url, publicado)
SELECT 'Convocatoria para Taller de Producción Audiovisual', 'otro', 'Participa en el taller intensivo para la producción de piezas audiovisuales y narrativas multimedia.', '2026-04-30', 'https://ccs.umsa.bo/documentos/convocatoria-taller-audiovisual.pdf', true
WHERE NOT EXISTS (SELECT 1 FROM convocatorias WHERE titulo = 'Convocatoria para Taller de Producción Audiovisual');

-- Insert noticias formales
INSERT INTO noticias (titulo, slug, resumen, contenido, imagen_url, categoria_id, autor_id, publicado, destacado, publicado_en)
SELECT 'La Carrera de Comunicación Social inicia el ciclo académico 2026', 'inicio-ciclo-academico-2026',
       'Estudiantes y docentes de la UMSA comienzan el nuevo semestre con actividades de bienvenida y talleres de formación.',
       'La Carrera de Comunicación Social de la UMSA dio la bienvenida al ciclo académico 2026 con una agenda que incluye talleres de redacción digital, liderazgo estudiantil y comunicación para el desarrollo. La programación busca fortalecer las competencias profesionales con enfoque en investigación y responsabilidad social.',
       'https://placehold.co/900x600?text=Ciclo+Académico+2026',
       2,
       1,
       true,
       true,
       NOW()
WHERE NOT EXISTS (SELECT 1 FROM noticias WHERE slug = 'inicio-ciclo-academico-2026');

INSERT INTO noticias (titulo, slug, resumen, contenido, imagen_url, categoria_id, autor_id, publicado, destacado, publicado_en)
SELECT 'Convocatorias abiertas para pasantías en medios nacionales', 'convocatorias-pasantias-medios-nacionales',
       'Medios nacionales ofrecen pasantías a estudiantes de Comunicación Social de la UMSA.',
       'Las convocatorias abiertas incluyen pasantías en radio, televisión y prensa digital. Los estudiantes interesados deben postular hasta la fecha límite indicada en el sitio oficial de la carrera.',
       'https://placehold.co/900x600?text=Pasantías+Medios',
       1,
       1,
       true,
       false,
       NOW()
WHERE NOT EXISTS (SELECT 1 FROM noticias WHERE slug = 'convocatorias-pasantias-medios-nacionales');

INSERT INTO noticias (titulo, slug, resumen, contenido, imagen_url, categoria_id, autor_id, publicado, destacado, publicado_en)
SELECT 'Seminario internacional sobre comunicación y ciudadanía', 'seminario-internacional-comunicacion-ciudadania',
       'Expertos internacionales se reunirán en la UMSA para analizar el rol de la comunicación en la participación ciudadana.',
       'El seminario abordará el papel de los medios, la comunicación pública y las estrategias de inclusión social. Estudiantes y docentes podrán participar en paneles de debate y charlas especializadas.',
       'https://placehold.co/900x600?text=Seminario+Internacional',
       4,
       1,
       true,
       true,
       NOW()
WHERE NOT EXISTS (SELECT 1 FROM noticias WHERE slug = 'seminario-internacional-comunicacion-ciudadania');

INSERT INTO noticias (titulo, slug, resumen, contenido, imagen_url, categoria_id, autor_id, publicado, destacado, publicado_en)
SELECT 'Nueva plataforma multimedia para proyectos estudiantiles', 'plataforma-multimedia-proyectos-estudiantiles',
       'Lanzamiento de un espacio digital para exhibir trabajos audiovisuales y reportajes de los estudiantes.',
       'La plataforma permitirá visibilizar los proyectos más destacados de la Carrera de Comunicación Social, fomentando la creatividad y la colaboración entre estudiantes y docentes.',
       'https://placehold.co/900x600?text=Plataforma+Multimedia',
       2,
       1,
       true,
       false,
       NOW()
WHERE NOT EXISTS (SELECT 1 FROM noticias WHERE slug = 'plataforma-multimedia-proyectos-estudiantiles');

-- Insert eventos
INSERT INTO eventos (titulo, descripcion, tipo, fecha_inicio, fecha_fin, lugar, enlace_virtual, autor_id, publicado)
SELECT 'Taller de Comunicación Institucional', 'Taller práctico para fortalecer planes de comunicación en organizaciones sociales y educativas.', 'taller', '2026-05-10 09:00', '2026-05-10 14:00', 'Auditorio Central UMSA', 'https://meet.google.com/ejemplo-taller', 1, true
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE titulo = 'Taller de Comunicación Institucional');

INSERT INTO eventos (titulo, descripcion, tipo, fecha_inicio, fecha_fin, lugar, enlace_virtual, autor_id, publicado)
SELECT 'Seminario de Periodismo Digital y Ética', 'Seminario sobre ética periodística y herramientas de reportería digital.', 'seminario', '2026-06-08 10:00', '2026-06-08 13:00', 'Sala de Conferencias UMSA', 'https://meet.google.com/ejemplo-seminario', 1, true
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE titulo = 'Seminario de Periodismo Digital y Ética');

-- Insert convenios formales
INSERT INTO convenios (nombre_institucion, tipo, tipo_institucion, tipo_convenio, cupos_disponibles, duracion_meses, requisitos, fecha_inicio, fecha_vencimiento, activo, publicado)
SELECT 'Agencia Comunicación Bolivia', 'nacional', 'medio', 'pasantia', 4, 4, 'Currículum, carta de motivación y entrevista de admisión.', '2026-02-01', '2026-12-31', true, true
WHERE NOT EXISTS (SELECT 1 FROM convenios WHERE nombre_institucion = 'Agencia Comunicación Bolivia');

INSERT INTO convenios (nombre_institucion, tipo, tipo_institucion, tipo_convenio, cupos_disponibles, duracion_meses, requisitos, fecha_inicio, fecha_vencimiento, activo, publicado)
SELECT 'Universidad Mayor de San Andrés - Biblioteca', 'nacional', 'academia', 'investigacion', 2, 12, 'Propuesta de investigación, historial académico y entrevista.', '2026-03-01', '2027-02-28', true, true
WHERE NOT EXISTS (SELECT 1 FROM convenios WHERE nombre_institucion = 'Universidad Mayor de San Andrés - Biblioteca');

INSERT INTO convenios (nombre_institucion, tipo, tipo_institucion, tipo_convenio, cupos_disponibles, duracion_meses, requisitos, fecha_inicio, fecha_vencimiento, activo, publicado)
SELECT 'Fundación Desarrollo Comunicacional', 'nacional', 'ong', 'practica', 3, 6, 'Currículum, carta de presentación y comprobante de estudio.', '2026-04-15', '2026-10-15', true, true
WHERE NOT EXISTS (SELECT 1 FROM convenios WHERE nombre_institucion = 'Fundación Desarrollo Comunicacional');

-- Insert documentos de transparencia
INSERT INTO documentos_transparencia (titulo, tipo, descripcion, archivo_url, publicado_en, publicado)
SELECT 'Reglamento de Prácticas Profesionales', 'reglamento', 'Normas y procedimientos para el desarrollo de prácticas profesionales de los estudiantes de Comunicación Social.', 'https://ccs.umsa.bo/documentos/reglamento-practicas.pdf', '2025-12-01', true
WHERE NOT EXISTS (SELECT 1 FROM documentos_transparencia WHERE titulo = 'Reglamento de Prácticas Profesionales');

INSERT INTO documentos_transparencia (titulo, tipo, descripcion, archivo_url, publicado_en, publicado)
SELECT 'Resolución de Servicios de Comunicación', 'resolucion', 'Resolución interna que establece lineamientos para la comunicación institucional y transparencia académica.', 'https://ccs.umsa.bo/documentos/resolucion-servicios-comunicacion.pdf', '2026-01-15', true
WHERE NOT EXISTS (SELECT 1 FROM documentos_transparencia WHERE titulo = 'Resolución de Servicios de Comunicación');

INSERT INTO documentos_transparencia (titulo, tipo, descripcion, archivo_url, publicado_en, publicado)
SELECT 'Acta de Coordinación Interinstitucional', 'acta', 'Acta de reunión entre la Carrera de Comunicación Social y medios aliados para iniciativas académicas.', 'https://ccs.umsa.bo/documentos/acta-coordinacion.pdf', '2026-02-20', true
WHERE NOT EXISTS (SELECT 1 FROM documentos_transparencia WHERE titulo = 'Acta de Coordinación Interinstitucional');

-- Insert trámites
INSERT INTO tramites (nombre, descripcion, pasos, archivo_url, contacto, activo)
SELECT 'Solicitud de Certificado de Estudios', 'Trámite para obtener el certificado de estudios de la Carrera de Comunicación Social.',
       '[{"paso": 1, "descripcion": "Descargar el formulario de solicitud."}, {"paso": 2, "descripcion": "Completar los datos personales y académicos."}, {"paso": 3, "descripcion": "Entregar el formulario en la oficina de la carrera."}, {"paso": 4, "descripcion": "Esperar la notificación para la recogida del certificado."}]',
       'https://ccs.umsa.bo/documentos/formulario-certificado.pdf',
       'secretaria.ccs@umsa.bo',
       true
WHERE NOT EXISTS (SELECT 1 FROM tramites WHERE nombre = 'Solicitud de Certificado de Estudios');

INSERT INTO tramites (nombre, descripcion, pasos, archivo_url, contacto, activo)
SELECT 'Inscripción a Talleres Académicos', 'Trámite de inscripción para talleres de comunicación, producción audiovisual y periodismo digital.',
       '[{"paso": 1, "descripcion": "Revisar la oferta de talleres en el calendario académico."}, {"paso": 2, "descripcion": "Completar el formulario de inscripción en línea."}, {"paso": 3, "descripcion": "Enviar comprobante de pago si aplica."}, {"paso": 4, "descripcion": "Recibir confirmación por correo electrónico."}]',
       'https://ccs.umsa.bo/documentos/formulario-talleres.pdf',
       'talleres.ccs@umsa.bo',
       true
WHERE NOT EXISTS (SELECT 1 FROM tramites WHERE nombre = 'Inscripción a Talleres Académicos');

-- Insert mejores estudiantes
INSERT INTO mejores_estudiantes (nombre_completo, foto_url, promedio, semestre_actual, gestion, logros, publicado)
SELECT 'Ana María Castillo', 'https://placehold.co/400x400?text=Ana+María+Castillo', 9.65, 8, '2026-I', 'Reconocida por su proyecto de comunicación social comunitaria y liderazgo académico.', true
WHERE NOT EXISTS (SELECT 1 FROM mejores_estudiantes WHERE nombre_completo = 'Ana María Castillo');

INSERT INTO mejores_estudiantes (nombre_completo, foto_url, promedio, semestre_actual, gestion, logros, publicado)
SELECT 'Luis Fernando Choque', 'https://placehold.co/400x400?text=Luis+Fernando+Choque', 9.52, 7, '2026-I', 'Destacado por su investigación en periodismo digital y producción multimedia.', true
WHERE NOT EXISTS (SELECT 1 FROM mejores_estudiantes WHERE nombre_completo = 'Luis Fernando Choque');

-- Insert egresados
INSERT INTO egresados (nombre_completo, foto_url, anio_egreso, ocupacion_actual, empresa_institucion, testimonio, linkedin_url, publicado)
SELECT 'María Fernanda Quispe', 'https://placehold.co/400x400?text=María+Fernanda+Quispe', 2022, 'Coordinadora de Medios Digitales', 'Agencia Comunicación Bolivia', 'La formación en la UMSA me brindó herramientas prácticas para enfrentar retos profesionales con creatividad y ética.', 'https://www.linkedin.com/in/maria-fernanda-quispe', true
WHERE NOT EXISTS (SELECT 1 FROM egresados WHERE nombre_completo = 'María Fernanda Quispe');

INSERT INTO egresados (nombre_completo, foto_url, anio_egreso, ocupacion_actual, empresa_institucion, testimonio, linkedin_url, publicado)
SELECT 'José Luis Mamani', 'https://placehold.co/400x400?text=José+Luis+Mamani', 2020, 'Periodista de Investigación', 'Red Uno de Bolivia', 'El enfoque práctico del programa me permitió desarrollar proyectos reales desde el primer semestre.', 'https://www.linkedin.com/in/jose-luis-mamani', true
WHERE NOT EXISTS (SELECT 1 FROM egresados WHERE nombre_completo = 'José Luis Mamani');

-- Insert multimedia estudiantil
INSERT INTO multimedia_estudiantes (titulo, tipo, descripcion, url_contenido, thumbnail_url, autor_nombre, materia_origen, gestion, destacado, publicado)
SELECT 'Reportaje Multimedial sobre Cultura Local', 'reportaje', 'Producción multimedia que explora iniciativas culturales de la ciudad de La Paz.', 'https://www.youtube.com/watch?v=example', 'https://placehold.co/320x180?text=Reportaje+Local', 'Valeria Mamani', 'Comunicación Audiovisual II', '2026-I', true, true
WHERE NOT EXISTS (SELECT 1 FROM multimedia_estudiantes WHERE titulo = 'Reportaje Multimedial sobre Cultura Local');

INSERT INTO multimedia_estudiantes (titulo, tipo, descripcion, url_contenido, thumbnail_url, autor_nombre, materia_origen, gestion, destacado, publicado)
SELECT 'Podcast de Periodismo de Investigación', 'podcast', 'Serie de audio sobre la investigación de fuentes comunitarias y ética periodística.', 'https://soundcloud.com/example-podcast', 'https://placehold.co/320x180?text=Podcast+Investigación', 'Diego Suárez', 'Investigación Periodística', '2026-I', false, true
WHERE NOT EXISTS (SELECT 1 FROM multimedia_estudiantes WHERE titulo = 'Podcast de Periodismo de Investigación');

-- Insert canales de streaming
INSERT INTO canales_streaming (nombre, plataforma, url_canal, embed_playlist, activo)
SELECT 'Canal Oficial CCS UMSA', 'youtube', 'https://www.youtube.com/@comunicacionsocialumsa', 'https://www.youtube.com/embed?list=PLexample', true
WHERE NOT EXISTS (SELECT 1 FROM canales_streaming WHERE nombre = 'Canal Oficial CCS UMSA');

INSERT INTO canales_streaming (nombre, plataforma, url_canal, embed_playlist, activo)
SELECT 'Radio Universitaria UMSA', 'radio', 'https://radio.umsa.bo/ccs', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM canales_streaming WHERE nombre = 'Radio Universitaria UMSA');

INSERT INTO canales_streaming (nombre, plataforma, url_canal, embed_playlist, activo)
SELECT 'Streaming de Eventos CCS', 'facebook', 'https://www.facebook.com/comunicacionsocialumsa/live', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM canales_streaming WHERE nombre = 'Streaming de Eventos CCS');

COMMIT;
