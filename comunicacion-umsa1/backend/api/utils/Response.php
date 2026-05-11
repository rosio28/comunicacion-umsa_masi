<?php
class Response {
    public static function json(mixed $data, int $code = 200): void {
        http_response_code($code);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
    public static function success(mixed $data = null, string $msg = 'OK', int $code = 200): void {
        self::json(['success' => true, 'message' => $msg, 'data' => $data], $code);
    }
    public static function error(string $msg, int $code = 400): void {
        self::json(['success' => false, 'message' => $msg], $code);
    }
    public static function paginated(array $data, int $total, int $page, int $limit): void {
        self::json([
            'success' => true, 'data' => $data,
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit,
                             'pages' => (int)ceil($total / $limit)]
        ]);
    }
}
