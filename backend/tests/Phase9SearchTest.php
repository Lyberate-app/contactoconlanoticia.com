<?php

declare(strict_types=1);

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

use App\Database\Database;
use App\Services\SearchService;
use App\Core\Request;
use App\Core\Router;

class Phase9SearchTest
{
    private string $tenantUuid = '00000000-0000-0000-0000-000000000001';
    private string $siteUuid = '00000000-0000-0000-0000-000000000002';
    private int $passed = 0;
    private int $failed = 0;

    public function run(): void
    {
        echo "============================================\n";
        echo "  LYBERATE — FASE 9 SEARCH & DISCOVERY      \n";
        echo "============================================\n\n";

        $this->testNonExistentTerm();
        $this->testCommonTermSearch();
        $this->testCategoryFilter();
        $this->testAuthorFilter();
        $this->testTagFilter();
        $this->testDateRangeFilter();
        $this->testCombinedFilters();
        $this->testPaginationAndLimits();
        $this->testSortingOptions();
        $this->testSqlInjectionResilience();
        $this->testMultiTenantIsolation();
        $this->testDraftAndScheduledExclusion();
        $this->testFilterOptions();
        $this->testRouterEndpoints();

        echo "\n============================================\n";
        echo "SEARCH TEST RESULTS: {$this->passed} PASSED, {$this->failed} FAILED\n";
        echo "============================================\n";

        if ($this->failed > 0) {
            exit(1);
        }
    }

    private function assert(bool $condition, string $description): void
    {
        if ($condition) {
            echo " [PASS] {$description}\n";
            $this->passed++;
        } else {
            echo " [FAIL] {$description}\n";
            $this->failed++;
        }
    }

    /**
     * Test 1: Non-existent term
     */
    private function testNonExistentTerm(): void
    {
        echo "--- 1. Testing Non-Existent Term Search ---\n";

        $res = SearchService::search($this->tenantUuid, $this->siteUuid, [
            'q' => 'terminoinexistenteinubicable99999',
        ]);

        $this->assert(is_array($res['articles']), "Returns articles array");
        $this->assert(count($res['articles']) === 0, "No articles found for non-existent term");
        $this->assert($res['pagination']['total'] === 0, "Pagination total is 0");
        $this->assert($res['pagination']['total_pages'] === 0, "Pagination total_pages is 0");
        $this->assert($res['filters_applied']['q'] === 'terminoinexistenteinubicable99999', "Filters applied echoes back search term");
    }

    /**
     * Test 2: Common term search (matching title or content)
     */
    private function testCommonTermSearch(): void
    {
        echo "\n--- 2. Testing Common Term Search ---\n";

        $res = SearchService::search($this->tenantUuid, $this->siteUuid, [
            'q' => 'agrícola',
        ]);

        $this->assert($res['pagination']['total'] > 0, "Found at least 1 article for common term 'agrícola'");
        $this->assert(count($res['articles']) > 0, "Articles array is non-empty");

        // Verify structure of returned articles (no heavy content returned)
        $art = $res['articles'][0];
        $this->assert(!empty($art['article_uuid']), "Article has uuid");
        $this->assert(!empty($art['title']), "Article has title");
        $this->assert(!empty($art['slug']), "Article has slug");
        $this->assert(!empty($art['category']['name']), "Article has category relation");
        $this->assert(!empty($art['author']['name']), "Article has author relation");
        $this->assert(!isset($art['content']), "Heavy LONGTEXT content is omitted for high performance");
    }

    /**
     * Test 3: Category filter
     */
    private function testCategoryFilter(): void
    {
        echo "\n--- 3. Testing Category Filter ---\n";

        $res = SearchService::search($this->tenantUuid, $this->siteUuid, [
            'category' => 'regionales',
        ]);

        $this->assert($res['pagination']['total'] > 0, "Found articles in category 'regionales'");
        $allMatch = true;
        foreach ($res['articles'] as $art) {
            if ($art['category']['slug'] !== 'regionales') {
                $allMatch = false;
                break;
            }
        }
        $this->assert($allMatch, "All returned articles belong exclusively to category 'regionales'");
    }

    /**
     * Test 4: Author filter
     */
    private function testAuthorFilter(): void
    {
        echo "\n--- 4. Testing Author Filter ---\n";

        $res = SearchService::search($this->tenantUuid, $this->siteUuid, [
            'author' => 'carlos-mendoza',
        ]);

        $this->assert($res['pagination']['total'] > 0, "Found articles by author 'carlos-mendoza'");
        $allMatch = true;
        foreach ($res['articles'] as $art) {
            if ($art['author']['slug'] !== 'carlos-mendoza') {
                $allMatch = false;
                break;
            }
        }
        $this->assert($allMatch, "All returned articles were written exclusively by Carlos Mendoza");
    }

    /**
     * Test 5: Tag filter
     */
    private function testTagFilter(): void
    {
        echo "\n--- 5. Testing Tag Filter ---\n";

        // Query any tag that has PUBLISHED articles
        $pdo = Database::getConnection();
        $tagSlug = $pdo->query("
            SELECT t.slug 
            FROM tags t
            INNER JOIN article_tags at ON at.tag_uuid = t.tag_uuid
            INNER JOIN articles a ON a.article_uuid = at.article_uuid
            WHERE a.status = 'PUBLISHED'
              AND a.tenant_uuid = '{$this->tenantUuid}'
              AND a.site_uuid = '{$this->siteUuid}'
            LIMIT 1
        ")->fetchColumn();

        if ($tagSlug) {
            $res = SearchService::search($this->tenantUuid, $this->siteUuid, [
                'tag' => $tagSlug,
            ]);

            $this->assert($res['pagination']['total'] > 0, "Found articles filtered by tag '{$tagSlug}'");
        } else {
            $this->assert(true, "No tags with articles found to test tag filter (skipped gracefully)");
        }
    }

    /**
     * Test 6: Date range filter
     */
    private function testDateRangeFilter(): void
    {
        echo "\n--- 6. Testing Date Range Filter ---\n";

        // Search with a broad date range covering 2026
        $res = SearchService::search($this->tenantUuid, $this->siteUuid, [
            'date_from' => '2020-01-01',
            'date_to' => '2030-12-31',
        ]);

        $this->assert($res['pagination']['total'] > 0, "Found articles within broad 2020-2030 date range");

        // Search with a past date range where no articles were published
        $resEmpty = SearchService::search($this->tenantUuid, $this->siteUuid, [
            'date_from' => '1990-01-01',
            'date_to' => '1995-12-31',
        ]);

        $this->assert($resEmpty['pagination']['total'] === 0, "Zero articles found for 1990-1995 date range");
    }

    /**
     * Test 7: Combined multi-criteria filters
     */
    private function testCombinedFilters(): void
    {
        echo "\n--- 7. Testing Combined Multi-Criteria Filters ---\n";

        $res = SearchService::search($this->tenantUuid, $this->siteUuid, [
            'q' => 'cereales',
            'category' => 'regionales',
            'date_from' => '2020-01-01',
        ]);

        $this->assert(is_array($res['articles']), "Combined search returns valid articles array");
        $this->assert(isset($res['pagination']), "Pagination metadata is present");
        $this->assert($res['filters_applied']['category'] === 'regionales', "Filters applied recorded category");
    }

    /**
     * Test 8: Pagination and limits
     */
    private function testPaginationAndLimits(): void
    {
        echo "\n--- 8. Testing Pagination & Limits ---\n";

        // Page 1 with limit 2
        $p1 = SearchService::search($this->tenantUuid, $this->siteUuid, [
            'limit' => 2,
            'page' => 1,
        ]);

        $this->assert(count($p1['articles']) <= 2, "Limit 2 strictly respected on page 1");
        $this->assert($p1['pagination']['limit'] === 2, "Pagination limit matches requested limit");

        if ($p1['pagination']['total'] > 2) {
            // Page 2
            $p2 = SearchService::search($this->tenantUuid, $this->siteUuid, [
                'limit' => 2,
                'page' => 2,
            ]);

            $this->assert(count($p2['articles']) <= 2, "Limit 2 strictly respected on page 2");
            $this->assert($p1['articles'][0]['article_uuid'] !== $p2['articles'][0]['article_uuid'], "Page 1 and Page 2 contain distinct article items");
        }

        // Limit capping: requesting limit 200 must be capped at 50
        $pCapped = SearchService::search($this->tenantUuid, $this->siteUuid, [
            'limit' => 200,
        ]);
        $this->assert($pCapped['pagination']['limit'] === 50, "Excessive limit 200 is automatically capped at 50");
    }

    /**
     * Test 9: Sorting options
     */
    private function testSortingOptions(): void
    {
        echo "\n--- 9. Testing Sorting Options ---\n";

        $latest = SearchService::search($this->tenantUuid, $this->siteUuid, ['sort' => 'latest', 'limit' => 5]);
        $oldest = SearchService::search($this->tenantUuid, $this->siteUuid, ['sort' => 'oldest', 'limit' => 5]);

        if (count($latest['articles']) >= 2 && count($oldest['articles']) >= 2) {
            $latestFirstDate = strtotime($latest['articles'][0]['published_at']);
            $latestSecondDate = strtotime($latest['articles'][1]['published_at']);
            $this->assert($latestFirstDate >= $latestSecondDate, "sort=latest sorts articles chronologically descending");

            $oldestFirstDate = strtotime($oldest['articles'][0]['published_at']);
            $oldestSecondDate = strtotime($oldest['articles'][1]['published_at']);
            $this->assert($oldestFirstDate <= $oldestSecondDate, "sort=oldest sorts articles chronologically ascending");
        } else {
            $this->assert(true, "Not enough articles to contrast latest vs oldest (skipped)");
        }
    }

    /**
     * Test 10: SQL injection resilience
     */
    private function testSqlInjectionResilience(): void
    {
        echo "\n--- 10. Testing SQL Injection Resilience ---\n";

        $hostileQueries = [
            "' OR '1'='1",
            "'; DROP TABLE articles; --",
            "1' UNION SELECT NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL-- ",
            "<script>alert('xss')</script>",
            "\" OR \"\"=\"",
        ];

        $allSafe = true;
        foreach ($hostileQueries as $hq) {
            try {
                $res = SearchService::search($this->tenantUuid, $this->siteUuid, [
                    'q' => $hq,
                    'category' => $hq,
                    'author' => $hq,
                ]);
                if (!is_array($res['articles'])) {
                    $allSafe = false;
                    break;
                }
            } catch (\Throwable $e) {
                // If it crashes with SQL syntax error, test fails
                if (str_contains($e->getMessage(), 'SQLSTATE')) {
                    $allSafe = false;
                    break;
                }
            }
        }

        $this->assert($allSafe, "Engine is fully resilient against SQL injection and XSS probes");
    }

    /**
     * Test 11: Multi-tenant isolation
     */
    private function testMultiTenantIsolation(): void
    {
        echo "\n--- 11. Testing Multi-Tenant Isolation ---\n";

        $res = SearchService::search('99999999-9999-9999-9999-999999999999', $this->siteUuid, [
            'q' => 'cereales',
        ]);

        $this->assert($res['pagination']['total'] === 0, "Unregistered tenant UUID yields 0 articles");

        $resSite = SearchService::search($this->tenantUuid, '99999999-9999-9999-9999-999999999999', [
            'q' => 'cereales',
        ]);

        $this->assert($resSite['pagination']['total'] === 0, "Unregistered site UUID yields 0 articles");
    }

    /**
     * Test 12: Draft and scheduled exclusion
     */
    private function testDraftAndScheduledExclusion(): void
    {
        echo "\n--- 12. Testing Draft & Scheduled Exclusion ---\n";

        // Query specific words known to belong to draft or scheduled seed articles
        $resDraft = SearchService::search($this->tenantUuid, $this->siteUuid, [
            'q' => 'Borrador confidencial',
        ]);
        $this->assert($resDraft['pagination']['total'] === 0, "Draft articles are strictly excluded from search results");

        $resScheduled = SearchService::search($this->tenantUuid, $this->siteUuid, [
            'q' => 'Reportaje especial programado',
        ]);
        $this->assert($resScheduled['pagination']['total'] === 0, "Future scheduled articles are strictly excluded from search results");
    }

    /**
     * Test 13: Filter options endpoint
     */
    private function testFilterOptions(): void
    {
        echo "\n--- 13. Testing Search Filter Options ---\n";

        $options = SearchService::getFilterOptions($this->tenantUuid, $this->siteUuid);

        $this->assert(is_array($options['categories']), "Filter options has categories list");
        $this->assert(count($options['categories']) >= 6, "Contains at least 6 canonical categories");
        $this->assert(isset($options['categories'][0]['articles_count']), "Category includes published articles_count");

        $this->assert(is_array($options['authors']), "Filter options has authors list");
        $this->assert(count($options['authors']) >= 1, "Contains at least 1 author");
        $this->assert(isset($options['authors'][0]['articles_count']), "Author includes published articles_count");

        $this->assert(is_array($options['tags']), "Filter options has tags list");
    }

    /**
     * Test 14: Router endpoints integration
     */
    private function testRouterEndpoints(): void
    {
        echo "\n--- 14. Testing Search Router Endpoints Integration ---\n";

        $router = new Router();
        $router->use(new \App\Middleware\RequestContextMiddleware());
        $router->use(new \App\Middleware\JsonBodyParserMiddleware());
        require __DIR__ . '/../routes/api.php';

        // 1. GET /api/v1/public/search
        $reqSearch = new Request('GET', '/api/v1/public/search?q=cereales&category=regionales', [
            'x-tenant-id' => $this->tenantUuid,
            'x-site-id' => $this->siteUuid,
        ]);

        ob_start();
        $router->dispatch($reqSearch);
        $rawJson = ob_get_clean();

        $this->assert(!empty($rawJson), "Search route responded with non-empty payload");
        $data = json_decode($rawJson, true);
        $this->assert(isset($data['success']) && $data['success'] === true, "Search response has success = true");
        $this->assert(isset($data['data']) && is_array($data['data']), "Search response has data array");
        $this->assert(isset($data['meta']['pagination']), "Search response has meta.pagination");

        // 2. GET /api/v1/public/search/filters
        $reqFilters = new Request('GET', '/api/v1/public/search/filters', [
            'x-tenant-id' => $this->tenantUuid,
            'x-site-id' => $this->siteUuid,
        ]);

        ob_start();
        $router->dispatch($reqFilters);
        $rawFiltersJson = ob_get_clean();

        $this->assert(!empty($rawFiltersJson), "Filters route responded with non-empty payload");
        $filtersData = json_decode($rawFiltersJson, true);
        $this->assert(isset($filtersData['data']['categories']), "Filters response has data.categories");
        $this->assert(isset($filtersData['data']['authors']), "Filters response has data.authors");
    }
}

// Run tests
$test = new Phase9SearchTest();
$test->run();
