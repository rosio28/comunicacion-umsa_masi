<?php
// AllControllers.php — VERSIÓN CORREGIDA
// Fixes:
//   1. GaleriaController: subida por URL (JSON + multipart) funciona
//   2. Actualización parcial: NUNCA borra datos existentes
//   3. WhatsappController: ruta /admin añadida

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/Auth.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Mailer.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../utils/Upload.php';

// ─── helper: actualizar solo campos con valor real ────────
// Ejecuta un UPDATE solo si el valor nuevo es distinto de null/""/false-vacío
function updateIfNotEmpty(\PDO $db, string $table, int $id, array $fields): void {
    $sets = []; $params = [];
    foreach ($fields as $col => $val) {
        if ($val !== null && $val !== '') {
            $sets[]   = "$col = ?";
            $params[] = $val;
        }
    }
    if (empty($sets)) return;
    $params[] = $id;
    $db->prepare("UPDATE $table SET " . implode(', ', $sets) . " WHERE id = ?")->execute($params);
}

// ─── EVENTOS ───────────────────────────────────────────────
class EventosController {
    public function index(): void {
        $db = Database::getConnection();
        $params = []; $where = "WHERE publicado = true";
        if (!empty($_GET['start'])) { $where .= " AND fecha_inicio >= ?"; $params[] = $_GET['start']; }
        if (!empty($_GET['end']))   { $where .= " AND fecha_inicio <= ?"; $params[] = $_GET['end']; }
        $stmt = $db->prepare("SELECT * FROM eventos $where ORDER BY fecha_inicio");
        $stmt->execute($params);
        Response::success($stmt->fetchAll());
    }
    public function store(): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        $isP = !empty($_POST);
        $d = $isP ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);
        $titulo  = trim($d['titulo'] ?? '');
        $inicio  = $d['fecha_inicio'] ?? '';
        if (!$titulo || !$inicio) Response::error('Título y fecha inicio requeridos');
        $img = $d['imagen_url'] ?? null;
        if (!empty($_FILES['imagen']['tmp_name'])) { $up=uploadImage($_FILES['imagen'],'eventos'); if($up) $img=$up; }
        $pub = isset($d['publicado']) ? (is_string($d['publicado']) ? $d['publicado'] !== 'false' : (bool)$d['publicado']) : true;
        $db = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO eventos (titulo,descripcion,tipo,fecha_inicio,fecha_fin,lugar,enlace_virtual,color,imagen_url,autor_id,publicado) VALUES (?,?,?,?,?,?,?,?,?,?,?) RETURNING id");
        $stmt->execute([$titulo,$d['descripcion']??null,$d['tipo']??'otro',$inicio,$d['fecha_fin']??null,$d['lugar']??null,$d['enlace_virtual']??null,$d['color']??'#C0392B',$img,$payload['id'],$pub?'true':'false']);
        Response::success($stmt->fetch(),'Evento creado',201);
    }
    public function update(int $id): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        $isP = !empty($_POST);
        $d = $isP ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);
        $img = isset($d['imagen_url']) && $d['imagen_url'] !== '' ? $d['imagen_url'] : null;
        if (!empty($_FILES['imagen']['tmp_name'])) { $up=uploadImage($_FILES['imagen'],'eventos'); if($up) $img=$up; }
        $db = Database::getConnection();
        // Solo actualiza los campos que vienen con valor
        $fields = [];
        if (!empty($d['titulo']))        $fields['titulo']         = $d['titulo'];
        if (isset($d['descripcion']))    $fields['descripcion']    = $d['descripcion'];
        if (!empty($d['tipo']))          $fields['tipo']           = $d['tipo'];
        if (!empty($d['fecha_inicio']))  $fields['fecha_inicio']   = $d['fecha_inicio'];
        if (isset($d['fecha_fin']))      $fields['fecha_fin']      = $d['fecha_fin'] ?: null;
        if (isset($d['lugar']))          $fields['lugar']          = $d['lugar'];
        if (isset($d['enlace_virtual'])) $fields['enlace_virtual'] = $d['enlace_virtual'];
        if (!empty($d['color']))         $fields['color']          = $d['color'];
        if ($img !== null)               $fields['imagen_url']     = $img;
        if (isset($d['publicado']))      $fields['publicado']      = (is_string($d['publicado']) ? ($d['publicado'] !== 'false' ? 'true' : 'false') : ($d['publicado'] ? 'true' : 'false'));
        updateIfNotEmpty($db, 'eventos', $id, $fields);
        Response::success(null,'Evento actualizado');
    }
    public function destroy(int $id): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        Database::getConnection()->prepare("DELETE FROM eventos WHERE id = ?")->execute([$id]);
        Response::success(null,'Evento eliminado');
    }
}

// ─── WHATSAPP ──────────────────────────────────────────────
class WhatsappController {
    public function index(): void {
        $db = Database::getConnection();
        Response::success($db->query("SELECT * FROM grupos_whatsapp WHERE activo=true ORDER BY semestre,gestion DESC")->fetchAll());
    }
    public function adminIndex(): void {
        Auth::requireAuth();
        $db = Database::getConnection();
        Response::success($db->query("SELECT * FROM grupos_whatsapp ORDER BY semestre,gestion DESC")->fetchAll());
    }
    public function store(): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        $d = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($d['materia_nombre'])||empty($d['enlace_wa'])||empty($d['gestion'])) Response::error('Datos incompletos');
        $db = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO grupos_whatsapp (materia_nombre,semestre,gestion,enlace_wa,actualizado_por) VALUES (?,?,?,?,?) RETURNING id");
        $stmt->execute([$d['materia_nombre'],(int)($d['semestre']??1),$d['gestion'],$d['enlace_wa'],$payload['id']]);
        Response::success($stmt->fetch(),'Grupo agregado',201);
    }
    public function update(int $id): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        $d = json_decode(file_get_contents('php://input'), true) ?? [];
        $db = Database::getConnection();
        $fields = [];
        if (!empty($d['materia_nombre'])) $fields['materia_nombre'] = $d['materia_nombre'];
        if (!empty($d['enlace_wa']))      $fields['enlace_wa']      = $d['enlace_wa'];
        if (!empty($d['gestion']))        $fields['gestion']        = $d['gestion'];
        if (!empty($d['semestre']))       $fields['semestre']       = (int)$d['semestre'];
        if (isset($d['activo']))          $fields['activo']         = $d['activo'] ? 'true' : 'false';
        $fields['actualizado_por'] = $payload['id'];
        $fields['actualizado_en']  = 'NOW()'; // esto no puede ir en updateIfNotEmpty, lo hacemos manual
        updateIfNotEmpty($db, 'grupos_whatsapp', $id, array_filter($fields, fn($k) => !in_array($k,['actualizado_por','actualizado_en']), ARRAY_FILTER_USE_KEY));
        $db->prepare("UPDATE grupos_whatsapp SET actualizado_por=?, actualizado_en=NOW() WHERE id=?")->execute([$payload['id'],$id]);
        Response::success(null,'Grupo actualizado');
    }
    public function destroy(int $id): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        Database::getConnection()->prepare("UPDATE grupos_whatsapp SET activo=false WHERE id=?")->execute([$id]);
        Response::success(null,'Grupo desactivado');
    }
}

// ─── INSTITUCIONAL ─────────────────────────────────────────
class InstitucionalController {
    public function show(string $clave): void {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM contenido_institucional WHERE clave=?");
        $stmt->execute([$clave]);
        $item = $stmt->fetch();
        if (!$item) Response::error('Contenido no encontrado',404);
        Response::success($item);
    }
    public function update(string $clave): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        $d = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($d['contenido'])) Response::error('Contenido requerido');
        $db = Database::getConnection();
        $db->prepare("UPDATE contenido_institucional SET titulo=COALESCE(NULLIF(?,''),titulo),contenido=?,actualizado_por=?,actualizado_en=NOW() WHERE clave=?")
           ->execute([$d['titulo']??null,$d['contenido'],$payload['id'],$clave]);
        Response::success(null,'Contenido actualizado');
    }
}

// ─── CONTACTO ──────────────────────────────────────────────
class ContactoController {
    public function enviar(): void {
        $d = json_decode(file_get_contents('php://input'), true) ?? [];
        $nombre  = htmlspecialchars(trim($d['nombre']  ?? ''), ENT_QUOTES, 'UTF-8');
        $email   = filter_var($d['email'] ?? '', FILTER_VALIDATE_EMAIL);
        $mensaje = htmlspecialchars(trim($d['mensaje'] ?? ''), ENT_QUOTES, 'UTF-8');
        if (!$nombre || !$email || !$mensaje) Response::error('Todos los campos son requeridos');
        Mailer::send(ADMIN_EMAIL,'CCS UMSA',"Nuevo mensaje web — $nombre","<p><strong>Nombre:</strong> $nombre</p><p><strong>Correo:</strong> $email</p><p><strong>Mensaje:</strong><br>$mensaje</p>");
        Response::success(null,'Mensaje enviado correctamente');
    }
}

// ─── USUARIOS ──────────────────────────────────────────────
class UsuariosController {
    public function index(): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['superadmin']);
        Response::success(Database::getConnection()->query("SELECT id,nombre,email,rol,activo,avatar_url,horas_trabajo,creado_en FROM usuarios ORDER BY creado_en DESC")->fetchAll());
    }
    public function store(): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['superadmin']);
        $d = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($d['nombre'])||empty($d['email'])||empty($d['rol'])) Response::error('Datos incompletos');
        $tempPass = bin2hex(random_bytes(6));
        $hash     = password_hash($tempPass, PASSWORD_BCRYPT, ['cost'=>12]);
        $db = Database::getConnection();
        try {
            $stmt = $db->prepare("INSERT INTO usuarios (nombre,email,password_hash,rol) VALUES (?,?,?,?) RETURNING id");
            $stmt->execute([$d['nombre'],$d['email'],$hash,$d['rol']]);
            $nuevo = $stmt->fetch();
            Mailer::send($d['email'],$d['nombre'],'Bienvenido al panel CCS UMSA',"<p>Tu cuenta fue creada.</p><p><strong>Email:</strong> {$d['email']}<br><strong>Contraseña temporal:</strong> $tempPass</p>");
            Response::success(['id'=>$nuevo['id'],'temp_password'=>$tempPass],'Usuario creado',201);
        } catch (\PDOException $e) {
            if (str_contains($e->getMessage(),'unique')||str_contains($e->getMessage(),'duplicate')) Response::error('El correo ya existe');
            Response::error('Error: '.$e->getMessage(),500);
        }
    }
    public function update(int $id): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['superadmin']);
        $d = json_decode(file_get_contents('php://input'), true) ?? [];
        $db = Database::getConnection();
        $fields = [];
        if (!empty($d['nombre']))  $fields['nombre'] = $d['nombre'];
        if (!empty($d['rol']))     $fields['rol']    = $d['rol'];
        if (isset($d['activo']))   $fields['activo'] = $d['activo'] ? 'true' : 'false';
        updateIfNotEmpty($db, 'usuarios', $id, $fields);
        $db->prepare("UPDATE usuarios SET actualizado_en=NOW() WHERE id=?")->execute([$id]);
        Response::success(null,'Usuario actualizado');
    }
    public function resetPasswordAdmin(int $id): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['superadmin']);
        $d = json_decode(file_get_contents('php://input'), true) ?? [];
        $newPass = trim($d['nueva_password'] ?? '');
        if (strlen($newPass) < 6) Response::error('Mínimo 6 caracteres');
        $hash = password_hash($newPass, PASSWORD_BCRYPT, ['cost'=>12]);
        $db = Database::getConnection();
        $u = $db->prepare("SELECT nombre,email FROM usuarios WHERE id=?"); $u->execute([$id]); $usr = $u->fetch();
        if (!$usr) Response::error('Usuario no encontrado',404);
        $db->prepare("UPDATE usuarios SET password_hash=?,actualizado_en=NOW() WHERE id=?")->execute([$hash,$id]);
        Mailer::send($usr['email'],$usr['nombre'],'Tu contraseña fue actualizada — CCS UMSA',"<p>Tu nueva contraseña es: <strong>$newPass</strong></p><p>Cámbiala al iniciar sesión.</p>");
        Response::success(null,'Contraseña actualizada');
    }
    public function destroy(int $id): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['superadmin']);
        Database::getConnection()->prepare("UPDATE usuarios SET activo=false WHERE id=?")->execute([$id]);
        Response::success(null,'Usuario desactivado');
    }
}

// ─── MULTIMEDIA ────────────────────────────────────────────
class MultimediaController {
    public function index(): void {
        $db = Database::getConnection();
        $tipo = $_GET['tipo'] ?? null; $all = !empty($_GET['all']);
        $cond = $all ? [] : ['publicado=true']; $params = [];
        if ($tipo) { $cond[] = 'tipo=?'; $params[] = $tipo; }
        $where = $cond ? 'WHERE '.implode(' AND ',$cond) : '';
        $stmt = $db->prepare("SELECT * FROM multimedia_estudiantes $where ORDER BY creado_en DESC LIMIT 60");
        $stmt->execute($params); Response::success($stmt->fetchAll());
    }
    public function store(): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['editor','admin','superadmin']);
        $isP = !empty($_POST);
        $d = $isP ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);
        $titulo = trim($d['titulo'] ?? ''); $autor = trim($d['autor_nombre'] ?? '');
        if (!$titulo||!$autor) Response::error('Título y autor requeridos');
        $thumb = $d['thumbnail_url'] ?? null;
        if (!empty($_FILES['thumbnail']['tmp_name'])) { $up=uploadImage($_FILES['thumbnail'],'thumbnails'); if($up) $thumb=$up; }
        $url = $d['url_contenido'] ?? null;
        $pub = in_array($payload['rol'],['admin','superadmin']);
        $dest = isset($d['destacado']) ? (is_string($d['destacado']) ? $d['destacado']==='true' : (bool)$d['destacado']) : false;
        $db = Database::getConnection();
        $db->prepare("INSERT INTO multimedia_estudiantes (titulo,tipo,descripcion,url_contenido,thumbnail_url,autor_nombre,materia_origen,gestion,destacado,publicado) VALUES (?,?,?,?,?,?,?,?,?,?)")
           ->execute([$titulo,$d['tipo']??'video',$d['descripcion']??null,$url,$thumb,$autor,$d['materia_origen']??null,$d['gestion']??null,$dest?'true':'false',$pub?'true':'false']);
        Response::success(null,'Multimedia registrada',201);
    }
    public function update(int $id): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        $d = json_decode(file_get_contents('php://input'), true) ?? [];
        $db = Database::getConnection();
        $fields = [];
        if (!empty($d['titulo']))        $fields['titulo']       = $d['titulo'];
        if (!empty($d['tipo']))          $fields['tipo']         = $d['tipo'];
        if (!empty($d['autor_nombre']))  $fields['autor_nombre'] = $d['autor_nombre'];
        if (isset($d['descripcion']))    $fields['descripcion']  = $d['descripcion'];
        if (isset($d['materia_origen'])) $fields['materia_origen']=$d['materia_origen'];
        if (isset($d['gestion']))        $fields['gestion']      = $d['gestion'];
        if (isset($d['destacado']))      $fields['destacado']    = $d['destacado'] ? 'true' : 'false';
        if (isset($d['publicado']))      $fields['publicado']    = $d['publicado'] ? 'true' : 'false';
        if (!empty($d['thumbnail_url'])) $fields['thumbnail_url']= $d['thumbnail_url'];
        updateIfNotEmpty($db, 'multimedia_estudiantes', $id, $fields);
        Response::success(null,'Actualizado');
    }
    public function togglePublicar(int $id): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        $stmt = Database::getConnection()->prepare("UPDATE multimedia_estudiantes SET publicado=NOT publicado WHERE id=? RETURNING publicado");
        $stmt->execute([$id]); Response::success($stmt->fetch(),'Estado actualizado');
    }
    public function destroy(int $id): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        Database::getConnection()->prepare("DELETE FROM multimedia_estudiantes WHERE id=?")->execute([$id]);
        Response::success(null,'Eliminado');
    }
}

// ─── GALERÍA ───────────────────────────────────────────────
class GaleriaController {
    private function na(array $a): array {
        if (!empty($a['portada_url'])) $a['portada_url'] = imageUrl($a['portada_url']);
        return $a;
    }
    private function ni(array $i): array {
        if (!empty($i['url']))           $i['url']           = imageUrl($i['url']);
        if (!empty($i['thumbnail_url'])) $i['thumbnail_url'] = imageUrl($i['thumbnail_url']);
        if (empty($i['thumbnail_url'])) $i['thumbnail_url']  = $i['url'] ?? null;
        return $i;
    }

    public function albumes(): void {
        $db = Database::getConnection(); $all = !empty($_GET['all']);
        $where = $all ? '' : 'WHERE a.publicado=true';
        $stmt = $db->query("SELECT a.*,COUNT(g.id) AS total_imagenes FROM albumes a LEFT JOIN galeria_imagenes g ON a.id=g.album_id AND g.publicado=true $where GROUP BY a.id ORDER BY a.id DESC");
        Response::success(array_map([$this,'na'],$stmt->fetchAll()));
    }

    public function crearAlbum(): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        $isP = !empty($_POST);
        $d = $isP ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);
        $nombre = trim($d['nombre'] ?? '');
        if (!$nombre) Response::error('Nombre requerido');
        $desc = $d['descripcion'] ?? null;
        $pub  = isset($d['publicado']) ? (is_string($d['publicado']) ? $d['publicado'] !== 'false' : (bool)$d['publicado']) : true;
        $portada = $d['portada_url'] ?? null;
        if (!empty($_FILES['portada']['tmp_name'])) { $up=uploadImage($_FILES['portada'],'albumes'); if($up) $portada=$up; }
        $db = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO albumes (nombre,descripcion,portada_url,publicado) VALUES (?,?,?,?) RETURNING id,nombre");
        $stmt->execute([$nombre,$desc?:null,$portada,$pub?'true':'false']);
        Response::success($this->na($stmt->fetch()),'Álbum creado',201);
    }

    public function actualizarAlbum(int $id): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        $isP = !empty($_POST);
        $d = $isP ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);
        $portada = isset($d['portada_url']) && $d['portada_url'] !== '' ? $d['portada_url'] : null;
        if (!empty($_FILES['portada']['tmp_name'])) { $up=uploadImage($_FILES['portada'],'albumes'); if($up) $portada=$up; }
        $db = Database::getConnection();
        $fields = [];
        if (!empty($d['nombre']))     $fields['nombre']      = $d['nombre'];
        if (isset($d['descripcion'])) $fields['descripcion'] = $d['descripcion'];
        if ($portada !== null)        $fields['portada_url'] = $portada;
        if (isset($d['publicado']))   $fields['publicado']   = (is_string($d['publicado']) ? ($d['publicado']!=='false'?'true':'false') : ($d['publicado']?'true':'false'));
        updateIfNotEmpty($db, 'albumes', $id, $fields);
        $stmt = $db->prepare("SELECT * FROM albumes WHERE id=?"); $stmt->execute([$id]);
        Response::success($this->na($stmt->fetch()),'Álbum actualizado');
    }

    public function eliminarAlbum(int $id): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        $db = Database::getConnection();
        $db->prepare("DELETE FROM galeria_imagenes WHERE album_id=?")->execute([$id]);
        $db->prepare("DELETE FROM albumes WHERE id=?")->execute([$id]);
        Response::success(null,'Álbum eliminado');
    }

    public function imagenes(int $albumId): void {
        $db = Database::getConnection(); $all = !empty($_GET['all']);
        $w = $all ? 'WHERE album_id=?' : 'WHERE album_id=? AND publicado=true';
        $stmt = $db->prepare("SELECT * FROM galeria_imagenes $w ORDER BY creado_en DESC");
        $stmt->execute([$albumId]);
        Response::success(array_map([$this,'ni'],$stmt->fetchAll()));
    }

    public function subirImagen(): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['editor','admin','superadmin']);
        $albumId = null; $titulo = null; $url = null;

        // CASO 1: archivo subido
        if (!empty($_FILES['imagen']['tmp_name'])) {
            $up = uploadImage($_FILES['imagen'], 'galeria');
            if (!$up) Response::error('Error al subir imagen. Usa JPG, PNG o WebP, máx 10MB.');
            $url = $up;
            $albumId = !empty($_POST['album_id']) ? (int)$_POST['album_id'] : null;
            $titulo  = $_POST['titulo'] ?? null;
        }
        // CASO 2: URL en multipart form
        elseif (!empty($_POST['imagen_url'])) {
            $url = trim($_POST['imagen_url']);
            $albumId = !empty($_POST['album_id']) ? (int)$_POST['album_id'] : null;
            $titulo  = $_POST['titulo'] ?? null;
        }
        // CASO 3: JSON  ← este es el que fallaba antes
        else {
            $raw = file_get_contents('php://input');
            $d   = json_decode($raw, true) ?? [];
            $url     = $d['url'] ?? $d['imagen_url'] ?? null;
            $albumId = isset($d['album_id']) ? (int)$d['album_id'] : null;
            $titulo  = $d['titulo'] ?? null;
        }

        if (!$url) Response::error('Debes subir una imagen o pegar una URL válida.');

        $db = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO galeria_imagenes (titulo,url,thumbnail_url,album_id,subido_por,publicado) VALUES (?,?,?,?,?,true) RETURNING id,url,thumbnail_url");
        $stmt->execute([$titulo?:null,$url,$url,$albumId,$payload['id']]);
        Response::success($this->ni($stmt->fetch()),'Imagen agregada',201);
    }

    public function eliminarImagen(int $id): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        Database::getConnection()->prepare("DELETE FROM galeria_imagenes WHERE id=?")->execute([$id]);
        Response::success(null,'Imagen eliminada');
    }
}

// ─── MEJORES ALUMNOS ───────────────────────────────────────
class MejoresAlumnosController {
    public function index(): void {
        $db = Database::getConnection(); $all=!empty($_GET['all']);
        $cond=$all?[]:['publicado=true']; $params=[];
        if (!empty($_GET['gestion'])) { $cond[]='gestion=?'; $params[]=$_GET['gestion']; }
        $where=$cond?'WHERE '.implode(' AND ',$cond):'';
        $stmt=$db->prepare("SELECT * FROM mejores_estudiantes $where ORDER BY promedio DESC"); $stmt->execute($params);
        Response::success($stmt->fetchAll());
    }
    public function store(): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        $isP=!empty($_POST); $d=$isP?$_POST:(json_decode(file_get_contents('php://input'),true)??[]);
        $nombre=trim($d['nombre_completo']??''); $gestion=$d['gestion']??'';
        if(!$nombre||!$gestion) Response::error('Nombre y gestión requeridos');
        $foto=$d['foto_url']??null;
        if(!empty($_FILES['foto']['tmp_name'])){$up=uploadImage($_FILES['foto'],'alumnos');if($up)$foto=$up;}
        $db=Database::getConnection();
        $stmt=$db->prepare("INSERT INTO mejores_estudiantes (nombre_completo,foto_url,promedio,semestre_actual,gestion,logros,publicado) VALUES (?,?,?,?,?,?,true) RETURNING id");
        $stmt->execute([$nombre,$foto,(float)($d['promedio']??0),$d['semestre_actual']??null,$gestion,$d['logros']??null]);
        Response::success($stmt->fetch(),'Alumno agregado',201);
    }
    public function update(int $id): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        $isP=!empty($_POST); $d=$isP?$_POST:(json_decode(file_get_contents('php://input'),true)??[]);
        $foto=isset($d['foto_url'])&&$d['foto_url']!==''?$d['foto_url']:null;
        if(!empty($_FILES['foto']['tmp_name'])){$up=uploadImage($_FILES['foto'],'alumnos');if($up)$foto=$up;}
        $db=Database::getConnection(); $fields=[];
        if(!empty($d['nombre_completo'])) $fields['nombre_completo']=$d['nombre_completo'];
        if($foto!==null)                  $fields['foto_url']=$foto;
        if(!empty($d['promedio']))        $fields['promedio']=(float)$d['promedio'];
        if(!empty($d['gestion']))         $fields['gestion']=$d['gestion'];
        if(isset($d['semestre_actual']))  $fields['semestre_actual']=$d['semestre_actual']?:(null);
        if(isset($d['logros']))           $fields['logros']=$d['logros'];
        if(isset($d['publicado']))        $fields['publicado']=$d['publicado']?'true':'false';
        updateIfNotEmpty($db,'mejores_estudiantes',$id,$fields);
        Response::success(null,'Actualizado');
    }
    public function destroy(int $id): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        Database::getConnection()->prepare("DELETE FROM mejores_estudiantes WHERE id=?")->execute([$id]);
        Response::success(null,'Eliminado');
    }
}

// ─── EGRESADOS ─────────────────────────────────────────────
class EgresadosController {
    public function index(): void {
        $db=Database::getConnection(); $all=!empty($_GET['all']); $where=$all?'':'WHERE publicado=true';
        Response::success($db->query("SELECT * FROM egresados $where ORDER BY anio_egreso DESC")->fetchAll());
    }
    public function store(): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        $isP=!empty($_POST); $d=$isP?$_POST:(json_decode(file_get_contents('php://input'),true)??[]);
        $nombre=trim($d['nombre_completo']??''); if(!$nombre) Response::error('Nombre requerido');
        $foto=$d['foto_url']??null;
        if(!empty($_FILES['foto']['tmp_name'])){$up=uploadImage($_FILES['foto'],'egresados');if($up)$foto=$up;}
        $db=Database::getConnection();
        $stmt=$db->prepare("INSERT INTO egresados (nombre_completo,foto_url,anio_egreso,ocupacion_actual,empresa_institucion,testimonio,linkedin_url,publicado) VALUES (?,?,?,?,?,?,?,true) RETURNING id");
        $stmt->execute([$nombre,$foto,isset($d['anio_egreso'])&&$d['anio_egreso']!==''?(int)$d['anio_egreso']:null,$d['ocupacion_actual']??null,$d['empresa_institucion']??null,$d['testimonio']??null,$d['linkedin_url']??null]);
        Response::success($stmt->fetch(),'Egresado agregado',201);
    }
    public function update(int $id): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        $isP=!empty($_POST); $d=$isP?$_POST:(json_decode(file_get_contents('php://input'),true)??[]);
        $foto=isset($d['foto_url'])&&$d['foto_url']!==''?$d['foto_url']:null;
        if(!empty($_FILES['foto']['tmp_name'])){$up=uploadImage($_FILES['foto'],'egresados');if($up)$foto=$up;}
        $db=Database::getConnection(); $fields=[];
        if(!empty($d['nombre_completo']))     $fields['nombre_completo']=$d['nombre_completo'];
        if($foto!==null)                      $fields['foto_url']=$foto;
        if(isset($d['anio_egreso'])&&$d['anio_egreso']!=='') $fields['anio_egreso']=(int)$d['anio_egreso'];
        if(isset($d['ocupacion_actual']))     $fields['ocupacion_actual']=$d['ocupacion_actual'];
        if(isset($d['empresa_institucion']))  $fields['empresa_institucion']=$d['empresa_institucion'];
        if(isset($d['testimonio']))           $fields['testimonio']=$d['testimonio'];
        if(isset($d['linkedin_url']))         $fields['linkedin_url']=$d['linkedin_url'];
        if(isset($d['publicado']))            $fields['publicado']=$d['publicado']?'true':'false';
        updateIfNotEmpty($db,'egresados',$id,$fields);
        Response::success(null,'Actualizado');
    }
    public function destroy(int $id): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        Database::getConnection()->prepare("DELETE FROM egresados WHERE id=?")->execute([$id]);
        Response::success(null,'Eliminado');
    }
}

// ─── MATERIAS ──────────────────────────────────────────────
class MateriasController {
    public function index(): void {
        $db=Database::getConnection(); $pensum=$_GET['pensum']??'2023';
        $stmt=$db->prepare("SELECT * FROM materias WHERE pensum=? AND activa=true ORDER BY semestre,nombre"); $stmt->execute([$pensum]);
        Response::success($stmt->fetchAll());
    }
    public function store(): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        $d=json_decode(file_get_contents('php://input'),true)??[];
        if(empty($d['nombre'])||!isset($d['semestre'])) Response::error('Nombre y semestre requeridos');
        $db=Database::getConnection();
        $stmt=$db->prepare("INSERT INTO materias (nombre,codigo,semestre,creditos,area,tipo,pensum) VALUES (?,?,?,?,?,?,?) RETURNING id");
        $stmt->execute([$d['nombre'],$d['codigo']??null,(int)$d['semestre'],isset($d['creditos'])?(int)$d['creditos']:null,$d['area']??null,$d['tipo']??'obligatoria',$d['pensum']??'2023']);
        Response::success($stmt->fetch(),'Materia creada',201);
    }
    public function update(int $id): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        $d=json_decode(file_get_contents('php://input'),true)??[];
        $db=Database::getConnection(); $fields=[];
        if(!empty($d['nombre']))   $fields['nombre']=$d['nombre'];
        if(isset($d['creditos'])&&$d['creditos']!=='') $fields['creditos']=(int)$d['creditos'];
        if(!empty($d['area']))     $fields['area']=$d['area'];
        if(!empty($d['tipo']))     $fields['tipo']=$d['tipo'];
        updateIfNotEmpty($db,'materias',$id,$fields);
        Response::success(null,'Materia actualizada');
    }
    public function destroy(int $id): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        Database::getConnection()->prepare("UPDATE materias SET activa=false WHERE id=?")->execute([$id]);
        Response::success(null,'Materia desactivada');
    }
}

// ─── TRÁMITES ──────────────────────────────────────────────
class TramitesController {
    public function index(): void {
        $db=Database::getConnection(); $all=!empty($_GET['all']); $where=$all?'':'WHERE activo=true';
        Response::success($db->query("SELECT * FROM tramites $where ORDER BY nombre")->fetchAll());
    }
    public function store(): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        $isP=!empty($_POST); $d=$isP?$_POST:(json_decode(file_get_contents('php://input'),true)??[]);
        $nombre=trim($d['nombre']??''); if(!$nombre) Response::error('Nombre requerido');
        $archivo=$d['archivo_url']??null;
        if(!empty($_FILES['archivo']['tmp_name'])){$up=uploadFile($_FILES['archivo'],'tramites');if($up)$archivo=$up;}
        $db=Database::getConnection();
        $db->prepare("INSERT INTO tramites (nombre,descripcion,archivo_url,contacto) VALUES (?,?,?,?)")
           ->execute([$nombre,$d['descripcion']??null,$archivo,$d['contacto']??null]);
        Response::success(null,'Trámite creado',201);
    }
    public function update(int $id): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        $isP=!empty($_POST); $d=$isP?$_POST:(json_decode(file_get_contents('php://input'),true)??[]);
        $archivo=isset($d['archivo_url'])&&$d['archivo_url']!==''?$d['archivo_url']:null;
        if(!empty($_FILES['archivo']['tmp_name'])){$up=uploadFile($_FILES['archivo'],'tramites');if($up)$archivo=$up;}
        $db=Database::getConnection(); $fields=[];
        if(!empty($d['nombre']))        $fields['nombre']=$d['nombre'];
        if(isset($d['descripcion']))    $fields['descripcion']=$d['descripcion'];
        if(isset($d['contacto']))       $fields['contacto']=$d['contacto'];
        if($archivo!==null)             $fields['archivo_url']=$archivo;
        if(isset($d['activo']))         $fields['activo']=$d['activo']?'true':'false';
        updateIfNotEmpty($db,'tramites',$id,$fields);
        Response::success(null,'Trámite actualizado');
    }
    public function destroy(int $id): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        Database::getConnection()->prepare("UPDATE tramites SET activo=false WHERE id=?")->execute([$id]);
        Response::success(null,'Desactivado');
    }
}

// ─── CONVOCATORIAS ─────────────────────────────────────────
class ConvocatoriasController {
    public function index(): void {
        $db=Database::getConnection(); $all=!empty($_GET['all']); $where=$all?'':'WHERE publicado=true';
        Response::success($db->query("SELECT * FROM convocatorias $where ORDER BY creado_en DESC")->fetchAll());
    }
    public function store(): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        $isP=!empty($_POST); $d=$isP?$_POST:(json_decode(file_get_contents('php://input'),true)??[]);
        $titulo=trim($d['titulo']??''); $desc=trim($d['descripcion']??'');
        if(!$titulo||!$desc) Response::error('Título y descripción requeridos');
        $archivo=$d['archivo_url']??null;
        if(!empty($_FILES['archivo']['tmp_name'])){$up=uploadFile($_FILES['archivo'],'convocatorias');if($up)$archivo=$up;}
        $pub=isset($d['publicado'])?(is_string($d['publicado'])?$d['publicado']!=='false':(bool)$d['publicado']):false;
        $db=Database::getConnection();
        $db->prepare("INSERT INTO convocatorias (titulo,tipo,descripcion,fecha_limite,archivo_url,publicado,autor_id) VALUES (?,?,?,?,?,?,?)")
           ->execute([$titulo,$d['tipo']??'otro',$desc,$d['fecha_limite']??null,$archivo,$pub?'true':'false',$payload['id']]);
        Response::success(null,'Convocatoria creada',201);
    }
    public function update(int $id): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        $isP=!empty($_POST); $d=$isP?$_POST:(json_decode(file_get_contents('php://input'),true)??[]);
        $archivo=isset($d['archivo_url'])&&$d['archivo_url']!==''?$d['archivo_url']:null;
        if(!empty($_FILES['archivo']['tmp_name'])){$up=uploadFile($_FILES['archivo'],'convocatorias');if($up)$archivo=$up;}
        $db=Database::getConnection(); $fields=[];
        if(!empty($d['titulo']))        $fields['titulo']=$d['titulo'];
        if(!empty($d['tipo']))          $fields['tipo']=$d['tipo'];
        if(!empty($d['descripcion']))   $fields['descripcion']=$d['descripcion'];
        if(isset($d['fecha_limite'])&&$d['fecha_limite']!=='') $fields['fecha_limite']=$d['fecha_limite'];
        if($archivo!==null)             $fields['archivo_url']=$archivo;
        if(isset($d['publicado']))      $fields['publicado']=(is_string($d['publicado'])?($d['publicado']!=='false'?'true':'false'):($d['publicado']?'true':'false'));
        updateIfNotEmpty($db,'convocatorias',$id,$fields);
        Response::success(null,'Convocatoria actualizada');
    }
    public function destroy(int $id): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        Database::getConnection()->prepare("DELETE FROM convocatorias WHERE id=?")->execute([$id]);
        Response::success(null,'Eliminada');
    }
}

// ─── STREAMING ─────────────────────────────────────────────
class StreamingController {
    public function index(): void { Response::success(Database::getConnection()->query("SELECT * FROM canales_streaming WHERE activo=true")->fetchAll()); }
    public function store(): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        $d=json_decode(file_get_contents('php://input'),true)??[];
        Database::getConnection()->prepare("INSERT INTO canales_streaming (nombre,plataforma,url_canal,embed_id) VALUES (?,?,?,?)")->execute([$d['nombre'],$d['plataforma']??'youtube',$d['url_canal'],$d['embed_id']??null]);
        Response::success(null,'Canal agregado',201);
    }
    public function destroy(int $id): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        Database::getConnection()->prepare("UPDATE canales_streaming SET activo=false WHERE id=?")->execute([$id]);
        Response::success(null,'Desactivado');
    }
}

// ─── CATEGORÍAS ────────────────────────────────────────────
class CategoriasController {
    public function index(): void {
        $tipo=$_GET['tipo']??null; $db=Database::getConnection();
        if($tipo){$stmt=$db->prepare("SELECT * FROM categorias WHERE tipo=? ORDER BY nombre");$stmt->execute([$tipo]);}
        else{$stmt=$db->query("SELECT * FROM categorias ORDER BY nombre");}
        Response::success($stmt->fetchAll());
    }
    public function store(): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        $d=json_decode(file_get_contents('php://input'),true)??[];
        $stmt=Database::getConnection()->prepare("INSERT INTO categorias (nombre,color_hex,tipo) VALUES (?,?,?) RETURNING id");
        $stmt->execute([$d['nombre'],$d['color_hex']??'#1A5276',$d['tipo']??'noticias']);
        Response::success($stmt->fetch(),'Categoría creada',201);
    }
    public function destroy(int $id): void {
        $payload=Auth::requireAuth(); Auth::requireRole($payload,['admin','superadmin']);
        Database::getConnection()->prepare("DELETE FROM categorias WHERE id=?")->execute([$id]);
        Response::success(null,'Categoría eliminada');
    }
}

// ============================================================
// SESIONES DE EVENTOS
// ============================================================
class EventoSesionesController {
    public function index(int $eventoId): void {
        $db  = Database::getConnection();
        $all = !empty($_GET['all']);
        $w   = $all ? 'WHERE evento_id=?' : 'WHERE evento_id=? AND publicado=true';
        $stmt = $db->prepare("SELECT * FROM evento_sesiones $w ORDER BY numero_sesion ASC, fecha ASC");
        $stmt->execute([$eventoId]);
        Response::success($stmt->fetchAll());
    }

    public function store(int $eventoId): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        $d = json_decode(file_get_contents('php://input'), true) ?? [];
        $titulo = trim($d['titulo'] ?? '');
        if (!$titulo) Response::error('Título requerido');
        $db = Database::getConnection();
        $db->prepare("UPDATE eventos SET tiene_sesiones=true WHERE id=?")->execute([$eventoId]);
        $num = isset($d['numero_sesion']) && $d['numero_sesion'] !== '' ? (int)$d['numero_sesion'] : null;
        if (!$num) {
            $q = $db->prepare("SELECT COALESCE(MAX(numero_sesion),0)+1 FROM evento_sesiones WHERE evento_id=?");
            $q->execute([$eventoId]); $num = (int)$q->fetchColumn();
        }
        $stmt = $db->prepare("INSERT INTO evento_sesiones (evento_id,numero_sesion,titulo,fecha,descripcion,contenido_visto,material_url,grabacion_url,enlace_virtual,publicado) VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING id");
        $stmt->execute([$eventoId,$num,$titulo,$d['fecha']??null,$d['descripcion']??null,$d['contenido_visto']??null,$d['material_url']??null,$d['grabacion_url']??null,$d['enlace_virtual']??null,isset($d['publicado'])?($d['publicado']?'true':'false'):'true']);
        Response::success($stmt->fetch(), 'Sesión registrada', 201);
    }

    public function update(int $sesionId): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        $d = json_decode(file_get_contents('php://input'), true) ?? [];
        $db = Database::getConnection();
        $fields = [];
        if (!empty($d['titulo']))         $fields['titulo']          = $d['titulo'];
        if (isset($d['fecha']))           $fields['fecha']           = $d['fecha'] ?: null;
        if (isset($d['descripcion']))     $fields['descripcion']     = $d['descripcion'];
        if (isset($d['contenido_visto'])) $fields['contenido_visto'] = $d['contenido_visto'];
        if (isset($d['material_url']))    $fields['material_url']    = $d['material_url'];
        if (isset($d['grabacion_url']))   $fields['grabacion_url']   = $d['grabacion_url'];
        if (isset($d['enlace_virtual']))  $fields['enlace_virtual']  = $d['enlace_virtual'];
        if (isset($d['publicado']))       $fields['publicado']       = $d['publicado'] ? 'true' : 'false';
        if (!empty($d['numero_sesion']))  $fields['numero_sesion']   = (int)$d['numero_sesion'];
        if (empty($fields)) Response::error('Nada que actualizar');
        $sets = implode(', ', array_map(fn($k) => "$k=?", array_keys($fields)));
        $params = array_values($fields); $params[] = $sesionId;
        $db->prepare("UPDATE evento_sesiones SET $sets WHERE id=?")->execute($params);
        Response::success(null, 'Sesión actualizada');
    }

    public function destroy(int $sesionId): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        Database::getConnection()->prepare("DELETE FROM evento_sesiones WHERE id=?")->execute([$sesionId]);
        Response::success(null, 'Sesión eliminada');
    }
}

// ============================================================
// CONVENIOS INSTITUCIONALES
// ============================================================
class ConveniosController {
    private function norm(array $c): array {
        if (!empty($c['fecha_vencimiento'])) {
            $hoy  = new DateTime();
            $vcto = new DateTime($c['fecha_vencimiento']);
            $diff = $hoy->diff($vcto);
            if ($hoy > $vcto)            { $c['estado']='vencido';    $c['dias_restantes']=0; }
            elseif ($diff->days <= 30)   { $c['estado']='por_vencer'; $c['dias_restantes']=$diff->days; }
            else                         { $c['estado']='vigente';    $c['dias_restantes']=$diff->days; }
        } else { $c['estado']='sin_fecha'; $c['dias_restantes']=null; }
        if (!empty($c['logo_url'])) $c['logo_url'] = imageUrl($c['logo_url']);
        return $c;
    }

    public function index(): void {
        $db   = Database::getConnection();
        $all  = !empty($_GET['all']);
        $cond = $all ? [] : ['publicado=true'];
        $params = [];
        if (!empty($_GET['tipo'])) { $cond[] = 'tipo_convenio=?'; $params[] = $_GET['tipo']; }
        $where = $cond ? 'WHERE ' . implode(' AND ', $cond) : '';
        $stmt  = $db->prepare("SELECT * FROM convenios $where ORDER BY activo DESC, fecha_vencimiento ASC");
        $stmt->execute($params);
        Response::success(array_map([$this,'norm'], $stmt->fetchAll()));
    }

    public function store(): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        $isP = !empty($_POST);
        $d   = $isP ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);
        $nombre = trim($d['nombre_institucion'] ?? '');
        if (!$nombre) Response::error('Nombre de la institución requerido');
        $logo = $d['logo_url'] ?? null;
        if (!empty($_FILES['logo']['tmp_name'])) { $up = uploadImage($_FILES['logo'],'convenios'); if($up) $logo=$up; }
        $pub = isset($d['publicado']) ? (is_string($d['publicado']) ? $d['publicado']!=='false' : (bool)$d['publicado']) : true;
        $db   = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO convenios (nombre_institucion,tipo_institucion,descripcion,tipo_convenio,cupos_disponibles,duracion_meses,requisitos,fecha_inicio,fecha_vencimiento,contacto_nombre,contacto_email,contacto_telefono,logo_url,activo,publicado) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id");
        $stmt->execute([
            $nombre, $d['tipo_institucion']??'empresa', $d['descripcion']??null,
            $d['tipo_convenio']??'pasantia',
            isset($d['cupos_disponibles'])&&$d['cupos_disponibles']!==''?(int)$d['cupos_disponibles']:null,
            isset($d['duracion_meses'])&&$d['duracion_meses']!==''?(int)$d['duracion_meses']:null,
            $d['requisitos']??null, $d['fecha_inicio']??null, $d['fecha_vencimiento']??null,
            $d['contacto_nombre']??null, $d['contacto_email']??null, $d['contacto_telefono']??null,
            $logo,
            isset($d['activo'])&&$d['activo']!=='false'?'true':'false',
            $pub?'true':'false'
        ]);
        Response::success($stmt->fetch(), 'Convenio creado', 201);
    }

    public function update(int $id): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        $isP = !empty($_POST);
        $d   = $isP ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);
        $logo = isset($d['logo_url'])&&$d['logo_url']!==''?$d['logo_url']:null;
        if (!empty($_FILES['logo']['tmp_name'])) { $up=uploadImage($_FILES['logo'],'convenios'); if($up) $logo=$up; }
        $db     = Database::getConnection();
        $fields = [];
        if (!empty($d['nombre_institucion']))                              $fields['nombre_institucion']  = $d['nombre_institucion'];
        if (!empty($d['tipo_institucion']))                                $fields['tipo_institucion']    = $d['tipo_institucion'];
        if (isset($d['descripcion']))                                      $fields['descripcion']         = $d['descripcion'];
        if (!empty($d['tipo_convenio']))                                   $fields['tipo_convenio']       = $d['tipo_convenio'];
        if (isset($d['cupos_disponibles'])&&$d['cupos_disponibles']!=='') $fields['cupos_disponibles']   = (int)$d['cupos_disponibles'];
        if (isset($d['duracion_meses'])&&$d['duracion_meses']!=='')       $fields['duracion_meses']      = (int)$d['duracion_meses'];
        if (isset($d['requisitos']))                                       $fields['requisitos']          = $d['requisitos'];
        if (isset($d['fecha_inicio'])&&$d['fecha_inicio']!=='')           $fields['fecha_inicio']        = $d['fecha_inicio'];
        if (isset($d['fecha_vencimiento'])&&$d['fecha_vencimiento']!=='') $fields['fecha_vencimiento']   = $d['fecha_vencimiento'];
        if (isset($d['contacto_nombre']))                                  $fields['contacto_nombre']     = $d['contacto_nombre'];
        if (isset($d['contacto_email']))                                   $fields['contacto_email']      = $d['contacto_email'];
        if (isset($d['contacto_telefono']))                                $fields['contacto_telefono']   = $d['contacto_telefono'];
        if ($logo !== null)                                                $fields['logo_url']            = $logo;
        if (isset($d['activo']))    $fields['activo']    = ($d['activo']&&$d['activo']!=='false')?'true':'false';
        if (isset($d['publicado'])) $fields['publicado'] = ($d['publicado']&&$d['publicado']!=='false')?'true':'false';
        if (empty($fields)) Response::error('Nada que actualizar');
        $sets   = implode(', ', array_map(fn($k) => "$k=?", array_keys($fields)));
        $params = array_values($fields); $params[] = $id;
        $db->prepare("UPDATE convenios SET $sets, actualizado_en=NOW() WHERE id=?")->execute($params);
        Response::success(null, 'Convenio actualizado');
    }

    public function destroy(int $id): void {
        $payload = Auth::requireAuth(); Auth::requireRole($payload, ['admin','superadmin']);
        Database::getConnection()->prepare("UPDATE convenios SET activo=false,publicado=false WHERE id=?")->execute([$id]);
        Response::success(null, 'Convenio desactivado');
    }
}
