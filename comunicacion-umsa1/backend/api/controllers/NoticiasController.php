<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../middleware/Auth.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../utils/Upload.php';

class NoticiasController {

    private function norm(array $n): array {
        if (!empty($n['imagen_url'])) $n['imagen_url'] = imageUrl($n['imagen_url']);
        return $n;
    }

    /** Determina si la petición viene de un admin autenticado */
    private function isAdmin(): bool {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!str_starts_with($header, 'Bearer ')) return false;
        $payload = JWT::verify(substr($header, 7));
        return $payload && in_array($payload['rol'] ?? '', ['admin','superadmin','editor']);
    }

    public function index(): void {
        $db     = Database::getConnection();
        $page   = max(1, (int)($_GET['page']  ?? 1));
        $limit  = min(50, max(1, (int)($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;

        // ← FIX: solo admins ven borradores
        $isAdmin    = $this->isAdmin();
        $conditions = $isAdmin ? [] : ['n.publicado = true'];
        $params     = [];

        if (!empty($_GET['categoria'])) {
            $conditions[] = 'n.categoria_id = ?';
            $params[]     = (int)$_GET['categoria'];
        }
        if (!empty($_GET['q'])) {
            $conditions[] = '(n.titulo ILIKE ? OR n.resumen ILIKE ?)';
            $params[]     = '%' . $_GET['q'] . '%';
            $params[]     = '%' . $_GET['q'] . '%';
        }

        $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

        $cs = $db->prepare("SELECT COUNT(*) FROM noticias n $where");
        $cs->execute($params);
        $total = (int)$cs->fetchColumn();

        $stmt = $db->prepare("SELECT n.id, n.titulo, n.slug, n.resumen, n.imagen_url,
            n.publicado, n.destacado, n.vistas, n.publicado_en, n.creado_en,
            n.contenido,
            c.nombre AS categoria, c.color_hex,
            u.nombre AS autor
            FROM noticias n
            LEFT JOIN categorias c ON n.categoria_id = c.id
            LEFT JOIN usuarios u   ON n.autor_id     = u.id
            $where
            ORDER BY n.publicado_en DESC NULLS LAST, n.creado_en DESC
            LIMIT ? OFFSET ?");
        $stmt->execute([...$params, $limit, $offset]);
        Response::paginated(array_map([$this, 'norm'], $stmt->fetchAll()), $total, $page, $limit);
    }

    public function show(string $slug): void {
        $db   = Database::getConnection();
        $stmt = $db->prepare("SELECT n.*, c.nombre AS categoria, c.color_hex, u.nombre AS autor
            FROM noticias n
            LEFT JOIN categorias c ON n.categoria_id = c.id
            LEFT JOIN usuarios u   ON n.autor_id     = u.id
            WHERE n.slug = ?");
        $stmt->execute([$slug]);
        $n = $stmt->fetch();
        if (!$n) Response::error('Noticia no encontrada', 404);
        $db->prepare("UPDATE noticias SET vistas = vistas + 1 WHERE slug = ?")->execute([$slug]);
        Response::success($this->norm($n));
    }

    public function store(): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['editor','admin','superadmin']);

        $isP = !empty($_POST);
        if ($isP) {
            $titulo    = trim($_POST['titulo']    ?? '');
            $contenido = trim($_POST['contenido'] ?? '');
            $resumen   = trim($_POST['resumen']   ?? '');
            $catId     = isset($_POST['categoria_id']) && $_POST['categoria_id'] !== '' ? (int)$_POST['categoria_id'] : null;
            $destacado = ($_POST['destacado'] ?? '') === 'true';
            $pubReq    = ($_POST['publicado'] ?? '') === 'true';
            $imgUrl    = $_POST['imagen_url'] ?? null;
        } else {
            $d = json_decode(file_get_contents('php://input'), true) ?? [];
            $titulo    = trim($d['titulo']    ?? '');
            $contenido = trim($d['contenido'] ?? '');
            $resumen   = trim($d['resumen']   ?? '');
            $catId     = isset($d['categoria_id']) && $d['categoria_id'] !== '' ? (int)$d['categoria_id'] : null;
            $destacado = !empty($d['destacado']);
            $pubReq    = !empty($d['publicado']);
            $imgUrl    = $d['imagen_url'] ?? null;
        }

        if (!$titulo || !$contenido) Response::error('Título y contenido son requeridos');

        if (!empty($_FILES['imagen']['tmp_name'])) {
            $up = uploadImage($_FILES['imagen'], 'noticias');
            if ($up) $imgUrl = $up;
        }

        $publicado = in_array($payload['rol'], ['admin','superadmin']) ? $pubReq : false;
        $slug = $this->slug($titulo);
        $db   = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO noticias
            (titulo, slug, resumen, contenido, imagen_url, categoria_id, autor_id, publicado, destacado, publicado_en)
            VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING id, slug");
        $stmt->execute([$titulo, $slug, $resumen ?: null, $contenido, $imgUrl,
            $catId, $payload['id'],
            $publicado ? 'true' : 'false',
            $destacado ? 'true' : 'false',
            $publicado ? date('Y-m-d H:i:s') : null]);
        Response::success($this->norm($stmt->fetch()), 'Noticia creada', 201);
    }

    public function update(int $id): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['editor','admin','superadmin']);

        // Editor solo puede editar sus propias noticias
        $db = Database::getConnection();
        if ($payload['rol'] === 'editor') {
            $chk = $db->prepare("SELECT autor_id FROM noticias WHERE id = ?");
            $chk->execute([$id]);
            $n = $chk->fetch();
            if (!$n || $n['autor_id'] != $payload['id']) Response::error('Sin permiso', 403);
        }

        $isP = !empty($_POST);
        if ($isP) {
            $titulo    = isset($_POST['titulo'])    && $_POST['titulo']    !== '' ? trim($_POST['titulo'])    : null;
            $contenido = isset($_POST['contenido']) && $_POST['contenido'] !== '' ? trim($_POST['contenido']) : null;
            $resumen   = $_POST['resumen']   ?? null;
            $catId     = isset($_POST['categoria_id']) && $_POST['categoria_id'] !== '' ? (int)$_POST['categoria_id'] : null;
            $destacado = isset($_POST['destacado']) ? (($_POST['destacado'] === 'true') ? 'true' : 'false') : null;
            $imgUrl    = isset($_POST['imagen_url']) && $_POST['imagen_url'] !== '' ? $_POST['imagen_url'] : null;
        } else {
            $d = json_decode(file_get_contents('php://input'), true) ?? [];
            $titulo    = isset($d['titulo'])    && $d['titulo']    !== '' ? trim($d['titulo'])    : null;
            $contenido = isset($d['contenido']) && $d['contenido'] !== '' ? trim($d['contenido']) : null;
            $resumen   = $d['resumen']   ?? null;
            $catId     = isset($d['categoria_id']) && $d['categoria_id'] !== '' ? (int)$d['categoria_id'] : null;
            $destacado = isset($d['destacado']) ? ($d['destacado'] ? 'true' : 'false') : null;
            $imgUrl    = isset($d['imagen_url']) && $d['imagen_url'] !== '' ? $d['imagen_url'] : null;
        }

        if (!empty($_FILES['imagen']['tmp_name'])) {
            $up = uploadImage($_FILES['imagen'], 'noticias');
            if ($up) $imgUrl = $up;
        }

        // Actualización campo por campo — solo los que vienen con valor
        if ($titulo    !== null) $db->prepare("UPDATE noticias SET titulo     = ? WHERE id = ?")->execute([$titulo,    $id]);
        if ($contenido !== null) $db->prepare("UPDATE noticias SET contenido  = ? WHERE id = ?")->execute([$contenido, $id]);
        if ($resumen   !== null) $db->prepare("UPDATE noticias SET resumen    = ? WHERE id = ?")->execute([$resumen,   $id]);
        if ($catId     !== null) $db->prepare("UPDATE noticias SET categoria_id = ? WHERE id = ?")->execute([$catId,  $id]);
        if ($destacado !== null) $db->prepare("UPDATE noticias SET destacado  = ?::boolean WHERE id = ?")->execute([$destacado, $id]);
        if ($imgUrl    !== null) $db->prepare("UPDATE noticias SET imagen_url = ? WHERE id = ?")->execute([$imgUrl,   $id]);

        Response::success(null, 'Noticia actualizada');
    }

    public function togglePublicar(int $id): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['admin','superadmin']);
        $stmt = Database::getConnection()->prepare("UPDATE noticias SET
            publicado    = NOT publicado,
            publicado_en = CASE WHEN publicado = false THEN NOW() ELSE publicado_en END
            WHERE id = ? RETURNING publicado");
        $stmt->execute([$id]);
        Response::success($stmt->fetch(), 'Estado actualizado');
    }

    public function destroy(int $id): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['admin','superadmin']);
        Database::getConnection()->prepare("DELETE FROM noticias WHERE id = ?")->execute([$id]);
        Response::success(null, 'Noticia eliminada');
    }

    private function slug(string $text): string {
        $map  = ['á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','ñ'=>'n','ü'=>'u',
                 'Á'=>'a','É'=>'e','Í'=>'i','Ó'=>'o','Ú'=>'u','Ñ'=>'n'];
        $s = strtolower(strtr(trim($text), $map));
        $s = preg_replace('/[^a-z0-9\s-]/', '', $s);
        $s = preg_replace('/[\s-]+/', '-', trim($s));
        $base = substr($s, 0, 100);
        $db   = Database::getConnection();
        $try  = $base; $i = 1;
        while (true) {
            $q = $db->prepare("SELECT id FROM noticias WHERE slug = ?");
            $q->execute([$try]);
            if (!$q->fetch()) break;
            $try = $base . '-' . $i++;
        }
        return $try;
    }
}
