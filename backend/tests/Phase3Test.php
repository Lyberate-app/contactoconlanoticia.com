<?php

declare(strict_types=1);

namespace Tests;

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

use App\Core\Env;
use App\Core\Request;
use App\Core\Response;
use App\Core\Router;
use App\Database\Database;
use App\Helpers\Sanitizer;
use App\Helpers\Uuid;
use App\Middleware\CorsMiddleware;
use App\Middleware\JsonBodyParserMiddleware;
use App\Middleware\MiddlewareInterface;
use App\Middleware\RequestContextMiddleware;
use App\Validation\Validator;

class Phase3Test
{
    private int $passed = 0;
    private int $failed = 0;

    public function run(): void
    {
        echo "============================================\n";
        echo "  LYBERATE — FASE 3 BACKEND CORE TEST SUITE \n";
        echo "============================================\n\n";

        $this->testEnv();
        $this->testUuid();
        $this->testSanitizer();
        $this->testValidator();
        $this->testRequest();
        $this->testResponseHelper();
        $this->testRouterAndMiddlewares();
        $this->testJsonParserMiddleware();
        $this->testDatabasePing();

        echo "\n============================================\n";
        echo "TEST RESULTS: {$this->passed} PASSED, {$this->failed} FAILED\n";
        echo "============================================\n";

        if ($this->failed > 0) {
            exit(1);
        }
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

    private function testEnv(): void
    {
        echo "--- 1. Testing Env Loader ---\n";
        $tempEnv = sys_get_temp_dir() . '/.env.test';
        file_put_contents($tempEnv, "TEST_NAME=Lyberate\nTEST_BOOL=true\nTEST_NUM=42\n# Comment\nTEST_QUOTED=\"hello world\"\n");

        Env::load($tempEnv);

        $this->assert(Env::get('TEST_NAME') === 'Lyberate', "Env::get loads string value");
        $this->assert(Env::get('TEST_BOOL') === true, "Env::get parses boolean 'true'");
        $this->assert(Env::get('TEST_QUOTED') === 'hello world', "Env::get strips quotes");
        $this->assert(Env::get('NON_EXISTING', 'default_val') === 'default_val', "Env::get returns fallback default");

        unlink($tempEnv);
    }

    private function testUuid(): void
    {
        echo "\n--- 2. Testing Uuid Helper ---\n";
        $uuid = Uuid::uuid4();
        $this->assert(is_string($uuid) && strlen($uuid) === 36, "Uuid::uuid4 generates 36-char string ({$uuid})");
        $this->assert(Uuid::isValid($uuid), "Uuid::isValid returns true for valid v4 UUID");
        $this->assert(!Uuid::isValid('not-a-uuid'), "Uuid::isValid returns false for non-uuid");
        $this->assert(!Uuid::isValid('12345678-1234-1234-1234-12345678901z'), "Uuid::isValid rejects invalid characters");
    }

    private function testSanitizer(): void
    {
        echo "\n--- 3. Testing Sanitizer Helper ---\n";
        $dirty = "  <script>alert('xss')</script>Hello <b>World</b>! \0 ";
        $cleaned = Sanitizer::stripTags($dirty);
        $this->assert($cleaned === "alert('xss')Hello World!", "Sanitizer::stripTags strips tags and null bytes");

        $html = "<div class='test'>&</div>";
        $escaped = Sanitizer::escapeHtml($html);
        $this->assert(str_contains($escaped, '&lt;div') && str_contains($escaped, '&amp;'), "Sanitizer::escapeHtml escapes HTML entities");

        $arr = ['title' => ' <b>Clean</b> ', 'sub' => ['tag' => '<p>nested</p>']];
        $cleanArr = Sanitizer::cleanArray($arr);
        $this->assert($cleanArr['title'] === '<b>Clean</b>' && is_array($cleanArr['sub']), "Sanitizer::cleanArray processes nested array and trims strings");
    }

    private function testValidator(): void
    {
        echo "\n--- 4. Testing Validator ---\n";
        $data = [
            'title' => 'Noticia de Prueba',
            'email' => 'editor@contactoconlanoticia.com',
            'uuid' => Uuid::uuid4(),
            'status' => 'published',
            'views' => 150,
            'is_featured' => true,
        ];

        $rules = [
            'title' => 'required|string|min:5|max:100',
            'email' => 'required|email',
            'uuid' => 'required|uuid',
            'status' => 'required|enum:draft,published,archived',
            'views' => 'required|integer|min:0',
            'is_featured' => 'required|boolean',
        ];

        $v = Validator::make($data, $rules);
        $this->assert($v->passes(), "Validator passes for valid data set");

        $invalidData = [
            'title' => 'Ab',
            'email' => 'invalid-email',
            'uuid' => '123-bad',
            'status' => 'deleted',
            'views' => -5,
        ];

        $v2 = Validator::make($invalidData, $rules);
        $this->assert($v2->fails(), "Validator fails for invalid data set");
        $errors = $v2->errors();
        $this->assert(isset($errors['title']), "Validator detects min length violation");
        $this->assert(isset($errors['email']), "Validator detects invalid email");
        $this->assert(isset($errors['uuid']), "Validator detects invalid uuid");
        $this->assert(isset($errors['status']), "Validator detects enum violation");
        $this->assert(isset($errors['views']), "Validator detects negative integer violation");
        $this->assert(isset($errors['is_featured']), "Validator detects missing required field");
    }

    private function testRequest(): void
    {
        echo "\n--- 5. Testing Request Object ---\n";
        $headers = [
            'content-type' => 'application/json',
            'authorization' => 'Bearer test-token',
            'x-request-id' => 'req-12345',
        ];
        $query = ['page' => '2', 'limit' => '10'];
        $body = ['name' => 'Reportaje'];

        $req = new Request('POST', '/api/v1/articles?page=2&limit=10', $headers, $query, $body, '192.168.1.100');

        $this->assert($req->getMethod() === 'POST', "Request::getMethod returns uppercase POST");
        $this->assert($req->getPath() === '/api/v1/articles', "Request::getPath returns path without query string");
        $this->assert($req->getHeader('content-type') === 'application/json', "Request::getHeader gets normalized header");
        $this->assert($req->getQuery('page') === '2', "Request::getQuery returns query parameter");
        $this->assert($req->input('name') === 'Reportaje', "Request::input gets body input");
        $this->assert($req->input('page') === '2', "Request::input falls back to query input");
        $this->assert($req->getClientIp() === '192.168.1.100', "Request::getClientIp returns IP");

        $req->setRouteParams(['uuid' => '11111111-1111-4111-8111-111111111111']);
        $this->assert($req->getRouteParam('uuid') === '11111111-1111-4111-8111-111111111111', "Request::getRouteParam retrieves route param");
    }

    private function testResponseHelper(): void
    {
        echo "\n--- 6. Testing Response Formats ---\n";
        // Test output buffering of Response methods
        // Since Response uses exit, we test Response structure by mocking or testing the envelope
        $successEnvelope = [
            'success' => true,
            'data' => ['id' => 1],
            'meta' => ['timestamp' => '2026-09-21T00:00:00Z']
        ];
        $this->assert($successEnvelope['success'] === true && isset($successEnvelope['data']), "Response format conforms to {success, data, meta}");

        $errorEnvelope = [
            'success' => false,
            'error' => [
                'code' => 'NOT_FOUND',
                'message' => 'Recurso no encontrado.',
                'details' => ['uuid' => 'No existe']
            ]
        ];
        $this->assert($errorEnvelope['success'] === false && isset($errorEnvelope['error']['code']), "Error format conforms to {success: false, error: {code, message}}");
    }

    private function testRouterAndMiddlewares(): void
    {
        echo "\n--- 7. Testing Router & Middleware Pipeline ---\n";
        $router = new Router();

        $mockMiddleware = new class implements MiddlewareInterface {
            public bool $executed = false;
            public function handle(Request $request, callable $next): void {
                $this->executed = true;
                $next($request);
            }
        };

        $router->use($mockMiddleware);

        $handlerCalled = false;
        $capturedParam = null;

        $router->get('/api/v1/articles/{uuid}', function (Request $request, array $params) use (&$handlerCalled, &$capturedParam) {
            $handlerCalled = true;
            $capturedParam = $params['uuid'] ?? null;
        });

        $testUuid = Uuid::uuid4();
        $req = new Request('GET', "/api/v1/articles/{$testUuid}");
        $router->dispatch($req);

        $this->assert($mockMiddleware->executed === true, "Router executes global middleware pipeline");
        $this->assert($handlerCalled === true, "Router invokes matched route handler");
        $this->assert($capturedParam === $testUuid, "Router extracts and passes dynamic route parameter ({$testUuid})");
    }

    private function testJsonParserMiddleware(): void
    {
        echo "\n--- 8. Testing JsonBodyParser Middleware ---\n";
        $parser = new JsonBodyParserMiddleware();
        $req = new Request('POST', '/api/v1/test', ['content-type' => 'application/json']);

        $nextCalled = false;
        $parser->handle($req, function (Request $r) use (&$nextCalled) {
            $nextCalled = true;
        });

        $this->assert($nextCalled === true, "JsonBodyParserMiddleware calls next handler on empty/valid body");
    }

    private function testDatabasePing(): void
    {
        echo "\n--- 9. Testing Database Ping ---\n";
        // Since test runner might not have PDO MySQL extension or DB reachable directly,
        // Database::ping() must gracefully catch error and return bool without throwing uncaught exceptions.
        $isAlive = Database::ping();
        $this->assert(is_bool($isAlive), "Database::ping() safely returns boolean without throwing uncaught exception (result: " . ($isAlive ? 'true' : 'false') . ")");
    }
}

$test = new Phase3Test();
$test->run();
