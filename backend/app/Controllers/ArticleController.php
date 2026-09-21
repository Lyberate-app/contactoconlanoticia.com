<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\ArticleService;
use App\Validation\Validator;
use RuntimeException;

class ArticleController
{
    /**
     * GET /api/v1/admin/articles
     */
    public function list(Request $request): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::unauthorized();
        }

        $filters = [
            'status' => $request->getQuery('status'),
            'category_uuid' => $request->getQuery('category_uuid'),
            'author_uuid' => $request->getQuery('author_uuid'),
            'search' => $request->getQuery('search'),
            'page' => $request->getQuery('page'),
            'limit' => $request->getQuery('limit'),
            'include_trash' => $request->getQuery('include_trash') === 'true',
        ];

        $data = ArticleService::listArticles($user->getTenantUuid(), $user->getSiteUuid(), $filters);

        Response::success($data);
    }

    /**
     * GET /api/v1/admin/articles/{uuid}
     */
    public function show(Request $request): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::unauthorized();
        }

        $articleUuid = (string) $request->getRouteParam('uuid');
        $article = ArticleService::getArticle($user->getTenantUuid(), $user->getSiteUuid(), $articleUuid);

        if (!$article) {
            Response::notFound('Artículo no encontrado.');
        }

        Response::success(['article' => $article]);
    }

    /**
     * POST /api/v1/admin/articles
     */
    public function create(Request $request): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::unauthorized();
        }

        $v = Validator::make($request->getBody(), [
            'title' => 'required|string|min:3|max:255',
            'content' => 'required|string',
            'author_uuid' => 'required|uuid',
            'category_uuid' => 'required|uuid',
        ]);

        if ($v->fails()) {
            Response::validationError($v->errors());
        }

        try {
            $article = ArticleService::createArticle($user, $request->getBody());
            Response::success(['article' => $article], 201, ['message' => 'Artículo redactado y guardado con éxito.']);
        } catch (RuntimeException $e) {
            Response::badRequest($e->getMessage(), 'ARTICLE_CREATION_FAILED');
        }
    }

    /**
     * PUT /api/v1/admin/articles/{uuid}
     */
    public function update(Request $request): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::unauthorized();
        }

        $articleUuid = (string) $request->getRouteParam('uuid');

        try {
            $article = ArticleService::updateArticle($user, $articleUuid, $request->getBody());
            Response::success(['article' => $article], 200, ['message' => 'Artículo actualizado con éxito.']);
        } catch (RuntimeException $e) {
            Response::badRequest($e->getMessage(), 'ARTICLE_UPDATE_FAILED');
        }
    }

    /**
     * DELETE /api/v1/admin/articles/{uuid}
     */
    public function delete(Request $request): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::unauthorized();
        }

        $articleUuid = (string) $request->getRouteParam('uuid');
        $permanent = $request->getQuery('permanent') === 'true';

        $success = ArticleService::deleteArticle($user, $articleUuid, $permanent);

        if (!$success) {
            Response::notFound('Artículo no encontrado o ya eliminado.');
        }

        Response::success([
            'deleted' => true,
            'permanent' => $permanent,
        ], 200, ['message' => $permanent ? 'Artículo eliminado definitivamente.' : 'Artículo enviado a la papelera.']);
    }
}

