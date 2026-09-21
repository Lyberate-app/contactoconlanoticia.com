<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Database\Database;

class HealthController
{
    /**
     * Public health check endpoint with database ping.
     */
    public function check(Request $request): void
    {
        $dbConnected = Database::ping();

        $data = [
            'status' => $dbConnected ? 'healthy' : 'degraded',
            'service' => 'lyberate-api',
            'version' => '1.0.0',
            'database' => [
                'connected' => $dbConnected,
                'driver' => 'mysql',
            ],
        ];

        $meta = [
            'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
            'request_id' => $request->getRequestId(),
        ];

        Response::json($data, 200, $meta);
    }
}
