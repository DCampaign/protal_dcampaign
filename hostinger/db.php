<?php
declare(strict_types=1);
$config = require __DIR__ . '/config.php';
function db(): PDO {
    static $pdo = null; global $config;
    if ($pdo instanceof PDO) return $pdo;
    $pdo = new PDO(sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_name']), $config['db_user'], $config['db_pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    return $pdo;
}
