<?php

declare(strict_types=1);

use App\Core\Env;

return [
    'driver' => 'mysql',
    'host' => (string) Env::get('DB_HOST', '127.0.0.1'),
    'port' => (int) Env::get('DB_PORT', 3306),
    'database' => (string) Env::get('DB_DATABASE', 'lyberate_db'),
    'username' => (string) Env::get('DB_USERNAME', 'lyberate_user'),
    'password' => (string) Env::get('DB_PASSWORD', ''),
    'charset' => (string) Env::get('DB_CHARSET', 'utf8mb4'),
    'collation' => (string) Env::get('DB_COLLATION', 'utf8mb4_unicode_ci'),
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ],
];
