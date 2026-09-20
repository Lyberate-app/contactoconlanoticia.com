<?php

declare(strict_types=1);

return [
    'name' => getenv('APP_NAME') ?: 'Lyberate',
    'env' => getenv('APP_ENV') ?: 'development',
    'debug' => filter_var(getenv('APP_DEBUG') ?: true, FILTER_VALIDATE_BOOLEAN),
    'url' => getenv('APP_URL') ?: 'http://localhost:8000',
    'timezone' => 'UTC',
    'api_prefix' => '/api/v1',
    'cors' => [
        'allowed_origins' => explode(',', getenv('CORS_ALLOWED_ORIGINS') ?: 'http://localhost:5173,http://localhost:8000'),
        'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
        'allow_credentials' => true,
    ],
];

