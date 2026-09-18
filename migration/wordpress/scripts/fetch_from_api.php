<?php
/**
 * fetch_from_api.php
 * 
 * Extrae todo el contenido del WordPress actual via REST API.
 * 
 * Uso:
 *   php fetch_from_api.php --url="https://sitio.com" --output="raw/"
 *   php fetch_from_api.php --url="https://sitio.com" --user="admin" --app-password="xxxx" --output="raw/"
 */

declare(strict_types=1);

// ── CLI arguments ─────────────────────────────────────────
$opts = getopt('', ['url:', 'output:', 'user:', 'app-password:', 'per-page:', 'help']);

if (isset($opts['help']) || !isset($opts['url'])) {
    echo "Uso: php fetch_from_api.php --url=<wordpress-url> --output=<dir/>\n";
    exit(0);
}

$wpUrl      = rtrim($opts['url'], '/');
$outputDir  = rtrim($opts['output'] ?? 'raw', '/');
$perPage    = (int) ($opts['per-page'] ?? 100);
$user       = $opts['user'] ?? null;
$appPass    = $opts['app-password'] ?? null;

// ── Setup ─────────────────────────────────────────────────
if (!is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

$logger = new MigrationLogger($outputDir . '/fetch.log');
$fetcher = new WPApiFetcher($wpUrl, $user, $appPass, $perPage, $logger);

// ── Ejecutar extracción ───────────────────────────────────
$logger->info("Iniciando extracción de: {$wpUrl}");
$logger->info("Destino: {$outputDir}");

$endpoints = [
    'posts'      => '/wp-json/wp/v2/posts',
    'pages'      => '/wp-json/wp/v2/pages',
    'categories' => '/wp-json/wp/v2/categories',
    'tags'       => '/wp-json/wp/v2/tags',
    'users'      => '/wp-json/wp/v2/users',
    'media'      => '/wp-json/wp/v2/media',
];

foreach ($endpoints as $type => $endpoint) {
    $logger->info("Extrayendo {$type}...");
    try {
        $items = $fetcher->fetchAll($endpoint);
        $outputFile = "{$outputDir}/{$type}.json";
        file_put_contents($outputFile, json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $logger->success("  → {$type}: " . count($items) . " elementos → {$outputFile}");
    } catch (Exception $e) {
        $logger->error("  ✗ Error en {$type}: " . $e->getMessage());
    }
}

$logger->info("Extracción completada.");

// ══════════════════════════════════════════════════════════
// Clases de soporte
// ══════════════════════════════════════════════════════════

class WPApiFetcher
{
    public function __construct(
        private string $baseUrl,
        private ?string $user,
        private ?string $appPass,
        private int $perPage,
        private MigrationLogger $logger
    ) {}

    public function fetchAll(string $endpoint): array
    {
        $items = [];
        $page = 1;

        do {
            $url = $this->baseUrl . $endpoint . "?per_page={$this->perPage}&page={$page}&_embed=1";
            $response = $this->fetch($url);
            
            if (empty($response)) {
                break;
            }

            $items = array_merge($items, $response);
            $this->logger->info("    Página {$page}: " . count($response) . " elementos");

            // Si recibimos menos que per_page, no hay más páginas
            if (count($response) < $this->perPage) {
                break;
            }

            $page++;
            usleep(100000); // 100ms de throttle para no sobrecargar WP
        } while (true);

        return $items;
    }

    private function fetch(string $url): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'User-Agent: PortalEditorial-Migrator/1.0',
            ],
        ]);

        if ($this->user && $this->appPass) {
            curl_setopt($ch, CURLOPT_USERPWD, $this->user . ':' . $this->appPass);
        }

        $body = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new RuntimeException("cURL error: {$error}");
        }

        if ($httpCode === 404) {
            return []; // Endpoint no existe
        }

        if ($httpCode !== 200) {
            throw new RuntimeException("HTTP {$httpCode} para {$url}");
        }

        $data = json_decode($body, true);
        if (!is_array($data)) {
            return [];
        }

        return $data;
    }
}

class MigrationLogger
{
    private mixed $handle;

    public function __construct(string $logFile)
    {
        $this->handle = fopen($logFile, 'a');
    }

    public function info(string $message): void
    {
        $this->write('INFO', $message);
    }

    public function success(string $message): void
    {
        $this->write('OK  ', $message);
        echo "\033[32m{$message}\033[0m\n";
    }

    public function error(string $message): void
    {
        $this->write('ERR ', $message);
        echo "\033[31m{$message}\033[0m\n";
    }

    private function write(string $level, string $message): void
    {
        $timestamp = date('Y-m-d H:i:s');
        $line = "[{$timestamp}] [{$level}] {$message}\n";
        echo $line;
        if ($this->handle) {
            fwrite($this->handle, $line);
        }
    }

    public function __destruct()
    {
        if ($this->handle) {
            fclose($this->handle);
        }
    }
}

