<?php
/**
 * ParseInput.php
 * PHP solo populua $_POST para POST. Para PUT/PATCH con multipart hay que parsear manualmente.
 * Este helper unifica el acceso a los datos del request independientemente del método HTTP.
 */

function getInputData(): array {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $ct     = strtolower($_SERVER['CONTENT_TYPE'] ?? '');

    // JSON
    if (str_contains($ct, 'application/json')) {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }

    // POST normal – PHP ya populó $_POST
    if ($method === 'POST') {
        if (!empty($_POST)) return $_POST;
        $raw = file_get_contents('php://input');
        if ($raw) {
            $d = json_decode($raw, true);
            if (is_array($d)) return $d;
            parse_str($raw, $parsed);
            if (!empty($parsed)) return $parsed;
        }
        return [];
    }

    // PUT / PATCH / DELETE
    if (in_array($method, ['PUT','PATCH','DELETE'])) {
        if (str_contains($ct, 'multipart/form-data')) {
            return parseMultipartInput($_SERVER['CONTENT_TYPE'] ?? '');
        }
        if (str_contains($ct, 'application/x-www-form-urlencoded')) {
            parse_str(file_get_contents('php://input'), $p);
            return $p ?: [];
        }
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }

    return [];
}

/**
 * Parsea multipart/form-data desde php://input.
 * Popula también $_FILES para los archivos encontrados.
 */
function parseMultipartInput(string $contentType): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) return [];

    if (!preg_match('/boundary=(?:"([^"]+)"|([^\s;]+))/', $contentType, $m)) return [];
    $boundary = $m[1] ?? $m[2];

    $parts = explode('--' . $boundary, $raw);
    array_shift($parts); // quitar preámbulo

    $data = [];

    foreach ($parts as $part) {
        $t = trim($part);
        if ($t === '--' || $t === '') continue;

        $headerEnd = strpos($part, "\r\n\r\n");
        if ($headerEnd === false) continue;

        $headers = substr($part, 0, $headerEnd);
        $body    = substr($part, $headerEnd + 4);
        $body    = rtrim($body, "\r\n");

        if (!preg_match('/Content-Disposition:[^\r\n]*\bname="([^"]+)"/i', $headers, $nm)) continue;
        $name = $nm[1];

        // ¿Es un archivo?
        if (preg_match('/Content-Disposition:[^\r\n]*\bfilename="([^"]*)"/i', $headers, $fm)) {
            $filename = $fm[1];
            if ($filename === '') continue; // Sin archivo seleccionado

            preg_match('/Content-Type:\s*([^\r\n]+)/i', $headers, $tm);
            $mime = trim($tm[1] ?? 'application/octet-stream');

            $tmp = tempnam(sys_get_temp_dir(), 'phpput_');
            file_put_contents($tmp, $body);

            $_FILES[$name] = [
                'name'     => $filename,
                'type'     => $mime,
                'tmp_name' => $tmp,
                'error'    => UPLOAD_ERR_OK,
                'size'     => strlen($body),
            ];
        } else {
            // Campo normal – soportar array notation field[]
            if (substr($name, -2) === '[]') {
                $rn = substr($name, 0, -2);
                if (!isset($data[$rn])) $data[$rn] = [];
                $data[$rn][] = $body;
            } else {
                $data[$name] = $body;
            }
        }
    }

    return $data;
}
