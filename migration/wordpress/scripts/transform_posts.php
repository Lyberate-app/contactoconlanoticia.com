<?php
/**
 * transform_posts.php
 * 
 * Transforma los posts crudos de WordPress al schema del nuevo CMS.
 * 
 * Uso:
 *   php transform_posts.php --input="raw/" --output="transformed/"
 */

declare(strict_types=1);

$opts = getopt('', ['input:', 'output:', 'wp-base-url:']);
$inputDir   = rtrim($opts['input'] ?? 'raw', '/');
$outputDir  = rtrim($opts['output'] ?? 'transformed', '/');
$wpBaseUrl  = rtrim($opts['wp-base-url'] ?? '', '/');

if (!is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

// ── Cargar datos raw ───────────────────────────────────────
echo "Cargando datos raw...\n";

$rawPosts      = json_decode(file_get_contents("{$inputDir}/posts.json"), true) ?? [];
$rawCategories = json_decode(file_get_contents("{$inputDir}/categories.json"), true) ?? [];
$rawTags       = json_decode(file_get_contents("{$inputDir}/tags.json"), true) ?? [];
$rawUsers      = json_decode(file_get_contents("{$inputDir}/users.json"), true) ?? [];
$rawMedia      = json_decode(file_get_contents("{$inputDir}/media.json"), true) ?? [];

echo "Posts: " . count($rawPosts) . "\n";
echo "Categorías: " . count($rawCategories) . "\n";
echo "Tags: " . count($rawTags) . "\n";
echo "Usuarios: " . count($rawUsers) . "\n";
echo "Media: " . count($rawMedia) . "\n\n";

// ── Construir mapas de ID ──────────────────────────────────
$categoryMap = array_column($rawCategories, null, 'id');
$tagMap      = array_column($rawTags, null, 'id');
$userMap     = array_column($rawUsers, null, 'id');
$mediaMap    = array_column($rawMedia, null, 'id');

// ── Transformar categorías ────────────────────────────────
echo "Transformando categorías...\n";
$categories = array_map(function($cat) {
    return [
        'legacy_source' => 'wordpress',
        'legacy_id'     => (string) $cat['id'],
        'parent_legacy_id' => $cat['parent'] ? (string) $cat['parent'] : null,
        'name'          => html_entity_decode($cat['name'], ENT_QUOTES | ENT_HTML5, 'UTF-8'),
        'slug'          => $cat['slug'],
        'description'   => $cat['description'] ?? null,
    ];
}, $rawCategories);
file_put_contents("{$outputDir}/categories.json", json_encode($categories, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
echo "  → " . count($categories) . " categorías\n";

// ── Transformar tags ──────────────────────────────────────
echo "Transformando etiquetas...\n";
$tags = array_map(function($tag) {
    return [
        'legacy_source' => 'wordpress',
        'legacy_id'     => (string) $tag['id'],
        'name'          => html_entity_decode($tag['name'], ENT_QUOTES | ENT_HTML5, 'UTF-8'),
        'slug'          => $tag['slug'],
        'description'   => $tag['description'] ?? null,
    ];
}, $rawTags);
file_put_contents("{$outputDir}/tags.json", json_encode($tags, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
echo "  → " . count($tags) . " etiquetas\n";

// ── Transformar usuarios ──────────────────────────────────
echo "Transformando usuarios...\n";
$users = array_map(function($user) {
    return [
        'legacy_source' => 'wordpress',
        'legacy_id'     => (string) $user['id'],
        'display_name'  => $user['name'],
        'slug'          => $user['slug'],
        'email'         => $user['email'] ?? "autor.{$user['id']}@portal.local",
        'bio'           => strip_tags($user['description'] ?? ''),
        'role'          => 'author',
        // Avatar de WP (si tiene)
        'avatar_url'    => $user['avatar_urls']['96'] ?? null,
    ];
}, $rawUsers);
file_put_contents("{$outputDir}/users.json", json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
echo "  → " . count($users) . " usuarios\n";

// ── Transformar media ─────────────────────────────────────
echo "Transformando media...\n";
$media = array_map(function($item) {
    $mimeType = $item['mime_type'] ?? 'image/jpeg';
    return [
        'legacy_source'  => 'wordpress',
        'legacy_id'      => (string) $item['id'],
        'legacy_url'     => $item['source_url'] ?? null,
        'filename'       => basename($item['source_url'] ?? 'image.jpg'),
        'original_name'  => basename($item['source_url'] ?? 'image.jpg'),
        'mime_type'      => $mimeType,
        'alt_text'       => $item['alt_text'] ?? null,
        'caption'        => strip_tags($item['caption']['rendered'] ?? ''),
        'width'          => $item['media_details']['width'] ?? null,
        'height'         => $item['media_details']['height'] ?? null,
        // URL para descargar
        'download_url'   => $item['source_url'] ?? null,
    ];
}, array_filter($rawMedia, fn($m) => str_starts_with($m['mime_type'] ?? '', 'image/')));
file_put_contents("{$outputDir}/media.json", json_encode($media, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
echo "  → " . count($media) . " archivos de media\n";

// ── Transformar posts ─────────────────────────────────────
echo "Transformando posts...\n";
$transformed = [];
$skipped = [];

foreach ($rawPosts as $post) {
    // Solo publicados (status=publish en WP)
    if ($post['status'] !== 'publish') {
        // También migrar borradores si se desea
        if (!in_array($post['status'], ['publish', 'draft', 'future'])) {
            $skipped[] = ['id' => $post['id'], 'reason' => "status: {$post['status']}"];
            continue;
        }
    }

    // Mapear estado
    $status = match($post['status']) {
        'publish' => 'published',
        'draft'   => 'draft',
        'future'  => 'scheduled',
        default   => 'archived',
    };

    // Categoría principal
    $categoryLegacyId = null;
    if (!empty($post['categories'])) {
        $categoryLegacyId = (string) $post['categories'][0];
    }

    // Tags
    $tagLegacyIds = array_map('strval', $post['tags'] ?? []);

    // Imagen destacada
    $featuredMediaLegacyId = $post['featured_media'] ? (string) $post['featured_media'] : null;

    // Contenido: limpiar HTML de WP (remover Gutenberg block comments)
    $content = preg_replace('/<!-- wp:[^\n]* -->/i', '', $post['content']['rendered'] ?? '');
    $content = preg_replace('/<!-- \/wp:[^\n]* -->/i', '', $content);
    $content = trim($content);

    // Extraer excerpt
    $excerpt = strip_tags($post['excerpt']['rendered'] ?? '');
    $excerpt = trim($excerpt);

    // SEO desde Yoast (si está embebido)
    $yoast = $post['yoast_head_json'] ?? [];
    $seoTitle = $yoast['title'] ?? null;
    $seoDescription = $yoast['description'] ?? null;
    $ogTitle = $yoast['og_title'] ?? null;
    $ogDescription = $yoast['og_description'] ?? null;

    $transformed[] = [
        'legacy_source'          => 'wordpress',
        'legacy_id'              => (string) $post['id'],
        'legacy_url'             => $post['link'] ?? null,

        'title'                  => html_entity_decode($post['title']['rendered'] ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8'),
        'slug'                   => $post['slug'],
        'excerpt'                => $excerpt ?: null,
        'content'                => $content,
        'content_format'         => 'html',

        'status'                 => $status,
        'published_at'           => $post['date_gmt'] ? $post['date_gmt'] . 'Z' : null,
        'scheduled_at'           => $status === 'scheduled' ? ($post['date_gmt'] . 'Z') : null,

        'author_legacy_id'       => (string) $post['author'],
        'category_legacy_id'     => $categoryLegacyId,
        'tag_legacy_ids'         => $tagLegacyIds,
        'cover_media_legacy_id'  => $featuredMediaLegacyId,

        'seo_title'              => $seoTitle,
        'seo_description'        => $seoDescription,
        'og_title'               => $ogTitle,
        'og_description'         => $ogDescription,
        'schema_type'            => 'NewsArticle',

        'created_at'             => $post['date_gmt'] . 'Z',
        'updated_at'             => $post['modified_gmt'] . 'Z',
    ];
}

file_put_contents("{$outputDir}/posts.json", json_encode($transformed, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
file_put_contents("{$outputDir}/posts_skipped.json", json_encode($skipped, JSON_PRETTY_PRINT));

echo "  → " . count($transformed) . " posts transformados\n";
echo "  → " . count($skipped) . " posts omitidos\n\n";
echo "¡Transformación completada! Archivos en {$outputDir}/\n";

