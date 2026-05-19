<?php
/**
 * Upload.php — soporta archivos de POST y de PUT (parseMultipartInput)
 * Para PUT los archivos están en temp pero move_uploaded_file falla (no es upload HTTP).
 * Usamos rename() como fallback.
 */

function uploadImage(array $file, string $sub): ?string {
    if (empty($file['tmp_name']) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) return null;
    $allowed = ['image/jpeg','image/jpg','image/png','image/webp','image/gif'];
    if (!in_array(strtolower($file['type'] ?? ''), $allowed)) return null;
    if (($file['size'] ?? 0) > 10 * 1024 * 1024) return null;

    $dir = UPLOAD_DIR . $sub . DIRECTORY_SEPARATOR;
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $ext  = strtolower(pathinfo($file['name'] ?? 'img.jpg', PATHINFO_EXTENSION)) ?: 'jpg';
    $name = uniqid($sub . '_', true) . '.' . $ext;
    $dest = $dir . $name;

    // Intenta move_uploaded_file (POST); si falla usa rename (PUT parseado)
    if (!@move_uploaded_file($file['tmp_name'], $dest)) {
        if (!@rename($file['tmp_name'], $dest)) {
            if (!@copy($file['tmp_name'], $dest)) return null;
            @unlink($file['tmp_name']);
        }
    }

    return BACKEND_URL . '/uploads/' . $sub . '/' . $name;
}

function uploadFile(array $file, string $sub): ?string {
    if (empty($file['tmp_name']) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) return null;
    if (($file['size'] ?? 0) > 20 * 1024 * 1024) return null;

    $dir = UPLOAD_DIR . $sub . DIRECTORY_SEPARATOR;
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $ext  = strtolower(pathinfo($file['name'] ?? 'file', PATHINFO_EXTENSION)) ?: 'bin';
    $name = uniqid($sub . '_', true) . '.' . $ext;
    $dest = $dir . $name;

    if (!@move_uploaded_file($file['tmp_name'], $dest)) {
        if (!@rename($file['tmp_name'], $dest)) {
            if (!@copy($file['tmp_name'], $dest)) return null;
            @unlink($file['tmp_name']);
        }
    }

    return BACKEND_URL . '/uploads/' . $sub . '/' . $name;
}
