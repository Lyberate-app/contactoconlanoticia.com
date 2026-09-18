# Plataforma Editorial — Task List

## Fase 0 — Infraestructura

### Monorepo
- [x] Estructura base de carpetas
- [x] package.json raíz (pnpm workspaces)
- [x] .gitignore
- [x] .env.example (completo y documentado)
- [x] docker-compose.yml (con perfiles full/tools)
- [x] pnpm-workspace.yaml
- [x] Shared types package (@portal/shared-types)
  - [x] api.ts — contrato de respuesta
  - [x] media.ts — tipos de imágenes y conversiones
  - [x] users.ts — usuarios, autores, roles
  - [x] taxonomy.ts — categorías y tags
  - [x] posts.ts — noticias (full, summary, payload, query)
  - [x] settings.ts — configuración del sitio, anuncios, redirecciones

### Docker
- [x] docker/php/Dockerfile (PHP 8.3 con GD WebP/AVIF, Redis)
- [x] docker/php/php.ini
- [x] docker/mysql/init.sql

### Documentación base
- [x] README.md (instalación, comandos, estructura completa)
- [x] docs/ARCHITECTURE.md (diagrama, ADRs, decisiones)
- [x] CHANGELOG.md
- [ ] docs/API.md
- [ ] docs/DATABASE.md
- [ ] docs/DEVELOPMENT.md
- [ ] docs/DEPLOYMENT.md

### Backend Laravel (scaffolding)
- [x] Estructura de carpetas creada por subagente
- [x] composer.json
- [x] Migraciones de BD (todas las tablas)
- [x] Modelos Eloquent (Site, User, Post, Category, Tag, Media)
- [x] Middleware ResolveSite y EnsureRole
- [x] ImageProcessorService
- [x] Rutas API v1
- [x] AuthController
- [x] PublicPostController
- [x] Admin/PostController
- [ ] Instalación real via composer install (requiere PHP/Docker)
- [ ] Todos los demás controllers y servicios (Fase 1)

### Frontend Público (Next.js 15)
- [x] package.json con dependencias
- [x] next.config.ts (imágenes, headers seguridad, output)
- [x] tsconfig.json
- [x] tailwind.config.ts (CSS variables, fuentes)
- [x] src/lib/api.ts (cliente con ISR hints por endpoint)
- [x] src/lib/utils.ts (cn, dates, images, slugify)
- [x] src/middleware.ts (redirecciones 301 dinámicas)
- [x] src/app/layout.tsx (root layout, fonts, PWA meta)
- [x] src/app/providers.tsx (TanStack Query)
- [x] src/app/globals.css (prose-editorial, componentes)
- [x] src/app/page.tsx (portada SSR: hero, breaking, grid)
- [x] src/app/[categoria]/[slug]/page.tsx (artículo SSR + Schema.org)
- [x] src/app/sitemap.ts (sitemap.xml dinámico)
- [x] src/app/robots.ts
- [x] src/app/not-found.tsx (404)
- [x] src/components/layout/Header.tsx
- [x] src/components/layout/Footer.tsx
- [x] src/components/article/ArticleCard.tsx (4 variantes)
- [x] public/manifest.json (PWA)

### Panel Admin (React + Vite)
- [x] package.json (Vite, React 19, Tiptap, Zod, TanStack)
- [x] vite.config.ts (code splitting, proxy API)
- [x] index.html
- [x] src/main.tsx
- [x] src/App.tsx (router, guards de auth)
- [x] src/index.css (componentes del admin)
- [x] src/lib/api.ts (Axios con interceptors, todos los endpoints)
- [x] src/lib/utils.ts
- [x] src/stores/auth.ts (Zustand con persistencia)
- [x] src/components/layout/AdminLayout.tsx (sidebar, nav)
- [x] src/pages/LoginPage.tsx (form + zod + show/hide)
- [x] src/pages/DashboardPage.tsx (stats + posts recientes)
- [x] src/pages/posts/PostListPage.tsx (tabla + filtros + acciones)
- [x] src/pages/index.ts (placeholders Fase 3)

### Migración WordPress
- [x] migration/wordpress/README.md (proceso completo)
- [x] migration/wordpress/scripts/fetch_from_api.php
- [x] migration/wordpress/scripts/transform_posts.php
- [x] Estructura de directorios (source/, raw/, transformed/, logs/)

## Fase 1 — Backend Core
- [ ] Auth (login, tokens, refresh, logout)
- [ ] CRUD Posts
- [ ] CRUD Categorías
- [ ] CRUD Tags
- [ ] Upload de imágenes + pipeline
- [ ] CRUD Usuarios y roles
- [ ] Settings del sitio
- [ ] Tests básicos

## Fase 2 — Frontend Público
- [x] Portada (SSR: hero, breaking ticker, grid, sidebar)
- [x] Página artículo (SSR + Schema.org + OG + autor + relacionados)
- [x] Página categoría (portada con subcategorías y paginación)
- [x] Página autor (perfil, biografía, enlaces y artículos)
- [x] Página etiqueta (#tag con listado y conteo)
- [x] Búsqueda (en tiempo real con TanStack Query y paginación)
- [x] Archivo de noticias (/noticias)
- [x] Páginas legales (/politica-de-privacidad y /terminos)
- [x] sitemap.xml + robots.txt dinámicos
- [x] Open Graph / Twitter Cards completos
- [x] Breaking news ticker en vivo en la cabecera
- [x] Responsive completo y soporte PWA

## Fase 3 — Panel Admin
- [x] Dashboard (estadísticas y noticias recientes)
- [x] Editor Tiptap enriquecido (encabezados, listas, multimedia YouTube/imagen, contadores)
- [x] Biblioteca multimedia (grid, upload instantáneo, edición de metadatos Alt/caption)
- [x] Selector multimedia modal (MediaPickerModal integrado en editor y portada)
- [x] Gestión de categorías (jerarquía padre/hijo, slugs, descripciones)
- [x] Gestión de etiquetas (creación rápida, auto-slugify)
- [x] Gestión de equipo/usuarios (roles: superadmin, admin, editor, author, viewer)
- [x] Espacios publicitarios / Anuncios (banners de imagen y scripts AdSense)
- [x] Redirecciones 301/302 (gestión de URLs legacy de WordPress con contador de visitas)
- [x] Configuración general del sitio (identidad, colores de marca, SEO default, redes y contacto)
- [x] Analítica editorial (ranking de noticias más leídas y métricas de audiencia)

## Fase 4 — Migración WordPress
- [ ] Extractor WP REST API
- [ ] Transformadores de datos
- [ ] Importador de media + pipeline
- [ ] Importador de posts
- [ ] Generador de redirecciones 301
- [ ] Reporte de migración

## Fase 5 — SEO Avanzado y Performance
- [ ] ISR configurado
- [ ] Redis cache en API
- [ ] PWA completo
- [ ] Lighthouse > 90

## Fase 6 — Instalador
- [ ] Wizard /install
- [ ] Verificación de requisitos
- [ ] Setup automatizado
