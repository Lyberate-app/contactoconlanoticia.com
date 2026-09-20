# Lyberate

Plataforma editorial multi-tenant para crear, administrar y desplegar portales de noticias.

El primer sitio construido sobre Lyberate es **Contacto con la Noticia** (`contactoconlanoticia.com`).

---

## ¿Qué es Lyberate?

Lyberate es una plataforma CMS/editorial reutilizable.

La idea no es construir únicamente un sitio web, sino crear una base que permita posteriormente administrar múltiples clientes y sitios.

Conceptualmente:

```text
Lyberate
│
├── Tenant
│   └── Site
│       ├── Users
│       ├── Articles
│       ├── Media
│       └── Configuration
│
└── Future Tenants / Sites
```

El sistema está diseñado para separar correctamente:

* plataforma;
* cliente;
* sitio;
* usuarios;
* contenido;
* multimedia;
* configuración;
* publicidad;
* integraciones.

---

# Proyecto inicial

**Contacto con la Noticia**

Es el primer portal que utilizará la plataforma.

El sistema debe permitir conservar y migrar contenido histórico del sitio existente, además de proporcionar un flujo moderno para publicar contenido nuevo.

---

# Arquitectura

## Frontend

```text
React 19+
TypeScript
Vite
Tailwind CSS
React Router
lucide-react
```

## Backend

```text
PHP 8.x
PHP nativo modular
REST API
PDO
MySQL
```

## API

```text
/api/v1/
```

---

# Importante: Node.js

Node.js se utiliza para **desarrollo y build del frontend**.

No es el backend del proyecto.

No es un requisito obligatorio de producción.

El frontend se construye:

```text
Node.js
↓
Vite
↓
frontend/dist/
```

Producción:

```text
Apache/Nginx
↓
frontend/dist/
```

Backend:

```text
Apache/Nginx
↓
PHP 8.x
↓
REST API
↓
MySQL
```

Por lo tanto, un VPS convencional puede ejecutar Lyberate sin mantener un proceso Node.js permanente.

---

# Requisitos

## Desarrollo

Se recomienda disponer de:

* Git;
* Node.js (v18+ o v20+);
* npm o pnpm;
* PHP 8.x;
* Composer;
* MySQL;
* XAMPP y/o Docker.

## Producción

Requisitos objetivo:

* Apache o Nginx;
* PHP 8.x;
* MySQL;
* HTTPS.

Node.js no necesita permanecer instalado ni ejecutándose en producción si el frontend ya fue compilado.

---

# Estructura

```text
LYBERATE/
│
├── MASTER.md
├── README.md
│
├── frontend/
├── backend/
├── database/
├── tools/
└── docs/
```

Consulta `MASTER.md` para la arquitectura completa.

---

# Documentación

Documentación principal:

```text
MASTER.md
```

Documentación complementaria:

```text
docs/
├── ARCHITECTURE.md
├── DESIGN.md
├── SECURITY.md
├── DEPLOYMENT.md
├── MIGRATION.md
├── API.md
├── DEVELOPMENT.md
└── PHASES.md
```

---

# Principios

Lyberate sigue estos principios:

1. Seguridad primero.
2. Backend como autoridad.
3. Aislamiento multi-tenant.
4. Código simple antes que infraestructura innecesaria.
5. Frontend y backend separados.
6. MySQL como base de datos.
7. PHP como backend.
8. React/Vite como frontend.
9. Node.js solamente para desarrollo/build.
10. Producción compatible con infraestructura convencional.
11. Migración histórica segura e idempotente.
12. SEO desde la arquitectura.
13. Rendimiento como requisito.
14. Documentación como parte del desarrollo.
15. Las fases no deben saltarse.

---

# Desarrollo por fases

```text
0  Foundation, Architecture & Environment
1  Project Scaffold
2  Database Foundation
3  API Foundation
4  Authentication & RBAC
5  CMS Editorial
6  Public News Portal
7  Media Engine
8  SEO + News Discoverability
9  Advertising + Public Forms
10 Performance
11 PWA + Notifications
12 Migration Engine
13 Historical Migration
14 Security Audit
15 Production
16 CRM Integration
```

No implementar una fase futura durante la fase actual.

---

# Regla para agentes IA

Antes de realizar cambios:

```text
1. Leer MASTER.md
2. Identificar fase actual
3. Inspeccionar archivos relevantes
4. Implementar solamente la fase
5. Ejecutar verificaciones
6. Corregir errores
7. Actualizar documentación
8. Detenerse
```

La IA no debe rediseñar la arquitectura por iniciativa propia.

No crear código especulativo.

No inventar funcionalidades.

No afirmar que algo fue probado si no fue probado.

No afirmar que un push/pull fue realizado si no fue verificado.

---

# Estado

El proyecto se encuentra en desarrollo.

La documentación debe reflejar el estado real del código.

Cuando una funcionalidad todavía no existe, debe identificarse como:

```text
PLANNED
```

No como:

```text
IMPLEMENTED
```

---

# Licencia

La licencia definitiva del proyecto debe establecerse antes de la publicación comercial/open-source correspondiente.

No asumir una licencia sin decisión explícita del propietario del proyecto.

