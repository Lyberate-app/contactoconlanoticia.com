<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    protected $hierarchy = [
        'superadmin' => 50,
        'admin' => 40,
        'editor' => 30,
        'author' => 20,
        'viewer' => 10,
    ];

    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthorized');
        }

        $userRole = $user->role ?? 'viewer';
        $userLevel = $this->hierarchy[$userRole] ?? 0;

        $hasAccess = false;
        foreach ($roles as $role) {
            $requiredLevel = $this->hierarchy[$role] ?? 100;
            if ($userLevel >= $requiredLevel) {
                $hasAccess = true;
                break;
            }
        }

        if (!$hasAccess) {
            abort(403, 'Forbidden');
        }

        return $next($request);
    }
}
