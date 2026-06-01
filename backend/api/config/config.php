<?php
ini_set('display_errors', 1);
// Forzar salida y manejo en UTF-8 de forma global
ini_set('default_charset', 'UTF-8');
if (function_exists('mb_internal_encoding')) {
    mb_internal_encoding('UTF-8');
    mb_http_output('UTF-8');
}
error_reporting(E_ALL);

define('DB_HOST',     getenv('DB_HOST') ?: '127.0.0.1');
define('DB_NAME',     getenv('DB_NAME') ?: 'comunicacion_umsa');
define('DB_USER',     getenv('DB_USER') ?: 'ccs_user');
define('DB_PASS',     getenv('DB_PASS') ?: '123456');
define('DB_PORT',     getenv('DB_PORT') ?: '5432');

define('JWT_SECRET',  getenv('JWT_SECRET') ?: '12345678901234567890123456789012');
// JWT lifetime in seconds: 15 minutes = 900 seconds
define('JWT_EXPIRY',  getenv('JWT_EXPIRY') ?: 900);

define('FRONTEND_URL', getenv('FRONTEND_URL') ?: 'http://localhost');
define('BACKEND_URL', getenv('BACKEND_URL') ?: 'http://localhost');

/* =========================
   CONFIG SMTP GMAIL
========================= */

define('MAIL_HOST', 'smtp.gmail.com');
define('MAIL_PORT', 587);
define('MAIL_USER', 'mchirinost@fcpn.edu.bo');
define('MAIL_PASS', 'sfotqjgexiyythvg');
define('MAIL_FROM_NAME', 'Comunicación Social UMSA');
define('MAIL_REPLY_TO', 'mchirinost@fcpn.edu.bo');
define('ADMIN_EMAIL', 'mchirinost@fcpn.edu.bo');

/* ========================= */

define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('MAX_FILE_SIZE', 10 * 1024 * 1024);

/**
 * Convierte cualquier URL de imagen a URL absoluta servible.
 *
 * Soporta:
 *  - Rutas locales relativas  → BACKEND_URL/ruta
 *  - URLs externas (http/https) → sin cambio
 *  - Google Drive share links  → URL de miniatura directa
 *    Formatos:
 *      https://drive.google.com/file/d/FILE_ID/view?...
 *      https://drive.google.com/open?id=FILE_ID
 *      https://drive.google.com/uc?id=FILE_ID
 */
function imageUrl(?string $path): ?string {
    if (!$path) return null;

    // ── Google Drive: convertir share link a thumbnail directo ──
    // Captura el FILE_ID de los distintos formatos de link de Drive
    if (str_contains($path, 'drive.google.com')) {
        $fileId = null;

        // Formato /file/d/FILE_ID/...
        if (preg_match('#drive\.google\.com/file/d/([a-zA-Z0-9_-]+)#', $path, $m)) {
            $fileId = $m[1];
        }
        // Formato ?id=FILE_ID  (open?id= o uc?id= o uc?export=view&id=)
        elseif (preg_match('#[?&]id=([a-zA-Z0-9_-]+)#', $path, $m)) {
            $fileId = $m[1];
        }

        if ($fileId) {
            // Thumbnail de alta resolución (hasta 2000px de ancho)
            return "https://drive.google.com/thumbnail?id={$fileId}&sz=w2000";
        }
    }

    // ── URL ya absoluta (http / https) ──────────────────────────
    if (
        str_starts_with($path, 'http://') ||
        str_starts_with($path, 'https://')
    ) {
        return $path;
    }

    // ── Ruta local relativa → construir URL absoluta del backend ─
    return BACKEND_URL . '/' . ltrim(
        str_replace('\\', '/', $path),
        '/'
    );
}
