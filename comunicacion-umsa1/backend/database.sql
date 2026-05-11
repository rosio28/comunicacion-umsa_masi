-- =====================================================
-- BASE DE DATOS: Comunicación Social UMSA
-- PostgreSQL 15+
-- =====================================================

CREATE DATABASE comunicacion_umsa;
\c comunicacion_umsa;

-- =====================================================
-- DOMINIO 1: AUTENTICACIÓN Y USUARIOS
-- =====================================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'editor' CHECK (rol IN ('superadmin','admin','editor','colaborador')),
    activo BOOLEAN DEFAULT true,
    email_verificado BOOLEAN DEFAULT false,
    token_verificacion VARCHAR(100),
    token_reset VARCHAR(100),
    token_reset_exp TIMESTAMP,
    avatar_url TEXT,
    semestre INTEGER,
    promedio DECIMAL(4,2),
    horas_certificado INTEGER DEFAULT 0,
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sesiones_log (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    creado_en TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- DOMINIO 2: CONTENIDO DINÁMICO
-- =====================================================
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    color_hex VARCHAR(7),
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('noticias','eventos','convocatorias','multimedia'))
);

INSERT INTO categorias (nombre, color_hex, tipo) VALUES
('Académico','#CC0000','noticias'),
('Institucional','#003087','noticias'),
('Cultural','#8B0000','noticias'),
('Investigación','#1a4aa8','noticias'),
('Taller','#CC0000','eventos'),
('Seminario','#003087','eventos'),
('Defensa','#8B0000','eventos'),
('Examen','#1a4aa8','eventos'),
('Docentes','#CC0000','convocatorias'),
('Pasantías','#003087','convocatorias'),
('Becas','#8B0000','convocatorias');

CREATE TABLE noticias (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(300) NOT NULL,
    slug VARCHAR(350) UNIQUE NOT NULL,
    resumen TEXT,
    contenido TEXT NOT NULL,
    imagen_url TEXT,
    categoria_id INTEGER REFERENCES categorias(id),
    autor_id INTEGER REFERENCES usuarios(id),
    publicado BOOLEAN DEFAULT false,
    destacado BOOLEAN DEFAULT false,
    vistas INTEGER DEFAULT 0,
    publicado_en TIMESTAMP,
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(300) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('taller','seminario','defensa','examen','fecha_admin','otro')),
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP,
    lugar VARCHAR(200),
    enlace_virtual TEXT,
    autor_id INTEGER REFERENCES usuarios(id),
    publicado BOOLEAN DEFAULT false
);

CREATE TABLE grupos_whatsapp (
    id SERIAL PRIMARY KEY,
    materia_nombre VARCHAR(200) NOT NULL,
    semestre INTEGER NOT NULL,
    gestion VARCHAR(10) NOT NULL,
    enlace_wa TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    actualizado_por INTEGER REFERENCES usuarios(id),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE convocatorias (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(300) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('docentes','pasantias','investigacion','becas','otro')),
    descripcion TEXT NOT NULL,
    fecha_limite DATE,
    archivo_url TEXT,
    publicado BOOLEAN DEFAULT false,
    creado_en TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- DOMINIO 3: PERSONAS
-- =====================================================
CREATE TABLE docentes (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(200) NOT NULL,
    foto_url TEXT,
    titulo_academico VARCHAR(100),
    especialidad TEXT,
    email VARCHAR(150),
    bio_corta TEXT,
    tipo VARCHAR(30) DEFAULT 'titular' CHECK (tipo IN ('titular','interino','invitado')),
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE materias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(300) NOT NULL,
    codigo VARCHAR(20) UNIQUE,
    semestre INTEGER NOT NULL,
    creditos INTEGER,
    area VARCHAR(100),
    tipo VARCHAR(30) DEFAULT 'obligatoria' CHECK (tipo IN ('obligatoria','electiva','taller')),
    pensum VARCHAR(20) DEFAULT '2023',
    activa BOOLEAN DEFAULT true
);

CREATE TABLE docente_materias (
    docente_id INTEGER REFERENCES docentes(id) ON DELETE CASCADE,
    materia_id INTEGER REFERENCES materias(id) ON DELETE CASCADE,
    gestion VARCHAR(10) NOT NULL,
    PRIMARY KEY (docente_id, materia_id, gestion)
);

CREATE TABLE mejores_estudiantes (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(200) NOT NULL,
    foto_url TEXT,
    promedio DECIMAL(4,2) NOT NULL,
    semestre_actual INTEGER,
    gestion VARCHAR(10) NOT NULL,
    logros TEXT,
    publicado BOOLEAN DEFAULT false
);

CREATE TABLE egresados (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(200) NOT NULL,
    foto_url TEXT,
    anio_egreso INTEGER,
    ocupacion_actual VARCHAR(300),
    empresa_institucion VARCHAR(300),
    testimonio TEXT,
    linkedin_url TEXT,
    publicado BOOLEAN DEFAULT false
);

-- =====================================================
-- DOMINIO 4: MULTIMEDIA
-- =====================================================
CREATE TABLE albumes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    portada_url TEXT,
    publicado BOOLEAN DEFAULT false
);

CREATE TABLE galeria_imagenes (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    album_id INTEGER REFERENCES albumes(id) ON DELETE SET NULL,
    subido_por INTEGER REFERENCES usuarios(id),
    publicado BOOLEAN DEFAULT false,
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE multimedia_estudiantes (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(300) NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('video','podcast','fotografia','reportaje','otro')),
    descripcion TEXT,
    url_contenido TEXT NOT NULL,
    thumbnail_url TEXT,
    autor_nombre VARCHAR(200) NOT NULL,
    materia_origen VARCHAR(200),
    gestion VARCHAR(10),
    destacado BOOLEAN DEFAULT false,
    publicado BOOLEAN DEFAULT false,
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE canales_streaming (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    plataforma VARCHAR(30) NOT NULL CHECK (plataforma IN ('youtube','tiktok','facebook','radio')),
    url_canal TEXT NOT NULL,
    embed_playlist TEXT,
    activo BOOLEAN DEFAULT true
);

-- =====================================================
-- DOMINIO 5: ACADÉMICO
-- =====================================================
CREATE TABLE tramites (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(300) NOT NULL,
    descripcion TEXT,
    pasos JSONB,
    archivo_url TEXT,
    contacto VARCHAR(200),
    activo BOOLEAN DEFAULT true
);

-- =====================================================
-- DOMINIO 6: INSTITUCIONAL
-- =====================================================
CREATE TABLE contenido_institucional (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(50) NOT NULL UNIQUE,
    titulo VARCHAR(300),
    contenido TEXT NOT NULL,
    actualizado_por INTEGER REFERENCES usuarios(id),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

INSERT INTO contenido_institucional (clave, titulo, contenido) VALUES
('mision','Misión','Formar profesionales de la Comunicación Social altamente competentes, capaces de diseñar e implementar estrategias que impulsen el desarrollo económico, social y cultural de nuestra sociedad.'),
('vision','Visión','La Carrera de Comunicación Social de la UMSA es la unidad Académica de Referencia Nacional y la más grande de Bolivia, dedicada a la formación de profesionales e investigadores de la Comunicación Social.'),
('historia','Historia','La carrera fue fundada el 20 de agosto de 1984 como parte de la Facultad de Ciencias Sociales de la UMSA...'),
('pensum_info','Información Pensum 2023','El nuevo pensum 2023 actualiza el plan de estudios para responder a los desafíos contemporáneos de la comunicación...');

CREATE TABLE convenios (
    id SERIAL PRIMARY KEY,
    nombre_institucion VARCHAR(300) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('nacional','internacional')),
    descripcion TEXT,
    logo_url TEXT,
    url_web TEXT,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE documentos_transparencia (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(300) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('reglamento','resolucion','acta','convocatoria')),
    archivo_url TEXT NOT NULL,
    publicado_en DATE NOT NULL,
    creado_en TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- USUARIO SUPERADMIN INICIAL
-- Password: Admin2026! (cambiar inmediatamente)
-- Hash generado con bcrypt cost=12
-- =====================================================
INSERT INTO usuarios (nombre, email, password_hash, rol, activo, email_verificado) VALUES
('Administrador Principal', 'admin@comunicacion.umsa.bo', '$2y$12$placeholder_change_this_immediately', 'superadmin', true, true);

-- =====================================================
-- ÍNDICES PARA RENDIMIENTO
-- =====================================================
CREATE INDEX idx_noticias_publicado ON noticias(publicado);
CREATE INDEX idx_noticias_slug ON noticias(slug);
CREATE INDEX idx_noticias_categoria ON noticias(categoria_id);
CREATE INDEX idx_eventos_fecha ON eventos(fecha_inicio);
CREATE INDEX idx_grupos_semestre ON grupos_whatsapp(semestre, gestion);
CREATE INDEX idx_materias_semestre ON materias(semestre, pensum);
CREATE INDEX idx_multimedia_publicado ON multimedia_estudiantes(publicado);
