-- ============================================================
-- SCHEMA COMPLETO -- Comunicación Social UMSA
-- PostgreSQL 15+
-- ============================================================

-- Extensión para UUIDs (opcional)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- DOMINIO: USUARIOS Y AUTENTICACIÓN
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id               SERIAL PRIMARY KEY,
    nombre           VARCHAR(100)   NOT NULL,
    email            VARCHAR(150)   NOT NULL UNIQUE,
    password_hash    TEXT           NOT NULL,
    rol              VARCHAR(30)    NOT NULL DEFAULT 'visitante'
                         CHECK (rol IN ('superadmin','admin','editor','visitante')),
    activo           BOOLEAN        NOT NULL DEFAULT true,
    avatar_url       TEXT,
    semestre         INTEGER,
    promedio         DECIMAL(4,2),
    horas_trabajo    INTEGER        NOT NULL DEFAULT 0,
    token_reset      TEXT,
    token_reset_exp  TIMESTAMP,
    creado_en        TIMESTAMP      NOT NULL DEFAULT NOW(),
    actualizado_en   TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sesiones_log (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    ip_address  INET,
    user_agent  TEXT,
    creado_en   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DOMINIO: CONTENIDO DINÁMICO
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias (
    id         SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL UNIQUE,
    color_hex  VARCHAR(7)   DEFAULT '#1A5276',
    tipo       VARCHAR(30)  NOT NULL
                   CHECK (tipo IN ('noticias','eventos','convocatorias','multimedia'))
);

CREATE TABLE IF NOT EXISTS noticias (
    id           SERIAL PRIMARY KEY,
    titulo       VARCHAR(300)  NOT NULL,
    slug         VARCHAR(350)  NOT NULL UNIQUE,
    resumen      TEXT,
    contenido    TEXT          NOT NULL,
    imagen_url   TEXT,
    categoria_id INTEGER       REFERENCES categorias(id) ON DELETE SET NULL,
    autor_id     INTEGER       REFERENCES usuarios(id) ON DELETE SET NULL,
    publicado    BOOLEAN       NOT NULL DEFAULT false,
    destacado    BOOLEAN       NOT NULL DEFAULT false,
    vistas       INTEGER       NOT NULL DEFAULT 0,
    publicado_en TIMESTAMP,
    creado_en    TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_noticias_slug      ON noticias(slug);
CREATE INDEX IF NOT EXISTS idx_noticias_publicado ON noticias(publicado);

CREATE TABLE IF NOT EXISTS eventos (
    id              SERIAL PRIMARY KEY,
    titulo          VARCHAR(300) NOT NULL,
    descripcion     TEXT,
    tipo            VARCHAR(50)  NOT NULL
                        CHECK (tipo IN ('taller','seminario','defensa','examen','fecha_admin','otro')),
    fecha_inicio    TIMESTAMP    NOT NULL,
    fecha_fin       TIMESTAMP,
    lugar           VARCHAR(200),
    enlace_virtual  TEXT,
    color           VARCHAR(7)   DEFAULT '#C0392B',
    autor_id        INTEGER      REFERENCES usuarios(id) ON DELETE SET NULL,
    publicado       BOOLEAN      NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS convocatorias (
    id           SERIAL PRIMARY KEY,
    titulo       VARCHAR(300)  NOT NULL,
    tipo         VARCHAR(50)   NOT NULL
                     CHECK (tipo IN ('docentes','pasantias','investigacion','becas','otro')),
    descripcion  TEXT          NOT NULL,
    fecha_limite DATE,
    archivo_url  TEXT,
    publicado    BOOLEAN       NOT NULL DEFAULT false,
    autor_id     INTEGER       REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en    TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grupos_whatsapp (
    id               SERIAL PRIMARY KEY,
    materia_nombre   VARCHAR(200) NOT NULL,
    semestre         INTEGER      NOT NULL,
    gestion          VARCHAR(10)  NOT NULL,
    enlace_wa        TEXT         NOT NULL,
    activo           BOOLEAN      NOT NULL DEFAULT true,
    actualizado_por  INTEGER      REFERENCES usuarios(id) ON DELETE SET NULL,
    actualizado_en   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DOMINIO: PERSONAS
-- ============================================================
CREATE TABLE IF NOT EXISTS docentes (
    id               SERIAL PRIMARY KEY,
    nombre_completo  VARCHAR(200) NOT NULL,
    foto_url         TEXT,
    titulo_academico VARCHAR(100),
    especialidad     TEXT,
    email            VARCHAR(150),
    bio_corta        TEXT,
    tipo             VARCHAR(30)  NOT NULL DEFAULT 'titular'
                         CHECK (tipo IN ('titular','interino','invitado')),
    activo           BOOLEAN      NOT NULL DEFAULT true,
    creado_en        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materias (
    id       SERIAL PRIMARY KEY,
    nombre   VARCHAR(300) NOT NULL,
    codigo   VARCHAR(20)  UNIQUE,
    semestre INTEGER      NOT NULL,
    creditos INTEGER,
    area     VARCHAR(100),
    tipo     VARCHAR(30)  NOT NULL DEFAULT 'obligatoria'
                 CHECK (tipo IN ('obligatoria','electiva','taller')),
    pensum   VARCHAR(20)  NOT NULL DEFAULT '2023',
    activa   BOOLEAN      NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS docente_materias (
    docente_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
    gestion    VARCHAR(10) NOT NULL,
    PRIMARY KEY (docente_id, materia_id, gestion)
);

CREATE TABLE IF NOT EXISTS mejores_estudiantes (
    id               SERIAL PRIMARY KEY,
    nombre_completo  VARCHAR(200)   NOT NULL,
    foto_url         TEXT,
    promedio         DECIMAL(4,2)   NOT NULL,
    semestre_actual  INTEGER,
    gestion          VARCHAR(10)    NOT NULL,
    logros           TEXT,
    publicado        BOOLEAN        NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS egresados (
    id                   SERIAL PRIMARY KEY,
    nombre_completo      VARCHAR(200) NOT NULL,
    foto_url             TEXT,
    anio_egreso          INTEGER,
    ocupacion_actual     VARCHAR(300),
    empresa_institucion  VARCHAR(300),
    testimonio           TEXT,
    linkedin_url         TEXT,
    publicado            BOOLEAN      NOT NULL DEFAULT false
);

-- ============================================================
-- DOMINIO: MULTIMEDIA
-- ============================================================
CREATE TABLE IF NOT EXISTS albumes (
    id           SERIAL PRIMARY KEY,
    nombre       VARCHAR(200) NOT NULL,
    descripcion  TEXT,
    portada_url  TEXT,
    publicado    BOOLEAN      NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS galeria_imagenes (
    id             SERIAL PRIMARY KEY,
    titulo         VARCHAR(200),
    url            TEXT         NOT NULL,
    thumbnail_url  TEXT,
    album_id       INTEGER      REFERENCES albumes(id) ON DELETE SET NULL,
    subido_por     INTEGER      REFERENCES usuarios(id) ON DELETE SET NULL,
    publicado      BOOLEAN      NOT NULL DEFAULT false,
    creado_en      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS multimedia_estudiantes (
    id              SERIAL PRIMARY KEY,
    titulo          VARCHAR(300)  NOT NULL,
    tipo            VARCHAR(30)   NOT NULL
                        CHECK (tipo IN ('video','podcast','fotografia','reportaje','otro')),
    descripcion     TEXT,
    url_contenido   TEXT          NOT NULL,
    thumbnail_url   TEXT,
    autor_nombre    VARCHAR(200)  NOT NULL,
    materia_origen  VARCHAR(200),
    gestion         VARCHAR(10),
    destacado       BOOLEAN       NOT NULL DEFAULT false,
    publicado       BOOLEAN       NOT NULL DEFAULT false,
    creado_en       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canales_streaming (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    plataforma  VARCHAR(30)  NOT NULL
                    CHECK (plataforma IN ('youtube','tiktok','facebook','radio')),
    url_canal   TEXT         NOT NULL,
    embed_id    TEXT,
    activo      BOOLEAN      NOT NULL DEFAULT true
);

-- ============================================================
-- DOMINIO: ACADÉMICO E INSTITUCIONAL
-- ============================================================
CREATE TABLE IF NOT EXISTS contenido_institucional (
    id               SERIAL PRIMARY KEY,
    clave            VARCHAR(50)  NOT NULL UNIQUE,
    titulo           VARCHAR(300),
    contenido        TEXT         NOT NULL,
    actualizado_por  INTEGER      REFERENCES usuarios(id) ON DELETE SET NULL,
    actualizado_en   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tramites (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(300) NOT NULL,
    descripcion TEXT,
    pasos       JSONB,
    archivo_url TEXT,
    contacto    VARCHAR(200),
    activo      BOOLEAN      NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS convenios (
    id                  SERIAL PRIMARY KEY,
    nombre_institucion  VARCHAR(300) NOT NULL,
    tipo                VARCHAR(50)  NOT NULL CHECK (tipo IN ('nacional','internacional')),
    descripcion         TEXT,
    logo_url            TEXT,
    url_sitio           TEXT,
    activo              BOOLEAN      NOT NULL DEFAULT true
);

-- ============================================================
-- DATOS INICIALES
-- ============================================================
-- Superadmin por defecto (contraseña: Admin1234! — CAMBIAR INMEDIATAMENTE)
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Administrador', 'admin@comunicacion.umsa.bo',
 '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uHl/SiDa2', 'superadmin')
ON CONFLICT (email) DO NOTHING;

-- Categorías base
INSERT INTO categorias (nombre, color_hex, tipo) VALUES
('Académico',      '#1A5276', 'noticias'),
('Institucional',  '#C0392B', 'noticias'),
('Cultural',       '#1E8449', 'noticias'),
('Taller',         '#1A5276', 'eventos'),
('Seminario',      '#C0392B', 'eventos'),
('Defensa',        '#7D6608', 'eventos'),
('Docentes',       '#C0392B', 'convocatorias'),
('Pasantías',      '#1A5276', 'convocatorias'),
('Video',          '#C0392B', 'multimedia'),
('Fotografía',     '#1A5276', 'multimedia')
ON CONFLICT (nombre) DO NOTHING;

-- Contenido institucional base
INSERT INTO contenido_institucional (clave, titulo, contenido) VALUES
('mision', 'Misión', 'Formar profesionales de la Comunicación Social altamente competentes, capaces de diseñar e implementar estrategias que impulsen el desarrollo económico, social y cultural de nuestra sociedad, promoviendo una comunicación efectiva, responsable y que fortalezca las condiciones de diálogo entre sus ciudadanos.'),
('vision', 'Visión', 'La Carrera de Comunicación Social de la Universidad Mayor de San Andrés es la unidad Académica de Referencia Nacional y la más grande de Bolivia, dedicada a la formación de profesionales e investigadores de la Comunicación Social, constituyéndose en el laboratorio del conocimiento renovador.'),
('historia', 'Historia', 'La carrera de Ciencias de la Comunicación Social de la UMSA fue fundada el 20 de agosto de 1984, como parte de un intento de respuesta a un momento crucial de la historia del país, en que de manera colectiva, se luchaba por la consolidación de la democracia.'),
('pensum_info', 'Pensum 2023', 'A partir de 2023 la carrera cuenta con un nuevo plan de estudios que moderniza la formación de comunicadores sociales, integrando nuevas tecnologías y competencias digitales.')
ON CONFLICT (clave) DO NOTHING;

-- Canales de streaming base
INSERT INTO canales_streaming (nombre, plataforma, url_canal, activo) VALUES
('Canal YouTube CCS UMSA', 'youtube', 'https://youtube.com/@comunicacionsocialumsa', true),
('TikTok Comunicación UMSA', 'tiktok', 'https://tiktok.com/@comunicacion_social_umsa', true)
ON CONFLICT DO NOTHING;
-- ============================================================
-- NUEVOS MÓDULOS: Sesiones de Eventos, Malla Histórica, Convenios
-- Ejecutar en pgAdmin > Query Tool > comunicacion_umsa
-- ============================================================

-- 1. SESIONES DE EVENTOS
-- Permite registrar lo que se trató en cada sesión de un evento largo
-- (ej: taller de 2 meses → cada clase es una sesión)
CREATE TABLE IF NOT EXISTS evento_sesiones (
    id              SERIAL PRIMARY KEY,
    evento_id       INT REFERENCES eventos(id) ON DELETE CASCADE,
    numero_sesion   INT NOT NULL DEFAULT 1,
    titulo          TEXT NOT NULL,
    fecha           TIMESTAMP,
    descripcion     TEXT,
    contenido_visto TEXT,          -- Resumen del temario cubierto en esa sesión
    material_url    TEXT,          -- Link a PDF/drive con material de la sesión
    grabacion_url   TEXT,          -- Link a grabación en YouTube/Drive
    enlace_virtual  TEXT,          -- Zoom/Meet para sesiones futuras
    publicado       BOOLEAN NOT NULL DEFAULT true,
    creado_en       TIMESTAMP DEFAULT NOW()
);

-- Índice para buscar sesiones por evento
CREATE INDEX IF NOT EXISTS idx_sesiones_evento ON evento_sesiones(evento_id);

-- Agregar columna a eventos para marcar si tiene sesiones múltiples
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eventos' AND column_name='tiene_sesiones') THEN
        ALTER TABLE eventos ADD COLUMN tiene_sesiones BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eventos' AND column_name='es_recurrente') THEN
        ALTER TABLE eventos ADD COLUMN es_recurrente BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eventos' AND column_name='total_sesiones') THEN
        ALTER TABLE eventos ADD COLUMN total_sesiones INT;
    END IF;
END $$;

-- 2. MALLA CURRICULAR HISTÓRICA (pensum antiguo 2001)
-- Agregar la columna activa si no existe
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materias' AND column_name='activa') THEN
        ALTER TABLE materias ADD COLUMN activa BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Insertar materias del pensum 2001 (histórico para estudiantes antiguos)
DELETE FROM materias WHERE pensum = '2001';

INSERT INTO materias (nombre, codigo, semestre, creditos, area, tipo, pensum) VALUES
-- Semestre 1
('Introducción a la Comunicación',       'CS01-01', 1, 4, 'Teoría',      'obligatoria', '2001'),
('Sociología General',                   'CS01-02', 1, 4, 'Teoría',      'obligatoria', '2001'),
('Historia de Bolivia',                  'CS01-03', 1, 3, 'Contexto',    'obligatoria', '2001'),
('Lenguaje y Redacción',                 'CS01-04', 1, 3, 'Lenguaje',    'obligatoria', '2001'),
('Matemáticas Básicas',                  'CS01-05', 1, 2, 'Ciencias',    'obligatoria', '2001'),
-- Semestre 2
('Teorías de la Comunicación',           'CS01-06', 2, 4, 'Teoría',      'obligatoria', '2001'),
('Sociología de la Comunicación',        'CS01-07', 2, 4, 'Teoría',      'obligatoria', '2001'),
('Taller de Redacción I',                'CS01-08', 2, 3, 'Práctica',    'taller',      '2001'),
('Fotografía',                           'CS01-09', 2, 3, 'Práctica',    'taller',      '2001'),
('Estadística Básica',                   'CS01-10', 2, 2, 'Ciencias',    'obligatoria', '2001'),
-- Semestre 3
('Semiótica',                            'CS01-11', 3, 4, 'Teoría',      'obligatoria', '2001'),
('Periodismo Escrito I',                 'CS01-12', 3, 4, 'Periodismo',  'taller',      '2001'),
('Comunicación Audiovisual I',           'CS01-13', 3, 4, 'Audiovisual', 'taller',      '2001'),
('Metodología de Investigación I',       'CS01-14', 3, 3, 'Investigación','obligatoria','2001'),
-- Semestre 4
('Comunicación y Cultura',               'CS01-15', 4, 3, 'Teoría',      'obligatoria', '2001'),
('Periodismo Escrito II',                'CS01-16', 4, 4, 'Periodismo',  'taller',      '2001'),
('Radio I',                              'CS01-17', 4, 4, 'Radio',       'taller',      '2001'),
('Comunicación Audiovisual II',          'CS01-18', 4, 4, 'Audiovisual', 'taller',      '2001'),
('Metodología de Investigación II',      'CS01-19', 4, 3, 'Investigación','obligatoria','2001'),
-- Semestre 5
('Comunicación y Desarrollo',            'CS01-20', 5, 3, 'Teoría',      'obligatoria', '2001'),
('Periodismo Digital',                   'CS01-21', 5, 4, 'Digital',     'taller',      '2001'),
('Radio II',                             'CS01-22', 5, 4, 'Radio',       'taller',      '2001'),
('Televisión I',                         'CS01-23', 5, 4, 'Televisión',  'taller',      '2001'),
('Comunicación Organizacional',          'CS01-24', 5, 3, 'Organizacional','obligatoria','2001'),
-- Semestre 6
('Ética Periodística',                   'CS01-25', 6, 3, 'Teoría',      'obligatoria', '2001'),
('Investigación Periodística',           'CS01-26', 6, 4, 'Periodismo',  'taller',      '2001'),
('Producción Radiofónica',               'CS01-27', 6, 4, 'Radio',       'taller',      '2001'),
('Televisión II',                        'CS01-28', 6, 4, 'Televisión',  'taller',      '2001'),
-- Semestre 7
('Comunicación Política',                'CS01-29', 7, 3, 'Teoría',      'obligatoria', '2001'),
('Producción Multimedia',                'CS01-30', 7, 4, 'Digital',     'taller',      '2001'),
('Relaciones Públicas',                  'CS01-31', 7, 3, 'Organizacional','obligatoria','2001'),
('Investigación en Comunicación I',      'CS01-32', 7, 3, 'Investigación','obligatoria','2001'),
-- Semestre 8
('Taller de Síntesis I',                 'CS01-33', 8, 4, 'Síntesis',    'taller',      '2001'),
('Marketing y Publicidad',               'CS01-34', 8, 3, 'Organizacional','obligatoria','2001'),
('Investigación en Comunicación II',     'CS01-35', 8, 3, 'Investigación','obligatoria','2001'),
('Materia Electiva I',                   'CS01-36', 8, 3, 'Electivo',    'electiva',    '2001'),
-- Semestre 9
('Taller de Síntesis II',                'CS01-37', 9, 4, 'Síntesis',    'taller',      '2001'),
('Gestión de Medios',                    'CS01-38', 9, 3, 'Organizacional','obligatoria','2001'),
('Práctica Profesional',                 'CS01-39', 9, 4, 'Práctica',    'obligatoria', '2001'),
('Materia Electiva II',                  'CS01-40', 9, 3, 'Electivo',    'electiva',    '2001'),
-- Semestre 10
('Proyecto de Grado / Tesis',            'CS01-41', 10, 8, 'Grado',      'obligatoria', '2001'),
('Trabajo Dirigido',                     'CS01-42', 10, 8, 'Grado',      'electiva',    '2001');

-- 3. CONVENIOS INSTITUCIONALES
CREATE TABLE IF NOT EXISTS convenios (
    id                   SERIAL PRIMARY KEY,
    nombre_institucion   TEXT NOT NULL,
    tipo_institucion     TEXT DEFAULT 'empresa',  -- empresa, gobierno, ong, academia, medio
    descripcion          TEXT,
    tipo_convenio        TEXT DEFAULT 'pasantia', -- pasantia, investigacion, practica, academico
    cupos_disponibles    INT,
    duracion_meses       INT,                     -- duración en meses de la pasantía
    requisitos           TEXT,
    fecha_inicio         DATE,
    fecha_vencimiento    DATE,                    -- cuando vence el convenio
    contacto_nombre      TEXT,
    contacto_email       TEXT,
    contacto_telefono    TEXT,
    logo_url             TEXT,
    activo               BOOLEAN NOT NULL DEFAULT true,
    publicado            BOOLEAN NOT NULL DEFAULT true,
    creado_en            TIMESTAMP DEFAULT NOW(),
    actualizado_en       TIMESTAMP DEFAULT NOW()
);

-- Datos de ejemplo
INSERT INTO convenios (nombre_institucion, tipo_institucion, descripcion, tipo_convenio, cupos_disponibles, duracion_meses, fecha_inicio, fecha_vencimiento, activo, publicado) VALUES
('ATB Televisión', 'medio', 'Pasantías en producción audiovisual, periodismo y redacción digital.', 'pasantia', 3, 3, '2026-01-01', '2026-12-31', true, true),
('Red Uno de Bolivia', 'medio', 'Pasantías en periodismo, cámara y edición de video.', 'pasantia', 2, 3, '2026-01-01', '2026-12-31', true, true),
('Ministerio de Comunicaciones', 'gobierno', 'Prácticas en comunicación institucional y relaciones públicas.', 'practica', 2, 6, '2026-01-01', '2026-12-31', true, true),
('Fundación UNIR Bolivia', 'ong', 'Convenio de investigación en comunicación para el desarrollo.', 'investigacion', 1, 12, '2025-07-01', '2027-06-30', true, true);

-- 4. Verificar todo
SELECT 'TABLAS CREADAS:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('evento_sesiones','convenios') ORDER BY table_name;

SELECT 'MATERIAS POR PENSUM:' as info;
SELECT pensum, COUNT(*) as total FROM materias WHERE activa=true GROUP BY pensum ORDER BY pensum;

SELECT 'CONVENIOS:' as info;
SELECT id, nombre_institucion, tipo_convenio, fecha_vencimiento FROM convenios;
