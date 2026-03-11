<?php
/**
 * contact.php – Molersko Gipsarski Radovi
 * Handles form submission and sends email notification.
 *
 * ⚠️  SETUP: Change $recipientEmail to your actual email address.
 */

// ---- Configuration ----
$recipientEmail = 'milosm1707@gmail.com'; // <-- PROMENITE u vašu email adresu
$siteFrom       = 'noreply@molerski-radovi-novisad.rs';
$siteName       = 'Molersko Gipsarski Radovi';

// ---- Only POST requests ----
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metoda nije dozvoljena.']);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// ---- Sanitize input ----
function clean(string $input): string {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

$name    = clean($_POST['name']    ?? '');
$phone   = clean($_POST['phone']   ?? '');
$message = clean($_POST['message'] ?? '');

// ---- Validate ----
$errors = [];
if (empty($name))    $errors[] = 'Ime je obavezno.';
if (empty($phone))   $errors[] = 'Telefon je obavezan.';
if (empty($message)) $errors[] = 'Poruka je obavezna.';

// Basic phone format check
if (!empty($phone) && !preg_match('/^[\d\s\+\-\(\)]{6,20}$/', $phone)) {
    $errors[] = 'Unesite ispravan broj telefona.';
}

if (!empty($errors)) {
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// ---- Build email ----
$subject = '=?UTF-8?B?' . base64_encode('Nova poruka sa sajta – Molerski radovi') . '?=';

$body  = "Nova poruka sa web sajta\n";
$body .= str_repeat('=', 40) . "\n\n";
$body .= "Ime:      {$name}\n";
$body .= "Telefon:  {$phone}\n\n";
$body .= "Poruka:\n{$message}\n\n";
$body .= str_repeat('-', 40) . "\n";
$body .= "Poslato: " . date('d.m.Y H:i') . "\n";
$body .= "Sajt: {$siteName}\n";

$headers  = "From: {$siteName} <{$siteFrom}>\r\n";
$headers .= "Reply-To: {$name} <noreply@sajt.rs>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "Content-Transfer-Encoding: base64\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

// ---- Send ----
$sent = mail($recipientEmail, $subject, base64_encode($body), $headers);

if ($sent) {
    echo json_encode([
        'success' => true,
        'message' => 'Poruka je uspešno poslata. Kontaktiraćemo vas uskoro!'
    ]);
} else {
    // Log error server-side
    error_log("[contact.php] mail() failed for: {$name} / {$phone}");
    echo json_encode([
        'success' => false,
        'message' => 'Greška pri slanju emaila. Pozovite nas direktno na 060 5335800.'
    ]);
}