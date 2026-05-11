<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../middleware/Auth.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Upload.php';

class DocentesController {
    private function norm(array $r): array { $r['foto_url'] = imageUrl($r['foto_url'] ?? null); return $r; }

    public function index(): void {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT d.*, COALESCE(array_agg(m.nombre) FILTER (WHERE m.nombre IS NOT NULL), '{}') AS materias
            FROM docentes d LEFT JOIN docente_materias dm ON d.id=dm.docente_id LEFT JOIN materias m ON dm.materia_id=m.id
            WHERE d.activo=true GROUP BY d.id ORDER BY d.nombre_completo");
        Response::success(array_map([$this,'norm'], $stmt->fetchAll()));
    }

    private function parseInput(): array {
        if (!empty($_POST)) {
            return ['nombre_completo'=>trim($_POST['nombre_completo']??''),'titulo_academico'=>$_POST['titulo_academico']??null,
                'especialidad'=>$_POST['especialidad']??null,'email'=>$_POST['email']??null,'bio_corta'=>$_POST['bio_corta']??null,
                'tipo'=>$_POST['tipo']??'titular','foto_url'=>$_POST['foto_url']??null];
        }
        $d = json_decode(file_get_contents('php://input'), true) ?? [];
        return ['nombre_completo'=>trim($d['nombre_completo']??''),'titulo_academico'=>$d['titulo_academico']??null,
            'especialidad'=>$d['especialidad']??null,'email'=>$d['email']??null,'bio_corta'=>$d['bio_corta']??null,
            'tipo'=>$d['tipo']??'titular','foto_url'=>$d['foto_url']??null];
    }

    public function store(): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        $p = $this->parseInput();
        if (!$p['nombre_completo']) Response::error('Nombre requerido');
        if (!empty($_FILES['foto']['tmp_name'])) { $up=uploadImage($_FILES['foto'],'docentes'); if($up) $p['foto_url']=$up; }
        $db = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO docentes (nombre_completo,foto_url,titulo_academico,especialidad,email,bio_corta,tipo) VALUES (?,?,?,?,?,?,?) RETURNING id");
        $stmt->execute([$p['nombre_completo'],$p['foto_url'],$p['titulo_academico'],$p['especialidad'],$p['email'],$p['bio_corta'],$p['tipo']]);
        Response::success($stmt->fetch(),'Docente creado',201);
    }

    public function update(int $id): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        $p = $this->parseInput();
        if (!empty($_FILES['foto']['tmp_name'])) { $up=uploadImage($_FILES['foto'],'docentes'); if($up) $p['foto_url']=$up; }
        $db = Database::getConnection();
        // Solo actualiza campos que vienen con valor (no vacío)
        $db->prepare("UPDATE docentes SET
            nombre_completo  = CASE WHEN ?::text IS NOT NULL AND ?::text!='' THEN ?::text ELSE nombre_completo END,
            foto_url         = CASE WHEN ?::text IS NOT NULL AND ?::text!='' THEN ?::text ELSE foto_url END,
            titulo_academico = CASE WHEN ?::text IS NOT NULL AND ?::text!='' THEN ?::text ELSE titulo_academico END,
            especialidad     = CASE WHEN ?::text IS NOT NULL AND ?::text!='' THEN ?::text ELSE especialidad END,
            email            = CASE WHEN ?::text IS NOT NULL AND ?::text!='' THEN ?::text ELSE email END,
            bio_corta        = CASE WHEN ?::text IS NOT NULL AND ?::text!='' THEN ?::text ELSE bio_corta END,
            tipo             = CASE WHEN ?::text IS NOT NULL AND ?::text!='' THEN ?::text ELSE tipo END
            WHERE id=?")
        ->execute([
            $p['nombre_completo'],$p['nombre_completo'],$p['nombre_completo'],
            $p['foto_url'],$p['foto_url'],$p['foto_url'],
            $p['titulo_academico'],$p['titulo_academico'],$p['titulo_academico'],
            $p['especialidad'],$p['especialidad'],$p['especialidad'],
            $p['email'],$p['email'],$p['email'],
            $p['bio_corta'],$p['bio_corta'],$p['bio_corta'],
            $p['tipo'],$p['tipo'],$p['tipo'],
            $id
        ]);
        $s = $db->prepare("SELECT * FROM docentes WHERE id=?"); $s->execute([$id]);
        Response::success($this->norm($s->fetch()),'Docente actualizado');
    }

    public function destroy(int $id): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        Database::getConnection()->prepare("UPDATE docentes SET activo=false WHERE id=?")->execute([$id]);
        Response::success(null,'Docente desactivado');
    }
}
