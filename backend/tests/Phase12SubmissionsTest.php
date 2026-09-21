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
use App\Security\AuthenticatedUser;
use App\Services\SubmissionService;
use App\Services\ArticleService;
use PDO;
use InvalidArgumentException;
use RuntimeException;

class Phase12SubmissionsTest
{
    private int $passed = 0;
    private int $failed = 0;
    private string $tenantUuid = '00000000-0000-0000-0000-000000000001';
    private string $siteUuid = '00000000-0000-0000-0000-000000000002';
    private string $altTenantUuid = '00000000-0000-0000-0000-000000000099';
    private string $altSiteUuid = '00000000-0000-0000-0000-000000000098';
    private string $testAuthorUuid = '00000000-0000-0000-0002-000000000002'; // Carlos Mendoza (single journalist)
    private string $testCategoryUuid = '00000000-0000-0000-0001-000000000001'; // Regionales

    public function __construct()
    {
        Env::load(__DIR__ . '/../.env');
    }

    public function run(): void
    {
        echo "================================================\n";
        echo "  LYBERATE — FASE 12 USER SUBMITTED NEWS TEST   \n";
        echo "================================================\n\n";

        $this->setupFixtures();
        $this->testValidSubmissionCreation();
        $this->testFieldValidationRules();
        $this->testRateLimiting();
        $this->testStrictNoAutoPublishRule();
        $this->testMultiTenantIsolation();
        $this->testEditorialRejection();
        $this->testSingleJournalistArticleConversion();
        $this->testRouterEndpoints();

        echo "\n================================================\n";
        echo "SUBMISSIONS RESULTS: {$this->passed} PASSED, {$this->failed} FAILED\n";
        echo "================================================\n";

        if ($this->failed > 0) {
            exit(1);
        }
    }

    private function assert(bool $condition, string $description): void
    {
        if ($condition) {
            $this->passed++;
            echo "  ✓ PASS: {$description}\n";
        } else {
            $this->failed++;
            echo "  ✗ FAIL: {$description}\n";
        }
    }

    private function setupFixtures(): void
    {
        $db = Database::getConnection();

        // Ensure canonical tenant and site exist
        $db->exec("INSERT IGNORE INTO tenants (tenant_uuid, name, slug, status) VALUES 
            ('{$this->tenantUuid}', 'Lyberate Main', 'lyberate-main', 'ACTIVE'),
            ('{$this->altTenantUuid}', 'Lyberate Secondary', 'lyberate-secondary', 'ACTIVE')");

        $db->exec("INSERT IGNORE INTO sites (site_uuid, tenant_uuid, name, slug, domain, status) VALUES 
            ('{$this->siteUuid}', '{$this->tenantUuid}', 'Contacto con la Noticia', 'contacto', 'contactoconlanoticia.com', 'ACTIVE'),
            ('{$this->altSiteUuid}', '{$this->altTenantUuid}', 'Sitio Alternativo', 'sitio-alt', 'alt.example.com', 'ACTIVE')");

        // Clean up test submissions
        $db->exec("DELETE FROM news_submissions WHERE submitter_name LIKE 'TEST_SUBMIT_%'");
    }

    private function testValidSubmissionCreation(): void
    {
        echo "[1] Testing Valid Citizen Submission Creation...\n";

        $data = [
            'name' => 'TEST_SUBMIT_Vecino Vigilante',
            'phone' => '0412-9876543',
            'email' => 'vecino@example.com',
            'location' => 'San Juan de los Morros, Sector La Morera',
            'title' => 'Rotura de tubería de agua potable inunda avenida principal',
            'description' => 'Desde tempranas horas de la mañana se presentó una avería en el tubo matriz que dejó sin servicio a más de 500 familias.',
            'video_url' => 'https://youtube.com/watch?v=sample123',
            'message' => 'Por favor enviar equipo reporteril antes del mediodía.',
        ];

        $sub = SubmissionService::createSubmission(
            $this->tenantUuid,
            $this->siteUuid,
            $data,
            [],
            '190.120.10.5',
            'Mozilla/5.0 TestBrowser'
        );

        $this->assert(!empty($sub['submission_uuid']), "Submission created with valid UUID");
        $this->assert($sub['status'] === 'PENDING_REVIEW', "Initial status is strictly 'PENDING_REVIEW'");
        $this->assert($sub['submitter_name'] === 'TEST_SUBMIT_Vecino Vigilante', "Submitter name stored accurately");
        $this->assert($sub['contact_phone'] === '0412-9876543', "Contact phone stored accurately");
        $this->assert($sub['contact_email'] === 'vecino@example.com', "Contact email stored accurately");
        $this->assert($sub['location'] === 'San Juan de los Morros, Sector La Morera', "Location stored accurately");
        $this->assert(empty($sub['converted_article_uuid']), "converted_article_uuid is null initially");
    }

    private function testFieldValidationRules(): void
    {
        echo "\n[2] Testing Field Validation Rules & Spam Protection...\n";

        // 1. Missing name
        $noNameCaught = false;
        try {
            SubmissionService::createSubmission($this->tenantUuid, $this->siteUuid, [
                'phone' => '0414-1112233',
                'location' => 'Calabozo',
                'title' => 'Noticia sin autor',
                'description' => 'Descripción suficiente de más de 10 caracteres',
            ]);
        } catch (InvalidArgumentException $e) {
            $noNameCaught = true;
        }
        $this->assert($noNameCaught, "Rejects submission without submitter name");

        // 2. Missing BOTH phone and email
        $noContactCaught = false;
        try {
            SubmissionService::createSubmission($this->tenantUuid, $this->siteUuid, [
                'name' => 'TEST_SUBMIT_Anonimo',
                'location' => 'Valle de la Pascua',
                'title' => 'Noticia sin contacto',
                'description' => 'Descripción suficiente de más de 10 caracteres',
            ]);
        } catch (InvalidArgumentException $e) {
            $noContactCaught = true;
        }
        $this->assert($noContactCaught, "Rejects submission lacking both phone and email");

        // 3. Invalid email format
        $invalidEmailCaught = false;
        try {
            SubmissionService::createSubmission($this->tenantUuid, $this->siteUuid, [
                'name' => 'TEST_SUBMIT_BadEmail',
                'email' => 'not-an-email',
                'location' => 'Zaraza',
                'title' => 'Noticia con email malo',
                'description' => 'Descripción suficiente de más de 10 caracteres',
            ]);
        } catch (InvalidArgumentException $e) {
            $invalidEmailCaught = true;
        }
        $this->assert($invalidEmailCaught, "Rejects malformed email address");

        // 4. Short description (< 10 chars)
        $shortDescCaught = false;
        try {
            SubmissionService::createSubmission($this->tenantUuid, $this->siteUuid, [
                'name' => 'TEST_SUBMIT_Short',
                'phone' => '0414-0000000',
                'location' => 'Altagracia',
                'title' => 'Título de noticia',
                'description' => 'Corto',
            ]);
        } catch (InvalidArgumentException $e) {
            $shortDescCaught = true;
        }
        $this->assert($shortDescCaught, "Rejects description shorter than 10 characters");

        // 5. Dangerous video URL (e.g. javascript:)
        $badVideoCaught = false;
        try {
            SubmissionService::createSubmission($this->tenantUuid, $this->siteUuid, [
                'name' => 'TEST_SUBMIT_XSS',
                'phone' => '0414-0000000',
                'location' => 'Ortiz',
                'title' => 'Título con video malicioso',
                'description' => 'Descripción suficiente de más de 10 caracteres',
                'video_url' => 'javascript:alert(document.cookie)',
            ]);
        } catch (InvalidArgumentException $e) {
            $badVideoCaught = true;
        }
        $this->assert($badVideoCaught, "Rejects dangerous video URLs (e.g. javascript:)");
    }

    private function testRateLimiting(): void
    {
        echo "\n[3] Testing Rate Limiting by IP (Max 5/hour)...\n";

        $ip = '198.51.100.77';

        // Clear previous entries for this test IP
        $db = Database::getConnection();
        $db->exec("DELETE FROM news_submissions WHERE ip_address = '{$ip}'");

        // First 5 submissions from this IP should succeed
        for ($i = 1; $i <= 5; $i++) {
            $sub = SubmissionService::createSubmission(
                $this->tenantUuid,
                $this->siteUuid,
                [
                    'name' => "TEST_SUBMIT_RateLimit_{$i}",
                    'phone' => "0412-00000{$i}",
                    'location' => "Sector {$i}",
                    'title' => "Reporte de prueba {$i} para límite",
                    'description' => "Contenido detallado del reporte número {$i}",
                ],
                [],
                $ip
            );
            $this->assert(!empty($sub['submission_uuid']), "Submission {$i}/5 allowed under rate limit window");
        }

        // 6th submission from the same IP must be rejected with 429
        $rateLimitExceededCaught = false;
        try {
            SubmissionService::createSubmission(
                $this->tenantUuid,
                $this->siteUuid,
                [
                    'name' => 'TEST_SUBMIT_RateLimit_6',
                    'phone' => '0412-000006',
                    'location' => 'Sector 6',
                    'title' => 'Reporte que debe bloquearse',
                    'description' => 'Intento de spam que excede el límite por hora',
                ],
                [],
                $ip
            );
        } catch (RuntimeException $e) {
            if ($e->getCode() === 429) {
                $rateLimitExceededCaught = true;
            }
        }
        $this->assert($rateLimitExceededCaught, "6th submission is blocked with HTTP 429 Rate Limit Exceeded");
    }

    private function testStrictNoAutoPublishRule(): void
    {
        echo "\n[4] Testing Critical Rule: NEVER Auto-Published...\n";

        $sub = SubmissionService::createSubmission(
            $this->tenantUuid,
            $this->siteUuid,
            [
                'name' => 'TEST_SUBMIT_NoAutoPub',
                'phone' => '0416-5554433',
                'location' => 'Camaguán',
                'title' => 'Incidente en carretera nacional',
                'description' => 'Árbol caído obstruye ambos canales en la vía hacia el sur.',
            ],
            [],
            '190.200.1.1'
        );

        $this->assert($sub['status'] === 'PENDING_REVIEW', "Submission created as PENDING_REVIEW");

        // Verify that no article exists in articles table matching this title in PUBLISHED status
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT COUNT(*) FROM articles WHERE title = ? AND status = 'PUBLISHED'");
        $stmt->execute([$sub['title']]);
        $publishedCount = (int) $stmt->fetchColumn();

        $this->assert($publishedCount === 0, "No published article was automatically spawned in database");
    }

    private function testMultiTenantIsolation(): void
    {
        echo "\n[5] Testing Multi-Tenant & Multi-Site Isolation...\n";

        // Create submission on Alt Tenant / Alt Site
        $altSub = SubmissionService::createSubmission(
            $this->altTenantUuid,
            $this->altSiteUuid,
            [
                'name' => 'TEST_SUBMIT_AltTenant',
                'phone' => '0414-9998877',
                'location' => 'Caracas',
                'title' => 'Reporte en tenant secundario',
                'description' => 'Información restringida al sitio alternativo.',
            ],
            [],
            '190.200.1.2'
        );

        // Site A listing should NOT contain Alt Site's submission
        $listA = SubmissionService::listSubmissions($this->tenantUuid, $this->siteUuid);
        $foundInSiteA = false;
        foreach ($listA['items'] as $item) {
            if ($item['submission_uuid'] === $altSub['submission_uuid']) {
                $foundInSiteA = true;
                break;
            }
        }
        $this->assert(!$foundInSiteA, "Alt Site submission is never returned in Site A admin list");

        // Direct lookup with Site A credentials returns null
        $lookupSiteA = SubmissionService::getSubmission($this->tenantUuid, $this->siteUuid, $altSub['submission_uuid']);
        $this->assert($lookupSiteA === null, "Direct getSubmission across tenants returns null");
    }

    private function testEditorialRejection(): void
    {
        echo "\n[6] Testing Editorial Moderation Rejection...\n";

        $sub = SubmissionService::createSubmission(
            $this->tenantUuid,
            $this->siteUuid,
            [
                'name' => 'TEST_SUBMIT_ToReject',
                'email' => 'spam@example.com',
                'location' => 'Desconocida',
                'title' => 'Publicidad encubierta o información falsa',
                'description' => 'Texto que no cumple con el código periodístico del diario.',
            ],
            [],
            '190.200.1.3'
        );

        $reviewer = new AuthenticatedUser(
            'reviewer-user-uuid',
            $this->tenantUuid,
            $this->siteUuid,
            'Editor de Guardia',
            'editor@contactoconlanoticia.com',
            'ACTIVE',
            ['EDITOR'],
            ['articles.create', 'articles.publish'],
            'session-reviewer-uuid'
        );

        $rejected = SubmissionService::rejectSubmission(
            $this->tenantUuid,
            $this->siteUuid,
            $sub['submission_uuid'],
            'Contenido considerado spam comercial sin valor informativo público.',
            $reviewer
        );

        $this->assert($rejected['status'] === 'REJECTED', "Status updated to REJECTED");
        $this->assert(!empty($rejected['rejection_reason']), "Rejection reason saved in database");
        $this->assert($rejected['reviewed_by_user_uuid'] === 'reviewer-user-uuid', "Reviewer user UUID recorded");
    }

    private function testSingleJournalistArticleConversion(): void
    {
        echo "\n[7] Testing Conversion to Article Assigned to a Single Journalist...\n";

        $sub = SubmissionService::createSubmission(
            $this->tenantUuid,
            $this->siteUuid,
            [
                'name' => 'TEST_SUBMIT_Ciudadano Ejemplar',
                'phone' => '0414-3332211',
                'location' => 'San Juan de los Morros, Av. Los Llanos',
                'title' => 'Comunidad repara alumbrado público por autogestión vecinal',
                'description' => 'Vecinos organizados del sector Los Llanos adquirieron 20 luminarias LED para recuperar la iluminación de su calle.',
            ],
            [],
            '190.200.1.4'
        );

        $editorUser = new AuthenticatedUser(
            'editor-user-uuid',
            $this->tenantUuid,
            $this->siteUuid,
            'Editor en Jefe',
            'jefe@contactoconlanoticia.com',
            'ACTIVE',
            ['EDITOR'],
            ['articles.create', 'articles.edit_any', 'articles.publish'],
            'session-editor-uuid'
        );

        // Convert to article assigned explicitly to Carlos Mendoza (testAuthorUuid)
        $conversion = SubmissionService::convertToArticle(
            $this->tenantUuid,
            $this->siteUuid,
            $sub['submission_uuid'],
            [
                'author_uuid' => $this->testAuthorUuid,
                'category_uuid' => $this->testCategoryUuid,
            ],
            $editorUser
        );

        $createdArticle = $conversion['article'];
        $updatedSub = $conversion['submission'];

        $this->assert(!empty($createdArticle['article_uuid']), "Draft article created with UUID");
        $this->assert($createdArticle['status'] === 'DRAFT', "Created article is in 'DRAFT' status (NOT published)");
        $this->assert($createdArticle['author_uuid'] === $this->testAuthorUuid, "Article assigned exclusively to the designated journalist");
        $this->assert(str_contains($createdArticle['content'], 'Reporte comunitario enviado por'), "Article content contains citizen provenance attribution");
        $this->assert($updatedSub['status'] === 'CONVERTED', "Submission marked as CONVERTED");
        $this->assert($updatedSub['converted_article_uuid'] === $createdArticle['article_uuid'], "Submission points to newly created article UUID");

        // Cannot convert twice
        $doubleConvertCaught = false;
        try {
            SubmissionService::convertToArticle(
                $this->tenantUuid,
                $this->siteUuid,
                $sub['submission_uuid'],
                [],
                $editorUser
            );
        } catch (RuntimeException $e) {
            $doubleConvertCaught = true;
        }
        $this->assert($doubleConvertCaught, "Rejects second conversion attempt on already converted submission");
    }

    private function testRouterEndpoints(): void
    {
        echo "\n[8] Testing Router HTTP Endpoints Integration...\n";

        $router = new Router();
        $router->use(new RequestContextMiddleware());
        $router->use(new JsonBodyParserMiddleware());
        require __DIR__ . '/../routes/api.php';

        // 1. POST /api/v1/public/submissions (Public submission)
        $reqPublic = new Request('POST', '/api/v1/public/submissions', [
            'x-tenant-id' => $this->tenantUuid,
            'x-site-id' => $this->siteUuid,
            'accept' => 'application/json',
            'content-type' => 'application/json',
        ], [], [
            'name' => 'TEST_SUBMIT_RouterUser',
            'phone' => '0412-5556677',
            'location' => 'El Sombrero',
            'title' => 'Denuncia vía API pública',
            'description' => 'Descripción enviada mediante endpoint HTTP JSON.',
        ]);

        ob_start();
        $router->dispatch($reqPublic);
        $rawPublic = ob_get_clean();

        $this->assert(!empty($rawPublic), "Public submission endpoint returned content");
        $bodyPublic = json_decode($rawPublic, true);
        $this->assert(isset($bodyPublic['data']['submission_uuid']), "Public submission returns created submission data");
        $this->assert($bodyPublic['data']['status'] === 'PENDING_REVIEW', "Status returned is PENDING_REVIEW");

        // 2. GET /api/v1/admin/submissions without auth -> 401
        $reqAdminUnauth = new Request('GET', '/api/v1/admin/submissions', [
            'x-tenant-id' => $this->tenantUuid,
            'x-site-id' => $this->siteUuid,
            'accept' => 'application/json',
        ]);

        ob_start();
        $router->dispatch($reqAdminUnauth);
        $rawAdmin = ob_get_clean();

        $bodyAdmin = json_decode($rawAdmin, true);
        $this->assert(isset($bodyAdmin['success']) && $bodyAdmin['success'] === false, "Admin submissions without auth returns 401 error");
    }
}

$test = new Phase12SubmissionsTest();
$test->run();

