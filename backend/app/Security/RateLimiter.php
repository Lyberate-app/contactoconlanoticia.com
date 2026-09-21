<?php

declare(strict_types=1);

namespace App\Security;

use App\Database\Database;
use PDO;

class RateLimiter
{
    /**
     * Check if a given key has exceeded the maximum attempts.
     */
    public static function tooManyAttempts(string $key, int $maxAttempts): bool
    {
        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare('
                SELECT attempts, reset_at 
                FROM rate_limits 
                WHERE rate_key = :key AND reset_at > :now
            ');
            $stmt->execute([':key' => $key, ':now' => time()]);
            $record = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($record && (int) $record['attempts'] >= $maxAttempts) {
                return true;
            }
        } catch (\Throwable) {
            // If DB is unreachable, fail-safe without halting
            return false;
        }

        return false;
    }

    /**
     * Increment the attempt count for a given key.
     */
    public static function hit(string $key, int $decaySeconds = 900): int
    {
        $now = time();
        $resetAt = $now + $decaySeconds;

        try {
            $pdo = Database::getConnection();

            $existing = $pdo->prepare('SELECT attempts, reset_at FROM rate_limits WHERE rate_key = :k');
            $existing->execute([':k' => $key]);
            $row = $existing->fetch(PDO::FETCH_ASSOC);

            if (!$row || (int) $row['reset_at'] <= $now) {
                $stmt = $pdo->prepare('
                    INSERT INTO rate_limits (rate_key, attempts, reset_at)
                    VALUES (:key, 1, :reset_at)
                    ON DUPLICATE KEY UPDATE attempts = 1, reset_at = :reset_at_update
                ');
                $stmt->execute([
                    ':key' => $key,
                    ':reset_at' => $resetAt,
                    ':reset_at_update' => $resetAt,
                ]);
                return 1;
            }

            $stmt = $pdo->prepare('UPDATE rate_limits SET attempts = attempts + 1 WHERE rate_key = :key');
            $stmt->execute([':key' => $key]);

            return (int) $row['attempts'] + 1;
        } catch (\Throwable) {
            return 1;
        }
    }

    /**
     * Get remaining attempts before being rate limited.
     */
    public static function retriesLeft(string $key, int $maxAttempts): int
    {
        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare('
                SELECT attempts 
                FROM rate_limits 
                WHERE rate_key = :key AND reset_at > :now
            ');
            $stmt->execute([':key' => $key, ':now' => time()]);
            $attempts = (int) $stmt->fetchColumn();

            return max(0, $maxAttempts - $attempts);
        } catch (\Throwable) {
            return $maxAttempts;
        }
    }

    /**
     * Get number of seconds until the rate limit resets.
     */
    public static function availableIn(string $key): int
    {
        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare('
                SELECT reset_at 
                FROM rate_limits 
                WHERE rate_key = :key AND reset_at > :now
            ');
            $stmt->execute([':key' => $key, ':now' => time()]);
            $resetAt = (int) $stmt->fetchColumn();

            return max(0, $resetAt - time());
        } catch (\Throwable) {
            return 0;
        }
    }

    /**
     * Clear the rate limit for a key (e.g. after successful authentication).
     */
    public static function reset(string $key): void
    {
        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare('DELETE FROM rate_limits WHERE rate_key = :key');
            $stmt->execute([':key' => $key]);
        } catch (\Throwable) {}
    }
}
