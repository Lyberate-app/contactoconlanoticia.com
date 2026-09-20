<?php

declare(strict_types=1);

use App\Controllers\HealthController;
use App\Core\Router;

/**
 * Register API routes.
 *
 * @var Router $router
 */
$router->get('/api/v1/health', [HealthController::class, 'check']);

