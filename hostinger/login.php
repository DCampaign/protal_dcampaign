<?php
declare(strict_types=1);
require __DIR__ . '/db.php'; global $config;
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . $config['allowed_origin']);
header('Access-Control-Allow-Credentials: true'); header('Vary: Origin');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }
$body = json_decode(file_get_contents('php://input'), true);
$email = strtolower(trim((string)($body['email'] ?? ''))); $password = (string)($body['password'] ?? '');
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') { http_response_code(422); echo json_encode(['error' => 'Enter a valid email and password']); exit; }
$stmt = db()->prepare('SELECT id, email, full_name, role, password_hash, is_active FROM portal_users WHERE email = ? LIMIT 1');
$stmt->execute([$email]); $user = $stmt->fetch();
if (!$user || !(bool)$user['is_active'] || !password_verify($password, $user['password_hash'])) { http_response_code(401); echo json_encode(['error' => 'The email address or password is incorrect.']); exit; }
session_set_cookie_params(['httponly' => true, 'secure' => true, 'samesite' => 'Lax', 'path' => '/']); session_start(); session_regenerate_id(true);
$_SESSION['portal_user_id'] = (int)$user['id']; unset($user['password_hash']); echo json_encode(['user' => $user]);
