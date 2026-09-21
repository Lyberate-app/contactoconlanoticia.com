-- ==============================================================================
-- Seed: 002_contacto_con_la_noticia_seed.sql
-- Description: Seeds the initial Tenant, Site and official Categories for Contacto con la Noticia
-- ==============================================================================

-- 1. Insert Initial Tenant
INSERT INTO tenants (tenant_uuid, name, slug, status) VALUES
('00000000-0000-0000-0000-000000000001', 'Contacto con la Noticia Media Group', 'contacto-con-la-noticia', 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 2. Insert Initial Site
INSERT INTO sites (site_uuid, tenant_uuid, name, slug, domain, status) VALUES
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Contacto con la Noticia', 'contacto-con-la-noticia', 'contactoconlanoticia.com', 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), domain = VALUES(domain);

-- 3. Insert Canonical Editorial Categories
INSERT INTO categories (category_uuid, tenant_uuid, site_uuid, name, slug, description, sort_order, status) VALUES
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Regionales', 'regionales', 'Noticias e informaciones de ámbito regional', 1, 'ACTIVE'),
('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Sucesos', 'sucesos', 'Acontecimientos, orden público y sucesos de actualidad', 2, 'ACTIVE'),
('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Comunidades', 'comunidades', 'Vida comunitaria, denuncias vecinales y sociedad', 3, 'ACTIVE'),
('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Municipales', 'municipales', 'Gestión municipal, servicios públicos y actualidad local', 4, 'ACTIVE'),
('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Turismo', 'turismo', 'Destinos, gastronomía, patrimonio y turismo', 5, 'ACTIVE'),
('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Internacionales', 'internacionales', 'Acontecimientos y noticias del panorama internacional', 6, 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), sort_order = VALUES(sort_order);

