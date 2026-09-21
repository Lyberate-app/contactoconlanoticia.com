<?php

declare(strict_types=1);

namespace App\Services;

use App\Database\Database;
use PDO;

class SlugService
{
    /**
     * Convert any string into a clean URL-friendly slug.
     */
    public static function slugify(string $text): string
    {
        // Replace non letter or digits by -
        $text = preg_replace('~[^\pL\d]+~u', '-', $text) ?? '';

        // Transliterate accents
        if (function_exists('iconv')) {
            $transliterated = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
            if ($transliterated !== false) {
                $text = $transliterated;
            }
        }

        // Remove unwanted characters
        $text = preg_replace('~[^-\w]+~', '', $text) ?? '';

        // Trim
        $text = trim($text, '-');

        // Remove duplicate -
        $text = preg_replace('~-+~', '-', $text) ?? '';

        // Lowercase
        $text = strtolower($text);

        if (empty($text)) {
            return 'noticia-' . substr(bin2hex(random_bytes(3)), 0, 6);
        }

        return $text;
    }

    /**
     * Generate a guaranteed unique slug for a given tenant and site.
     */
    public static function generateUniqueSlug(
        string $table,
        string $title,
        string $tenantUuid,
        string $siteUuid,
        ?string $currentUuid = null,
        string $slugColumn = 'slug',
        string $pkColumn = 'article_uuid'
    ): string {
        $baseSlug = self::slugify($title);
        $slug = $baseSlug;
        $counter = 1;

        $pdo = Database::getConnection();

        while (true) {
            $sql = "SELECT {$pkColumn} FROM {$table} WHERE tenant_uuid = :tenant AND site_uuid = :site AND {$slugColumn} = :slug";
            $params = [
                ':tenant' => $tenantUuid,
                ':site' => $siteUuid,
                ':slug' => $slug,
            ];

            if ($currentUuid !== null) {
                $sql .= " AND {$pkColumn} != :current_id";
                $params[':current_id'] = $currentUuid;
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            if ($stmt->fetch() === false) {
                return $slug;
            }

            $counter++;
            $slug = $baseSlug . '-' . $counter;
        }
    }
}

