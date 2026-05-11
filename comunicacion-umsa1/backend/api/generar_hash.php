<?php
$pass = 'Admin2026!';
$hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);
echo "Contraseña: $pass\n";
echo "Hash: $hash\n";
echo "Verificación: ";
var_dump(password_verify($pass, $hash));
