# LYBERATE — ARQUITECTURA INTEGRAL DEL SISTEMA EDITORIAL

## 1. Visión y Propósito

Lyberate es una plataforma editorial y CMS multi-tenant reutilizable, diseñada para impulsar diarios digitales de alto rendimiento informativo.
Su primera instancia en producción es **Contacto con la Noticia** (`contactoconlanoticia.com`), medio de referencia del estado Guárico y Venezuela.

---

## 2. Separación Arquitectónica: Plataforma vs Tenant

```text
LYBERATE PLATFORM (Core Reutilizable)
│
├── Tenant: "Contacto con la Noticia" (Guárico / Venezuela)
│   ├── Site 01: contactoconlanoticia.com (Portal Central)
│   └── Brand Config: Tipografía Merriweather / Inter, Paleta Granate / Neutros
│
└── Futuros Tenants:
    ├── Tenant B: Diario Regional Centro
    └── Tenant C: Semanario Deportivo
```

- **Tenant Isolation:** Separación conceptual y server-side de `tenant_uuid` y `site_uuid` en todas las consultas y mutations.
- **Configuración de Marca (White-Label):** Motor dinámico de identidad visual (`SettingsContext`, logos, paleta, favicons, metadatos y enlaces de redes sociales) sin código cableado.

---

## 3. Pila Tecnológica (Stack)

### Frontend (Desarrollo y Compilación)
- **Framework:** React 19+ (Virtual DOM reactivo, transiciones fluidas)
- **Lenguaje:** TypeScript 5.7+ (Tipado estricto al 100%, `noImplicitAny`, cero `any` permisivo)
- **Empaquetador:** Vite 6.x (HMR ultrarrápido, Rollup chunks optimizados)
- **Enrutamiento:** React Router 7.x
- **Estilos:** Tailwind CSS (Sin frameworks CSS pesados, componentes atómicos)
- **Iconografía:** Lucide React (Tree-shaken)

### Backend (Producción)
- **Lenguaje:** PHP 8.x
- **Arquitectura de API:** RESTful JSON bajo el prefijo `/api/v1/`
- **Acceso a Datos:** PDO con consultas preparadas (Prepared Statements estrictos)
- **Motor de Base de Datos:** MySQL 8.x / MariaDB 10.x con soporte UTF8mb4
- **Servidor Web:** Apache / Nginx con HTTP/2 o HTTP/3 y terminación SSL

---

## 4. Capas del Sistema (Clean Architecture)

```text
┌────────────────────────────────────────────────────────┐
│              CAPA DE PRESENTACIÓN (UI)                 │
│  - Portal Público (/): Portada, Noticias, Buscar...    │
│  - Redacción (/admin): Editor, Calendario, Auditoría...│
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              CAPA DE DOMINIO Y TIPOS                   │
│  src/types/: article, user, audit, calendar, wordpress │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              CAPA DE SERVICIOS TIPADOS                 │
│  - editorialService     - publicApi                    │
│  - wordpressConnector   - adsApi                       │
│  - mediaService         - analyticsService             │
└─────────────┬────────────────────────────┬─────────────┘
              │ (VITE_DATA_MODE=mock)      │ (VITE_DATA_MODE=api)
              ▼                            ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│   mockStorage (Local)     │ │   apiClient (Axios / PHP)│
│   Desarrollo & Sandbox    │ │   /api/v1/ REST Endpoints│
└───────────────────────────┘ └──────────────────────────┘
```

---

## 5. Decisiones de Seguridad y Control de Acceso

1. **Autoridad Server-Side:**
   `localStorage` se utiliza exclusivamente en desarrollo local para el mock sandbox. En producción, **ningún permiso, rol o token de seguridad se confía a la UI o almacenamiento local**. Todas las facultades se revalidan en el backend PHP mediante sesión segura o tokens HTTP-Only.
2. **Matriz RBAC de 13 Permisos Granulares:**
   - `articles.create`, `articles.edit`, `articles.delete`
   - `articles.review`, `articles.publish`, `articles.schedule`
   - `media.upload`, `media.delete`
   - `ads.manage`
   - `analytics.view`
   - `settings.manage`, `users.manage`, `integrations.manage`

---

## 6. Integración Hemerográfica WordPress (No Migración Masiva)

- **Servicio:** `src/services/wordpressConnector.ts`
- **Enfoque:** Fuente hemerográfica remota federada desacoplada.
- **Resiliencia:** Circuit Breaker de 3 fallos con 60s de enfriamiento, AbortController con timeout de 5000ms, caché en memoria/sessionStorage y hemeroteca de respaldo.
- **Experiencia de Usuario:** Búsqueda híbrida unificada en `/buscar` con pestaña "Archivo Histórico" y tarjetas etiquetadas claramente.

---

## 7. Experiencia Móvil Periodística

- **Barra de Navegación Inferior (Dock Sólido):**
  Diseñada en `bg-stone-900` opaco con exactamente 5 accesos esenciales:
  `[ Inicio | Secciones | ⚡ Al Minuto | Buscar | Alertas ]`
- **Buzón Ciudadano:**
  El botón *"Envíanos tu Noticia"* se sitúa con protagonismo en la cabecera superior, cajón lateral deslizable y pie de página, sin congestionar la barra táctil inferior.
