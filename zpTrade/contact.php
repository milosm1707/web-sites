<?php
/**
 * ZP Trade – Contact Form Handler
 * contact.php
 *
 * Receives POST data, sanitizes, validates, and sends email.
 * Returns JSON response.
 */

header('Content-Type: application/json; charset=UTF-8');

// ── Configuration ──────────────────────────────────────────
define('RECIPIENT_EMAIL', 'info@zptrade.ba');
define('RECIPIENT_NAME',  'ZP Trade');
define('SITE_NAME',       'ZP Trade');
define('MAX_MESSAGE_LEN', 5000);

// ── Only accept POST ────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// ── Sanitize helper ─────────────────────────────────────────
function sanitize(string $value): string {
    return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
}

// ── Collect & sanitize input ────────────────────────────────
$name    = sanitize($_POST['name']    ?? '');
$email   = sanitize($_POST['email']   ?? '');
$phone   = sanitize($_POST['phone']   ?? '');
$subject = sanitize($_POST['subject'] ?? 'Opće informacije');
$message = sanitize($_POST['message'] ?? '');

// ── Server-side validation ───────────────────────────────────
$errors = [];

if (mb_strlen($name) < 2) {
    $errors[] = 'Ime mora imati najmanje 2 znaka.';
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Email adresa nije ispravna.';
}

if (mb_strlen($message) < 10) {
    $errors[] = 'Poruka mora imati najmanje 10 znakova.';
}

if (mb_strlen($message) > MAX_MESSAGE_LEN) {
    $errors[] = 'Poruka je predugačka (max. ' . MAX_MESSAGE_LEN . ' znakova).';
}

// Basic spam honeypot (add a hidden field "website" to the HTML form that bots fill)
if (!empty($_POST['website'])) {
    // Silently succeed to fool bots
    echo json_encode(['success' => true, 'message' => 'Poruka je poslana.']);
    exit;
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// ── Build email ──────────────────────────────────────────────
$emailSubject = "[{$_SERVER['HTTP_HOST']}] Novi upit: {$subject}";

$emailBody = <<<EOT
Novi upit s kontakt forme – {$_SERVER['HTTP_HOST']}
=======================================================

IME:     {$name}
EMAIL:   {$email}
TELEFON: {$phone}
PREDMET: {$subject}

PORUKA:
-------
{$message}

-------------------------------------------------------
Datum: {$_SERVER['REQUEST_TIME']}
IP: {$_SERVER['REMOTE_ADDR']}
EOT;

$headers  = "From: {$name} <{$email}>\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "X-Mailer: PHP/" . PHP_VERSION . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// ── Send ─────────────────────────────────────────────────────
$sent = mail(
    RECIPIENT_EMAIL,
    $emailSubject,
    $emailBody,
    $headers
);

if ($sent) {
    // Auto-reply to sender
    $autoReplySubject = "Potvrda upita – " . SITE_NAME;
    $autoReplyBody    = <<<EOT
Poštovani/a {$name},

Hvala vam na upitu. Primili smo vašu poruku i odgovorit ćemo u najkraćem mogućem roku (obično unutar 24 sata radnim danom).

Vaša poruka:
-----------
{$message}

--
ZP Trade d.o.o.
Ul. Poljoprivredna 12, 71000 Sarajevo
Tel: +387 33 123 456
Email: info@zptrade.ba
EOT;

    $autoHeaders  = "From: " . SITE_NAME . " <" . RECIPIENT_EMAIL . ">\r\n";
    $autoHeaders .= "MIME-Version: 1.0\r\n";
    $autoHeaders .= "Content-Type: text/plain; charset=UTF-8\r\n";

    mail($email, $autoReplySubject, $autoReplyBody, $autoHeaders);

    echo json_encode(['success' => true, 'message' => 'Poruka je uspješno poslana!']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Greška pri slanju. Molimo pokušajte ponovo.']);
}