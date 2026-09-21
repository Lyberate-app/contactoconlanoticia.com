<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Request;

interface MiddlewareInterface
{
    /**
     * Handle the incoming request.
     *
     * @param Request $request
     * @param callable(Request): void $next
     */
    public function handle(Request $request, callable $next): void;
}

