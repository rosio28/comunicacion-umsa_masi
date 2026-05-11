<?php
$hash = '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uHl/SiDa2';
$pass = 'password';
var_dump(password_verify($pass, $hash));
// Debe decir: bool(true)