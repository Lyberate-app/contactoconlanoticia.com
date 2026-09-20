# LYBERATE — ESPECIFICACIÓN DEL MOTOR DE MIGRACIÓN HISTÓRICA

## 1. Misión del Motor de Migración

Contacto con la Noticia cuenta con un archivo histórico de publicaciones que debe ser migrado de forma nativa a Lyberate. No se creará una sección segregada de "Noticias antiguas"; todo el contenido histórico pasará a formar parte del archivo nativo de la nueva plataforma.

---

## 2. Regla Fundamental de Descubrimiento

> [!CAUTION]
> **Antes de escribir cualquier script de extracción, es obligatorio inspeccionar el sitio anterior.**
>
> Queda terminantemente prohibido asumir que el sitio anterior utiliza WordPress, Drupal, Joomla o una base de datos específica sin una fase previa de descubrimiento e inspección técnica.

---

## 3. Estructura Prevista (`tools/migration/`)

El motor de migración vive completamente separado del backend de producción:

```text
tools/migration/
├── README.md             # Instrucciones de ejecución
├── config/               # Conexiones y mapeos de campos
├── extract/              # Scripts de extracción de origen
├── transform/            # Normalización y sanitización de contenido
├── load/                 # Inserción idempotente en Lyberate
├── media/                # Pipeline de descarga y optimización de imágenes
├── redirects/            # Generador de mapeos 301 (URLs antiguas a nuevas)
├── reports/              # Reportes de auditoría generados
└── scripts/              # Comandos de CLI de migración
```

---

## 4. Idempotencia y Trazabilidad de Identidad

- Cada registro migrado mantendrá su identificador de origen vinculado a su nuevo identificador en Lyberate:
  ```text
  source_id  ───►  article_uuid
  ```
- **Prohibido:** Identificar artículos únicamente por el título (provoca colisiones con actualizaciones o titulares duplicados).
- Una ejecución repetida de la migración debe ser **idempotente** (actualizar o ignorar registros ya existentes sin duplicar filas en la base de datos).

---

## 5. Slugs y Redirecciones 301

- Los slugs históricos deben conservarse siempre que sea posible.
- Cuando una URL deba cambiar por normalización o conflicto, se registrará un mapeo:
  ```text
  old_url  ──►  new_url (HTTP 301 Permanent Redirect)
  ```
- No deben generarse cadenas de redirección múltiple.

---

## 6. Pipeline de Multimedia

```text
1. Identificar imagen en contenido de origen
   ↓
2. Descargar a entorno local de migración
   ↓
3. Validar integridad de archivo y tipo MIME real
   ↓
4. Deduplicar mediante hash criptográfico (evitar duplicados idénticos)
   ↓
5. Almacenar el archivo original en el repositorio de media
   ↓
6. Generar variantes optimizadas (WebP / AVIF en tamaños 320, 640, 960, 1440)
   ↓
7. Reemplazar enlaces en el cuerpo del artículo HTML
   ↓
8. Validar renderizado final
```

---

## 7. Modos de Ejecución Segura

- **Simulación (`--dry-run`):**
  - No altera la base de datos ni los archivos finales.
  - Genera reportes de previsualización identificando errores, advertencias, medios ausentes y slugs conflictivos.
- **Ejecución Real (`--execute`):**
  - Requiere confirmación explícita del operador y respaldo previo verificado.

---

## 8. Estrategia de Migración Incremental (Delta)

Dado que el sitio antiguo continuará publicando durante el desarrollo:

```text
Descubrimiento inicial
         ↓
Extracción y migración de prueba (Lote histórico inicial)
         ↓
Desarrollo y ajustes de la plataforma
         ↓
Migración Delta (Únicamente artículos creados/modificados tras la fecha del primer lote)
         ↓
Validación final y Go-Live
```

