<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../utils/Response.php';

class Auth {
    private static function getAuthorizationHeader(): string {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!$header && function_exists('getallheaders')) {
            $headers = getallheaders();
            if (!empty($headers['Authorization'])) {
                $header = $headers['Authorization'];
            } elseif (!empty($headers['authorization'])) {
                $header = $headers['authorization'];
            }
        }
        return trim($header);
    }

    public static function requireAuth(): array {
        $header = self::getAuthorizationHeader();
        if (!str_starts_with($header, 'Bearer ')) {
            Response::error('Token requerido', 401);
        }
        $token   = substr($header, 7);
        $payload = JWT::verify($token);
        if (!$payload) Response::error('Token inválido o expirado', 401);

        $db   = Database::getConnection();
        $stmt = $db->prepare('SELECT id, rol, activo FROM usuarios WHERE id = ?');
        $stmt->execute([$payload['id']]);
        $user = $stmt->fetch();
        if (!$user || !$user['activo']) {
            Response::error('Usuario inválido o inactivo', 401);
        }

        $payload['rol'] = $user['rol'];
        return $payload;
    }

    public static function requireRole(array $payload, array $roles): void {
        if (!in_array($payload['rol'], $roles)) {
            Response::error('Acceso denegado', 403);
        }
    }
}
