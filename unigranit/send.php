<?php
/**
 * UNIGRANIT OLJACA – Contact Form Handler (send.php)
 *
 * Handles form submissions, validates input, applies anti-spam
 * measures, and sends email to the company.
 *
 * Requires: PHP 7.4+, mail() function or SMTP (via PHPMailer)
 */

// ============================================================
// CONFIGURATION – Edit these values
// ============================================================
define('RECIPIENT_EMAIL',  'info@unigranit.ba');         // Email where messages are sent
define('RECIPIENT_NAME',   'Unigranit Oljaca');
define('SENDER_EMAIL',     'noreply@unigranit.ba');       // From address (use your domain)
define('EMAIL_SUBJECT',    'Nova poruka sa web stranice – Unigranit');
define('SITE_URL',         'https://unigranit.ba');
define('RATE_LIMIT_WINDOW', 3600);  // seconds (1 hour)
define('RATE_LIMIT_MAX',   5);      // max submissions per window per IP

// ============================================================
// SECURITY – Headers & CORS
// ============================================================
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Verify request comes from the same origin (CSRF basic protection)
$origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$allowed = [SITE_URL, 'http://localhost', 'http://127.0.0.1'];

// In production, uncomment strict origin check:
// if (!in_array(rtrim($origin, '/'), $allowed) && !str_starts_with($referer, SITE_URL)) {
//     http_response_code(403);
//     echo json_encode(['success' => false, 'message' => 'Forbidden']);
//     exit;
// }

// ============================================================
// RATE LIMITING – Simple file-based (use Redis/DB in production)
// ============================================================
function checkRateLimit(string $ip): bool {
    $tmpDir   = sys_get_temp_dir();
    $fileName = $tmpDir . '/unigranit_rl_' . md5($ip) . '.json';

    $data = ['count' => 0, 'window_start' => time()];

    if (file_exists($fileName)) {
        $stored = json_decode(file_get_contents($fileName), true);
        if ($stored && (time() - $stored['window_start']) < RATE_LIMIT_WINDOW) {
            $data = $stored;
        }
    }

    if ($data['count'] >= RATE_LIMIT_MAX) {
        return false; // rate limited
    }

    $data['count']++;
    file_put_contents($fileName, json_encode($data), LOCK_EX);
    return true;
}

$clientIp = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$clientIp = trim(explode(',', $clientIp)[0]); // Take first IP if multiple

if (!checkRateLimit($clientIp)) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Previše zahtjeva. Molimo pokušajte za sat vremena.']);
    exit;
}

// ============================================================
// HONEYPOT CHECK – Bots fill this hidden field
// ============================================================
if (!empty($_POST['website'])) {
    // Silently succeed to not reveal anti-spam to bots
    http_response_code(200);
    echo json_encode(['success' => true]);
    exit;
}

// ============================================================
// SANITIZE & VALIDATE INPUT
// ============================================================

/**
 * Sanitize a string: trim + strip tags + convert special chars
 */
function sanitize(string $input): string {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate email address
 */
function isValidEmail(string $email): bool {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate phone number (optional field)
 */
function isValidPhone(string $phone): bool {
    return preg_match('/^[\d\s\+\-\(\)]{6,20}$/', $phone) === 1;
}

$errors = [];

// Required: Name
$name = sanitize($_POST['name'] ?? '');
if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
    $errors['name'] = 'Ime mora imati između 2 i 100 znakova.';
}

// Required: Email
$email = sanitize($_POST['email'] ?? '');
if (!isValidEmail($email)) {
    $errors['email'] = 'Molimo unesite ispravnu email adresu.';
}

// Optional: Phone
$phone = sanitize($_POST['phone'] ?? '');
if (!empty($phone) && !isValidPhone($phone)) {
    $errors['phone'] = 'Unesite ispravan broj telefona.';
}

// Optional: Service
$service = sanitize($_POST['service'] ?? '');
$allowedServices = [
    '', 'nadgrobne', 'arhitektura', 'kuhinja', 'dekoracija', 'graviranje', 'kaminski', 'ostalo'
];
if (!in_array($service, $allowedServices, true)) {
    $service = 'ostalo';
}

// Required: Message
$message = sanitize($_POST['message'] ?? '');
if (mb_strlen($message) < 10 || mb_strlen($message) > 3000) {
    $errors['message'] = 'Poruka mora imati između 10 i 3000 znakova.';
}

// Return validation errors
if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Greška u validaciji.', 'errors' => $errors]);
    exit;
}

// ============================================================
// BUILD EMAIL CONTENT
// ============================================================
$serviceLabels = [
    'nadgrobne'   => 'Nadgrobne ploče',
    'arhitektura' => 'Arhitektonski kamen',
    'kuhinja'     => 'Kuhinjske/kupatilske ploče',
    'dekoracija'  => 'Dekorativna plastika',
    'graviranje'  => 'Graviranje i natpisi',
    'kaminski'    => 'Kaminska ognjišta',
    'ostalo'      => 'Ostalo',
    ''            => 'Nije navedeno',
];
$serviceLabel = $serviceLabels[$service] ?? 'Nije navedeno';
$timestamp    = date('d.m.Y u H:i');

// Plain text version
$plainText = <<<EOT
Nova poruka sa web stranice Unigranit Oljaca
============================================

Datum/vrijeme: {$timestamp}
IP adresa: {$clientIp}

KONTAKT PODACI:
---------------
Ime i prezime : {$name}
Email adresa  : {$email}
Telefon       : {$phone}
Vrsta usluge  : {$serviceLabel}

PORUKA:
-------
{$message}

---
Poruka poslana sa: https://unigranit.ba
EOT;

// HTML version
$htmlMessage = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));
$phoneDisplay = $phone ?: '<em>Nije uneseno</em>';

$htmlBody = <<<EOT
<!DOCTYPE html>
<html lang="bs">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nova poruka – Unigranit</title>
</head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:#1a1814;padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#c9aa71;font-family:Georgia,serif;font-size:22px;font-weight:400;letter-spacing:0.05em;">
        UNIGRANIT OLJACA
      </h1>
      <p style="margin:8px 0 0;color:#8a7e6e;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;">
        Nova poruka sa web stranice
      </p>
    </div>

    <!-- Body -->
    <div style="padding:36px 40px;">
      <h2 style="margin:0 0 24px;font-size:18px;color:#1a1814;font-weight:600;">Detalji upita</h2>

      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e0d8;color:#6b6360;font-size:13px;width:35%;vertical-align:top;text-transform:uppercase;letter-spacing:0.05em;">Datum i vrijeme</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e0d8;color:#1a1814;font-size:14px;">{$timestamp}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e0d8;color:#6b6360;font-size:13px;vertical-align:top;text-transform:uppercase;letter-spacing:0.05em;">Ime i prezime</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e0d8;color:#1a1814;font-size:14px;font-weight:600;">{$name}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e0d8;color:#6b6360;font-size:13px;vertical-align:top;text-transform:uppercase;letter-spacing:0.05em;">Email</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e0d8;color:#1a1814;font-size:14px;">
            <a href="mailto:{$email}" style="color:#c9aa71;text-decoration:none;">{$email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e0d8;color:#6b6360;font-size:13px;vertical-align:top;text-transform:uppercase;letter-spacing:0.05em;">Telefon</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e0d8;color:#1a1814;font-size:14px;">{$phoneDisplay}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e0d8;color:#6b6360;font-size:13px;vertical-align:top;text-transform:uppercase;letter-spacing:0.05em;">Vrsta usluge</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e0d8;color:#c9aa71;font-size:14px;font-weight:600;">{$serviceLabel}</td>
        </tr>
      </table>

      <h3 style="margin:0 0 12px;font-size:14px;color:#6b6360;text-transform:uppercase;letter-spacing:0.05em;">Poruka</h3>
      <div style="background:#f8f5f0;border-left:3px solid #c9aa71;padding:20px 24px;border-radius:4px;font-size:14px;line-height:1.7;color:#2a2520;">
        {$htmlMessage}
      </div>

      <!-- Reply button -->
      <div style="text-align:center;margin-top:32px;">
        <a href="mailto:{$email}?subject=Re: Upit sa unigranit.ba"
           style="display:inline-block;background:#c9aa71;color:#1a1814;padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.05em;">
          Odgovori klijentu
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f0ebe3;padding:20px 40px;text-align:center;border-top:1px solid #e5e0d8;">
      <p style="margin:0;font-size:12px;color:#8a7e6e;">
        Unigranit Oljaca · 25. maja, Orlovača, BiH · +387 65 510-486
      </p>
      <p style="margin:6px 0 0;font-size:11px;color:#b0a899;">
        Ova poruka je automatski generisana sa web stranice unigranit.ba
      </p>
    </div>
  </div>
</body>
</html>
EOT;

// ============================================================
// SEND EMAIL
// ============================================================

// Build headers
$boundary = md5(time());
$headers  = implode("\r\n", [
    "MIME-Version: 1.0",
    "Content-Type: multipart/alternative; boundary=\"{$boundary}\"",
    "From: =?UTF-8?B?" . base64_encode(RECIPIENT_NAME) . "?= <" . SENDER_EMAIL . ">",
    "Reply-To: {$name} <{$email}>",
    "X-Mailer: PHP/" . phpversion(),
    "X-Priority: 3",
]);

// Multipart body (plain + HTML)
$emailBody  = "--{$boundary}\r\n";
$emailBody .= "Content-Type: text/plain; charset=UTF-8\r\n";
$emailBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$emailBody .= $plainText . "\r\n\r\n";

$emailBody .= "--{$boundary}\r\n";
$emailBody .= "Content-Type: text/html; charset=UTF-8\r\n";
$emailBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$emailBody .= $htmlBody . "\r\n\r\n";

$emailBody .= "--{$boundary}--";

// Subject with UTF-8 encoding
$subject = "=?UTF-8?B?" . base64_encode(EMAIL_SUBJECT . " – {$name}") . "?=";

// Attempt to send
$sent = mail(RECIPIENT_EMAIL, $subject, $emailBody, $headers);

// ============================================================
// SEND AUTO-REPLY TO CLIENT
// ============================================================
if ($sent) {
    $autoReplySubject = "=?UTF-8?B?" . base64_encode("Potvrda prijema poruke – Unigranit Oljaca") . "?=";
    $autoReplyHeaders = implode("\r\n", [
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=UTF-8",
        "From: =?UTF-8?B?" . base64_encode(RECIPIENT_NAME) . "?= <" . SENDER_EMAIL . ">",
        "X-Mailer: PHP/" . phpversion(),
    ]);

    $autoReplyBody = <<<EOT
<!DOCTYPE html>
<html lang="bs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.1);">
    <div style="background:#1a1814;padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#c9aa71;font-family:Georgia,serif;font-size:22px;font-weight:400;">UNIGRANIT OLJACA</h1>
      <p style="margin:8px 0 0;color:#8a7e6e;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;">Potvrda prijema poruke</p>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#1a1814;font-size:16px;margin:0 0 16px;">Poštovani/a <strong>{$name}</strong>,</p>
      <p style="color:#5a524a;font-size:14px;line-height:1.7;margin:0 0 16px;">
        Hvala vam što ste nas kontaktirali. Vaša poruka je uspješno primljena i naš tim će vas kontaktirati
        u najkraćem mogućem roku, a najkasnije u roku od <strong>24 sata</strong>.
      </p>
      <p style="color:#5a524a;font-size:14px;line-height:1.7;margin:0 0 28px;">
        Ukoliko je vaš upit hitan, slobodno nas nazovite na broj
        <a href="tel:+38765510486" style="color:#c9aa71;text-decoration:none;font-weight:600;">+387 65 510-486</a>.
      </p>
      <div style="background:#f8f5f0;padding:20px 24px;border-radius:4px;border-left:3px solid #c9aa71;">
        <p style="margin:0;font-size:13px;color:#6b6360;text-transform:uppercase;letter-spacing:0.05em;">Vaša poruka:</p>
        <p style="margin:8px 0 0;font-size:14px;color:#2a2520;line-height:1.6;">{$htmlMessage}</p>
      </div>
    </div>
    <div style="background:#f0ebe3;padding:20px 40px;text-align:center;border-top:1px solid #e5e0d8;">
      <p style="margin:0;font-size:12px;color:#8a7e6e;">Unigranit Oljaca · 25. maja, Orlovača, BiH</p>
      <p style="margin:4px 0 0;font-size:12px;color:#8a7e6e;">+387 65 510-486 · info@unigranit.ba</p>
    </div>
  </div>
</body>
</html>
EOT;

    // Send auto-reply (don't fail if this fails)
    @mail($email, $autoReplySubject, $autoReplyBody, $autoReplyHeaders);
}

// ============================================================
// RESPONSE
// ============================================================
if ($sent) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Poruka je uspješno poslana! Kontaktiraćemo vas uskoro.'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Greška pri slanju poruke. Molimo pokušajte ponovo ili nas nazovite direktno.'
    ]);
}
exit;
