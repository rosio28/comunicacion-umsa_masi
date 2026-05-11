<?php
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../utils/Response.php';

class Auth {
    public static function requireAuth(): array {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!str_starts_with($header, 'Bearer ')) {
            Response::error('Token requerido', 401);
        }
        $token   = substr($header, 7);
        $payload = JWT::verify($token);
        if (!$payload) Response::error('Token inválido o expirado', 401);
        return $payload;
    }

    public static function requireRole(array $payload, array $roles): void {
        if (!in_array($payload['rol'], $roles)) {
            Response::error('Acceso denegado', 403);
        }
    }
}
