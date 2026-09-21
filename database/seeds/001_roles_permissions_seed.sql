-- ==============================================================================
-- Seed: 001_roles_permissions_seed.sql
-- Description: Seeds the core canonical roles, permissions, and role_permissions
-- ==============================================================================

-- 1. Insert Core Roles
INSERT INTO roles (role_id, name, description) VALUES
(1, 'SUPER_ADMIN', 'Super Administrador con acceso total al sistema y tenants'),
(2, 'SITE_ADMIN', 'Administrador del sitio con gestión de usuarios, contenido y ajustes'),
(3, 'EDITOR', 'Editor con capacidad de crear, editar, revisar y publicar artículos'),
(4, 'JOURNALIST', 'Periodista o redactor con capacidad de redactar borradores y subir multimedia'),
(5, 'AD_MANAGER', 'Gestor comercial para administración de campañas publicitarias')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 2. Insert Core Permissions
INSERT INTO permissions (permission_id, name, description) VALUES
(1, 'articles.create', 'Crear nuevos artículos y borradores'),
(2, 'articles.edit', 'Modificar artículos existentes'),
(3, 'articles.publish', 'Publicar o programar artículos'),
(4, 'articles.delete', 'Eliminar o archivar artículos'),
(5, 'media.upload', 'Subir archivos multimedia e imágenes'),
(6, 'media.delete', 'Eliminar archivos multimedia'),
(7, 'users.create', 'Crear nuevos usuarios en el sitio'),
(8, 'users.edit', 'Editar usuarios y asignación de roles'),
(9, 'ads.manage', 'Gestionar espacios y campañas publicitarias'),
(10, 'settings.edit', 'Modificar configuraciones del sitio'),
(11, 'audit.view', 'Consultar registros de auditoría del sistema')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 3. Map Permissions to Roles

-- SUPER_ADMIN: All permissions (1 to 11)
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11);

-- SITE_ADMIN: All site permissions (1 to 11)
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8), (2, 9), (2, 10), (2, 11);

-- EDITOR: Editorial permissions (articles.*, media.*, audit.view)
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 11);

-- JOURNALIST: Drafting and upload permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(4, 1), (4, 2), (4, 5);

-- AD_MANAGER: Advertising management and upload
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(5, 9), (5, 5);

