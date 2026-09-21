-- ==============================================================================
-- Seed: 004_sample_editorial_seed.sql
-- Description: Realistic journalistic sample content for Contacto con la Noticia
-- ==============================================================================

-- 1. Insert Public Authors
INSERT INTO authors (author_uuid, tenant_uuid, site_uuid, name, slug, bio, status) VALUES
('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Redacción Contacto con la Noticia', 'redaccion', 'Mesa editorial central de Contacto con la Noticia. Cobertura de última hora e información verificada de los Llanos venezolanos.', 'ACTIVE'),
('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Carlos Mendoza', 'carlos-mendoza', 'Periodista de investigación y análisis regional en el estado Guárico. Más de 15 años de trayectoria en medios de comunicación impresos y digitales.', 'ACTIVE'),
('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Elena Vásquez', 'elena-vasquez', 'Corresponsal de sucesos, seguridad ciudadana y asuntos judiciales. Egresada de la Universidad Central de Venezuela con mención en periodismo informativo.', 'ACTIVE'),
('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Marcos Rodríguez', 'marcos-rodriguez', 'Cronista de temas comunitarios, cultura popular, ecología y turismo llanero. Especialista en crónicas de calle y patrimonio venezolano.', 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), bio = VALUES(bio);

-- 2. Insert Editorial Tags
INSERT INTO tags (tag_uuid, tenant_uuid, site_uuid, name, slug) VALUES
('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'San Juan de los Morros', 'san-juan-de-los-morros'),
('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Guárico', 'guarico'),
('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Servicios Públicos', 'servicios-publicos'),
('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Producción Agrícola', 'produccion-agricola'),
('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Seguridad', 'seguridad'),
('00000000-0000-0000-0003-000000000006', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Economía', 'economia')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 3. Insert Published News Articles
INSERT INTO articles (
    article_uuid, tenant_uuid, site_uuid, author_uuid, category_uuid,
    title, subtitle, excerpt, content, slug, status, published_at, modified_at
) VALUES
-- Article 1: Lead Story (Regionales)
(
    '00000000-0000-0000-0004-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0001-000000000001',
    'Plan Integral de Reactivación Agrícola busca elevar la siembra de cereales en el estado Guárico',
    'Más de 120 mil hectáreas serán incorporadas al ciclo productivo',
    'Asociaciones de productores y gremios agrícolas de los municipios centrales establecen acuerdos técnicos para optimizar insumos, maquinaria y financiamiento en los Llanos Centrales.',
    'San Juan de los Morros — Con la participación de representantes de diversas asociaciones de productores y autoridades agropecuarias, se formalizó este lunes el lanzamiento del plan estratégico destinado a potenciar el ciclo de siembra en las principales zonas cerealeras de Guárico.\n\nEl plan contempla la adecuación de canales de riego, la distribución garantizada de semillas certificadas y combustible para maquinaria pesada, así como la activación de puestos de control fitosanitario en las rutas de despacho hacia los silos de almacenaje.\n\n"Nuestro objetivo es que el productor cuente con certezas operativas desde el momento de la preparación de tierras hasta la cosecha final", expresó el vocero gremial durante la asamblea celebrada en la capital guariqueña.\n\nEl ciclo prevé impactar de manera directa en municipios clave como Francisco de Miranda, Infante y Mellado, consolidando a la entidad como uno de los polos agroalimentarios fundamentales de Venezuela.',
    'plan-integral-de-reactivacion-agricola-busca-elevar-la-siembra-de-cereales-en-el-estado-guarico',
    'PUBLISHED',
    '2026-09-20 07:30:00',
    NULL
),
-- Article 2: Secondary Story (Sucesos)
(
    '00000000-0000-0000-0004-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0002-000000000003',
    '00000000-0000-0000-0001-000000000002',
    'Despliegan operativo de seguridad ciudadana en los corredores viales de Roscio y Ortiz',
    'Más de 200 funcionarios participan en puntos de control preventivos',
    'Cuerpos de orden público intensifican patrullaje nocturno y verificación vehicular para reducir incidencias delictivas en las troncales principales.',
    'San Juan de los Morros — Desde las primeras horas del fin de semana, comisiones mixtas de seguridad ciudadana activaron dispositivos de vigilancia y fiscalización vial en las entradas estratégicas de San Juan de los Morros y la población de Ortiz.\n\nEl despliegue busca responder a las solicitudes vecinales sobre la prevención de hurtos, carreras ilegales y la supervisión de unidades de transporte público interurbano.\n\nAutoridades indicaron que los puntos de atención al ciudadano operarán durante las 24 horas con chequeo biométrico y verificación de documentos.',
    'despliegan-operativo-de-seguridad-ciudadana-en-los-corredores-viales-de-roscio-y-ortiz',
    'PUBLISHED',
    '2026-09-20 09:15:00',
    '2026-09-20 11:45:00'
),
-- Article 3: Secondary Story (Comunidades)
(
    '00000000-0000-0000-0004-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0002-000000000004',
    '00000000-0000-0000-0001-000000000003',
    'Vecinos de La Morera reportan avances en la sustitución de tuberías de aguas servidas',
    'Labores comunitarias benefician a más de 300 familias del sector',
    'Cuadrillas técnicas y vecinos organizados culminaron la primera etapa del colector principal tras semanas de dificultades con el colapso de la red hídrica.',
    'San Juan de los Morros — Habitantes del sector La Morera manifestaron satisfacción por la culminación del tramo central del colector de aguas servidas en la calle principal, una obra ejecutada en articulación con las mesas técnicas de agua.\n\nLos trabajos evitarán anegaciones durante la temporada de lluvias venidera y permitirán la pronta reactivación del servicio de asfaltado en las vías afectadas.',
    'vecinos-de-la-morera-reportan-avances-en-la-sustitucion-de-tuberias-de-aguas-servidas',
    'PUBLISHED',
    '2026-09-20 14:00:00',
    NULL
),
-- Article 4: Municipales
(
    '00000000-0000-0000-0004-000000000004',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0001-000000000004',
    'Alcaldía de Roscio anuncia plan de modernización del alumbrado público con tecnología LED',
    'Avenidas Bolívar, Los Llanos y Acosta Carles serán las primeras en ser intervenidas',
    'El proyecto de iluminación urbana contempla la instalación de 1.500 luminarias de bajo consumo energético para optimizar la visibilidad nocturna.',
    'San Juan de los Morros — El gobierno municipal del municipio Juan Germán Roscio Nieves presentó el cronograma de renovación del alumbrado en las arterias viales de mayor tránsito en la capital guariqueña.\n\nLa inversión incluye el reemplazo de cableado deteriorado, fotoceldas automáticas y postes de alta resistencia en intersecciones críticas para la movilidad peatonal.',
    'alcaldia-de-roscio-anuncia-plan-de-modernizacion-del-alumbrado-publico-con-tecnologia-led',
    'PUBLISHED',
    '2026-09-20 16:30:00',
    NULL
),
-- Article 5: Turismo
(
    '00000000-0000-0000-0004-000000000005',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0002-000000000004',
    '00000000-0000-0000-0001-000000000005',
    'Los Morros de San Juan: Patrimonio natural que atrae a escaladores y senderistas de todo el país',
    'El Monumento Natural Arístides Rojas se consolida como ruta ecoturística',
    'Con sus imponentes formaciones calizas de más de mil metros de altitud, el parque natural ofrece senderos señalizados y vistas panorámicas de los valles centrales.',
    'San Juan de los Morros — El Monumento Natural Arístides Rojas, emblema geológico del estado Guárico, continúa recibiendo a delegaciones de deportistas y familias atraídas por sus rutas de senderismo y escalada en roca caliza.\n\nGuías locales y operadores turísticos han consolidado recorridos guiados con medidas de conservación ambiental para proteger la fauna silvestre y el ecosistema rocoso característico de la región.',
    'los-morros-de-san-juan-patrimonio-natural-que-atrae-a-escaladores-y-senderistas-de-todo-el-pais',
    'PUBLISHED',
    '2026-09-20 18:00:00',
    NULL
),
-- Article 6: Internacionales
(
    '00000000-0000-0000-0004-000000000006',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0001-000000000006',
    'Cumbre regional sobre cambio climático debate estrategias para la protección de cuencas fluviales',
    'Países latinoamericanos buscan mecanismos de financiamiento para conservación hídrica',
    'Encuentro multilateral en Santiago de Chile reúne a especialistas ambientales para evaluar el impacto de los ciclos de sequía en los sistemas de producción de alimentos.',
    'Santiago de Chile — Delegaciones de doce naciones de América Latina iniciaron este lunes las sesiones de trabajo para acordar metas comunes de reforestación en las cabeceras de los ríos más importantes del continente.\n\nEl documento preliminar subraya la urgencia de coordinar alertas tempranas frente a fenómenos climatológicos extremos que afectan las cosechas agrícolas y el abastecimiento de agua dulce.',
    'cumbre-regional-sobre-cambio-climatico-debate-estrategias-para-la-proteccion-de-cuencas-fluviales',
    'PUBLISHED',
    '2026-09-20 19:45:00',
    NULL
),
-- Article 7: DRAFT article (Must NEVER appear on public portal)
(
    '00000000-0000-0000-0004-000000000007',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0001-000000000001',
    'Borrador confidencial sobre proyectos de infraestructura no aprobados',
    'Texto interno en redacción',
    'Este contenido es un borrador y bajo ninguna circunstancia debe ser visible públicamente.',
    'Contenido clasificado en redacción...',
    'borrador-confidencial-sobre-proyectos-de-infraestructura-no-aprobados',
    'DRAFT',
    NULL,
    NULL
),
-- Article 8: SCHEDULED article (Must NEVER appear until published_at arrives)
(
    '00000000-0000-0000-0004-000000000008',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0001-000000000001',
    'Reportaje especial programado para el próximo mes',
    'Publicación futura protegida',
    'Noticia programada que no debe mostrarse a los lectores públicos antes de su fecha.',
    'Contenido programado para fecha futura...',
    'reportaje-especial-programado-para-el-proximo-mes',
    'SCHEDULED',
    '2028-01-01 08:00:00',
    NULL
)
ON DUPLICATE KEY UPDATE title = VALUES(title), subtitle = VALUES(subtitle), excerpt = VALUES(excerpt), content = VALUES(content), status = VALUES(status), published_at = VALUES(published_at), modified_at = VALUES(modified_at);

-- 4. Insert Article Tags
INSERT INTO article_tags (article_uuid, tag_uuid)
SELECT '00000000-0000-0000-0004-000000000001', tag_uuid FROM tags WHERE slug = 'guarico' LIMIT 1
ON DUPLICATE KEY UPDATE article_uuid = VALUES(article_uuid);

INSERT INTO article_tags (article_uuid, tag_uuid)
SELECT '00000000-0000-0000-0004-000000000001', tag_uuid FROM tags WHERE slug = 'produccion-agricola' LIMIT 1
ON DUPLICATE KEY UPDATE article_uuid = VALUES(article_uuid);

INSERT INTO article_tags (article_uuid, tag_uuid)
SELECT '00000000-0000-0000-0004-000000000002', tag_uuid FROM tags WHERE slug = 'san-juan-de-los-morros' LIMIT 1
ON DUPLICATE KEY UPDATE article_uuid = VALUES(article_uuid);

INSERT INTO article_tags (article_uuid, tag_uuid)
SELECT '00000000-0000-0000-0004-000000000002', tag_uuid FROM tags WHERE slug = 'seguridad' LIMIT 1
ON DUPLICATE KEY UPDATE article_uuid = VALUES(article_uuid);

INSERT INTO article_tags (article_uuid, tag_uuid)
SELECT '00000000-0000-0000-0004-000000000003', tag_uuid FROM tags WHERE slug = 'san-juan-de-los-morros' LIMIT 1
ON DUPLICATE KEY UPDATE article_uuid = VALUES(article_uuid);

INSERT INTO article_tags (article_uuid, tag_uuid)
SELECT '00000000-0000-0000-0004-000000000003', tag_uuid FROM tags WHERE slug = 'servicios-publicos' LIMIT 1
ON DUPLICATE KEY UPDATE article_uuid = VALUES(article_uuid);

INSERT INTO article_tags (article_uuid, tag_uuid)
SELECT '00000000-0000-0000-0004-000000000004', tag_uuid FROM tags WHERE slug = 'san-juan-de-los-morros' LIMIT 1
ON DUPLICATE KEY UPDATE article_uuid = VALUES(article_uuid);

INSERT INTO article_tags (article_uuid, tag_uuid)
SELECT '00000000-0000-0000-0004-000000000004', tag_uuid FROM tags WHERE slug = 'servicios-publicos' LIMIT 1
ON DUPLICATE KEY UPDATE article_uuid = VALUES(article_uuid);

INSERT INTO article_tags (article_uuid, tag_uuid)
SELECT '00000000-0000-0000-0004-000000000005', tag_uuid FROM tags WHERE slug = 'san-juan-de-los-morros' LIMIT 1
ON DUPLICATE KEY UPDATE article_uuid = VALUES(article_uuid);

INSERT INTO article_tags (article_uuid, tag_uuid)
SELECT '00000000-0000-0000-0004-000000000005', tag_uuid FROM tags WHERE slug = 'guarico' LIMIT 1
ON DUPLICATE KEY UPDATE article_uuid = VALUES(article_uuid);

-- 5. Insert Article SEO Metadata
INSERT INTO article_seo (article_uuid, meta_title, meta_description, canonical_url, og_title, og_description) VALUES
(
    '00000000-0000-0000-0004-000000000001',
    'Plan Integral de Reactivación Agrícola en Guárico | Contacto con la Noticia',
    'Acuerdan incorporar 120 mil hectáreas al ciclo productivo cerealero en los municipios centrales del estado Guárico.',
    'https://contactoconlanoticia.com/noticias/plan-integral-de-reactivacion-agricola-busca-elevar-la-siembra-de-cereales-en-el-estado-guarico',
    'Plan Integral de Reactivación Agrícola busca elevar la siembra de cereales en Guárico',
    'Asociaciones de productores de Guárico establecen acuerdos técnicos para potenciar el ciclo de cereales.'
),
(
    '00000000-0000-0000-0004-000000000002',
    'Operativo de seguridad en corredores viales de Roscio y Ortiz | Contacto con la Noticia',
    'Más de 200 funcionarios de seguridad ciudadana desplegados en las troncales principales de San Juan de los Morros y Ortiz.',
    'https://contactoconlanoticia.com/noticias/despliegan-operativo-de-seguridad-ciudadana-en-los-corredores-viales-de-roscio-y-ortiz',
    'Operativo de seguridad ciudadana en corredores viales de Roscio y Ortiz',
    'Cuerpos de orden público intensifican patrullaje nocturno y verificación vehicular en Guárico.'
)
ON DUPLICATE KEY UPDATE meta_title = VALUES(meta_title), meta_description = VALUES(meta_description);
