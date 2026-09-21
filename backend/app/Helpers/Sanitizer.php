<?php

declare(strict_types=1);

namespace App\Helpers;

class Sanitizer
{
    /**
     * Trim and clean UTF-8 string input.
     */
    public static function cleanString(string $input): string
    {
        $trimmed = trim($input);
        // Normalize line breaks and remove null bytes
        $cleaned = str_replace("\0", '', $trimmed);
        return preg_replace('/(?:\r\n|\r|\n)/', "\n", $cleaned) ?? '';
    }

    /**
     * Strip HTML/PHP tags from input.
     */
    public static function stripTags(string $input): string
    {
        return strip_tags(self::cleanString($input));
    }

    /**
     * Convert special characters to HTML entities for safe output.
     */
    public static function escapeHtml(string $input): string
    {
        return htmlspecialchars($input, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    /**
     * Sanitize array recursively.
     */
    public static function cleanArray(array $input): array
    {
        $result = [];
        foreach ($input as $key => $value) {
            $cleanKey = is_string($key) ? self::cleanString($key) : $key;
            if (is_array($value)) {
                $result[$cleanKey] = self::cleanArray($value);
            } elseif (is_string($value)) {
                $result[$cleanKey] = self::cleanString($value);
            } else {
                $result[$cleanKey] = $value;
            }
        }
        return $result;
    }
}

