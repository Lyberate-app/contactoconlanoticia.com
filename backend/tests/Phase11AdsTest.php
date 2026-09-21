<?php

declare(strict_types=1);

namespace Tests;

if (!defined('APP_TESTING')) {
    define('APP_TESTING', true);
}

// Autoloader
spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/../app/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

require_once __DIR__ . '/../app/Core/Env.php';
\App\Core\Env::load(__DIR__ . '/../.env');
\App\Core\Env::load(dirname(__DIR__, 2) . '/.env');

use App\Core\Env;
use App\Core\Request;
use App\Core\Router;
use App\Database\Database;
use App\Helpers\Uuid;
use App\Middleware\JsonBodyParserMiddleware;
use App\Middleware\RequestContextMiddleware;
use App\Security\AuthenticatedUser;
use App\Services\AdCampaignService;
use PDO;

class Phase11AdsTest
{
    private int $passed = 0;
    private int $failed = 0;
    private string $tenantUuid = '00000000-0000-0000-0000-000000000001';
    private string $siteUuid = '00000000-0000-0000-0000-000000000002';
    private string $altTenantUuid = '00000000-0000-0000-0000-000000000099';
    private string $altSiteUuid = '00000000-0000-0000-0000-000000000098';

    public function __construct()
    {
        Env::load(__DIR__ . '/../.env');
    }

    public function run(): void
    {
        echo "============================================\n";
        echo "  LYBERATE — FASE 11 ADS / COMMERCIAL TEST  \n";
        echo "============================================\n\n";

        $this->setupFixtures();
        $this->testCanonicalPlacements();
        $this->testCampaignCreationAndValidation();
        $this->testActiveAdsDelivery();
        $this->testExpiredCampaignsExcluded();
        $this->testFutureCampaignsExcluded();
        $this->testInactiveCampaignsExcluded();
        $this->testPlacementIsolation();
        $this->testMultiTenantIsolation();
        $this->testAtomicTrackingAndCtr();
        $this->testRbacPermissions();
        $this->testRouterEndpoints();

        echo "\n============================================\n";
        echo "ADS RESULTS: {$this->passed} PASSED, {$this->failed} FAILED\n";
        echo "============================================\n";

        if ($this->failed > 0) {
            exit(1);
        }
    }

    private function assert(bool $condition, string $description): void
    {
        if ($condition) {
            $this->passed++;
            echo "  ✓ PASS: {$description}\n";
        } else {
            $this->failed++;
            echo "  ✗ FAIL: {$description}\n";
        }
    }

    private function setupFixtures(): void
    {
        $db = Database::getConnection();

        // Ensure canonical tenant and site exist
        $db->exec("INSERT IGNORE INTO tenants (tenant_uuid, name, slug, status) VALUES 
            ('{$this->tenantUuid}', 'Lyberate Main', 'lyberate-main', 'ACTIVE'),
            ('{$this->altTenantUuid}', 'Lyberate Secondary', 'lyberate-secondary', 'ACTIVE')");

        $db->exec("INSERT IGNORE INTO sites (site_uuid, tenant_uuid, name, slug, domain, status) VALUES 
            ('{$this->siteUuid}', '{$this->tenantUuid}', 'Contacto con la Noticia', 'contacto', 'contactoconlanoticia.com', 'ACTIVE'),
            ('{$this->altSiteUuid}', '{$this->altTenantUuid}', 'Sitio Alternativo', 'sitio-alt', 'alt.example.com', 'ACTIVE')");

        // Clean up any test campaigns
        $db->exec("DELETE FROM ad_campaigns WHERE company_name LIKE 'TEST_ADS_%'");
    }

    private function testCanonicalPlacements(): void
    {
        echo "[1] Validating Canonical Ad Placements...\n";
        $slots = AdCampaignService::LOCATIONS;

        $canonicalSlots = [
            'HEADER_BANNER',
            'TOP_NEWS',
            'SIDEBAR',
            'ARTICLE_TOP',
            'ARTICLE_MIDDLE',
            'ARTICLE_BOTTOM',
            'FOOTER',
        ];

        foreach ($canonicalSlots as $slot) {
            $this->assert(in_array($slot, $slots, true), "Slot '{$slot}' is recognized as canonical placement");
        }
        $this->assert(count($slots) === 7, "Exactly 7 canonical placements defined");
    }

    private function testCampaignCreationAndValidation(): void
    {
        echo "\n[2] Testing Campaign Creation & Validation...\n";

        // 1. Valid creation
        $validCampaign = AdCampaignService::createCampaign($this->tenantUuid, $this->siteUuid, [
            'company_name' => 'TEST_ADS_Empresa A',
            'campaign_name' => 'Campaña Inauguración 2026',
            'ad_type' => 'BANNER',
            'location' => 'HEADER_BANNER',
            'target_url' => 'https://empresa-a.example.com/promo',
            'start_at' => date('Y-m-d H:i:s', strtotime('-1 hour')),
            'end_at' => date('Y-m-d H:i:s', strtotime('+10 days')),
            'active' => 1,
        ]);

        $this->assert(!empty($validCampaign['campaign_uuid']), "Campaign created successfully with valid UUID");
        $this->assert($validCampaign['location'] === 'HEADER_BANNER', "Campaign saved with HEADER_BANNER location");

        // 2. Reject invalid placement
        $invalidPlacementCaught = false;
        try {
            AdCampaignService::createCampaign($this->tenantUuid, $this->siteUuid, [
                'company_name' => 'TEST_ADS_Invalid Slot',
                'campaign_name' => 'Test Invalid',
                'location' => 'POPUP_MODAL', // Not canonical
                'target_url' => 'https://example.com',
                'start_at' => date('Y-m-d H:i:s'),
                'end_at' => date('Y-m-d H:i:s', strtotime('+1 day')),
            ]);
        } catch (\InvalidArgumentException $e) {
            $invalidPlacementCaught = true;
        }
        $this->assert($invalidPlacementCaught, "Rejects non-canonical placement location");

        // 3. Reject invalid target URL (e.g. javascript:)
        $invalidUrlCaught = false;
        try {
            AdCampaignService::createCampaign($this->tenantUuid, $this->siteUuid, [
                'company_name' => 'TEST_ADS_XSS',
                'campaign_name' => 'Test XSS URL',
                'location' => 'SIDEBAR',
                'target_url' => 'javascript:alert(1)',
                'start_at' => date('Y-m-d H:i:s'),
                'end_at' => date('Y-m-d H:i:s', strtotime('+1 day')),
            ]);
        } catch (\InvalidArgumentException $e) {
            $invalidUrlCaught = true;
        }
        $this->assert($invalidUrlCaught, "Rejects dangerous non-HTTP/HTTPS URLs (e.g. javascript:)");

        // 4. Reject invalid date sequence (end_at <= start_at)
        $invalidDatesCaught = false;
        try {
            AdCampaignService::createCampaign($this->tenantUuid, $this->siteUuid, [
                'company_name' => 'TEST_ADS_Dates',
                'campaign_name' => 'Test Bad Dates',
                'location' => 'FOOTER',
                'target_url' => 'https://example.com',
                'start_at' => '2026-10-10 12:00:00',
                'end_at' => '2026-10-09 12:00:00',
            ]);
        } catch (\InvalidArgumentException $e) {
            $invalidDatesCaught = true;
        }
        $this->assert($invalidDatesCaught, "Rejects end_at date prior to start_at date");
    }

    private function testActiveAdsDelivery(): void
    {
        echo "\n[3] Testing Public Active Ads Delivery...\n";

        // Create active campaign for TOP_NEWS
        $campaign = AdCampaignService::createCampaign($this->tenantUuid, $this->siteUuid, [
            'company_name' => 'TEST_ADS_Supermercado',
            'campaign_name' => 'Ofertas del Día',
            'location' => 'TOP_NEWS',
            'target_url' => 'https://super.example.com',
            'start_at' => date('Y-m-d H:i:s', strtotime('-2 hours')),
            'end_at' => date('Y-m-d H:i:s', strtotime('+2 days')),
            'active' => 1,
        ]);

        $ads = AdCampaignService::getActiveAds($this->tenantUuid, $this->siteUuid, 'TOP_NEWS');
        $found = false;
        foreach ($ads as $ad) {
            if ($ad['campaign_uuid'] === $campaign['campaign_uuid']) {
                $found = true;
                break;
            }
        }
        $this->assert($found, "Active campaign within validity dates is delivered to public TOP_NEWS slot");
    }

    private function testExpiredCampaignsExcluded(): void
    {
        echo "\n[4] Testing Expired Campaigns Excluded...\n";

        // Campaign that ended yesterday
        $expired = AdCampaignService::createCampaign($this->tenantUuid, $this->siteUuid, [
            'company_name' => 'TEST_ADS_Expirada',
            'campaign_name' => 'Promo Navidad Pasada',
            'location' => 'ARTICLE_TOP',
            'target_url' => 'https://example.com/expired',
            'start_at' => date('Y-m-d H:i:s', strtotime('-10 days')),
            'end_at' => date('Y-m-d H:i:s', strtotime('-1 day')),
            'active' => 1,
        ]);

        $ads = AdCampaignService::getActiveAds($this->tenantUuid, $this->siteUuid, 'ARTICLE_TOP');
        $found = false;
        foreach ($ads as $ad) {
            if ($ad['campaign_uuid'] === $expired['campaign_uuid']) {
                $found = true;
                break;
            }
        }
        $this->assert(!$found, "Expired campaign (end_at < NOW()) is excluded from public slots");
    }

    private function testFutureCampaignsExcluded(): void
    {
        echo "\n[5] Testing Future Campaigns Excluded...\n";

        // Campaign scheduled for next week
        $future = AdCampaignService::createCampaign($this->tenantUuid, $this->siteUuid, [
            'company_name' => 'TEST_ADS_Futura',
            'campaign_name' => 'Black Friday 2026',
            'location' => 'ARTICLE_MIDDLE',
            'target_url' => 'https://example.com/future',
            'start_at' => date('Y-m-d H:i:s', strtotime('+5 days')),
            'end_at' => date('Y-m-d H:i:s', strtotime('+12 days')),
            'active' => 1,
        ]);

        $ads = AdCampaignService::getActiveAds($this->tenantUuid, $this->siteUuid, 'ARTICLE_MIDDLE');
        $found = false;
        foreach ($ads as $ad) {
            if ($ad['campaign_uuid'] === $future['campaign_uuid']) {
                $found = true;
                break;
            }
        }
        $this->assert(!$found, "Future campaign (start_at > NOW()) is excluded from public slots");
    }

    private function testInactiveCampaignsExcluded(): void
    {
        echo "\n[6] Testing Inactive Campaigns Excluded...\n";

        // Campaign within valid dates, but active = 0
        $inactive = AdCampaignService::createCampaign($this->tenantUuid, $this->siteUuid, [
            'company_name' => 'TEST_ADS_Inactiva',
            'campaign_name' => 'Campaña Pausada',
            'location' => 'ARTICLE_BOTTOM',
            'target_url' => 'https://example.com/paused',
            'start_at' => date('Y-m-d H:i:s', strtotime('-1 day')),
            'end_at' => date('Y-m-d H:i:s', strtotime('+1 day')),
            'active' => 0,
        ]);

        $ads = AdCampaignService::getActiveAds($this->tenantUuid, $this->siteUuid, 'ARTICLE_BOTTOM');
        $found = false;
        foreach ($ads as $ad) {
            if ($ad['campaign_uuid'] === $inactive['campaign_uuid']) {
                $found = true;
                break;
            }
        }
        $this->assert(!$found, "Inactive campaign (active = 0) is excluded from public slots");
    }

    private function testPlacementIsolation(): void
    {
        echo "\n[7] Testing Placement Isolation...\n";

        // Create campaign strictly for SIDEBAR
        $sidebarAd = AdCampaignService::createCampaign($this->tenantUuid, $this->siteUuid, [
            'company_name' => 'TEST_ADS_Sidebar Only',
            'campaign_name' => 'Sidebar Exclusive',
            'location' => 'SIDEBAR',
            'target_url' => 'https://example.com/sidebar',
            'start_at' => date('Y-m-d H:i:s', strtotime('-1 hour')),
            'end_at' => date('Y-m-d H:i:s', strtotime('+1 hour')),
            'active' => 1,
        ]);

        // Query FOOTER
        $footerAds = AdCampaignService::getActiveAds($this->tenantUuid, $this->siteUuid, 'FOOTER');
        $foundInFooter = false;
        foreach ($footerAds as $ad) {
            if ($ad['campaign_uuid'] === $sidebarAd['campaign_uuid']) {
                $foundInFooter = true;
                break;
            }
        }
        $this->assert(!$foundInFooter, "SIDEBAR campaign does not bleed into FOOTER slot");

        // Query SIDEBAR
        $sidebarAds = AdCampaignService::getActiveAds($this->tenantUuid, $this->siteUuid, 'SIDEBAR');
        $foundInSidebar = false;
        foreach ($sidebarAds as $ad) {
            if ($ad['campaign_uuid'] === $sidebarAd['campaign_uuid']) {
                $foundInSidebar = true;
                break;
            }
        }
        $this->assert($foundInSidebar, "SIDEBAR campaign correctly retrieved in SIDEBAR slot");
    }

    private function testMultiTenantIsolation(): void
    {
        echo "\n[8] Testing Multi-Tenant & Multi-Site Isolation...\n";

        // Create campaign under Alt Tenant / Alt Site
        $altCampaign = AdCampaignService::createCampaign($this->altTenantUuid, $this->altSiteUuid, [
            'company_name' => 'TEST_ADS_Tenant B',
            'campaign_name' => 'Tenant B Exclusive Promo',
            'location' => 'HEADER_BANNER',
            'target_url' => 'https://tenant-b.example.com',
            'start_at' => date('Y-m-d H:i:s', strtotime('-1 hour')),
            'end_at' => date('Y-m-d H:i:s', strtotime('+1 hour')),
            'active' => 1,
        ]);

        // Query public ads for Site A
        $siteAAds = AdCampaignService::getActiveAds($this->tenantUuid, $this->siteUuid, 'HEADER_BANNER');
        $leaked = false;
        foreach ($siteAAds as $ad) {
            if ($ad['campaign_uuid'] === $altCampaign['campaign_uuid']) {
                $leaked = true;
                break;
            }
        }
        $this->assert(!$leaked, "Tenant B campaign is never visible in Tenant A public ads query");

        // Query admin list for Tenant A
        $adminListA = AdCampaignService::listCampaigns($this->tenantUuid, $this->siteUuid);
        $leakedAdmin = false;
        foreach ($adminListA['items'] as $item) {
            if ($item['campaign_uuid'] === $altCampaign['campaign_uuid']) {
                $leakedAdmin = true;
                break;
            }
        }
        $this->assert(!$leakedAdmin, "Tenant B campaign is never listed in Tenant A admin list");

        // Cross-tenant delete attempt
        $deleteCrossTenant = AdCampaignService::deleteCampaign($this->tenantUuid, $this->siteUuid, $altCampaign['campaign_uuid']);
        $this->assert(!$deleteCrossTenant, "Tenant A cannot delete Tenant B campaign");
    }

    private function testAtomicTrackingAndCtr(): void
    {
        echo "\n[9] Testing Atomic Tracking & CTR Calculation...\n";

        $campaign = AdCampaignService::createCampaign($this->tenantUuid, $this->siteUuid, [
            'company_name' => 'TEST_ADS_Tracking',
            'campaign_name' => 'Metric Tracker Test',
            'location' => 'SIDEBAR',
            'target_url' => 'https://metrics.example.com/click-landing',
            'start_at' => date('Y-m-d H:i:s', strtotime('-1 hour')),
            'end_at' => date('Y-m-d H:i:s', strtotime('+1 hour')),
            'active' => 1,
        ]);
        $uuid = $campaign['campaign_uuid'];

        // Initial counts
        $c0 = AdCampaignService::getCampaign($this->tenantUuid, $this->siteUuid, $uuid);
        $this->assert((int)$c0['impressions_count'] === 0, "Initial impressions_count is 0");
        $this->assert((int)$c0['clicks_count'] === 0, "Initial clicks_count is 0");
        $this->assert($c0['ctr'] === 0.0, "Initial CTR is 0.0%");

        // Record 5 impressions
        for ($i = 0; $i < 5; $i++) {
            AdCampaignService::recordImpression($this->tenantUuid, $this->siteUuid, $uuid);
        }

        $c1 = AdCampaignService::getCampaign($this->tenantUuid, $this->siteUuid, $uuid);
        $this->assert((int)$c1['impressions_count'] === 5, "Impressions incremented atomically to 5");

        // Record 1 click
        $target = AdCampaignService::recordClick($this->tenantUuid, $this->siteUuid, $uuid);
        $this->assert($target === 'https://metrics.example.com/click-landing', "recordClick returns target URL for redirection");

        $c2 = AdCampaignService::getCampaign($this->tenantUuid, $this->siteUuid, $uuid);
        $this->assert((int)$c2['clicks_count'] === 1, "Clicks incremented atomically to 1");
        // CTR = (1 / 5) * 100 = 20.0%
        $this->assert($c2['ctr'] === 20.0, "CTR calculated correctly as 20.0% (1 click / 5 impressions)");
    }

    private function testRbacPermissions(): void
    {
        echo "\n[10] Testing RBAC Permissions (ads.manage)...\n";
        $db = Database::getConnection();

        // Check seeded permissions for role ID 1 (SUPER_ADMIN) and role ID 5 (AD_MANAGER)
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.permission_id
            WHERE rp.role_id = ? AND p.name = 'ads.manage'
        ");

        $stmt->execute([1]);
        $hasSuperAdmin = (int)$stmt->fetchColumn() > 0;
        $this->assert($hasSuperAdmin, "SUPER_ADMIN (role 1) has ads.manage permission");

        $stmt->execute([5]);
        $hasAdManager = (int)$stmt->fetchColumn() > 0;
        $this->assert($hasAdManager, "AD_MANAGER (role 5) has ads.manage permission");

        $stmt->execute([4]); // JOURNALIST
        $hasJournalist = (int)$stmt->fetchColumn() > 0;
        $this->assert(!$hasJournalist, "JOURNALIST (role 4) does NOT have ads.manage permission");

        // AuthenticatedUser simulation
        $adminUser = new AuthenticatedUser(
            'user-admin-uuid',
            $this->tenantUuid,
            $this->siteUuid,
            'Admin Ads',
            'admin@example.com',
            'ACTIVE',
            ['SUPER_ADMIN'],
            ['ads.manage', 'articles.publish'],
            'session-admin-uuid'
        );
        $this->assert($adminUser->hasPermission('ads.manage'), "Authenticated admin user satisfies ads.manage");

        $journalistUser = new AuthenticatedUser(
            'user-journo-uuid',
            $this->tenantUuid,
            $this->siteUuid,
            'Periodista Redacción',
            'journo@example.com',
            'ACTIVE',
            ['JOURNALIST'],
            ['articles.create', 'articles.edit_own'],
            'session-journo-uuid'
        );
        $this->assert(!$journalistUser->hasPermission('ads.manage'), "Journalist authenticated user rejects ads.manage");
    }

    private function testRouterEndpoints(): void
    {
        echo "\n[11] Testing Public & Admin Router Endpoints...\n";
        $router = new Router();
        $router->use(new RequestContextMiddleware());
        $router->use(new JsonBodyParserMiddleware());
        require __DIR__ . '/../routes/api.php';

        // 1. GET /api/v1/public/ads
        $reqPublic = new Request('GET', '/api/v1/public/ads?placement=HEADER_BANNER', [
            'x-tenant-id' => $this->tenantUuid,
            'x-site-id' => $this->siteUuid,
            'accept' => 'application/json',
        ]);

        ob_start();
        $router->dispatch($reqPublic);
        $rawPublic = ob_get_clean();

        $this->assert(!empty($rawPublic), "Public GET /api/v1/public/ads returned content");
        $bodyPublic = json_decode($rawPublic, true);
        $this->assert(isset($bodyPublic['data']), "Public ads response contains data array");

        // 2. POST /api/v1/public/ads/{uuid}/impression
        $sample = AdCampaignService::createCampaign($this->tenantUuid, $this->siteUuid, [
            'company_name' => 'TEST_ADS_Endpoint',
            'campaign_name' => 'Endpoint Beacon Test',
            'location' => 'HEADER_BANNER',
            'target_url' => 'https://example.com/endpoint',
            'start_at' => date('Y-m-d H:i:s', strtotime('-1 hour')),
            'end_at' => date('Y-m-d H:i:s', strtotime('+1 hour')),
            'active' => 1,
        ]);
        $uuid = $sample['campaign_uuid'];

        $reqImpression = new Request('POST', "/api/v1/public/ads/{$uuid}/impression", [
            'x-tenant-id' => $this->tenantUuid,
            'x-site-id' => $this->siteUuid,
            'accept' => 'application/json',
        ]);

        ob_start();
        $router->dispatch($reqImpression);
        $rawImpression = ob_get_clean();

        $bodyImpression = json_decode($rawImpression, true);
        $this->assert(isset($bodyImpression['data']['recorded']), "POST /api/v1/public/ads/{uuid}/impression returns recorded = true/false");

        // 3. GET /api/v1/public/ads/{uuid}/click with JSON accept
        $reqClick = new Request('GET', "/api/v1/public/ads/{$uuid}/click", [
            'x-tenant-id' => $this->tenantUuid,
            'x-site-id' => $this->siteUuid,
            'accept' => 'application/json',
        ]);

        ob_start();
        $router->dispatch($reqClick);
        $rawClick = ob_get_clean();

        $bodyClick = json_decode($rawClick, true);
        $this->assert(isset($bodyClick['data']['target_url']) && $bodyClick['data']['target_url'] === 'https://example.com/endpoint', "Click endpoint returns target URL when requested as JSON");

        // 4. Admin endpoints without auth -> 401
        $reqAdminUnauth = new Request('GET', '/api/v1/admin/ads', [
            'x-tenant-id' => $this->tenantUuid,
            'x-site-id' => $this->siteUuid,
            'accept' => 'application/json',
        ]);

        ob_start();
        $router->dispatch($reqAdminUnauth);
        $rawAdmin = ob_get_clean();

        $bodyAdmin = json_decode($rawAdmin, true);
        $this->assert(isset($bodyAdmin['success']) && $bodyAdmin['success'] === false, "GET /api/v1/admin/ads without auth returns error");
    }
}

$test = new Phase11AdsTest();
$test->run();
