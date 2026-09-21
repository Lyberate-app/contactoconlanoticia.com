<?php

declare(strict_types=1);

namespace App\Services;

use App\Database\Database;
use App\Helpers\Sanitizer;
use App\Helpers\Uuid;
use App\Security\AuthenticatedUser;
use InvalidArgumentException;
use PDO;
use RuntimeException;

class MediaService
{
    public const MAX_FILE_SIZE = 10485760; // 10 MB
    public const MAX_DIMENSION = 6000;
    public const MIN_DIMENSION = 50;

    public const ALLOWED_MIMES = [
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/png'  => ['png'],
        'image/webp' => ['webp'],
        'image/avif' => ['avif'],
    ];

    /**
     * Get root uploads storage path on the filesystem.
     */
    public static function getUploadRootDir(): string
    {
        $dir = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'uploads';
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        return $dir;
    }

    /**
     * Upload, validate, store original and generate responsive variants.
     *
     * @param AuthenticatedUser $user
     * @param array{name: string, type: string, tmp_name: string, error: int, size: int} $file
     * @param array{alt_text?: string, caption?: string, credit?: string} $metadata
     * @return array
     */
    public static function upload(AuthenticatedUser $user, array $file, array $metadata = []): array
    {
        // 1. Basic upload validation
        if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
            throw new InvalidArgumentException('Error en la transferencia del archivo subido.');
        }

        $tmpPath = $file['tmp_name'] ?? '';
        if (!is_uploaded_file($tmpPath) && !file_exists($tmpPath)) {
            throw new InvalidArgumentException('Archivo temporal no encontrado o inválido.');
        }

        $size = (int) ($file['size'] ?? filesize($tmpPath));
        if ($size <= 0 || $size > self::MAX_FILE_SIZE) {
            throw new InvalidArgumentException('El archivo excede el tamaño máximo permitido de 10 MB.');
        }

        // 2. Real MIME inspection via finfo (never trust client-sent Content-Type)
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $realMime = $finfo ? (string) finfo_file($finfo, $tmpPath) : '';
        if ($finfo) {
            finfo_close($finfo);
        }

        if (!array_key_exists($realMime, self::ALLOWED_MIMES)) {
            throw new InvalidArgumentException("Formato de imagen no permitido ({$realMime}). Se aceptan JPEG, PNG, WebP y AVIF.");
        }

        // 3. Extension inspection & security check
        $originalFilename = Sanitizer::stripTags($file['name'] ?? 'image');
        $ext = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION));
        $allowedExtensions = self::ALLOWED_MIMES[$realMime];

        if (!in_array($ext, $allowedExtensions, true)) {
            // Assign canonical extension matching the detected real MIME
            $ext = $allowedExtensions[0];
        }

        // 4. Validate image binary integrity and dimensions
        $imgInfo = ImageOptimizer::getImageInfo($tmpPath);
        if (!$imgInfo) {
            throw new InvalidArgumentException('El archivo no es una imagen válida o está corrupto.');
        }

        $width = $imgInfo['width'];
        $height = $imgInfo['height'];

        if ($width < self::MIN_DIMENSION || $height < self::MIN_DIMENSION) {
            throw new InvalidArgumentException("Dimensiones insuficientes ({$width}x{$height}). Mínimo 50x50px.");
        }

        if ($width > self::MAX_DIMENSION || $height > self::MAX_DIMENSION) {
            throw new InvalidArgumentException("Dimensiones excesivas ({$width}x{$height}). Máximo 6000x6000px.");
        }

        // 5. Structure storage directories (uploads/{tenant}/{site}/{Y}/{m}/)
        $tenantUuid = $user->getTenantUuid();
        $siteUuid = $user->getSiteUuid();
        $year = date('Y');
        $month = date('m');

        $relativeFolder = "uploads/{$tenantUuid}/{$siteUuid}/{$year}/{$month}";
        $rootDir = self::getUploadRootDir();
        $diskFolder = dirname($rootDir) . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativeFolder);

        if (!is_dir($diskFolder)) {
            @mkdir($diskFolder, 0755, true);
        }

        // 6. Generate secure UUID filename stem (never use client-supplied names directly)
        $mediaUuid = Uuid::uuid4();
        $origFilename = "{$mediaUuid}-original.{$ext}";
        $origDiskPath = $diskFolder . DIRECTORY_SEPARATOR . $origFilename;
        $origStoragePath = "{$relativeFolder}/{$origFilename}";

        // Move/copy original
        if (is_uploaded_file($tmpPath)) {
            if (!move_uploaded_file($tmpPath, $origDiskPath)) {
                throw new RuntimeException('No se pudo almacenar el archivo original en el servidor.');
            }
        } else {
            if (!copy($tmpPath, $origDiskPath)) {
                throw new RuntimeException('No se pudo copiar el archivo original en el servidor.');
            }
        }

        // 7. Generate adaptive variants in WebP and AVIF
        $variants = ImageOptimizer::generateVariants($origDiskPath, $diskFolder, $mediaUuid, $relativeFolder);

        // 8. Persist media record and variants in MySQL
        $pdo = Database::getConnection();
        $pdo->beginTransaction();

        try {
            $stmt = $pdo->prepare("
                INSERT INTO media (
                    media_uuid, tenant_uuid, site_uuid,
                    original_filename, storage_path, mime_type, file_size,
                    width, height, alt_text, caption, credit
                ) VALUES (
                    :media_uuid, :tenant_uuid, :site_uuid,
                    :orig_name, :storage_path, :mime, :size,
                    :width, :height, :alt, :caption, :credit
                )
            ");

            $alt = isset($metadata['alt_text']) ? Sanitizer::stripTags($metadata['alt_text']) : null;
            $caption = isset($metadata['caption']) ? Sanitizer::stripTags($metadata['caption']) : null;
            $credit = isset($metadata['credit']) ? Sanitizer::stripTags($metadata['credit']) : null;

            $stmt->execute([
                ':media_uuid' => $mediaUuid,
                ':tenant_uuid' => $tenantUuid,
                ':site_uuid' => $siteUuid,
                ':orig_name' => $originalFilename,
                ':storage_path' => $origStoragePath,
                ':mime' => $realMime,
                ':size' => $size,
                ':width' => $width,
                ':height' => $height,
                ':alt' => $alt,
                ':caption' => $caption,
                ':credit' => $credit,
            ]);

            // Insert variants into media_variants table
            $variantStmt = $pdo->prepare("
                INSERT INTO media_variants (
                    variant_uuid, media_uuid, variant_name, format,
                    width, height, file_size, storage_path
                ) VALUES (
                    :var_uuid, :media_uuid, :var_name, :format,
                    :width, :height, :size, :path
                )
            ");

            $persistedVariants = [];
            foreach ($variants as $v) {
                $varUuid = Uuid::uuid4();
                $variantStmt->execute([
                    ':var_uuid' => $varUuid,
                    ':media_uuid' => $mediaUuid,
                    ':var_name' => $v['variant_name'],
                    ':format' => $v['format'],
                    ':width' => $v['width'],
                    ':height' => $v['height'],
                    ':size' => $v['file_size'],
                    ':path' => $v['storage_path'],
                ]);

                $persistedVariants[] = [
                    'variant_uuid' => $varUuid,
                    'variant_name' => $v['variant_name'],
                    'format' => $v['format'],
                    'width' => $v['width'],
                    'height' => $v['height'],
                    'file_size' => $v['file_size'],
                    'storage_path' => $v['storage_path'],
                    'url' => '/' . ltrim($v['storage_path'], '/'),
                ];
            }

            $pdo->commit();

            AuditService::log(
                $tenantUuid,
                $siteUuid,
                $user->getUserUuid(),
                'MEDIA_UPLOADED',
                'MEDIA',
                $mediaUuid,
                null,
                null,
                [
                    'media_uuid' => $mediaUuid,
                    'filename' => $originalFilename,
                    'variants_count' => count($persistedVariants),
                ]
            );

            return [
                'media_uuid' => $mediaUuid,
                'original_filename' => $originalFilename,
                'storage_path' => $origStoragePath,
                'url' => '/' . ltrim($origStoragePath, '/'),
                'mime_type' => $realMime,
                'file_size' => $size,
                'width' => $width,
                'height' => $height,
                'alt_text' => $alt,
                'caption' => $caption,
                'credit' => $credit,
                'variants' => $persistedVariants,
            ];
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            // Cleanup written files on DB failure
            @unlink($origDiskPath);
            foreach ($variants as $v) {
                $vPath = dirname($rootDir) . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $v['storage_path']);
                @unlink($vPath);
            }
            throw $e;
        }
    }

    /**
     * Get media details with all its adaptive variants.
     */
    public static function getMedia(string $tenantUuid, string $siteUuid, string $mediaUuid): ?array
    {
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("
            SELECT * FROM media
            WHERE tenant_uuid = :t AND site_uuid = :s AND media_uuid = :id
            LIMIT 1
        ");
        $stmt->execute([':t' => $tenantUuid, ':s' => $siteUuid, ':id' => $mediaUuid]);
        $media = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$media) {
            return null;
        }

        $media['url'] = '/' . ltrim($media['storage_path'], '/');

        // Fetch variants
        $varStmt = $pdo->prepare("
            SELECT variant_uuid, variant_name, format, width, height, file_size, storage_path
            FROM media_variants
            WHERE media_uuid = :id
            ORDER BY width ASC, format ASC
        ");
        $varStmt->execute([':id' => $mediaUuid]);
        $variants = $varStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($variants as &$v) {
            $v['url'] = '/' . ltrim($v['storage_path'], '/');
        }

        $media['variants'] = $variants;
        return $media;
    }

    /**
     * List media items for tenant/site with pagination.
     */
    public static function listMedia(string $tenantUuid, string $siteUuid, array $filters = []): array
    {
        $pdo = Database::getConnection();

        $page = max(1, (int) ($filters['page'] ?? 1));
        $limit = min(50, max(1, (int) ($filters['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $countStmt = $pdo->prepare('SELECT COUNT(*) FROM media WHERE tenant_uuid = :t AND site_uuid = :s');
        $countStmt->execute([':t' => $tenantUuid, ':s' => $siteUuid]);
        $total = (int) $countStmt->fetchColumn();

        $stmt = $pdo->prepare("
            SELECT media_uuid, original_filename, storage_path, mime_type, file_size, width, height, alt_text, caption, credit, created_at
            FROM media
            WHERE tenant_uuid = :t AND site_uuid = :s
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindValue(':t', $tenantUuid);
        $stmt->bindValue(':s', $siteUuid);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($items as &$item) {
            $item['url'] = '/' . ltrim($item['storage_path'], '/');
        }

        return [
            'media' => $items,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => (int) ceil($total / $limit),
            ],
        ];
    }

    /**
     * Update metadata (alt, caption, credit).
     */
    public static function updateMetadata(AuthenticatedUser $user, string $mediaUuid, array $data): ?array
    {
        $pdo = Database::getConnection();

        $media = self::getMedia($user->getTenantUuid(), $user->getSiteUuid(), $mediaUuid);
        if (!$media) {
            return null;
        }

        $alt = array_key_exists('alt_text', $data) ? Sanitizer::stripTags((string) $data['alt_text']) : $media['alt_text'];
        $caption = array_key_exists('caption', $data) ? Sanitizer::stripTags((string) $data['caption']) : $media['caption'];
        $credit = array_key_exists('credit', $data) ? Sanitizer::stripTags((string) $data['credit']) : $media['credit'];

        $stmt = $pdo->prepare("
            UPDATE media
            SET alt_text = :alt, caption = :caption, credit = :credit
            WHERE tenant_uuid = :t AND site_uuid = :s AND media_uuid = :id
        ");
        $stmt->execute([
            ':alt' => $alt,
            ':caption' => $caption,
            ':credit' => $credit,
            ':t' => $user->getTenantUuid(),
            ':s' => $user->getSiteUuid(),
            ':id' => $mediaUuid,
        ]);

        return self::getMedia($user->getTenantUuid(), $user->getSiteUuid(), $mediaUuid);
    }

    /**
     * Delete media item and physically remove all files from filesystem.
     */
    public static function deleteMedia(AuthenticatedUser $user, string $mediaUuid): bool
    {
        $pdo = Database::getConnection();

        $media = self::getMedia($user->getTenantUuid(), $user->getSiteUuid(), $mediaUuid);
        if (!$media) {
            return false;
        }

        $baseDir = dirname(self::getUploadRootDir());

        // 1. Delete original file from disk
        $origPath = $baseDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $media['storage_path']);
        if (file_exists($origPath)) {
            @unlink($origPath);
        }

        // 2. Delete all variant files from disk
        foreach ($media['variants'] as $v) {
            $vPath = $baseDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $v['storage_path']);
            if (file_exists($vPath)) {
                @unlink($vPath);
            }
        }

        // 3. Delete from DB (cascades to media_variants via FK)
        $stmt = $pdo->prepare("
            DELETE FROM media
            WHERE tenant_uuid = :t AND site_uuid = :s AND media_uuid = :id
        ");
        $stmt->execute([
            ':t' => $user->getTenantUuid(),
            ':s' => $user->getSiteUuid(),
            ':id' => $mediaUuid,
        ]);

        AuditService::log(
            $user->getTenantUuid(),
            $user->getSiteUuid(),
            $user->getUserUuid(),
            'MEDIA_DELETED',
            'MEDIA',
            $mediaUuid,
            null,
            null,
            [
                'media_uuid' => $mediaUuid,
                'filename' => $media['original_filename'],
            ]
        );

        return true;
    }
}

