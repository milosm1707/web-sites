<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/phpmailer/PHPMailer.php';
require __DIR__ . '/phpmailer/SMTP.php';
require __DIR__ . '/phpmailer/Exception.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Metoda nije dozvoljena.'
    ]);
    exit;
}

function clean($v) {
    return htmlspecialchars(trim($v));
}

$vorname  = clean($_POST['vorname']  ?? '');
$nachname = clean($_POST['nachname'] ?? '');
$email    = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
$nachricht = clean($_POST['nachricht'] ?? '');

if (!$vorname || !$nachname || !$email || !$nachricht) {
    echo json_encode([
        'success' => false,
        'message' => 'Bitte alle Felder ausfüllen.'
    ]);
    exit;
}

/* ====== EMAIL CONTENT ====== */

$subject = "Neue Kontaktanfrage von $vorname $nachname";

$body = "
Neue Nachricht über das Kontaktformular auf spitexpflegeaufraedern.ch
══════════════════════════════════════════

Name:      $vorname $nachname
E-Mail:    $email

Nachricht:
──────────────────────────────────────────
$nachricht
──────────────────────────────────────────

Diese Nachricht wurde automatisch über das Kontaktformular gesendet.
";

/* ====== PHPMailer ====== */

$mail = new PHPMailer(true);

try {

    $mail->isSMTP();
    $mail->Host       = 'smtp.hostinger.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'info@spitexpflegeaufraedern.ch';
    $mail->Password   = 'Sifrasifra1*';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = 465;
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom('info@spitexpflegeaufraedern.ch', 'Spitex PflegeAufRädern');
    $mail->addAddress('info@spitexpflegeaufraedern.ch');
    $mail->addReplyTo($email, $vorname . ' ' . $nachname);

    $mail->Subject = $subject;
    $mail->Body    = $body;

    $mail->send();

    echo json_encode([
        'success' => true
    ]);

} catch (Exception $e) {

    echo json_encode([
        'success' => false,
        'message' => 'Fehler beim Senden. Bitte versuchen Sie es später erneut.'
    ]);

}