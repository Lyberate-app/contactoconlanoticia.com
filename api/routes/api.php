<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\PublicPostController;
use App\Http\Controllers\Api\V1\PublicCategoryController;
use App\Http\Controllers\Api\V1\PublicAuthorController;
use App\Http\Controllers\Api\V1\PublicSearchController;
use App\Http\Controllers\Api\V1\PublicSettingsController;
use App\Http\Controllers\Api\V1\PublicFeedController;
use App\Http\Controllers\Api\V1\PublicAdController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Api\V1\InstallController;

Route::prefix('v1')->group(function () {
    // Public routes
    Route::prefix('')->group(function () {
        Route::get('posts', [PublicPostController::class, 'index']);
        Route::get('posts/featured', [PublicPostController::class, 'featured']);
        Route::get('posts/breaking', [PublicPostController::class, 'breaking']);
        Route::get('posts/{slug}', [PublicPostController::class, 'show']);
        Route::get('categories', [PublicCategoryController::class, 'index']);
        Route::get('categories/{slug}', [PublicCategoryController::class, 'show']);
        Route::get('categories/{slug}/posts', [PublicCategoryController::class, 'posts']);
        Route::get('authors/{slug}', [PublicAuthorController::class, 'show']);
        Route::get('authors/{slug}/posts', [PublicAuthorController::class, 'posts']);
        Route::get('search', [PublicSearchController::class, 'index']);
        Route::get('settings/public', [PublicSettingsController::class, 'index']);
        Route::get('feed', [PublicFeedController::class, 'index']);
        Route::get('ads/{slot}', [PublicAdController::class, 'show']);
    });
    
    // Auth routes
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login']);
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });
    });
    
    // Admin routes (protected)
    Route::prefix('admin')->middleware(['auth:sanctum'])->group(function () {
        Route::apiResource('posts', Admin\PostController::class);
        Route::post('posts/{id}/publish', [Admin\PostController::class, 'publish']);
        Route::post('posts/{id}/unpublish', [Admin\PostController::class, 'unpublish']);
        Route::post('posts/{id}/schedule', [Admin\PostController::class, 'schedule']);
        Route::post('posts/{id}/duplicate', [Admin\PostController::class, 'duplicate']);
        
        Route::apiResource('media', Admin\MediaController::class);
        Route::apiResource('categories', Admin\CategoryController::class);
        Route::apiResource('tags', Admin\TagController::class);
        Route::apiResource('users', Admin\UserController::class);
        Route::apiResource('ads', Admin\AdController::class);
        Route::get('ad-slots', [Admin\AdSlotController::class, 'index']);
        Route::apiResource('redirects', Admin\RedirectController::class);
        Route::post('redirects/bulk', [Admin\RedirectController::class, 'bulk']);
        
        Route::get('analytics/overview', [Admin\AnalyticsController::class, 'overview']);
        Route::get('analytics/posts', [Admin\AnalyticsController::class, 'posts']);
        
        Route::get('settings', [Admin\SettingsController::class, 'index']);
        Route::put('settings', [Admin\SettingsController::class, 'update']);
    });
    
    // Install routes
    Route::prefix('install')->group(function () {
        Route::get('check', [InstallController::class, 'check']);
        Route::post('run', [InstallController::class, 'run']);
    });
});
