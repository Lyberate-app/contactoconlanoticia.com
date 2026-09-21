<?php

declare(strict_types=1);

namespace App\Security;

class Password
{
    /**
     * Hash a password securely using Argon2id if available, or Bcrypt (cost 12) as fallback.
     */
    public static function hash(string $password): string
    {
        if (defined('PASSWORD_ARGON2ID')) {
            try {
                return password_hash($password, PASSWORD_ARGON2ID, [
                    'memory_cost' => 65536,
                    'time_cost' => 4,
                    'threads' => 1,
                ]);
            } catch (\Throwable) {
                // Fallback to Bcrypt if Argon2id extension is not configured
            }
        }

        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    /**
     * Verify a plaintext password against a stored hash.
     */
    public static function verify(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /**
     * Determine if a hash needs to be rehashed to match current security standards.
     */
    public static function needsRehash(string $hash): bool
    {
        if (defined('PASSWORD_ARGON2ID')) {
            return password_needs_rehash($hash, PASSWORD_ARGON2ID, [
                'memory_cost' => 65536,
                'time_cost' => 4,
                'threads' => 1,
            ]);
        }

        return password_needs_rehash($hash, PASSWORD_BCRYPT, ['cost' => 12]);
    }
}

