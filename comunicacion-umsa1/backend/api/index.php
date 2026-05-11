<?php
// ============================================================
// ROUTER PRINCIPAL — backend/api/index.php
// VERSIÓN DEFINITIVA — sin clases duplicadas
// ============================================================
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/Response.php';
require_once __DIR__ . '/utils/JWT.php';
require_once __DIR__ . '/utils/Upload.php';
require_once __DIR__ . '/middleware/Auth.php';

// ── CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// ── CONTROLLERS
// IMPORTANTE: Solo cargamos AllControllers.php (que ya tiene todo).
// NuevosControllers.php NO se carga aquí para evitar clases duplicadas.
// Si ya copiaste el contenido de NuevosControllers al final de AllControllers,
// entonces elimina o ignora el archivo NuevosControllers.php.
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/NoticiasController.php';
require_once __DIR__ . '/controllers/DocentesController.php';
require_once __DIR__ . '/controllers/AllControllers.php';
// NO agregar NuevosControllers.php — las clases ya están en AllControllers.php

// ── ROUTING
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = str_replace('\\', '/', $uri);
$base   = '/api';
$path   = str_starts_with($uri, $base) ? substr($uri, strlen($base)) : $uri;
$path   = trim($path, '/');
$parts  = explode('/', $path);
$method = $_SERVER['REQUEST_METHOD'];

$r0 = $parts[0] ?? '';
$r1 = $parts[1] ?? '';
$r2 = $parts[2] ?? '';
$r3 = $parts[3] ?? '';

try {
    match(true) {

        // ── AUTH
        $r0==='auth' && $r1==='login'            && $method==='POST' => (new AuthController)->login(),
        $r0==='auth' && $r1==='me'               && $method==='GET'  => (new AuthController)->me(),
        $r0==='auth' && $r1==='cambiar-password' && $method==='POST' => (new AuthController)->cambiarPassword(),
        $r0==='auth' && $r1==='recuperar'        && $method==='POST' => (new AuthController)->recuperar(),
        $r0==='auth' && $r1==='reset-password'   && $method==='POST' => (new AuthController)->resetPassword(),

        // ── NOTICIAS
        $r0==='noticias' && !$r1                    && $method==='GET'    => (new NoticiasController)->index(),
        $r0==='noticias' && !$r1                    && $method==='POST'   => (new NoticiasController)->store(),
        $r0==='noticias' && $r1 && $r2==='publicar' && $method==='PATCH'  => (new NoticiasController)->togglePublicar((int)$r1),
        $r0==='noticias' && $r1 && $r2!=='publicar' && $method==='GET'    => (new NoticiasController)->show($r1),
        $r0==='noticias' && $r1 && $r2!=='publicar' && $method==='PUT'    => (new NoticiasController)->update((int)$r1),
        $r0==='noticias' && $r1                     && $method==='DELETE' => (new NoticiasController)->destroy((int)$r1),

        // ── CATEGORÍAS
        $r0==='categorias' && !$r1 && $method==='GET'    => (new CategoriasController)->index(),
        $r0==='categorias' && !$r1 && $method==='POST'   => (new CategoriasController)->store(),
        $r0==='categorias' && $r1  && $method==='DELETE' => (new CategoriasController)->destroy((int)$r1),

        // ── EVENTOS + SESIONES (sesiones van ANTES que rutas genéricas)
        $r0==='eventos' && $r1 && $r2==='sesiones' && !$r3 && $method==='GET'    => (new EventoSesionesController)->index((int)$r1),
        $r0==='eventos' && $r1 && $r2==='sesiones' && !$r3 && $method==='POST'   => (new EventoSesionesController)->store((int)$r1),
        $r0==='eventos' && $r1 && $r2==='sesiones' && $r3  && $method==='PUT'    => (new EventoSesionesController)->update((int)$r3),
        $r0==='eventos' && $r1 && $r2==='sesiones' && $r3  && $method==='DELETE' => (new EventoSesionesController)->destroy((int)$r3),
        $r0==='eventos' && !$r1               && $method==='GET'    => (new EventosController)->index(),
        $r0==='eventos' && !$r1               && $method==='POST'   => (new EventosController)->store(),
        $r0==='eventos' && $r1 && !$r2        && $method==='PUT'    => (new EventosController)->update((int)$r1),
        $r0==='eventos' && $r1 && !$r2        && $method==='DELETE' => (new EventosController)->destroy((int)$r1),

        // ── CONVOCATORIAS (el modelo existente: becas, pasantías anunciadas)
        $r0==='convocatorias' && !$r1 && $method==='GET'    => (new ConvocatoriasController)->index(),
        $r0==='convocatorias' && !$r1 && $method==='POST'   => (new ConvocatoriasController)->store(),
        $r0==='convocatorias' && $r1  && $method==='PUT'    => (new ConvocatoriasController)->update((int)$r1),
        $r0==='convocatorias' && $r1  && $method==='DELETE' => (new ConvocatoriasController)->destroy((int)$r1),

        // ── CONVENIOS INSTITUCIONALES (tabla nueva)
        $r0==='convenios' && !$r1 && $method==='GET'    => (new ConveniosController)->index(),
        $r0==='convenios' && !$r1 && $method==='POST'   => (new ConveniosController)->store(),
        $r0==='convenios' && $r1  && $method==='PUT'    => (new ConveniosController)->update((int)$r1),
        $r0==='convenios' && $r1  && $method==='DELETE' => (new ConveniosController)->destroy((int)$r1),

        // ── DOCENTES
        $r0==='docentes' && !$r1 && $method==='GET'    => (new DocentesController)->index(),
        $r0==='docentes' && !$r1 && $method==='POST'   => (new DocentesController)->store(),
        $r0==='docentes' && $r1  && $method==='PUT'    => (new DocentesController)->update((int)$r1),
        $r0==='docentes' && $r1  && $method==='DELETE' => (new DocentesController)->destroy((int)$r1),

        // ── MEJORES ALUMNOS
        $r0==='mejores-alumnos' && !$r1 && $method==='GET'    => (new MejoresAlumnosController)->index(),
        $r0==='mejores-alumnos' && !$r1 && $method==='POST'   => (new MejoresAlumnosController)->store(),
        $r0==='mejores-alumnos' && $r1  && $method==='PUT'    => (new MejoresAlumnosController)->update((int)$r1),
        $r0==='mejores-alumnos' && $r1  && $method==='DELETE' => (new MejoresAlumnosController)->destroy((int)$r1),

        // ── EGRESADOS
        $r0==='egresados' && !$r1 && $method==='GET'    => (new EgresadosController)->index(),
        $r0==='egresados' && !$r1 && $method==='POST'   => (new EgresadosController)->store(),
        $r0==='egresados' && $r1  && $method==='PUT'    => (new EgresadosController)->update((int)$r1),
        $r0==='egresados' && $r1  && $method==='DELETE' => (new EgresadosController)->destroy((int)$r1),

        // ── MATERIAS
        $r0==='materias' && !$r1 && $method==='GET'    => (new MateriasController)->index(),
        $r0==='materias' && !$r1 && $method==='POST'   => (new MateriasController)->store(),
        $r0==='materias' && $r1  && $method==='PUT'    => (new MateriasController)->update((int)$r1),
        $r0==='materias' && $r1  && $method==='DELETE' => (new MateriasController)->destroy((int)$r1),

        // ── WHATSAPP (admin ANTES que /{id})
        $r0==='whatsapp' && !$r1          && $method==='GET'    => (new WhatsappController)->index(),
        $r0==='whatsapp' && $r1==='admin' && $method==='GET'    => (new WhatsappController)->adminIndex(),
        $r0==='whatsapp' && !$r1          && $method==='POST'   => (new WhatsappController)->store(),
        $r0==='whatsapp' && $r1!=='admin' && $method==='PUT'    => (new WhatsappController)->update((int)$r1),
        $r0==='whatsapp' && $r1!=='admin' && $method==='DELETE' => (new WhatsappController)->destroy((int)$r1),

        // ── GALERÍA
        $r0==='galeria' && $r1==='albumes' && !$r2              && $method==='GET'    => (new GaleriaController)->albumes(),
        $r0==='galeria' && $r1==='albumes' && !$r2              && $method==='POST'   => (new GaleriaController)->crearAlbum(),
        $r0==='galeria' && $r1==='albumes' && $r2 && $r3==='imagenes' && $method==='GET' => (new GaleriaController)->imagenes((int)$r2),
        $r0==='galeria' && $r1==='albumes' && $r2 && !$r3       && $method==='PUT'    => (new GaleriaController)->actualizarAlbum((int)$r2),
        $r0==='galeria' && $r1==='albumes' && $r2 && !$r3       && $method==='DELETE' => (new GaleriaController)->eliminarAlbum((int)$r2),
        $r0==='galeria' && $r1==='imagenes' && !$r2             && $method==='POST'   => (new GaleriaController)->subirImagen(),
        $r0==='galeria' && $r1==='imagenes' && $r2              && $method==='DELETE' => (new GaleriaController)->eliminarImagen((int)$r2),

        // ── MULTIMEDIA
        $r0==='multimedia' && !$r1                   && $method==='GET'    => (new MultimediaController)->index(),
        $r0==='multimedia' && !$r1                   && $method==='POST'   => (new MultimediaController)->store(),
        $r0==='multimedia' && $r1 && $r2==='publicar' && $method==='PATCH' => (new MultimediaController)->togglePublicar((int)$r1),
        $r0==='multimedia' && $r1 && $r2!=='publicar' && $method==='PUT'   => (new MultimediaController)->update((int)$r1),
        $r0==='multimedia' && $r1                    && $method==='DELETE' => (new MultimediaController)->destroy((int)$r1),

        // ── STREAMING
        $r0==='streaming' && !$r1 && $method==='GET'    => (new StreamingController)->index(),
        $r0==='streaming' && !$r1 && $method==='POST'   => (new StreamingController)->store(),
        $r0==='streaming' && $r1  && $method==='DELETE' => (new StreamingController)->destroy((int)$r1),

        // ── INSTITUCIONAL
        $r0==='institucional' && $r1 && $method==='GET' => (new InstitucionalController)->show($r1),
        $r0==='institucional' && $r1 && $method==='PUT' => (new InstitucionalController)->update($r1),

        // ── TRÁMITES
        $r0==='tramites' && !$r1 && $method==='GET'    => (new TramitesController)->index(),
        $r0==='tramites' && !$r1 && $method==='POST'   => (new TramitesController)->store(),
        $r0==='tramites' && $r1  && $method==='PUT'    => (new TramitesController)->update((int)$r1),
        $r0==='tramites' && $r1  && $method==='DELETE' => (new TramitesController)->destroy((int)$r1),

        // ── CONTACTO
        $r0==='contacto' && $method==='POST' => (new ContactoController)->enviar(),

        // ── USUARIOS
        $r0==='usuarios' && !$r1                                && $method==='GET'    => (new UsuariosController)->index(),
        $r0==='usuarios' && !$r1                                && $method==='POST'   => (new UsuariosController)->store(),
        $r0==='usuarios' && $r1 && $r2==='reset-password'       && $method==='POST'   => (new UsuariosController)->resetPasswordAdmin((int)$r1),
        $r0==='usuarios' && $r1 && $r2!=='reset-password'       && $method==='PUT'    => (new UsuariosController)->update((int)$r1),
        $r0==='usuarios' && $r1                                 && $method==='DELETE' => (new UsuariosController)->destroy((int)$r1),

        default => Response::error("Ruta no encontrada: $method /$path", 404)
    };
} catch (\Throwable $e) {
    error_log('[CCS ERROR] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    Response::error('Error interno: ' . $e->getMessage(), 500);
}
