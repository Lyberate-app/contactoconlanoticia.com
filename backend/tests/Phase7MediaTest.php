<?php

declare(strict_types=1);

require_once __DIR__ . '/../app/Core/Env.php';
require_once __DIR__ . '/../app/Database/Database.php';
require_once __DIR__ . '/../app/Helpers/Uuid.php';
require_once __DIR__ . '/../app/Helpers/Sanitizer.php';
require_once __DIR__ . '/../app/Security/AuthenticatedUser.php';
require_once __DIR__ . '/../app/Services/AuditService.php';
require_once __DIR__ . '/../app/Services/ImageOptimizer.php';
require_once __DIR__ . '/../app/Services/MediaService.php';

use App\Core\Env;
use App\Database\Database;
use App\Helpers\Uuid;
use App\Security\AuthenticatedUser;
use App\Services\ImageOptimizer;
use App\Services\MediaService;

class Phase7MediaTest
{
    private int $passed = 0;
    private int $failed = 0;
    private string $tenantUuid = '00000000-0000-0000-0000-000000000001';
    private string $siteUuid = '00000000-0000-0000-0000-000000000002';
    private AuthenticatedUser $adminUser;

    public function __construct()
    {
        Env::load(__DIR__ . '/../.env');
        $this->adminUser = new AuthenticatedUser(
            Uuid::uuid4(),
            $this->tenantUuid,
            $this->siteUuid,
            'Media Admin',
            'media_admin@contactoconlanoticia.com',
            'ACTIVE',
            ['SUPER_ADMIN'],
            ['media.upload', 'media.delete'],
            'sess-test'
        );
    }

    public function run(): void
    {
        echo "============================================\n";
        echo "  LYBERATE — FASE 7 MEDIA & OPTIMIZATION    \n";
        echo "============================================\n\n";

        $this->testGdCapabilities();
        $this->testValidImageUploadAndVariants();
        $this->testRejectExecutableScript();
        $this->testRejectCorruptImage();
        $this->testRejectExcessiveFileSize();
        $this->testSecureFilenameGeneration();
        $this->testUpdateMetadata();
        $this->testMultiTenantIsolation();
        $this->testDeleteMediaAndPhysicalPurge();

        echo "\n============================================\n";
        echo "MEDIA TEST RESULTS: {$this->passed} PASSED, {$this->failed} FAILED\n";
        echo "============================================\n";

        if ($this->failed > 0) {
            exit(1);
        }
    }

    private function assert(bool $condition, string $description): void
    {
        if ($condition) {
            $this->passed++;
            echo " [PASS] {$description}\n";
        } else {
            $this->failed++;
            echo " [FAIL] {$description}\n";
        }
    }

    private function testGdCapabilities(): void
    {
        echo "--- 1. Testing Image Processing Driver Capabilities ---\n";
        $this->assert(ImageOptimizer::isGdAvailable(), "PHP GD extension is loaded and available");
        $this->assert(ImageOptimizer::supportsWebp(), "WebP generation (imagewebp) is supported");
        $avifSupported = ImageOptimizer::supportsAvif();
        echo " [INFO] AVIF generation supported: " . ($avifSupported ? 'YES' : 'NO (optional depending on libavif)') . "\n";
    }

    private function testValidImageUploadAndVariants(): void
    {
        echo "\n--- 2. Testing Valid Image Upload & Adaptive Variants ---\n";
        // Create an 800x600 synthetic PNG test image
        $img = imagecreatetruecolor(800, 600);
        $bgColor = imagecolorallocate($img, 45, 90, 150);
        imagefilledrectangle($img, 0, 0, 800, 600, $bgColor);
        $textColor = imagecolorallocate($img, 255, 255, 255);
        imagestring($img, 5, 200, 280, "Contacto con la Noticia Test", $textColor);

        $tmpFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'test_source_' . Uuid::uuid4() . '.png';
        imagepng($img, $tmpFile);
        imagedestroy($img);

        $filePayload = [
            'name' => 'foto_reportaje_san_juan.png',
            'type' => 'image/png',
            'tmp_name' => $tmpFile,
            'error' => UPLOAD_ERR_OK,
            'size' => filesize($tmpFile),
        ];

        $metadata = [
            'alt_text' => 'Inauguración de obras públicas en Roscio',
            'caption' => 'Autoridades regionales encabezan el corte de cinta.',
            'credit' => 'Redacción Central',
        ];

        $media = MediaService::upload($this->adminUser, $filePayload, $metadata);

        $this->assert(!empty($media['media_uuid']), "Media created with valid UUID ({$media['media_uuid']})");
        $this->assert($media['width'] === 800, "Original width correctly detected as 800px");
        $this->assert($media['height'] === 600, "Original height correctly detected as 600px");
        $this->assert($media['mime_type'] === 'image/png', "Real MIME type correctly identified as image/png");
        $this->assert($media['alt_text'] === $metadata['alt_text'], "alt_text persisted correctly");
        $this->assert($media['caption'] === $metadata['caption'], "caption persisted correctly");
        $this->assert($media['credit'] === $metadata['credit'], "credit persisted correctly");

        // Verify original file on disk
        $baseDir = dirname(MediaService::getUploadRootDir());
        $origPath = $baseDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $media['storage_path']);
        $this->assert(file_exists($origPath), "Original image preserved on disk: {$origPath}");

        // Verify adaptive variants
        $variants = $media['variants'];
        $this->assert(count($variants) >= 4, "At least 4 variants generated (320, 640, 800/960, etc.)");

        $variantNames = array_column($variants, 'variant_name');
        $this->assert(in_array('320', $variantNames, true), "Variant 320px generated");
        $this->assert(in_array('640', $variantNames, true), "Variant 640px generated");

        // Verify each variant file exists physically on disk
        $allVariantsExist = true;
        foreach ($variants as $v) {
            $vPath = $baseDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $v['storage_path']);
            if (!file_exists($vPath)) {
                $allVariantsExist = false;
                break;
            }
        }
        $this->assert($allVariantsExist, "All responsive variant files exist physically on disk");

        // Check database persistence in media_variants table
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM media_variants WHERE media_uuid = :id');
        $stmt->execute([':id' => $media['media_uuid']]);
        $dbVariantCount = (int) $stmt->fetchColumn();
        $this->assert($dbVariantCount === count($variants), "Database media_variants table holds {$dbVariantCount} records matching generated files");

        // Clean up temp file
        @unlink($tmpFile);

        // Store for subsequent tests
        $GLOBALS['test_media_uuid'] = $media['media_uuid'];
    }

    private function testRejectExecutableScript(): void
    {
        echo "\n--- 3. Testing Strict Rejection of Executable Files Camouflaged as Images ---\n";
        $tmpScript = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'backdoor.jpg';
        file_put_contents($tmpScript, '<?php echo "malicious code execution"; phpinfo(); ?>');

        $payload = [
            'name' => 'foto_inocente.jpg',
            'type' => 'image/jpeg',
            'tmp_name' => $tmpScript,
            'error' => UPLOAD_ERR_OK,
            'size' => filesize($tmpScript),
        ];

        $rejected = false;
        try {
            MediaService::upload($this->adminUser, $payload);
        } catch (\Throwable $e) {
            $rejected = true;
        }

        @unlink($tmpScript);
        $this->assert($rejected, "PHP script disguised as .jpg is strictly rejected by real MIME & binary inspection");
    }

    private function testRejectCorruptImage(): void
    {
        echo "\n--- 4. Testing Rejection of Corrupted Images ---\n";
        $tmpCorrupt = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'corrupt.png';
        // Random binary garbage
        file_put_contents($tmpCorrupt, "\x89PNG\r\n\x1a\n\x00\x00\x00corrupted_truncated_stream");

        $payload = [
            'name' => 'corrupt.png',
            'type' => 'image/png',
            'tmp_name' => $tmpCorrupt,
            'error' => UPLOAD_ERR_OK,
            'size' => filesize($tmpCorrupt),
        ];

        $rejected = false;
        try {
            MediaService::upload($this->adminUser, $payload);
        } catch (\Throwable $e) {
            $rejected = true;
        }

        @unlink($tmpCorrupt);
        $this->assert($rejected, "Corrupted image file is safely rejected");
    }

    private function testRejectExcessiveFileSize(): void
    {
        echo "\n--- 5. Testing Rejection of Files Exceeding Maximum Limit ---\n";
        $tmpFake = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'huge.jpg';
        file_put_contents($tmpFake, 'fake');

        $payload = [
            'name' => 'huge.jpg',
            'type' => 'image/jpeg',
            'tmp_name' => $tmpFake,
            'error' => UPLOAD_ERR_OK,
            'size' => MediaService::MAX_FILE_SIZE + 1024, // 10MB + 1KB
        ];

        $rejected = false;
        try {
            MediaService::upload($this->adminUser, $payload);
        } catch (\Throwable $e) {
            $rejected = true;
        }

        @unlink($tmpFake);
        $this->assert($rejected, "File exceeding 10 MB maximum size limit is rejected");
    }

    private function testSecureFilenameGeneration(): void
    {
        echo "\n--- 6. Testing Secure Filename Generation (Anti-Path Traversal) ---\n";
        $img = imagecreatetruecolor(200, 200);
        $tmpFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'traversal_test.jpg';
        imagejpeg($img, $tmpFile);
        imagedestroy($img);

        // Client passes malicious filename attempting directory traversal
        $payload = [
            'name' => '../../../../etc/cron.d/hack;eval().jpg',
            'type' => 'image/jpeg',
            'tmp_name' => $tmpFile,
            'error' => UPLOAD_ERR_OK,
            'size' => filesize($tmpFile),
        ];

        $media = MediaService::upload($this->adminUser, $payload);

        $this->assert(!str_contains($media['storage_path'], '..'), "Storage path contains no '..' directory traversal");
        $this->assert(!str_contains($media['storage_path'], ';'), "Storage path contains no command injection characters");
        $this->assert(str_starts_with(basename($media['storage_path']), $media['media_uuid']), "Filename on disk starts with safe server-generated UUID");

        @unlink($tmpFile);
        // Clean up test upload
        MediaService::deleteMedia($this->adminUser, $media['media_uuid']);
    }

    private function testUpdateMetadata(): void
    {
        echo "\n--- 7. Testing Media Metadata Updates ---\n";
        $uuid = $GLOBALS['test_media_uuid'];

        $updated = MediaService::updateMetadata($this->adminUser, $uuid, [
            'alt_text' => 'Nuevo Alt Periodístico',
            'caption' => 'Nuevo pie de foto actualizado.',
            'credit' => 'Elena Vásquez / Corresponsal',
        ]);

        $this->assert($updated !== null, "updateMetadata returns updated media record");
        $this->assert($updated['alt_text'] === 'Nuevo Alt Periodístico', "alt_text successfully updated");
        $this->assert($updated['caption'] === 'Nuevo pie de foto actualizado.', "caption successfully updated");
        $this->assert($updated['credit'] === 'Elena Vásquez / Corresponsal', "credit successfully updated");
    }

    private function testMultiTenantIsolation(): void
    {
        echo "\n--- 8. Testing Multi-Tenant Media Isolation ---\n";
        $uuid = $GLOBALS['test_media_uuid'];
        $foreignSite = '00000000-0000-0000-0000-999999999999';

        $foreignMedia = MediaService::getMedia($this->tenantUuid, $foreignSite, $uuid);
        $this->assert($foreignMedia === null, "Media cannot be accessed from a different site context");

        $foreignUser = new AuthenticatedUser(
            Uuid::uuid4(),
            $this->tenantUuid,
            $foreignSite,
            'Foreign Editor',
            'foreign@test.com',
            'ACTIVE',
            ['EDITOR'],
            ['media.delete'],
            'sess-test'
        );

        $deleted = MediaService::deleteMedia($foreignUser, $uuid);
        $this->assert($deleted === false, "Unauthorized cross-site deletion request returns false");
    }

    private function testDeleteMediaAndPhysicalPurge(): void
    {
        echo "\n--- 9. Testing Media Deletion & Disk File Purging ---\n";
        $uuid = $GLOBALS['test_media_uuid'];
        $media = MediaService::getMedia($this->tenantUuid, $this->siteUuid, $uuid);

        $baseDir = dirname(MediaService::getUploadRootDir());
        $origPath = $baseDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $media['storage_path']);
        $this->assert(file_exists($origPath), "Original file exists before deletion");

        $variantPaths = [];
        foreach ($media['variants'] as $v) {
            $variantPaths[] = $baseDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $v['storage_path']);
        }
        $this->assert(!empty($variantPaths), "Variant paths collected for verification");

        // Execute deletion
        $deleted = MediaService::deleteMedia($this->adminUser, $uuid);
        $this->assert($deleted === true, "deleteMedia returns true");

        // Verify physical deletion from disk
        $this->assert(!file_exists($origPath), "Original file was physically deleted from disk");

        $allVariantsDeleted = true;
        foreach ($variantPaths as $vp) {
            if (file_exists($vp)) {
                $allVariantsDeleted = false;
                break;
            }
        }
        $this->assert($allVariantsDeleted, "All adaptive variant files were physically deleted from disk");

        // Verify database cascade deletion
        $pdo = Database::getConnection();
        $stmtMedia = $pdo->prepare('SELECT COUNT(*) FROM media WHERE media_uuid = :id');
        $stmtMedia->execute([':id' => $uuid]);
        $this->assert((int) $stmtMedia->fetchColumn() === 0, "Media record removed from media table");

        $stmtVar = $pdo->prepare('SELECT COUNT(*) FROM media_variants WHERE media_uuid = :id');
        $stmtVar->execute([':id' => $uuid]);
        $this->assert((int) $stmtVar->fetchColumn() === 0, "All rows in media_variants deleted via database cascade");
    }
}

$test = new Phase7MediaTest();
$test->run();

