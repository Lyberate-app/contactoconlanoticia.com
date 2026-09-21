<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\PushService;

class PushController
{
    /**
     * GET /api/v1/public/push/config
     */
    public function config(Request $request): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado o no configurado.', 'SITE_NOT_FOUND');
            return;
        }

        $config = PushService::getPublicConfig($tenantUuid, $siteUuid);
        Response::json($config);
    }

    /**
     * POST /api/v1/public/push/subscribe
     */
    public function subscribe(Request $request): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado o no configurado.', 'SITE_NOT_FOUND');
            return;
        }

        $body = $request->getBody();
        if (empty($body)) {
            Response::error('Cuerpo de solicitud vacío o formato JSON inválido.', 'INVALID_BODY', 400);
            return;
        }

        // Attach client user agent
        $body['user_agent'] = $request->getHeader('user-agent');

        try {
            $result = PushService::subscribe($tenantUuid, $siteUuid, $body);
            Response::json($result, 201);
        } catch (\InvalidArgumentException $e) {
            Response::error($e->getMessage(), 'VALIDATION_FAILED', 400);
        } catch (\RuntimeException $e) {
            $code = $e->getCode() ?: 400;
            Response::error($e->getMessage(), 'PUSH_DISABLED', $code);
        } catch (\Throwable $e) {
            Response::error('Error al procesar la suscripción push: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    /**
     * POST /api/v1/public/push/unsubscribe
     */
    public function unsubscribe(Request $request): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado o no configurado.', 'SITE_NOT_FOUND');
            return;
        }

        $endpoint = (string) $request->input('endpoint', '');
        if (empty($endpoint)) {
            Response::error('El endpoint de suscripción es requerido.', 'MISSING_ENDPOINT', 400);
            return;
        }

        PushService::unsubscribe($tenantUuid, $siteUuid, $endpoint);
        Response::json(['status' => 'unsubscribed', 'message' => 'Suscripción cancelada satisfactoriamente.']);
    }

    /**
     * PUT /api/v1/public/push/preferences
     */
    public function preferences(Request $request): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado o no configurado.', 'SITE_NOT_FOUND');
            return;
        }

        $endpoint = (string) $request->input('endpoint', '');
        $topics = $request->input('topics');

        if (empty($endpoint) || !is_array($topics)) {
            Response::error('El endpoint y la lista de tópicos son requeridos.', 'VALIDATION_FAILED', 400);
            return;
        }

        try {
            $result = PushService::updatePreferences($tenantUuid, $siteUuid, $endpoint, $topics);
            Response::json($result);
        } catch (\InvalidArgumentException $e) {
            Response::error($e->getMessage(), 'VALIDATION_FAILED', 400);
        } catch (\RuntimeException $e) {
            $code = $e->getCode() ?: 404;
            Response::error($e->getMessage(), 'NOT_FOUND', $code);
        } catch (\Throwable $e) {
            Response::error('Error al actualizar preferencias push.', 'SERVER_ERROR', 500);
        }
    }
}

