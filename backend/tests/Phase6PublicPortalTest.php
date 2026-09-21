<?php

declare(strict_types=1);

require_once __DIR__ . '/../app/Core/Env.php';
require_once __DIR__ . '/../app/Database/Database.php';
require_once __DIR__ . '/../app/Helpers/Uuid.php';
require_once __DIR__ . '/../app/Helpers/Sanitizer.php';
require_once __DIR__ . '/../app/Validation/Validator.php';
require_once __DIR__ . '/../app/Core/Request.php';
require_once __DIR__ . '/../app/Core/Response.php';
require_once __DIR__ . '/../app/Middleware/MiddlewareInterface.php';
require_once __DIR__ . '/../app/Middleware/RequestContextMiddleware.php';
require_once __DIR__ . '/../app/Middleware/JsonBodyParserMiddleware.php';
require_once __DIR__ . '/../app/Core/Router.php';
require_once __DIR__ . '/../app/Security/AuthenticatedUser.php';
require_once __DIR__ . '/../app/Security/Password.php';
require_once __DIR__ . '/../app/Security/Totp.php';
require_once __DIR__ . '/../app/Security/WebAuthn.php';
require_once __DIR__ . '/../app/Security/RateLimiter.php';
require_once __DIR__ . '/../app/Services/AuditService.php';
require_once __DIR__ . '/../app/Services/AuthService.php';
require_once __DIR__ . '/../app/Services/SlugService.php';
require_once __DIR__ . '/../app/Services/ArticleService.php';
require_once __DIR__ . '/../app/Services/PublicArticleService.php';
require_once __DIR__ . '/../app/Middleware/AuthMiddleware.php';
require_once __DIR__ . '/../app/Middleware/RequirePermissionMiddleware.php';
require_once __DIR__ . '/../app/Controllers/HealthController.php';
require_once __DIR__ . '/../app/Controllers/AuthController.php';
require_once __DIR__ . '/../app/Controllers/ArticleController.php';
require_once __DIR__ . '/../app/Controllers/EditorialTaxonomyController.php';
require_once __DIR__ . '/../app/Controllers/PublicArticleController.php';

use App\Core\Env;
use App\Core\Request;
use App\Core\Response;
use App\Core\Router;
use App\Database\Database;
use App\Middleware\JsonBodyParserMiddleware;
use App\Middleware\RequestContextMiddleware;
use App\Services\PublicArticleService;

class Phase6PublicPortalTest
{
    private int $passed = 0;
    private int $failed = 0;
    private string $tenantUuid = '00000000-0000-0000-0000-000000000001';
    private string $siteUuid = '00000000-0000-0000-0000-000000000002';

    public function __construct()
    {
        Env::load(__DIR__ . '/../.env');
    }

    public function run(): void
    {
        echo "============================================\n";
        echo "  LYBERATE — FASE 6 PUBLIC PORTAL TEST SUITE\n";
        echo "============================================\n\n";

        $this->testHomeFeed();
        $this->testArticleBySlugSuccess();
        $this->testUnpublishedArticlesBlocked();
        $this->testCategoriesList();
        $this->testCategoryBySlug();
        $this->testAuthorBySlug();
        $this->testSearchArticles();
        $this->testMultiTenantIsolation();
        $this->testRouterEndpoints();

        echo "\n============================================\n";
        echo "PUBLIC PORTAL RESULTS: {$this->passed} PASSED, {$this->failed} FAILED\n";
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

    private function testHomeFeed(): void
    {
        echo "--- 1. Testing Home Feed Composition & Filtering ---\n";
        $feed = PublicArticleService::getHomeFeed($this->tenantUuid, $this->siteUuid);

        $this->assert(is_array($feed['breaking_news']), "Home feed returns breaking_news array");
        $this->assert($feed['lead_article'] !== null, "Home feed has a valid lead_article");
        $this->assert(!empty($feed['lead_article']['title']), "Lead article has non-empty title");
        $this->assert(!empty($feed['lead_article']['category_name']), "Lead article includes category relation");
        $this->assert(!empty($feed['lead_article']['author_name']), "Lead article includes author relation");
        $this->assert(is_array($feed['secondary_articles']), "Home feed returns secondary_articles array");
        $this->assert(is_array($feed['latest_articles']), "Home feed returns latest_articles array");
        $this->assert(is_array($feed['trending_articles']), "Home feed returns trending_articles array");
        $this->assert(is_array($feed['sections']), "Home feed returns section highlights array");

        // Rigorously verify that draft or scheduled articles NEVER leak into home feed
        $allTitles = [];
        if ($feed['lead_article']) {
            $allTitles[] = $feed['lead_article']['title'];
        }
        foreach ($feed['breaking_news'] as $art) {
            $allTitles[] = $art['title'];
        }
        foreach ($feed['secondary_articles'] as $art) {
            $allTitles[] = $art['title'];
        }
        foreach ($feed['latest_articles'] as $art) {
            $allTitles[] = $art['title'];
        }

        $hasDraft = false;
        $hasScheduled = false;
        foreach ($allTitles as $title) {
            if (str_contains($title, 'Borrador confidencial')) {
                $hasDraft = true;
            }
            if (str_contains($title, 'Reportaje especial programado')) {
                $hasScheduled = true;
            }
        }

        $this->assert(!$hasDraft, "DRAFT articles are strictly excluded from Home feed");
        $this->assert(!$hasScheduled, "SCHEDULED articles are strictly excluded from Home feed");
    }

    private function testArticleBySlugSuccess(): void
    {
        echo "\n--- 2. Testing Public Article By Slug ---\n";
        $slug = 'plan-integral-de-reactivacion-agricola-busca-elevar-la-siembra-de-cereales-en-el-estado-guarico';
        $article = PublicArticleService::getArticleBySlug($this->tenantUuid, $this->siteUuid, $slug);

        $this->assert($article !== null, "Published article is retrieved successfully by slug");
        $this->assert($article['status'] === 'PUBLISHED', "Retrieved article status is PUBLISHED");
        $this->assert(!empty($article['author_name']), "Article contains author name");
        $this->assert(!empty($article['author_bio']), "Article contains author bio");
        $this->assert(!empty($article['category_name']), "Article contains category name");
        $this->assert(isset($article['seo']), "Article includes SEO metadata");
        $this->assert(is_array($article['tags']), "Article includes tags list");
        $this->assert(is_array($article['related_articles']), "Article includes related_articles array");

        // Verify related articles do not contain the main article itself
        $selfInRelated = false;
        foreach ($article['related_articles'] as $rel) {
            if ($rel['article_uuid'] === $article['article_uuid']) {
                $selfInRelated = true;
                break;
            }
        }
        $this->assert(!$selfInRelated, "Related articles strictly exclude the current article itself");
    }

    private function testUnpublishedArticlesBlocked(): void
    {
        echo "\n--- 3. Testing Protection of Unpublished and Non-Existent Articles ---\n";
        // 1. DRAFT article by slug
        $draft = PublicArticleService::getArticleBySlug(
            $this->tenantUuid,
            $this->siteUuid,
            'borrador-confidencial-sobre-proyectos-de-infraestructura-no-aprobados'
        );
        $this->assert($draft === null, "PublicArticleService returns null for DRAFT articles");

        // 2. SCHEDULED article by slug (future date)
        $scheduled = PublicArticleService::getArticleBySlug(
            $this->tenantUuid,
            $this->siteUuid,
            'reportaje-especial-programado-para-el-proximo-mes'
        );
        $this->assert($scheduled === null, "PublicArticleService returns null for future SCHEDULED articles");

        // 3. Completely non-existent slug
        $missing = PublicArticleService::getArticleBySlug(
            $this->tenantUuid,
            $this->siteUuid,
            'slug-completamente-ficticio-que-jamas-ha-existido'
        );
        $this->assert($missing === null, "PublicArticleService returns null for non-existent slug");
    }

    private function testCategoriesList(): void
    {
        echo "\n--- 4. Testing Public Categories List & Article Counts ---\n";
        $categories = PublicArticleService::getCategories($this->tenantUuid, $this->siteUuid);

        $this->assert(count($categories) >= 6, "At least 6 categories returned for Contacto con la Noticia");

        $slugs = array_column($categories, 'slug');
        $this->assert(in_array('regionales', $slugs, true), "Category 'regionales' exists");
        $this->assert(in_array('sucesos', $slugs, true), "Category 'sucesos' exists");
        $this->assert(in_array('comunidades', $slugs, true), "Category 'comunidades' exists");
        $this->assert(in_array('municipales', $slugs, true), "Category 'municipales' exists");
        $this->assert(in_array('turismo', $slugs, true), "Category 'turismo' exists");
        $this->assert(in_array('internacionales', $slugs, true), "Category 'internacionales' exists");

        $hasCountField = isset($categories[0]['articles_count']);
        $this->assert($hasCountField, "Categories include articles_count field");
    }

    private function testCategoryBySlug(): void
    {
        echo "\n--- 5. Testing Public Category By Slug & 404 ---\n";
        $catData = PublicArticleService::getCategoryBySlug($this->tenantUuid, $this->siteUuid, 'regionales');

        $this->assert($catData !== null, "Valid category slug 'regionales' returns category data");
        $this->assert($catData['category']['slug'] === 'regionales', "Category data contains correct slug");
        $this->assert(is_array($catData['articles']), "Category data contains articles array");
        $this->assert(isset($catData['pagination']['total']), "Category data contains pagination metadata");

        $missingCat = PublicArticleService::getCategoryBySlug($this->tenantUuid, $this->siteUuid, 'categoria-falsa-404');
        $this->assert($missingCat === null, "Non-existent category slug returns null");
    }

    private function testAuthorBySlug(): void
    {
        echo "\n--- 6. Testing Public Author By Slug & 404 ---\n";
        $authorData = PublicArticleService::getAuthorBySlug($this->tenantUuid, $this->siteUuid, 'carlos-mendoza');

        $this->assert($authorData !== null, "Valid author slug 'carlos-mendoza' returns author data");
        $this->assert($authorData['author']['name'] === 'Carlos Mendoza', "Author data contains correct name");
        $this->assert(!empty($authorData['author']['bio']), "Author data contains bio");
        $this->assert(is_array($authorData['articles']), "Author data contains published articles array");

        $missingAuthor = PublicArticleService::getAuthorBySlug($this->tenantUuid, $this->siteUuid, 'autor-inexistente-404');
        $this->assert($missingAuthor === null, "Non-existent author slug returns null");
    }

    private function testSearchArticles(): void
    {
        echo "\n--- 7. Testing SQL Search & Empty Results ---\n";
        $searchResult = PublicArticleService::searchArticles($this->tenantUuid, $this->siteUuid, 'Guárico');

        $this->assert($searchResult['pagination']['total'] > 0, "Search for 'Guárico' returns matching articles");
        $this->assert(count($searchResult['articles']) > 0, "Articles array contains search results");

        $emptyResult = PublicArticleService::searchArticles($this->tenantUuid, $this->siteUuid, 'palabra_totalmente_inexistente_xyz_123');
        $this->assert($emptyResult['pagination']['total'] === 0, "Search for non-existent keyword returns 0 total");
        $this->assert(empty($emptyResult['articles']), "Articles array is empty for non-existent query");

        $blankResult = PublicArticleService::searchArticles($this->tenantUuid, $this->siteUuid, '   ');
        $this->assert($blankResult['pagination']['total'] === 0, "Empty/whitespace query gracefully returns 0 total");
    }

    private function testMultiTenantIsolation(): void
    {
        echo "\n--- 8. Testing Multi-Tenant Cross-Site Isolation ---\n";
        $foreignSiteUuid = '00000000-0000-0000-0000-999999999999';

        $foreignFeed = PublicArticleService::getHomeFeed($this->tenantUuid, $foreignSiteUuid);
        $this->assert($foreignFeed['lead_article'] === null, "Querying Home with foreign site UUID returns empty lead article");
        $this->assert(empty($foreignFeed['breaking_news']), "Foreign site returns empty breaking_news");

        $foreignArticle = PublicArticleService::getArticleBySlug(
            $this->tenantUuid,
            $foreignSiteUuid,
            'plan-integral-de-reactivacion-agricola-busca-elevar-la-siembra-de-cereales-en-el-estado-guarico'
        );
        $this->assert($foreignArticle === null, "Article cannot be queried across a different site UUID");
    }

    private function testRouterEndpoints(): void
    {
        echo "\n--- 9. Testing HTTP Router Integration & Auto Site Resolution ---\n";
        $router = new Router();
        $router->use(new RequestContextMiddleware());
        $router->use(new JsonBodyParserMiddleware());

        require __DIR__ . '/../routes/api.php';

        // 1. GET /api/v1/public/home without any explicit tenant headers (auto site resolution test)
        $reqHome = new Request('GET', '/api/v1/public/home', [
            'host' => 'contactoconlanoticia.com',
        ]);

        ob_start();
        $router->dispatch($reqHome);
        $homeOutput = ob_get_clean();

        $homeJson = json_decode($homeOutput, true);
        $this->assert(is_array($homeJson), "GET /api/v1/public/home returns valid JSON");
        $this->assert($homeJson['success'] === true, "GET /api/v1/public/home response has success: true");
        $this->assert(isset($homeJson['data']['lead_article']), "Home response data contains lead_article");

        // 2. GET /api/v1/public/articles/non-existent-slug -> 404
        $req404 = new Request('GET', '/api/v1/public/articles/non-existent-slug-xyz', [
            'host' => 'contactoconlanoticia.com',
        ]);

        ob_start();
        $router->dispatch($req404);
        $output404 = ob_get_clean();

        $json404 = json_decode($output404, true);
        $this->assert($json404['success'] === false, "Non-existent article slug returns success: false");
        $this->assert($json404['error']['code'] === 'ARTICLE_NOT_FOUND', "Error code is ARTICLE_NOT_FOUND");
    }
}

$test = new Phase6PublicPortalTest();
$test->run();
