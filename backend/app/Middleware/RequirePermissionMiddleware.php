<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;

class RequirePermissionMiddleware implements MiddlewareInterface
{
    private string $permission;

    public function __construct(string $permission)
    {
        $this->permission = $permission;
    }

    public function handle(Request $request, callable $next): void
    {
        $user = $request->getUser();

        if (!$user) {
            Response::unauthorized('Requiere autenticación previa.');
        }

        if (!$user->hasPermission($this->permission)) {
            Response::forbidden(
                "No tiene autorización para realizar esta acción (permiso requerido: '{$this->permission}').",
                'FORBIDDEN'
            );
        }

        $next($request);
    }
}

