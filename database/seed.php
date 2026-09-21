<?php

declare(strict_types=1);

/**
 * LYBERATE — CLI SEED RUNNER
 * Populates initial canonical seeds (roles, permissions, default site and categories).
 */

require_once __DIR__ . '/../backend/app/Core/Env.php';
require_once __DIR__ . '/../backend/app/Database/Database.php';

\App\Core\Env::load(__DIR__ . '/../.env');
\App\Core\Env::load(__DIR__ . '/../backend/.env');

use App\Database\Database;

$config = require __DIR__ . '/../backend/config/database.php';

try {
    echo "=== Conectando a MySQL para ejecutar seeds ({$config['host']}:{$config['port']}/{$config['database']})...\n";
    $pdo = Database::getConnection($config);

    $seedsDir = __DIR__ . '/seeds';
    $files = glob($seedsDir . '/*.sql');
    sort($files);

    foreach ($files as $filePath) {
        $filename = basename($filePath);
        echo "  [SEED] {$filename}... ";

        $sql = file_get_contents($filePath);
        if ($sql === false || trim($sql) === '') {
            echo "VACÍO, saltando.\n";
            continue;
        }

        $pdo->exec($sql);
        echo "OK\n";
    }

    echo "=== Seeds aplicados correctamente.\n";
    exit(0);

} catch (\Throwable $e) {
    echo "\n[ERROR] Fallo al aplicar seeds: " . $e->getMessage() . "\n";
    exit(1);
}

