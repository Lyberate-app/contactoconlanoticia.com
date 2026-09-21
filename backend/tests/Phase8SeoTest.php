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
use App\Services\SeoService;
use App\Services\PublicArticleService;
use App\Core\Request;
use App\Core\Router;

class Phase8SeoTest
{
    private string $tenantUuid = '00000000-0000-0000-0000-000000000001';
    private string $siteUuid = '00000000-0000-0000-0000-000000000002';
    private string $baseUrl = 'https://contactoconlanoticia.com';
    private int $passed = 0;
    private int $failed = 0;

    public function run(): void
    {
        echo "============================================\n";
        echo "  LYBERATE — FASE 8 SEO & GOOGLE NEWS       \n";
        echo "============================================\n\n";

        $this->testSitemapXml();
        $this->testNewsSitemapXml();
        $this->testRobotsTxt();
        $this->testRssFeedXml();
        $this->testNewsArticleJsonLd();
        $this->testCanonicalUrlIntegrity();
        $this->testRouterEndpoints();

        echo "\n============================================\n";
        echo "SEO TEST RESULTS: {$this->passed} PASSED, {$this->failed} FAILED\n";
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
     * Test 1: Standard sitemap.xml
     */
    private function testSitemapXml(): void
    {
        echo "--- 1. Testing Standard sitemap.xml ---\n";

        $xml = SeoService::generateSitemapXml($this->tenantUuid, $this->siteUuid, $this->baseUrl);

        $this->assert(!empty($xml), "sitemap.xml output is not empty");
        $this->assert(str_starts_with($xml, '<?xml version="1.0" encoding="UTF-8"?>'), "XML declaration is valid");

        // Parse XML to verify well-formed syntax
        $sitemap = simplexml_load_string($xml);
        $this->assert($sitemap !== false, "sitemap.xml is syntactically valid XML");

        $namespaces = $sitemap->getNamespaces(true);
        $this->assert(isset($namespaces['']), "Default sitemap namespace is defined");

        // Verify elements
        $urls = [];
        foreach ($sitemap->url as $urlNode) {
            $urls[] = (string) $urlNode->loc;
        }

        $this->assert(in_array("{$this->baseUrl}/", $urls, true), "Homepage is present in sitemap");
        $this->assert(in_array("{$this->baseUrl}/categoria/regionales", $urls, true), "Category /categoria/regionales is present in sitemap");
        $this->assert(in_array("{$this->baseUrl}/autor/carlos-mendoza", $urls, true), "Active author Carlos Mendoza is present in sitemap");

        // Check published articles present
        $foundArticle = false;
        foreach ($urls as $u) {
            if (str_contains($u, '/noticia/')) {
                $foundArticle = true;
                break;
            }
        }
        $this->assert($foundArticle, "Published articles are indexed in sitemap");

        // Ensure drafts or scheduled articles are NEVER present
        $this->assert(!in_array("{$this->baseUrl}/noticia/noticia-borrador-no-publicada", $urls, true), "Draft articles are strictly excluded from sitemap");
        $this->assert(!in_array("{$this->baseUrl}/noticia/noticia-programada-a-futuro", $urls, true), "Scheduled articles are strictly excluded from sitemap");

        // Verify W3C lastmod on url nodes
        $firstUrl = $sitemap->url[0];
        $this->assert(!empty($firstUrl->lastmod), "lastmod is present in sitemap entries");
        $this->assert(!empty($firstUrl->changefreq), "changefreq is present in sitemap entries");
        $this->assert(!empty($firstUrl->priority), "priority is present in sitemap entries");
    }

    /**
     * Test 2: Google News sitemap-news.xml
     */
    private function testNewsSitemapXml(): void
    {
        echo "\n--- 2. Testing Google News sitemap-news.xml ---\n";

        $pdo = Database::getConnection();

        // Temporarily ensure we have an article within the last 48h for testing
        $stmt = $pdo->prepare("
            UPDATE articles 
            SET published_at = NOW() 
            WHERE tenant_uuid = :t AND site_uuid = :s AND status = 'PUBLISHED' 
            LIMIT 1
        ");
        $stmt->execute([':t' => $this->tenantUuid, ':s' => $this->siteUuid]);

        $xml = SeoService::generateNewsSitemapXml(
            $this->tenantUuid,
            $this->siteUuid,
            $this->baseUrl,
            'Contacto con la Noticia',
            'es'
        );

        $this->assert(!empty($xml), "sitemap-news.xml output is not empty");
        $this->assert(str_contains($xml, 'xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"'), "Google News namespace is properly declared");

        // Load XML and register namespace
        $newsSitemap = simplexml_load_string($xml);
        $this->assert($newsSitemap !== false, "sitemap-news.xml is syntactically valid XML");

        $newsSitemap->registerXPathNamespace('news', 'http://www.google.com/schemas/sitemap-news/0.9');
        $newsNodes = $newsSitemap->xpath('//news:news');
        $this->assert(!empty($newsNodes), "Contains <news:news> elements");

        $pubNames = $newsSitemap->xpath('//news:publication/news:name');
        $this->assert(!empty($pubNames) && (string) $pubNames[0] === 'Contacto con la Noticia', "Google News publication name is 'Contacto con la Noticia'");

        $languages = $newsSitemap->xpath('//news:publication/news:language');
        $this->assert(!empty($languages) && (string) $languages[0] === 'es', "Google News language is 'es'");

        $pubDates = $newsSitemap->xpath('//news:publication_date');
        $this->assert(!empty($pubDates), "Google News publication_date tag is present");

        // Validate ISO 8601 / W3C format of publication_date
        $sampleDate = (string) $pubDates[0];
        $parsedTime = strtotime($sampleDate);
        $this->assert($parsedTime !== false && $parsedTime > 0, "publication_date is a valid timestamp ({$sampleDate})");

        $titles = $newsSitemap->xpath('//news:title');
        $this->assert(!empty($titles) && strlen((string) $titles[0]) > 0, "Google News article title is populated");

        // Verify 48 hour filter: older articles are excluded
        // Artificially create an old published article (> 72 hours ago)
        $oldUuid = 'ffffffff-0000-0000-0000-000000000099';
        $authorUuid = $pdo->query("SELECT author_uuid FROM authors WHERE tenant_uuid = '{$this->tenantUuid}' LIMIT 1")->fetchColumn();
        $catUuid = $pdo->query("SELECT category_uuid FROM categories WHERE tenant_uuid = '{$this->tenantUuid}' LIMIT 1")->fetchColumn();

        $oldStmt = $pdo->prepare("
            INSERT INTO articles (
                article_uuid, tenant_uuid, site_uuid, author_uuid, category_uuid,
                title, slug, content, status, published_at
            ) VALUES (
                :id, :t, :s, :a, :c,
                'Noticia Antigua Mayor a 48 Horas', 'noticia-antigua-mayor-48h',
                'Contenido antiguo', 'PUBLISHED', DATE_SUB(NOW(), INTERVAL 72 HOUR)
            ) ON DUPLICATE KEY UPDATE published_at = DATE_SUB(NOW(), INTERVAL 72 HOUR)
        ");
        $oldStmt->execute([
            ':id' => $oldUuid,
            ':t' => $this->tenantUuid,
            ':s' => $this->siteUuid,
            ':a' => $authorUuid,
            ':c' => $catUuid,
        ]);

        $xmlWithOld = SeoService::generateNewsSitemapXml($this->tenantUuid, $this->siteUuid, $this->baseUrl);
        $this->assert(!str_contains($xmlWithOld, 'noticia-antigua-mayor-48h'), "Articles older than 48 hours are strictly excluded from Google News sitemap");

        // Clean up old test article
        $pdo->exec("DELETE FROM articles WHERE article_uuid = '{$oldUuid}'");
    }

    /**
     * Test 3: robots.txt
     */
    private function testRobotsTxt(): void
    {
        echo "\n--- 3. Testing robots.txt ---\n";

        $robots = SeoService::generateRobotsTxt($this->baseUrl);

        $this->assert(str_contains($robots, 'User-agent: *'), "robots.txt targets User-agent: *");
        $this->assert(str_contains($robots, 'Allow: /'), "robots.txt allows root /");
        $this->assert(str_contains($robots, 'Allow: /noticia/'), "robots.txt allows /noticia/");
        $this->assert(str_contains($robots, 'Allow: /categoria/'), "robots.txt allows /categoria/");
        $this->assert(str_contains($robots, 'Allow: /autor/'), "robots.txt allows /autor/");
        $this->assert(str_contains($robots, 'Allow: /uploads/'), "robots.txt allows /uploads/ media");

        // Disallows
        $this->assert(str_contains($robots, 'Disallow: /editorial/'), "robots.txt disallows /editorial/ backoffice");
        $this->assert(str_contains($robots, 'Disallow: /login'), "robots.txt disallows /login");
        $this->assert(str_contains($robots, 'Disallow: /api/v1/admin/'), "robots.txt disallows /api/v1/admin/");
        $this->assert(str_contains($robots, 'Disallow: /api/v1/auth/'), "robots.txt disallows /api/v1/auth/");

        // Sitemaps pointers
        $this->assert(str_contains($robots, "Sitemap: {$this->baseUrl}/sitemap.xml"), "robots.txt links to standard sitemap.xml");
        $this->assert(str_contains($robots, "Sitemap: {$this->baseUrl}/sitemap-news.xml"), "robots.txt links to Google News sitemap-news.xml");
    }

    /**
     * Test 4: RSS 2.0 / Atom feed
     */
    private function testRssFeedXml(): void
    {
        echo "\n--- 4. Testing RSS 2.0 / Atom Syndication Feed ---\n";

        $xml = SeoService::generateRssFeedXml($this->tenantUuid, $this->siteUuid, $this->baseUrl);

        $this->assert(!empty($xml), "RSS feed is not empty");
        $this->assert(str_contains($xml, '<rss version="2.0"'), "RSS version is 2.0");

        $rss = simplexml_load_string($xml);
        $this->assert($rss !== false, "RSS feed is syntactically valid XML");

        $channel = $rss->channel;
        $this->assert((string) $channel->title === 'Contacto con la Noticia', "RSS channel title is 'Contacto con la Noticia'");
        $this->assert((string) $channel->language === 'es-VE', "RSS channel language is 'es-VE'");
        $this->assert(!empty((string) $channel->lastBuildDate), "RSS channel has lastBuildDate");

        // Verify items
        $this->assert(count($channel->item) > 0, "RSS feed contains news items");
        $firstItem = $channel->item[0];
        $this->assert(!empty((string) $firstItem->title), "RSS item has title");
        $this->assert(str_starts_with((string) $firstItem->link, "{$this->baseUrl}/noticia/"), "RSS item link points to canonical /noticia/{slug}");
        $this->assert((string) $firstItem->guid === (string) $firstItem->link, "RSS item guid is a valid permalink");

        // Verify RFC 2822 pubDate
        $pubDate = (string) $firstItem->pubDate;
        $parsed = strtotime($pubDate);
        $this->assert($parsed !== false && $parsed > 0, "RSS pubDate is valid RFC 2822 format ({$pubDate})");

        // Verify category and description
        $this->assert(!empty((string) $firstItem->category), "RSS item has category");
        $this->assert(!empty((string) $firstItem->description), "RSS item has description");
    }

    /**
     * Test 5: Schema.org NewsArticle JSON-LD
     */
    private function testNewsArticleJsonLd(): void
    {
        echo "\n--- 5. Testing Schema.org NewsArticle JSON-LD ---\n";

        $pdo = Database::getConnection();
        $slug = $pdo->query("
            SELECT slug FROM articles 
            WHERE tenant_uuid = '{$this->tenantUuid}' 
              AND site_uuid = '{$this->siteUuid}' 
              AND status = 'PUBLISHED' 
              AND published_at <= NOW() 
            ORDER BY published_at DESC 
            LIMIT 1
        ")->fetchColumn();

        $this->assert(!empty($slug), "Resolved published article slug: {$slug}");

        $article = PublicArticleService::getArticleBySlug(
            $this->tenantUuid,
            $this->siteUuid,
            (string) $slug
        );

        $this->assert($article !== null, "Found test article '{$slug}'");

        $schema = SeoService::buildNewsArticleSchema($article, $this->baseUrl);

        $this->assert($schema['@context'] === 'https://schema.org', "Schema context is 'https://schema.org'");
        $this->assert($schema['@type'] === 'NewsArticle', "Schema type is 'NewsArticle'");
        $this->assert($schema['headline'] === $article['title'], "Schema headline matches article title");
        $this->assert(!empty($schema['mainEntityOfPage']['@id']), "mainEntityOfPage contains canonical ID URL");
        $this->assert($schema['mainEntityOfPage']['@type'] === 'WebPage', "mainEntityOfPage is of type 'WebPage'");

        // Author
        $this->assert($schema['author']['@type'] === 'Person', "author is of type 'Person'");
        $this->assert($schema['author']['name'] === $article['author_name'], "author name matches article author");
        $this->assert(str_contains($schema['author']['url'], '/autor/'), "author url points to author page");

        // Publisher
        $this->assert($schema['publisher']['@type'] === 'NewsMediaOrganization', "publisher is 'NewsMediaOrganization'");
        $this->assert($schema['publisher']['name'] === 'Contacto con la Noticia', "publisher name is 'Contacto con la Noticia'");
        $this->assert(!empty($schema['publisher']['logo']['url']), "publisher has logo ImageObject");

        // Dates
        $this->assert(!empty($schema['datePublished']), "datePublished is populated");
        $this->assert(!empty($schema['dateModified']), "dateModified is populated");
        $this->assert(strtotime($schema['datePublished']) !== false, "datePublished is a valid ISO 8601 date");
        $this->assert(strtotime($schema['dateModified']) !== false, "dateModified is a valid ISO 8601 date");

        // Images array
        $this->assert(is_array($schema['image']) && count($schema['image']) > 0, "image is a non-empty array");

        // JSON serialization
        $jsonString = json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $this->assert($jsonString !== false && strlen($jsonString) > 100, "Schema serializes to valid JSON-LD string");
    }

    /**
     * Test 6: Canonical URLs integrity
     */
    private function testCanonicalUrlIntegrity(): void
    {
        echo "\n--- 6. Testing Canonical URLs Integrity ---\n";

        $pdo = Database::getConnection();
        $articles = $pdo->query("
            SELECT slug FROM articles 
            WHERE tenant_uuid = '{$this->tenantUuid}' AND status = 'PUBLISHED' 
            LIMIT 5
        ")->fetchAll(PDO::FETCH_COLUMN);

        $allValid = true;
        foreach ($articles as $slug) {
            $expected = "{$this->baseUrl}/noticia/{$slug}";
            if (!preg_match('#^https://contactoconlanoticia\.com/noticia/[a-z0-9-]+$#', $expected)) {
                $allValid = false;
                break;
            }
        }

        $this->assert($allValid, "All canonical article URLs are clean, lowercase, hyphenated and parameter-free");
    }

    /**
     * Test 7: Router endpoints integration
     */
    private function testRouterEndpoints(): void
    {
        echo "\n--- 7. Testing Router Endpoints Integration ---\n";

        $router = new Router();
        require __DIR__ . '/../routes/api.php';

        $routes = [
            '/sitemap.xml',
            '/sitemap-news.xml',
            '/feed.xml',
            '/rss.xml',
            '/feed',
            '/robots.txt',
            '/api/v1/public/seo/article/{slug}',
        ];

        $pdo = Database::getConnection();
        $realSlug = $pdo->query("SELECT slug FROM articles WHERE tenant_uuid = '{$this->tenantUuid}' AND status = 'PUBLISHED' LIMIT 1")->fetchColumn() ?: 'sample-slug';

        foreach ($routes as $routePath) {
            // Check matching via router
            $cleanPath = str_replace('{slug}', (string) $realSlug, $routePath);
            $req = new Request('GET', $cleanPath, [
                'x-tenant-id' => $this->tenantUuid,
                'x-site-id' => $this->siteUuid,
            ]);

            // Dispatch and capture output buffer
            ob_start();
            $router->dispatch($req);
            $output = ob_get_clean();

            $this->assert(!empty($output), "Route {$routePath} responded with non-empty payload");
        }
    }
}

// Run tests
$test = new Phase8SeoTest();
$test->run();
