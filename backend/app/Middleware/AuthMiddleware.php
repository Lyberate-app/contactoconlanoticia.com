<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;
use App\Services\AuthService;

class AuthMiddleware implements MiddlewareInterface
{
    public function handle(Request $request, callable $next): void
    {
        // 1. Extract session token from HttpOnly cookie or Authorization Bearer header
        $token = $_COOKIE[AuthService::COOKIE_NAME] ?? null;

        if (!$token) {
            $authHeader = $request->getHeader('authorization');
            if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
                $token = trim(substr($authHeader, 7));
            }
        }

        if (!$token || strlen($token) !== 64) {
            Response::unauthorized('Sesión no encontrada o token inválido.');
            return;
        }

        // 2. Validate session against database
        $user = AuthService::validateSession($token);

        if (!$user) {
            Response::unauthorized('Sesión expirada, revocada o inválida.');
            return;
        }

        // 3. Inject authenticated context into Request
        $request->setUser($user);

        $next($request);
    }
}

