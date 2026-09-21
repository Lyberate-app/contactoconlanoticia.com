<?php

declare(strict_types=1);

namespace App\Services;

use App\Database\Database;
use App\Helpers\Sanitizer;
use PDO;

class SearchService
{
    /**
     * Execute multi-criteria search across published articles.
     */
    public static function search(string $tenantUuid, string $siteUuid, array $params): array
    {
        $pdo = Database::getConnection();

        // 1. Sanitize and normalize input parameters
        $q = isset($params['q']) ? trim(Sanitizer::stripTags((string) $params['q'])) : '';
        $category = isset($params['category']) ? trim(Sanitizer::stripTags((string) $params['category'])) : '';
        $author = isset($params['author']) ? trim(Sanitizer::stripTags((string) $params['author'])) : '';
        $tag = isset($params['tag']) ? trim(Sanitizer::stripTags((string) $params['tag'])) : '';
        $dateFrom = isset($params['date_from']) ? trim((string) $params['date_from']) : '';
        $dateTo = isset($params['date_to']) ? trim((string) $params['date_to']) : '';
        $sort = isset($params['sort']) ? strtolower(trim((string) $params['sort'])) : 'latest';
        if (!in_array($sort, ['relevance', 'latest', 'oldest'], true)) {
            $sort = $q !== '' ? 'relevance' : 'latest';
        }

        $page = max(1, (int) ($params['page'] ?? 1));
        $limit = min(50, max(1, (int) ($params['limit'] ?? 12)));
        $offset = ($page - 1) * $limit;

        // 2. Build parameterized WHERE clauses
        $where = [
            'a.tenant_uuid = :t',
            'a.site_uuid = :s',
            "a.status = 'PUBLISHED'",
            'a.published_at IS NOT NULL',
            'a.published_at <= NOW()',
        ];

        $bindings = [
            ':t' => $tenantUuid,
            ':s' => $siteUuid,
        ];

        $hasFulltextScore = false;
        $scoreSelect = '';

        // Free text search condition
        if ($q !== '') {
            $searchTermLike = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $q) . '%';
            $bindings[':q_like1'] = $searchTermLike;
            $bindings[':q_like2'] = $searchTermLike;
            $bindings[':q_like3'] = $searchTermLike;
            $bindings[':q_like4'] = $searchTermLike;
            $bindings[':q_like5'] = $searchTermLike;
            $bindings[':q_like6'] = $searchTermLike;

            // Strip MySQL boolean full-text operator characters to avoid syntax error 1064
            $ftClean = preg_replace('/[+\-><()~*\"@]+/u', ' ', $q);
            $ftClean = trim(preg_replace('/\s+/u', ' ', (string) $ftClean));

            // Only use FULLTEXT if we have at least one valid word of 3+ chars
            if (mb_strlen($ftClean, 'UTF-8') >= 3 && preg_match('/[\p{L}\p{N}]{3,}/u', $ftClean)) {
                $bindings[':q_ft'] = $ftClean;
                $where[] = "(
                    MATCH(a.title, a.subtitle, a.excerpt, a.content) AGAINST(:q_ft IN BOOLEAN MODE)
                    OR a.title LIKE :q_like1
                    OR a.subtitle LIKE :q_like2
                    OR a.excerpt LIKE :q_like3
                    OR a.content LIKE :q_like4
                    OR c.name LIKE :q_like5
                    OR au.name LIKE :q_like6
                )";

                if ($sort === 'relevance') {
                    $hasFulltextScore = true;
                    $bindings[':q_score'] = $ftClean;
                    $scoreSelect = ", MATCH(a.title, a.subtitle, a.excerpt, a.content) AGAINST(:q_score) AS search_score";
                }
            } else {
                $where[] = "(
                    a.title LIKE :q_like1
                    OR a.subtitle LIKE :q_like2
                    OR a.excerpt LIKE :q_like3
                    OR a.content LIKE :q_like4
                    OR c.name LIKE :q_like5
                    OR au.name LIKE :q_like6
                )";
            }
        }

        // Category filter
        if ($category !== '') {
            $where[] = "(c.slug = :category OR c.category_uuid = :category_uuid)";
            $bindings[':category'] = $category;
            $bindings[':category_uuid'] = $category;
        }

        // Author filter
        if ($author !== '') {
            $where[] = "(au.slug = :author OR au.author_uuid = :author_uuid)";
            $bindings[':author'] = $author;
            $bindings[':author_uuid'] = $author;
        }

        // Tag filter
        if ($tag !== '') {
            $where[] = "EXISTS (
                SELECT 1 FROM article_tags at_filter
                INNER JOIN tags t_filter ON t_filter.tag_uuid = at_filter.tag_uuid
                WHERE at_filter.article_uuid = a.article_uuid
                  AND (t_filter.slug = :tag_filter OR t_filter.name = :tag_filter_name)
            )";
            $bindings[':tag_filter'] = $tag;
            $bindings[':tag_filter_name'] = $tag;
        }

        // Date range filter
        if ($dateFrom !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
            $where[] = "a.published_at >= :date_from";
            $bindings[':date_from'] = $dateFrom . ' 00:00:00';
        }

        if ($dateTo !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
            $where[] = "a.published_at <= :date_to";
            $bindings[':date_to'] = $dateTo . ' 23:59:59';
        }

        $whereSql = implode(' AND ', $where);

        // 3. Count total matching rows
        $countSql = "
            SELECT COUNT(*)
            FROM articles a
            INNER JOIN categories c ON c.category_uuid = a.category_uuid
            INNER JOIN authors au ON au.author_uuid = a.author_uuid
            WHERE {$whereSql}
        ";
        $countStmt = $pdo->prepare($countSql);
        // Exclude score binding if present for count query
        $countBindings = $bindings;
        unset($countBindings[':q_score']);

        $countStmt->execute($countBindings);
        $total = (int) $countStmt->fetchColumn();

        // If no results, return clean empty payload immediately
        if ($total === 0) {
            return [
                'articles' => [],
                'pagination' => [
                    'total' => 0,
                    'page' => $page,
                    'limit' => $limit,
                    'total_pages' => 0,
                ],
                'filters_applied' => [
                    'q' => $q,
                    'category' => $category,
                    'author' => $author,
                    'tag' => $tag,
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'sort' => $sort,
                ],
            ];
        }

        // 4. Determine ordering
        if ($sort === 'oldest') {
            $orderBy = 'a.published_at ASC';
        } elseif ($sort === 'relevance' && $hasFulltextScore) {
            $orderBy = 'search_score DESC, a.published_at DESC';
        } else {
            $orderBy = 'a.published_at DESC';
        }

        // 5. Query matching articles (projection avoids heavy content field)
        $articlesSql = "
            SELECT 
                a.article_uuid,
                a.title,
                a.subtitle,
                a.excerpt,
                a.slug,
                a.published_at,
                a.modified_at,
                a.featured_media_uuid,
                m.storage_path AS featured_media_path,
                m.alt_text AS featured_media_alt,
                m.caption AS featured_media_caption,
                c.category_uuid,
                c.name AS category_name,
                c.slug AS category_slug,
                au.author_uuid,
                au.name AS author_name,
                au.slug AS author_slug
                {$scoreSelect}
            FROM articles a
            INNER JOIN categories c ON c.category_uuid = a.category_uuid
            INNER JOIN authors au ON au.author_uuid = a.author_uuid
            LEFT JOIN media m ON m.media_uuid = a.featured_media_uuid
            WHERE {$whereSql}
            ORDER BY {$orderBy}
            LIMIT {$limit} OFFSET {$offset}
        ";

        $artStmt = $pdo->prepare($articlesSql);
        $artStmt->execute($bindings);
        $rawArticles = $artStmt->fetchAll(PDO::FETCH_ASSOC);

        // 6. Batch fetch tags to prevent N+1 queries
        $articleUuids = array_column($rawArticles, 'article_uuid');
        $tagsByArticle = [];

        if (!empty($articleUuids)) {
            $inPlaceholders = implode(',', array_fill(0, count($articleUuids), '?'));
            $tagsStmt = $pdo->prepare("
                SELECT at.article_uuid, t.tag_uuid, t.name, t.slug
                FROM article_tags at
                INNER JOIN tags t ON t.tag_uuid = at.tag_uuid
                WHERE at.article_uuid IN ({$inPlaceholders})
                ORDER BY t.name ASC
            ");
            $tagsStmt->execute($articleUuids);
            while ($row = $tagsStmt->fetch(PDO::FETCH_ASSOC)) {
                $tagsByArticle[$row['article_uuid']][] = [
                    'tag_uuid' => $row['tag_uuid'],
                    'name' => $row['name'],
                    'slug' => $row['slug'],
                ];
            }
        }

        // 7. Format output articles
        $formatted = [];
        foreach ($rawArticles as $art) {
            $mediaObj = null;
            if (!empty($art['featured_media_path'])) {
                $mediaObj = [
                    'media_uuid' => $art['featured_media_uuid'],
                    'url' => '/' . ltrim($art['featured_media_path'], '/'),
                    'alt_text' => $art['featured_media_alt'],
                    'caption' => $art['featured_media_caption'],
                ];
            }

            $formatted[] = [
                'article_uuid' => $art['article_uuid'],
                'title' => $art['title'],
                'subtitle' => $art['subtitle'],
                'excerpt' => $art['excerpt'],
                'slug' => $art['slug'],
                'published_at' => $art['published_at'],
                'modified_at' => $art['modified_at'],
                'category' => [
                    'category_uuid' => $art['category_uuid'],
                    'name' => $art['category_name'],
                    'slug' => $art['category_slug'],
                ],
                'author' => [
                    'author_uuid' => $art['author_uuid'],
                    'name' => $art['author_name'],
                    'slug' => $art['author_slug'],
                ],
                'featured_media' => $mediaObj,
                'tags' => $tagsByArticle[$art['article_uuid']] ?? [],
            ];
        }

        return [
            'articles' => $formatted,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => (int) ceil($total / $limit),
            ],
            'filters_applied' => [
                'q' => $q,
                'category' => $category,
                'author' => $author,
                'tag' => $tag,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'sort' => $sort,
            ],
        ];
    }

    /**
     * Get available search filter options (categories, authors, tags with article counts).
     */
    public static function getFilterOptions(string $tenantUuid, string $siteUuid): array
    {
        $pdo = Database::getConnection();

        // 1. Categories with published articles count
        $catStmt = $pdo->prepare("
            SELECT 
                c.category_uuid, c.name, c.slug,
                COUNT(a.article_uuid) AS articles_count
            FROM categories c
            LEFT JOIN articles a ON a.category_uuid = c.category_uuid 
                AND a.status = 'PUBLISHED' 
                AND a.published_at IS NOT NULL 
                AND a.published_at <= NOW()
            WHERE c.tenant_uuid = :t AND c.site_uuid = :s AND c.status = 'ACTIVE'
            GROUP BY c.category_uuid, c.name, c.slug, c.sort_order
            ORDER BY c.sort_order ASC, c.name ASC
        ");
        $catStmt->execute([':t' => $tenantUuid, ':s' => $siteUuid]);
        $categories = $catStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($categories as &$c) {
            $c['articles_count'] = (int) $c['articles_count'];
        }

        // 2. Authors with published articles count
        $authStmt = $pdo->prepare("
            SELECT 
                au.author_uuid, au.name, au.slug,
                COUNT(a.article_uuid) AS articles_count
            FROM authors au
            INNER JOIN articles a ON a.author_uuid = au.author_uuid 
                AND a.status = 'PUBLISHED' 
                AND a.published_at IS NOT NULL 
                AND a.published_at <= NOW()
            WHERE au.tenant_uuid = :t AND au.site_uuid = :s
            GROUP BY au.author_uuid, au.name, au.slug
            ORDER BY articles_count DESC, au.name ASC
        ");
        $authStmt->execute([':t' => $tenantUuid, ':s' => $siteUuid]);
        $authors = $authStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($authors as &$a) {
            $a['articles_count'] = (int) $a['articles_count'];
        }

        // 3. Popular tags with articles count
        $tagStmt = $pdo->prepare("
            SELECT 
                t.tag_uuid, t.name, t.slug,
                COUNT(at.article_uuid) AS articles_count
            FROM tags t
            INNER JOIN article_tags at ON at.tag_uuid = t.tag_uuid
            INNER JOIN articles a ON a.article_uuid = at.article_uuid 
                AND a.status = 'PUBLISHED' 
                AND a.published_at IS NOT NULL 
                AND a.published_at <= NOW()
            WHERE t.tenant_uuid = :t AND t.site_uuid = :s
            GROUP BY t.tag_uuid, t.name, t.slug
            ORDER BY articles_count DESC, t.name ASC
            LIMIT 25
        ");
        $tagStmt->execute([':t' => $tenantUuid, ':s' => $siteUuid]);
        $tags = $tagStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($tags as &$t) {
            $t['articles_count'] = (int) $t['articles_count'];
        }

        return [
            'categories' => $categories,
            'authors' => $authors,
            'tags' => $tags,
        ];
    }
}

