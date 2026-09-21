# LYBERATE — ESPECIFICACIÓN DE LA API REST

## 1. Convenciones Generales

- **Prefijo Oficial:** `/api/v1/`
- **Formato de Petición y Respuesta:** `application/json` (UTF-8).
- **Códigos de Estado HTTP:**
  - `200 OK`: Operación exitosa con datos de retorno.
  - `201 Created`: Recurso creado satisfactoriamente.
  - `204 No Content`: Operación exitosa sin cuerpo de retorno (ej. borrado).
  - `400 Bad Request`: Error en validación de entrada o formato JSON inválido.
  - `401 Unauthorized`: No autenticado o sesión expirada.
  - `403 Forbidden`: Autenticado pero sin permisos sobre el recurso/tenant.
  - `404 Not Found`: Recurso no encontrado.
  - `422 Unprocessable Entity`: Error en reglas de negocio específicas.
  - `429 Too Many Requests`: Límite de peticiones alcanzado (Rate limit).
  - `500 Internal Server Error`: Error inesperado en el servidor (sin trazas sensibles expuestas).

---

## 2. Formato Estándar de Respuestas

### Respuesta Exitosa:
```json
{
  "success": true,
  "data": {
    "key": "value"
  },
  "meta": {
    "timestamp": "2026-09-20T21:00:00Z"
  }
}
```

### Respuesta de Error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Los datos proporcionados no son válidos.",
    "details": [
      {
        "field": "title",
        "issue": "El campo título es requerido."
      }
    ]
  }
}
```

---

## 3. Catálogo de Endpoints y Estado Real

> [!IMPORTANT]
> Siguiendo la regla de oro de `MASTER.md`: **La documentación no demuestra que una funcionalidad exista.**
> En esta Fase 0, todos los endpoints se encuentran en estado `PLANNED` hasta su implementación y verificación en las fases correspondientes.

### Endpoints Base del Sistema
| Método | Endpoint | Fase | Estado | Descripción |
|---|---|---|---|---|
| `GET` | `/api/v1/health` | Fase 1 | `IMPLEMENTED` | Estado mínimo de salud de la plataforma (verificado en Fase 1). |

### Autenticación y Usuarios
| Método | Endpoint | Fase | Estado | Descripción |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Fase 4 | `IMPLEMENTED` | Inicio de sesión con credenciales seguras (Argon2id/Bcrypt) y emisión de cookie HttpOnly. |
| `POST` | `/api/v1/auth/logout` | Fase 4 | `IMPLEMENTED` | Cierre de sesión, revocación server-side en BD y expiración de cookie. |
| `GET` | `/api/v1/auth/me` | Fase 4 | `IMPLEMENTED` | Datos de perfil, contexto tenant/site y permisos RBAC del usuario activo. |
| `POST` | `/api/v1/auth/2fa/verify` | Fase 4 | `IMPLEMENTED` | Verificación de código TOTP RFC 6238 o código de recuperación de un solo uso. |
| `POST` | `/api/v1/auth/2fa/setup` | Fase 4 | `IMPLEMENTED` | Generación de secreto Base32 y 8 códigos de recuperación para usuario autenticado. |
| `POST` | `/api/v1/auth/2fa/enable` | Fase 4 | `IMPLEMENTED` | Confirmación y activación definitiva de 2FA. |
| `POST` | `/api/v1/auth/2fa/disable` | Fase 4 | `IMPLEMENTED` | Desactivación de 2FA previa verificación de contraseña. |
| `POST` | `/api/v1/auth/webauthn/challenge` | Fase 4 | `IMPLEMENTED` | Generación de challenge Base64URL criptográfico para Passkeys. |
| `POST` | `/api/v1/auth/webauthn/verify` | Fase 4 | `IMPLEMENTED` | Verificación de credencial pública WebAuthn. |

### Portal Público (Lectura)
| Método | Endpoint | Fase | Estado | Descripción |
|---|---|---|---|---|
| `GET` | `/api/v1/public/home` | Fase 6 | `IMPLEMENTED` | Portada editorial: noticia principal, secundarias, últimas noticias, tendencias y última hora. |
| `GET` | `/api/v1/public/articles` | Fase 6 | `IMPLEMENTED` | Listado paginado de noticias publicadas con filtros por categoría, autor o etiqueta. |
| `GET` | `/api/v1/public/articles/{slug}` | Fase 6 | `IMPLEMENTED` | Noticia completa por slug con autor, categoría, etiquetas, SEO y noticias relacionadas. |
| `GET` | `/api/v1/public/categories` | Fase 6 | `IMPLEMENTED` | Categorías editoriales activas con conteo de noticias publicadas. |
| `GET` | `/api/v1/public/categories/{slug}` | Fase 6 | `IMPLEMENTED` | Ficha de categoría con descripción y listado de noticias paginadas. |
| `GET` | `/api/v1/public/authors/{slug}` | Fase 6 | `IMPLEMENTED` | Ficha pública del periodista/autor con biografía y noticias publicadas paginadas. |
| `GET` | `/api/v1/public/search` | Fase 9 | `IMPLEMENTED` | Búsqueda FULLTEXT + LIKE multi-criterio (título, contenido, autor, categoría, tags, fechas, ordenamiento) con paginación optimizada. |
| `GET` | `/api/v1/public/search/filters` | Fase 9 | `IMPLEMENTED` | Opciones agregadas para filtros de búsqueda (categorías con recuento, autores, tags populares). |
| `GET` | `/api/v1/public/push/config` | Fase 10 | `IMPLEMENTED` | Configuración pública VAPID, estado del feature flag y tópicos disponibles para notificaciones. |
| `POST` | `/api/v1/public/push/subscribe` | Fase 10 | `IMPLEMENTED` | Registro o reactivación de suscripción Web Push con endpoint, claves criptográficas y tópicos. |
| `POST` | `/api/v1/public/push/unsubscribe` | Fase 10 | `IMPLEMENTED` | Cancelación y desactivación revocable de suscripción Web Push (`is_active = 0`). |
| `PUT` | `/api/v1/public/push/preferences` | Fase 10 | `IMPLEMENTED` | Actualización de preferencias y tópicos de notificación para un dispositivo. |
| `GET` | `/api/v1/public/ads` | Fase 11 | `IMPLEMENTED` | Entrega de anuncios activos validados por fecha, sitio y slot canónico (`HEADER_BANNER`, `TOP_NEWS`, `SIDEBAR`, `ARTICLE_TOP`, `ARTICLE_MIDDLE`, `ARTICLE_BOTTOM`, `FOOTER`). |
| `POST` | `/api/v1/public/ads/{uuid}/impression` | Fase 11 | `IMPLEMENTED` | Baliza de registro atómico de impresión publicitaria. |
| `GET` | `/api/v1/public/ads/{uuid}/click` | Fase 11 | `IMPLEMENTED` | Tracking de clic publicitario y redirección HTTP 302 a URL de destino validada. |
| `POST` | `/api/v1/public/submissions` | Fase 12 | `IMPLEMENTED` | Envío público de reporte ciudadano con validación MIME binaria, rate limit (5/hr por IP) y estado inicial estricto `PENDING_REVIEW`. |

### CMS Editorial (Gestión Interna)
| Método | Endpoint | Fase | Estado | Descripción |
|---|---|---|---|---|
| `GET` | `/api/v1/admin/categories` | Fase 5 | `IMPLEMENTED` | Listado de categorías editoriales del tenant/site activo. |
| `GET` | `/api/v1/admin/authors` | Fase 5 | `IMPLEMENTED` | Listado de autores editoriales del tenant/site activo. |
| `GET` | `/api/v1/admin/tags` | Fase 5 | `IMPLEMENTED` | Listado de etiquetas/tags activas. |
| `GET` | `/api/v1/admin/articles` | Fase 5 | `IMPLEMENTED` | Listado administrativo con filtros de estado, categoría y paginación. |
| `POST` | `/api/v1/admin/articles` | Fase 5 | `IMPLEMENTED` | Creación de nuevo artículo/borrador con SEO, tags y validación de autor. |
| `GET` | `/api/v1/admin/articles/{uuid}` | Fase 5 | `IMPLEMENTED` | Detalle completo de artículo para edición. |
| `PUT` | `/api/v1/admin/articles/{uuid}` | Fase 5 | `IMPLEMENTED` | Actualización de contenido, estados, SEO, publicación y scheduling. |
| `DELETE` | `/api/v1/admin/articles/{uuid}` | Fase 5 | `IMPLEMENTED` | Envío a papelera (soft trash) o eliminación permanente. |
| `POST` | `/api/v1/admin/media/upload` | Fase 7 | `IMPLEMENTED` | Subida, validación MIME binaria, guardado y generación de variantes adaptativas (WebP/AVIF: 320, 640, 960, 1440). |
| `GET` | `/api/v1/admin/media` | Fase 7 | `IMPLEMENTED` | Listado paginado de biblioteca de medios con metadatos y URLs. |
| `GET` | `/api/v1/admin/media/{uuid}` | Fase 7 | `IMPLEMENTED` | Detalle de imagen con sus variantes generadas, dimensiones y metadatos. |
| `PUT` | `/api/v1/admin/media/{uuid}` | Fase 7 | `IMPLEMENTED` | Actualización de metadatos editoriales (alt_text, caption, credit). |
| `DELETE` | `/api/v1/admin/media/{uuid}` | Fase 7 | `IMPLEMENTED` | Eliminación de imagen, borrado físico de archivos en disco y cascada en base de datos. |
| `GET` | `/api/v1/admin/ads` | Fase 11 | `IMPLEMENTED` | Listado administrativo de campañas con métricas de impresiones, clics y CTR (`ads.manage`). |
| `POST` | `/api/v1/admin/ads` | Fase 11 | `IMPLEMENTED` | Creación y validación de nueva campaña publicitaria (`ads.manage`). |
| `GET` | `/api/v1/admin/ads/{uuid}` | Fase 11 | `IMPLEMENTED` | Detalle administrativo de campaña con imagen vinculada y CTR (`ads.manage`). |
| `PUT` | `/api/v1/admin/ads/{uuid}` | Fase 11 | `IMPLEMENTED` | Edición de campaña, slot, fechas de vigencia o target URL (`ads.manage`). |
| `DELETE` | `/api/v1/admin/ads/{uuid}` | Fase 11 | `IMPLEMENTED` | Eliminación de campaña publicitaria (`ads.manage`). |
| `GET` | `/api/v1/admin/submissions` | Fase 12 | `IMPLEMENTED` | Bandeja de moderación de reportes comunitarios con filtros de estado (`PENDING_REVIEW`, `REJECTED`, `CONVERTED`) y búsqueda. |
| `GET` | `/api/v1/admin/submissions/{uuid}` | Fase 12 | `IMPLEMENTED` | Ficha detallada de reporte ciudadano con fotos adjuntas, datos de contacto del denunciante y estado de revisión. |
| `POST` | `/api/v1/admin/submissions/{uuid}/reject` | Fase 12 | `IMPLEMENTED` | Rechazo editorial fundamentado con motivo de descarte y registro de usuario revisor. |
| `POST` | `/api/v1/admin/submissions/{uuid}/convert` | Fase 12 | `IMPLEMENTED` | Conversión del reporte ciudadano a un artículo en estado `DRAFT` asignado exclusivamente a un único periodista con nota de procedencia. |

### SEO, Sitemaps, Feeds y Rastreadores
| Método | Endpoint | Fase | Estado | Descripción |
|---|---|---|---|---|
| `GET` | `/sitemap.xml` | Fase 8 | `IMPLEMENTED` | Mapa de sitio estándar XML (portada, secciones, autores y noticias publicadas con `<lastmod>`). |
| `GET` | `/sitemap-news.xml` | Fase 8 | `IMPLEMENTED` | Sitemap de Google News (`xmlns:news`) para noticias publicadas en las últimas 48 horas. |
| `GET` | `/feed.xml`, `/rss.xml`, `/feed` | Fase 8 | `IMPLEMENTED` | Feed de sindicación RSS 2.0 / Atom con fechas RFC 2822 y guid permalink. |
| `GET` | `/robots.txt` | Fase 8 | `IMPLEMENTED` | Directivas de rastreo para bots y buscadores, bloqueo de backoffice y enlaces canónicos a sitemaps. |
| `GET` | `/api/v1/public/seo/article/{slug}` | Fase 8 | `IMPLEMENTED` | Metadatos completos SEO, Open Graph, Twitter Cards y Schema.org `NewsArticle` en JSON-LD. |

### Integración CRM (EspoCRM)
| Método | Endpoint | Fase | Estado | Descripción |
|---|---|---|---|---|
| `POST` | `/api/v1/integrations/espocrm/webhook` | Fase 16 | `PLANNED` | Recepción de eventos con firma HMAC. |
| `GET` | `/api/v1/integrations/espocrm/heartbeat` | Fase 16 | `PLANNED` | Verificación de estado de integración. |

