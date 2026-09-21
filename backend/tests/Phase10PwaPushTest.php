<?php

declare(strict_types=1);

namespace Tests;

if (!defined('APP_TESTING')) {
    define('APP_TESTING', true);
}

// Autoloader
spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/../app/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

require_once __DIR__ . '/../app/Core/Env.php';
\App\Core\Env::load(__DIR__ . '/../.env');
\App\Core\Env::load(dirname(__DIR__, 2) . '/.env');
use App\Core\Env;
use App\Core\Request;
use App\Core\Router;
use App\Database\Database;
use App\Helpers\Uuid;
use App\Middleware\JsonBodyParserMiddleware;
use App\Middleware\RequestContextMiddleware;
use App\Services\PushService;
use PDO;

class Phase10PwaPushTest
{
    private int $passed = 0;
    private int $failed = 0;
    private string $tenantUuid = '00000000-0000-0000-0000-000000000001';
    private string $siteUuid = '00000000-0000-0000-0000-000000000002';
    private string $testEndpoint = 'https://fcm.googleapis.com/fcm/send/test-pwa-endpoint-' . 12345;

    public function __construct()
    {
        Env::load(__DIR__ . '/../.env');
    }

    public function run(): void
    {
        echo "============================================\n";
        echo "  LYBERATE — FASE 10 PWA & WEB PUSH TEST    \n";
        echo "============================================\n\n";

        $this->testWebManifestValidity();
        $this->testOfflineFallbackPage();
        $this->testServiceWorkerIntegrityAndSafeCaching();
        $this->testPushConfigEndpoint();
        $this->testPushFeatureFlagDisabled();
        $this->testPushSubscribeSuccess();
        $this->testPushUpdatePreferences();
        $this->testPushUnsubscribe();
        $this->testPushInputValidationAndSecurity();
        $this->testPushMultiTenantIsolation();
        $this->testRouterPushEndpointsIntegration();

        echo "\n============================================\n";
        echo "PWA & PUSH RESULTS: {$this->passed} PASSED, {$this->failed} FAILED\n";
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

    /**
     * Test 1: Web App Manifest validity & required PWA fields
     */
    private function testWebManifestValidity(): void
    {
        echo "--- 1. Testing Web App Manifest & PWA Assets ---\n";

        $manifestPath = __DIR__ . '/../../frontend/public/manifest.webmanifest';
        $this->assert(file_exists($manifestPath), "manifest.webmanifest exists in frontend/public");

        $content = file_get_contents($manifestPath);
        $manifest = json_decode($content, true);

        $this->assert(is_array($manifest), "Manifest parses as valid JSON");
        $this->assert(isset($manifest['name']) && $manifest['name'] === 'Contacto con la Noticia', "Manifest name is 'Contacto con la Noticia'");
        $this->assert(isset($manifest['short_name']) && $manifest['short_name'] === 'Contacto', "Manifest short_name is 'Contacto'");
        $this->assert(isset($manifest['display']) && $manifest['display'] === 'standalone', "Manifest display mode is 'standalone'");
        $this->assert(isset($manifest['start_url']) && $manifest['start_url'] === '/', "Manifest start_url is '/'");
        $this->assert(isset($manifest['scope']) && $manifest['scope'] === '/', "Manifest scope is '/'");
        $this->assert(isset($manifest['theme_color']) && $manifest['theme_color'] === '#0c0a09', "Manifest theme_color matches #0c0a09");
        $this->assert(isset($manifest['background_color']), "Manifest background_color is defined");
        $this->assert(isset($manifest['icons']) && is_array($manifest['icons']), "Manifest has icons array");

        // Verify physical existence of declared icons
        $iconsDir = __DIR__ . '/../../frontend/public/icons';
        $this->assert(file_exists("{$iconsDir}/icon-192.png"), "Icon icon-192.png physically exists");
        $this->assert(file_exists("{$iconsDir}/icon-512.png"), "Icon icon-512.png physically exists");
        $this->assert(file_exists("{$iconsDir}/icon-maskable.png"), "Icon icon-maskable.png physically exists");
        $this->assert(file_exists("{$iconsDir}/apple-touch-icon.png"), "Icon apple-touch-icon.png physically exists");
        $this->assert(file_exists("{$iconsDir}/icon.svg"), "Vector icon.svg physically exists");
    }

    /**
     * Test 2: Offline fallback page
     */
    private function testOfflineFallbackPage(): void
    {
        echo "\n--- 2. Testing Offline Fallback Page ---\n";

        $offlinePath = __DIR__ . '/../../frontend/public/offline.html';
        $this->assert(file_exists($offlinePath), "offline.html exists in frontend/public");

        $content = file_get_contents($offlinePath);
        $this->assert(str_contains($content, '<!DOCTYPE html>'), "offline.html is a valid HTML5 document");
        $this->assert(str_contains($content, 'Contacto con la Noticia'), "offline.html contains publication brand");
        $this->assert(str_contains($content, 'Sin Conexión') || str_contains($content, 'fuera de línea'), "offline.html clearly states offline condition");
        $this->assert(str_contains($content, 'window.location.reload()'), "offline.html includes connection retry functionality");
        $this->assert(!str_contains($content, 'http://') && !str_contains($content, 'https://'), "offline.html is self-contained with no broken external dependencies");
    }

    /**
     * Test 3: Service Worker integrity and safe caching rules
     */
    private function testServiceWorkerIntegrityAndSafeCaching(): void
    {
        echo "\n--- 3. Testing Service Worker & Safe Caching Directives ---\n";

        $swPath = __DIR__ . '/../../frontend/public/sw.js';
        $this->assert(file_exists($swPath), "sw.js exists in frontend/public");

        $swContent = file_get_contents($swPath);
        $this->assert(str_contains($swContent, "addEventListener('install'"), "Service Worker registers 'install' event");
        $this->assert(str_contains($swContent, "addEventListener('activate'"), "Service Worker registers 'activate' event");
        $this->assert(str_contains($swContent, "addEventListener('fetch'"), "Service Worker registers 'fetch' event");
        $this->assert(str_contains($swContent, "addEventListener('push'"), "Service Worker registers 'push' event");
        $this->assert(str_contains($swContent, "addEventListener('notificationclick'"), "Service Worker registers 'notificationclick' event");

        // Privacy and safe caching assertions
        $this->assert(str_contains($swContent, '/api/v1/admin/'), "Service worker explicitly excludes /api/v1/admin/ from caching");
        $this->assert(str_contains($swContent, '/api/v1/auth/'), "Service worker explicitly excludes /api/v1/auth/ from caching");
        $this->assert(str_contains($swContent, 'offline.html'), "Service worker references offline.html fallback");
        $this->assert(str_contains($swContent, "request.method !== 'GET'"), "Non-GET requests bypass caching directly to network");
    }

    /**
     * Test 4: Push Config endpoint
     */
    private function testPushConfigEndpoint(): void
    {
        echo "\n--- 4. Testing Push Public Configuration ---\n";

        $config = PushService::getPublicConfig($this->tenantUuid, $this->siteUuid);

        $this->assert(isset($config['enabled']) && $config['enabled'] === true, "Push is enabled by default");
        $this->assert(!empty($config['public_key']), "Public VAPID key is provided");
        $this->assert(is_array($config['available_topics']), "Available topics array is provided");
        $this->assert(count($config['available_topics']) >= 6, "Contains at least 6 canonical topics");

        // Verify private key is NEVER exposed
        $this->assert(!isset($config['private_key']), "Private VAPID key is strictly omitted from public config");
    }

    /**
     * Test 5: Push Feature Flag disabled per site
     */
    private function testPushFeatureFlagDisabled(): void
    {
        echo "\n--- 5. Testing Push Feature Flag (Disabled State) ---\n";

        // Disable push for test site
        PushService::setPushEnabled($this->tenantUuid, $this->siteUuid, false);

        $this->assert(!PushService::isPushEnabled($this->tenantUuid, $this->siteUuid), "Push is successfully flagged as disabled");

        $config = PushService::getPublicConfig($this->tenantUuid, $this->siteUuid);
        $this->assert($config['enabled'] === false, "Public config reports enabled = false");
        $this->assert($config['public_key'] === null, "Public key is null when push is disabled");

        // Attempting subscribe while disabled must throw exception
        $thrown = false;
        try {
            PushService::subscribe($this->tenantUuid, $this->siteUuid, [
                'endpoint' => $this->testEndpoint,
                'keys' => ['p256dh' => 'test-p256dh', 'auth' => 'test-auth'],
            ]);
        } catch (\RuntimeException $e) {
            $thrown = true;
            $this->assert($e->getCode() === 403, "Subscribe returns 403 when feature is disabled");
        }
        $this->assert($thrown, "Subscription blocked when push feature is disabled");

        // Re-enable push for remaining tests
        PushService::setPushEnabled($this->tenantUuid, $this->siteUuid, true);
        $this->assert(PushService::isPushEnabled($this->tenantUuid, $this->siteUuid), "Push re-enabled successfully");
    }

    /**
     * Test 6: Push Subscribe Success
     */
    private function testPushSubscribeSuccess(): void
    {
        echo "\n--- 6. Testing Push Subscribe (Opt-In) ---\n";

        $result = PushService::subscribe($this->tenantUuid, $this->siteUuid, [
            'endpoint' => $this->testEndpoint,
            'keys' => [
                'p256dh' => 'BDx_test_key_sample_p256dh_value_string_12345',
                'auth' => 'test_auth_token_secret_value_67890',
            ],
            'topics' => ['breaking_news', 'regionales', 'sucesos'],
            'user_agent' => 'Mozilla/5.0 Test Browser',
        ]);

        $this->assert(isset($result['subscription_uuid']) && Uuid::isValid($result['subscription_uuid']), "Returns valid subscription_uuid");
        $this->assert($result['status'] === 'subscribed', "Status is 'subscribed'");
        $this->assert(in_array('breaking_news', $result['topics'], true), "Topics include 'breaking_news'");
        $this->assert(in_array('regionales', $result['topics'], true), "Topics include 'regionales'");

        // Verify in database
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('
            SELECT is_active, topics 
            FROM push_subscriptions 
            WHERE subscription_uuid = :uuid
        ');
        $stmt->execute([':uuid' => $result['subscription_uuid']]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->assert((int) $row['is_active'] === 1, "Subscription record in DB is active (is_active = 1)");
        $dbTopics = json_decode($row['topics'], true);
        $this->assert(is_array($dbTopics) && in_array('regionales', $dbTopics, true), "Database topics JSON persisted accurately");
    }

    /**
     * Test 7: Push Update Preferences
     */
    private function testPushUpdatePreferences(): void
    {
        echo "\n--- 7. Testing Push Update Preferences (Configurable) ---\n";

        $updated = PushService::updatePreferences(
            $this->tenantUuid,
            $this->siteUuid,
            $this->testEndpoint,
            ['turismo', 'municipales']
        );

        $this->assert($updated['status'] === 'updated', "Preferences status is 'updated'");
        $this->assert(in_array('turismo', $updated['topics'], true), "Updated topics include 'turismo'");
        $this->assert(!in_array('sucesos', $updated['topics'], true), "Removed topics no longer present");

        // Verify in database
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('
            SELECT topics 
            FROM push_subscriptions 
            WHERE site_uuid = :site_uuid AND endpoint_hash = :hash
        ');
        $stmt->execute([
            ':site_uuid' => $this->siteUuid,
            ':hash' => hash('sha256', $this->testEndpoint),
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $dbTopics = json_decode($row['topics'], true);

        $this->assert(in_array('turismo', $dbTopics, true), "Database reflects updated topic preferences");
    }

    /**
     * Test 8: Push Unsubscribe (Revocable)
     */
    private function testPushUnsubscribe(): void
    {
        echo "\n--- 8. Testing Push Unsubscribe (Revocable) ---\n";

        $success = PushService::unsubscribe($this->tenantUuid, $this->siteUuid, $this->testEndpoint);
        $this->assert($success === true, "Unsubscribe returned true");

        // Verify in database that is_active = 0
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('
            SELECT is_active 
            FROM push_subscriptions 
            WHERE site_uuid = :site_uuid AND endpoint_hash = :hash
        ');
        $stmt->execute([
            ':site_uuid' => $this->siteUuid,
            ':hash' => hash('sha256', $this->testEndpoint),
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->assert((int) $row['is_active'] === 0, "Subscription marked as inactive (is_active = 0) upon unsubscribe");
    }

    /**
     * Test 9: Input validation & security
     */
    private function testPushInputValidationAndSecurity(): void
    {
        echo "\n--- 9. Testing Push Input Validation & Security ---\n";

        // 1. Invalid endpoint (not a URL)
        $invalidEndpointThrown = false;
        try {
            PushService::subscribe($this->tenantUuid, $this->siteUuid, [
                'endpoint' => 'not-a-valid-url',
                'keys' => ['p256dh' => 'key', 'auth' => 'token'],
            ]);
        } catch (\InvalidArgumentException $e) {
            $invalidEndpointThrown = true;
        }
        $this->assert($invalidEndpointThrown, "Invalid endpoint URL is rejected with InvalidArgumentException");

        // 2. Missing p256dh
        $missingKeyThrown = false;
        try {
            PushService::subscribe($this->tenantUuid, $this->siteUuid, [
                'endpoint' => 'https://valid.endpoint.com/test',
                'keys' => ['auth' => 'token'],
            ]);
        } catch (\InvalidArgumentException $e) {
            $missingKeyThrown = true;
        }
        $this->assert($missingKeyThrown, "Missing p256dh key is rejected with InvalidArgumentException");

        // 3. Unknown topics filtered out safely
        $resUnknown = PushService::subscribe($this->tenantUuid, $this->siteUuid, [
            'endpoint' => 'https://example.com/push/valid-sub-' . Uuid::uuid4(),
            'keys' => ['p256dh' => 'valid-p256dh', 'auth' => 'valid-auth'],
            'topics' => ['non_existent_topic_123', 'breaking_news'],
        ]);
        $this->assert(!in_array('non_existent_topic_123', $resUnknown['topics'], true), "Invalid/unknown topics are safely filtered out");
        $this->assert(in_array('breaking_news', $resUnknown['topics'], true), "Valid canonical topic retained");
    }

    /**
     * Test 10: Multi-tenant isolation
     */
    private function testPushMultiTenantIsolation(): void
    {
        echo "\n--- 10. Testing Multi-Tenant Isolation ---\n";

        $foreignSiteUuid = '99999999-9999-9999-9999-999999999999';

        // An unsubscribe on a foreign site should not affect this site's subscription
        $unsubForeign = PushService::unsubscribe($this->tenantUuid, $foreignSiteUuid, $this->testEndpoint);
        $this->assert($unsubForeign === false, "Cross-site unsubscribe attempt does not affect site subscription");

        // Subscriptions list by topic on foreign site yields 0
        $foreignSubs = PushService::getActiveSubscriptions($this->tenantUuid, $foreignSiteUuid, 'breaking_news');
        $this->assert(empty($foreignSubs), "Foreign site has 0 subscriptions under this tenant");
    }

    /**
     * Test 11: Router Endpoints HTTP Integration
     */
    private function testRouterPushEndpointsIntegration(): void
    {
        echo "\n--- 11. Testing Router HTTP Push Endpoints Integration ---\n";

        $router = new Router();
        $router->use(new RequestContextMiddleware());
        $router->use(new JsonBodyParserMiddleware());
        require __DIR__ . '/../routes/api.php';

        // 1. GET /api/v1/public/push/config
        $reqConfig = new Request('GET', '/api/v1/public/push/config', [
            'x-tenant-id' => $this->tenantUuid,
            'x-site-id' => $this->siteUuid,
        ]);

        ob_start();
        $router->dispatch($reqConfig);
        $rawConfig = ob_get_clean();

        $this->assert(!empty($rawConfig), "GET /api/v1/public/push/config responded with non-empty payload");
        $configData = json_decode($rawConfig, true);
        $this->assert(isset($configData['success']) && $configData['success'] === true, "Push config response has success = true");
        $this->assert(isset($configData['data']['available_topics']), "Push config has data.available_topics");

        // 2. POST /api/v1/public/push/subscribe via Router
        $subEndpoint = 'https://fcm.googleapis.com/fcm/router-test-' . Uuid::uuid4();
        $reqSub = new Request(
            'POST',
            '/api/v1/public/push/subscribe',
            [
                'x-tenant-id' => $this->tenantUuid,
                'x-site-id' => $this->siteUuid,
                'content-type' => 'application/json',
            ],
            [],
            [
                'endpoint' => $subEndpoint,
                'keys' => [
                    'p256dh' => 'test-router-p256dh-key',
                    'auth' => 'test-router-auth-key',
                ],
                'topics' => ['breaking_news', 'comunidades'],
            ]
        );

        ob_start();
        $router->dispatch($reqSub);
        $rawSub = ob_get_clean();

        $subData = json_decode($rawSub, true);
        $this->assert(isset($subData['success']) && $subData['success'] === true, "Router subscribe response has success = true");
        $this->assert(isset($subData['data']['subscription_uuid']), "Router subscribe returns subscription_uuid");

        // 3. PUT /api/v1/public/push/preferences via Router
        $reqPref = new Request(
            'PUT',
            '/api/v1/public/push/preferences',
            [
                'x-tenant-id' => $this->tenantUuid,
                'x-site-id' => $this->siteUuid,
                'content-type' => 'application/json',
            ],
            [],
            [
                'endpoint' => $subEndpoint,
                'topics' => ['regionales'],
            ]
        );

        ob_start();
        $router->dispatch($reqPref);
        $rawPref = ob_get_clean();

        $prefData = json_decode($rawPref, true);
        $this->assert(isset($prefData['success']) && $prefData['success'] === true, "Router preferences response has success = true");

        // 4. POST /api/v1/public/push/unsubscribe via Router
        $reqUnsub = new Request(
            'POST',
            '/api/v1/public/push/unsubscribe',
            [
                'x-tenant-id' => $this->tenantUuid,
                'x-site-id' => $this->siteUuid,
                'content-type' => 'application/json',
            ],
            [],
            [
                'endpoint' => $subEndpoint,
            ]
        );

        ob_start();
        $router->dispatch($reqUnsub);
        $rawUnsub = ob_get_clean();

        $unsubData = json_decode($rawUnsub, true);
        $this->assert(isset($unsubData['success']) && $unsubData['success'] === true, "Router unsubscribe response has success = true");
    }
}

// Run test suite
$test = new Phase10PwaPushTest();
$test->run();
