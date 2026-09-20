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
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');

        $payload = [
            'success' => $statusCode >= 200 && $statusCode < 300,
            'data' => $data,
        ];

        if (!empty($meta)) {
            $payload['meta'] = $meta;
        }

        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Send a standardized JSON error response.
     */
    public static function error(string $message, string $code = 'ERROR', int $statusCode = 400, array $details = []): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');

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
        exit;
    }
}

