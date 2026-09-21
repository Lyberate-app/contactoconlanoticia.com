<?php

declare(strict_types=1);

namespace App\Core;

class Response
{
    /**
     * Send a standardized JSON success response.
     */
    public static function json(mixed $data = null, int $statusCode = 200, array $meta = []): void
    {
        if (!headers_sent()) {
            http_response_code($statusCode);
            header('Content-Type: application/json; charset=utf-8');
        }

        $payload = [
            'success' => $statusCode >= 200 && $statusCode < 300,
            'data' => $data,
        ];

        if (!empty($meta)) {
            $payload['meta'] = $meta;
        }

        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        if (!defined('APP_TESTING') || !APP_TESTING) {
            exit;
        }
    }

    /**
     * Semantic alias for JSON success response.
     */
    public static function success(mixed $data = null, int $statusCode = 200, array $meta = []): void
    {
        self::json($data, $statusCode, $meta);
    }

    /**
     * Send a standardized paginated JSON response.
     */
    public static function paginated(mixed $items, array $pagination, array $extraMeta = []): void
    {
        $meta = array_merge(['pagination' => $pagination], $extraMeta);
        self::json($items, 200, $meta);
    }

    /**
     * Send an XML response (sitemaps, RSS feeds).
     */
    public static function xml(string $xmlContent, int $statusCode = 200): void
    {
        if (!headers_sent()) {
            http_response_code($statusCode);
            header('Content-Type: application/xml; charset=utf-8');
        }

        echo $xmlContent;

        if (!defined('APP_TESTING') || !APP_TESTING) {
            exit;
        }
    }

    /**
     * Send a plain text response (robots.txt).
     */
    public static function text(string $textContent, int $statusCode = 200, string $contentType = 'text/plain; charset=utf-8'): void
    {
        if (!headers_sent()) {
            http_response_code($statusCode);
            header('Content-Type: ' . $contentType);
        }

        echo $textContent;

        if (!defined('APP_TESTING') || !APP_TESTING) {
            exit;
        }
    }

    /**
     * Send a redirect response.
     */
    public static function redirect(string $url, int $statusCode = 302): void
    {
        if (!headers_sent()) {
            http_response_code($statusCode);
            header('Location: ' . $url, true, $statusCode);
        }

        if (!defined('APP_TESTING') || !APP_TESTING) {
            exit;
        }
    }

    /**
     * Send a standardized JSON error response.
     */
    public static function error(string $message, string $code = 'ERROR', int $statusCode = 400, array $details = []): void
    {
        if (!headers_sent()) {
            http_response_code($statusCode);
            header('Content-Type: application/json; charset=utf-8');
        }

        $payload = [
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
        ];

        if (!empty($details)) {
            $payload['error']['details'] = $details;
        }

        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        if (!defined('APP_TESTING') || !APP_TESTING) {
            exit;
        }
    }

    /**
     * 400 Bad Request error.
     */
    public static function badRequest(string $message = 'Solicitud inválida.', string $code = 'BAD_REQUEST', array $details = []): void
    {
        self::error($message, $code, 400, $details);
    }

    /**
     * 401 Unauthorized error.
     */
    public static function unauthorized(string $message = 'No autenticado.', string $code = 'UNAUTHORIZED'): void
    {
        self::error($message, $code, 401);
    }

    /**
     * 403 Forbidden error.
     */
    public static function forbidden(string $message = 'Acceso denegado.', string $code = 'FORBIDDEN'): void
    {
        self::error($message, $code, 403);
    }

    /**
     * 404 Not Found error.
     */
    public static function notFound(string $message = 'Recurso o endpoint no encontrado.', string $code = 'NOT_FOUND'): void
    {
        self::error($message, $code, 404);
    }

    /**
     * 405 Method Not Allowed error.
     */
    public static function methodNotAllowed(string $message = 'Método HTTP no permitido para este endpoint.', string $code = 'METHOD_NOT_ALLOWED'): void
    {
        self::error($message, $code, 405);
    }

    /**
     * 422 Validation Error.
     */
    public static function validationError(array $errors, string $message = 'Los datos proporcionados no son válidos.'): void
    {
        self::error($message, 'VALIDATION_ERROR', 422, $errors);
    }

    /**
     * 500 Internal Server Error.
     */
    public static function internalError(string $message = 'Error interno del servidor.', string $code = 'INTERNAL_SERVER_ERROR'): void
    {
        self::error($message, $code, 500);
    }
}
