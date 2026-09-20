<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Response;

class HealthController
{
    /**
     * Public minimal health check endpoint.
     */
    public function check(): void
    {
        Response::json([
            'status' => 'healthy',
            'service' => 'lyberate-api',
            'version' => '1.0.0',
        ], 200, [
            'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
        ]);
    }
}

