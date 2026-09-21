<?php

declare(strict_types=1);

namespace App\Services;

use App\Database\Database;
use App\Helpers\Sanitizer;
use App\Helpers\Uuid;
use PDO;

class AdCampaignService
{
    /**
     * Canonical ad slot locations defined by Lyberate.
     */
    public const LOCATIONS = [
        'HEADER_BANNER',
        'TOP_NEWS',
        'SIDEBAR',
        'ARTICLE_TOP',
        'ARTICLE_MIDDLE',
        'ARTICLE_BOTTOM',
        'FOOTER',
    ];

    /**
     * Canonical ad types.
     */
    public const AD_TYPES = [
        'BANNER',
        'SPONSORED',
        'POPUP',
    ];

    /**
     * Get active ads for public display filtered by site, date validity, and slot.
     */
    public static function getActiveAds(string $tenantUuid, string $siteUuid, ?string $location = null): array
    {
        $pdo = Database::getConnection();

        $where = [
            'a.tenant_uuid = :tenant_uuid',
            'a.site_uuid = :site_uuid',
            'a.active = 1',
            '(a.start_at IS NULL OR a.start_at <= NOW())',
            '(a.end_at IS NULL OR a.end_at >= NOW())',
        ];

        $bindings = [
            ':tenant_uuid' => $tenantUuid,
            ':site_uuid' => $siteUuid,
        ];

        if ($location !== null && in_array($location, self::LOCATIONS, true)) {
            $where[] = 'a.location = :location';
            $bindings[':location'] = $location;
        }

        $whereSql = implode(' AND ', $where);

        $sql = "
            SELECT 
                a.campaign_uuid,
                a.company_name,
                a.campaign_name,
                a.ad_type,
                a.location,
                a.target_url,
                a.media_uuid,
                m.storage_path AS media_path,
                m.alt_text AS media_alt,
                m.caption AS media_caption
            FROM ad_campaigns a
            LEFT JOIN media m ON m.media_uuid = a.media_uuid
            WHERE {$whereSql}
            ORDER BY a.created_at DESC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($bindings);
        $ads = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Normalize media URLs and sanitize target URLs
        foreach ($ads as &$ad) {
            if (!empty($ad['media_path'])) {
                $ad['media_url'] = '/uploads/' . ltrim($ad['media_path'], '/');
            } else {
                $ad['media_url'] = null;
            }
        }
        unset($ad);

        return $ads;
    }

    /**
     * Record impression count atomically for an active ad.
     */
    public static function recordImpression(string $tenantUuid, string $siteUuid, string $campaignUuid): bool
    {
        if (!Uuid::isValid($campaignUuid)) {
            return false;
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('
            UPDATE ad_campaigns 
            SET impressions_count = impressions_count + 1 
            WHERE campaign_uuid = :campaign_uuid 
              AND tenant_uuid = :tenant_uuid 
              AND site_uuid = :site_uuid
        ');
        $stmt->execute([
            ':campaign_uuid' => $campaignUuid,
            ':tenant_uuid' => $tenantUuid,
            ':site_uuid' => $siteUuid,
        ]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Record click count atomically and retrieve the target URL.
     */
    public static function recordClick(string $tenantUuid, string $siteUuid, string $campaignUuid): ?string
    {
        if (!Uuid::isValid($campaignUuid)) {
            return null;
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('
            SELECT target_url 
            FROM ad_campaigns 
            WHERE campaign_uuid = :campaign_uuid 
              AND tenant_uuid = :tenant_uuid 
              AND site_uuid = :site_uuid
        ');
        $stmt->execute([
            ':campaign_uuid' => $campaignUuid,
            ':tenant_uuid' => $tenantUuid,
            ':site_uuid' => $siteUuid,
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        // Increment click count atomically
        $updateStmt = $pdo->prepare('
            UPDATE ad_campaigns 
            SET clicks_count = clicks_count + 1 
            WHERE campaign_uuid = :campaign_uuid
        ');
        $updateStmt->execute([':campaign_uuid' => $campaignUuid]);

        return (string) $row['target_url'];
    }

    /**
     * List all campaigns for administrative management.
     */
    public static function listCampaigns(
        string $tenantUuid,
        string $siteUuid,
        array $filters = [],
        int $page = 1,
        int $limit = 20
    ): array {
        $pdo = Database::getConnection();

        $where = [
            'a.tenant_uuid = :tenant_uuid',
            'a.site_uuid = :site_uuid',
        ];
        $bindings = [
            ':tenant_uuid' => $tenantUuid,
            ':site_uuid' => $siteUuid,
        ];

        if (!empty($filters['location']) && in_array($filters['location'], self::LOCATIONS, true)) {
            $where[] = 'a.location = :location';
            $bindings[':location'] = $filters['location'];
        }

        if (isset($filters['active']) && $filters['active'] !== '') {
            $where[] = 'a.active = :active';
            $bindings[':active'] = (int) $filters['active'];
        }

        $whereSql = implode(' AND ', $where);

        // Count total matching
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM ad_campaigns a WHERE {$whereSql}");
        $countStmt->execute($bindings);
        $total = (int) $countStmt->fetchColumn();

        $page = max(1, $page);
        $limit = max(1, min(100, $limit));
        $offset = ($page - 1) * $limit;

        $sql = "
            SELECT 
                a.campaign_uuid,
                a.tenant_uuid,
                a.site_uuid,
                a.company_name,
                a.campaign_name,
                a.ad_type,
                a.location,
                a.start_at,
                a.end_at,
                a.target_url,
                a.media_uuid,
                a.active,
                a.impressions_count,
                a.clicks_count,
                a.created_at,
                a.updated_at,
                m.storage_path AS media_path,
                m.alt_text AS media_alt
            FROM ad_campaigns a
            LEFT JOIN media m ON m.media_uuid = a.media_uuid
            WHERE {$whereSql}
            ORDER BY a.created_at DESC
            LIMIT {$limit} OFFSET {$offset}
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($bindings);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($items as &$item) {
            $item['active'] = (bool) $item['active'];
            $item['impressions_count'] = (int) $item['impressions_count'];
            $item['clicks_count'] = (int) $item['clicks_count'];
            $item['ctr'] = $item['impressions_count'] > 0
                ? round(($item['clicks_count'] / $item['impressions_count']) * 100, 2)
                : 0.0;
            $item['media_url'] = !empty($item['media_path']) ? '/uploads/' . ltrim($item['media_path'], '/') : null;
        }
        unset($item);

        return [
            'items' => $items,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => (int) ceil($total / $limit),
            ],
        ];
    }

    /**
     * Get single campaign by UUID.
     */
    public static function getCampaign(string $tenantUuid, string $siteUuid, string $campaignUuid): ?array
    {
        if (!Uuid::isValid($campaignUuid)) {
            return null;
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('
            SELECT 
                a.*,
                m.storage_path AS media_path,
                m.alt_text AS media_alt
            FROM ad_campaigns a
            LEFT JOIN media m ON m.media_uuid = a.media_uuid
            WHERE a.campaign_uuid = :campaign_uuid 
              AND a.tenant_uuid = :tenant_uuid 
              AND a.site_uuid = :site_uuid
            LIMIT 1
        ');
        $stmt->execute([
            ':campaign_uuid' => $campaignUuid,
            ':tenant_uuid' => $tenantUuid,
            ':site_uuid' => $siteUuid,
        ]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$item) {
            return null;
        }

        $item['active'] = (bool) $item['active'];
        $item['impressions_count'] = (int) $item['impressions_count'];
        $item['clicks_count'] = (int) $item['clicks_count'];
        $item['ctr'] = $item['impressions_count'] > 0
            ? round(($item['clicks_count'] / $item['impressions_count']) * 100, 2)
            : 0.0;
        $item['media_url'] = !empty($item['media_path']) ? '/uploads/' . ltrim($item['media_path'], '/') : null;

        return $item;
    }

    /**
     * Validate and create a new ad campaign.
     */
    public static function createCampaign(string $tenantUuid, string $siteUuid, array $data): array
    {
        self::validateCampaignData($tenantUuid, $siteUuid, $data);

        $campaignUuid = Uuid::uuid4();
        $companyName = Sanitizer::stripTags((string) $data['company_name']);
        $campaignName = Sanitizer::stripTags((string) $data['campaign_name']);
        $adType = in_array($data['ad_type'] ?? '', self::AD_TYPES, true) ? $data['ad_type'] : 'BANNER';
        $location = $data['location'];
        $targetUrl = filter_var($data['target_url'], FILTER_SANITIZE_URL);
        $mediaUuid = !empty($data['media_uuid']) ? $data['media_uuid'] : null;
        $active = isset($data['active']) ? (int) (bool) $data['active'] : 1;
        $startAt = !empty($data['start_at']) ? $data['start_at'] : null;
        $endAt = !empty($data['end_at']) ? $data['end_at'] : null;

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('
            INSERT INTO ad_campaigns (
                campaign_uuid, tenant_uuid, site_uuid, company_name, campaign_name,
                ad_type, location, start_at, end_at, target_url, media_uuid,
                active, impressions_count, clicks_count, created_at, updated_at
            ) VALUES (
                :campaign_uuid, :tenant_uuid, :site_uuid, :company_name, :campaign_name,
                :ad_type, :location, :start_at, :end_at, :target_url, :media_uuid,
                :active, 0, 0, NOW(), NOW()
            )
        ');
        $stmt->execute([
            ':campaign_uuid' => $campaignUuid,
            ':tenant_uuid' => $tenantUuid,
            ':site_uuid' => $siteUuid,
            ':company_name' => $companyName,
            ':campaign_name' => $campaignName,
            ':ad_type' => $adType,
            ':location' => $location,
            ':start_at' => $startAt,
            ':end_at' => $endAt,
            ':target_url' => $targetUrl,
            ':media_uuid' => $mediaUuid,
            ':active' => $active,
        ]);

        return self::getCampaign($tenantUuid, $siteUuid, $campaignUuid);
    }

    /**
     * Validate and update an existing ad campaign.
     */
    public static function updateCampaign(string $tenantUuid, string $siteUuid, string $campaignUuid, array $data): array
    {
        $existing = self::getCampaign($tenantUuid, $siteUuid, $campaignUuid);
        if (!$existing) {
            throw new \RuntimeException('Campaña publicitaria no encontrada.', 404);
        }

        self::validateCampaignData($tenantUuid, $siteUuid, $data, false);

        $companyName = isset($data['company_name']) ? Sanitizer::stripTags((string) $data['company_name']) : $existing['company_name'];
        $campaignName = isset($data['campaign_name']) ? Sanitizer::stripTags((string) $data['campaign_name']) : $existing['campaign_name'];
        $adType = isset($data['ad_type']) && in_array($data['ad_type'], self::AD_TYPES, true) ? $data['ad_type'] : $existing['ad_type'];
        $location = isset($data['location']) && in_array($data['location'], self::LOCATIONS, true) ? $data['location'] : $existing['location'];
        $targetUrl = isset($data['target_url']) ? filter_var($data['target_url'], FILTER_SANITIZE_URL) : $existing['target_url'];
        $mediaUuid = array_key_exists('media_uuid', $data) ? (!empty($data['media_uuid']) ? $data['media_uuid'] : null) : $existing['media_uuid'];
        $active = isset($data['active']) ? (int) (bool) $data['active'] : (int) $existing['active'];
        $startAt = array_key_exists('start_at', $data) ? (!empty($data['start_at']) ? $data['start_at'] : null) : $existing['start_at'];
        $endAt = array_key_exists('end_at', $data) ? (!empty($data['end_at']) ? $data['end_at'] : null) : $existing['end_at'];

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('
            UPDATE ad_campaigns SET
                company_name = :company_name,
                campaign_name = :campaign_name,
                ad_type = :ad_type,
                location = :location,
                start_at = :start_at,
                end_at = :end_at,
                target_url = :target_url,
                media_uuid = :media_uuid,
                active = :active,
                updated_at = NOW()
            WHERE campaign_uuid = :campaign_uuid 
              AND tenant_uuid = :tenant_uuid 
              AND site_uuid = :site_uuid
        ');
        $stmt->execute([
            ':company_name' => $companyName,
            ':campaign_name' => $campaignName,
            ':ad_type' => $adType,
            ':location' => $location,
            ':start_at' => $startAt,
            ':end_at' => $endAt,
            ':target_url' => $targetUrl,
            ':media_uuid' => $mediaUuid,
            ':active' => $active,
            ':campaign_uuid' => $campaignUuid,
            ':tenant_uuid' => $tenantUuid,
            ':site_uuid' => $siteUuid,
        ]);

        return self::getCampaign($tenantUuid, $siteUuid, $campaignUuid);
    }

    /**
     * Delete an ad campaign.
     */
    public static function deleteCampaign(string $tenantUuid, string $siteUuid, string $campaignUuid): bool
    {
        if (!Uuid::isValid($campaignUuid)) {
            return false;
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('
            DELETE FROM ad_campaigns 
            WHERE campaign_uuid = :campaign_uuid 
              AND tenant_uuid = :tenant_uuid 
              AND site_uuid = :site_uuid
        ');
        $stmt->execute([
            ':campaign_uuid' => $campaignUuid,
            ':tenant_uuid' => $tenantUuid,
            ':site_uuid' => $siteUuid,
        ]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Common validation helper for campaign data.
     */
    private static function validateCampaignData(string $tenantUuid, string $siteUuid, array $data, bool $isCreate = true): void
    {
        if ($isCreate || isset($data['company_name'])) {
            $company = trim((string) ($data['company_name'] ?? ''));
            if ($company === '' || strlen($company) > 255) {
                throw new \InvalidArgumentException('El nombre de la empresa anunciante es requerido (máximo 255 caracteres).');
            }
        }

        if ($isCreate || isset($data['campaign_name'])) {
            $camp = trim((string) ($data['campaign_name'] ?? ''));
            if ($camp === '' || strlen($camp) > 255) {
                throw new \InvalidArgumentException('El nombre de la campaña es requerido (máximo 255 caracteres).');
            }
        }

        if ($isCreate || isset($data['location'])) {
            $loc = $data['location'] ?? '';
            if (!in_array($loc, self::LOCATIONS, true)) {
                throw new \InvalidArgumentException('Ubicación de espacio publicitario no válida.');
            }
        }

        if ($isCreate || isset($data['target_url'])) {
            $url = trim((string) ($data['target_url'] ?? ''));
            if ($url === '' || !filter_var($url, FILTER_VALIDATE_URL) || strlen($url) > 1000) {
                throw new \InvalidArgumentException('La URL de destino no es válida o supera los 1000 caracteres.');
            }
            $scheme = parse_url($url, PHP_URL_SCHEME);
            if (!in_array(strtolower((string) $scheme), ['http', 'https'], true)) {
                throw new \InvalidArgumentException('La URL de destino debe usar un protocolo seguro http o https.');
            }
        }

        // Validate media_uuid if provided
        if (!empty($data['media_uuid'])) {
            if (!Uuid::isValid($data['media_uuid'])) {
                throw new \InvalidArgumentException('El UUID del archivo multimedia no es válido.');
            }
            $pdo = Database::getConnection();
            $mediaStmt = $pdo->prepare('
                SELECT media_uuid FROM media 
                WHERE media_uuid = :uuid AND tenant_uuid = :tenant AND site_uuid = :site 
                LIMIT 1
            ');
            $mediaStmt->execute([
                ':uuid' => $data['media_uuid'],
                ':tenant' => $tenantUuid,
                ':site' => $siteUuid,
            ]);
            if (!$mediaStmt->fetch()) {
                throw new \InvalidArgumentException('El medio asociado no existe o no pertenece a este sitio.');
            }
        }

        // Validate date ranges
        $start = !empty($data['start_at']) ? strtotime($data['start_at']) : null;
        $end = !empty($data['end_at']) ? strtotime($data['end_at']) : null;
        if ($start !== null && $end !== null && $end < $start) {
            throw new \InvalidArgumentException('La fecha de fin no puede ser anterior a la fecha de inicio.');
        }
    }
}
