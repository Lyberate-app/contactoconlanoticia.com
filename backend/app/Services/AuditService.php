<?php

declare(strict_types=1);

namespace App\Services;

use App\Database\Database;

class AuditService
{
    private const REDACTED_KEYS = [
        'password',
        'password_confirmation',
        'token',
        'token_hash',
        'secret',
        'two_factor_secret',
        'recovery_code',
        'recovery_codes',
        'code',
        'authorization',
        'cookie',
    ];

    /**
     * Record a security or administrative audit event.
     */
    public static function log(
        string $tenantUuid,
        string $siteUuid,
        ?string $userUuid,
        string $action,
        string $entityType = 'AUTH',
        ?string $entityUuid = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        array $metadata = []
    ): void {
        try {
            $pdo = Database::getConnection();

            $sanitizedMeta = self::sanitizeMetadata($metadata);
            $metaJson = !empty($sanitizedMeta) ? json_encode($sanitizedMeta, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : null;

            $stmt = $pdo->prepare('
                INSERT INTO audit_logs (
                    tenant_uuid,
                    site_uuid,
                    user_uuid,
                    action,
                    entity_type,
                    entity_uuid,
                    ip_address,
                    user_agent,
                    metadata
                ) VALUES (
                    :tenant_uuid,
                    :site_uuid,
                    :user_uuid,
                    :action,
                    :entity_type,
                    :entity_uuid,
                    :ip_address,
                    :user_agent,
                    :metadata
                )
            ');

            $stmt->execute([
                ':tenant_uuid' => $tenantUuid,
                ':site_uuid' => $siteUuid,
                ':user_uuid' => $userUuid,
                ':action' => strtoupper($action),
                ':entity_type' => strtoupper($entityType),
                ':entity_uuid' => $entityUuid,
                ':ip_address' => $ipAddress ? substr($ipAddress, 0, 45) : null,
                ':user_agent' => $userAgent ? substr($userAgent, 0, 500) : null,
                ':metadata' => $metaJson,
            ]);
        } catch (\Throwable) {
            // Fail-safe: audit logging failure should never crash user transactions
        }
    }

    /**
     * Remove passwords, tokens, secrets and codes from metadata.
     */
    private static function sanitizeMetadata(array $data): array
    {
        $cleaned = [];

        foreach ($data as $key => $value) {
            $lowerKey = strtolower((string) $key);

            $shouldRedact = false;
            foreach (self::REDACTED_KEYS as $redactedKey) {
                if (str_contains($lowerKey, $redactedKey)) {
                    $shouldRedact = true;
                    break;
                }
            }

            if ($shouldRedact) {
                $cleaned[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $cleaned[$key] = self::sanitizeMetadata($value);
            } else {
                $cleaned[$key] = $value;
            }
        }

        return $cleaned;
    }
}

