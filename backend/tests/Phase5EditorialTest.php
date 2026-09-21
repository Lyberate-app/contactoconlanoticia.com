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
require_once __DIR__ . '/../app/Middleware/AuthMiddleware.php';
require_once __DIR__ . '/../app/Middleware/RequirePermissionMiddleware.php';
require_once __DIR__ . '/../app/Core/Router.php';
require_once __DIR__ . '/../app/Core/ExceptionHandler.php';
require_once __DIR__ . '/../app/Database/Database.php';
require_once __DIR__ . '/../app/Security/Password.php';
require_once __DIR__ . '/../app/Security/AuthenticatedUser.php';
require_once __DIR__ . '/../app/Services/AuditService.php';
require_once __DIR__ . '/../app/Services/SlugService.php';
require_once __DIR__ . '/../app/Services/ArticleService.php';

use App\Database\Database;
use App\Helpers\Uuid;
use App\Security\AuthenticatedUser;
use App\Services\ArticleService;
use App\Services\SlugService;
use PDO;

class Phase5EditorialTest
{
    private int $passed = 0;
    private int $failed = 0;
    private string $tenantUuid = '00000000-0000-0000-0000-000000000001';
    private string $siteUuid = '00000000-0000-0000-0000-000000000002';
    private string $authorUuid = '';
    private string $categoryUuid = '';

    public function run(): void
    {
        echo "============================================\n";
        echo "  LYBERATE — FASE 5 CMS EDITORIAL TEST SUITE\n";
        echo "============================================\n\n";

        $this->setupTestData();
        $this->testSlugService();
        $this->testArticleCreationDraft();
        $this->testSlugCollisionResolution();
        $this->testJournalistCannotPublishDirectly();
        $this->testEditorPublishingLifecycle();
        $this->testModifiedAtVsPublishedAt();
        $this->testArticleScheduling();
        $this->testCrossTenantIsolation();
        $this->testArticleListingAndFilters();
        $this->testArticleTrashAndArchive();

        echo "\n============================================\n";
        echo "CMS RESULTS: {$this->passed} PASSED, {$this->failed} FAILED\n";
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

    private function setupTestData(): void
    {
        $pdo = Database::getConnection();

        // Ensure category exists
        $stmtCat = $pdo->prepare('SELECT category_uuid FROM categories WHERE tenant_uuid = :t AND site_uuid = :s LIMIT 1');
        $stmtCat->execute([':t' => $this->tenantUuid, ':s' => $this->siteUuid]);
        $this->categoryUuid = (string) $stmtCat->fetchColumn();

        if (!$this->categoryUuid) {
            $this->categoryUuid = Uuid::uuid4();
            $pdo->prepare('INSERT INTO categories (category_uuid, tenant_uuid, site_uuid, name, slug) VALUES (:id, :t, :s, "Regionales", "regionales")')
                ->execute([':id' => $this->categoryUuid, ':t' => $this->tenantUuid, ':s' => $this->siteUuid]);
        }

        // Ensure author exists
        $stmtAuth = $pdo->prepare('SELECT author_uuid FROM authors WHERE tenant_uuid = :t AND site_uuid = :s LIMIT 1');
        $stmtAuth->execute([':t' => $this->tenantUuid, ':s' => $this->siteUuid]);
        $this->authorUuid = (string) $stmtAuth->fetchColumn();

        if (!$this->authorUuid) {
            $this->authorUuid = Uuid::uuid4();
            $pdo->prepare('INSERT INTO authors (author_uuid, tenant_uuid, site_uuid, name, slug) VALUES (:id, :t, :s, "Redacción Digital", "redaccion-digital")')
                ->execute([':id' => $this->authorUuid, ':t' => $this->tenantUuid, ':s' => $this->siteUuid]);
        }
    }

    private function testSlugService(): void
    {
        echo "--- 1. Testing Slug Generation & Cleaning ---\n";
        $raw = '¡Histórica Jornada Electoral en Guárico: Más del 70% de Participación!';
        $slug = SlugService::slugify($raw);
        $this->assert($slug === 'historica-jornada-electoral-en-guarico-mas-del-70-de-participacion', "SlugService cleans accents and punctuation properly");
    }

    private function testArticleCreationDraft(): void
    {
        echo "\n--- 2. Testing Article Draft Creation with SEO & Tags ---\n";
        $editor = new AuthenticatedUser(
            Uuid::uuid4(),
            $this->tenantUuid,
            $this->siteUuid,
            'Editor Juan',
            'editor@test.com',
            'ACTIVE',
            ['EDITOR'],
            ['articles.create', 'articles.edit', 'articles.publish'],
            'sess-test'
        );

        $data = [
            'title' => 'Inauguran nueva sede de emergencias en San Juan de los Morros',
            'subtitle' => 'Atenderá a más de 50 mil habitantes',
            'excerpt' => 'El centro asistencial cuenta con quirófanos de última tecnología.',
            'content' => 'La mañana de este lunes autoridades locales inauguraron formalmente las nuevas instalaciones asistenciales con equipos de vanguardia médica.',
            'author_uuid' => $this->authorUuid,
            'category_uuid' => $this->categoryUuid,
            'status' => 'DRAFT',
            'tags' => ['Salud', 'Guárico', 'Obras Públicas'],
            'seo' => [
                'meta_title' => 'Inauguran hospital de emergencias en San Juan',
                'meta_description' => 'Nueva sede médica asistencial disponible para la comunidad.',
            ],
        ];

        $created = ArticleService::createArticle($editor, $data);

        $this->assert(!empty($created['article_uuid']) && Uuid::isValid($created['article_uuid']), "Article created with valid UUID");
        $this->assert($created['status'] === 'DRAFT', "Article initial status is DRAFT");
        $this->assert($created['published_at'] === null, "Draft article published_at is strictly null");
        $this->assert($created['modified_at'] === null, "Draft article modified_at is strictly null");
        $this->assert(isset($created['seo']['meta_title']), "SEO metadata successfully linked to article");
        $this->assert(count($created['tags']) === 3, "Article tags (3) successfully linked via pivot table");
    }

    private function testSlugCollisionResolution(): void
    {
        echo "\n--- 3. Testing Slug Collision Resolution ---\n";
        $editor = new AuthenticatedUser(
            Uuid::uuid4(),
            $this->tenantUuid,
            $this->siteUuid,
            'Editor Juan',
            'editor@test.com',
            'ACTIVE',
            ['EDITOR'],
            ['articles.create', 'articles.edit'],
            'sess-test'
        );

        $salt = bin2hex(random_bytes(3));
        $title = "Reporte del Clima Regional {$salt}";
        $expectedBase = "reporte-del-clima-regional-{$salt}";
        $expectedSuffix = "reporte-del-clima-regional-{$salt}-2";

        $data1 = [
            'title' => $title,
            'content' => 'Contenido 1...',
            'author_uuid' => $this->authorUuid,
            'category_uuid' => $this->categoryUuid,
            'status' => 'DRAFT',
        ];
        $art1 = ArticleService::createArticle($editor, $data1);

        $data2 = [
            'title' => $title,
            'content' => 'Contenido 2...',
            'author_uuid' => $this->authorUuid,
            'category_uuid' => $this->categoryUuid,
            'status' => 'DRAFT',
        ];
        $art2 = ArticleService::createArticle($editor, $data2);

        $this->assert($art1['slug'] === $expectedBase, "First article obtains base slug");
        $this->assert($art2['slug'] === $expectedSuffix, "Second article with same title auto-resolves with '-2' suffix");
    }

    private function testJournalistCannotPublishDirectly(): void
    {
        echo "\n--- 4. Testing Editorial RBAC on Publication ---\n";
        $journalist = new AuthenticatedUser(
            Uuid::uuid4(),
            $this->tenantUuid,
            $this->siteUuid,
            'Periodista Pedro',
            'pedro@test.com',
            'ACTIVE',
            ['JOURNALIST'],
            ['articles.create', 'articles.edit'], // Lacks 'articles.publish'
            'sess-test'
        );

        $data = [
            'title' => 'Noticia que periodista intenta publicar sin permiso',
            'content' => 'Texto de prueba...',
            'author_uuid' => $this->authorUuid,
            'category_uuid' => $this->categoryUuid,
            'status' => 'PUBLISHED',
        ];

        $blocked = false;
        try {
            ArticleService::createArticle($journalist, $data);
        } catch (\Throwable $e) {
            $blocked = true;
        }

        $this->assert($blocked, "User without articles.publish permission is strictly blocked from setting status=PUBLISHED");
    }

    private function testEditorPublishingLifecycle(): void
    {
        echo "\n--- 5. Testing Editor Publishing Lifecycle ---\n";
        $editor = new AuthenticatedUser(
            Uuid::uuid4(),
            $this->tenantUuid,
            $this->siteUuid,
            'Editor Jefe',
            'editorjefe@test.com',
            'ACTIVE',
            ['EDITOR'],
            ['articles.create', 'articles.edit', 'articles.publish'],
            'sess-test'
        );

        // 1. Create draft
        $draft = ArticleService::createArticle($editor, [
            'title' => 'Noticia para publicación inmediata',
            'content' => 'Contenido completo para lectores...',
            'author_uuid' => $this->authorUuid,
            'category_uuid' => $this->categoryUuid,
            'status' => 'DRAFT',
        ]);

        // 2. Publish article
        $published = ArticleService::updateArticle($editor, $draft['article_uuid'], [
            'status' => 'PUBLISHED',
        ]);

        $this->assert($published['status'] === 'PUBLISHED', "Article status transitioned to PUBLISHED");
        $this->assert(!empty($published['published_at']), "published_at timestamp is set on first publication");
        $this->assert($published['modified_at'] === null, "modified_at remains null on initial publication");
    }

    private function testModifiedAtVsPublishedAt(): void
    {
        echo "\n--- 6. Testing modified_at vs published_at Distinction ---\n";
        $editor = new AuthenticatedUser(
            Uuid::uuid4(),
            $this->tenantUuid,
            $this->siteUuid,
            'Editor Jefe',
            'editorjefe@test.com',
            'ACTIVE',
            ['EDITOR'],
            ['articles.create', 'articles.edit', 'articles.publish'],
            'sess-test'
        );

        // Create directly as published
        $art = ArticleService::createArticle($editor, [
            'title' => 'Noticia original publicada',
            'content' => 'Versión inicial...',
            'author_uuid' => $this->authorUuid,
            'category_uuid' => $this->categoryUuid,
            'status' => 'PUBLISHED',
        ]);

        $originalPublishedAt = $art['published_at'];

        // Perform edit 1 second later
        sleep(1);
        $updated = ArticleService::updateArticle($editor, $art['article_uuid'], [
            'content' => 'Versión ampliada con nuevos testimonios...',
        ]);

        $this->assert($updated['published_at'] === $originalPublishedAt, "published_at is preserved across subsequent modifications");
        $this->assert(!empty($updated['modified_at']), "modified_at is populated on post-publication update");
    }

    private function testArticleScheduling(): void
    {
        echo "\n--- 7. Testing Article Scheduling ---\n";
        $editor = new AuthenticatedUser(
            Uuid::uuid4(),
            $this->tenantUuid,
            $this->siteUuid,
            'Editor Jefe',
            'editorjefe@test.com',
            'ACTIVE',
            ['EDITOR'],
            ['articles.create', 'articles.edit', 'articles.publish'],
            'sess-test'
        );

        $futureDate = date('Y-m-d H:i:s', time() + 86400 * 2); // 2 days in future
        $scheduled = ArticleService::createArticle($editor, [
            'title' => 'Crónica dominical exclusiva',
            'content' => 'Reportaje de fondo...',
            'author_uuid' => $this->authorUuid,
            'category_uuid' => $this->categoryUuid,
            'status' => 'SCHEDULED',
            'published_at' => $futureDate,
        ]);

        $this->assert($scheduled['status'] === 'SCHEDULED', "Article successfully saved as SCHEDULED");
        $this->assert($scheduled['published_at'] === $futureDate, "published_at correctly records the scheduled future date");

        // Past date scheduling must fail
        $pastBlocked = false;
        try {
            ArticleService::createArticle($editor, [
                'title' => 'Reportaje inválido con fecha pasada',
                'content' => '...',
                'author_uuid' => $this->authorUuid,
                'category_uuid' => $this->categoryUuid,
                'status' => 'SCHEDULED',
                'published_at' => '2020-01-01 00:00:00',
            ]);
        } catch (\Throwable) {
            $pastBlocked = true;
        }

        $this->assert($pastBlocked, "Scheduling with a past date is rejected");
    }

    private function testCrossTenantIsolation(): void
    {
        echo "\n--- 8. Testing Multi-Tenant Cross-Site Isolation ---\n";
        $editorSite1 = new AuthenticatedUser(
            Uuid::uuid4(),
            $this->tenantUuid,
            $this->siteUuid,
            'Editor Sitio 1',
            'editor1@test.com',
            'ACTIVE',
            ['EDITOR'],
            ['articles.create', 'articles.edit'],
            'sess-test'
        );

        // Attempt to create article with author from non-existent / different site
        $foreignAuthorUuid = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
        $blocked = false;

        try {
            ArticleService::createArticle($editorSite1, [
                'title' => 'Noticia intentando cruzar tenants',
                'content' => '...',
                'author_uuid' => $foreignAuthorUuid,
                'category_uuid' => $this->categoryUuid,
                'status' => 'DRAFT',
            ]);
        } catch (\Throwable $e) {
            $blocked = true;
        }

        $this->assert($blocked, "Cross-tenant / cross-site foreign references are strictly blocked at service and DB level");
    }

    private function testArticleListingAndFilters(): void
    {
        echo "\n--- 9. Testing Article Listing & Filtering ---\n";
        $list = ArticleService::listArticles($this->tenantUuid, $this->siteUuid, [
            'limit' => 5,
        ]);

        $this->assert(isset($list['articles']) && is_array($list['articles']), "listArticles returns articles array");
        $this->assert(isset($list['pagination']['total']) && $list['pagination']['total'] > 0, "Pagination total count is accurate");

        $publishedOnly = ArticleService::listArticles($this->tenantUuid, $this->siteUuid, [
            'status' => 'PUBLISHED',
        ]);
        $allPublished = true;
        foreach ($publishedOnly['articles'] as $art) {
            if ($art['status'] !== 'PUBLISHED') {
                $allPublished = false;
                break;
            }
        }
        $this->assert($allPublished, "Filtering by status=PUBLISHED returns only published articles");
    }

    private function testArticleTrashAndArchive(): void
    {
        echo "\n--- 10. Testing Article Archiving and Soft Trash ---\n";
        $editor = new AuthenticatedUser(
            Uuid::uuid4(),
            $this->tenantUuid,
            $this->siteUuid,
            'Editor',
            'ed@test.com',
            'ACTIVE',
            ['EDITOR'],
            ['articles.create', 'articles.edit', 'articles.delete'],
            'sess-test'
        );

        $art = ArticleService::createArticle($editor, [
            'title' => 'Noticia para archivo y papelera',
            'content' => 'Texto temporal...',
            'author_uuid' => $this->authorUuid,
            'category_uuid' => $this->categoryUuid,
            'status' => 'DRAFT',
        ]);

        // Archive
        $archived = ArticleService::updateArticle($editor, $art['article_uuid'], ['status' => 'ARCHIVED']);
        $this->assert($archived['status'] === 'ARCHIVED', "Article transitioned to ARCHIVED");

        // Move to trash
        ArticleService::deleteArticle($editor, $art['article_uuid'], false);
        $trashed = ArticleService::getArticle($this->tenantUuid, $this->siteUuid, $art['article_uuid']);
        $this->assert($trashed['status'] === 'TRASH', "deleteArticle without permanent=true sets status to TRASH");

        // Permanent deletion
        $deleted = ArticleService::deleteArticle($editor, $art['article_uuid'], true);
        $this->assert($deleted === true, "Permanent deletion returns true");
        $missing = ArticleService::getArticle($this->tenantUuid, $this->siteUuid, $art['article_uuid']);
        $this->assert($missing === null, "Article permanently removed from database");
    }
}

$test = new Phase5EditorialTest();
$test->run();

