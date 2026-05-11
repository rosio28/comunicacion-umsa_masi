<?php
// ============================================================
// RUTAS A AGREGAR EN index.php
// Agrega estas líneas al archivo require_once del index.php:
//   require_once __DIR__ . '/controllers/NuevosControllers.php';
//
// Y agrega estas rutas al bloque match(true) antes del default:
// ============================================================

/*
        // ── SESIONES DE EVENTOS
        $r0==='eventos' && $r1 && $r2==='sesiones' && !$r3 && $method==='GET'    => (new EventoSesionesController)->index((int)$r1),
        $r0==='eventos' && $r1 && $r2==='sesiones' && !$r3 && $method==='POST'   => (new EventoSesionesController)->store((int)$r1),
        $r0==='eventos' && $r1 && $r2==='sesiones' && $r3  && $method==='PUT'    => (new EventoSesionesController)->update((int)$r3),
        $r0==='eventos' && $r1 && $r2==='sesiones' && $r3  && $method==='DELETE' => (new EventoSesionesController)->destroy((int)$r3),

        // ── CONVENIOS
        $r0==='convenios' && !$r1 && $method==='GET'    => (new ConveniosController)->index(),
        $r0==='convenios' && !$r1 && $method==='POST'   => (new ConveniosController)->store(),
        $r0==='convenios' && $r1  && $method==='PUT'    => (new ConveniosController)->update((int)$r1),
        $r0==='convenios' && $r1  && $method==='DELETE' => (new ConveniosController)->destroy((int)$r1),
*/

// ============================================================
// TAMBIÉN reemplaza la ruta de materias para soportar pensum como parámetro:
// La ruta ya existe, solo asegúrate de que el frontend envíe ?pensum=2001 o ?pensum=2023
// ============================================================
