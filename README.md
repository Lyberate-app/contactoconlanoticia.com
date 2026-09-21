# Lyberate — Plataforma Editorial & CMS Multi-Tenant

> **Portal Insignia:** [Contacto con la Noticia](https://contactoconlanoticia.com)  
> **Versión Actual:** 0.12.0 (Fases 0 a 12 Completadas y Verificadas)  
> **Arquitectura:** PHP 8.x Nativo + PDO + MySQL 8.0 (Backend Core API) & React 19 + TypeScript + Vite + Tailwind CSS (Frontend Público y Editorial)

---

## 📌 ¿Qué es Lyberate?

**Lyberate** es un ecosistema CMS y motor de publicación periodística digital multi-tenant y multi-sitio de alto rendimiento, diseñado con una premisa innegociable: **simplicidad, seguridad de grado bancario y control total sin dependencias de frameworks monolíticos pesados (anti-Laravel / anti-Symfony / anti-Node en backend)**.

El sistema desacopla por completo la API de servicios del renderizado del cliente, permitiendo que cualquier servidor web estándar (Apache o Nginx) con PHP 8.x y MySQL 8.0 aloje la plataforma de forma ligera y ultra-rápida, mientras que el frontend compila a activos estáticos optimizados.

```text
Lyberate Engine (Plataforma Core)
│
├── Tenant (Organización / Cliente)
│   └── Site (Portal Digital: Ej. Contacto con la Noticia)
│       ├── Usuarios & Roles RBAC (Argon2id, 2FA TOTP, Passkeys)
│       ├── Sala de Redacción (Artículos, Estados, Categorías, Tags, SEO)
│       ├── Motor Multimedia (Variantes WebP/AVIF: 320, 640, 960, 1440)
│       ├── Publicidad & Campañas (7 slots canónicos, tracking atómico, CTR)
│       ├── PWA & Web Push (Offline Shell, Tópicos, Opt-in revocable)
│       ├── Buzón Ciudadano (Reportes Comunitarios, Moderación, Anti-Spam)
│       └── Motor de Búsqueda & Descubrimiento (FULLTEXT, Multi-criterio)
│
└── Futuros Tenants / Sitios Adicionales (Aislamiento Compuesto en BD)
```

---

## 🚀 Estado del Proyecto: Fases Implementadas y Verificadas (0 a 12)

El desarrollo se rige por una disciplina estricta de fases independientes y verificadas mediante pruebas automatizadas de extremo a extremo.

| Fase | Denominación | Estado | Aspectos Clave Implementados |
|:---:|---|:---:|---|
| **0** | **Foundation, Architecture & Environment** | `VERIFIED` | Documentación maestra (`MASTER.md`), matriz de seguridad, arquitectura desacoplada y entorno reproducible. |
| **1** | **Project Scaffold** | `VERIFIED` | Estructura modular, tooling frontend (Vite + React + TS), pipeline backend PHP y endpoint `/api/v1/health`. |
| **2** | **Database Foundation** | `VERIFIED` | 14 migraciones DDL iniciales en MySQL 8.0, aislamiento compuesto por `tenant_uuid` y `site_uuid`, integridad referencial estricta y seeds oficiales. |
| **3** | **Backend Core + API Foundation** | `VERIFIED` | Router HTTP con parámetros dinámicos, pipeline de middlewares (CORS, JSON Parser, Request Context), validación de esquemas, respuestas JSON uniformes y códigos HTTP canónicos. |
| **4** | **Authentication + Authorization (RBAC)** | `VERIFIED` | Sesiones server-side en base de datos, contraseñas hash con Argon2id/Bcrypt, cookies `HttpOnly`, 2FA TOTP (RFC 6238), 8 códigos de recuperación de un solo uso, preparación WebAuthn Passkeys, rate limiting y registro de auditoría. |
| **5** | **CMS / Editorial Backend** | `VERIFIED` | Ciclo de vida editorial (`DRAFT`, `PENDING_REVIEW`, `SCHEDULED`, `PUBLISHED`, `ARCHIVED`, `TRASH`), autores, taxonomías (6 categorías canónicas + tags), metadatos SEO por artículo, programación futura y control RBAC. |
| **6** | **Public News Portal** | `VERIFIED` | Portal público con estética de periódico tradicional profesional (anti-SaaS), masthead periodístico, última hora, noticia principal, secundarias, tendencias, páginas seccionales, fichas de autor, compartición social y optimización contra consultas N+1. |
| **7** | **Media + Image Optimization** | `VERIFIED` | Subida segura con inspección MIME binaria vía `finfo`, nombres de archivo hash no ejecutables, generación adaptativa de variantes (320, 640, 960, 1440) en formatos WebP y AVIF, eliminación física en disco y `srcset` responsivo para evitar Layout Shifts (CLS). |
| **8** | **SEO + Google News Readiness** | `VERIFIED` | Marcado Schema.org `NewsArticle` en JSON-LD, Open Graph, Twitter Cards, URLs canónicas limpias, `sitemap.xml` estándar, `sitemap-news.xml` para artículos menores a 48h, feeds RSS 2.0 / Atom y `robots.txt` estricto. |
| **9** | **Search + Discovery Engine** | `VERIFIED` | Buscador multi-criterio en MySQL (título, antetítulo, contenido, autor, categoría, tags, fechas y ordenación), sanitización contra inyecciones SQL, paginación veloz y UI reactiva de búsqueda con filtros agregados. |
| **10** | **PWA + Web Push** | `VERIFIED` | Web App Manifest, Service Worker con estrategia Cache-First/Network-First, página shell offline (`offline.html`), Web Push opt-in con suscripción a tópicos configurables y feature flag independiente por sitio. |
| **11** | **Advertising / Commercial System** | `VERIFIED` | Gestión de pautas y anunciantes en 7 slots canónicos (`HEADER_BANNER`, `TOP_NEWS`, `SIDEBAR`, `ARTICLE_TOP`, `ARTICLE_MIDDLE`, `ARTICLE_BOTTOM`, `FOOTER`), fechas de vigencia, tracking atómico de impresiones y clics, cálculo exacto de CTR, permiso RBAC `ads.manage` y panel administrativo. |
| **12** | **User Submitted News (Buzón Ciudadano)** | `VERIFIED` | Formulario público `/enviar-noticia` con validación estricta y rate limit (5/hr/IP). **Regla crítica: NUNCA se publica automáticamente** (estado `PENDING_REVIEW`). Mesa de moderación en CMS con opciones de rechazo fundamentado o conversión a borrador (`DRAFT`) asignado exclusivamente a **un solo periodista** con atribución comunitaria. |

---

## 🎯 ¿Hacia dónde va el proyecto? (Próximos Pasos)

Con el núcleo funcional, portal público, CMS editorial, motor de medios, SEO y buzón ciudadano completamente consolidados, las fases subsecuentes abarcan:

1. **Fase 13 — Performance & Core Web Vitals:** Auditoría de LCP, INP y CLS, compresión Brotli/Gzip, optimización de caché HTTP y afinación de tiempos de carga en dispositivos móviles modestos.
2. **Fase 14 & 15 — Motor de Migración Histórica y Ejecución:** Scripting idempotente para extraer, transformar y cargar el histórico periodístico de *Contacto con la Noticia* preservando slugs, autores, fechas originales, galerías de imágenes y configuración de redirecciones 301.
3. **Fase 16 — Auditoría Integral de Seguridad:** Pruebas de penetración, validación de CSP (Content Security Policy), blindaje CORS, auditoría de permisos cruzados y análisis de vulnerabilidades OWASP.
4. **Fase 17 — Preparación para Producción:** Configuración de servidores Nginx/Apache con PHP-FPM, certificados SSL automáticos, rotación de logs, respaldos programados de base de datos y checklist de despliegue.
5. **Fase 18 — Integración CRM (EspoCRM):** Sincronización bidireccional mediante webhooks protegidos con firma HMAC, heartbeat de conectividad y mapeo de contactos/anunciantes hacia EspoCRM.

---

## 🛠️ Stack Tecnológico

### Backend Core
* **Lenguaje:** PHP 8.2+ nativo (sin frameworks externos como Laravel o Symfony).
* **Persistencia:** PDO con MySQL 8.0 en modo transaccional (`InnoDB`).
* **Seguridad:** Hash Argon2id / Bcrypt, sesiones server-side en MySQL, cookies `HttpOnly; SameSite=Lax`, tokens aleatorios criptográficamente seguros (`random_bytes`).
* **Imágenes:** Extensión PHP `GD` / `Imagick` con soporte para WebP y AVIF.
* **Arquitectura de Software:** Pipeline de Middleware desacoplado, Controladores REST, Capa de Servicios con lógica de dominio pura y Validación declarativa.

### Frontend
* **Entorno:** React 19 + TypeScript + Vite.
* **Estilos:** Tailwind CSS con tipografía serif periodística tradicional (`Merriweather`, `Lora` / `Georgia`) y escala editorial en grises cálidos (`stone`).
* **Iconografía:** Lucide React.
* **Enrutamiento:** React Router v7 con carga perezosa de rutas (`React.lazy` + `Suspense`).
* **Capacidades Web:** Progressive Web App (PWA) con Service Worker y Push API estándar.

---

## 📁 Estructura del Repositorio

```text
PortalNoticia/
├── backend/                  # Núcleo Backend en PHP 8.x nativo
│   ├── app/
│   │   ├── Controllers/      # Controladores REST (Auth, Articles, Media, Ads, Submissions, etc.)
│   │   ├── Core/             # Request, Response, Router, Env, ExceptionHandler
│   │   ├── Database/         # Conexión Singleton PDO segura
│   │   ├── Helpers/          # Sanitizer, Uuid, Helpers criptográficos
│   │   ├── Middleware/       # Pipeline (Cors, Auth, JsonBody, RequestContext, RBAC)
│   │   ├── Security/         # AuthenticatedUser, RBAC definitions
│   │   ├── Services/         # Lógica de Negocio (ArticleService, MediaService, SubmissionService, etc.)
│   │   └── Validation/       # Validador declarativo de payloads
│   ├── config/               # Configuración de base de datos y plataforma
│   ├── public/               # Punto de entrada HTTP (index.php, robots.txt, sitemaps, sw.js)
│   ├── routes/               # Declaración centralizada de endpoints (api.php)
│   └── tests/                # 11 suites de pruebas automatizadas PHP (Fases 3 a 12)
│
├── frontend/                 # Aplicación Web React 19 + TypeScript
│   ├── public/               # Manifiesto PWA, iconos, offline shell
│   ├── src/
│   │   ├── components/       # Componentes visuales reutilizables (AdSlot, Navbar, etc.)
│   │   ├── layouts/          # Layouts diferenciados (PublicLayout y EditorialLayout)
│   │   ├── pages/            # Vistas públicas y panel administrativo (CMS, Ads, Submissions)
│   │   ├── router/           # Enrutamiento React Router con Code Splitting
│   │   └── services/         # Clientes de API tipados (auth, public, editorial, ads, submissions)
│   ├── package.json
│   └── vite.config.ts
│
├── database/                 # Persistencia e Infraestructura Relacional
│   ├── migrations/           # 20 migraciones DDL ordenadas cronológicamente
│   ├── seeds/                # Semillas oficiales (Roles, Permisos, Tenant Contacto con la Noticia)
│   ├── migrate.php           # Ejecutor automático de migraciones DDL
│   └── seed.php              # Sembrador oficial de base de datos
│
├── docs/                     # Documentación Viva de Arquitectura y Normativa
│   ├── ARCHITECTURE.md       # Diseño técnico de alto nivel
│   ├── SECURITY.md           # Estándares criptográficos y controles de acceso
│   ├── API.md                # Catálogo completo de endpoints REST
│   ├── PHASES.md             # Matriz y estado oficial de las fases del proyecto
│   └── DEVELOPMENT.md        # Guía de estándares de codificación
│
├── tools/                    # Scripts utilitarios (generación de iconos PWA, herramientas de prueba)
├── docker-compose.yml        # Orquestación de contenedores (db, test runners)
├── Dockerfile.test           # Imagen Docker para ejecución determinista de tests PHP
├── MASTER.md                 # Documento Rector del Sistema Lyberate
└── README.md                 # Ficha Técnica Central del Proyecto
```

---

## 🚦 Puesta en Marcha en Entorno de Desarrollo

### 1. Clonar el repositorio
```bash
git clone https://github.com/Lyberate-app/contactoconlanoticia.com.git
cd contactoconlanoticia.com
```

### 2. Configurar Variables de Entorno
Copia el archivo de ejemplo para configurar la conexión a la base de datos y credenciales maestras:
```bash
cp .env.example .env
```

### 3. Levantar Base de Datos (Docker)
```bash
docker-compose up -d db
```

### 4. Ejecutar Migraciones y Semillas
```bash
# Ejecutar migraciones DDL (001 a 020)
docker exec -it lyberate_db mysql -u lyberate_user -plyberate_password lyberate_db < database/migrations/001_create_tenants_table.sql
# ...o mediante el runner de PHP:
php database/migrate.php
php database/seed.php
```

### 5. Iniciar y Probar el Frontend
```bash
cd frontend
npm install
npm run dev
```

El portal público estará disponible en `http://localhost:5173/` y la mesa de redacción editorial en `http://localhost:5173/admin/articles`.

---

## 🧪 Verificación & Suites de Pruebas Automatizadas

La integridad de toda la plataforma está garantizada por una suite de **446 pruebas automatizadas** ejecutadas de manera reproducible en Docker contra una base de datos MySQL real:

```bash
docker run --rm --network portalnoticia_default \
  -e DB_HOST=db -e DB_USERNAME=lyberate_user -e DB_PASSWORD=lyberate_password -e DB_DATABASE=lyberate_db \
  -v "${PWD}:/app" -w /app lyberate-php-test \
  sh -c "php backend/tests/HttpPipelineTest.php && \
         php backend/tests/Phase3Test.php && \
         php backend/tests/Phase4AuthTest.php && \
         php backend/tests/Phase5EditorialTest.php && \
         php backend/tests/Phase6PublicPortalTest.php && \
         php backend/tests/Phase7MediaTest.php && \
         php backend/tests/Phase8SeoTest.php && \
         php backend/tests/Phase9SearchTest.php && \
         php backend/tests/Phase10PwaPushTest.php && \
         php backend/tests/Phase11AdsTest.php && \
         php backend/tests/Phase12SubmissionsTest.php"
```

### Resultado de Verificación:
```text
================================================
TOTAL GENERAL: 446 PASADOS, 0 FALLIDOS (100% OK)
================================================
✓ HttpPipelineTest:       11 passed
✓ Phase3Test (Core API):  48 passed
✓ Phase4AuthTest:         46 passed
✓ Phase5EditorialTest:    44 passed
✓ Phase6PublicPortalTest: 47 passed
✓ Phase7MediaTest:        34 passed
✓ Phase8SeoTest:          75 passed
✓ Phase9SearchTest:       49 passed
✓ Phase10PwaPushTest:     67 passed
✓ Phase11AdsTest:         39 passed
✓ Phase12SubmissionsTest: 36 passed
```

### Verificación de Compilación Frontend:
```bash
docker run --rm -v "${PWD}/frontend:/app" -w /app node:20-alpine sh -c "npm run build"
```
*Salida:* `✓ built in ~29s` sin errores de tipado en TypeScript.

---

## 🔒 Estándares de Seguridad Cumplidos
* **Zero Trust en Frontend:** Toda validación de entrada, permisos RBAC, subida de archivos y estados de publicación es evaluada y resuelta en el Backend PHP.
* **Autenticación sin LocalStorage:** Las credenciales y sesiones se transmiten exclusivamente mediante cookies seguras `HttpOnly`, con expiración server-side.
* **Protección contra Inyecciones:** Todas las consultas SQL utilizan sentencias preparadas con PDO (`execute([:params])`), previniendo inyecciones SQL en búsquedas y operaciones de lectura/escritura.
* **Defensa en Profundidad Multimedia:** Validación de Magic Bytes en subidas, rechazo de dobles extensiones, saneamiento de nombres y entrega aislada.
* **Rate Limiting:** Límites configurados por IP y por endpoint para prevenir ataques de fuerza bruta en login y spam en el buzón ciudadano.

---

## 📜 Licencia y Propiedad

Propiedad exclusiva de **Lyberate** y **Contacto con la Noticia**. Todos los derechos reservados.
