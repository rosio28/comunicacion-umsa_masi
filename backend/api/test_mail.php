<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/utils/Mailer.php';

// Probar conexión básica primero
echo "Probando conexión a smtp.gmail.com:587...<br>";
$sock = @fsockopen('smtp.gmail.com', 587, $errno, $errstr, 10);
if ($sock) {
    echo "✓ Conexión TCP exitosa<br>";
    echo "Respuesta: " . fgets($sock, 512) . "<br>";
    fclose($sock);
} else {
    echo "✗ No se pudo conectar: $errstr ($errno)<br>";
    echo "Posible causa: firewall o antivirus bloqueando el puerto<br>";
}

echo "<br>Probando conexión SSL a smtp.gmail.com:465...<br>";
$sock2 = @fsockopen('ssl://smtp.gmail.com', 465, $errno2, $errstr2, 10);
if ($sock2) {
    echo "✓ Conexión SSL exitosa<br>";
    echo "Respuesta: " . fgets($sock2, 512) . "<br>";
    fclose($sock2);
} else {
    echo "✗ No se pudo conectar SSL: $errstr2 ($errno2)<br>";
}

echo "<br>Enviando correo de prueba...<br>";
$ok = Mailer::send(
    'rosiomasielticonachirinos@gmail.com',
    'Test CCS',
    'Prueba SMTP',
    '<p>Prueba de conexión SMTP desde CCS UMSA.</p>'
);
echo $ok ? '✓ Correo enviado' : '✗ Error (ver CMD del servidor PHP)';