# Arquitectura del Sistema

## Visión General

El Portal Editorial es una plataforma CMS multi-tenant compuesta por tres aplicaciones independientes que se comunican via API REST:

```
                         INTERNET
                             │
                    ┌────────┴────────┐
                    │   Cloudflare    │  CDN, caché edge, DDoS, SSL
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼──────────┐      ┌───────────▼──────────┐
    │   apps/web          │      │     apps/admin        │
    │   Next.js 15 SSR    │      │   React 19 + Vite     │
    │   Puerto 3000       │      │   Puerto 5173         │
    └─────────┬──────────┘      └───────────┬──────────┘
              │                             │
              └──────────────┬──────────────┘
                             │ REST API JSON (/api/v1/...)
                    ┌────────▼────────┐
                    │   api/          │
                    │   Laravel 11    │
                    │   Puerto 8000   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼───┐  ┌───────▼────┐  ┌────▼──────────┐
    │   MySQL 8   │  │   Redis    │  │   Storage     │
    │   Puerto    │  │  Caché,    │  │  Local / R2   │
    │   3306      │  │  Queues,   │  │               │
    │             │  │  Sessions  │  │               │
    └─────────────┘  └────────────┘  └───────────────┘
```

## Separación de responsabilidades

### `apps/web` — Frontend Público (Next.js 15)
- Renderizado en el servidor (SSR) para SEO óptimo
- ISR (Incremental Static Regeneration) para rendimiento
- Páginas: portada, artículos, categorías, autores, búsqueda
- Schema.org NewsArticle en cada artículo
- Sitemap.xml y robots.txt dinámicos
- PWA con service worker
- Middleware de redirecciones 301

### `apps/admin` — Panel CMS (React + Vite)
- SPA privada (no necesita SEO)
- Editor Tiptap para contenido enriquecido
- Biblioteca multimedia con upload
- Gestión completa del contenido
- Analítica básica

### `api/` — Backend (Laravel 11)
- API REST versionada (/api/v1/)
- Autenticación con Laravel Sanctum
- Multi-tenant via campo `site_id`
- Pipeline de procesamiento de imágenes
- Jobs asíncronos (procesamiento de imágenes, publicaciones programadas)
- Capa de abstracción de almacenamiento (local/S3/R2)

### `packages/shared-types/` — Tipos compartidos
- Interfaz contractual TypeScript entre frontend y backend
- Usado en `apps/web` y `apps/admin`
- Actualizar cuando cambie la API

## Multi-tenancy

Todas las tablas tienen `site_id`. El middleware `ResolveSite` determina el sitio por dominio:

```php
// ResolveSite.php
$site = Site::where('domain', $request->getHost())->firstOrFail();
$request->merge(['site_id' => $site->id]);
```

En desarrollo local, se usa `DEFAULT_SITE_ID=1`.

## Sistema de Roles

```
superadmin → acceso total a todos los sitios
admin      → acceso total a su sitio
editor     → crear, editar, publicar cualquier post
author     → crear, editar sus propios posts
viewer     → solo lectura del panel
```

La jerarquía es inclusiva: un admin tiene todos los permisos de editor y author.

## Pipeline de Imágenes

```
UPLOAD (max 20MB)
     │
     ▼
Validación (tipo MIME, extensión whitelist)
     │
     ▼
Sanitización de nombre → UUID.ext
     │
     ▼
Almacenamiento del original
     │
     ▼
Job en cola → ProcessUploadedImageJob
     │
     ├── thumbnail  300×200  WebP + JPEG
     ├── card       640×427  WebP + JPEG
     ├── medium     960×640  WebP + JPEG
     ├── large      1280×853 WebP + JPEG
     ├── hero       1920×1080 WebP + JPEG
     └── og         1200×630 JPEG
     │
     ▼
Actualiza media.conversions (JSON)
```

## Estrategia de caché

| Recurso | TTL | Dónde |
|---------|-----|-------|
| Configuración del sitio | 10 min | Redis |
| Lista de noticias | 30 seg | Next.js ISR |
| Página de artículo | 60 seg | Next.js ISR |
| Categorías | 5 min | Redis + ISR |
| Assets estáticos | 1 año | Cloudflare CDN |
| Media / Imágenes | 30 días | Cloudflare CDN |

## Decisiones Arquitectónicas

### ADR-001: Next.js en lugar de React SPA para el frontend público
**Fecha:** 2025  
**Estado:** Adoptado  
**Contexto:** Un portal de noticias requiere que el contenido sea visible para buscadores (Google, Google News) y que las redes sociales puedan generar previews (Open Graph).  
**Decisión:** Next.js con App Router y SSR/ISR para el frontend público.  
**Consecuencias:** Mayor complejidad inicial, pero SEO correcto desde el primer día. El admin sigue siendo una SPA.

### ADR-002: Laravel 11 en lugar de PHP nativo
**Fecha:** 2025  
**Estado:** Adoptado  
**Contexto:** PHP nativo sin estructura no es mantenible para dos desarrolladores construyendo auth, roles, jobs, media processing, multi-tenant.  
**Decisión:** Laravel 11 como framework backend.  
**Consecuencias:** Convención sobre configuración, ORM, queues, storage, auth listos. Curva de aprendizaje mínima para equipo con experiencia PHP.

### ADR-003: Monorepo con pnpm workspaces
**Fecha:** 2025  
**Estado:** Adoptado  
**Contexto:** `apps/web` y `apps/admin` comparten tipos TypeScript.  
**Decisión:** Monorepo con `packages/shared-types` compartido.  
**Consecuencias:** Una sola definición de tipos. Cambios en la API se detectan inmediatamente en ambos frontends.

### ADR-004: Contenido como HTML (migrado) + JSON Tiptap (nuevo)
**Fecha:** 2025  
**Estado:** Adoptado  
**Contexto:** Posts migrados de WordPress vienen como HTML. Los nuevos posts usan Tiptap.  
**Decisión:** Campo `content_format` en la tabla posts: `html` o `tiptap_json`.  
**Consecuencias:** El renderer en el frontend maneja ambos formatos. Los posts migrados se muestran como HTML, los nuevos como JSON renderizado.

