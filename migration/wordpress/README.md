# Migración WordPress → Portal Editorial

## Descripción

Esta carpeta contiene las herramientas para migrar el contenido del WordPress actual ("Contacto con la Noticia") al nuevo CMS editorial.

> ⚠️ **Esta carpeta NO es parte del sistema en producción.** Solo se usa durante el proceso de migración.

---

## Estructura

```
wordpress/
├── README.md          ← Este archivo
├── source/            ← Archivos WXR/XML exportados de WordPress (no subir al repositorio)
├── raw/               ← JSON sin procesar extraído de WP REST API (no subir)
├── transformed/       ← JSON transformado, listo para importar (no subir)
├── imports/
│   ├── download_media.php      ← Descarga imágenes de WordPress
│   ├── import_categories.php   ← Importa categorías
│   ├── import_tags.php         ← Importa etiquetas
│   ├── import_users.php        ← Importa autores
│   ├── import_media.php        ← Importa y procesa imágenes
│   └── import_posts.php        ← Importa noticias
├── scripts/
│   ├── fetch_from_api.php      ← Extrae datos de WP REST API
│   ├── parse_wxr.php           ← Parsea archivo WXR/XML
│   ├── transform_posts.php     ← Transforma posts al nuevo schema
│   ├── transform_media.php     ← Transforma medios
│   ├── generate_redirects.php  ← Genera tabla de redirecciones 301
│   └── verify_migration.php    ← Verifica el resultado de la migración
└── logs/              ← Logs de ejecución (no subir)
```

---

## Métodos de extracción disponibles

### Opción A: WP REST API (recomendada)

Requiere acceso a la URL del WordPress actual.

```bash
php scripts/fetch_from_api.php \
  --url="https://contactoconlanoticia.com" \
  --output="raw/" \
  --per-page=100
```

Si la API está protegida, generar un Application Password en WordPress:
`Usuarios → Tu Perfil → Application Passwords`

```bash
php scripts/fetch_from_api.php \
  --url="https://contactoconlanoticia.com" \
  --user="admin" \
  --app-password="xxxx xxxx xxxx xxxx" \
  --output="raw/"
```

### Opción B: WXR / XML Export

1. En WordPress: `Herramientas → Exportar → Todo el contenido`
2. Guardar el archivo `.xml` en `source/wordpress-export.xml`
3. Ejecutar:

```bash
php scripts/parse_wxr.php \
  --input="source/wordpress-export.xml" \
  --output="raw/"
```

---

## Proceso completo de migración

### Paso 1: Extracción
```bash
# Usar API (recomendado)
php scripts/fetch_from_api.php --url="https://..." --output="raw/"

# O usar WXR
php scripts/parse_wxr.php --input="source/export.xml" --output="raw/"
```

### Paso 2: Transformación
```bash
php scripts/transform_posts.php --input="raw/" --output="transformed/"
php scripts/transform_media.php --input="raw/" --output="transformed/"
```

### Paso 3: Importación (en orden)
```bash
php imports/import_categories.php --input="transformed/categories.json" --site-id=1
php imports/import_tags.php --input="transformed/tags.json" --site-id=1
php imports/import_users.php --input="transformed/users.json" --site-id=1
php imports/download_media.php --input="transformed/media.json" --output="imports/downloaded/"
php imports/import_media.php --input="transformed/media.json" --site-id=1
php imports/import_posts.php --input="transformed/posts.json" --site-id=1
```

### Paso 4: Redirecciones
```bash
php scripts/generate_redirects.php \
  --input="transformed/posts.json" \
  --wp-base-url="https://contactoconlanoticia.com" \
  --new-base-url="https://nuevo.contactoconlanoticia.com" \
  --site-id=1
```

### Paso 5: Verificación
```bash
php scripts/verify_migration.php --site-id=1
```

---

## Modo --dry-run

Todos los scripts de importación soportan `--dry-run`:

```bash
php imports/import_posts.php --input="transformed/posts.json" --site-id=1 --dry-run
```

En modo dry-run, el script valida y reporta pero **no modifica la base de datos**.

---

## Modo --mode

Para ejecuciones repetidas:

```bash
# skip: omitir registros que ya existen (default)
php imports/import_posts.php --mode=skip

# upsert: actualizar registros existentes
php imports/import_posts.php --mode=upsert
```

La detección de duplicados se basa en `legacy_source + legacy_id`.

---

## Logs

Cada ejecución genera un log en `logs/`:

```
logs/
├── migration_2025-01-15_14-30-00/
│   ├── categories.log
│   ├── media.log
│   ├── posts.log
│   └── summary.json
```

El `summary.json` contiene:
```json
{
  "started_at": "2025-01-15T14:30:00Z",
  "finished_at": "2025-01-15T15:45:00Z",
  "totals": {
    "categories": { "migrated": 12, "skipped": 0, "failed": 0 },
    "media": { "migrated": 2847, "skipped": 0, "failed": 23 },
    "posts": { "migrated": 1834, "skipped": 0, "failed": 5 }
  },
  "failed_items": [...]
}
```

---

## Notas importantes

- Las imágenes se descargan del servidor WordPress durante la migración.
- Cada imagen pasa por el mismo pipeline de procesamiento (WebP, thumbnails, etc.).
- Los `legacy_id` se preservan en la tabla `posts.legacy_id`.
- Las URLs antiguas generan redirecciones 301 automáticas.
- Los autores de WordPress se crean como usuarios `author` en el nuevo sistema.
- El proceso es **idempotente**: se puede ejecutar varias veces sin duplicar contenido.

---

## Requisitos

- PHP 8.3+
- Extensión GD con WebP
- Extensión PDO/MySQL
- Acceso a la BD del nuevo sistema
- Acceso a la URL del WordPress actual (Opción A) o archivo WXR (Opción B)
- `STORAGE_DRIVER=local` durante la migración (o configurar R2)

Configurar las credenciales en un archivo `.env` local dentro de esta carpeta.

