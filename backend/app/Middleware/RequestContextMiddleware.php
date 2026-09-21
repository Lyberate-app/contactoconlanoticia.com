<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Request;
use App\Helpers\Uuid;

class RequestContextMiddleware implements MiddlewareInterface
{
    public function handle(Request $request, callable $next): void
    {
        // 1. Assign or propagate Request ID
        $requestId = $request->getHeader('x-request-id');
        if (!$requestId || !Uuid::isValid($requestId)) {
            $requestId = Uuid::uuid4();
        }

        $request->setRequestId($requestId);
        if (!headers_sent()) {
            header("X-Request-ID: {$requestId}");
        }

        // 2. Resolve Tenant and Site context
        $tenantId = $request->getHeader('x-tenant-id');
        if ($tenantId && Uuid::isValid($tenantId)) {
            $request->setTenantId($tenantId);
        }

        $siteId = $request->getHeader('x-site-id');
        if ($siteId && Uuid::isValid($siteId)) {
            $request->setSiteId($siteId);
        }

        // Fallback: If tenant or site not resolved via headers, resolve from domain or default active site
        if (!$request->getSiteId() || !$request->getTenantId()) {
            self::resolveSiteFromEnvironmentOrDb($request);
        }

        $next($request);
    }

    /** @var array{tenant_uuid: string, site_uuid: string}|null */
    private static ?array $cachedSite = null;

    private static function resolveSiteFromEnvironmentOrDb(Request $request): void
    {
        if (self::$cachedSite !== null) {
            if (!$request->getTenantId()) {
                $request->setTenantId(self::$cachedSite['tenant_uuid']);
            }
            if (!$request->getSiteId()) {
                $request->setSiteId(self::$cachedSite['site_uuid']);
            }
            return;
        }

        try {
            $pdo = \App\Database\Database::getConnection();
            $host = $request->getHeader('host') ?? '';
            $domain = preg_replace('/:\d+$/', '', trim($host));

            // Try domain match
            if ($domain !== '' && $domain !== 'localhost' && $domain !== '127.0.0.1') {
                $stmt = $pdo->prepare('SELECT tenant_uuid, site_uuid FROM sites WHERE domain = :domain AND status = "ACTIVE" LIMIT 1');
                $stmt->execute([':domain' => $domain]);
                $site = $stmt->fetch(\PDO::FETCH_ASSOC);
                if ($site) {
                    self::$cachedSite = $site;
                    $request->setTenantId($site['tenant_uuid']);
                    $request->setSiteId($site['site_uuid']);
                    return;
                }
            }

            // Fallback: first active site
            $stmt = $pdo->query('SELECT tenant_uuid, site_uuid FROM sites WHERE status = "ACTIVE" ORDER BY created_at ASC LIMIT 1');
            $site = $stmt ? $stmt->fetch(\PDO::FETCH_ASSOC) : null;
            if ($site) {
                self::$cachedSite = $site;
                if (!$request->getTenantId()) {
                    $request->setTenantId($site['tenant_uuid']);
                }
                if (!$request->getSiteId()) {
                    $request->setSiteId($site['site_uuid']);
                }
            }
        } catch (\Throwable) {
            // In standalone test or non-db context, silently ignore
        }
    }
}
