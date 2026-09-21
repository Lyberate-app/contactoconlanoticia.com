<?php

declare(strict_types=1);

/**
 * LYBERATE — CLI MIGRATION RUNNER
 * Executes SQL migrations in sequential order and tracks execution history.
 */

require_once __DIR__ . '/../backend/app/Core/Env.php';
require_once __DIR__ . '/../backend/app/Database/Database.php';

\App\Core\Env::load(__DIR__ . '/../.env');
\App\Core\Env::load(__DIR__ . '/../backend/.env');

use App\Database\Database;

$config = require __DIR__ . '/../backend/config/database.php';

try {
    echo "=== Conectando a MySQL ({$config['host']}:{$config['port']}/{$config['database']})...\n";
    $pdo = Database::getConnection($config);

    // 1. Ensure migrations tracking table exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            migration VARCHAR(255) NOT NULL,
            executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_migration_name (migration)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 2. Fetch already executed migrations
    $stmt = $pdo->query("SELECT migration FROM migrations");
    $executedMigrations = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // 3. Scan migrations directory
    $migrationsDir = __DIR__ . '/migrations';
    $files = glob($migrationsDir . '/*.sql');
    sort($files);

    $pendingCount = 0;

    foreach ($files as $filePath) {
        $filename = basename($filePath);

        if (in_array($filename, $executedMigrations, true)) {
            echo "  [SKIP] {$filename} (ya ejecutada)\n";
            continue;
        }

        echo "  [RUN]  {$filename}... ";
        $sql = file_get_contents($filePath);

        if ($sql === false || trim($sql) === '') {
            echo "VACÍA, saltando.\n";
            continue;
        }

        // Execute migration SQL
        $pdo->exec($sql);

        // Record execution
        $insertStmt = $pdo->prepare("INSERT INTO migrations (migration) VALUES (:migration)");
        $insertStmt->execute([':migration' => $filename]);

        echo "OK\n";
        $pendingCount++;
    }

    echo "=== Migraciones completadas. {$pendingCount} nuevas migraciones ejecutadas.\n";
    exit(0);

} catch (\Throwable $e) {
    echo "\n[ERROR] Fallo en la migración: " . $e->getMessage() . "\n";
    exit(1);
}

