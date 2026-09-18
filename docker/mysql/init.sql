-- ══════════════════════════════════════════════════════════
-- Portal Editorial — Inicialización de MySQL
-- ══════════════════════════════════════════════════════════
-- Este script se ejecuta automáticamente cuando el contenedor
-- de MySQL se inicializa por primera vez.

CREATE DATABASE IF NOT EXISTS portal_editorial
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Base de datos de testing separada
CREATE DATABASE IF NOT EXISTS portal_editorial_test
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON portal_editorial.* TO 'portal_user'@'%';
GRANT ALL PRIVILEGES ON portal_editorial_test.* TO 'portal_user'@'%';
FLUSH PRIVILEGES;

