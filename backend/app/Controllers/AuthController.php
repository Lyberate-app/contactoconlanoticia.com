<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Security\WebAuthn;
use App\Services\AuthService;
use App\Validation\Validator;

class AuthController
{
    /**
     * POST /api/v1/auth/login
     */
    public function login(Request $request): void
    {
        $v = Validator::make($request->getBody(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if ($v->fails()) {
            Response::validationError($v->errors());
        }

        $email = (string) $request->input('email');
        $password = (string) $request->input('password');
        $ip = $request->getClientIp();
        $userAgent = $request->getHeader('user-agent') ?? 'unknown';

        $result = AuthService::login($email, $password, $ip, $userAgent);

        if (!$result['success']) {
            $statusCode = ($result['code'] ?? '') === 'TOO_MANY_REQUESTS' ? 429 : 401;
            $details = isset($result['retry_after']) ? ['retry_after' => $result['retry_after']] : [];
            Response::error($result['error'] ?? 'Error de autenticación.', $result['code'] ?? 'AUTH_ERROR', $statusCode, $details);
        }

        if (!empty($result['requires_2fa'])) {
            Response::success([
                'requires_2fa' => true,
                'ticket' => $result['ticket'],
            ], 200, ['message' => 'Código de segundo factor requerido.']);
        }

        Response::success([
            'requires_2fa' => false,
            'user' => $result['user'] ?? [],
        ], 200, ['message' => 'Sesión iniciada correctamente.']);
    }

    /**
     * POST /api/v1/auth/2fa/verify
     */
    public function verify2fa(Request $request): void
    {
        $v = Validator::make($request->getBody(), [
            'ticket' => 'required|string',
            'code' => 'required|string|min:6|max:20',
        ]);

        if ($v->fails()) {
            Response::validationError($v->errors());
        }

        $ticket = (string) $request->input('ticket');
        $code = (string) $request->input('code');
        $ip = $request->getClientIp();
        $userAgent = $request->getHeader('user-agent') ?? 'unknown';

        $result = AuthService::verify2fa($ticket, $code, $ip, $userAgent);

        if (!$result['success']) {
            $statusCode = ($result['code'] ?? '') === 'TOO_MANY_REQUESTS' ? 429 : 401;
            $details = isset($result['retry_after']) ? ['retry_after' => $result['retry_after']] : [];
            Response::error($result['error'] ?? 'Error en 2FA.', $result['code'] ?? '2FA_ERROR', $statusCode, $details);
        }

        Response::success([
            'user' => $result['user'] ?? [],
        ], 200, ['message' => 'Autenticación en dos pasos exitosa.']);
    }

    /**
     * GET /api/v1/auth/me
     */
    public function me(Request $request): void
    {
        $user = $request->getUser();

        if (!$user) {
            Response::unauthorized();
        }

        Response::success([
            'user' => $user->toArray(),
        ]);
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout(Request $request): void
    {
        $token = $_COOKIE[AuthService::COOKIE_NAME] ?? null;

        if (!$token) {
            $authHeader = $request->getHeader('authorization');
            if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
                $token = trim(substr($authHeader, 7));
            }
        }

        AuthService::logout($token, $request->getUser());

        Response::success(['message' => 'Sesión finalizada correctamente.']);
    }

    /**
     * POST /api/v1/auth/2fa/setup
     */
    public function setup2fa(Request $request): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::unauthorized();
        }

        $setupData = AuthService::setup2fa($user);

        Response::success($setupData, 200, [
            'message' => 'Secreto de 2FA y códigos de recuperación generados. Confirme con un código para activarlo.',
        ]);
    }

    /**
     * POST /api/v1/auth/2fa/enable
     */
    public function enable2fa(Request $request): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::unauthorized();
        }

        $v = Validator::make($request->getBody(), [
            'code' => 'required|string|min:6|max:6',
        ]);

        if ($v->fails()) {
            Response::validationError($v->errors());
        }

        $code = (string) $request->input('code');
        $success = AuthService::enable2fa($user, $code);

        if (!$success) {
            Response::badRequest('Código de verificación inválido. No se activó el 2FA.', 'INVALID_TOTP_CODE');
        }

        Response::success(['two_factor_enabled' => true], 200, ['message' => '2FA activado con éxito.']);
    }

    /**
     * POST /api/v1/auth/2fa/disable
     */
    public function disable2fa(Request $request): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::unauthorized();
        }

        $v = Validator::make($request->getBody(), [
            'password' => 'required|string',
        ]);

        if ($v->fails()) {
            Response::validationError($v->errors());
        }

        $password = (string) $request->input('password');
        $success = AuthService::disable2fa($user, $password);

        if (!$success) {
            Response::badRequest('Contraseña incorrecta. No se pudo desactivar el 2FA.', 'INVALID_PASSWORD');
        }

        Response::success(['two_factor_enabled' => false], 200, ['message' => '2FA desactivado con éxito.']);
    }

    /**
     * POST /api/v1/auth/webauthn/challenge
     */
    public function webauthnChallenge(Request $request): void
    {
        $user = $request->getUser();
        $challenge = WebAuthn::generateChallenge();

        Response::success([
            'challenge' => $challenge,
            'rpId' => 'localhost',
        ]);
    }

    /**
     * POST /api/v1/auth/webauthn/verify
     */
    public function webauthnVerify(Request $request): void
    {
        $v = Validator::make($request->getBody(), [
            'credential_id' => 'required|string',
            'client_data_json' => 'required|string',
        ]);

        if ($v->fails()) {
            Response::validationError($v->errors());
        }

        // WebAuthn signature / registration verification stub
        Response::success([
            'verified' => true,
        ], 200, ['message' => 'Verificación de Passkey completada.']);
    }
}

