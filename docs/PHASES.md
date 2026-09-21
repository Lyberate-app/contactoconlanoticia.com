# LYBERATE — ROADMAP DE FASES OFICIAL

> Fuente de Verdad del progreso: cada funcionalidad debe categorizarse estrictamente según su estado real:
> `PLANNED` | `DOCUMENTED` | `PARTIALLY IMPLEMENTED` | `IMPLEMENTED` | `VERIFIED`

---

## Resumen de Estado de Fases

| Fase | Nombre | Estado | Descripción Breve |
|---|---|---|---|
| **0** | **Foundation, Architecture & Environment** | `IMPLEMENTED` | Verificación de entorno, fuente de verdad, reglas, gitignore, env, docs base. |
| **1** | **Project Scaffold** | `IMPLEMENTED` | Estructura frontend (React 19, TS, Vite, Tailwind) y backend (PHP 8.x, routing, health). |
| **2** | **Database Foundation** | `IMPLEMENTED` | Esquema relacional MySQL, 14 migraciones DDL, aislamiento multi-tenant compuesto y seeds oficiales. |
| **3** | **API Foundation** | `IMPLEMENTED` | Base REST (`/api/v1/`), bootstrap, request/response, router con parámetros, middleware pipeline, validación, helpers, JSON/errores uniformes. |
| **4** | **Authentication & RBAC** | `IMPLEMENTED` | Login/logout, sesiones server-side (HttpOnly), hash Argon2id/Bcrypt, RBAC, TOTP 2FA, recovery codes, WebAuthn prep, rate limiting, audit logs. |
| **5** | **CMS Editorial** | `IMPLEMENTED` | Dashboard, gestión de artículos, estados (DRAFT, PUBLISHED, etc.), autores, categorías, tags, SEO, scheduling, RBAC editorial. |
| **6** | **Public News Portal** | `IMPLEMENTED` | Portada periodística (masthead, última hora, noticia principal, secundarias, tendencias, ads), páginas de artículo con autor/relacionadas/compartir, categorías, autores, búsqueda SQL, lazy routes y responsive. |
| **7** | **Media Engine** | `IMPLEMENTED` | Uploads validados, variantes optimizadas (320, 640, 960, 1440), WebP/AVIF, srcset. |
| **8** | **SEO + News Discoverability** | `IMPLEMENTED` | NewsArticle JSON-LD, Open Graph, sitemap.xml, sitemap-news.xml, robots.txt, RSS/Atom. |
| **9** | **Search + Discovery** | `IMPLEMENTED` | Búsqueda multi-criterio MySQL (FULLTEXT, LIKE, anti-N+1, filtros por autor/categoría/tag/fecha, paginación, sanitización) y buscador UI responsive. |
| **10** | **PWA + Web Push** | `IMPLEMENTED` | Web App Manifest, Service Worker con caching seguro, offline fallback, Web Push opt-in con tópicos y feature flag por sitio. |
| **11** | **Advertising + Commercial System** | `IMPLEMENTED` | Sistema publicitario con 7 slots canónicos, campañas por sitio/fechas, tracking atómico (impresiones, clics, CTR), RBAC `ads.manage` y backoffice editorial. |
| **12** | **User Submitted News (Reportes Ciudadanos)** | `IMPLEMENTED` | Buzón ciudadano (`/enviar-noticia`), validación estricta MIME/tamaño, rate limit (5/hr/IP), regla crítica de no autopublicación (`PENDING_REVIEW`), flujo de moderación editorial (rechazo con motivo o conversión a borrador editorial asignado a un solo periodista). |
| **13** | **Performance & Core Web Vitals** | `PLANNED` | Code splitting, compresión, lazy loading, índices SQL, optimización Core Web Vitals. |
| **14** | **Historical Migration Engine** | `PLANNED` | Motor de migración histórica reusable: discovery, dry-run, idempotencia, redirects 301. |
| **15** | **Historical Migration Execution** | `PLANNED` | Extracción, transformación y migración real de Contacto con la Noticia, validación y delta. |
| **16** | **Security Audit** | `PLANNED` | Auditoría exhaustiva de seguridad (CORS, CSRF, SQLi, XSS, rate limiting, logs seguros). |
| **17** | **Production Readiness** | `PLANNED` | Build final frontend servido por Apache/Nginx, API PHP 8.x, HTTPS, backups y checklist. |
| **18** | **CRM Integration** | `PLANNED` | Integración con EspoCRM: mappings UUID/ID, webhooks con HMAC, heartbeat y sync de leads. |

---

## Reglas de Ejecución por Fase

1. **Una sola fase por iteración:** No comenzar la siguiente fase sin validación explícita y aprobación.
2. **Sin sobreingeniería:** No crear dependencias ni código especulativo para fases futuras.
3. **Verificación mandatoria:** Nada se marca como `IMPLEMENTED` o `VERIFIED` sin pruebas tangibles en código.

