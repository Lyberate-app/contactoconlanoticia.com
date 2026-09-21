<?php

declare(strict_types=1);

namespace App\Services;

use App\Database\Database;
use App\Helpers\Uuid;
use App\Security\AuthenticatedUser;
use App\Security\Password;
use App\Security\RateLimiter;
use App\Security\Totp;
use PDO;

class AuthService
{
    public const COOKIE_NAME = 'lyberate_session';
    public const SESSION_LIFETIME = 604800; // 7 days in seconds
    public const MAX_LOGIN_ATTEMPTS = 5;
    public const RATE_LIMIT_DECAY = 900; // 15 minutes in seconds

    /**
     * Authenticate user credentials.
     *
     * @return array{success: bool, error?: string, code?: string, requires_2fa?: bool, ticket?: string, user?: array, retry_after?: int}
     */
    public static function login(string $email, string $password, string $ip, string $userAgent): array
    {
        $rateKey = 'login:' . hash('sha256', strtolower(trim($email)) . '|' . $ip);

        if (RateLimiter::tooManyAttempts($rateKey, self::MAX_LOGIN_ATTEMPTS)) {
            $retryAfter = RateLimiter::availableIn($rateKey);
            return [
                'success' => false,
                'error' => 'Demasiados intentos fallidos. Intente de nuevo más tarde.',
                'code' => 'TOO_MANY_REQUESTS',
                'retry_after' => $retryAfter,
            ];
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('
            SELECT user_uuid, tenant_uuid, site_uuid, name, email, password_hash, status 
            FROM users 
            WHERE email = :email 
            LIMIT 1
        ');
        $stmt->execute([':email' => strtolower(trim($email))]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !Password::verify($password, (string) $user['password_hash'])) {
            RateLimiter::hit($rateKey, self::RATE_LIMIT_DECAY);
            AuditService::log(
                $user['tenant_uuid'] ?? '00000000-0000-0000-0000-000000000001',
                $user['site_uuid'] ?? '00000000-0000-0000-0000-000000000002',
                $user['user_uuid'] ?? null,
                'LOGIN_FAILED',
                'AUTH',
                null,
                $ip,
                $userAgent,
                ['email' => $email, 'reason' => 'invalid_credentials']
            );

            return [
                'success' => false,
                'error' => 'Credenciales incorrectas.',
                'code' => 'INVALID_CREDENTIALS',
            ];
        }

        if ($user['status'] !== 'ACTIVE') {
            AuditService::log(
                $user['tenant_uuid'],
                $user['site_uuid'],
                $user['user_uuid'],
                'LOGIN_FAILED',
                'AUTH',
                null,
                $ip,
                $userAgent,
                ['email' => $email, 'reason' => 'user_inactive', 'status' => $user['status']]
            );

            return [
                'success' => false,
                'error' => 'Esta cuenta de usuario no se encuentra activa.',
                'code' => 'ACCOUNT_INACTIVE',
            ];
        }

        // Check if 2FA is active for user
        $stmt2fa = $pdo->prepare('
            SELECT is_enabled 
            FROM user_two_factor 
            WHERE user_uuid = :user_uuid AND is_enabled = 1
        ');
        $stmt2fa->execute([':user_uuid' => $user['user_uuid']]);
        $has2fa = (bool) $stmt2fa->fetchColumn();

        if ($has2fa) {
            // Issue temporary 2FA ticket valid for 5 minutes
            $ticket = bin2hex(random_bytes(32));
            $ticketKey = '2fa_ticket:' . $ticket;
            RateLimiter::hit($ticketKey, 300); // reuse rate_limits as transient store

            // Store ticket metadata in a temporary session entry with negative expiry or dedicated record
            $ticketHash = hash('sha256', $ticket);
            $expiresAt = date('Y-m-d H:i:s', time() + 300);

            $stmtTicket = $pdo->prepare('
                INSERT INTO sessions (session_uuid, user_uuid, tenant_uuid, site_uuid, token_hash, expires_at)
                VALUES (:session_uuid, :user_uuid, :tenant_uuid, :site_uuid, :token_hash, :expires_at)
            ');
            $stmtTicket->execute([
                ':session_uuid' => Uuid::uuid4(),
                ':user_uuid' => $user['user_uuid'],
                ':tenant_uuid' => $user['tenant_uuid'],
                ':site_uuid' => $user['site_uuid'],
                ':token_hash' => $ticketHash,
                ':expires_at' => $expiresAt,
            ]);

            return [
                'success' => true,
                'requires_2fa' => true,
                'ticket' => $ticket,
            ];
        }

        // Success: Clear login attempts, create full session
        RateLimiter::reset($rateKey);
        self::createSession($user['user_uuid'], $user['tenant_uuid'], $user['site_uuid']);

        // Update last login
        $pdo->prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_uuid = :u')
            ->execute([':u' => $user['user_uuid']]);

        // Audit log
        AuditService::log(
            $user['tenant_uuid'],
            $user['site_uuid'],
            $user['user_uuid'],
            'LOGIN_SUCCESS',
            'AUTH',
            $user['user_uuid'],
            $ip,
            $userAgent
        );

        $authUser = self::loadUserData($user['user_uuid']);

        return [
            'success' => true,
            'requires_2fa' => false,
            'user' => $authUser ? $authUser->toArray() : [],
        ];
    }

    /**
     * Verify 2FA TOTP code or recovery code.
     *
     * @return array{success: bool, error?: string, code?: string, user?: array, retry_after?: int}
     */
    public static function verify2fa(string $ticket, string $code, string $ip, string $userAgent): array
    {
        $rateKey = '2fa_verify:' . $ip;
        if (RateLimiter::tooManyAttempts($rateKey, self::MAX_LOGIN_ATTEMPTS)) {
            return [
                'success' => false,
                'error' => 'Demasiados intentos de verificación. Intente de nuevo más tarde.',
                'code' => 'TOO_MANY_REQUESTS',
                'retry_after' => RateLimiter::availableIn($rateKey),
            ];
        }

        $pdo = Database::getConnection();
        $ticketHash = hash('sha256', $ticket);

        // Find and consume temporary ticket session
        $stmt = $pdo->prepare('
            SELECT session_uuid, user_uuid, tenant_uuid, site_uuid 
            FROM sessions 
            WHERE token_hash = :hash AND revoked_at IS NULL AND expires_at > NOW()
            LIMIT 1
        ');
        $stmt->execute([':hash' => $ticketHash]);
        $ticketSession = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$ticketSession) {
            RateLimiter::hit($rateKey, self::RATE_LIMIT_DECAY);
            return [
                'success' => false,
                'error' => 'El ticket de 2FA ha expirado o no es válido.',
                'code' => 'INVALID_TICKET',
            ];
        }

        $userUuid = $ticketSession['user_uuid'];

        // Get 2FA secret
        $stmt2fa = $pdo->prepare('SELECT secret FROM user_two_factor WHERE user_uuid = :u AND is_enabled = 1');
        $stmt2fa->execute([':u' => $userUuid]);
        $secret = (string) $stmt2fa->fetchColumn();

        $valid = false;
        $isRecovery = false;

        if ($secret !== '' && Totp::verify($code, $secret)) {
            $valid = true;
        } else {
            // Check recovery codes
            $normCode = strtoupper(trim($code));
            $stmtRec = $pdo->prepare('
                SELECT code_uuid, code_hash 
                FROM user_recovery_codes 
                WHERE user_uuid = :u AND used_at IS NULL
            ');
            $stmtRec->execute([':u' => $userUuid]);
            $recoveryCodes = $stmtRec->fetchAll(PDO::FETCH_ASSOC);

            foreach ($recoveryCodes as $rc) {
                if (Password::verify($normCode, $rc['code_hash'])) {
                    $valid = true;
                    $isRecovery = true;
                    // Mark recovery code as used (single-use)
                    $pdo->prepare('UPDATE user_recovery_codes SET used_at = CURRENT_TIMESTAMP WHERE code_uuid = :id')
                        ->execute([':id' => $rc['code_uuid']]);
                    AuditService::log(
                        $ticketSession['tenant_uuid'],
                        $ticketSession['site_uuid'],
                        $userUuid,
                        'RECOVERY_CODE_USED',
                        'AUTH',
                        $rc['code_uuid'],
                        $ip,
                        $userAgent
                    );
                    break;
                }
            }
        }

        // Revoke the temporary ticket session so it cannot be re-used
        $pdo->prepare('UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE session_uuid = :id')
            ->execute([':id' => $ticketSession['session_uuid']]);

        if (!$valid) {
            RateLimiter::hit($rateKey, self::RATE_LIMIT_DECAY);
            AuditService::log(
                $ticketSession['tenant_uuid'],
                $ticketSession['site_uuid'],
                $userUuid,
                'LOGIN_2FA_FAILED',
                'AUTH',
                null,
                $ip,
                $userAgent
            );

            return [
                'success' => false,
                'error' => 'Código de autenticación o de recuperación inválido.',
                'code' => 'INVALID_2FA_CODE',
            ];
        }

        // Issue full session
        RateLimiter::reset($rateKey);
        self::createSession($userUuid, $ticketSession['tenant_uuid'], $ticketSession['site_uuid']);

        $pdo->prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_uuid = :u')
            ->execute([':u' => $userUuid]);

        AuditService::log(
            $ticketSession['tenant_uuid'],
            $ticketSession['site_uuid'],
            $userUuid,
            'LOGIN_2FA_SUCCESS',
            'AUTH',
            $userUuid,
            $ip,
            $userAgent,
            ['used_recovery_code' => $isRecovery]
        );

        $authUser = self::loadUserData($userUuid);

        return [
            'success' => true,
            'user' => $authUser ? $authUser->toArray() : [],
        ];
    }

    /**
     * Create server-side session and issue HttpOnly cookie.
     */
    public static function createSession(string $userUuid, string $tenantUuid, string $siteUuid): string
    {
        $rawToken = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $rawToken);
        $sessionUuid = Uuid::uuid4();
        $expiresAt = date('Y-m-d H:i:s', time() + self::SESSION_LIFETIME);

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('
            INSERT INTO sessions (
                session_uuid,
                user_uuid,
                tenant_uuid,
                site_uuid,
                token_hash,
                expires_at,
                created_at,
                last_seen_at
            ) VALUES (
                :session_uuid,
                :user_uuid,
                :tenant_uuid,
                :site_uuid,
                :token_hash,
                :expires_at,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
        ');

        $stmt->execute([
            ':session_uuid' => $sessionUuid,
            ':user_uuid' => $userUuid,
            ':tenant_uuid' => $tenantUuid,
            ':site_uuid' => $siteUuid,
            ':token_hash' => $tokenHash,
            ':expires_at' => $expiresAt,
        ]);

        self::setSessionCookie($rawToken, time() + self::SESSION_LIFETIME);

        return $rawToken;
    }

    /**
     * Validate session token against database.
     */
    public static function validateSession(string $rawToken): ?AuthenticatedUser
    {
        $tokenHash = hash('sha256', $rawToken);
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare('
            SELECT s.session_uuid, s.user_uuid, s.tenant_uuid, s.site_uuid, s.expires_at,
                   u.name, u.email, u.status
            FROM sessions s
            JOIN users u ON u.user_uuid = s.user_uuid
            WHERE s.token_hash = :hash
              AND s.revoked_at IS NULL
              AND s.expires_at > CURRENT_TIMESTAMP
              AND u.status = "ACTIVE"
            LIMIT 1
        ');
        $stmt->execute([':hash' => $tokenHash]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        // Update last_seen_at
        $pdo->prepare('UPDATE sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE session_uuid = :id')
            ->execute([':id' => $row['session_uuid']]);

        // Load roles and permissions
        $roles = self::getUserRoles($row['user_uuid']);
        $permissions = self::getUserPermissions($row['user_uuid']);

        return new AuthenticatedUser(
            $row['user_uuid'],
            $row['tenant_uuid'],
            $row['site_uuid'],
            $row['name'],
            $row['email'],
            $row['status'],
            $roles,
            $permissions,
            $row['session_uuid']
        );
    }

    /**
     * Revoke active session and clear cookie.
     */
    public static function logout(?string $rawToken, ?AuthenticatedUser $user = null): void
    {
        if ($rawToken) {
            $tokenHash = hash('sha256', $rawToken);
            $pdo = Database::getConnection();
            $pdo->prepare('UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = :hash')
                ->execute([':hash' => $tokenHash]);
        }

        self::setSessionCookie('', time() - 3600);

        if ($user) {
            AuditService::log(
                $user->getTenantUuid(),
                $user->getSiteUuid(),
                $user->getUserUuid(),
                'LOGOUT',
                'AUTH',
                $user->getUserUuid()
            );
        }
    }

    /**
     * Set secure session cookie.
     */
    public static function setSessionCookie(string $value, int $expires): void
    {
        if (headers_sent()) {
            return;
        }

        $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

        setcookie(self::COOKIE_NAME, $value, [
            'expires' => $expires,
            'path' => '/',
            'httponly' => true,
            'secure' => $isSecure,
            'samesite' => 'Lax',
        ]);
    }

    /**
     * Initialize 2FA setup for user.
     *
     * @return array{secret: string, otpauth_url: string, recovery_codes: array<string>}
     */
    public static function setup2fa(AuthenticatedUser $user): array
    {
        $secret = Totp::generateSecret();
        $recoveryCodes = Totp::generateRecoveryCodes(8);
        $otpauthUrl = Totp::getOtpAuthUrl($user->getEmail(), $secret, 'Lyberate');

        $pdo = Database::getConnection();

        // Save secret unconfirmed
        $stmt = $pdo->prepare('
            INSERT INTO user_two_factor (user_uuid, secret, is_enabled)
            VALUES (:user_uuid, :secret, 0)
            ON DUPLICATE KEY UPDATE secret = VALUES(secret), is_enabled = 0
        ');
        $stmt->execute([':user_uuid' => $user->getUserUuid(), ':secret' => $secret]);

        // Delete old unused recovery codes and insert new hashed ones
        $pdo->prepare('DELETE FROM user_recovery_codes WHERE user_uuid = :u')
            ->execute([':u' => $user->getUserUuid()]);

        $insertRc = $pdo->prepare('
            INSERT INTO user_recovery_codes (code_uuid, user_uuid, code_hash)
            VALUES (:id, :u, :hash)
        ');

        foreach ($recoveryCodes as $code) {
            $insertRc->execute([
                ':id' => Uuid::uuid4(),
                ':u' => $user->getUserUuid(),
                ':hash' => Password::hash($code),
            ]);
        }

        return [
            'secret' => $secret,
            'otpauth_url' => $otpauthUrl,
            'recovery_codes' => $recoveryCodes,
        ];
    }

    /**
     * Confirm and enable 2FA with user code.
     */
    public static function enable2fa(AuthenticatedUser $user, string $code): bool
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('SELECT secret FROM user_two_factor WHERE user_uuid = :u');
        $stmt->execute([':u' => $user->getUserUuid()]);
        $secret = (string) $stmt->fetchColumn();

        if ($secret === '' || !Totp::verify($code, $secret)) {
            return false;
        }

        $pdo->prepare('UPDATE user_two_factor SET is_enabled = 1 WHERE user_uuid = :u')
            ->execute([':u' => $user->getUserUuid()]);

        AuditService::log(
            $user->getTenantUuid(),
            $user->getSiteUuid(),
            $user->getUserUuid(),
            '2FA_ENABLED',
            'AUTH',
            $user->getUserUuid()
        );

        return true;
    }

    /**
     * Disable 2FA with password verification.
     */
    public static function disable2fa(AuthenticatedUser $user, string $password): bool
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE user_uuid = :u');
        $stmt->execute([':u' => $user->getUserUuid()]);
        $hash = (string) $stmt->fetchColumn();

        if (!$hash || !Password::verify($password, $hash)) {
            return false;
        }

        $pdo->prepare('DELETE FROM user_two_factor WHERE user_uuid = :u')
            ->execute([':u' => $user->getUserUuid()]);
        $pdo->prepare('DELETE FROM user_recovery_codes WHERE user_uuid = :u')
            ->execute([':u' => $user->getUserUuid()]);

        AuditService::log(
            $user->getTenantUuid(),
            $user->getSiteUuid(),
            $user->getUserUuid(),
            '2FA_DISABLED',
            'AUTH',
            $user->getUserUuid()
        );

        return true;
    }

    private static function loadUserData(string $userUuid): ?AuthenticatedUser
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('SELECT user_uuid, tenant_uuid, site_uuid, name, email, status FROM users WHERE user_uuid = :u');
        $stmt->execute([':u' => $userUuid]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        $roles = self::getUserRoles($userUuid);
        $permissions = self::getUserPermissions($userUuid);

        return new AuthenticatedUser(
            $row['user_uuid'],
            $row['tenant_uuid'],
            $row['site_uuid'],
            $row['name'],
            $row['email'],
            $row['status'],
            $roles,
            $permissions,
            ''
        );
    }

    private static function getUserRoles(string $userUuid): array
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('
            SELECT r.name 
            FROM user_roles ur
            JOIN roles r ON r.role_id = ur.role_id
            WHERE ur.user_uuid = :u
        ');
        $stmt->execute([':u' => $userUuid]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
    }

    private static function getUserPermissions(string $userUuid): array
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('
            SELECT DISTINCT p.name 
            FROM user_roles ur
            JOIN role_permissions rp ON rp.role_id = ur.role_id
            JOIN permissions p ON p.permission_id = rp.permission_id
            WHERE ur.user_uuid = :u
        ');
        $stmt->execute([':u' => $userUuid]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
    }
}

