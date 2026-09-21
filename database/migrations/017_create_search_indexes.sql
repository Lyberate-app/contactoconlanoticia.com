-- ==============================================================================
-- Migration: 017_create_search_indexes.sql
-- Description: Adds FULLTEXT search index on articles and supporting indexes
-- ==============================================================================

-- 1. Check and add FULLTEXT index on articles for full-text search capability
SET @dbname = DATABASE();
SET @tablename = "articles";
SET @indexname = "ft_articles_search";

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = @dbname
          AND TABLE_NAME = @tablename
          AND INDEX_NAME = @indexname
    ) > 0,
    "SELECT 'Index already exists';",
    "ALTER TABLE articles ADD FULLTEXT INDEX ft_articles_search (title, subtitle, excerpt, content);"
));

PREPARE addIndexIfNotExists FROM @preparedStatement;
EXECUTE addIndexIfNotExists;
DEALLOCATE PREPARE addIndexIfNotExists;

