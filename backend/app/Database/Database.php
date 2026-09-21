<?php

declare(strict_types=1);

namespace App\Database;

use PDO;
use PDOException;
use RuntimeException;

class Database
{
    private static ?PDO $instance = null;

    /**
     * Get or create the singleton PDO connection instance.
     */
    public static function getConnection(?array $customConfig = null): PDO
    {
        if (self::$instance === null) {
            $config = $customConfig ?? require __DIR__ . '/../../config/database.php';

            $dsn = sprintf(
                '%s:host=%s;port=%d;dbname=%s;charset=%s',
                $config['driver'],
                $config['host'],
                $config['port'],
                $config['database'],
                $config['charset']
            );

            try {
                self::$instance = new PDO(
                    $dsn,
                    $config['username'],
                    $config['password'],
                    $config['options']
                );
            } catch (PDOException $e) {
                // In production, do not leak credentials or exact DSN details
                throw new RuntimeException('Error al conectar con la base de datos MySQL: ' . $e->getMessage(), (int) $e->getCode(), $e);
            }
        }

        return self::$instance;
    }

    /**
     * Check if database connection is active and responsive.
     */
    public static function ping(): bool
    {
        try {
            $pdo = self::getConnection();
            $stmt = $pdo->query('SELECT 1');
            return $stmt !== false;
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Reset connection instance (useful for testing or reconnecting).
     */
    public static function disconnect(): void
    {
        self::$instance = null;
    }
}
