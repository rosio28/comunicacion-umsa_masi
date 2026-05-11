<?php

require_once __DIR__ . '/../config/config.php';

class Mailer
{
    public static function send(
        string $toEmail,
        string $toName,
        string $subject,
        string $htmlBody
    ): bool {

        $host = MAIL_HOST;
        $port = MAIL_PORT;
        $user = MAIL_USER;
        $pass = MAIL_PASS;

        try {

            /*
            IMPORTANTE:
            587 = TCP NORMAL
            luego STARTTLS
            */
            $socket = fsockopen(
                $host,
                $port,
                $errno,
                $errstr,
                20
            );

            if (!$socket) {
                throw new Exception(
                    "No se pudo conectar: $errstr ($errno)"
                );
            }

            self::read($socket, '220');

            self::cmd($socket, "EHLO localhost", '250');

            /*
            STARTTLS
            */
            self::cmd($socket, "STARTTLS", '220');

            $crypto = stream_socket_enable_crypto(
                $socket,
                true,
                STREAM_CRYPTO_METHOD_TLS_CLIENT
            );

            if (!$crypto) {
                throw new Exception(
                    "No se pudo activar TLS"
                );
            }

            self::cmd($socket, "EHLO localhost", '250');

            /*
            LOGIN
            */
            self::cmd($socket, "AUTH LOGIN", '334');

            self::cmd(
                $socket,
                base64_encode($user),
                '334'
            );

            self::cmd(
                $socket,
                base64_encode($pass),
                '235'
            );

            /*
            FROM
            */
            self::cmd(
                $socket,
                "MAIL FROM:<$user>",
                '250'
            );

            /*
            TO
            */
            self::cmd(
                $socket,
                "RCPT TO:<$toEmail>",
                '250'
            );

            /*
            DATA
            */
            self::cmd($socket, "DATA", '354');

            $headers = "";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-type:text/html;charset=UTF-8\r\n";
            $headers .= "From: " . MAIL_FROM_NAME . " <$user>\r\n";
            $headers .= "Reply-To: " . MAIL_REPLY_TO . "\r\n";

            $message  = "Subject: $subject\r\n";
            $message .= $headers . "\r\n";
            $message .= self::template($htmlBody);
            $message .= "\r\n.\r\n";

            fwrite($socket, $message);

            self::read($socket, '250');

            self::cmd($socket, "QUIT", '221');

            fclose($socket);

            error_log("[MAILER] CORREO ENVIADO");

            return true;

        } catch (Throwable $e) {

            error_log(
                "[MAILER ERROR] " .
                $e->getMessage()
            );

            return false;
        }
    }

    private static function cmd(
        $socket,
        string $cmd,
        string $expect
    ): void {

        fwrite($socket, $cmd . "\r\n");

        self::read($socket, $expect);
    }

    private static function read(
        $socket,
        string $expect
    ): void {

        $data = "";

        while ($str = fgets($socket, 515)) {

            $data .= $str;

            if (
                strlen($str) >= 4 &&
                $str[3] == ' '
            ) {
                break;
            }
        }

        $code = substr(trim($data), 0, 3);

        if ($code !== $expect) {

            throw new Exception(
                "SMTP esperaba $expect, recibió: $data"
            );
        }
    }

    private static function template(
        string $body
    ): string {

        return "
        <html>
        <body style='font-family:Arial;background:#f4f6f8;padding:20px;'>

            <div style='max-width:600px;background:white;margin:auto;border-radius:10px;padding:30px;'>

                <h2 style='color:#1A5276;'>
                    Comunicación Social UMSA
                </h2>

                $body

                <hr>

                <p style='font-size:12px;color:gray;'>
                    Correo automático del sistema CCS.
                </p>

            </div>

        </body>
        </html>
        ";
    }
}