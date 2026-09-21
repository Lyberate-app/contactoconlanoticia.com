<?php

declare(strict_types=1);

namespace App\Security;

class WebAuthn
{
    /**
     * Generate a cryptographically secure random challenge (32 bytes base64url).
     */
    public static function generateChallenge(): string
    {
        return self::base64UrlEncode(random_bytes(32));
    }

    /**
     * Generate registration options (PublicKeyCredentialCreationOptions).
     */
    public static function createRegistrationOptions(
        string $userUuid,
        string $userName,
        string $userDisplayName,
        string $rpName = 'Lyberate — Contacto con la Noticia',
        string $rpId = 'localhost'
    ): array {
        return [
            'challenge' => self::generateChallenge(),
            'rp' => [
                'name' => $rpName,
                'id' => $rpId,
            ],
            'user' => [
                'id' => self::base64UrlEncode($userUuid),
                'name' => $userName,
                'displayName' => $userDisplayName,
            ],
            'pubKeyCredParams' => [
                ['type' => 'public-key', 'alg' => -7],  // ES256 (ECDSA w/ SHA-256)
                ['type' => 'public-key', 'alg' => -257], // RS256 (RSASSA-PKCS1-v1_5 w/ SHA-256)
            ],
            'timeout' => 60000,
            'attestation' => 'none',
            'authenticatorSelection' => [
                'residentKey' => 'preferred',
                'userVerification' => 'preferred',
            ],
        ];
    }

    /**
     * Generate authentication options (PublicKeyCredentialRequestOptions).
     */
    public static function createAuthenticationOptions(array $allowCredentials = [], string $rpId = 'localhost'): array
    {
        $credentials = [];
        foreach ($allowCredentials as $cred) {
            $credentials[] = [
                'type' => 'public-key',
                'id' => $cred['credential_id'],
                'transports' => ['internal', 'usb', 'nfc', 'ble'],
            ];
        }

        return [
            'challenge' => self::generateChallenge(),
            'timeout' => 60000,
            'rpId' => $rpId,
            'allowCredentials' => $credentials,
            'userVerification' => 'preferred',
        ];
    }

    /**
     * Encode binary data to Base64URL string (RFC 4648).
     */
    public static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Decode Base64URL string to binary.
     */
    public static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}

