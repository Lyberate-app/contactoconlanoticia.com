<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\AdCampaignService;

class AdCampaignController
{
    /**
     * GET /api/v1/public/ads
     */
    public function activeAds(Request $request): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado o no configurado.', 'SITE_NOT_FOUND');
            return;
        }

        $location = $request->getQuery('location') ?? $request->getQuery('placement');
        $locationStr = is_string($location) ? trim($location) : null;

        $ads = AdCampaignService::getActiveAds($tenantUuid, $siteUuid, $locationStr);
        Response::json($ads);
    }

    /**
     * POST /api/v1/public/ads/{uuid}/impression
     */
    public function impression(Request $request, array $params): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado.', 'SITE_NOT_FOUND');
            return;
        }

        $campaignUuid = (string) ($params['uuid'] ?? '');
        $recorded = AdCampaignService::recordImpression($tenantUuid, $siteUuid, $campaignUuid);

        Response::json(['recorded' => $recorded]);
    }

    /**
     * GET /api/v1/public/ads/{uuid}/click
     */
    public function click(Request $request, array $params): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado.', 'SITE_NOT_FOUND');
            return;
        }

        $campaignUuid = (string) ($params['uuid'] ?? '');
        $targetUrl = AdCampaignService::recordClick($tenantUuid, $siteUuid, $campaignUuid);

        if (!$targetUrl) {
            Response::notFound('Campaña publicitaria no encontrada o inactiva.', 'AD_NOT_FOUND');
            return;
        }

        // If client requested JSON, respond with target URL payload
        $accept = (string) $request->getHeader('accept', '');
        if (str_contains($accept, 'application/json')) {
            Response::json(['target_url' => $targetUrl]);
            return;
        }

        // Otherwise 302 redirect directly to destination
        Response::redirect($targetUrl, 302);
    }

    /**
     * GET /api/v1/admin/ads
     */
    public function list(Request $request): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado.', 'SITE_NOT_FOUND');
            return;
        }

        $filters = [
            'location' => $request->getQuery('location'),
            'active' => $request->getQuery('active'),
        ];
        $page = (int) $request->getQuery('page', 1);
        $limit = (int) $request->getQuery('limit', 20);

        $result = AdCampaignService::listCampaigns($tenantUuid, $siteUuid, $filters, $page, $limit);
        Response::paginated($result['items'], $result['pagination']);
    }

    /**
     * GET /api/v1/admin/ads/{uuid}
     */
    public function show(Request $request, array $params): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado.', 'SITE_NOT_FOUND');
            return;
        }

        $campaignUuid = (string) ($params['uuid'] ?? '');
        $item = AdCampaignService::getCampaign($tenantUuid, $siteUuid, $campaignUuid);

        if (!$item) {
            Response::notFound('Campaña publicitaria no encontrada.', 'CAMPAIGN_NOT_FOUND');
            return;
        }

        Response::json($item);
    }

    /**
     * POST /api/v1/admin/ads
     */
    public function create(Request $request): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado.', 'SITE_NOT_FOUND');
            return;
        }

        $body = $request->getBody();

        try {
            $created = AdCampaignService::createCampaign($tenantUuid, $siteUuid, $body);
            Response::json($created, 201);
        } catch (\InvalidArgumentException $e) {
            Response::error($e->getMessage(), 'VALIDATION_FAILED', 400);
        } catch (\Throwable $e) {
            Response::error('Error al crear campaña publicitaria: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    /**
     * PUT /api/v1/admin/ads/{uuid}
     */
    public function update(Request $request, array $params): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado.', 'SITE_NOT_FOUND');
            return;
        }

        $campaignUuid = (string) ($params['uuid'] ?? '');
        $body = $request->getBody();

        try {
            $updated = AdCampaignService::updateCampaign($tenantUuid, $siteUuid, $campaignUuid, $body);
            Response::json($updated);
        } catch (\InvalidArgumentException $e) {
            Response::error($e->getMessage(), 'VALIDATION_FAILED', 400);
        } catch (\RuntimeException $e) {
            $code = $e->getCode() ?: 404;
            Response::error($e->getMessage(), 'NOT_FOUND', $code);
        } catch (\Throwable $e) {
            Response::error('Error al actualizar campaña publicitaria: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    /**
     * DELETE /api/v1/admin/ads/{uuid}
     */
    public function delete(Request $request, array $params): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado.', 'SITE_NOT_FOUND');
            return;
        }

        $campaignUuid = (string) ($params['uuid'] ?? '');
        $deleted = AdCampaignService::deleteCampaign($tenantUuid, $siteUuid, $campaignUuid);

        if (!$deleted) {
            Response::notFound('Campaña publicitaria no encontrada para eliminar.', 'CAMPAIGN_NOT_FOUND');
            return;
        }

        Response::json(['deleted' => true, 'message' => 'Campaña eliminada exitosamente.']);
    }
}
