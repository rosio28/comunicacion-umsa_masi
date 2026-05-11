# GUÍA DE INSTALACIÓN COMPLETA
# Página Web — Carrera de Ciencias de la Comunicación Social UMSA
# Stack: React + PHP 8 + PostgreSQL
# ============================================================

## ESTRUCTURA DEL PROYECTO
```
proyecto/
├── backend/          ← PHP API (va al servidor/hosting)
│   ├── api/          ← Todos los archivos PHP
│   │   ├── index.php       ← Router principal
│   │   ├── .htaccess       ← Rewrite rules
│   │   ├── config/
│   │   │   ├── config.php      ← CONFIGURAR ESTO PRIMERO
│   │   │   └── database.php
│   │   ├── controllers/    ← Lógica de negocio
│   │   ├── middleware/     ← Auth JWT
│   │   └── utils/          ← JWT, Mailer, Response
│   └── composer.json
├── frontend/         ← React (se despliega en Vercel/Netlify)
│   ├── src/
│   │   ├── App.jsx         ← Rutas principales
│   │   ├── main.jsx
│   │   ├── context/        ← AuthContext
│   │   ├── pages/          ← Páginas públicas
│   │   ├── pages/admin/    ← Panel de administración
│   │   ├── components/     ← Componentes reutilizables
│   │   ├── services/       ← API calls (axios)
│   │   └── utils/          ← Helpers
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── database/
    └── schema.sql    ← Script completo de la base de datos
```

---

## PASO 1 — INSTALAR HERRAMIENTAS NECESARIAS

### En tu computadora (desarrollo local):
1. **Node.js 20+**: https://nodejs.org/
2. **PHP 8.2+**: https://www.php.net/downloads (o XAMPP para Windows)
3. **Composer**: https://getcomposer.org/download/
4. **PostgreSQL 15+**: https://www.postgresql.org/download/
5. **Git**: https://git-scm.com/

### Verificar instalaciones:
```bash
node --version       # Debe mostrar v20.x.x
php --version        # Debe mostrar PHP 8.2.x
composer --version   # Debe mostrar Composer version 2.x
psql --version       # Debe mostrar psql 15.x
```

---

## PASO 2 — CONFIGURAR LA BASE DE DATOS

### Crear la base de datos en PostgreSQL:
```bash
# Abrir consola de PostgreSQL
psql -U postgres

# En la consola psql:
CREATE DATABASE comunicacion_umsa;
CREATE USER ccs_user WITH PASSWORD 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON DATABASE comunicacion_umsa TO ccs_user;
\q
```

### Ejecutar el schema:
```bash
psql -U ccs_user -d comunicacion_umsa -f database/schema.sql
```

Esto crea TODAS las tablas y los datos iniciales (superadmin, categorías, contenido institucional).

**Credenciales iniciales del superadmin:**
- Email: admin@comunicacion.umsa.bo
- Contraseña: Admin1234!
- ⚠️ CAMBIA ESTA CONTRASEÑA INMEDIATAMENTE al primer login.

---

## PASO 3 — CONFIGURAR EL BACKEND PHP

### 3.1 Editar el archivo de configuración:
Abre `backend/api/config/config.php` y completa:

```php
define('DB_HOST',  'localhost');
define('DB_NAME',  'comunicacion_umsa');
define('DB_USER',  'ccs_user');
define('DB_PASS',  'tu_contraseña_postgres');

define('JWT_SECRET', 'pega_aqui_una_cadena_de_al_menos_32_caracteres_aleatorios');

define('FRONTEND_URL', 'http://localhost:5173'); // Cambiar en producción

// Para correo con Gmail:
define('MAIL_HOST', 'smtp.gmail.com');
define('MAIL_PORT', 587);
define('MAIL_USER', 'noreply.ccs.umsa@gmail.com');
define('MAIL_PASS', 'tu_app_password_de_gmail'); // Ver paso 3.2

define('ADMIN_EMAIL', 'comunicasocialumsa@gmail.com');
```

### 3.2 Configurar Gmail para envío de correos reales:
1. Ve a tu cuenta de Gmail → Seguridad → Verificación en 2 pasos (activar si no está)
2. Luego ve a: Seguridad → Contraseñas de aplicaciones
3. Crea una nueva: Selecciona "Correo" y "Computadora Windows/Mac/Linux"
4. Gmail te genera una clave de 16 caracteres → cópiala como `MAIL_PASS`

### 3.3 Instalar dependencias PHP:
```bash
cd backend
composer install
```

Esto instala PHPMailer, Cloudinary SDK y Firebase JWT en la carpeta `vendor/`.

### 3.4 Ejecutar el servidor PHP en desarrollo:
```bash
cd backend/api
php -S localhost:8000
```
La API estará disponible en: http://localhost:8000/api

---

## PASO 4 — CONFIGURAR EL FRONTEND REACT

### 4.1 Instalar dependencias:
```bash
cd frontend
npm install
```

### 4.2 Crear el archivo .env:
```bash
cp .env.example .env
```
Edita `.env`:
```
VITE_API_URL=http://localhost:8000/api
```

### 4.3 Iniciar el servidor de desarrollo:
```bash
npm run dev
```
El sitio estará en: http://localhost:5173

---

## PASO 5 — VERIFICAR QUE TODO FUNCIONA

Con el backend en http://localhost:8000 y el frontend en http://localhost:5173:

1. Abre http://localhost:5173 → Debe mostrarse la página principal con colores rojo y azul.
2. Ve a http://localhost:5173/admin/login → Debe aparecer el formulario de login.
3. Ingresa con: admin@comunicacion.umsa.bo / Admin1234!
4. Debes ver el dashboard de administración.
5. **Cambia la contraseña inmediatamente** desde el perfil.

### Probar el envío de correo:
1. Ve al formulario de contacto: http://localhost:5173/contacto
2. Envía un mensaje de prueba.
3. Verifica que llegue al correo configurado en ADMIN_EMAIL.

---

## PASO 6 — DESPLIEGUE EN PRODUCCIÓN

### 6.1 Desplegar el frontend en Vercel (GRATIS):
1. Crea cuenta en https://vercel.com
2. Conecta tu repositorio de GitHub (sube el proyecto a GitHub primero)
3. En Vercel: "New Project" → selecciona el repositorio
4. **Root Directory**: `frontend`
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`
7. En "Environment Variables" agrega:
   ```
   VITE_API_URL = https://tudominio.com/api
   ```
8. Haz clic en "Deploy"

Tu sitio quedará en: https://tu-proyecto.vercel.app

### 6.2 Desplegar el backend PHP en hosting compartido (Hostinger, cPanel, etc.):

**Opción A — Hosting compartido con cPanel:**
1. Desde el cPanel, crea una base de datos PostgreSQL (o MySQL si no hay PostgreSQL → ver nota abajo)
2. Sube la carpeta `backend/` al servidor vía FTP (FileZilla) o el administrador de archivos del cPanel
3. La carpeta `api/` debe quedar en public_html/api/ o en una subcarpeta
4. Edita `config.php` con los datos del hosting
5. Ejecuta `schema.sql` desde el phpPgAdmin o la consola SSH:
   ```bash
   psql -U usuario_db -d nombre_db -f schema.sql
   ```

**Nota sobre MySQL:** Si tu hosting no tiene PostgreSQL, cambia el driver en `database.php`:
```php
$dsn = "mysql:host=". DB_HOST .";dbname=". DB_NAME .";charset=utf8mb4";
```
Y reemplaza `SERIAL` por `INT AUTO_INCREMENT` en el schema.sql.

**Opción B — VPS/Railway (recomendado para PostgreSQL):**
1. Crea cuenta en https://railway.app
2. "New Project" → "Deploy from GitHub"
3. Configura las variables de entorno (igual que config.php)
4. Railway detecta PHP automáticamente con el Procfile

**Procfile para Railway** (crear en `/backend/`):
```
web: php -S 0.0.0.0:$PORT -t api/
```

### 6.3 Configurar el dominio/subdominio:
Pide al equipo de DTIC de la UMSA que creen un subdominio:
- `nueva.comunicacion.umsa.bo` → apunta al frontend en Vercel
- `api.comunicacion.umsa.bo` → apunta al backend PHP

Actualiza el `config.php`:
```php
define('FRONTEND_URL', 'https://nueva.comunicacion.umsa.bo');
```

Y el `.env` del frontend:
```
VITE_API_URL=https://api.comunicacion.umsa.bo/api
```

---

## PASO 7 — CONFIGURACIÓN INICIAL DEL CONTENIDO

Una vez la página está en línea, sigue este orden:

### 7.1 Agregar las materias de la malla curricular:
En el panel admin → Malla Curricular, agrega cada materia del pensum 2023 indicando semestre, créditos y área.

### 7.2 Agregar docentes:
Admin → Docentes → Agregar docente (foto, nombre, título, especialidad, correo).

### 7.3 Agregar grupos de WhatsApp:
Admin → WhatsApp → Agregar grupo (materia, semestre, gestión, enlace).

### 7.4 Publicar la primera noticia:
Admin → Noticias → Nueva noticia → Marcar como destacada → Publicar.

### 7.5 Subir fotos a la galería:
Admin → Galería → Crear álbum → Subir fotos.

### 7.6 Verificar el contenido institucional:
Admin → Institucional → Editar misión, visión e historia.

---

## PASO 8 — CREAR EL PRIMER EQUIPO ADMINISTRADOR

Solo el **superadmin** puede crear otros usuarios:
1. Panel admin → Usuarios → Nuevo usuario
2. Ingresa: nombre, email, rol (admin o editor)
3. El sistema envía automáticamente un correo con la contraseña temporal
4. El nuevo usuario debe iniciar sesión y cambiar su contraseña

---

## ESTRUCTURA DE ARCHIVOS PHP A SUBIR AL HOSTING

```
public_html/
└── api/
    ├── index.php         ← Router
    ├── .htaccess         ← Rewrite rules (OBLIGATORIO)
    ├── config/
    │   ├── config.php    ← Configuración (NUNCA subir con datos reales a GitHub)
    │   └── database.php
    ├── controllers/
    │   ├── AuthController.php
    │   ├── NoticiasController.php
    │   ├── DocentesController.php
    │   └── AllControllers.php
    ├── middleware/
    │   └── Auth.php
    ├── utils/
    │   ├── JWT.php
    │   ├── Response.php
    │   └── Mailer.php
    ├── uploads/          ← Carpeta con permisos 755
    └── vendor/           ← Generado por composer install
```

---

## SOLUCIÓN DE PROBLEMAS COMUNES

### Error CORS (el frontend no puede llamar al backend):
Edita `config.php` y asegúrate que `FRONTEND_URL` coincide exactamente con tu dominio de Vercel, incluyendo https:// y sin barra final.

### Error 404 en las rutas de la API:
Verifica que el `.htaccess` está en la misma carpeta que `index.php` y que el hosting tiene mod_rewrite activo. En cPanel: Apache Handlers → activa mod_rewrite.

### No llegan los correos:
1. Verifica que la contraseña de aplicación de Gmail es correcta (16 caracteres sin espacios).
2. Activa "Acceso de aplicaciones menos seguras" si usas cuenta vieja de Gmail.
3. Alternativa: usa Mailtrap (https://mailtrap.io) para pruebas.

### Error al subir imágenes:
Verifica que la carpeta `uploads/` tiene permisos 755 en el servidor:
```bash
chmod 755 api/uploads/
```

### El frontend muestra pantalla en blanco:
Abre la consola del navegador (F12 → Console) y revisa el error. Generalmente es la variable `VITE_API_URL` incorrecta en el `.env`.

---

## CREDENCIALES INICIALES (CAMBIAR INMEDIATAMENTE)

| Campo    | Valor                              |
|----------|------------------------------------|
| URL      | http://localhost:5173/admin/login  |
| Email    | admin@comunicacion.umsa.bo         |
| Contraseña | Admin1234!                       |
| Rol      | superadmin                         |

---

## COMANDOS ÚTILES

```bash
# Frontend
npm run dev          # Servidor de desarrollo
npm run build        # Compilar para producción
npm run preview      # Previsualizar build

# Backend PHP
php -S localhost:8000 -t api/    # Servidor de desarrollo
composer install                  # Instalar dependencias
composer update                   # Actualizar dependencias

# Base de datos
psql -U ccs_user -d comunicacion_umsa          # Acceder a la DB
psql -U ccs_user -d comunicacion_umsa -f schema.sql   # Ejecutar schema

# Reset de contraseña de superadmin (si te quedas bloqueado):
psql -U ccs_user -d comunicacion_umsa
UPDATE usuarios SET password_hash = '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uHl/SiDa2'
  WHERE email = 'admin@comunicacion.umsa.bo';
-- Contraseña: Admin1234!
```

---

## TECNOLOGÍAS Y VERSIONES UTILIZADAS

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.x | Frontend SPA |
| Vite | 5.x | Bundler React |
| TailwindCSS | 3.x | Estilos (rojo #C0392B, azul #1A5276) |
| React Router | 6.x | Navegación SPA |
| TanStack Query | 5.x | Cache de datos |
| FullCalendar | 6.x | Calendario de eventos |
| Axios | 1.x | Cliente HTTP |
| PHP | 8.2 | Backend API REST |
| PHPMailer | 6.x | Envío de correos SMTP |
| PostgreSQL | 15+ | Base de datos |
| Cloudinary | opcional | Almacenamiento de imágenes |

---

Elaborado por el equipo de pasantía — Comunicación Social UMSA, 2026
