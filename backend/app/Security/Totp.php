<?php

declare(strict_types=1);

namespace App\Security;

class Totp
{
    private const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /**
     * Generate a cryptographically secure random Base32 secret key.
     */
    public static function generateSecret(int $length = 16): string
    {
        $secret = '';
        $alphabetLength = strlen(self::BASE32_ALPHABET);

        for ($i = 0; $i < $length; $i++) {
            $secret .= self::BASE32_ALPHABET[random_int(0, $alphabetLength - 1)];
        }

        return $secret;
    }

    /**
     * Calculate TOTP code for a given timestamp and secret.
     */
    public static function calculateCode(string $secret, ?int $timestamp = null, int $period = 30, int $digits = 6): string
    {
        $timestamp = $timestamp ?? time();
        $counter = (int) floor($timestamp / $period);

        // Pack counter into an 8-byte big-endian binary string
        $binaryCounter = pack('J', $counter);

        $binarySecret = self::base32Decode($secret);
        $hash = hash_hmac('sha1', $binaryCounter, $binarySecret, true);

        // Dynamic truncation (RFC 4226 section 5.4)
        $offset = ord($hash[19]) & 0x0f;
        $part = substr($hash, $offset, 4);
        $unpacked = unpack('N', $part)[1];
        $binaryCode = $unpacked & 0x7fffffff;

        $modulo = 10 ** $digits;
        $code = (string) ($binaryCode % $modulo);

        return str_pad($code, $digits, '0', STR_PAD_LEFT);
    }

    /**
     * Verify user submitted TOTP code within a drift window (+/- steps).
     */
    public static function verify(string $code, string $secret, int $window = 1, ?int $timestamp = null, int $period = 30): bool
    {
        $cleanedCode = trim($code);
        if (strlen($cleanedCode) !== 6 || !ctype_digit($cleanedCode)) {
            return false;
        }

        $timestamp = $timestamp ?? time();

        for ($offset = -$window; $offset <= $window; $offset++) {
            $testTime = $timestamp + ($offset * $period);
            $expected = self::calculateCode($secret, $testTime, $period);

            if (hash_equals($expected, $cleanedCode)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Build an otpauth URL for Google Authenticator / Authy / Bitwarden.
     */
    public static function getOtpAuthUrl(string $account, string $secret, string $issuer = 'Lyberate'): string
    {
        return sprintf(
            'otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30',
            rawurlencode($issuer),
            rawurlencode($account),
            $secret,
            rawurlencode($issuer)
        );
    }

    /**
     * Generate an array of secure single-use recovery codes.
     *
     * @return array<string> Format: XXXX-XXXX-XXXX
     */
    public static function generateRecoveryCodes(int $count = 8): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $bytes = bin2hex(random_bytes(6)); // 12 hex chars
            $formatted = strtoupper(implode('-', str_split($bytes, 4)));
            $codes[] = $formatted;
        }
        return $codes;
    }

    /**
     * Decode a Base32 string to binary.
     */
    private static function base32Decode(string $b32): string
    {
        $b32 = strtoupper(trim($b32));
        $buffer = 0;
        $bitsLeft = 0;
        $binary = '';

        for ($i = 0; $i < strlen($b32); $i++) {
            $char = $b32[$i];
            if ($char === '=') {
                break;
            }

            $val = strpos(self::BASE32_ALPHABET, $char);
            if ($val === false) {
                continue;
            }

            $buffer = ($buffer << 5) | $val;
            $bitsLeft += 5;

            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $binary .= chr(($buffer >> $bitsLeft) & 0xff);
            }
        }

        return $binary;
    }
}

