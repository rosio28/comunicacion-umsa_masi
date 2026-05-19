<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../middleware/Auth.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../utils/Upload.php';
require_once __DIR__ . '/../utils/ParseInput.php';

class NoticiasController {

    private function norm(array $n): array {
        if (!empty($n['imagen_url'])) $n['imagen_url'] = imageUrl($n['imagen_url']);
        // Normalizar booleanos que PostgreSQL devuelve como 't'/'f'
        $n['publicado']  = in_array($n['publicado'],  [true,'t','true','1',1], true);
        $n['destacado']  = in_array($n['destacado'],  [true,'t','true','1',1], true);
        return $n;
    }

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

        // SOLO admins ven borradores — público siempre ve publicado=true
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

        $stmt = $db->prepare(
            "SELECT n.id, n.titulo, n.slug, n.resumen, n.imagen_url,
                n.publicado, n.destacado, n.vistas, n.publicado_en, n.creado_en,
                n.contenido,
                c.nombre AS categoria, c.color_hex,
                u.nombre AS autor
             FROM noticias n
             LEFT JOIN categorias c ON n.categoria_id = c.id
             LEFT JOIN usuarios   u ON n.autor_id     = u.id
             $where
             ORDER BY n.publicado_en DESC NULLS LAST, n.creado_en DESC
             LIMIT ? OFFSET ?"
        );
        $stmt->execute([...$params, $limit, $offset]);
        Response::paginated(array_map([$this, 'norm'], $stmt->fetchAll()), $total, $page, $limit);
    }

    public function show(string $slug): void {
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT n.*, c.nombre AS categoria, c.color_hex, u.nombre AS autor
             FROM noticias n
             LEFT JOIN categorias c ON n.categoria_id = c.id
             LEFT JOIN usuarios   u ON n.autor_id     = u.id
             WHERE n.slug = ?"
        );
        $stmt->execute([$slug]);
        $n = $stmt->fetch();
        if (!$n) Response::error('Noticia no encontrada', 404);
        $db->prepare("UPDATE noticias SET vistas = vistas + 1 WHERE slug = ?")->execute([$slug]);
        Response::success($this->norm($n));
    }

    public function store(): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['editor','admin','superadmin']);

        $d = getInputData();
        $titulo    = trim($d['titulo']    ?? '');
        $contenido = trim($d['contenido'] ?? '');
        $resumen   = trim($d['resumen']   ?? '');
        $catId     = isset($d['categoria_id']) && $d['categoria_id'] !== '' ? (int)$d['categoria_id'] : null;
        $destacado = in_array(strtolower((string)($d['destacado'] ?? 'false')), ['true','1','t'], true);
        $pubReq    = in_array(strtolower((string)($d['publicado']  ?? 'false')), ['true','1','t'], true);
        $imgUrl    = $d['imagen_url'] ?? null;

        if (!$titulo || !$contenido) Response::error('Título y contenido son requeridos');

        if (!empty($_FILES['imagen']['tmp_name'])) {
            $up = uploadImage($_FILES['imagen'], 'noticias');
            if ($up) $imgUrl = $up;
        }

        $publicado = in_array($payload['rol'], ['admin','superadmin']) ? $pubReq : false;
        $slug = $this->slug($titulo);
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            "INSERT INTO noticias
             (titulo, slug, resumen, contenido, imagen_url, categoria_id, autor_id, publicado, destacado, publicado_en)
             VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING id, slug"
        );
        $stmt->execute([
            $titulo, $slug, $resumen ?: null, $contenido, $imgUrl,
            $catId, $payload['id'],
            $publicado ? 'true' : 'false',
            $destacado ? 'true' : 'false',
            $publicado ? date('Y-m-d H:i:s') : null,
        ]);
        Response::success($this->norm($stmt->fetch()), 'Noticia creada', 201);
    }

    public function update(int $id): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['editor','admin','superadmin']);

        $db = Database::getConnection();

        // Editor solo puede editar sus propias noticias
        if ($payload['rol'] === 'editor') {
            $chk = $db->prepare("SELECT autor_id FROM noticias WHERE id = ?");
            $chk->execute([$id]);
            $n = $chk->fetch();
            if (!$n || $n['autor_id'] != $payload['id']) Response::error('Sin permiso', 403);
        }

        $d = getInputData();

        // Imagen: prioridad archivo → url → null (mantener actual)
        $imgUrl = null;
        if (!empty($_FILES['imagen']['tmp_name'])) {
            $up = uploadImage($_FILES['imagen'], 'noticias');
            if ($up) $imgUrl = $up;
        } elseif (isset($d['imagen_url']) && $d['imagen_url'] !== '') {
            $imgUrl = $d['imagen_url'];
        }

        // Construir SET solo con campos que vienen
        $fields = [];
        if (isset($d['titulo'])    && $d['titulo']    !== '') $fields['titulo']      = trim($d['titulo']);
        if (isset($d['contenido']) && $d['contenido'] !== '') $fields['contenido']   = trim($d['contenido']);
        if (array_key_exists('resumen',$d))                  $fields['resumen']     = $d['resumen'];
        if (isset($d['categoria_id']) && $d['categoria_id'] !== '') $fields['categoria_id'] = (int)$d['categoria_id'];
        if (array_key_exists('destacado',$d))                $fields['destacado']   = in_array(strtolower((string)$d['destacado']),['true','1','t'],true) ? 'true' : 'false';
        if ($imgUrl !== null)                                $fields['imagen_url']  = $imgUrl;

        // publicado solo admins/superadmin
        if (array_key_exists('publicado',$d) && in_array($payload['rol'],['admin','superadmin'])) {
            $pub = in_array(strtolower((string)$d['publicado']),['true','1','t'],true);
            $fields['publicado'] = $pub ? 'true' : 'false';
            if ($pub) $fields['publicado_en'] = date('Y-m-d H:i:s');
        }

        if (!empty($fields)) {
            $sets   = implode(', ', array_map(fn($k) => "$k = ?", array_keys($fields)));
            $params = array_values($fields);
            $params[] = $id;
            $db->prepare("UPDATE noticias SET $sets WHERE id = ?")->execute($params);
        }

        // Devolver la noticia actualizada
        $s = $db->prepare("SELECT n.*, c.nombre AS categoria, c.color_hex FROM noticias n LEFT JOIN categorias c ON n.categoria_id=c.id WHERE n.id=?");
        $s->execute([$id]);
        Response::success($this->norm($s->fetch()), 'Noticia actualizada');
    }

    public function togglePublicar(int $id): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['admin','superadmin']);
        $stmt = Database::getConnection()->prepare(
            "UPDATE noticias SET
                publicado    = NOT publicado,
                publicado_en = CASE WHEN publicado = false THEN NOW() ELSE publicado_en END
             WHERE id = ? RETURNING publicado"
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        $row['publicado'] = in_array($row['publicado'], [true,'t','true','1',1], true);
        Response::success($row, 'Estado actualizado');
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
        $s    = strtolower(strtr(trim($text), $map));
        $s    = preg_replace('/[^a-z0-9\s-]/', '', $s);
        $s    = preg_replace('/[\s-]+/', '-', trim($s));
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
