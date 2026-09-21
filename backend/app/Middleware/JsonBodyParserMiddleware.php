<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;

class JsonBodyParserMiddleware implements MiddlewareInterface
{
    public function handle(Request $request, callable $next): void
    {
        $contentType = $request->getHeader('content-type') ?? '';

        if (str_contains(strtolower($contentType), 'application/json')) {
            $rawInput = file_get_contents('php://input');

            if ($rawInput !== false && trim($rawInput) !== '') {
                $decoded = json_decode($rawInput, true);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    Response::badRequest(
                        'Cuerpo JSON malformado o sintácticamente inválido: ' . json_last_error_msg(),
                        'INVALID_JSON'
                    );
                }

                if (is_array($decoded)) {
                    $request->setBody($decoded);
                }
            }
        }

        $next($request);
    }
}

