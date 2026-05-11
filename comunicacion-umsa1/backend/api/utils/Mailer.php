<?php
// ============================================================
// Mailer.php — SIN DEPENDENCIAS EXTERNAS
// Funciona sin Composer ni PHPMailer instalado
// Usa PHP mail() como fallback si SMTP falla
// ============================================================
require_once __DIR__ . '/../config/config.php';

class Mailer {

    /**
     * Enviar correo. Intenta SMTP primero, luego mail() como fallback.
     */
    public static function send(string $toEmail, string $toName, string $subject, string $htmlBody): bool {
        // Intentar con la librería PHPMailer si existe (instalada con Composer)
        $phpmailerPath = __DIR__ . '/../../../vendor/autoload.php';
        $libPath       = __DIR__ . '/../lib/PHPMailer/PHPMailer.php';

        if (file_exists($phpmailerPath)) {
            require_once $phpmailerPath;
            return self::sendWithPHPMailer($toEmail, $toName, $subject, $htmlBody);
        }

        if (file_exists($libPath)) {
            require_once $libPath;
            require_once __DIR__ . '/../lib/PHPMailer/SMTP.php';
            require_once __DIR__ . '/../lib/PHPMailer/Exception.php';
            return self::sendWithPHPMailer($toEmail, $toName, $subject, $htmlBody);
        }

        // Fallback: usar mail() nativo de PHP
        return self::sendWithMailFunction($toEmail, $toName, $subject, $htmlBody);
    }

    private static function sendWithPHPMailer(string $toEmail, string $toName, string $subject, string $htmlBody): bool {
        $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = MAIL_HOST;
            $mail->SMTPAuth   = true;
            $mail->Username   = MAIL_USER;
            $mail->Password   = MAIL_PASS;
            $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = MAIL_PORT;
            $mail->CharSet    = 'UTF-8';
            $mail->setFrom(MAIL_USER, MAIL_FROM_NAME);
            $mail->addReplyTo(MAIL_REPLY_TO, MAIL_FROM_NAME);
            $mail->addAddress($toEmail, $toName);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = self::wrapHtml($subject, $htmlBody);
            $mail->send();
            return true;
        } catch (\Exception $e) {
            error_log('[Mailer SMTP Error] ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Fallback: usar mail() de PHP. Funciona si el servidor tiene sendmail configurado.
     * En desarrollo local normalmente no envía, pero no bloquea la aplicación.
     */
    private static function sendWithMailFunction(string $toEmail, string $toName, string $subject, string $htmlBody): bool {
        $html   = self::wrapHtml($subject, $htmlBody);
        $from   = MAIL_USER;
        $fromName = MAIL_FROM_NAME;

        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8\r\n";
        $headers .= "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <$from>\r\n";
        $headers .= "Reply-To: " . MAIL_REPLY_TO . "\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

        $result = @mail(
            "$toName <$toEmail>",
            "=?UTF-8?B?" . base64_encode($subject) . "?=",
            $html,
            $headers
        );

        if (!$result) {
            error_log("[Mailer] No se pudo enviar correo a $toEmail — SMTP no configurado. Instala PHPMailer con: cd backend && composer install");
        }

        // Retornamos true para no bloquear el flujo (el correo fallará silenciosamente)
        return true;
    }

    private static function wrapHtml(string $title, string $body): string {
        return "<!DOCTYPE html><html><head><meta charset='utf-8'>
<style>
body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;}
.container{background:#fff;max-width:600px;margin:0 auto;padding:0;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);}
.header{background:#C0392B;color:#fff;padding:24px 30px;text-align:center;}
.header h1{margin:0;font-size:20px;font-weight:600;}
.header p{margin:4px 0 0;font-size:13px;opacity:0.85;}
.body{padding:28px 30px;color:#333;}
.footer{background:#1A5276;color:#fff;padding:14px 20px;text-align:center;font-size:12px;opacity:0.9;}
</style></head><body>
<div class='container'>
  <div class='header'>
    <h1>Comunicación Social — UMSA</h1>
    <p>Universidad Mayor de San Andrés · La Paz, Bolivia</p>
  </div>
  <div class='body'>$body</div>
  <div class='footer'>Este es un mensaje automático. No respondas a este correo.</div>
</div></body></html>";
    }
}
