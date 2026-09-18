# CHANGELOG

Todos los cambios notables de este proyecto se documentan aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).
Este proyecto sigue [Semantic Versioning](https://semver.org/lang/es/).

---

## [Unreleased]

### Agregado

- Estructura inicial del monorepo (pnpm workspaces)
- Configuración de Docker Compose para desarrollo local
- Paquete `@portal/shared-types` con tipos TypeScript compartidos
- Frontend público inicial con Next.js 15 (App Router, SSR)
  - Layout raíz (Header, Footer, Providers)
  - Página de inicio con noticias destacadas y recientes
  - Página de artículo con SSR, JSON-LD Schema.org, Open Graph
  - Middleware de redirecciones 301 dinámicas
  - Sitemap.xml y robots.txt dinámicos
  - Manifest PWA
  - Página 404 personalizada
- Panel admin inicial con React + Vite
  - Layout con sidebar y navegación
  - Dashboard con resumen editorial
  - Sistema de autenticación (login, token, store Zustand)
  - Router completo con guards de autenticación
  - Cliente API Axios con interceptors
- Backend API Laravel 11 (scaffolding)
  - Estructura de carpetas y configuración base
  - Migraciones de base de datos (todas las tablas)
  - Modelos Eloquent con relaciones
  - Middleware de resolución de sitio y roles
  - Servicio de procesamiento de imágenes
  - Rutas API v1
- Herramientas de migración WordPress
  - Script de extracción via REST API
  - Script de transformación de posts
  - Documentación completa del proceso
- Documentación del proyecto
  - README.md principal
  - docs/ARCHITECTURE.md
  - docs/API.md

---

## Convenciones de cambios

- **Agregado**: nuevas funcionalidades
- **Modificado**: cambios en funcionalidades existentes
- **Deprecado**: funcionalidades que serán removidas
- **Eliminado**: funcionalidades removidas
- **Corregido**: correcciones de bugs
- **Seguridad**: cambios relacionados con vulnerabilidades

