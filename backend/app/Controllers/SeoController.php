<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\SeoService;
use App\Services\PublicArticleService;

class SeoController
{
    /**
     * Resolve absolute base URL for the current request.
     */
    private function resolveBaseUrl(Request $request): string
    {
        $appUrl = getenv('APP_URL') ?: 'https://contactoconlanoticia.com';

        if (!empty($_SERVER['HTTP_HOST'])) {
            $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            return $scheme . '://' . $_SERVER['HTTP_HOST'];
        }

        return rtrim($appUrl, '/');
    }

    /**
     * GET /sitemap.xml
     */
    public function sitemap(Request $request): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado para generar sitemap.', 'SITE_NOT_FOUND');
            return;
        }

        $baseUrl = $this->resolveBaseUrl($request);
        $xml = SeoService::generateSitemapXml($tenantUuid, $siteUuid, $baseUrl);

        Response::xml($xml);
    }

    /**
     * GET /sitemap-news.xml
     * Google News compliant sitemap for articles in the last 48 hours.
     */
    public function newsSitemap(Request $request): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado para generar sitemap de noticias.', 'SITE_NOT_FOUND');
            return;
        }

        $baseUrl = $this->resolveBaseUrl($request);
        $xml = SeoService::generateNewsSitemapXml($tenantUuid, $siteUuid, $baseUrl);

        Response::xml($xml);
    }

    /**
     * GET /feed.xml | /rss.xml | /feed
     * RSS 2.0 / Atom feed for news syndication.
     */
    public function rssFeed(Request $request): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado para generar feed RSS.', 'SITE_NOT_FOUND');
            return;
        }

        $baseUrl = $this->resolveBaseUrl($request);
        $xml = SeoService::generateRssFeedXml($tenantUuid, $siteUuid, $baseUrl);

        Response::xml($xml);
    }

    /**
     * GET /robots.txt
     */
    public function robots(Request $request): void
    {
        $baseUrl = $this->resolveBaseUrl($request);
        $text = SeoService::generateRobotsTxt($baseUrl);

        Response::text($text);
    }

    /**
     * GET /api/v1/public/seo/article/{slug}
     * Returns full SEO metadata and JSON-LD for frontend consumption.
     */
    public function articleSeo(Request $request, array $params = []): void
    {
        $tenantUuid = $request->getTenantId();
        $siteUuid = $request->getSiteId();
        $slug = $params['slug'] ?? '';

        if (!$tenantUuid || !$siteUuid) {
            Response::notFound('Sitio no encontrado.', 'SITE_NOT_FOUND');
            return;
        }

        $article = PublicArticleService::getArticleBySlug($tenantUuid, $siteUuid, $slug);
        if (!$article) {
            Response::notFound('Artículo no encontrado o no publicado.', 'ARTICLE_NOT_FOUND');
            return;
        }

        $baseUrl = $this->resolveBaseUrl($request);
        $canonicalUrl = $article['seo']['canonical_url'] ?? ($baseUrl . '/noticia/' . $article['slug']);

        $featuredImageUrl = null;
        if (!empty($article['featured_media']['url'])) {
            $imgUrl = $article['featured_media']['url'];
            $featuredImageUrl = str_starts_with($imgUrl, 'http') ? $imgUrl : ($baseUrl . $imgUrl);
        }

        $metaTitle = $article['seo']['meta_title'] ?? $article['title'];
        $metaDescription = $article['seo']['meta_description'] ?? $article['excerpt'] ?? $article['subtitle'] ?? '';

        $jsonLd = SeoService::buildNewsArticleSchema($article, $baseUrl);

        Response::json([
            'title' => $metaTitle,
            'description' => $metaDescription,
            'canonical_url' => $canonicalUrl,
            'open_graph' => [
                'type' => 'article',
                'site_name' => 'Contacto con la Noticia',
                'title' => $article['seo']['og_title'] ?? $metaTitle,
                'description' => $article['seo']['og_description'] ?? $metaDescription,
                'url' => $canonicalUrl,
                'image' => $featuredImageUrl,
                'published_time' => SeoService::formatIsoDate($article['published_at']),
                'modified_time' => SeoService::formatIsoDate($article['modified_at'] ?? $article['published_at']),
                'section' => $article['category_name'] ?? 'General',
                'author' => $article['author_name'] ?? 'Redacción Contacto',
            ],
            'twitter' => [
                'card' => 'summary_large_image',
                'title' => $article['seo']['og_title'] ?? $metaTitle,
                'description' => $article['seo']['og_description'] ?? $metaDescription,
                'image' => $featuredImageUrl,
            ],
            'json_ld' => $jsonLd,
        ]);
    }
}

