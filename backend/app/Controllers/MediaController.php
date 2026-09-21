<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Helpers\Uuid;
use App\Services\MediaService;
use Throwable;

class MediaController
{
    /**
     * POST /api/v1/admin/media/upload
     */
    public function upload(Request $request): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::unauthorized();
            return;
        }

        $file = $_FILES['image'] ?? $_FILES['file'] ?? null;
        if (!$file) {
            Response::badRequest('No se recibió ningún archivo de imagen para subir.', 'NO_FILE_UPLOADED');
            return;
        }

        $metadata = [
            'alt_text' => (string) ($request->input('alt_text') ?? ''),
            'caption'  => (string) ($request->input('caption') ?? ''),
            'credit'   => (string) ($request->input('credit') ?? ''),
        ];

        try {
            $media = MediaService::upload($user, $file, $metadata);
            Response::json($media, 201);
        } catch (Throwable $e) {
            Response::badRequest($e->getMessage(), 'UPLOAD_FAILED');
        }
    }

    /**
     * GET /api/v1/admin/media
     */
    public function list(Request $request): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::unauthorized();
            return;
        }

        $filters = [
            'page'  => $request->getQuery('page', 1),
            'limit' => $request->getQuery('limit', 20),
        ];

        $data = MediaService::listMedia($user->tenantUuid, $user->siteUuid, $filters);
        Response::paginated($data['media'], $data['pagination']);
    }

    /**
     * GET /api/v1/admin/media/{uuid}
     */
    public function show(Request $request, array $params): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::unauthorized();
            return;
        }

        $uuid = $params['uuid'] ?? '';
        if (!Uuid::isValid($uuid)) {
            Response::badRequest('UUID de medio inválido.', 'INVALID_UUID');
            return;
        }

        $media = MediaService::getMedia($user->tenantUuid, $user->siteUuid, $uuid);
        if (!$media) {
            Response::notFound('Recurso multimedia no encontrado.', 'MEDIA_NOT_FOUND');
            return;
        }

        Response::json($media);
    }

    /**
     * PUT /api/v1/admin/media/{uuid}
     */
    public function update(Request $request, array $params): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::unauthorized();
            return;
        }

        $uuid = $params['uuid'] ?? '';
        if (!Uuid::isValid($uuid)) {
            Response::badRequest('UUID de medio inválido.', 'INVALID_UUID');
            return;
        }

        $body = $request->getBody();
        $updated = MediaService::updateMetadata($user, $uuid, $body);

        if (!$updated) {
            Response::notFound('Recurso multimedia no encontrado.', 'MEDIA_NOT_FOUND');
            return;
        }

        Response::json($updated);
    }

    /**
     * DELETE /api/v1/admin/media/{uuid}
     */
    public function delete(Request $request, array $params): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::unauthorized();
            return;
        }

        $uuid = $params['uuid'] ?? '';
        if (!Uuid::isValid($uuid)) {
            Response::badRequest('UUID de medio inválido.', 'INVALID_UUID');
            return;
        }

        $deleted = MediaService::deleteMedia($user, $uuid);
        if (!$deleted) {
            Response::notFound('Recurso multimedia no encontrado.', 'MEDIA_NOT_FOUND');
            return;
        }

        Response::json(['message' => 'Archivo multimedia eliminado correctamente del sistema y disco.']);
    }
}

