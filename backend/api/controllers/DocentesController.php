<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../middleware/Auth.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Upload.php';
require_once __DIR__ . '/../utils/ParseInput.php';

class DocentesController {

    private function norm(array $r): array {
        $r['foto_url'] = imageUrl($r['foto_url'] ?? null);
        return $r;
    }

    public function index(): void {
        $db   = Database::getConnection();
        $stmt = $db->query(
            "SELECT d.*,
                COALESCE(array_agg(m.nombre) FILTER (WHERE m.nombre IS NOT NULL), '{}') AS materias
             FROM docentes d
             LEFT JOIN docente_materias dm ON d.id = dm.docente_id
             LEFT JOIN materias m ON dm.materia_id = m.id
             WHERE d.activo = true
             GROUP BY d.id
             ORDER BY d.nombre_completo"
        );
        Response::success(array_map([$this,'norm'], $stmt->fetchAll()));
    }

    public function store(): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['admin','superadmin']);

        $d = getInputData();
        $nombre = trim($d['nombre_completo'] ?? '');
        if (!$nombre) Response::error('Nombre requerido');

        $foto = $d['foto_url'] ?? null;
        if (!empty($_FILES['foto']['tmp_name'])) {
            $up = uploadImage($_FILES['foto'], 'docentes');
            if ($up) $foto = $up;
        }

        $db   = Database::getConnection();
        $stmt = $db->prepare(
            "INSERT INTO docentes (nombre_completo,foto_url,titulo_academico,especialidad,email,bio_corta,tipo)
             VALUES (?,?,?,?,?,?,?) RETURNING id"
        );
        $stmt->execute([
            $nombre,
            $foto,
            $d['titulo_academico'] ?? null,
            $d['especialidad']     ?? null,
            $d['email']            ?? null,
            $d['bio_corta']        ?? null,
            $d['tipo']             ?? 'titular',
        ]);
        Response::success($stmt->fetch(), 'Docente creado', 201);
    }

    public function update(int $id): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['admin','superadmin']);

        $d  = getInputData();
        $db = Database::getConnection();

        // Imagen: archivo > url > mantener actual
        $foto = null;
        if (!empty($_FILES['foto']['tmp_name'])) {
            $up = uploadImage($_FILES['foto'], 'docentes');
            if ($up) $foto = $up;
        } elseif (isset($d['foto_url']) && $d['foto_url'] !== '') {
            $foto = $d['foto_url'];
        }

        $fields = [];
        if (!empty($d['nombre_completo']))   $fields['nombre_completo']  = trim($d['nombre_completo']);
        if ($foto !== null)                  $fields['foto_url']          = $foto;
        if (array_key_exists('titulo_academico',$d) && $d['titulo_academico'] !== '') $fields['titulo_academico'] = $d['titulo_academico'];
        if (array_key_exists('especialidad',$d) && $d['especialidad'] !== '') $fields['especialidad'] = $d['especialidad'];
        if (array_key_exists('email',$d) && $d['email'] !== '')  $fields['email']     = $d['email'];
        if (array_key_exists('bio_corta',$d))                    $fields['bio_corta'] = $d['bio_corta'];
        if (!empty($d['tipo']))                                   $fields['tipo']      = $d['tipo'];

        if (!empty($fields)) {
            $sets   = implode(', ', array_map(fn($k) => "$k = ?", array_keys($fields)));
            $params = array_values($fields);
            $params[] = $id;
            $db->prepare("UPDATE docentes SET $sets WHERE id = ?")->execute($params);
        }

        $s = $db->prepare("SELECT * FROM docentes WHERE id = ?");
        $s->execute([$id]);
        Response::success($this->norm($s->fetch()), 'Docente actualizado');
    }

    public function destroy(int $id): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['admin','superadmin']);
        Database::getConnection()->prepare("UPDATE docentes SET activo=false WHERE id=?")->execute([$id]);
        Response::success(null, 'Docente desactivado');
    }
}
