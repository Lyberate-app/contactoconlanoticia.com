<?php

declare(strict_types=1);

namespace App\Services;

use App\Database\Database;
use PDO;

class PublicArticleService
{
    /**
     * Get structured editorial Home feed.
     *
     * @return array{
     *     breaking_news: array<int, array>,
     *     lead_article: array|null,
     *     secondary_articles: array<int, array>,
     *     latest_articles: array<int, array>,
     *     trending_articles: array<int, array>,
     *     sections: array<string, array{category: array, articles: array<int, array>}>
     * }
     */
    public static function getHomeFeed(string $tenantUuid, string $siteUuid): array
    {
        $pdo = Database::getConnection();

        // 1. Fetch recent published articles (up to 15)
        $sql = "
            SELECT 
                a.article_uuid,
                a.title,
                a.subtitle,
                a.excerpt,
                a.slug,
                a.published_at,
                a.modified_at,
                c.category_uuid,
                c.name AS category_name,
                c.slug AS category_slug,
                au.author_uuid,
                au.name AS author_name,
                au.slug AS author_slug
            FROM articles a
            INNER JOIN categories c ON c.category_uuid = a.category_uuid
            INNER JOIN authors au ON au.author_uuid = a.author_uuid
            WHERE a.tenant_uuid = :t
              AND a.site_uuid = :s
              AND a.status = 'PUBLISHED'
              AND a.published_at IS NOT NULL
              AND a.published_at <= NOW()
            ORDER BY a.published_at DESC
            LIMIT 15
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([':t' => $tenantUuid, ':s' => $siteUuid]);
        $allRecent = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Breaking news ticker (top 3 headlines)
        $breakingNews = array_slice($allRecent, 0, 3);

        // Lead Story (1st)
        $leadArticle = $allRecent[0] ?? null;

        // Secondary articles (2nd to 4th)
        $secondaryArticles = array_slice($allRecent, 1, 3);

        // Latest articles stream (5th to 12th)
        $latestArticles = array_slice($allRecent, 4, 8);

        // Trending articles (simulated through published date & recency)
        $trendingArticles = array_slice($allRecent, 0, 5);

        // 2. Fetch section highlights for top canonical categories
        $sections = [];
        $categoriesStmt = $pdo->prepare("
            SELECT category_uuid, name, slug, description
            FROM categories
            WHERE tenant_uuid = :t AND site_uuid = :s AND status = 'ACTIVE'
            ORDER BY sort_order ASC
            LIMIT 6
        ");
        $categoriesStmt->execute([':t' => $tenantUuid, ':s' => $siteUuid]);
        $categories = $categoriesStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($categories as $cat) {
            $catArticlesStmt = $pdo->prepare("
                SELECT 
                    a.article_uuid,
                    a.title,
                    a.subtitle,
                    a.excerpt,
                    a.slug,
                    a.published_at,
                    au.name AS author_name,
                    au.slug AS author_slug
                FROM articles a
                INNER JOIN authors au ON au.author_uuid = a.author_uuid
                WHERE a.tenant_uuid = :t
                  AND a.site_uuid = :s
                  AND a.category_uuid = :c
                  AND a.status = 'PUBLISHED'
                  AND a.published_at IS NOT NULL
                  AND a.published_at <= NOW()
                ORDER BY a.published_at DESC
                LIMIT 3
            ");
            $catArticlesStmt->execute([
                ':t' => $tenantUuid,
                ':s' => $siteUuid,
                ':c' => $cat['category_uuid'],
            ]);
            $catArticles = $catArticlesStmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($catArticles)) {
                $sections[$cat['slug']] = [
                    'category' => $cat,
                    'articles' => $catArticles,
                ];
            }
        }

        return [
            'breaking_news' => $breakingNews,
            'lead_article' => $leadArticle,
            'secondary_articles' => $secondaryArticles,
            'latest_articles' => $latestArticles,
            'trending_articles' => $trendingArticles,
            'sections' => $sections,
        ];
    }

    /**
     * Get published article by slug with full relations and related news.
     */
    public static function getArticleBySlug(string $tenantUuid, string $siteUuid, string $slug): ?array
    {
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("
            SELECT 
                a.article_uuid,
                a.tenant_uuid,
                a.site_uuid,
                a.title,
                a.subtitle,
                a.excerpt,
                a.content,
                a.slug,
                a.status,
                a.published_at,
                a.modified_at,
                a.created_at,
                a.featured_media_uuid,
                m.storage_path AS featured_media_path,
                m.alt_text AS featured_media_alt,
                m.caption AS featured_media_caption,
                m.credit AS featured_media_credit,
                m.width AS featured_media_width,
                m.height AS featured_media_height,
                c.category_uuid,
                c.name AS category_name,
                c.slug AS category_slug,
                au.author_uuid,
                au.name AS author_name,
                au.slug AS author_slug,
                au.bio AS author_bio
            FROM articles a
            INNER JOIN categories c ON c.category_uuid = a.category_uuid
            INNER JOIN authors au ON au.author_uuid = a.author_uuid
            LEFT JOIN media m ON m.media_uuid = a.featured_media_uuid
            WHERE a.tenant_uuid = :t
              AND a.site_uuid = :s
              AND a.slug = :slug
              AND a.status = 'PUBLISHED'
              AND a.published_at IS NOT NULL
              AND a.published_at <= NOW()
            LIMIT 1
        ");

        $stmt->execute([
            ':t' => $tenantUuid,
            ':s' => $siteUuid,
            ':slug' => $slug,
        ]);

        $article = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$article) {
            return null;
        }

        // Format featured media
        if (!empty($article['featured_media_path'])) {
            $article['featured_media'] = [
                'media_uuid' => $article['featured_media_uuid'],
                'url' => '/' . ltrim($article['featured_media_path'], '/'),
                'alt_text' => $article['featured_media_alt'],
                'caption' => $article['featured_media_caption'],
                'credit' => $article['featured_media_credit'],
                'width' => (int) ($article['featured_media_width'] ?? 0),
                'height' => (int) ($article['featured_media_height'] ?? 0),
            ];
        } else {
            $article['featured_media'] = null;
        }
        unset(
            $article['featured_media_path'],
            $article['featured_media_alt'],
            $article['featured_media_caption'],
            $article['featured_media_credit'],
            $article['featured_media_width'],
            $article['featured_media_height']
        );

        // Fetch SEO metadata
        $seoStmt = $pdo->prepare('SELECT meta_title, meta_description, canonical_url, og_title, og_description FROM article_seo WHERE article_uuid = :id LIMIT 1');
        $seoStmt->execute([':id' => $article['article_uuid']]);
        $article['seo'] = $seoStmt->fetch(PDO::FETCH_ASSOC) ?: null;

        // Fetch Tags
        $tagsStmt = $pdo->prepare("
            SELECT t.tag_uuid, t.name, t.slug
            FROM tags t
            INNER JOIN article_tags at ON at.tag_uuid = t.tag_uuid
            WHERE at.article_uuid = :id
            ORDER BY t.name ASC
        ");
        $tagsStmt->execute([':id' => $article['article_uuid']]);
        $article['tags'] = $tagsStmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch Related Articles (same category, published, excluding current)
        $relatedStmt = $pdo->prepare("
            SELECT 
                a.article_uuid,
                a.title,
                a.slug,
                a.published_at,
                c.name AS category_name,
                c.slug AS category_slug,
                au.name AS author_name
            FROM articles a
            INNER JOIN categories c ON c.category_uuid = a.category_uuid
            INNER JOIN authors au ON au.author_uuid = a.author_uuid
            WHERE a.tenant_uuid = :t
              AND a.site_uuid = :s
              AND a.category_uuid = :c
              AND a.article_uuid != :id
              AND a.status = 'PUBLISHED'
              AND a.published_at IS NOT NULL
              AND a.published_at <= NOW()
            ORDER BY a.published_at DESC
            LIMIT 3
        ");
        $relatedStmt->execute([
            ':t' => $tenantUuid,
            ':s' => $siteUuid,
            ':c' => $article['category_uuid'],
            ':id' => $article['article_uuid'],
        ]);
        $article['related_articles'] = $relatedStmt->fetchAll(PDO::FETCH_ASSOC);

        return $article;
    }

    /**
     * List published articles with pagination and filters.
     */
    public static function getPublishedArticles(string $tenantUuid, string $siteUuid, array $filters = []): array
    {
        $pdo = Database::getConnection();

        $page = max(1, (int) ($filters['page'] ?? 1));
        $limit = min(50, max(1, (int) ($filters['limit'] ?? 12)));
        $offset = ($page - 1) * $limit;

        $where = [
            'a.tenant_uuid = :tenant',
            'a.site_uuid = :site',
            "a.status = 'PUBLISHED'",
            'a.published_at IS NOT NULL',
            'a.published_at <= NOW()',
        ];
        $params = [
            ':tenant' => $tenantUuid,
            ':site' => $siteUuid,
        ];

        if (!empty($filters['category_slug'])) {
            $where[] = 'c.slug = :cat_slug';
            $params[':cat_slug'] = $filters['category_slug'];
        }

        if (!empty($filters['author_slug'])) {
            $where[] = 'au.slug = :auth_slug';
            $params[':auth_slug'] = $filters['author_slug'];
        }

        if (!empty($filters['tag_slug'])) {
            $where[] = 'EXISTS (SELECT 1 FROM article_tags at2 INNER JOIN tags t2 ON t2.tag_uuid = at2.tag_uuid WHERE at2.article_uuid = a.article_uuid AND t2.slug = :tag_slug)';
            $params[':tag_slug'] = $filters['tag_slug'];
        }

        $whereClause = implode(' AND ', $where);

        // Total count
        $countSql = "
            SELECT COUNT(*) 
            FROM articles a
            INNER JOIN categories c ON c.category_uuid = a.category_uuid
            INNER JOIN authors au ON au.author_uuid = a.author_uuid
            WHERE {$whereClause}
        ";
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        // Articles list
        $sql = "
            SELECT 
                a.article_uuid,
                a.title,
                a.subtitle,
                a.excerpt,
                a.slug,
                a.published_at,
                a.modified_at,
                c.name AS category_name,
                c.slug AS category_slug,
                au.name AS author_name,
                au.slug AS author_slug
            FROM articles a
            INNER JOIN categories c ON c.category_uuid = a.category_uuid
            INNER JOIN authors au ON au.author_uuid = a.author_uuid
            WHERE {$whereClause}
            ORDER BY a.published_at DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'articles' => $articles,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => (int) ceil($total / $limit),
            ],
        ];
    }

    /**
     * Get all active categories with published article counts.
     */
    public static function getCategories(string $tenantUuid, string $siteUuid): array
    {
        $pdo = Database::getConnection();

        $sql = "
            SELECT 
                c.category_uuid,
                c.name,
                c.slug,
                c.description,
                c.sort_order,
                COUNT(a.article_uuid) AS articles_count
            FROM categories c
            LEFT JOIN articles a ON a.category_uuid = c.category_uuid
                 AND a.tenant_uuid = c.tenant_uuid
                 AND a.site_uuid = c.site_uuid
                 AND a.status = 'PUBLISHED'
                 AND a.published_at IS NOT NULL
                 AND a.published_at <= NOW()
            WHERE c.tenant_uuid = :t
              AND c.site_uuid = :s
              AND c.status = 'ACTIVE'
            GROUP BY c.category_uuid, c.name, c.slug, c.description, c.sort_order
            ORDER BY c.sort_order ASC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([':t' => $tenantUuid, ':s' => $siteUuid]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get category details and its paginated articles by category slug.
     */
    public static function getCategoryBySlug(string $tenantUuid, string $siteUuid, string $slug, int $page = 1, int $limit = 12): ?array
    {
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("
            SELECT category_uuid, name, slug, description, sort_order
            FROM categories
            WHERE tenant_uuid = :t AND site_uuid = :s AND slug = :slug AND status = 'ACTIVE'
            LIMIT 1
        ");
        $stmt->execute([':t' => $tenantUuid, ':s' => $siteUuid, ':slug' => $slug]);
        $category = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$category) {
            return null;
        }

        $list = self::getPublishedArticles($tenantUuid, $siteUuid, [
            'category_slug' => $slug,
            'page' => $page,
            'limit' => $limit,
        ]);

        return [
            'category' => $category,
            'articles' => $list['articles'],
            'pagination' => $list['pagination'],
        ];
    }

    /**
     * Get author details and their paginated published articles by author slug.
     */
    public static function getAuthorBySlug(string $tenantUuid, string $siteUuid, string $slug, int $page = 1, int $limit = 12): ?array
    {
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("
            SELECT author_uuid, name, slug, bio
            FROM authors
            WHERE tenant_uuid = :t AND site_uuid = :s AND slug = :slug AND status = 'ACTIVE'
            LIMIT 1
        ");
        $stmt->execute([':t' => $tenantUuid, ':s' => $siteUuid, ':slug' => $slug]);
        $author = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$author) {
            return null;
        }

        $list = self::getPublishedArticles($tenantUuid, $siteUuid, [
            'author_slug' => $slug,
            'page' => $page,
            'limit' => $limit,
        ]);

        return [
            'author' => $author,
            'articles' => $list['articles'],
            'pagination' => $list['pagination'],
        ];
    }

    /**
     * SQL full text search across published articles.
     */
    public static function searchArticles(string $tenantUuid, string $siteUuid, string $query, int $page = 1, int $limit = 12): array
    {
        $query = trim($query);
        if ($query === '') {
            return [
                'query' => '',
                'articles' => [],
                'pagination' => [
                    'total' => 0,
                    'page' => 1,
                    'limit' => $limit,
                    'total_pages' => 0,
                ],
            ];
        }

        $pdo = Database::getConnection();
        $offset = ($page - 1) * $limit;
        $searchTerm = '%' . $query . '%';

        $whereClause = "
            a.tenant_uuid = :t
            AND a.site_uuid = :s
            AND a.status = 'PUBLISHED'
            AND a.published_at IS NOT NULL
            AND a.published_at <= NOW()
            AND (
                a.title LIKE :q1
                OR a.subtitle LIKE :q2
                OR a.excerpt LIKE :q3
                OR a.content LIKE :q4
                OR c.name LIKE :q5
                OR au.name LIKE :q6
            )
        ";

        $countStmt = $pdo->prepare("
            SELECT COUNT(*)
            FROM articles a
            INNER JOIN categories c ON c.category_uuid = a.category_uuid
            INNER JOIN authors au ON au.author_uuid = a.author_uuid
            WHERE {$whereClause}
        ");

        $countStmt->execute([
            ':t' => $tenantUuid,
            ':s' => $siteUuid,
            ':q1' => $searchTerm,
            ':q2' => $searchTerm,
            ':q3' => $searchTerm,
            ':q4' => $searchTerm,
            ':q5' => $searchTerm,
            ':q6' => $searchTerm,
        ]);
        $total = (int) $countStmt->fetchColumn();

        $sql = "
            SELECT 
                a.article_uuid,
                a.title,
                a.subtitle,
                a.excerpt,
                a.slug,
                a.published_at,
                c.name AS category_name,
                c.slug AS category_slug,
                au.name AS author_name,
                au.slug AS author_slug
            FROM articles a
            INNER JOIN categories c ON c.category_uuid = a.category_uuid
            INNER JOIN authors au ON au.author_uuid = a.author_uuid
            WHERE {$whereClause}
            ORDER BY a.published_at DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':t', $tenantUuid);
        $stmt->bindValue(':s', $siteUuid);
        $stmt->bindValue(':q1', $searchTerm);
        $stmt->bindValue(':q2', $searchTerm);
        $stmt->bindValue(':q3', $searchTerm);
        $stmt->bindValue(':q4', $searchTerm);
        $stmt->bindValue(':q5', $searchTerm);
        $stmt->bindValue(':q6', $searchTerm);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'query' => $query,
            'articles' => $articles,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => (int) ceil($total / $limit),
            ],
        ];
    }
}

