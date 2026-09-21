<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\SubmissionService;
use InvalidArgumentException;
use RuntimeException;

class SubmissionController
{
    /**
     * POST /api/v1/public/submissions
     */
    public function submit(Request $request): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado o no configurado.', 'SITE_NOT_FOUND');
            return;
        }

        $ipAddress = $request->getClientIp() ?: ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

        $payload = $request->getBody();
        $files = $_FILES['photos'] ?? $_FILES['attachments'] ?? [];

        try {
            $submission = SubmissionService::createSubmission(
                $tenantUuid,
                $siteUuid,
                $payload,
                $files,
                $ipAddress,
                $userAgent
            );

            Response::json($submission, 201);
        } catch (InvalidArgumentException $e) {
            Response::badRequest($e->getMessage(), 'VALIDATION_FAILED');
        } catch (RuntimeException $e) {
            $code = $e->getCode() === 429 ? 429 : 400;
            Response::error($e->getMessage(), $code === 429 ? 'RATE_LIMIT_EXCEEDED' : 'SUBMISSION_FAILED', $code);
        } catch (\Throwable $e) {
            Response::internalError('Error inesperado al procesar el reporte ciudadano.');
        }
    }

    /**
     * GET /api/v1/admin/submissions
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
            'status' => $request->getQuery('status'),
            'search' => $request->getQuery('search'),
        ];

        $page = (int) ($request->getQuery('page') ?? 1);
        $limit = (int) ($request->getQuery('limit') ?? 20);

        $result = SubmissionService::listSubmissions($tenantUuid, $siteUuid, $filters, $page, $limit);
        Response::paginated($result['items'], $result['pagination']);
    }

    /**
     * GET /api/v1/admin/submissions/{uuid}
     */
    public function show(Request $request, array $params): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado.', 'SITE_NOT_FOUND');
            return;
        }

        $uuid = (string) ($params['uuid'] ?? '');
        $submission = SubmissionService::getSubmission($tenantUuid, $siteUuid, $uuid);

        if (!$submission) {
            Response::notFound('Reporte ciudadano no encontrado.', 'SUBMISSION_NOT_FOUND');
            return;
        }

        Response::json($submission);
    }

    /**
     * POST /api/v1/admin/submissions/{uuid}/reject
     */
    public function reject(Request $request, array $params): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado.', 'SITE_NOT_FOUND');
            return;
        }

        $user = $request->getUser();
        if (!$user) {
            Response::unauthorized();
            return;
        }

        $uuid = (string) ($params['uuid'] ?? '');
        $reason = (string) ($request->input('reason') ?? $request->input('rejection_reason') ?? '');

        try {
            $updated = SubmissionService::rejectSubmission($tenantUuid, $siteUuid, $uuid, $reason, $user);
            Response::json($updated);
        } catch (InvalidArgumentException $e) {
            Response::badRequest($e->getMessage());
        } catch (RuntimeException $e) {
            Response::error($e->getMessage(), 'REJECT_FAILED', $e->getCode() ?: 400);
        }
    }

    /**
     * POST /api/v1/admin/submissions/{uuid}/convert
     */
    public function convert(Request $request, array $params): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado.', 'SITE_NOT_FOUND');
            return;
        }

        $user = $request->getUser();
        if (!$user) {
            Response::unauthorized();
            return;
        }

        $uuid = (string) ($params['uuid'] ?? '');
        $overrides = $request->getBody();

        try {
            $result = SubmissionService::convertToArticle($tenantUuid, $siteUuid, $uuid, $overrides, $user);
            Response::json($result, 201);
        } catch (InvalidArgumentException $e) {
            Response::badRequest($e->getMessage());
        } catch (RuntimeException $e) {
            Response::error($e->getMessage(), 'CONVERT_FAILED', $e->getCode() ?: 400);
        }
    }
}

