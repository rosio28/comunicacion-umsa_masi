<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Mailer.php';

class AuthController {

    public function login(): void {
        $data  = json_decode(file_get_contents('php://input'), true);
        $email = trim($data['email'] ?? '');
        $pass  = $data['password'] ?? '';
        if (!$email || !$pass) Response::error('Email y contraseña requeridos');

        $db   = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM usuarios WHERE email = ? AND activo = true");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($pass, $user['password_hash'])) {
            Response::error('Credenciales inválidas', 401);
        }

        // Log de sesión
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $db->prepare("INSERT INTO sesiones_log (usuario_id, ip_address, user_agent) VALUES (?,?,?)")
           ->execute([$user['id'], $ip, $ua]);

        $token = JWT::generate([
            'id'     => $user['id'],
            'email'  => $user['email'],
            'rol'    => $user['rol'],
            'nombre' => $user['nombre'],
        ]);

        Response::success([
            'token'                  => $token,
            'debe_cambiar_password'  => (bool)$user['debe_cambiar_password'],
            'usuario' => [
                'id'         => $user['id'],
                'nombre'     => $user['nombre'],
                'email'      => $user['email'],
                'rol'        => $user['rol'],
                'avatar_url' => $user['avatar_url'],
                'ci'              => $user['ci'] ?? null,
                'primer_apellido' => $user['primer_apellido'] ?? null,
                'telefono'        => $user['telefono'] ?? null,
            ],
        ], 'Login exitoso');
    }

    public function me(): void {
        require_once __DIR__ . '/../middleware/Auth.php';
        $payload = Auth::requireAuth();
        $db   = Database::getConnection();
        $stmt = $db->prepare("SELECT id, nombre, email, rol, avatar_url, ci,
            primer_apellido, segundo_apellido, telefono,
            semestre, promedio, horas_trabajo, debe_cambiar_password
            FROM usuarios WHERE id = ?");
        $stmt->execute([$payload['id']]);
        $user = $stmt->fetch();
        if (!$user) Response::error('Usuario no encontrado', 404);
        Response::success($user);
    }

    public function cambiarPassword(): void {
        require_once __DIR__ . '/../middleware/Auth.php';
        $payload = Auth::requireAuth();
        $data    = json_decode(file_get_contents('php://input'), true);
        $actual  = $data['password_actual'] ?? '';
        $nueva   = $data['password_nueva']  ?? '';

        if (!$actual || !$nueva || strlen($nueva) < 8)
            Response::error('La contraseña nueva debe tener al menos 8 caracteres');

        $db   = Database::getConnection();
        $stmt = $db->prepare("SELECT password_hash FROM usuarios WHERE id = ?");
        $stmt->execute([$payload['id']]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($actual, $user['password_hash']))
            Response::error('Contraseña actual incorrecta', 401);

        $hash = password_hash($nueva, PASSWORD_BCRYPT, ['cost' => 12]);
        // Marcar que ya no necesita cambiar contraseña
        $db->prepare("UPDATE usuarios SET password_hash = ?, debe_cambiar_password = false, actualizado_en = NOW() WHERE id = ?")
           ->execute([$hash, $payload['id']]);

        Response::success(null, 'Contraseña actualizada correctamente');
    }

    public function recuperar(): void {
        $data  = json_decode(file_get_contents('php://input'), true);
        $email = trim($data['email'] ?? '');
        if (!$email) Response::error('Email requerido');

        $db   = Database::getConnection();
        $stmt = $db->prepare("SELECT id, nombre FROM usuarios WHERE email = ? AND activo = true");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if (!$user) { Response::success(null, 'Si el correo existe, recibirás un enlace'); return; }

        $token = bin2hex(random_bytes(32));
        $exp   = date('Y-m-d H:i:s', strtotime('+1 hour'));
        $db->prepare("UPDATE usuarios SET token_reset = ?, token_reset_exp = ? WHERE id = ?")
           ->execute([$token, $exp, $user['id']]);

        $link = FRONTEND_URL . "/admin/reset?token=$token";
        Mailer::send($email, $user['nombre'], 'Restablecer contraseña — CCS UMSA',
            "<p>Hola <strong>{$user['nombre']}</strong>,</p>
             <p>Haz clic para restablecer tu contraseña (válido 1 hora):</p>
             <p><a href='$link' style='background:#C0392B;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;'>Restablecer contraseña</a></p>");
        Response::success(null, 'Si el correo existe, recibirás un enlace');
    }

    public function resetPassword(): void {
        $data     = json_decode(file_get_contents('php://input'), true);
        $token    = $data['token']    ?? '';
        $password = $data['password'] ?? '';
        if (!$token || strlen($password) < 8) Response::error('Datos inválidos');

        $db   = Database::getConnection();
        $stmt = $db->prepare("SELECT id FROM usuarios WHERE token_reset = ? AND token_reset_exp > NOW()");
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        if (!$user) Response::error('Token inválido o expirado', 400);

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $db->prepare("UPDATE usuarios SET password_hash = ?, token_reset = NULL,
            token_reset_exp = NULL, debe_cambiar_password = false, actualizado_en = NOW()
            WHERE id = ?")
           ->execute([$hash, $user['id']]);
        Response::success(null, 'Contraseña restablecida correctamente');
    }
}