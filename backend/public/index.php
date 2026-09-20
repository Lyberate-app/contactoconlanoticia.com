<?php

declare(strict_types=1);

/**
 * LYBERATE — REST API ENTRY POINT
 * Prefix: /api/v1/
 */

// 1. PSR-4 Class Autoloader for native modular PHP
spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/../app/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

// 2. Global Exception and Error Handling
set_exception_handler(function (Throwable $e): void {
    \App\Core\Response::error(
        'Error interno del servidor.',
        'INTERNAL_SERVER_ERROR',
        500
    );
});

// 3. Load Application Configuration
$appConfig = require __DIR__ . '/../config/app.php';

// 4. CORS Headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $appConfig['cors']['allowed_origins'], true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: ' . implode(', ', $appConfig['cors']['allowed_methods']));
    header('Access-Control-Allow-Headers: ' . implode(', ', $appConfig['cors']['allowed_headers']));
}

// Handle preflight OPTIONS request
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 5. Initialize Router and Load Routes
$router = new \App\Core\Router();
require __DIR__ . '/../routes/api.php';

// 6. Dispatch Request
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = $_SERVER['REQUEST_URI'] ?? '/';

$router->dispatch($method, $uri);

