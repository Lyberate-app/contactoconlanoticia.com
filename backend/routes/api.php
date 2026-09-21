<?php

declare(strict_types=1);

use App\Controllers\AdCampaignController;
use App\Controllers\ArticleController;
use App\Controllers\AuthController;
use App\Controllers\EditorialTaxonomyController;
use App\Controllers\HealthController;
use App\Controllers\PublicArticleController;
use App\Controllers\PushController;
use App\Controllers\SearchController;
use App\Controllers\SeoController;
use App\Controllers\SubmissionController;
use App\Core\Request;
use App\Core\Response;
use App\Core\Router;
use App\Middleware\AuthMiddleware;
use App\Middleware\RequirePermissionMiddleware;

/**
 * Register API routes.
 *
 * @var Router $router
 */

// 1. Health & Status
$router->get('/api/v1/health', [HealthController::class, 'check']);

// 2. Public News Portal Endpoints
$router->get('/api/v1/public/home', [PublicArticleController::class, 'home']);
$router->get('/api/v1/public/articles', [PublicArticleController::class, 'index']);
$router->get('/api/v1/public/articles/{slug}', [PublicArticleController::class, 'show']);
$router->get('/api/v1/public/categories', [PublicArticleController::class, 'categories']);
$router->get('/api/v1/public/categories/{slug}', [PublicArticleController::class, 'categoryArticles']);
$router->get('/api/v1/public/authors/{slug}', [PublicArticleController::class, 'authorArticles']);
$router->get('/api/v1/public/search', [SearchController::class, 'search']);
$router->get('/api/v1/public/search/filters', [SearchController::class, 'filters']);

// 2.1 Web Push & PWA Endpoints
$router->get('/api/v1/public/push/config', [PushController::class, 'config']);
$router->post('/api/v1/public/push/subscribe', [PushController::class, 'subscribe']);
$router->post('/api/v1/public/push/unsubscribe', [PushController::class, 'unsubscribe']);
$router->put('/api/v1/public/push/preferences', [PushController::class, 'preferences']);

// 2.2 Advertising & Commercial Public Endpoints
$router->get('/api/v1/public/ads', [AdCampaignController::class, 'activeAds']);
$router->post('/api/v1/public/ads/{uuid}/impression', [AdCampaignController::class, 'impression']);
$router->get('/api/v1/public/ads/{uuid}/click', [AdCampaignController::class, 'click']);

// 2.3 User Submitted News (Citizen Journalism)
$router->post('/api/v1/public/submissions', [SubmissionController::class, 'submit']);

// 2. Public Authentication Endpoints
$router->post('/api/v1/auth/login', [AuthController::class, 'login']);
$router->post('/api/v1/auth/2fa/verify', [AuthController::class, 'verify2fa']);

// 3. Protected User & Session Endpoints
$auth = new AuthMiddleware();
$router->get('/api/v1/auth/me', [AuthController::class, 'me'], [$auth]);
$router->post('/api/v1/auth/logout', [AuthController::class, 'logout'], [$auth]);

// 4. 2FA Configuration
$router->post('/api/v1/auth/2fa/setup', [AuthController::class, 'setup2fa'], [$auth]);
$router->post('/api/v1/auth/2fa/enable', [AuthController::class, 'enable2fa'], [$auth]);
$router->post('/api/v1/auth/2fa/disable', [AuthController::class, 'disable2fa'], [$auth]);

// 5. Passkeys / WebAuthn
$router->post('/api/v1/auth/webauthn/challenge', [AuthController::class, 'webauthnChallenge'], [$auth]);
$router->post('/api/v1/auth/webauthn/verify', [AuthController::class, 'webauthnVerify'], [$auth]);

// 6. Editorial Taxonomy (Categories, Authors, Tags)
$router->get('/api/v1/admin/categories', [EditorialTaxonomyController::class, 'listCategories'], [$auth]);
$router->post('/api/v1/admin/categories', [EditorialTaxonomyController::class, 'createCategory'], [$auth]);
$router->get('/api/v1/admin/authors', [EditorialTaxonomyController::class, 'listAuthors'], [$auth]);
$router->post('/api/v1/admin/authors', [EditorialTaxonomyController::class, 'createAuthor'], [$auth]);
$router->get('/api/v1/admin/tags', [EditorialTaxonomyController::class, 'listTags'], [$auth]);

// 7. Editorial Articles (CRUD)
$router->get('/api/v1/admin/articles', [ArticleController::class, 'list'], [$auth]);
$router->get('/api/v1/admin/articles/{uuid}', [ArticleController::class, 'show'], [$auth]);
$router->post('/api/v1/admin/articles', [ArticleController::class, 'create'], [$auth, new RequirePermissionMiddleware('articles.create')]);
$router->put('/api/v1/admin/articles/{uuid}', [ArticleController::class, 'update'], [$auth, new RequirePermissionMiddleware('articles.edit')]);
$router->delete('/api/v1/admin/articles/{uuid}', [ArticleController::class, 'delete'], [$auth, new RequirePermissionMiddleware('articles.delete')]);

// 8. Media & Image Management
$router->post('/api/v1/admin/media/upload', [\App\Controllers\MediaController::class, 'upload'], [$auth, new RequirePermissionMiddleware('media.upload')]);
$router->get('/api/v1/admin/media', [\App\Controllers\MediaController::class, 'list'], [$auth]);
$router->get('/api/v1/admin/media/{uuid}', [\App\Controllers\MediaController::class, 'show'], [$auth]);
$router->put('/api/v1/admin/media/{uuid}', [\App\Controllers\MediaController::class, 'update'], [$auth, new RequirePermissionMiddleware('media.upload')]);
$router->delete('/api/v1/admin/media/{uuid}', [\App\Controllers\MediaController::class, 'delete'], [$auth, new RequirePermissionMiddleware('media.delete')]);

// 9. SEO, Sitemaps, RSS Feeds & Robots
$router->get('/sitemap.xml', [SeoController::class, 'sitemap']);
$router->get('/sitemap-news.xml', [SeoController::class, 'newsSitemap']);
$router->get('/feed.xml', [SeoController::class, 'rssFeed']);
$router->get('/rss.xml', [SeoController::class, 'rssFeed']);
$router->get('/feed', [SeoController::class, 'rssFeed']);
$router->get('/robots.txt', [SeoController::class, 'robots']);
$router->get('/api/v1/public/seo/article/{slug}', [SeoController::class, 'articleSeo']);

// 10. Advertising & Commercial Management (Admin)
$adsPermission = new RequirePermissionMiddleware('ads.manage');
$router->get('/api/v1/admin/ads', [AdCampaignController::class, 'list'], [$auth, $adsPermission]);
$router->post('/api/v1/admin/ads', [AdCampaignController::class, 'create'], [$auth, $adsPermission]);
$router->get('/api/v1/admin/ads/{uuid}', [AdCampaignController::class, 'show'], [$auth, $adsPermission]);
$router->put('/api/v1/admin/ads/{uuid}', [AdCampaignController::class, 'update'], [$auth, $adsPermission]);
$router->delete('/api/v1/admin/ads/{uuid}', [AdCampaignController::class, 'delete'], [$auth, $adsPermission]);

// 11. User Submitted News Moderation (Admin)
$submissionsPermission = new RequirePermissionMiddleware('articles.create');
$router->get('/api/v1/admin/submissions', [SubmissionController::class, 'list'], [$auth, $submissionsPermission]);
$router->get('/api/v1/admin/submissions/{uuid}', [SubmissionController::class, 'show'], [$auth, $submissionsPermission]);
$router->post('/api/v1/admin/submissions/{uuid}/reject', [SubmissionController::class, 'reject'], [$auth, $submissionsPermission]);
$router->post('/api/v1/admin/submissions/{uuid}/convert', [SubmissionController::class, 'convert'], [$auth, $submissionsPermission]);


