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

// 2. Load Environment Configuration
\App\Core\Env::load(dirname(__DIR__, 2) . '/.env');
\App\Core\Env::load(__DIR__ . '/../.env');

// 3. Load App Configuration
$appConfig = require __DIR__ . '/../config/app.php';

// 4. Centralized Exception & Error Handling
\App\Core\ExceptionHandler::register((bool) ($appConfig['debug'] ?? false));

// 5. Build Encapsulated Request
$request = \App\Core\Request::fromGlobals();

// 6. Initialize Router and Middleware Pipeline
$router = new \App\Core\Router();
$router->use(new \App\Middleware\RequestContextMiddleware());
$router->use(new \App\Middleware\CorsMiddleware($appConfig['cors'] ?? null));
$router->use(new \App\Middleware\JsonBodyParserMiddleware());

// 7. Load Route Definitions
require __DIR__ . '/../routes/api.php';

// 8. Dispatch Request
$router->dispatch($request);
