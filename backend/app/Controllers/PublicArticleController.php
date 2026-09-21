<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\PublicArticleService;

class PublicArticleController
{
    /**
     * GET /api/v1/public/home
     */
    public function home(Request $request): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado o no configurado.', 'SITE_NOT_FOUND');
            return;
        }

        $data = PublicArticleService::getHomeFeed($tenantUuid, $siteUuid);
        Response::json($data);
    }

    /**
     * GET /api/v1/public/articles
     */
    public function index(Request $request): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado.', 'SITE_NOT_FOUND');
            return;
        }

        $filters = [
            'category_slug' => $request->getQuery('category'),
            'author_slug' => $request->getQuery('author'),
            'tag_slug' => $request->getQuery('tag'),
            'page' => $request->getQuery('page', 1),
            'limit' => $request->getQuery('limit', 12),
        ];

        $data = PublicArticleService::getPublishedArticles($tenantUuid, $siteUuid, $filters);
        Response::paginated($data['articles'], $data['pagination']);
    }

    /**
     * GET /api/v1/public/articles/{slug}
     */
    public function show(Request $request, array $params): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();
        $slug = $params['slug'] ?? '';

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado.', 'SITE_NOT_FOUND');
            return;
        }

        if (trim($slug) === '') {
            Response::badRequest('Slug de artículo no proporcionado.', 'INVALID_SLUG');
            return;
        }

        $article = PublicArticleService::getArticleBySlug($tenantUuid, $siteUuid, $slug);

        if (!$article) {
            Response::notFound('El artículo solicitado no existe o no se encuentra publicado.', 'ARTICLE_NOT_FOUND');
            return;
        }

        Response::json($article);
    }

    /**
     * GET /api/v1/public/categories
     */
    public function categories(Request $request): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado.', 'SITE_NOT_FOUND');
            return;
        }

        $categories = PublicArticleService::getCategories($tenantUuid, $siteUuid);
        Response::json($categories);
    }

    /**
     * GET /api/v1/public/categories/{slug}
     */
    public function categoryArticles(Request $request, array $params): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();
        $slug = $params['slug'] ?? '';

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado.', 'SITE_NOT_FOUND');
            return;
        }

        $page = (int) $request->getQuery('page', 1);
        $limit = (int) $request->getQuery('limit', 12);

        $result = PublicArticleService::getCategoryBySlug($tenantUuid, $siteUuid, $slug, $page, $limit);

        if (!$result) {
            Response::notFound('La categoría solicitada no existe o no se encuentra activa.', 'CATEGORY_NOT_FOUND');
            return;
        }

        Response::paginated($result['articles'], $result['pagination'], ['category' => $result['category']]);
    }

    /**
     * GET /api/v1/public/authors/{slug}
     */
    public function authorArticles(Request $request, array $params): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();
        $slug = $params['slug'] ?? '';

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado.', 'SITE_NOT_FOUND');
            return;
        }

        $page = (int) $request->getQuery('page', 1);
        $limit = (int) $request->getQuery('limit', 12);

        $result = PublicArticleService::getAuthorBySlug($tenantUuid, $siteUuid, $slug, $page, $limit);

        if (!$result) {
            Response::notFound('El autor solicitado no existe o no se encuentra activo.', 'AUTHOR_NOT_FOUND');
            return;
        }

        Response::paginated($result['articles'], $result['pagination'], ['author' => $result['author']]);
    }

    /**
     * GET /api/v1/public/search
     */
    public function search(Request $request): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();
        $query = (string) $request->getQuery('q', '');

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado.', 'SITE_NOT_FOUND');
            return;
        }

        $page = (int) $request->getQuery('page', 1);
        $limit = (int) $request->getQuery('limit', 12);

        $result = PublicArticleService::searchArticles($tenantUuid, $siteUuid, $query, $page, $limit);

        Response::paginated($result['articles'], $result['pagination'], ['query' => $result['query']]);
    }
}

