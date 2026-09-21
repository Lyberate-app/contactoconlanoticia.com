<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\SearchService;

class SearchController
{
    /**
     * GET /api/v1/public/search
     */
    public function search(Request $request): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado o no configurado.', 'SITE_NOT_FOUND');
            return;
        }

        $params = [
            'q' => (string) $request->getQuery('q', ''),
            'category' => (string) $request->getQuery('category', ''),
            'author' => (string) $request->getQuery('author', ''),
            'tag' => (string) $request->getQuery('tag', ''),
            'date_from' => (string) $request->getQuery('date_from', ''),
            'date_to' => (string) $request->getQuery('date_to', ''),
            'sort' => (string) $request->getQuery('sort', 'latest'),
            'page' => (int) $request->getQuery('page', 1),
            'limit' => (int) $request->getQuery('limit', 12),
        ];

        $result = SearchService::search($tenantUuid, $siteUuid, $params);

        Response::paginated($result['articles'], $result['pagination'], [
            'filters_applied' => $result['filters_applied'],
        ]);
    }

    /**
     * GET /api/v1/public/search/filters
     */
    public function filters(Request $request): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado.', 'SITE_NOT_FOUND');
            return;
        }

        $filters = SearchService::getFilterOptions($tenantUuid, $siteUuid);
        Response::json($filters);
    }
}

