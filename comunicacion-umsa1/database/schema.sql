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
