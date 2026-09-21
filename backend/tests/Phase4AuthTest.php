<?php

declare(strict_types=1);

namespace Tests;

define('APP_TESTING', true);

require_once __DIR__ . '/../app/Core/Env.php';
require_once __DIR__ . '/../app/Helpers/Uuid.php';
require_once __DIR__ . '/../app/Helpers/Sanitizer.php';
require_once __DIR__ . '/../app/Validation/Validator.php';
require_once __DIR__ . '/../app/Core/Request.php';
require_once __DIR__ . '/../app/Core/Response.php';
require_once __DIR__ . '/../app/Middleware/MiddlewareInterface.php';
require_once __DIR__ . '/../app/Middleware/CorsMiddleware.php';
require_once __DIR__ . '/../app/Middleware/JsonBodyParserMiddleware.php';
require_once __DIR__ . '/../app/Middleware/RequestContextMiddleware.php';
require_once __DIR__ . '/../app/Middleware/AuthMiddleware.php';
require_once __DIR__ . '/../app/Middleware/RequirePermissionMiddleware.php';
require_once __DIR__ . '/../app/Core/Router.php';
require_once __DIR__ . '/../app/Core/ExceptionHandler.php';
require_once __DIR__ . '/../app/Database/Database.php';
require_once __DIR__ . '/../app/Security/Password.php';
require_once __DIR__ . '/../app/Security/Totp.php';
require_once __DIR__ . '/../app/Security/WebAuthn.php';
require_once __DIR__ . '/../app/Security/RateLimiter.php';
require_once __DIR__ . '/../app/Security/AuthenticatedUser.php';
require_once __DIR__ . '/../app/Services/AuditService.php';
require_once __DIR__ . '/../app/Services/AuthService.php';
require_once __DIR__ . '/../app/Controllers/AuthController.php';

use App\Core\Request;
use App\Core\Response;
use App\Database\Database;
use App\Helpers\Uuid;
use App\Middleware\AuthMiddleware;
use App\Middleware\RequirePermissionMiddleware;
use App\Security\AuthenticatedUser;
use App\Security\Password;
use App\Security\RateLimiter;
use App\Security\Totp;
use App\Security\WebAuthn;
use App\Services\AuditService;
use App\Services\AuthService;
use PDO;

class Phase4AuthTest
{
    private int $passed = 0;
    private int $failed = 0;

    public function run(): void
    {
        echo "============================================\n";
        echo "  LYBERATE — FASE 4 AUTH & RBAC TEST SUITE  \n";
        echo "============================================\n\n";

        $this->testPasswordSecurity();
        $this->testTotpSecurity();
        $this->testWebAuthnPreparation();
        $this->testRateLimiter();
        $this->testAuditSanitization();
        $this->testAuthenticatedUserRbac();
        $this->testFullAuthenticationFlow();

        echo "\n============================================\n";
        echo "AUTH RESULTS: {$this->passed} PASSED, {$this->failed} FAILED\n";
        echo "============================================\n";

        if ($this->failed > 0) {
            exit(1);
        }
    }

    private function assert(bool $condition, string $description): void
    {
        if ($condition) {
            $this->passed++;
            echo " [PASS] {$description}\n";
        } else {
            $this->failed++;
            echo " [FAIL] {$description}\n";
        }
    }

    private function testPasswordSecurity(): void
    {
        echo "--- 1. Testing Password Security ---\n";
        $raw = 'SuperSecret123!';
        $hash = Password::hash($raw);

        $this->assert(is_string($hash) && strlen($hash) >= 60, "Password::hash produces secure hash string");
        $this->assert(Password::verify($raw, $hash), "Password::verify succeeds with correct password");
        $this->assert(!Password::verify('WrongPassword', $hash), "Password::verify fails with incorrect password");
    }

    private function testTotpSecurity(): void
    {
        echo "\n--- 2. Testing TOTP RFC 6238 & Recovery Codes ---\n";
        $secret = Totp::generateSecret(16);
        $this->assert(strlen($secret) === 16, "Totp::generateSecret produces 16-char Base32 string");

        $code = Totp::calculateCode($secret);
        $this->assert(strlen($code) === 6 && ctype_digit($code), "Totp::calculateCode produces 6-digit code ({$code})");
        $this->assert(Totp::verify($code, $secret), "Totp::verify accepts valid current code");
        $this->assert(!Totp::verify('999999', $secret), "Totp::verify rejects invalid code");

        $recoveryCodes = Totp::generateRecoveryCodes(8);
        $this->assert(count($recoveryCodes) === 8, "Totp::generateRecoveryCodes produces 8 codes");
        $this->assert(preg_match('/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/', $recoveryCodes[0]) === 1, "Recovery codes match XXXX-XXXX-XXXX format ({$recoveryCodes[0]})");

        $url = Totp::getOtpAuthUrl('admin@contactoconlanoticia.com', $secret);
        $this->assert(str_starts_with($url, 'otpauth://totp/'), "Totp::getOtpAuthUrl generates valid otpauth URI");
    }

    private function testWebAuthnPreparation(): void
    {
        echo "\n--- 3. Testing WebAuthn / Passkeys ---\n";
        $challenge = WebAuthn::generateChallenge();
        $this->assert(strlen($challenge) === 43, "WebAuthn::generateChallenge produces 43-char Base64URL string");

        $regOptions = WebAuthn::createRegistrationOptions(Uuid::uuid4(), 'admin@test.com', 'Admin Test');
        $this->assert(isset($regOptions['challenge']) && isset($regOptions['pubKeyCredParams']), "WebAuthn registration options include challenge and algorithms");

        $authOptions = WebAuthn::createAuthenticationOptions();
        $this->assert(isset($authOptions['challenge']) && isset($authOptions['rpId']), "WebAuthn auth options include challenge and rpId");
    }

    private function testRateLimiter(): void
    {
        echo "\n--- 4. Testing Rate Limiter ---\n";
        $key = 'test_rate_key_' . bin2hex(random_bytes(4));
        RateLimiter::reset($key);

        $this->assert(!RateLimiter::tooManyAttempts($key, 3), "RateLimiter initial state is not limited");

        RateLimiter::hit($key, 60);
        RateLimiter::hit($key, 60);
        $this->assert(!RateLimiter::tooManyAttempts($key, 3), "RateLimiter allows 2 attempts out of 3");

        RateLimiter::hit($key, 60);
        $this->assert(RateLimiter::tooManyAttempts($key, 3), "RateLimiter blocks on 3rd attempt");

        RateLimiter::reset($key);
        $this->assert(!RateLimiter::tooManyAttempts($key, 3), "RateLimiter unblocks after reset");
    }

    private function testAuditSanitization(): void
    {
        echo "\n--- 5. Testing Audit Service Sanitization ---\n";
        $sensitiveData = [
            'email' => 'editor@test.com',
            'password' => 'PlaintextPassword!',
            'session_token' => 'secret_token_123',
            'code' => '123456',
            'nested' => ['two_factor_secret' => 'BASE32SECRET'],
            'safe_flag' => true,
        ];

        AuditService::log(
            '00000000-0000-0000-0000-000000000001',
            '00000000-0000-0000-0000-000000000002',
            null,
            'TEST_AUDIT',
            'AUTH',
            null,
            '127.0.0.1',
            'TestAgent',
            $sensitiveData
        );

        // Fetch last audit log
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('SELECT metadata FROM audit_logs WHERE action = "TEST_AUDIT" ORDER BY audit_id DESC LIMIT 1');
        $stmt->execute();
        $metaJson = $stmt->fetchColumn();

        $this->assert($metaJson !== false, "Audit record successfully inserted into database");
        $meta = json_decode((string) $metaJson, true);
        $this->assert($meta['password'] === '[REDACTED]', "AuditService redacts 'password'");
        $this->assert($meta['session_token'] === '[REDACTED]', "AuditService redacts 'session_token'");
        $this->assert($meta['code'] === '[REDACTED]', "AuditService redacts 'code'");
        $this->assert($meta['nested']['two_factor_secret'] === '[REDACTED]', "AuditService redacts nested 'two_factor_secret'");
        $this->assert($meta['safe_flag'] === true, "AuditService preserves non-sensitive metadata");
    }

    private function testAuthenticatedUserRbac(): void
    {
        echo "\n--- 6. Testing AuthenticatedUser RBAC & Context ---\n";
        $superAdmin = new AuthenticatedUser(
            Uuid::uuid4(),
            'tenant-1',
            'site-1',
            'Super Admin',
            'admin@test.com',
            'ACTIVE',
            ['SUPER_ADMIN'],
            [],
            'session-1'
        );

        $this->assert($superAdmin->isSuperAdmin(), "AuthenticatedUser detects SUPER_ADMIN role");
        $this->assert($superAdmin->hasPermission('any.nonexistent.permission'), "SUPER_ADMIN has wildcard access to all permissions");

        $editor = new AuthenticatedUser(
            Uuid::uuid4(),
            'tenant-1',
            'site-1',
            'Editor Juan',
            'editor@test.com',
            'ACTIVE',
            ['EDITOR'],
            ['articles.create', 'articles.edit'],
            'session-2'
        );

        $this->assert(!$editor->isSuperAdmin(), "Editor is not SUPER_ADMIN");
        $this->assert($editor->hasPermission('articles.create'), "Editor has granted permission 'articles.create'");
        $this->assert(!$editor->hasPermission('users.create'), "Editor denied ungranted permission 'users.create'");
    }

    private function testFullAuthenticationFlow(): void
    {
        echo "\n--- 7. Testing End-to-End Authentication Flow ---\n";

        // 7.1 Login with wrong password
        $resWrong = AuthService::login('admin@contactoconlanoticia.com', 'WrongPass!', '127.0.0.1', 'PHPTest');
        $this->assert($resWrong['success'] === false && $resWrong['code'] === 'INVALID_CREDENTIALS', "AuthService rejects incorrect password with 401");

        // 7.2 Login with non-existent user
        $resUnknown = AuthService::login('nonexistent@domain.com', 'SomePass123!', '127.0.0.1', 'PHPTest');
        $this->assert($resUnknown['success'] === false && $resUnknown['code'] === 'INVALID_CREDENTIALS', "AuthService rejects non-existent email");

        // 7.3 Login with correct credentials
        $resOk = AuthService::login('admin@contactoconlanoticia.com', 'AdminPassword123!', '127.0.0.1', 'PHPTest');
        $this->assert($resOk['success'] === true && $resOk['requires_2fa'] === false, "AuthService logs in with valid credentials");
        $this->assert(isset($resOk['user']['email']) && $resOk['user']['email'] === 'admin@contactoconlanoticia.com', "AuthService returns authenticated user profile");

        // Verify session in database
        $pdo = Database::getConnection();
        $userUuid = $resOk['user']['user_uuid'];
        $stmtSession = $pdo->prepare('SELECT token_hash FROM sessions WHERE user_uuid = :u AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 1');
        $stmtSession->execute([':u' => $userUuid]);
        $tokenHash = (string) $stmtSession->fetchColumn();
        $this->assert(strlen($tokenHash) === 64, "Session token hash in database is valid 64-char SHA-256 (not plaintext)");

        // 7.4 Test 2FA lifecycle (setup, enable, login with 2fa, recovery code, disable)
        $authUser = AuthService::validateSession(bin2hex(random_bytes(32))); // Non-existent token
        $this->assert($authUser === null, "validateSession rejects invalid random token");

        $tempAuthUser = new AuthenticatedUser($userUuid, $resOk['user']['tenant_uuid'], $resOk['user']['site_uuid'], 'Admin', 'admin@contactoconlanoticia.com', 'ACTIVE', ['SUPER_ADMIN'], [], 'sess-test');
        $setup2fa = AuthService::setup2fa($tempAuthUser);
        $this->assert(isset($setup2fa['secret']) && count($setup2fa['recovery_codes']) === 8, "AuthService::setup2fa generates secret and 8 recovery codes");

        $totpCode = Totp::calculateCode($setup2fa['secret']);
        $enabled = AuthService::enable2fa($tempAuthUser, $totpCode);
        $this->assert($enabled === true, "AuthService::enable2fa confirms and enables 2FA with valid TOTP code");

        // Login now requires 2FA
        $res2faReq = AuthService::login('admin@contactoconlanoticia.com', 'AdminPassword123!', '127.0.0.1', 'PHPTest');
        $this->assert($res2faReq['success'] === true && $res2faReq['requires_2fa'] === true && isset($res2faReq['ticket']), "Login on 2FA account returns requires_2fa=true and ticket");

        // Verify 2FA using TOTP code
        $verifyTotp = AuthService::verify2fa($res2faReq['ticket'], Totp::calculateCode($setup2fa['secret']), '127.0.0.1', 'PHPTest');
        $this->assert($verifyTotp['success'] === true, "verify2fa succeeds with TOTP code");

        // Login again to test recovery code
        $res2faReq2 = AuthService::login('admin@contactoconlanoticia.com', 'AdminPassword123!', '127.0.0.1', 'PHPTest');
        $usedRecoveryCode = $setup2fa['recovery_codes'][0];
        $verifyRecovery = AuthService::verify2fa($res2faReq2['ticket'], $usedRecoveryCode, '127.0.0.1', 'PHPTest');
        $this->assert($verifyRecovery['success'] === true, "verify2fa succeeds with single-use recovery code");

        // Attempt to re-use the same recovery code
        $res2faReq3 = AuthService::login('admin@contactoconlanoticia.com', 'AdminPassword123!', '127.0.0.1', 'PHPTest');
        $verifyReusedRecovery = AuthService::verify2fa($res2faReq3['ticket'], $usedRecoveryCode, '127.0.0.1', 'PHPTest');
        $this->assert($verifyReusedRecovery['success'] === false, "verify2fa rejects already used recovery code (single-use enforcement)");

        // Disable 2FA with password
        $disabled = AuthService::disable2fa($tempAuthUser, 'AdminPassword123!');
        $this->assert($disabled === true, "disable2fa successfully deactivates 2FA");

        // 7.5 Test Logout & Revocation
        $rawSessionToken = AuthService::createSession($userUuid, $resOk['user']['tenant_uuid'], $resOk['user']['site_uuid']);
        $validSessionUser = AuthService::validateSession($rawSessionToken);
        $this->assert($validSessionUser !== null, "Created session successfully validates");

        AuthService::logout($rawSessionToken, $validSessionUser);
        $afterLogout = AuthService::validateSession($rawSessionToken);
        $this->assert($afterLogout === null, "Revoked session rejected immediately after logout");
    }
}

$test = new Phase4AuthTest();
$test->run();

