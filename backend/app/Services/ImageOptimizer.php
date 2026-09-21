<?php

declare(strict_types=1);

namespace App\Services;

use RuntimeException;

class ImageOptimizer
{
    public const TARGET_WIDTHS = [320, 640, 960, 1440];
    public const WEBP_QUALITY = 82;
    public const AVIF_QUALITY = 75;

    /**
     * Check if GD extension is loaded.
     */
    public static function isGdAvailable(): bool
    {
        return extension_loaded('gd');
    }

    /**
     * Check if WebP format generation is supported.
     */
    public static function supportsWebp(): bool
    {
        return function_exists('imagewebp');
    }

    /**
     * Check if AVIF format generation is supported.
     */
    public static function supportsAvif(): bool
    {
        return function_exists('imageavif');
    }

    /**
     * Get real image dimensions and MIME via getimagesize().
     *
     * @return array{width: int, height: int, mime: string}|null
     */
    public static function getImageInfo(string $filePath): ?array
    {
        if (!file_exists($filePath) || !is_readable($filePath)) {
            return null;
        }

        $info = @getimagesize($filePath);
        if ($info === false || $info[0] <= 0 || $info[1] <= 0) {
            return null;
        }

        return [
            'width' => (int) $info[0],
            'height' => (int) $info[1],
            'mime' => (string) ($info['mime'] ?? ''),
        ];
    }

    /**
     * Generate responsive image variants in WebP and AVIF.
     *
     * @param string $sourcePath Full path to original file on disk
     * @param string $outputDir Directory where variants will be stored
     * @param string $baseFilename Unique filename stem (without extension)
     * @param string $relativePrefix Relative URL/storage path prefix
     * @return array<int, array{variant_name: string, format: string, width: int, height: int, file_size: int, storage_path: string}>
     */
    public static function generateVariants(
        string $sourcePath,
        string $outputDir,
        string $baseFilename,
        string $relativePrefix = ''
    ): array {
        if (!self::isGdAvailable()) {
            return [];
        }

        $info = self::getImageInfo($sourcePath);
        if (!$info) {
            throw new RuntimeException('No se pudo determinar las dimensiones de la imagen original.');
        }

        $srcWidth = $info['width'];
        $srcHeight = $info['height'];
        $mime = $info['mime'];

        // Load source image resource based on MIME
        $srcImage = self::createImageFromMime($sourcePath, $mime);
        if (!$srcImage) {
            return [];
        }

        if (!is_dir($outputDir)) {
            @mkdir($outputDir, 0755, true);
        }

        $variants = [];
        $supportsWebp = self::supportsWebp();
        $supportsAvif = self::supportsAvif();

        foreach (self::TARGET_WIDTHS as $targetWidth) {
            // Determine proportional dimensions
            if ($srcWidth <= $targetWidth && $targetWidth > 320) {
                // If original is smaller than target width and not smallest variant, cap at source width
                $destWidth = $srcWidth;
                $destHeight = $srcHeight;
            } else {
                $ratio = $targetWidth / $srcWidth;
                $destWidth = $targetWidth;
                $destHeight = (int) max(1, round($srcHeight * $ratio));
            }

            // Create canvas
            $destImage = imagecreatetruecolor($destWidth, $destHeight);
            if (!$destImage) {
                continue;
            }

            // Preserve alpha channel transparency for PNG / WebP / AVIF
            imagealphablending($destImage, false);
            imagesavealpha($destImage, true);
            $transparent = imagecolorallocatealpha($destImage, 255, 255, 255, 127);
            imagefilledrectangle($destImage, 0, 0, $destWidth, $destHeight, $transparent);

            // Resample with high quality interpolation
            imagecopyresampled(
                $destImage,
                $srcImage,
                0,
                0,
                0,
                0,
                $destWidth,
                $destHeight,
                $srcWidth,
                $srcHeight
            );

            // 1. Export WebP Variant
            if ($supportsWebp) {
                $webpFilename = "{$baseFilename}-{$targetWidth}.webp";
                $webpDiskPath = rtrim($outputDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $webpFilename;
                if (imagewebp($destImage, $webpDiskPath, self::WEBP_QUALITY)) {
                    $relativeStoragePath = rtrim($relativePrefix, '/') . '/' . $webpFilename;
                    $variants[] = [
                        'variant_name' => (string) $targetWidth,
                        'format' => 'webp',
                        'width' => $destWidth,
                        'height' => $destHeight,
                        'file_size' => (int) filesize($webpDiskPath),
                        'storage_path' => ltrim($relativeStoragePath, '/'),
                    ];
                }
            }

            // 2. Export AVIF Variant (if supported)
            if ($supportsAvif) {
                $avifFilename = "{$baseFilename}-{$targetWidth}.avif";
                $avifDiskPath = rtrim($outputDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $avifFilename;
                if (imageavif($destImage, $avifDiskPath, self::AVIF_QUALITY)) {
                    $relativeStoragePath = rtrim($relativePrefix, '/') . '/' . $avifFilename;
                    $variants[] = [
                        'variant_name' => (string) $targetWidth,
                        'format' => 'avif',
                        'width' => $destWidth,
                        'height' => $destHeight,
                        'file_size' => (int) filesize($avifDiskPath),
                        'storage_path' => ltrim($relativeStoragePath, '/'),
                    ];
                }
            }

            imagedestroy($destImage);
        }

        imagedestroy($srcImage);

        return $variants;
    }

    /**
     * Create GD resource from supported image MIME type.
     *
     * @return \GdImage|resource|false
     */
    private static function createImageFromMime(string $filePath, string $mime)
    {
        return match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($filePath),
            'image/png' => @imagecreatefrompng($filePath),
            'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($filePath) : false,
            'image/avif' => function_exists('imagecreatefromavif') ? @imagecreatefromavif($filePath) : false,
            default => false,
        };
    }
}

