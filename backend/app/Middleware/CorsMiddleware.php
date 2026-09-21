<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Request;

class CorsMiddleware implements MiddlewareInterface
{
    private array $allowedOrigins;
    private array $allowedMethods;
    private array $allowedHeaders;
    private bool $allowCredentials;

    public function __construct(?array $corsConfig = null)
    {
        $config = $corsConfig ?? (require __DIR__ . '/../../config/app.php')['cors'] ?? [];
        $this->allowedOrigins = $config['allowed_origins'] ?? ['*'];
        $this->allowedMethods = $config['allowed_methods'] ?? ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
        $this->allowedHeaders = $config['allowed_headers'] ?? ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-ID', 'X-Site-ID'];
        $this->allowCredentials = $config['allow_credentials'] ?? true;
    }

    public function handle(Request $request, callable $next): void
    {
        $origin = $request->getHeader('origin') ?? '';

        if (!headers_sent()) {
            if (in_array('*', $this->allowedOrigins, true)) {
                header('Access-Control-Allow-Origin: *');
            } elseif (in_array($origin, $this->allowedOrigins, true)) {
                header("Access-Control-Allow-Origin: {$origin}");
                if ($this->allowCredentials) {
                    header('Access-Control-Allow-Credentials: true');
                }
            }

            header('Access-Control-Allow-Methods: ' . implode(', ', $this->allowedMethods));
            header('Access-Control-Allow-Headers: ' . implode(', ', $this->allowedHeaders));
        }

        // Preflight OPTIONS requests terminate immediately with 204
        if ($request->getMethod() === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        $next($request);
    }
}
