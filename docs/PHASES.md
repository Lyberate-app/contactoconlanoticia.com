# LYBERATE — ROADMAP DE FASES OFICIAL

> Fuente de Verdad del progreso: cada funcionalidad debe categorizarse estrictamente según su estado real:
> `PLANNED` | `DOCUMENTED` | `PARTIALLY IMPLEMENTED` | `IMPLEMENTED` | `VERIFIED`

---

## Resumen de Estado de Fases

| Fase | Nombre | Estado | Descripción Breve |
|---|---|---|---|
| **0** | **Foundation, Architecture & Environment** | `IMPLEMENTED` | Verificación de entorno, fuente de verdad, reglas, gitignore, env, docs base. |
| **1** | **Project Scaffold** | `IMPLEMENTED` | Estructura frontend (React 19, TS, Vite, Tailwind) y backend (PHP 8.x, routing, health). |
| **2** | **Database Foundation** | `PLANNED` | Conexión PDO, migraciones MySQL, UUIDs, Tenants, Sites, Users, Articles, RBAC schema. |
| **3** | **API Foundation** | `PLANNED` | Base REST (`/api/v1/`), enrutador, controladores, middleware, manejo de JSON/errores. |
| **4** | **Authentication & RBAC** | `PLANNED` | Login, sesiones HttpOnly, password_hash, TOTP 2FA, Passkeys/WebAuthn, aislamiento tenant. |
| **5** | **CMS Editorial** | `PLANNED` | Dashboard, gestión de artículos, estados (DRAFT, PUBLISHED, etc.), autores, categorías. |
| **6** | **Public News Portal** | `PLANNED` | Portada periodística, páginas de artículo, categorías, autores, búsqueda SQL, responsive. |
| **7** | **Media Engine** | `PLANNED` | Uploads validados, variantes optimizadas (320, 640, 960, 1440), WebP/AVIF, srcset. |
| **8** | **SEO + News Discoverability** | `PLANNED` | NewsArticle JSON-LD, Open Graph, sitemap.xml, sitemap-news.xml, robots.txt, RSS/Atom. |
| **9** | **Advertising + Public Forms** | `PLANNED` | Campañas y slots publicitarios, formulario público "Envíanos tu noticia" con moderación. |
| **10** | **Performance** | `PLANNED` | Code splitting, compresión, lazy loading, índices SQL, optimización Core Web Vitals. |
| **11** | **PWA + Notifications** | `PLANNED` | Web App Manifest, Service Worker para app shell y offline fallback, Web Push con permiso. |
| **12** | **Migration Engine** | `PLANNED` | Motor de migración histórica reusable: discovery, dry-run, idempotencia, redirects 301. |
| **13** | **Historical Migration** | `PLANNED` | Extracción, transformación y migración real de Contacto con la Noticia, validación y delta. |
| **14** | **Security Audit** | `PLANNED` | Auditoría exhaustiva de seguridad (CORS, CSRF, SQLi, XSS, rate limiting, logs seguros). |
| **15** | **Production** | `PLANNED` | Build final frontend servido por Apache/Nginx, API PHP 8.x, HTTPS, backups y checklist. |
| **16** | **CRM Integration** | `PLANNED` | Integración con EspoCRM: mappings UUID/ID, webhooks con HMAC, heartbeat y sync de leads. |

---

## Reglas de Ejecución por Fase

1. **Una sola fase por iteración:** No comenzar la siguiente fase sin validación explícita y aprobación.
2. **Sin sobreingeniería:** No crear dependencias ni código especulativo para fases futuras.
3. **Verificación mandatoria:** Nada se marca como `IMPLEMENTED` o `VERIFIED` sin pruebas tangibles en código.

