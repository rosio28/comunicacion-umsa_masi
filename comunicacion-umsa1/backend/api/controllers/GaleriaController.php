<?php
// GaleriaController.php
// IMPORTANTE: Este archivo reemplaza la clase GaleriaController que estaba dentro de AllControllers.php
// NO agregar require_once aquí — index.php ya carga AllControllers.php que tiene todo lo necesario
// Esta versión corrige: subida por URL (JSON y multipart), normalización de imágenes

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../utils/Upload.php';

class GaleriaController {

    // Normaliza URL de álbum
    private function na(array $a): array {
        if (!empty($a['portada_url'])) $a['portada_url'] = imageUrl($a['portada_url']);
        return $a;
    }

    // Normaliza URLs de imagen
    private function ni(array $img): array {
        if (!empty($img['url']))           $img['url']           = imageUrl($img['url']);
        if (!empty($img['thumbnail_url'])) $img['thumbnail_url'] = imageUrl($img['thumbnail_url']);
        if (empty($img['thumbnail_url']) && !empty($img['url'])) $img['thumbnail_url'] = $img['url'];
        return $img;
    }

    public function albumes(): void {
        $db    = Database::getConnection();
        $all   = !empty($_GET['all']);
        $where = $all ? '' : 'WHERE a.publicado = true';
        $stmt  = $db->query("SELECT a.*, COUNT(g.id) AS total_imagenes
            FROM albumes a
            LEFT JOIN galeria_imagenes g ON a.id = g.album_id AND g.publicado = true
            $where
            GROUP BY a.id ORDER BY a.id DESC");
        Response::success(array_map([$this, 'na'], $stmt->fetchAll()));
    }

    public function crearAlbum(): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['admin','superadmin']);

        // Soporte multipart Y JSON
        if (!empty($_POST)) {
            $nombre  = trim($_POST['nombre'] ?? '');
            $desc    = $_POST['descripcion'] ?? null;
            $pub     = ($_POST['publicado'] ?? 'true') !== 'false';
            $portada = $_POST['portada_url'] ?? null;
        } else {
            $d      = json_decode(file_get_contents('php://input'), true) ?? [];
            $nombre = trim($d['nombre'] ?? '');
            $desc   = $d['descripcion'] ?? null;
            $pub    = !isset($d['publicado']) || $d['publicado'];
            $portada= $d['portada_url'] ?? null;
        }
        if (!$nombre) Response::error('Nombre requerido');

        if (!empty($_FILES['portada']['tmp_name'])) {
            $up = uploadImage($_FILES['portada'], 'albumes');
            if ($up) $portada = $up;
        }

        $db   = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO albumes (nombre, descripcion, portada_url, publicado) VALUES (?,?,?,?) RETURNING id, nombre, portada_url");
        $stmt->execute([$nombre, $desc ?: null, $portada, $pub ? 'true' : 'false']);
        $row = $this->na($stmt->fetch());
        Response::success($row, 'Álbum creado', 201);
    }

    public function actualizarAlbum(int $id): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['admin','superadmin']);

        if (!empty($_POST)) {
            $nombre  = $_POST['nombre']      ?? null;
            $desc    = $_POST['descripcion'] ?? null;
            $pub     = isset($_POST['publicado']) ? ($_POST['publicado'] !== 'false' ? 'true' : 'false') : null;
            $portada = $_POST['portada_url'] ?? null;
        } else {
            $d      = json_decode(file_get_contents('php://input'), true) ?? [];
            $nombre = $d['nombre']       ?? null;
            $desc   = $d['descripcion']  ?? null;
            $pub    = isset($d['publicado']) ? ($d['publicado'] ? 'true' : 'false') : null;
            $portada= $d['portada_url']  ?? null;
        }

        if (!empty($_FILES['portada']['tmp_name'])) {
            $up = uploadImage($_FILES['portada'], 'albumes');
            if ($up) $portada = $up;
        }

        $db = Database::getConnection();
        // Solo actualiza lo que viene con valor real
        if ($nombre  !== null && $nombre  !== '') $db->prepare("UPDATE albumes SET nombre      = ? WHERE id = ?")->execute([$nombre, $id]);
        if ($desc    !== null)                    $db->prepare("UPDATE albumes SET descripcion = ? WHERE id = ?")->execute([$desc,    $id]);
        if ($pub     !== null)                    $db->prepare("UPDATE albumes SET publicado   = ?::boolean WHERE id = ?")->execute([$pub, $id]);
        if ($portada !== null && $portada !== '') $db->prepare("UPDATE albumes SET portada_url = ? WHERE id = ?")->execute([$portada, $id]);

        $stmt = $db->prepare("SELECT * FROM albumes WHERE id = ?");
        $stmt->execute([$id]);
        Response::success($this->na($stmt->fetch()), 'Álbum actualizado');
    }

    public function eliminarAlbum(int $id): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['admin','superadmin']);
        $db = Database::getConnection();
        $db->prepare("DELETE FROM galeria_imagenes WHERE album_id = ?")->execute([$id]);
        $db->prepare("DELETE FROM albumes WHERE id = ?")->execute([$id]);
        Response::success(null, 'Álbum eliminado');
    }

    public function imagenes(int $albumId): void {
        $db  = Database::getConnection();
        $all = !empty($_GET['all']);
        $w   = $all ? 'WHERE album_id = ?' : 'WHERE album_id = ? AND publicado = true';
        $stmt = $db->prepare("SELECT * FROM galeria_imagenes $w ORDER BY creado_en DESC");
        $stmt->execute([$albumId]);
        Response::success(array_map([$this, 'ni'], $stmt->fetchAll()));
    }

    public function subirImagen(): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['editor','admin','superadmin']);

        $albumId = null;
        $titulo  = null;
        $url     = null;

        // CASO 1: multipart con archivo
        if (!empty($_FILES['imagen']['tmp_name'])) {
            $up = uploadImage($_FILES['imagen'], 'galeria');
            if (!$up) Response::error('Error al subir imagen. Usa JPG, PNG o WebP, máx 10MB.');
            $url     = $up;
            $albumId = !empty($_POST['album_id']) ? (int)$_POST['album_id'] : null;
            $titulo  = $_POST['titulo'] ?? null;
        }
        // CASO 2: multipart con URL en campo imagen_url
        elseif (!empty($_POST['imagen_url'])) {
            $url     = trim($_POST['imagen_url']);
            $albumId = !empty($_POST['album_id']) ? (int)$_POST['album_id'] : null;
            $titulo  = $_POST['titulo'] ?? null;
        }
        // CASO 3: JSON con url o imagen_url
        else {
            $ct = $_SERVER['CONTENT_TYPE'] ?? '';
            $d  = [];
            if (str_contains($ct, 'application/json') || (!str_contains($ct, 'multipart'))) {
                $raw = file_get_contents('php://input');
                $d   = json_decode($raw, true) ?? [];
            }
            $url     = $d['url'] ?? $d['imagen_url'] ?? null;
            $albumId = isset($d['album_id']) ? (int)$d['album_id'] : null;
            $titulo  = $d['titulo'] ?? null;
        }

        if (!$url) Response::error('Debes subir una imagen o pegar una URL válida.');

        // Validar que sea una URL si es externa
        if (str_starts_with($url, 'http') && !filter_var($url, FILTER_VALIDATE_URL)) {
            Response::error('La URL no tiene un formato válido.');
        }

        $db   = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO galeria_imagenes (titulo, url, thumbnail_url, album_id, subido_por, publicado)
            VALUES (?,?,?,?,?,true) RETURNING id, url, thumbnail_url");
        $stmt->execute([$titulo ?: null, $url, $url, $albumId, $payload['id']]);
        Response::success($this->ni($stmt->fetch()), 'Imagen agregada', 201);
    }

    public function eliminarImagen(int $id): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['admin','superadmin']);
        Database::getConnection()->prepare("DELETE FROM galeria_imagenes WHERE id = ?")->execute([$id]);
        Response::success(null, 'Imagen eliminada');
    }
}
