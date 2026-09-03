<?php
declare(strict_types=1);
require __DIR__ . '/db.php';
global $config;

// Temporary, one-time setup page. Delete this file after creating the account.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: text/html; charset=utf-8');
    echo '<form method="post" style="max-width:420px;margin:40px auto;font:16px sans-serif">'
      . '<h2>Create portal admin</h2><input name="setup_key" placeholder="Setup key" required style="display:block;width:100%;margin:10px 0;padding:10px">'
      . '<input name="email" type="email" placeholder="Email" required style="display:block;width:100%;margin:10px 0;padding:10px">'
      . '<input name="full_name" placeholder="Full name" required style="display:block;width:100%;margin:10px 0;padding:10px">'
      . '<input name="password" type="password" placeholder="Password (12+ characters)" required style="display:block;width:100%;margin:10px 0;padding:10px">'
      . '<button style="padding:10px 16px">Create account</button></form>';
    exit;
}

if (!hash_equals((string)$config['setup_key'], (string)($_POST['setup_key'] ?? ''))) { http_response_code(403); exit('Invalid setup key'); }
$email = strtolower(trim((string)($_POST['email'] ?? '')));
$name = trim((string)($_POST['full_name'] ?? ''));
$password = (string)($_POST['password'] ?? '');
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $name === '' || strlen($password) < 12) { http_response_code(422); exit('Use a valid email, name, and password of at least 12 characters.'); }
$stmt = db()->prepare('INSERT INTO portal_users (email, full_name, password_hash, role, is_active) VALUES (?, ?, ?, \'admin\', 1) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), role = \'admin\', is_active = 1');
$stmt->execute([$email, $name, password_hash($password, PASSWORD_DEFAULT)]);
echo 'Admin created. Delete setup-admin.php immediately.';
