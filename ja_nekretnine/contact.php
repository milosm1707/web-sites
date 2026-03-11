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

$name = clean($_POST['name'] ?? '');
$email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
$phone = clean($_POST['phone'] ?? '');
$message = clean($_POST['message'] ?? '');

if (!$name || !$email || !$message) {
    echo json_encode([
        'success' => false,
        'message' => 'Molimo popunite sva obavezna polja.'
    ]);
    exit;
}

/* ====== EMAIL CONTENT ====== */

$subject = "Nova poruka sa sajta – JA Nekretnine";

$body = "
Ime: $name
Email: $email
Telefon: $phone

Poruka:
$message
";

/* ====== PHPMailer ====== */

$mail = new PHPMailer(true);

try {

    $mail->isSMTP();
    $mail->Host       = 'smtp.hostinger.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'info@janekretnine.com';
    $mail->Password   = 'Sifrasifra1*';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = 465;

    $mail->setFrom('info@janekretnine.com', 'JA Nekretnine');
    $mail->addAddress('info@janekretnine.com');

    $mail->addReplyTo($email, $name);

    $mail->Subject = $subject;
    $mail->Body    = $body;

    $mail->send();

    echo json_encode([
        'success' => true
    ]);

} catch (Exception $e) {

    echo json_encode([
        'success' => false,
        'message' => 'Greška pri slanju poruke.'
    ]);

}