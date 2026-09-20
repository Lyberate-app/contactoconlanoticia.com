# Lyberate — Migration Engine

> **Estado:** `PLANNED` (Asignado a Fase 12 y Fase 13)

Este directorio contendrá el motor desacoplado de migración histórica de Contacto con la Noticia.

## Principios Oficiales:
1. **Discovery First:** No asumir tecnologías del sitio antiguo sin inspección previa.
2. **Idempotencia:** Trazabilidad estricta `source_id → article_uuid`.
3. **Redirecciones 301:** Preservación de slugs históricos.
4. **Pipeline de Multimedia:** Deduplicación, almacenamiento de originales y generación de variantes optimizadas.
5. **Separación:** Este código permanece aislado del runtime de producción del CMS.

