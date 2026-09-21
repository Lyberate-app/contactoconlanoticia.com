-- ==============================================================================
-- Seed: 003_admin_user_seed.sql
-- Description: Seeds the initial super admin user for testing and local administration
-- Password: AdminPassword123!
-- ==============================================================================

INSERT INTO users (
    user_uuid,
    tenant_uuid,
    site_uuid,
    name,
    email,
    password_hash,
    status
) VALUES (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'Administrador Principal',
    'admin@contactoconlanoticia.com',
    '$2y$12$gxINl.BuE09vyCQRVsgcq.G7Xr2R8oRAkKZs0p4sq90D9YLJbVfMO',
    'ACTIVE'
) ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Assign SUPER_ADMIN role (role_id = 1)
INSERT INTO user_roles (user_uuid, role_id)
SELECT '00000000-0000-0000-0000-000000000010', role_id
FROM roles WHERE name = 'SUPER_ADMIN'
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

