<?php
require_once __DIR__ . '/config.php';

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";options='--client_encoding=UTF8'";
            try {
                // Opciones comunes para PDO
                $options = [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ];

                // Añadir comando de inicialización solo para drivers MySQL (constante sólo existe para MySQL)
                if (str_starts_with($dsn, 'mysql:') && defined('PDO::MYSQL_ATTR_INIT_COMMAND')) {
                    $options[PDO::MYSQL_ATTR_INIT_COMMAND] = "SET NAMES utf8mb4";
                }

                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
                // Forzar UTF-8 en PostgreSQL (si aplica)
                try {
                    self::$instance->exec("SET client_encoding TO 'UTF8'");
                } catch (Throwable $ignore) {
                    // ignore if not supported
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
                exit;
            }
        }
        return self::$instance;
    }
}
