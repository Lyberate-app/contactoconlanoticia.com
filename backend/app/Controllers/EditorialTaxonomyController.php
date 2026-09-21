<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Database\Database;
use App\Helpers\Uuid;
use App\Services\SlugService;
use App\Validation\Validator;
use PDO;

class EditorialTaxonomyController
{
    /**
     * GET /api/v1/admin/categories
     */
    public function listCategories(Request $request): void
    {
        $user = $request->getUser();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare('
            SELECT category_uuid, name, slug, description, sort_order, status, created_at 
            FROM categories 
            WHERE tenant_uuid = :t AND site_uuid = :s 
            ORDER BY sort_order ASC, name ASC
        ');
        $stmt->execute([':t' => $user->getTenantUuid(), ':s' => $user->getSiteUuid()]);
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success(['categories' => $categories]);
    }

    /**
     * POST /api/v1/admin/categories
     */
    public function createCategory(Request $request): void
    {
        $user = $request->getUser();
        $v = Validator::make($request->getBody(), [
            'name' => 'required|string|min:2|max:100',
        ]);

        if ($v->fails()) {
            Response::validationError($v->errors());
        }

        $name = trim((string) $request->input('name'));
        $slug = !empty($request->input('slug')) ? SlugService::slugify((string) $request->input('slug')) : SlugService::slugify($name);
        $uniqueSlug = SlugService::generateUniqueSlug('categories', $slug, $user->getTenantUuid(), $user->getSiteUuid(), null, 'slug', 'category_uuid');

        $categoryUuid = Uuid::uuid4();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare('
            INSERT INTO categories (category_uuid, tenant_uuid, site_uuid, name, slug, description, sort_order, status)
            VALUES (:id, :t, :s, :name, :slug, :desc, :sort, "ACTIVE")
        ');

        $stmt->execute([
            ':id' => $categoryUuid,
            ':t' => $user->getTenantUuid(),
            ':s' => $user->getSiteUuid(),
            ':name' => $name,
            ':slug' => $uniqueSlug,
            ':desc' => $request->input('description') ? trim((string) $request->input('description')) : null,
            ':sort' => (int) ($request->input('sort_order') ?? 0),
        ]);

        Response::success([
            'category_uuid' => $categoryUuid,
            'name' => $name,
            'slug' => $uniqueSlug,
        ], 201, ['message' => 'Categoría creada con éxito.']);
    }

    /**
     * GET /api/v1/admin/authors
     */
    public function listAuthors(Request $request): void
    {
        $user = $request->getUser();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare('
            SELECT author_uuid, user_uuid, name, slug, bio, photo_media_uuid, status, created_at 
            FROM authors 
            WHERE tenant_uuid = :t AND site_uuid = :s 
            ORDER BY name ASC
        ');
        $stmt->execute([':t' => $user->getTenantUuid(), ':s' => $user->getSiteUuid()]);
        $authors = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success(['authors' => $authors]);
    }

    /**
     * POST /api/v1/admin/authors
     */
    public function createAuthor(Request $request): void
    {
        $user = $request->getUser();
        $v = Validator::make($request->getBody(), [
            'name' => 'required|string|min:2|max:255',
        ]);

        if ($v->fails()) {
            Response::validationError($v->errors());
        }

        $name = trim((string) $request->input('name'));
        $slug = !empty($request->input('slug')) ? SlugService::slugify((string) $request->input('slug')) : SlugService::slugify($name);
        $uniqueSlug = SlugService::generateUniqueSlug('authors', $slug, $user->getTenantUuid(), $user->getSiteUuid(), null, 'slug', 'author_uuid');

        $authorUuid = Uuid::uuid4();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare('
            INSERT INTO authors (author_uuid, tenant_uuid, site_uuid, user_uuid, name, slug, bio, photo_media_uuid, status)
            VALUES (:id, :t, :s, :user_uuid, :name, :slug, :bio, :photo, "ACTIVE")
        ');

        $stmt->execute([
            ':id' => $authorUuid,
            ':t' => $user->getTenantUuid(),
            ':s' => $user->getSiteUuid(),
            ':user_uuid' => $request->input('user_uuid') ?: null,
            ':name' => $name,
            ':slug' => $uniqueSlug,
            ':bio' => $request->input('bio') ? trim((string) $request->input('bio')) : null,
            ':photo' => $request->input('photo_media_uuid') ?: null,
        ]);

        Response::success([
            'author_uuid' => $authorUuid,
            'name' => $name,
            'slug' => $uniqueSlug,
        ], 201, ['message' => 'Autor creado con éxito.']);
    }

    /**
     * GET /api/v1/admin/tags
     */
    public function listTags(Request $request): void
    {
        $user = $request->getUser();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare('
            SELECT tag_uuid, name, slug 
            FROM tags 
            WHERE tenant_uuid = :t AND site_uuid = :s 
            ORDER BY name ASC
        ');
        $stmt->execute([':t' => $user->getTenantUuid(), ':s' => $user->getSiteUuid()]);
        $tags = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success(['tags' => $tags]);
    }
}

