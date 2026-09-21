<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Env;
use App\Database\Database;
use App\Helpers\Sanitizer;
use App\Helpers\Uuid;
use PDO;

class PushService
{
    /**
     * Canonical notification topics for Contacto con la Noticia.
     */
    public const AVAILABLE_TOPICS = [
        'breaking_news' => 'Última Hora y Alertas Urgentes',
        'regionales' => 'Regionales (Guárico)',
        'sucesos' => 'Sucesos',
        'comunidades' => 'Comunidades',
        'municipales' => 'Municipales',
        'turismo' => 'Turismo',
        'internacionales' => 'Internacionales',
    ];

    /**
     * Dev default VAPID public key (uncompressed P-256 point base64url encoded).
     */
    private const DEFAULT_VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZ_WJJnCd2WYm5Nwv34MrrRwCa2UF3L006u1K74';

    /**
     * Check if Web Push is enabled for this tenant and site.
     */
    public static function isPushEnabled(string $tenantUuid, string $siteUuid): bool
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('
            SELECT setting_value 
            FROM site_settings 
            WHERE tenant_uuid = :tenant_uuid 
              AND site_uuid = :site_uuid 
              AND setting_key = "push_notifications_enabled" 
            LIMIT 1
        ');
        $stmt->execute([
            ':tenant_uuid' => $tenantUuid,
            ':site_uuid' => $siteUuid,
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            // Enabled by default unless explicitly disabled in settings
            return true;
        }

        $val = strtolower(trim((string) $row['setting_value']));
        return !in_array($val, ['false', '0', 'disabled', 'no'], true);
    }

    /**
     * Update push enabled feature flag for a site.
     */
    public static function setPushEnabled(string $tenantUuid, string $siteUuid, bool $enabled): void
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('
            INSERT INTO site_settings (tenant_uuid, site_uuid, setting_key, setting_value)
            VALUES (:tenant_uuid, :site_uuid, "push_notifications_enabled", :val)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
        ');
        $stmt->execute([
            ':tenant_uuid' => $tenantUuid,
            ':site_uuid' => $siteUuid,
            ':val' => $enabled ? 'true' : 'false',
        ]);
    }

    /**
     * Return public VAPID key configured in environment or default.
     * Note: The PRIVATE key is NEVER returned or exposed.
     */
    public static function getVapidPublicKey(): string
    {
        $key = (string) Env::get('VAPID_PUBLIC_KEY', '');
        return !empty($key) ? $key : self::DEFAULT_VAPID_PUBLIC_KEY;
    }

    /**
     * Return available topics list formatted for frontend.
     */
    public static function getAvailableTopicsList(): array
    {
        $list = [];
        foreach (self::AVAILABLE_TOPICS as $id => $name) {
            $list[] = [
                'id' => $id,
                'name' => $name,
            ];
        }
        return $list;
    }

    /**
     * Public push configuration.
     */
    public static function getPublicConfig(string $tenantUuid, string $siteUuid): array
    {
        $enabled = self::isPushEnabled($tenantUuid, $siteUuid);

        return [
            'enabled' => $enabled,
            'public_key' => $enabled ? self::getVapidPublicKey() : null,
            'available_topics' => self::getAvailableTopicsList(),
        ];
    }

    /**
     * Register or update a push subscription.
     *
     * @param array $data {endpoint: string, keys: {p256dh: string, auth: string}, topics?: array, user_agent?: string}
     */
    public static function subscribe(string $tenantUuid, string $siteUuid, array $data): array
    {
        if (!self::isPushEnabled($tenantUuid, $siteUuid)) {
            throw new \RuntimeException('Las notificaciones push están desactivadas para este sitio.', 403);
        }

        $endpoint = trim((string) ($data['endpoint'] ?? ''));
        if (empty($endpoint) || !filter_var($endpoint, FILTER_VALIDATE_URL) || strlen($endpoint) > 1000) {
            throw new \InvalidArgumentException('El endpoint de suscripción push no es válido o excede 1000 caracteres.');
        }

        $keys = $data['keys'] ?? [];
        $p256dh = trim((string) ($keys['p256dh'] ?? ''));
        $auth = trim((string) ($keys['auth'] ?? ''));

        if (empty($p256dh) || strlen($p256dh) > 255) {
            throw new \InvalidArgumentException('La clave p256dh es inválida o requerida.');
        }

        if (empty($auth) || strlen($auth) > 255) {
            throw new \InvalidArgumentException('El token de autenticación push (auth) es inválido o requerido.');
        }

        // Validate and sanitize topics
        $requestedTopics = is_array($data['topics'] ?? null) ? $data['topics'] : ['breaking_news'];
        $sanitizedTopics = [];
        foreach ($requestedTopics as $t) {
            $tClean = is_string($t) ? trim($t) : '';
            if (isset(self::AVAILABLE_TOPICS[$tClean])) {
                $sanitizedTopics[] = $tClean;
            }
        }
        if (empty($sanitizedTopics)) {
            $sanitizedTopics = ['breaking_news'];
        }
        $sanitizedTopics = array_values(array_unique($sanitizedTopics));

        $userAgent = isset($data['user_agent']) ? substr(trim((string) $data['user_agent']), 0, 500) : null;
        $endpointHash = hash('sha256', $endpoint);

        $pdo = Database::getConnection();

        // Check if subscription already exists for this site
        $checkStmt = $pdo->prepare('
            SELECT subscription_uuid 
            FROM push_subscriptions 
            WHERE site_uuid = :site_uuid AND endpoint_hash = :endpoint_hash 
            LIMIT 1
        ');
        $checkStmt->execute([
            ':site_uuid' => $siteUuid,
            ':endpoint_hash' => $endpointHash,
        ]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        $subscriptionUuid = $existing ? (string) $existing['subscription_uuid'] : Uuid::uuid4();
        $topicsJson = json_encode($sanitizedTopics, JSON_UNESCAPED_UNICODE);

        if ($existing) {
            $updateStmt = $pdo->prepare('
                UPDATE push_subscriptions 
                SET p256dh = :p256dh,
                    auth_token = :auth_token,
                    topics = :topics,
                    user_agent = :user_agent,
                    is_active = 1,
                    updated_at = NOW()
                WHERE subscription_uuid = :subscription_uuid
            ');
            $updateStmt->execute([
                ':p256dh' => $p256dh,
                ':auth_token' => $auth,
                ':topics' => $topicsJson,
                ':user_agent' => $userAgent,
                ':subscription_uuid' => $subscriptionUuid,
            ]);
        } else {
            $insertStmt = $pdo->prepare('
                INSERT INTO push_subscriptions (
                    subscription_uuid, tenant_uuid, site_uuid, endpoint, endpoint_hash,
                    p256dh, auth_token, topics, user_agent, is_active, created_at, updated_at
                ) VALUES (
                    :subscription_uuid, :tenant_uuid, :site_uuid, :endpoint, :endpoint_hash,
                    :p256dh, :auth_token, :topics, :user_agent, 1, NOW(), NOW()
                )
            ');
            $insertStmt->execute([
                ':subscription_uuid' => $subscriptionUuid,
                ':tenant_uuid' => $tenantUuid,
                ':site_uuid' => $siteUuid,
                ':endpoint' => $endpoint,
                ':endpoint_hash' => $endpointHash,
                ':p256dh' => $p256dh,
                ':auth_token' => $auth,
                ':topics' => $topicsJson,
                ':user_agent' => $userAgent,
            ]);
        }

        return [
            'subscription_uuid' => $subscriptionUuid,
            'status' => 'subscribed',
            'topics' => $sanitizedTopics,
        ];
    }

    /**
     * Unsubscribe an endpoint.
     */
    public static function unsubscribe(string $tenantUuid, string $siteUuid, string $endpoint): bool
    {
        $endpoint = trim($endpoint);
        if (empty($endpoint)) {
            return false;
        }

        $endpointHash = hash('sha256', $endpoint);
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare('
            UPDATE push_subscriptions 
            SET is_active = 0, updated_at = NOW() 
            WHERE site_uuid = :site_uuid AND endpoint_hash = :endpoint_hash
        ');
        $stmt->execute([
            ':site_uuid' => $siteUuid,
            ':endpoint_hash' => $endpointHash,
        ]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Update notification topic preferences for an existing endpoint.
     */
    public static function updatePreferences(string $tenantUuid, string $siteUuid, string $endpoint, array $topics): array
    {
        $endpoint = trim($endpoint);
        if (empty($endpoint)) {
            throw new \InvalidArgumentException('El endpoint es requerido para actualizar preferencias.');
        }

        $sanitizedTopics = [];
        foreach ($topics as $t) {
            $tClean = is_string($t) ? trim($t) : '';
            if (isset(self::AVAILABLE_TOPICS[$tClean])) {
                $sanitizedTopics[] = $tClean;
            }
        }
        if (empty($sanitizedTopics)) {
            $sanitizedTopics = ['breaking_news'];
        }
        $sanitizedTopics = array_values(array_unique($sanitizedTopics));

        $endpointHash = hash('sha256', $endpoint);
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare('
            UPDATE push_subscriptions 
            SET topics = :topics, updated_at = NOW() 
            WHERE site_uuid = :site_uuid AND endpoint_hash = :endpoint_hash AND is_active = 1
        ');
        $stmt->execute([
            ':topics' => json_encode($sanitizedTopics, JSON_UNESCAPED_UNICODE),
            ':site_uuid' => $siteUuid,
            ':endpoint_hash' => $endpointHash,
        ]);

        if ($stmt->rowCount() === 0) {
            // Check if subscription exists at all
            $checkStmt = $pdo->prepare('
                SELECT is_active FROM push_subscriptions 
                WHERE site_uuid = :site_uuid AND endpoint_hash = :endpoint_hash LIMIT 1
            ');
            $checkStmt->execute([
                ':site_uuid' => $siteUuid,
                ':endpoint_hash' => $endpointHash,
            ]);
            $row = $checkStmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                throw new \RuntimeException('Suscripción push no encontrada para este dispositivo.', 404);
            }
        }

        return [
            'status' => 'updated',
            'topics' => $sanitizedTopics,
        ];
    }

    /**
     * Get active subscriptions for broadcasting.
     */
    public static function getActiveSubscriptions(string $tenantUuid, string $siteUuid, ?string $topic = null): array
    {
        $pdo = Database::getConnection();

        if ($topic !== null && isset(self::AVAILABLE_TOPICS[$topic])) {
            $stmt = $pdo->prepare('
                SELECT subscription_uuid, endpoint, p256dh, auth_token, topics 
                FROM push_subscriptions 
                WHERE tenant_uuid = :tenant_uuid 
                  AND site_uuid = :site_uuid 
                  AND is_active = 1
                  AND (JSON_CONTAINS(topics, :topic_json) OR topics IS NULL)
            ');
            $stmt->execute([
                ':tenant_uuid' => $tenantUuid,
                ':site_uuid' => $siteUuid,
                ':topic_json' => json_encode($topic),
            ]);
        } else {
            $stmt = $pdo->prepare('
                SELECT subscription_uuid, endpoint, p256dh, auth_token, topics 
                FROM push_subscriptions 
                WHERE tenant_uuid = :tenant_uuid 
                  AND site_uuid = :site_uuid 
                  AND is_active = 1
            ');
            $stmt->execute([
                ':tenant_uuid' => $tenantUuid,
                ':site_uuid' => $siteUuid,
            ]);
        }

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

