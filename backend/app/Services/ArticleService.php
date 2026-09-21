<?php

declare(strict_types=1);

namespace App\Services;

use App\Database\Database;
use App\Helpers\Uuid;
use App\Security\AuthenticatedUser;
use PDO;
use RuntimeException;

class ArticleService
{
    public const VALID_STATUSES = [
        'DRAFT',
        'PENDING_REVIEW',
        'SCHEDULED',
        'PUBLISHED',
        'ARCHIVED',
        'TRASH',
    ];

    /**
     * List articles with filtering, search, and pagination.
     */
    public static function listArticles(string $tenantUuid, string $siteUuid, array $filters = []): array
    {
        $pdo = Database::getConnection();

        $page = max(1, (int) ($filters['page'] ?? 1));
        $limit = min(100, max(1, (int) ($filters['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $where = ['a.tenant_uuid = :tenant', 'a.site_uuid = :site'];
        $params = [
            ':tenant' => $tenantUuid,
            ':site' => $siteUuid,
        ];

        if (!empty($filters['status']) && in_array($filters['status'], self::VALID_STATUSES, true)) {
            $where[] = 'a.status = :status';
            $params[':status'] = $filters['status'];
        } elseif (empty($filters['include_trash'])) {
            $where[] = "a.status != 'TRASH'";
        }

        if (!empty($filters['category_uuid'])) {
            $where[] = 'a.category_uuid = :category';
            $params[':category'] = $filters['category_uuid'];
        }

        if (!empty($filters['author_uuid'])) {
            $where[] = 'a.author_uuid = :author';
            $params[':author'] = $filters['author_uuid'];
        }

        if (!empty($filters['search'])) {
            $where[] = '(a.title LIKE :search OR a.content LIKE :search)';
            $params[':search'] = '%' . trim($filters['search']) . '%';
        }

        $whereClause = implode(' AND ', $where);

        // Count query
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM articles a WHERE {$whereClause}");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        // Fetch query
        $sql = "
            SELECT 
                a.article_uuid, a.title, a.subtitle, a.excerpt, a.slug,
                a.status, a.published_at, a.modified_at, a.created_at, a.updated_at,
                a.author_uuid, au.name AS author_name, au.slug AS author_slug,
                a.category_uuid, c.name AS category_name, c.slug AS category_slug,
                a.featured_media_uuid
            FROM articles a
            JOIN authors au ON au.tenant_uuid = a.tenant_uuid AND au.site_uuid = a.site_uuid AND au.author_uuid = a.author_uuid
            JOIN categories c ON c.tenant_uuid = a.tenant_uuid AND c.site_uuid = a.site_uuid AND c.category_uuid = a.category_uuid
            WHERE {$whereClause}
            ORDER BY a.created_at DESC
            LIMIT {$limit} OFFSET {$offset}
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
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
     * Get single article with author, category, tags, and SEO.
     */
    public static function getArticle(string $tenantUuid, string $siteUuid, string $articleUuid): ?array
    {
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare('
            SELECT 
                a.*,
                au.name AS author_name, au.slug AS author_slug,
                c.name AS category_name, c.slug AS category_slug
            FROM articles a
            JOIN authors au ON au.tenant_uuid = a.tenant_uuid AND au.site_uuid = a.site_uuid AND au.author_uuid = a.author_uuid
            JOIN categories c ON c.tenant_uuid = a.tenant_uuid AND c.site_uuid = a.site_uuid AND c.category_uuid = a.category_uuid
            WHERE a.tenant_uuid = :tenant AND a.site_uuid = :site AND a.article_uuid = :id
            LIMIT 1
        ');
        $stmt->execute([
            ':tenant' => $tenantUuid,
            ':site' => $siteUuid,
            ':id' => $articleUuid,
        ]);

        $article = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$article) {
            return null;
        }

        // Fetch SEO metadata
        $seoStmt = $pdo->prepare('SELECT * FROM article_seo WHERE article_uuid = :id');
        $seoStmt->execute([':id' => $articleUuid]);
        $article['seo'] = $seoStmt->fetch(PDO::FETCH_ASSOC) ?: null;

        // Fetch Tags
        $tagsStmt = $pdo->prepare('
            SELECT t.tag_uuid, t.name, t.slug 
            FROM article_tags at
            JOIN tags t ON t.tag_uuid = at.tag_uuid
            WHERE at.article_uuid = :id
        ');
        $tagsStmt->execute([':id' => $articleUuid]);
        $article['tags'] = $tagsStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        return $article;
    }

    /**
     * Create article with multi-tenant integrity and publication rules.
     */
    public static function createArticle(AuthenticatedUser $user, array $data): array
    {
        $tenantUuid = $user->getTenantUuid();
        $siteUuid = $user->getSiteUuid();

        // 1. Validate Author and Category existence within tenant/site
        if (!self::validateAuthor($tenantUuid, $siteUuid, (string) ($data['author_uuid'] ?? ''))) {
            throw new RuntimeException('El autor indicado no existe o no pertenece a este sitio.');
        }

        if (!self::validateCategory($tenantUuid, $siteUuid, (string) ($data['category_uuid'] ?? ''))) {
            throw new RuntimeException('La categoría indicada no existe o no pertenece a este sitio.');
        }

        // 2. Validate status and publication permissions
        $status = strtoupper((string) ($data['status'] ?? 'DRAFT'));
        if (!in_array($status, self::VALID_STATUSES, true)) {
            $status = 'DRAFT';
        }

        if (in_array($status, ['PUBLISHED', 'SCHEDULED'], true) && !$user->hasPermission('articles.publish')) {
            throw new RuntimeException('No posee permisos para publicar o programar artículos (requiere: articles.publish).');
        }

        // 3. Handle published_at and modified_at
        $publishedAt = null;
        $modifiedAt = null;

        if ($status === 'PUBLISHED') {
            $publishedAt = !empty($data['published_at']) ? (string) $data['published_at'] : date('Y-m-d H:i:s');
        } elseif ($status === 'SCHEDULED') {
            if (empty($data['published_at']) || strtotime((string) $data['published_at']) <= time()) {
                throw new RuntimeException('La fecha de programación debe ser una fecha y hora futura.');
            }
            $publishedAt = date('Y-m-d H:i:s', strtotime((string) $data['published_at']));
        }

        // 4. Generate unique slug
        $articleUuid = Uuid::uuid4();
        $slug = !empty($data['slug']) ? SlugService::slugify((string) $data['slug']) : SlugService::slugify((string) $data['title']);
        $uniqueSlug = SlugService::generateUniqueSlug('articles', $slug, $tenantUuid, $siteUuid, null);

        $pdo = Database::getConnection();
        $pdo->beginTransaction();

        try {
            $stmt = $pdo->prepare('
                INSERT INTO articles (
                    article_uuid, tenant_uuid, site_uuid, author_uuid, category_uuid,
                    title, subtitle, excerpt, content, slug,
                    featured_media_uuid, status, published_at, modified_at
                ) VALUES (
                    :article_uuid, :tenant_uuid, :site_uuid, :author_uuid, :category_uuid,
                    :title, :subtitle, :excerpt, :content, :slug,
                    :featured_media_uuid, :status, :published_at, :modified_at
                )
            ');

            $stmt->execute([
                ':article_uuid' => $articleUuid,
                ':tenant_uuid' => $tenantUuid,
                ':site_uuid' => $siteUuid,
                ':author_uuid' => $data['author_uuid'],
                ':category_uuid' => $data['category_uuid'],
                ':title' => trim((string) $data['title']),
                ':subtitle' => !empty($data['subtitle']) ? trim((string) $data['subtitle']) : null,
                ':excerpt' => !empty($data['excerpt']) ? trim((string) $data['excerpt']) : null,
                ':content' => (string) $data['content'],
                ':slug' => $uniqueSlug,
                ':featured_media_uuid' => !empty($data['featured_media_uuid']) ? (string) $data['featured_media_uuid'] : null,
                ':status' => $status,
                ':published_at' => $publishedAt,
                ':modified_at' => $modifiedAt,
            ]);

            // 5. Insert SEO metadata if provided
            if (!empty($data['seo']) && is_array($data['seo'])) {
                self::saveSeoMetadata($pdo, $articleUuid, $data['seo']);
            }

            // 6. Attach tags if provided
            if (!empty($data['tags']) && is_array($data['tags'])) {
                self::syncArticleTags($pdo, $tenantUuid, $siteUuid, $articleUuid, $data['tags']);
            }

            $pdo->commit();

            AuditService::log(
                $tenantUuid,
                $siteUuid,
                $user->getUserUuid(),
                'ARTICLE_CREATED',
                'ARTICLE',
                $articleUuid,
                null,
                null,
                ['title' => $data['title'], 'status' => $status, 'slug' => $uniqueSlug]
            );

            return self::getArticle($tenantUuid, $siteUuid, $articleUuid) ?? [];
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Update existing article with state transition rules.
     */
    public static function updateArticle(AuthenticatedUser $user, string $articleUuid, array $data): array
    {
        $tenantUuid = $user->getTenantUuid();
        $siteUuid = $user->getSiteUuid();

        $existing = self::getArticle($tenantUuid, $siteUuid, $articleUuid);
        if (!$existing) {
            throw new RuntimeException('Artículo no encontrado.');
        }

        // Validate author and category if modified
        $authorUuid = $data['author_uuid'] ?? $existing['author_uuid'];
        if (!self::validateAuthor($tenantUuid, $siteUuid, $authorUuid)) {
            throw new RuntimeException('El autor indicado no existe o no pertenece a este sitio.');
        }

        $categoryUuid = $data['category_uuid'] ?? $existing['category_uuid'];
        if (!self::validateCategory($tenantUuid, $siteUuid, $categoryUuid)) {
            throw new RuntimeException('La categoría indicada no existe o no pertenece a este sitio.');
        }

        // Status transition validation
        $newStatus = isset($data['status']) ? strtoupper((string) $data['status']) : $existing['status'];
        if (!in_array($newStatus, self::VALID_STATUSES, true)) {
            $newStatus = $existing['status'];
        }

        if (in_array($newStatus, ['PUBLISHED', 'SCHEDULED'], true) && !$user->hasPermission('articles.publish')) {
            throw new RuntimeException('No posee permisos para publicar o programar artículos (requiere: articles.publish).');
        }

        // Handling published_at and modified_at
        $publishedAt = $existing['published_at'];
        $modifiedAt = $existing['modified_at'];

        if ($newStatus === 'PUBLISHED') {
            if ($existing['status'] !== 'PUBLISHED' && empty($publishedAt)) {
                $publishedAt = !empty($data['published_at']) ? (string) $data['published_at'] : date('Y-m-d H:i:s');
            } else {
                // Already published previously: update modified_at, preserve original published_at
                $modifiedAt = date('Y-m-d H:i:s');
            }
        } elseif ($newStatus === 'SCHEDULED') {
            if (empty($data['published_at']) || strtotime((string) $data['published_at']) <= time()) {
                throw new RuntimeException('La fecha de programación debe ser una fecha y hora futura.');
            }
            $publishedAt = date('Y-m-d H:i:s', strtotime((string) $data['published_at']));
        }

        // Slug validation
        $title = !empty($data['title']) ? trim((string) $data['title']) : $existing['title'];
        $newSlug = !empty($data['slug']) ? SlugService::slugify((string) $data['slug']) : $existing['slug'];
        if ($newSlug !== $existing['slug']) {
            $newSlug = SlugService::generateUniqueSlug('articles', $newSlug, $tenantUuid, $siteUuid, $articleUuid);
        }

        $pdo = Database::getConnection();
        $pdo->beginTransaction();

        try {
            $stmt = $pdo->prepare('
                UPDATE articles SET
                    author_uuid = :author_uuid,
                    category_uuid = :category_uuid,
                    title = :title,
                    subtitle = :subtitle,
                    excerpt = :excerpt,
                    content = :content,
                    slug = :slug,
                    featured_media_uuid = :featured_media_uuid,
                    status = :status,
                    published_at = :published_at,
                    modified_at = :modified_at,
                    updated_at = CURRENT_TIMESTAMP
                WHERE article_uuid = :article_uuid AND tenant_uuid = :tenant_uuid AND site_uuid = :site_uuid
            ');

            $stmt->execute([
                ':article_uuid' => $articleUuid,
                ':tenant_uuid' => $tenantUuid,
                ':site_uuid' => $siteUuid,
                ':author_uuid' => $authorUuid,
                ':category_uuid' => $categoryUuid,
                ':title' => $title,
                ':subtitle' => array_key_exists('subtitle', $data) ? ($data['subtitle'] ? trim((string) $data['subtitle']) : null) : $existing['subtitle'],
                ':excerpt' => array_key_exists('excerpt', $data) ? ($data['excerpt'] ? trim((string) $data['excerpt']) : null) : $existing['excerpt'],
                ':content' => $data['content'] ?? $existing['content'],
                ':slug' => $newSlug,
                ':featured_media_uuid' => array_key_exists('featured_media_uuid', $data) ? $data['featured_media_uuid'] : $existing['featured_media_uuid'],
                ':status' => $newStatus,
                ':published_at' => $publishedAt,
                ':modified_at' => $modifiedAt,
            ]);

            // Update SEO if passed
            if (isset($data['seo']) && is_array($data['seo'])) {
                self::saveSeoMetadata($pdo, $articleUuid, $data['seo']);
            }

            // Sync tags if passed
            if (isset($data['tags']) && is_array($data['tags'])) {
                self::syncArticleTags($pdo, $tenantUuid, $siteUuid, $articleUuid, $data['tags']);
            }

            $pdo->commit();

            AuditService::log(
                $tenantUuid,
                $siteUuid,
                $user->getUserUuid(),
                'ARTICLE_UPDATED',
                'ARTICLE',
                $articleUuid,
                null,
                null,
                ['title' => $title, 'status' => $newStatus, 'slug' => $newSlug]
            );

            return self::getArticle($tenantUuid, $siteUuid, $articleUuid) ?? [];
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Send article to TRASH or permanently delete.
     */
    public static function deleteArticle(AuthenticatedUser $user, string $articleUuid, bool $permanent = false): bool
    {
        $tenantUuid = $user->getTenantUuid();
        $siteUuid = $user->getSiteUuid();

        $pdo = Database::getConnection();

        if ($permanent) {
            $stmt = $pdo->prepare('DELETE FROM articles WHERE article_uuid = :id AND tenant_uuid = :t AND site_uuid = :s');
            $stmt->execute([':id' => $articleUuid, ':t' => $tenantUuid, ':s' => $siteUuid]);
            $action = 'ARTICLE_PERMANENTLY_DELETED';
        } else {
            $stmt = $pdo->prepare('UPDATE articles SET status = "TRASH", updated_at = CURRENT_TIMESTAMP WHERE article_uuid = :id AND tenant_uuid = :t AND site_uuid = :s');
            $stmt->execute([':id' => $articleUuid, ':t' => $tenantUuid, ':s' => $siteUuid]);
            $action = 'ARTICLE_TRASHED';
        }

        AuditService::log(
            $tenantUuid,
            $siteUuid,
            $user->getUserUuid(),
            $action,
            'ARTICLE',
            $articleUuid
        );

        return $stmt->rowCount() > 0;
    }

    public static function validateAuthor(string $tenantUuid, string $siteUuid, string $authorUuid): bool
    {
        if ($authorUuid === '') return false;
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('SELECT 1 FROM authors WHERE tenant_uuid = :t AND site_uuid = :s AND author_uuid = :a');
        $stmt->execute([':t' => $tenantUuid, ':s' => $siteUuid, ':a' => $authorUuid]);
        return (bool) $stmt->fetchColumn();
    }

    public static function validateCategory(string $tenantUuid, string $siteUuid, string $categoryUuid): bool
    {
        if ($categoryUuid === '') return false;
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('SELECT 1 FROM categories WHERE tenant_uuid = :t AND site_uuid = :s AND category_uuid = :c');
        $stmt->execute([':t' => $tenantUuid, ':s' => $siteUuid, ':c' => $categoryUuid]);
        return (bool) $stmt->fetchColumn();
    }

    private static function saveSeoMetadata(PDO $pdo, string $articleUuid, array $seo): void
    {
        $stmt = $pdo->prepare('
            INSERT INTO article_seo (
                article_uuid, meta_title, meta_description, canonical_url, og_title, og_description, og_image_media_uuid
            ) VALUES (
                :article_uuid, :meta_title, :meta_description, :canonical_url, :og_title, :og_description, :og_image
            ) ON DUPLICATE KEY UPDATE
                meta_title = VALUES(meta_title),
                meta_description = VALUES(meta_description),
                canonical_url = VALUES(canonical_url),
                og_title = VALUES(og_title),
                og_description = VALUES(og_description),
                og_image_media_uuid = VALUES(og_image_media_uuid),
                updated_at = CURRENT_TIMESTAMP
        ');

        $stmt->execute([
            ':article_uuid' => $articleUuid,
            ':meta_title' => $seo['meta_title'] ?? null,
            ':meta_description' => $seo['meta_description'] ?? null,
            ':canonical_url' => $seo['canonical_url'] ?? null,
            ':og_title' => $seo['og_title'] ?? null,
            ':og_description' => $seo['og_description'] ?? null,
            ':og_image' => $seo['og_image_media_uuid'] ?? null,
        ]);
    }

    private static function syncArticleTags(PDO $pdo, string $tenantUuid, string $siteUuid, string $articleUuid, array $tagNamesOrUuids): void
    {
        $pdo->prepare('DELETE FROM article_tags WHERE article_uuid = :id')->execute([':id' => $articleUuid]);

        $attachStmt = $pdo->prepare('INSERT IGNORE INTO article_tags (article_uuid, tag_uuid) VALUES (:article_uuid, :tag_uuid)');

        foreach ($tagNamesOrUuids as $item) {
            $tagUuid = null;

            if (Uuid::isValid((string) $item)) {
                // Verify tag exists in current site
                $check = $pdo->prepare('SELECT tag_uuid FROM tags WHERE tag_uuid = :id AND tenant_uuid = :t AND site_uuid = :s');
                $check->execute([':id' => $item, ':t' => $tenantUuid, ':s' => $siteUuid]);
                $tagUuid = $check->fetchColumn() ?: null;
            } else {
                // Create or find tag by name
                $tagName = trim((string) $item);
                if ($tagName === '') continue;
                $slug = SlugService::slugify($tagName);

                $find = $pdo->prepare('SELECT tag_uuid FROM tags WHERE tenant_uuid = :t AND site_uuid = :s AND slug = :slug');
                $find->execute([':t' => $tenantUuid, ':s' => $siteUuid, ':slug' => $slug]);
                $existing = $find->fetchColumn();

                if ($existing) {
                    $tagUuid = (string) $existing;
                } else {
                    $tagUuid = Uuid::uuid4();
                    $insertTag = $pdo->prepare('INSERT INTO tags (tag_uuid, tenant_uuid, site_uuid, name, slug) VALUES (:id, :t, :s, :n, :sl)');
                    $insertTag->execute([
                        ':id' => $tagUuid,
                        ':t' => $tenantUuid,
                        ':s' => $siteUuid,
                        ':n' => $tagName,
                        ':sl' => $slug,
                    ]);
                }
            }

            if ($tagUuid) {
                $attachStmt->execute([':article_uuid' => $articleUuid, ':tag_uuid' => $tagUuid]);
            }
        }
    }
}

