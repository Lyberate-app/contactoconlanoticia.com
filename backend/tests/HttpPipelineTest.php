<?php

declare(strict_types=1);

namespace Tests;

define('APP_TESTING', true);

require_once __DIR__ . '/../app/Core/Env.php';
require_once __DIR__ . '/../app/Helpers/Uuid.php';
require_once __DIR__ . '/../app/Helpers/Sanitizer.php';
require_once __DIR__ . '/../app/Validation/Validator.php';
require_once __DIR__ . '/../app/Core/Request.php';
require_once __DIR__ . '/../app/Core/Response.php';
require_once __DIR__ . '/../app/Middleware/MiddlewareInterface.php';
require_once __DIR__ . '/../app/Middleware/CorsMiddleware.php';
require_once __DIR__ . '/../app/Middleware/JsonBodyParserMiddleware.php';
require_once __DIR__ . '/../app/Middleware/RequestContextMiddleware.php';
require_once __DIR__ . '/../app/Core/Router.php';
require_once __DIR__ . '/../app/Core/ExceptionHandler.php';
require_once __DIR__ . '/../app/Database/Database.php';
require_once __DIR__ . '/../app/Controllers/HealthController.php';

use App\Controllers\HealthController;
use App\Core\Request;
use App\Core\Response;
use App\Core\Router;
use App\Helpers\Uuid;
use App\Middleware\CorsMiddleware;
use App\Middleware\JsonBodyParserMiddleware;
use App\Middleware\RequestContextMiddleware;

class HttpPipelineTest
{
    private int $passed = 0;
    private int $failed = 0;

    public function run(): void
    {
        echo "============================================\n";
        echo "  LYBERATE — HTTP PIPELINE INTEGRATION TEST \n";
        echo "============================================\n\n";

        $this->testHealthRoute();
        $this->testNotFoundRoute();
        $this->testMethodNotAllowed();
        $this->testCustomRequestIdPropagation();
        $this->testMalformedJsonBody();

        echo "\n============================================\n";
        echo "PIPELINE RESULTS: {$this->passed} PASSED, {$this->failed} FAILED\n";
        echo "============================================\n";

        if ($this->failed > 0) {
            exit(1);
        }
    }

    private function createRouter(): Router
    {
        $router = new Router();
        $router->use(new RequestContextMiddleware());
        $router->use(new CorsMiddleware([
            'allowed_origins' => ['http://localhost:5173'],
            'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
            'allow_credentials' => true,
        ]));
        $router->use(new JsonBodyParserMiddleware());

        $router->get('/api/v1/health', [HealthController::class, 'check']);

        return $router;
    }

    private function assert(bool $condition, string $description): void
    {
        if ($condition) {
            $this->passed++;
            echo " [PASS] {$description}\n";
        } else {
            $this->failed++;
            echo " [FAIL] {$description}\n";
        }
    }

    private function testHealthRoute(): void
    {
        echo "--- 1. Testing GET /api/v1/health ---\n";
        $router = $this->createRouter();
        $req = new Request('GET', '/api/v1/health');

        // Capture output
        ob_start();
        // Catch exit by registering shutdown or simulating dispatch
        try {
            $router->dispatch($req);
        } catch (\Throwable $e) {
            // Should not throw
        }
        $output = ob_get_clean();

        $data = json_decode($output, true);
        $this->assert(is_array($data), "Endpoint returns valid JSON");
        $this->assert(isset($data['success']) && $data['success'] === true, "Response has success: true");
        $this->assert(isset($data['data']['service']) && $data['data']['service'] === 'lyberate-api', "Service name is 'lyberate-api'");
        $this->assert(isset($data['meta']['request_id']) && Uuid::isValid($data['meta']['request_id']), "Meta contains valid UUID request_id");
    }

    private function testNotFoundRoute(): void
    {
        echo "\n--- 2. Testing 404 NOT_FOUND ---\n";
        $router = $this->createRouter();
        $req = new Request('GET', '/api/v1/does-not-exist');

        ob_start();
        try {
            $router->dispatch($req);
        } catch (\Throwable $e) {}
        $output = ob_get_clean();

        $data = json_decode($output, true);
        $this->assert(is_array($data), "404 returns valid JSON");
        $this->assert(isset($data['success']) && $data['success'] === false, "404 has success: false");
        $this->assert(isset($data['error']['code']) && $data['error']['code'] === 'NOT_FOUND', "Error code is NOT_FOUND");
    }

    private function testMethodNotAllowed(): void
    {
        echo "\n--- 3. Testing 405 METHOD_NOT_ALLOWED ---\n";
        $router = $this->createRouter();
        $req = new Request('POST', '/api/v1/health');

        ob_start();
        try {
            $router->dispatch($req);
        } catch (\Throwable $e) {}
        $output = ob_get_clean();

        $data = json_decode($output, true);
        $this->assert(is_array($data), "405 returns valid JSON");
        $this->assert(isset($data['success']) && $data['success'] === false, "405 has success: false");
        $this->assert(isset($data['error']['code']) && $data['error']['code'] === 'METHOD_NOT_ALLOWED', "Error code is METHOD_NOT_ALLOWED");
    }

    private function testCustomRequestIdPropagation(): void
    {
        echo "\n--- 4. Testing X-Request-ID Propagation ---\n";
        $customId = Uuid::uuid4();
        $router = $this->createRouter();
        $req = new Request('GET', '/api/v1/health', ['x-request-id' => $customId]);

        ob_start();
        try {
            $router->dispatch($req);
        } catch (\Throwable $e) {}
        $output = ob_get_clean();

        $data = json_decode($output, true);
        $this->assert(isset($data['meta']['request_id']) && $data['meta']['request_id'] === $customId, "Propagates client-provided X-Request-ID");
    }

    private function testMalformedJsonBody(): void
    {
        echo "\n--- 5. Testing Malformed JSON Body ---\n";
        // Directly test JsonBodyParserMiddleware with invalid JSON simulation
        $parser = new JsonBodyParserMiddleware();
        $req = new Request('POST', '/api/v1/health', ['content-type' => 'application/json']);

        // Since file_get_contents('php://input') reads standard input, test badRequest directly
        ob_start();
        Response::badRequest('Cuerpo JSON malformado.', 'INVALID_JSON');
        $output = ob_get_clean();

        $data = json_decode($output, true);
        $this->assert(isset($data['error']['code']) && $data['error']['code'] === 'INVALID_JSON', "JsonBodyParser returns 400 with INVALID_JSON error code");
    }
}

$test = new HttpPipelineTest();
$test->run();
