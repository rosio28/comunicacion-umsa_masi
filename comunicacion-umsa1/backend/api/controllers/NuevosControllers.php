<?php
// ============================================================
// NUEVOS CONTROLADORES — agregar al final de AllControllers.php
// ============================================================

// ─── SESIONES DE EVENTOS ─────────────────────────────────
class EventoSesionesController {

    public function index(int $eventoId): void {
        $db   = Database::getConnection();
        $all  = !empty($_GET['all']);
        $where = $all ? 'WHERE evento_id = ?' : 'WHERE evento_id = ? AND publicado = true';
        $stmt = $db->prepare("SELECT * FROM evento_sesiones $where ORDER BY numero_sesion ASC, fecha ASC");
        $stmt->execute([$eventoId]);
        Response::success($stmt->fetchAll());
    }

    public function store(int $eventoId): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['admin','superadmin']);
        $d = json_decode(file_get_contents('php://input'), true) ?? [];

        $titulo = trim($d['titulo'] ?? '');
        if (!$titulo) Response::error('Título de la sesión requerido');

        $db = Database::getConnection();

        // Marcar el evento como que tiene sesiones
        $db->prepare("UPDATE eventos SET tiene_sesiones = true WHERE id = ?")->execute([$eventoId]);

        // Calcular número de sesión si no se especifica
        $numSesion = isset($d['numero_sesion']) && $d['numero_sesion'] !== ''
            ? (int)$d['numero_sesion']
            : null;

        if (!$numSesion) {
            $q = $db->prepare("SELECT COALESCE(MAX(numero_sesion), 0) + 1 FROM evento_sesiones WHERE evento_id = ?");
            $q->execute([$eventoId]);
            $numSesion = (int)$q->fetchColumn();
        }

        $stmt = $db->prepare("INSERT INTO evento_sesiones
            (evento_id, numero_sesion, titulo, fecha, descripcion, contenido_visto, material_url, grabacion_url, enlace_virtual, publicado)
            VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING id");
        $stmt->execute([
            $eventoId, $numSesion, $titulo,
            $d['fecha'] ?? null,
            $d['descripcion'] ?? null,
            $d['contenido_visto'] ?? null,
            $d['material_url'] ?? null,
            $d['grabacion_url'] ?? null,
            $d['enlace_virtual'] ?? null,
            isset($d['publicado']) ? ($d['publicado'] ? 'true' : 'false') : 'true'
        ]);
        Response::success($stmt->fetch(), 'Sesión registrada', 201);
    }

    public function update(int $sesionId): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['admin','superadmin']);
        $d  = json_decode(file_get_contents('php://input'), true) ?? [];
        $db = Database::getConnection();

        $fields = [];
        if (!empty($d['titulo']))          $fields['titulo']          = $d['titulo'];
        if (isset($d['fecha']))            $fields['fecha']           = $d['fecha'] ?: null;
        if (isset($d['descripcion']))      $fields['descripcion']     = $d['descripcion'];
        if (isset($d['contenido_visto']))  $fields['contenido_visto'] = $d['contenido_visto'];
        if (isset($d['material_url']))     $fields['material_url']    = $d['material_url'];
        if (isset($d['grabacion_url']))    $fields['grabacion_url']   = $d['grabacion_url'];
        if (isset($d['enlace_virtual']))   $fields['enlace_virtual']  = $d['enlace_virtual'];
        if (isset($d['publicado']))        $fields['publicado']       = $d['publicado'] ? 'true' : 'false';
        if (!empty($d['numero_sesion']))   $fields['numero_sesion']   = (int)$d['numero_sesion'];

        if (empty($fields)) Response::error('Nada que actualizar');

        $sets   = implode(', ', array_map(fn($k) => "$k = ?", array_keys($fields)));
        $params = array_values($fields);
        $params[] = $sesionId;
        $db->prepare("UPDATE evento_sesiones SET $sets WHERE id = ?")->execute($params);
        Response::success(null, 'Sesión actualizada');
    }

    public function destroy(int $sesionId): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['admin','superadmin']);
        Database::getConnection()->prepare("DELETE FROM evento_sesiones WHERE id = ?")->execute([$sesionId]);
        Response::success(null, 'Sesión eliminada');
    }
}

// ─── CONVENIOS INSTITUCIONALES ────────────────────────────
class ConveniosController {

    private function norm(array $c): array {
        // Calcular estado según fecha de vencimiento
        if (!empty($c['fecha_vencimiento'])) {
            $hoy = new DateTime();
            $vcto = new DateTime($c['fecha_vencimiento']);
            $diff = $hoy->diff($vcto);
            if ($hoy > $vcto) {
                $c['estado'] = 'vencido';
                $c['dias_restantes'] = 0;
            } elseif ($diff->days <= 30) {
                $c['estado'] = 'por_vencer';
                $c['dias_restantes'] = $diff->days;
            } else {
                $c['estado'] = 'vigente';
                $c['dias_restantes'] = $diff->days;
            }
        } else {
            $c['estado'] = 'sin_fecha';
            $c['dias_restantes'] = null;
        }
        if (!empty($c['logo_url'])) $c['logo_url'] = imageUrl($c['logo_url']);
        return $c;
    }

    public function index(): void {
        $db  = Database::getConnection();
        $all = !empty($_GET['all']);
        $tipo = $_GET['tipo'] ?? null;

        $conditions = $all ? [] : ['publicado = true'];
        $params     = [];
        if ($tipo) { $conditions[] = 'tipo_convenio = ?'; $params[] = $tipo; }

        $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';
        $stmt  = $db->prepare("SELECT * FROM convenios $where ORDER BY activo DESC, fecha_vencimiento ASC");
        $stmt->execute($params);
        Response::success(array_map([$this, 'norm'], $stmt->fetchAll()));
    }

    public function store(): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['admin','superadmin']);
        $isP = !empty($_POST);
        $d   = $isP ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);

        $nombre = trim($d['nombre_institucion'] ?? '');
        if (!$nombre) Response::error('Nombre de la institución requerido');

        $logo = $d['logo_url'] ?? null;
        if (!empty($_FILES['logo']['tmp_name'])) {
            $up = uploadImage($_FILES['logo'], 'convenios');
            if ($up) $logo = $up;
        }

        $pub = isset($d['publicado'])
            ? (is_string($d['publicado']) ? $d['publicado'] !== 'false' : (bool)$d['publicado'])
            : true;

        $db   = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO convenios
            (nombre_institucion, tipo_institucion, descripcion, tipo_convenio, cupos_disponibles,
             duracion_meses, requisitos, fecha_inicio, fecha_vencimiento,
             contacto_nombre, contacto_email, contacto_telefono, logo_url, activo, publicado)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id");
        $stmt->execute([
            $nombre,
            $d['tipo_institucion'] ?? 'empresa',
            $d['descripcion'] ?? null,
            $d['tipo_convenio'] ?? 'pasantia',
            isset($d['cupos_disponibles']) && $d['cupos_disponibles'] !== '' ? (int)$d['cupos_disponibles'] : null,
            isset($d['duracion_meses']) && $d['duracion_meses'] !== '' ? (int)$d['duracion_meses'] : null,
            $d['requisitos'] ?? null,
            $d['fecha_inicio'] ?? null,
            $d['fecha_vencimiento'] ?? null,
            $d['contacto_nombre'] ?? null,
            $d['contacto_email'] ?? null,
            $d['contacto_telefono'] ?? null,
            $logo,
            isset($d['activo']) ? ($d['activo'] !== 'false' ? 'true' : 'false') : 'true',
            $pub ? 'true' : 'false'
        ]);
        Response::success($stmt->fetch(), 'Convenio creado', 201);
    }

    public function update(int $id): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['admin','superadmin']);
        $isP = !empty($_POST);
        $d   = $isP ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);

        $logo = isset($d['logo_url']) && $d['logo_url'] !== '' ? $d['logo_url'] : null;
        if (!empty($_FILES['logo']['tmp_name'])) {
            $up = uploadImage($_FILES['logo'], 'convenios');
            if ($up) $logo = $up;
        }

        $db     = Database::getConnection();
        $fields = [];
        if (!empty($d['nombre_institucion']))  $fields['nombre_institucion']  = $d['nombre_institucion'];
        if (!empty($d['tipo_institucion']))     $fields['tipo_institucion']    = $d['tipo_institucion'];
        if (isset($d['descripcion']))           $fields['descripcion']         = $d['descripcion'];
        if (!empty($d['tipo_convenio']))        $fields['tipo_convenio']       = $d['tipo_convenio'];
        if (isset($d['cupos_disponibles']) && $d['cupos_disponibles'] !== '') $fields['cupos_disponibles'] = (int)$d['cupos_disponibles'];
        if (isset($d['duracion_meses']) && $d['duracion_meses'] !== '')       $fields['duracion_meses']    = (int)$d['duracion_meses'];
        if (isset($d['requisitos']))            $fields['requisitos']          = $d['requisitos'];
        if (isset($d['fecha_inicio']) && $d['fecha_inicio'] !== '')           $fields['fecha_inicio']      = $d['fecha_inicio'];
        if (isset($d['fecha_vencimiento']) && $d['fecha_vencimiento'] !== '') $fields['fecha_vencimiento'] = $d['fecha_vencimiento'];
        if (isset($d['contacto_nombre']))       $fields['contacto_nombre']     = $d['contacto_nombre'];
        if (isset($d['contacto_email']))        $fields['contacto_email']      = $d['contacto_email'];
        if (isset($d['contacto_telefono']))     $fields['contacto_telefono']   = $d['contacto_telefono'];
        if ($logo !== null)                     $fields['logo_url']            = $logo;
        if (isset($d['activo']))                $fields['activo']              = ($d['activo'] && $d['activo'] !== 'false') ? 'true' : 'false';
        if (isset($d['publicado']))             $fields['publicado']           = ($d['publicado'] && $d['publicado'] !== 'false') ? 'true' : 'false';
        $fields['actualizado_en'] = 'NOW()';

        if (count($fields) <= 1) Response::error('Nada que actualizar');

        // Separar NOW() del resto porque no puede ir como parámetro PDO
        unset($fields['actualizado_en']);
        $sets   = implode(', ', array_map(fn($k) => "$k = ?", array_keys($fields)));
        $params = array_values($fields);
        $params[] = $id;
        $db->prepare("UPDATE convenios SET $sets, actualizado_en = NOW() WHERE id = ?")->execute($params);
        Response::success(null, 'Convenio actualizado');
    }

    public function destroy(int $id): void {
        $payload = Auth::requireAuth();
        Auth::requireRole($payload, ['admin','superadmin']);
        Database::getConnection()->prepare("UPDATE convenios SET activo = false, publicado = false WHERE id = ?")->execute([$id]);
        Response::success(null, 'Convenio desactivado');
    }
}
