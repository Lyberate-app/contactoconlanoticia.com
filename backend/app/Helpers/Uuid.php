<?php

declare(strict_types=1);

namespace App\Helpers;

class Uuid
{
    /**
     * Generate an RFC 4122 compliant version 4 UUID.
     */
    public static function uuid4(): string
    {
        $data = random_bytes(16);

        // Set version to 0100 (v4)
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        // Set bits 6-7 to 10 (RFC 4122 variant)
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    /**
     * Validate whether a string is a valid UUID format (v1-v5).
     */
    public static function isValid(string $uuid): bool
    {
        return (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $uuid);
    }
}

