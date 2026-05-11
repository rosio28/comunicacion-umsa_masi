<?php
function uploadImage(array $file, string $sub): ?string {
    if (!isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) return null;
    $allowed = ['image/jpeg','image/jpg','image/png','image/webp','image/gif'];
    if (!in_array(strtolower($file['type']), $allowed)) return null;
    if ($file['size'] > 10 * 1024 * 1024) return null;
    $dir = UPLOAD_DIR . $sub . DIRECTORY_SEPARATOR;
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $ext  = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $name = uniqid($sub . '_', true) . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], $dir . $name)) return null;
    return BACKEND_URL . '/uploads/' . $sub . '/' . $name;
}

function uploadFile(array $file, string $sub): ?string {
    if (!isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) return null;
    if ($file['size'] > 20 * 1024 * 1024) return null;
    $dir = UPLOAD_DIR . $sub . DIRECTORY_SEPARATOR;
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $ext  = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $name = uniqid($sub . '_', true) . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], $dir . $name)) return null;
    return BACKEND_URL . '/uploads/' . $sub . '/' . $name;
}
