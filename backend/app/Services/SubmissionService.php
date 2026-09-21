<?php

declare(strict_types=1);

namespace App\Services;

use App\Database\Database;
use App\Helpers\Sanitizer;
use App\Helpers\Uuid;
use App\Security\AuthenticatedUser;
use PDO;
use RuntimeException;
use InvalidArgumentException;

class SubmissionService
{
    public const VALID_STATUSES = [
        'PENDING_REVIEW',
        'APPROVED',
        'REJECTED',
        'CONVERTED',
    ];

    public const ALLOWED_IMAGE_MIMES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    public const MAX_FILE_SIZE = 5242880; // 5 MB per image
    public const MAX_FILES = 5;
    public const RATE_LIMIT_MAX_PER_HOUR = 5;

    /**
     * Check rate limit for IP address.
     */
    public static function checkRateLimit(?string $ipAddress): void
    {
        if (!$ipAddress) {
            return;
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('
            SELECT COUNT(*) 
            FROM news_submissions 
            WHERE ip_address = :ip 
              AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ');
        $stmt->execute([':ip' => $ipAddress]);
        $count = (int) $stmt->fetchColumn();

        if ($count >= self::RATE_LIMIT_MAX_PER_HOUR) {
            throw new RuntimeException(
                'Ha alcanzado el límite de envíos permitidos por hora. Por favor intente más tarde.',
                429
            );
        }
    }

    /**
     * Create a citizen news submission. NEVER publishes directly.
     */
    public static function createSubmission(
        string $tenantUuid,
        string $siteUuid,
        array $data,
        array $uploadedFiles = [],
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): array {
        // 1. Enforce rate limit
        self::checkRateLimit($ipAddress);

        // 2. Validate input fields
        $name = trim((string) ($data['name'] ?? $data['submitter_name'] ?? ''));
        if (strlen($name) < 3 || strlen($name) > 150) {
            throw new InvalidArgumentException('El nombre del remitente es obligatorio (entre 3 y 150 caracteres).');
        }

        $email = trim((string) ($data['email'] ?? $data['contact_email'] ?? ''));
        $phone = trim((string) ($data['phone'] ?? $data['contact_phone'] ?? ''));

        if ($email === '' && $phone === '') {
            throw new InvalidArgumentException('Debe proporcionar al menos un medio de contacto (teléfono o correo electrónico).');
        }

        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('El correo electrónico proporcionado no es válido.');
        }

        $location = trim((string) ($data['location'] ?? ''));
        if (strlen($location) < 3 || strlen($location) > 200) {
            throw new InvalidArgumentException('La ubicación del suceso es requerida (ej. Municipio, Parroquia o Sector).');
        }

        $title = trim((string) ($data['title'] ?? ''));
        if (strlen($title) < 5 || strlen($title) > 255) {
            throw new InvalidArgumentException('El título de la noticia es requerido (entre 5 y 255 caracteres).');
        }

        $description = trim((string) ($data['description'] ?? ''));
        if (strlen($description) < 10) {
            throw new InvalidArgumentException('La descripción del hecho debe tener al menos 10 caracteres.');
        }

        $message = isset($data['message']) ? trim((string) $data['message']) : null;
        $videoUrl = isset($data['video_url']) && trim((string) $data['video_url']) !== ''
            ? filter_var(trim((string) $data['video_url']), FILTER_SANITIZE_URL)
            : null;

        if ($videoUrl !== null && !filter_var($videoUrl, FILTER_VALIDATE_URL)) {
            throw new InvalidArgumentException('El enlace de video no es una URL válida.');
        }

        // 3. Process image attachments securely
        $savedAttachments = [];
        if (!empty($uploadedFiles)) {
            $savedAttachments = self::handleUploadedFiles($tenantUuid, $siteUuid, $uploadedFiles);
        }

        // 4. Persist submission
        $submissionUuid = Uuid::uuid4();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare('
            INSERT INTO news_submissions (
                submission_uuid, tenant_uuid, site_uuid, submitter_name,
                contact_email, contact_phone, location, title, description,
                message, video_url, attachments, status, ip_address, user_agent,
                created_at, updated_at
            ) VALUES (
                :submission_uuid, :tenant_uuid, :site_uuid, :submitter_name,
                :contact_email, :contact_phone, :location, :title, :description,
                :message, :video_url, :attachments, "PENDING_REVIEW", :ip_address, :user_agent,
                NOW(), NOW()
            )
        ');

        $stmt->execute([
            ':submission_uuid' => $submissionUuid,
            ':tenant_uuid' => $tenantUuid,
            ':site_uuid' => $siteUuid,
            ':submitter_name' => Sanitizer::stripTags($name),
            ':contact_email' => $email !== '' ? $email : null,
            ':contact_phone' => $phone !== '' ? Sanitizer::stripTags($phone) : null,
            ':location' => Sanitizer::stripTags($location),
            ':title' => Sanitizer::stripTags($title),
            ':description' => Sanitizer::stripTags($description),
            ':message' => $message ? Sanitizer::stripTags($message) : null,
            ':video_url' => $videoUrl,
            ':attachments' => !empty($savedAttachments) ? json_encode($savedAttachments, JSON_UNESCAPED_SLASHES) : null,
            ':ip_address' => $ipAddress,
            ':user_agent' => $userAgent ? substr($userAgent, 0, 255) : null,
        ]);

        return self::getSubmission($tenantUuid, $siteUuid, $submissionUuid);
    }

    /**
     * List submissions for editorial review.
     */
    public static function listSubmissions(
        string $tenantUuid,
        string $siteUuid,
        array $filters = [],
        int $page = 1,
        int $limit = 20
    ): array {
        $pdo = Database::getConnection();

        $where = [
            's.tenant_uuid = :tenant_uuid',
            's.site_uuid = :site_uuid',
        ];
        $bindings = [
            ':tenant_uuid' => $tenantUuid,
            ':site_uuid' => $siteUuid,
        ];

        if (!empty($filters['status']) && in_array($filters['status'], self::VALID_STATUSES, true)) {
            $where[] = 's.status = :status';
            $bindings[':status'] = $filters['status'];
        }

        if (!empty($filters['search'])) {
            $where[] = '(s.title LIKE :search OR s.submitter_name LIKE :search OR s.location LIKE :search)';
            $bindings[':search'] = '%' . trim($filters['search']) . '%';
        }

        $whereSql = implode(' AND ', $where);

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM news_submissions s WHERE {$whereSql}");
        $countStmt->execute($bindings);
        $total = (int) $countStmt->fetchColumn();

        $page = max(1, $page);
        $limit = max(1, min(100, $limit));
        $offset = ($page - 1) * $limit;

        $sql = "
            SELECT 
                s.*,
                a.title AS converted_article_title,
                a.slug AS converted_article_slug
            FROM news_submissions s
            LEFT JOIN articles a ON a.article_uuid = s.converted_article_uuid
            WHERE {$whereSql}
            ORDER BY s.created_at DESC
            LIMIT {$limit} OFFSET {$offset}
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($bindings);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($items as &$item) {
            $item['attachments'] = !empty($item['attachments']) ? json_decode($item['attachments'], true) : [];
        }
        unset($item);

        return [
            'items' => $items,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => (int) ceil($total / $limit),
            ],
        ];
    }

    /**
     * Get single submission by UUID.
     */
    public static function getSubmission(string $tenantUuid, string $siteUuid, string $submissionUuid): ?array
    {
        if (!Uuid::isValid($submissionUuid)) {
            return null;
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('
            SELECT 
                s.*,
                a.title AS converted_article_title,
                a.slug AS converted_article_slug,
                u.name AS reviewer_name
            FROM news_submissions s
            LEFT JOIN articles a ON a.article_uuid = s.converted_article_uuid
            LEFT JOIN users u ON u.user_uuid = s.reviewed_by_user_uuid
            WHERE s.submission_uuid = :submission_uuid 
              AND s.tenant_uuid = :tenant_uuid 
              AND s.site_uuid = :site_uuid
            LIMIT 1
        ');
        $stmt->execute([
            ':submission_uuid' => $submissionUuid,
            ':tenant_uuid' => $tenantUuid,
            ':site_uuid' => $siteUuid,
        ]);

        $item = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$item) {
            return null;
        }

        $item['attachments'] = !empty($item['attachments']) ? json_decode($item['attachments'], true) : [];
        return $item;
    }

    /**
     * Reject a submission with explanation.
     */
    public static function rejectSubmission(
        string $tenantUuid,
        string $siteUuid,
        string $submissionUuid,
        string $reason,
        AuthenticatedUser $reviewer
    ): array {
        $submission = self::getSubmission($tenantUuid, $siteUuid, $submissionUuid);
        if (!$submission) {
            throw new RuntimeException('Reporte ciudadano no encontrado.', 404);
        }

        $reasonTrimmed = trim($reason);
        if ($reasonTrimmed === '') {
            throw new InvalidArgumentException('Debe indicar un motivo o justificación para el rechazo.');
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('
            UPDATE news_submissions 
            SET status = "REJECTED",
                rejection_reason = :reason,
                reviewed_by_user_uuid = :user_uuid,
                reviewed_at = NOW(),
                updated_at = NOW()
            WHERE submission_uuid = :submission_uuid 
              AND tenant_uuid = :tenant_uuid 
              AND site_uuid = :site_uuid
        ');
        $stmt->execute([
            ':reason' => Sanitizer::stripTags($reasonTrimmed),
            ':user_uuid' => $reviewer->getUserUuid(),
            ':submission_uuid' => $submissionUuid,
            ':tenant_uuid' => $tenantUuid,
            ':site_uuid' => $siteUuid,
        ]);

        return self::getSubmission($tenantUuid, $siteUuid, $submissionUuid);
    }

    /**
     * Convert a submission to a CMS article assigned to a single designated journalist.
     * Always creates the article in DRAFT state for editorial verification.
     */
    public static function convertToArticle(
        string $tenantUuid,
        string $siteUuid,
        string $submissionUuid,
        array $overrides,
        AuthenticatedUser $reviewer
    ): array {
        $submission = self::getSubmission($tenantUuid, $siteUuid, $submissionUuid);
        if (!$submission) {
            throw new RuntimeException('Reporte ciudadano no encontrado.', 404);
        }

        if ($submission['status'] === 'CONVERTED') {
            throw new RuntimeException('Este reporte ya ha sido convertido previamente en artículo.', 400);
        }

        $pdo = Database::getConnection();

        // 1. Resolve single journalist / author
        $authorUuid = $overrides['author_uuid'] ?? null;
        if (!$authorUuid || !Uuid::isValid($authorUuid)) {
            // Pick canonical default author for the site
            $authorStmt = $pdo->prepare('
                SELECT author_uuid 
                FROM authors 
                WHERE tenant_uuid = :tenant_uuid 
                  AND site_uuid = :site_uuid 
                  AND status = "ACTIVE"
                ORDER BY created_at ASC 
                LIMIT 1
            ');
            $authorStmt->execute([
                ':tenant_uuid' => $tenantUuid,
                ':site_uuid' => $siteUuid,
            ]);
            $authorUuid = $authorStmt->fetchColumn();
            if (!$authorUuid) {
                throw new RuntimeException('No hay autores activos configurados para este sitio.', 400);
            }
        }

        // 2. Resolve canonical category (default to first active category, e.g. Comunidades/Regionales)
        $categoryUuid = $overrides['category_uuid'] ?? null;
        if (!$categoryUuid || !Uuid::isValid($categoryUuid)) {
            $catStmt = $pdo->prepare('
                SELECT category_uuid 
                FROM categories 
                WHERE tenant_uuid = :tenant_uuid 
                  AND site_uuid = :site_uuid 
                  AND status = "ACTIVE"
                ORDER BY sort_order ASC 
                LIMIT 1
            ');
            $catStmt->execute([
                ':tenant_uuid' => $tenantUuid,
                ':site_uuid' => $siteUuid,
            ]);
            $categoryUuid = $catStmt->fetchColumn();
            if (!$categoryUuid) {
                throw new RuntimeException('No hay categorías activas configuradas para este sitio.', 400);
            }
        }

        // 3. Compose article content with clear journalistic provenance
        $articleTitle = !empty($overrides['title']) ? trim((string) $overrides['title']) : $submission['title'];
        $articleSubtitle = !empty($overrides['subtitle'])
            ? trim((string) $overrides['subtitle'])
            : "Reporte de la comunidad recibido desde {$submission['location']}";

        $articleExcerpt = !empty($overrides['excerpt'])
            ? trim((string) $overrides['excerpt'])
            : substr($submission['description'], 0, 200) . '...';

        $bodyProse = $submission['description'];
        $provenanceNote = "\n\n---\n*Reporte comunitario enviado por {$submission['submitter_name']} desde {$submission['location']}. Verificado por la mesa de redacción.*";
        $fullContent = $bodyProse . $provenanceNote;

        // 4. Create Article in DRAFT status (strictly NOT published)
        $articleData = [
            'author_uuid' => $authorUuid,
            'category_uuid' => $categoryUuid,
            'title' => $articleTitle,
            'subtitle' => $articleSubtitle,
            'excerpt' => $articleExcerpt,
            'content' => $fullContent,
            'status' => 'DRAFT',
            'tags' => $overrides['tags'] ?? ['Comunidades', 'Reporte Ciudadano'],
        ];

        $createdArticle = ArticleService::createArticle($reviewer, $articleData);
        $articleUuid = $createdArticle['article_uuid'];

        // 5. Update submission record to CONVERTED
        $updateStmt = $pdo->prepare('
            UPDATE news_submissions 
            SET status = "CONVERTED",
                converted_article_uuid = :article_uuid,
                assigned_author_uuid = :author_uuid,
                reviewed_by_user_uuid = :user_uuid,
                reviewed_at = NOW(),
                updated_at = NOW()
            WHERE submission_uuid = :submission_uuid 
              AND tenant_uuid = :tenant_uuid 
              AND site_uuid = :site_uuid
        ');
        $updateStmt->execute([
            ':article_uuid' => $articleUuid,
            ':author_uuid' => $authorUuid,
            ':user_uuid' => $reviewer->getUserUuid(),
            ':submission_uuid' => $submissionUuid,
            ':tenant_uuid' => $tenantUuid,
            ':site_uuid' => $siteUuid,
        ]);

        return [
            'submission' => self::getSubmission($tenantUuid, $siteUuid, $submissionUuid),
            'article' => $createdArticle,
        ];
    }

    /**
     * Helper to validate and save uploaded files.
     */
    private static function handleUploadedFiles(string $tenantUuid, string $siteUuid, array $files): array
    {
        $saved = [];
        $fileList = self::normalizeFilesArray($files);

        if (count($fileList) > self::MAX_FILES) {
            throw new InvalidArgumentException('Máximo 5 imágenes permitidas por reporte.');
        }

        $baseDir = dirname(__DIR__, 2) . "/storage/uploads/submissions/{$tenantUuid}/{$siteUuid}";
        if (!is_dir($baseDir)) {
            mkdir($baseDir, 0755, true);
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);

        foreach ($fileList as $file) {
            if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
                continue;
            }

            if ($file['error'] !== UPLOAD_ERR_OK) {
                continue;
            }

            if ($file['size'] > self::MAX_FILE_SIZE) {
                throw new InvalidArgumentException("El archivo '{$file['name']}' excede el tamaño máximo permitido de 5MB.");
            }

            $mime = finfo_file($finfo, $file['tmp_name']);
            if (!isset(self::ALLOWED_IMAGE_MIMES[$mime])) {
                throw new InvalidArgumentException("Formato de imagen no permitido ('{$mime}'). Solo se aceptan JPEG, PNG o WebP.");
            }

            $ext = self::ALLOWED_IMAGE_MIMES[$mime];
            $fileName = Uuid::uuid4() . '.' . $ext;
            $destination = "{$baseDir}/{$fileName}";

            if (!move_uploaded_file($file['tmp_name'], $destination)) {
                throw new RuntimeException("Error al guardar archivo adjunto en disco.");
            }

            $saved[] = [
                'name' => Sanitizer::stripTags($file['name']),
                'path' => "submissions/{$tenantUuid}/{$siteUuid}/{$fileName}",
                'mime' => $mime,
                'size' => (int) $file['size'],
            ];
        }

        finfo_close($finfo);
        return $saved;
    }

    /**
     * Normalize $_FILES array structure.
     */
    private static function normalizeFilesArray(array $files): array
    {
        $normalized = [];

        // Single file or direct array of files
        if (isset($files['tmp_name']) && is_string($files['tmp_name'])) {
            return [$files];
        }

        // Multiple files with name => []
        if (isset($files['tmp_name']) && is_array($files['tmp_name'])) {
            $count = count($files['tmp_name']);
            for ($i = 0; $i < $count; $i++) {
                if (!empty($files['tmp_name'][$i])) {
                    $normalized[] = [
                        'name' => $files['name'][$i] ?? '',
                        'type' => $files['type'][$i] ?? '',
                        'tmp_name' => $files['tmp_name'][$i],
                        'error' => $files['error'][$i] ?? UPLOAD_ERR_OK,
                        'size' => $files['size'][$i] ?? 0,
                    ];
                }
            }
            return $normalized;
        }

        // List of file objects
        foreach ($files as $f) {
            if (is_array($f) && isset($f['tmp_name'])) {
                $normalized[] = $f;
            }
        }

        return $normalized;
    }
}

