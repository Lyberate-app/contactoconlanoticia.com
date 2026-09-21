<?php

declare(strict_types=1);

namespace App\Core;

use ErrorException;
use Throwable;

class ExceptionHandler
{
    private static bool $debug = false;

    /**
     * Register global exception and error handlers.
     */
    public static function register(bool $debug = false): void
    {
        self::$debug = $debug;

        error_reporting(E_ALL);
        ini_set('display_errors', '0');

        set_error_handler([self::class, 'handleError']);
        set_exception_handler([self::class, 'handleException']);
    }

    /**
     * Convert PHP errors/warnings into ErrorException.
     */
    public static function handleError(int $severity, string $message, string $file, int $line): bool
    {
        if (!(error_reporting() & $severity)) {
            return false;
        }

        throw new ErrorException($message, 0, $severity, $file, $line);
    }

    /**
     * Handle uncaught exceptions and output standardized JSON.
     */
    public static function handleException(Throwable $e): void
    {
        $statusCode = 500;
        $code = 'INTERNAL_SERVER_ERROR';
        $message = 'Error interno del servidor.';

        $details = [];

        if (self::$debug) {
            $message = $e->getMessage();
            $details = [
                'type' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => explode("\n", $e->getTraceAsString()),
            ];
        }

        Response::error($message, $code, $statusCode, $details);
    }
}

