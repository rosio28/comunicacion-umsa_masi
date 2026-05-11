<?php
$uri  = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$file = __DIR__ . str_replace('/', DIRECTORY_SEPARATOR, $uri);

if ($uri !== '/' && file_exists($file) && is_file($file)) {
    if (pathinfo($file, PATHINFO_EXTENSION) === 'php') {
        include $file; return true;
    }
    header('Content-Type: ' . (mime_content_type($file) ?: 'application/octet-stream'));
    header('Access-Control-Allow-Origin: *');
    header('Cache-Control: public, max-age=86400');
    readfile($file);
    return true;
}
require __DIR__ . '/index.php';
