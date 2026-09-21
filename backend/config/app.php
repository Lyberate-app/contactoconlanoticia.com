<?php

declare(strict_types=1);

use App\Core\Env;

return [
    'name' => Env::get('APP_NAME', 'Lyberate'),
    'env' => Env::get('APP_ENV', 'development'),
    'debug' => (bool) Env::get('APP_DEBUG', true),
    'url' => Env::get('APP_URL', 'http://localhost:8000'),
    'timezone' => 'UTC',
    'api_prefix' => '/api/v1',
    'cors' => [
        'allowed_origins' => explode(',', (string) Env::get('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:8000')),
        'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-ID', 'X-Site-ID', 'X-Request-ID'],
        'allow_credentials' => true,
    ],
];
