# Portal Editorial — Contacto con la Noticia

Plataforma editorial profesional y reutilizable para sitios de noticias. Construida con **Next.js 15** (frontend SSR), **React + Vite** (panel CMS) y **Laravel 11** (API REST).

## Descripción

Sistema CMS editorial completo que reemplaza WordPress. Diseñado para ser reutilizable en múltiples sitios, con soporte multi-tenant, migración de WordPress, pipeline de imágenes, SEO avanzado, PWA y panel administrativo completo.

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend público | Next.js (App Router, SSR/ISR) | 15+ |
| Panel admin | React + Vite | 19 |
| Backend API | Laravel | 11 |
| Lenguaje servidor | PHP | 8.3+ |
| Base de datos | MySQL | 8.0+ |
| Caché / Queues | Redis | 7+ |
| Tipos compartidos | TypeScript | 5.5+ |
| Estilos | Tailwind CSS | 3.4+ |
| Editor de contenido | Tiptap (ProseMirror) | 2.7+ |

## Estructura del Proyecto

```
portal-editorial/
├── apps/
│   ├── web/          → Frontend público (Next.js 15)
│   └── admin/        → Panel CMS (React + Vite)
├── api/              → Backend REST API (Laravel 11)
├── packages/
│   └── shared-types/ → Tipos TypeScript compartidos
├── migration/
│   └── wordpress/    → Herramientas de migración WP
└── docker/           → Configuración Docker
```

## Requisitos

### Desarrollo local
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 4.0
- [Node.js](https://nodejs.org/) ≥ 20
- [pnpm](https://pnpm.io/) ≥ 9

### Producción
- PHP 8.3+ con extensiones: `pdo_mysql`, `gd`, `redis`, `mbstring`, `exif`, `zip`, `bcmath`
- MySQL 8.0+
- Redis 7+
- Node.js 20+ (para build)
- Nginx o Apache

## Instalación rápida (Docker)

```bash
# 1. Clonar el repositorio
git clone <repo-url> portal-editorial
cd portal-editorial

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Iniciar servicios base (MySQL + Redis + Laravel)
docker compose up -d mysql redis api worker

# 4. Instalar dependencias del backend
docker compose exec api composer install

# 5. Configurar Laravel
docker compose exec api php artisan key:generate
docker compose exec api php artisan migrate --seed

# 6. Instalar dependencias del frontend
pnpm install

# 7. Iniciar frontends en desarrollo
pnpm dev:web    # → http://localhost:3000
pnpm dev:admin  # → http://localhost:5173
```

## Variables de Entorno

Ver [`.env.example`](.env.example) para la documentación completa de todas las variables.

Variables mínimas para empezar:

```env
DB_HOST=localhost
DB_DATABASE=portal_editorial
DB_USERNAME=portal_user
DB_PASSWORD=secret
REDIS_HOST=localhost
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
VITE_API_URL=http://localhost:8000/api/v1
```

## Cómo ejecutar

### Backend (Laravel)
```bash
# Con Docker (recomendado)
docker compose up -d api worker

# Sin Docker (requiere PHP + Composer instalados)
cd api
composer install
php artisan serve
php artisan queue:work  # En otra terminal
```

### Frontend Público (Next.js)
```bash
cd apps/web
pnpm install
pnpm dev       # Desarrollo → http://localhost:3000
pnpm build     # Build de producción
pnpm start     # Servir build de producción
```

### Panel Admin (React + Vite)
```bash
cd apps/admin
pnpm install
pnpm dev       # Desarrollo → http://localhost:5173
pnpm build     # Build de producción
```

## Crear Administrador

```bash
# Via artisan (recomendado)
docker compose exec api php artisan tinker
>>> User::factory()->create(['email' => 'admin@tudominio.com', 'role' => 'admin', 'site_id' => 1])

# O ejecutar el seeder que crea un admin por defecto:
# email: admin@portal.local / password: changeme123
docker compose exec api php artisan db:seed
```

## Migración de WordPress

Ver [`migration/wordpress/README.md`](migration/wordpress/README.md) para el proceso completo.

```bash
# Extracción rápida
cd migration/wordpress
php scripts/fetch_from_api.php --url="https://tuwordpress.com" --output="raw/"
php scripts/transform_posts.php --input="raw/" --output="transformed/"
php imports/import_posts.php --input="transformed/posts.json" --site-id=1
```

## API

La API REST está disponible en `http://localhost:8000/api/v1`.

Ver [`docs/API.md`](docs/API.md) para la documentación completa.

Respuesta estándar:
```json
{
  "success": true,
  "data": {},
  "meta": { "pagination": { "current_page": 1, "total": 100 } }
}
```

## Despliegue

Ver [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) para instrucciones completas.

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Arquitectura del sistema |
| [`docs/API.md`](docs/API.md) | Documentación de la API REST |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Esquema de base de datos |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Guía de desarrollo |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Guía de despliegue |
| [`migration/wordpress/README.md`](migration/wordpress/README.md) | Migración desde WordPress |
| [`CHANGELOG.md`](CHANGELOG.md) | Historial de cambios |

## Estado del Proyecto

### ✅ Completado (Fase 0)
- Estructura de monorepo (pnpm workspaces)
- Docker Compose para desarrollo local
- Tipos TypeScript compartidos
- Configuración de todos los frontends y backend
- Documentación base

### 🏗️ En desarrollo (Fase 1)
- Backend API Laravel (migraciones, modelos, controladores)
- Pipeline de imágenes
- Sistema de autenticación

### ⏳ Pendiente
- Frontend público completo (Fase 2)
- Panel admin completo (Fase 3)
- Migración WordPress (Fase 4)
- SEO avanzado + Performance (Fase 5)
- Wizard de instalación (Fase 6)

## Arquitectura Multi-sitio

La plataforma soporta múltiples sitios con una sola instalación:

```
PLATAFORMA EDITORIAL
        │
        ├── Contacto con la Noticia (site_id=1)
        ├── Sitio futuro (site_id=2)
        └── Otro proyecto (site_id=3)
```

Cada sitio se identifica por su dominio en la tabla `sites`.

## Integración futura con CRM

El sistema está preparado para integrarse con el CRM propio via una interfaz `CRMProvider`:

```typescript
// Habilitar en .env:
CRM_ENABLED=true
CRM_API_URL=https://tu-crm.com/api
CRM_API_KEY=tu-api-key
```

El portal funciona perfectamente sin el CRM (usa `NullCRMProvider` por defecto).

## Contribución

### Ramas
- `main` → producción
- `develop` → integración
- `feature/*` → funcionalidades nuevas
- `fix/*` → correcciones

### Convenciones de commits
```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: cambios de estilo sin lógica
refactor: refactorización
perf: mejoras de rendimiento
test: tests
chore: tareas de mantenimiento
```

## Licencia

Proyecto privado — Lyberate App. Todos los derechos reservados.

