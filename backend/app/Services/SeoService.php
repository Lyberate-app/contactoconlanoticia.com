<?php

declare(strict_types=1);

namespace App\Services;

use App\Database\Database;
use PDO;
use DateTime;
use DateTimeZone;

class SeoService
{
    /**
     * Generate standard sitemap.xml containing home, categories, authors, and published articles.
     */
    public static function generateSitemapXml(string $tenantUuid, string $siteUuid, string $baseUrl): string
    {
        $pdo = Database::getConnection();
        $baseUrl = rtrim($baseUrl, '/');

        // 1. Fetch active categories
        $catStmt = $pdo->prepare("
            SELECT slug, updated_at
            FROM categories
            WHERE tenant_uuid = :t AND site_uuid = :s AND status = 'ACTIVE'
            ORDER BY sort_order ASC
        ");
        $catStmt->execute([':t' => $tenantUuid, ':s' => $siteUuid]);
        $categories = $catStmt->fetchAll(PDO::FETCH_ASSOC);

        // 2. Fetch active authors who have published articles
        $authStmt = $pdo->prepare("
            SELECT DISTINCT au.slug, au.updated_at, au.name
            FROM authors au
            INNER JOIN articles a ON a.author_uuid = au.author_uuid
            WHERE au.tenant_uuid = :t AND au.site_uuid = :s
              AND a.status = 'PUBLISHED'
              AND a.published_at IS NOT NULL
              AND a.published_at <= NOW()
            ORDER BY au.name ASC
        ");
        $authStmt->execute([':t' => $tenantUuid, ':s' => $siteUuid]);
        $authors = $authStmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Fetch all published articles
        $artStmt = $pdo->prepare("
            SELECT slug, published_at, modified_at, updated_at
            FROM articles
            WHERE tenant_uuid = :t AND site_uuid = :s
              AND status = 'PUBLISHED'
              AND published_at IS NOT NULL
              AND published_at <= NOW()
            ORDER BY published_at DESC
        ");
        $artStmt->execute([':t' => $tenantUuid, ':s' => $siteUuid]);
        $articles = $artStmt->fetchAll(PDO::FETCH_ASSOC);

        $nowW3c = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z');

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        // Home
        $xml .= "  <url>\n";
        $xml .= "    <loc>" . htmlspecialchars($baseUrl . '/', ENT_XML1, 'UTF-8') . "</loc>\n";
        $xml .= "    <lastmod>{$nowW3c}</lastmod>\n";
        $xml .= "    <changefreq>hourly</changefreq>\n";
        $xml .= "    <priority>1.0</priority>\n";
        $xml .= "  </url>\n";

        // Categories
        foreach ($categories as $cat) {
            $loc = htmlspecialchars($baseUrl . '/categoria/' . $cat['slug'], ENT_XML1, 'UTF-8');
            $lastmod = self::formatW3cDate($cat['updated_at'] ?? 'now');
            $xml .= "  <url>\n";
            $xml .= "    <loc>{$loc}</loc>\n";
            $xml .= "    <lastmod>{$lastmod}</lastmod>\n";
            $xml .= "    <changefreq>daily</changefreq>\n";
            $xml .= "    <priority>0.8</priority>\n";
            $xml .= "  </url>\n";
        }

        // Authors
        foreach ($authors as $auth) {
            $loc = htmlspecialchars($baseUrl . '/autor/' . $auth['slug'], ENT_XML1, 'UTF-8');
            $lastmod = self::formatW3cDate($auth['updated_at'] ?? 'now');
            $xml .= "  <url>\n";
            $xml .= "    <loc>{$loc}</loc>\n";
            $xml .= "    <lastmod>{$lastmod}</lastmod>\n";
            $xml .= "    <changefreq>weekly</changefreq>\n";
            $xml .= "    <priority>0.6</priority>\n";
            $xml .= "  </url>\n";
        }

        // Articles
        foreach ($articles as $art) {
            $loc = htmlspecialchars($baseUrl . '/noticia/' . $art['slug'], ENT_XML1, 'UTF-8');
            $lastmod = self::formatW3cDate($art['modified_at'] ?? $art['published_at'] ?? $art['updated_at'] ?? 'now');
            $xml .= "  <url>\n";
            $xml .= "    <loc>{$loc}</loc>\n";
            $xml .= "    <lastmod>{$lastmod}</lastmod>\n";
            $xml .= "    <changefreq>monthly</changefreq>\n";
            $xml .= "    <priority>0.9</priority>\n";
            $xml .= "  </url>\n";
        }

        $xml .= '</urlset>';

        return $xml;
    }

    /**
     * Generate Google News sitemap-news.xml for articles published in the last 48 hours.
     * Complies strictly with Google News XML protocol.
     */
    public static function generateNewsSitemapXml(
        string $tenantUuid,
        string $siteUuid,
        string $baseUrl,
        string $publicationName = 'Contacto con la Noticia',
        string $language = 'es'
    ): string {
        $pdo = Database::getConnection();
        $baseUrl = rtrim($baseUrl, '/');

        // Google News specification: articles from the past 48 hours only
        $stmt = $pdo->prepare("
            SELECT a.slug, a.title, a.published_at, a.modified_at
            FROM articles a
            WHERE a.tenant_uuid = :t AND a.site_uuid = :s
              AND a.status = 'PUBLISHED'
              AND a.published_at IS NOT NULL
              AND a.published_at <= NOW()
              AND a.published_at >= DATE_SUB(NOW(), INTERVAL 48 HOUR)
            ORDER BY a.published_at DESC
            LIMIT 1000
        ");
        $stmt->execute([':t' => $tenantUuid, ':s' => $siteUuid]);
        $newsArticles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' . "\n";
        $xml .= '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">' . "\n";

        $pubNameEscaped = htmlspecialchars($publicationName, ENT_XML1, 'UTF-8');
        $langEscaped = htmlspecialchars($language, ENT_XML1, 'UTF-8');

        foreach ($newsArticles as $art) {
            $loc = htmlspecialchars($baseUrl . '/noticia/' . $art['slug'], ENT_XML1, 'UTF-8');
            $pubDate = self::formatW3cDate($art['published_at']);
            $titleEscaped = htmlspecialchars($art['title'], ENT_XML1, 'UTF-8');

            $xml .= "  <url>\n";
            $xml .= "    <loc>{$loc}</loc>\n";
            $xml .= "    <news:news>\n";
            $xml .= "      <news:publication>\n";
            $xml .= "        <news:name>{$pubNameEscaped}</news:name>\n";
            $xml .= "        <news:language>{$langEscaped}</news:language>\n";
            $xml .= "      </news:publication>\n";
            $xml .= "      <news:publication_date>{$pubDate}</news:publication_date>\n";
            $xml .= "      <news:title>{$titleEscaped}</news:title>\n";
            $xml .= "    </news:news>\n";
            $xml .= "  </url>\n";
        }

        $xml .= '</urlset>';

        return $xml;
    }

    /**
     * Generate RSS 2.0 / Atom feed for syndication.
     */
    public static function generateRssFeedXml(
        string $tenantUuid,
        string $siteUuid,
        string $baseUrl,
        string $siteName = 'Contacto con la Noticia',
        string $siteDescription = 'Periódico digital independiente. Información veraz y oportuna de Venezuela y el mundo.'
    ): string {
        $pdo = Database::getConnection();
        $baseUrl = rtrim($baseUrl, '/');

        $stmt = $pdo->prepare("
            SELECT 
                a.slug, a.title, a.subtitle, a.excerpt, a.published_at,
                c.name AS category_name,
                au.name AS author_name
            FROM articles a
            INNER JOIN categories c ON c.category_uuid = a.category_uuid
            INNER JOIN authors au ON au.author_uuid = a.author_uuid
            WHERE a.tenant_uuid = :t AND a.site_uuid = :s
              AND a.status = 'PUBLISHED'
              AND a.published_at IS NOT NULL
              AND a.published_at <= NOW()
            ORDER BY a.published_at DESC
            LIMIT 30
        ");
        $stmt->execute([':t' => $tenantUuid, ':s' => $siteUuid]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $nowRfc = (new DateTime('now', new DateTimeZone('UTC')))->format(DateTime::RFC2822);
        $siteNameEscaped = htmlspecialchars($siteName, ENT_XML1, 'UTF-8');
        $siteDescEscaped = htmlspecialchars($siteDescription, ENT_XML1, 'UTF-8');
        $feedUrlEscaped = htmlspecialchars($baseUrl . '/feed.xml', ENT_XML1, 'UTF-8');
        $siteUrlEscaped = htmlspecialchars($baseUrl . '/', ENT_XML1, 'UTF-8');

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<rss version="2.0"' . "\n";
        $xml .= '     xmlns:atom="http://www.w3.org/2005/Atom"' . "\n";
        $xml .= '     xmlns:dc="http://purl.org/dc/elements/1.1/">' . "\n";
        $xml .= "  <channel>\n";
        $xml .= "    <title>{$siteNameEscaped}</title>\n";
        $xml .= "    <link>{$siteUrlEscaped}</link>\n";
        $xml .= "    <description>{$siteDescEscaped}</description>\n";
        $xml .= "    <language>es-VE</language>\n";
        $xml .= "    <lastBuildDate>{$nowRfc}</lastBuildDate>\n";
        $xml .= "    <atom:link href=\"{$feedUrlEscaped}\" rel=\"self\" type=\"application/rss+xml\" />\n";

        foreach ($items as $it) {
            $itemLink = htmlspecialchars($baseUrl . '/noticia/' . $it['slug'], ENT_XML1, 'UTF-8');
            $itemTitle = htmlspecialchars($it['title'], ENT_XML1, 'UTF-8');
            $pubDateRfc = (new DateTime($it['published_at'], new DateTimeZone('UTC')))->format(DateTime::RFC2822);
            $authorEscaped = htmlspecialchars($it['author_name'], ENT_XML1, 'UTF-8');
            $categoryEscaped = htmlspecialchars($it['category_name'], ENT_XML1, 'UTF-8');
            $descriptionText = $it['excerpt'] ?? $it['subtitle'] ?? $it['title'];

            $xml .= "    <item>\n";
            $xml .= "      <title>{$itemTitle}</title>\n";
            $xml .= "      <link>{$itemLink}</link>\n";
            $xml .= "      <guid isPermaLink=\"true\">{$itemLink}</guid>\n";
            $xml .= "      <pubDate>{$pubDateRfc}</pubDate>\n";
            $xml .= "      <dc:creator>{$authorEscaped}</dc:creator>\n";
            $xml .= "      <category>{$categoryEscaped}</category>\n";
            $xml .= "      <description><![CDATA[" . str_replace(']]>', ']]&gt;', $descriptionText) . "]]></description>\n";
            $xml .= "    </item>\n";
        }

        $xml .= "  </channel>\n";
        $xml .= '</rss>';

        return $xml;
    }

    /**
     * Generate robots.txt content with proper crawler instructions and sitemap pointers.
     */
    public static function generateRobotsTxt(string $baseUrl): string
    {
        $baseUrl = rtrim($baseUrl, '/');

        return "# Lyberate / Contacto con la Noticia robots.txt\n"
             . "User-agent: *\n"
             . "Allow: /\n"
             . "Allow: /categoria/\n"
             . "Allow: /noticia/\n"
             . "Allow: /autor/\n"
             . "Allow: /buscar\n"
             . "Allow: /uploads/\n"
             . "Allow: /api/v1/public/\n"
             . "\n"
             . "# Administrative, Authentication and Internal Endpoints\n"
             . "Disallow: /editorial/\n"
             . "Disallow: /login\n"
             . "Disallow: /api/v1/admin/\n"
             . "Disallow: /api/v1/auth/\n"
             . "\n"
             . "# Sitemaps\n"
             . "Sitemap: {$baseUrl}/sitemap.xml\n"
             . "Sitemap: {$baseUrl}/sitemap-news.xml\n";
    }

    /**
     * Build Schema.org NewsArticle JSON-LD structured data.
     */
    public static function buildNewsArticleSchema(
        array $article,
        string $baseUrl,
        string $siteName = 'Contacto con la Noticia',
        ?string $logoUrl = null
    ): array {
        $baseUrl = rtrim($baseUrl, '/');
        $canonicalUrl = $article['seo']['canonical_url'] ?? ($baseUrl . '/noticia/' . $article['slug']);

        $datePublished = self::formatIsoDate($article['published_at']);
        $dateModified = self::formatIsoDate($article['modified_at'] ?? $article['published_at']);

        $images = [];
        if (!empty($article['featured_media']['url'])) {
            $imgUrl = $article['featured_media']['url'];
            $images[] = str_starts_with($imgUrl, 'http') ? $imgUrl : ($baseUrl . $imgUrl);
        } else {
            $images[] = $baseUrl . '/placeholder-news.jpg';
        }

        $keywords = [];
        if (!empty($article['tags']) && is_array($article['tags'])) {
            foreach ($article['tags'] as $tag) {
                if (is_array($tag) && !empty($tag['name'])) {
                    $keywords[] = $tag['name'];
                } elseif (is_string($tag)) {
                    $keywords[] = $tag;
                }
            }
        }

        return [
            '@context' => 'https://schema.org',
            '@type' => 'NewsArticle',
            'mainEntityOfPage' => [
                '@type' => 'WebPage',
                '@id' => $canonicalUrl,
            ],
            'headline' => $article['title'],
            'description' => $article['seo']['meta_description'] ?? $article['excerpt'] ?? $article['subtitle'] ?? '',
            'image' => $images,
            'datePublished' => $datePublished,
            'dateModified' => $dateModified,
            'author' => [
                '@type' => 'Person',
                'name' => $article['author_name'] ?? 'Redacción Contacto',
                'url' => $baseUrl . '/autor/' . ($article['author_slug'] ?? ''),
            ],
            'publisher' => [
                '@type' => 'NewsMediaOrganization',
                'name' => $siteName,
                'url' => $baseUrl,
                'logo' => [
                    '@type' => 'ImageObject',
                    'url' => $logoUrl ?? ($baseUrl . '/logo.png'),
                ],
            ],
            'articleSection' => $article['category_name'] ?? 'General',
            'keywords' => $keywords,
        ];
    }

    /**
     * Format a database date string to W3C / ISO 8601 (Y-m-d\TH:i:sP).
     */
    public static function formatW3cDate(string $dateStr): string
    {
        try {
            $dt = new DateTime($dateStr, new DateTimeZone('UTC'));
            return $dt->format(DateTime::W3C);
        } catch (\Throwable) {
            return (new DateTime('now', new DateTimeZone('UTC')))->format(DateTime::W3C);
        }
    }

    /**
     * Format a database date string to ISO 8601 string.
     */
    public static function formatIsoDate(string $dateStr): string
    {
        try {
            $dt = new DateTime($dateStr, new DateTimeZone('UTC'));
            return $dt->format('c');
        } catch (\Throwable) {
            return (new DateTime('now', new DateTimeZone('UTC')))->format('c');
        }
    }
}

