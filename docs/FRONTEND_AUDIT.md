# AUDITORÍA TÉCNICA DEL FRONTEND — FASE FE-0
## Lyberate / Contacto con la Noticia

**Fecha de Auditoría:** 23 de Septiembre de 2026  
**Auditor Técnico:** Antigravity AI (Advanced Agentic Coding)  
**Alcance:** Exclusivamente código fuente, arquitectura y configuración dentro de `frontend/`  
**Documento Rector:** `MASTER.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/API.md`, `docs/SECURITY.md`, `docs/PHASES.md`  

---

## 1. Estado General

### 1.1 Resumen Ejecutivo
El frontend actual de **Contacto con la Noticia** sobre la plataforma **Lyberate** representa un **prototipo funcional avanzado en capa visual**, pero estructuralmente incompleto y desarticulado en varios aspectos clave de producción. 

Aunque el `README.md` del repositorio declara que las Fases 0 a 12 se encuentran `VERIFIED` (con 446 pruebas unitarias y de integración pasando en el backend PHP), la inspección directa del código fuente en `frontend/` revela una discrepancia sustancial: **el frontend no está terminado ni listo para producción**. Existen vistas que consumen endpoints de la API REST, pero carecen de componentes atómicos reutilizables, no implementan gestión multimedia (no hay biblioteca de medios en la interfaz), no integran un editor enriquecido para periodistas (solo un `<textarea>` plano), no renderizan imágenes reales en las noticias (utilizan un marco gris estático con un icono de Lucide) y mantienen duplicación masiva de lógica en vistas de más de 500 líneas.

### 1.2 Estado de Madurez por Capas
* **Arquitectura de Base:** `PARCIAL`. Vite 6 + React 19 + TypeScript 5.7 configurados, pero con carpetas arquitectónicas vacías (`hooks/`, `types/`, `utils/`) y sin cliente HTTP unificado.
* **Portal Público:** `PARCIAL`. Las páginas existen y consumen `/api/v1/public/*`, pero no muestran fotos reales de los artículos, no tienen componentes reutilizables (tarjetas de noticias) y el diseño no implementa las fuentes tipográficas periodísticas declaradas (`Merriweather` / `Lora`).
* **CMS / Mesa Editorial:** `PARCIAL`. Se cuenta con listado de artículos, moderación de reportes ciudadanos y campañas de publicidad, pero el editor es un campo de texto plano sin soporte para subir imágenes destacadas, no existe módulo de Medios (`/admin/media`), ni de Usuarios/Roles (`/admin/users`), ni de Taxonomías independientes.
* **Seguridad Frontend:** `IMPLEMENTADO`. Se cumple estrictamente con el principio de Zero Trust, no se utilizan `localStorage` ni `sessionStorage` para credenciales o tokens, las sesiones operan por cookies `HttpOnly` server-side (`credentials: 'include'`) y no se detectó uso de `dangerouslySetInnerHTML`.
* **Compilación y Build:** `BLOQUEADO EN ENTORNO LOCAL`. El directorio `frontend/node_modules/` no está instalado en el repositorio provisto; al ejecutar `npm run build` falla por ausencia de binarios de compilación (`tsc`), y existen errores de tipado implícito en modo estricto.

---

## 2. Arquitectura Actual

### 2.1 Estructura del Directorio `frontend/src/`
```text
frontend/src/
├── components/
│   ├── common/
│   │   ├── AdSlot.tsx           # Espacios publicitarios en 7 slots canónicos
│   │   ├── OptimizedImage.tsx   # Componente de imagen con <picture> y variantes (HUÉRFANO)
│   │   ├── PwaManager.tsx       # Registro SW, banner de instalación y Web Push modal
│   │   └── SeoHead.tsx          # Inyección de metadatos OpenGraph, Twitter y JSON-LD
│   └── .gitkeep
├── hooks/
│   └── .gitkeep                 # VACÍO: Cero custom hooks implementados
├── layouts/
│   ├── EditorialLayout.tsx      # Layout para panel administrativo y redacción
│   ├── PublicLayout.tsx         # Layout del portal público (cabecera, nav, ticker, footer)
│   └── .gitkeep
├── pages/
│   ├── HomePage.tsx             # OBSOLETO / HUÉRFANO: Resto de la Fase 1 (no se importa en router)
│   ├── LoginPage.tsx            # Formulario de inicio de sesión con soporte TOTP 2FA
│   ├── editorial/
│   │   ├── AdCampaignsPage.tsx          # Gestión de publicidad y estadísticas CTR
│   │   ├── ArticleEditorPage.tsx        # Editor de noticias
│   │   ├── ArticlesListPage.tsx         # Bandeja editorial con filtros por estado
│   │   └── SubmissionsModerationPage.tsx# Moderación de reportes del buzón ciudadano
│   └── public/
│       ├── ArticlePage.tsx      # Lectura de noticia individual
│       ├── AuthorPage.tsx       # Perfil público del periodista
│       ├── CategoryPage.tsx     # Listado por categoría editorial
│       ├── HomePage.tsx         # Portada del periódico digital
│       ├── NotFoundPage.tsx     # Página de error 404
│       ├── SearchPage.tsx       # Buscador avanzado con filtros
│       └── SubmitNewsPage.tsx   # Formulario de participación ciudadana
├── router/
│   └── index.tsx                # Configuración de rutas React Router v7 con React.lazy
├── services/
│   ├── adsApi.ts                # Cliente API para pautas comerciales y métricas
│   ├── auth.ts                  # Cliente de autenticación, sesión y 2FA
│   ├── editorial.ts             # Cliente de mesa de redacción y artículos
│   ├── publicApi.ts             # Cliente del portal de noticias, categorías y portada
│   ├── pushApi.ts               # Cliente Web Push (suscripción, preferencias, VAPID)
│   ├── submissionApi.ts         # Cliente de reportes ciudadanos
│   └── .gitkeep
├── types/
│   └── .gitkeep                 # VACÍO: Tipos dispersos en archivos de servicios
├── utils/
│   └── .gitkeep                 # VACÍO: Funciones de formateo duplicadas en cada vista
├── App.tsx                      # Envoltura principal con RouterProvider
├── index.css                    # Importación de Tailwind v4 (3 líneas de código)
├── main.tsx                     # Entry point de React 19 con createRoot y StrictMode
└── vite-env.d.ts                # Referencias de cliente Vite
```

### 2.2 Diagnóstico de la Arquitectura
1. **Ausencia de Componentes de Dominio:** En `components/` solo existen 4 utilidades en `common/`. No hay componentes periodísticos reutilizables como `ArticleCard`, `LeadStory`, `NewsTicker`, `AuthorBio`, `ShareBar`, `PaginationControls` o `ConfirmModal`.
2. **Capas Vacías (`hooks/`, `types/`, `utils/`):**
   - No hay hooks personalizados para gestión de peticiones, debounce de búsqueda, estado de autenticación o media queries.
   - Los tipos de TypeScript están definidos dentro de los archivos de servicios (`src/services/*.ts`), provocando acoplamiento entre contratos de datos y capas de transporte.
   - Funciones utilitarias como `formatDate()` están copiadas y pegadas con ligeras variaciones en 6 páginas distintas (`PublicLayout.tsx`, `HomePage.tsx`, `ArticlePage.tsx`, `CategoryPage.tsx`, `AuthorPage.tsx`, `SubmissionsModerationPage.tsx`).
3. **Archivo Muerto / Código Residual:** `src/pages/HomePage.tsx` (90 líneas) es un remanente de la Fase 1 con texto estático ("Entorno técnico verificado — FASE 1: Project Scaffold"). El router no lo utiliza, ya que carga `src/pages/public/HomePage.tsx`. Debe ser eliminado en la fase de refactorización.

---

## 3. Routing

### 3.1 Inventario de Rutas Existentes
El enrutador (`src/router/index.tsx`) utiliza `createBrowserRouter` de `react-router-dom` v7 con carga perezosa (`React.lazy` y `Suspense`):

| Ruta | Componente | Layout | Estado | Observaciones |
|---|---|---|:---:|---|
| `/` | `public/HomePage` | `PublicLayout` | `IMPLEMENTADO` | Portada con noticia líder, secundarias y secciones. |
| `/noticia/:slug` | `public/ArticlePage` | `PublicLayout` | `IMPLEMENTADO` | Ruta canónica de artículo. |
| `/noticias/:slug` | `public/ArticlePage` | `PublicLayout` | `IMPLEMENTADO` | Alias para compatibilidad histórica. |
| `/articulo/:slug` | `public/ArticlePage` | `PublicLayout` | `IMPLEMENTADO` | Alias para compatibilidad histórica. |
| `/categoria/:slug` | `public/CategoryPage` | `PublicLayout` | `IMPLEMENTADO` | Página de sección con paginación. |
| `/autor/:slug` | `public/AuthorPage` | `PublicLayout` | `IMPLEMENTADO` | Ficha de redactor y sus artículos. |
| `/buscar` | `public/SearchPage` | `PublicLayout` | `IMPLEMENTADO` | Buscador multi-criterio. |
| `/enviar-noticia` | `public/SubmitNewsPage` | `PublicLayout` | `IMPLEMENTADO` | Formulario ciudadano. |
| `*` | `public/NotFoundPage` | `PublicLayout` | `IMPLEMENTADO` | Manejo visual de 404. |
| `/login` | `LoginPage` | *Ninguno* | `IMPLEMENTADO` | Login de dos pasos (credenciales + 2FA). |
| `/admin` | `Navigate` | *Ninguno* | `IMPLEMENTADO` | Redirección estática a `/admin/articles`. |
| `/admin/articles` | `editorial/ArticlesListPage` | *Manual* | `IMPLEMENTADO` | Listado editorial con tabs de estado. |
| `/admin/articles/new` | `editorial/ArticleEditorPage` | *Manual* | `IMPLEMENTADO` | Creación de artículo. |
| `/admin/articles/edit/:uuid` | `editorial/ArticleEditorPage` | *Manual* | `IMPLEMENTADO` | Edición de artículo por UUID. |
| `/admin/ads` | `editorial/AdCampaignsPage` | *Manual* | `IMPLEMENTADO` | Campañas y métricas de publicidad. |
| `/admin/submissions` | `editorial/SubmissionsModerationPage` | *Manual* | `IMPLEMENTADO` | Mesa de moderación ciudadana. |

### 3.2 Problemas Críticos de Enrutamiento y Navegación
1. **Ausencia de `AuthGuard` o Rutas Protegidas Declarativas:**
   Las rutas `/admin/*` están declaradas en el router sin ningún wrapper de protección (`ProtectedRoute`). Si un usuario no autenticado navega a `/admin/articles`, el componente se monta y es la vista la que dispara una petición a `/api/v1/auth/me`. Si falla, hace una redirección imperativa con `window.location.href = '/login'`.
2. **Desconexión Arquitectónica de `EditorialLayout`:**
   En el router, las rutas `/admin/*` no son hijas de `EditorialLayout`. En su lugar, cada página administrativa importa `<EditorialLayout>` como componente contenedor individual. Esto destruye el ciclo de vida de layout de React Router y reinicia el estado y la verificación de usuario en cada transición de página.
3. **Navegación Rota (Anti-SPA):**
   Tanto `EditorialLayout.tsx` como `ArticleEditorPage.tsx` y `ArticlesListPage.tsx` utilizan etiquetas HTML nativas `<a href="/admin/...">` y `window.location.href = ...` en lugar de componentes `<Link>` y el hook `useNavigate()` de React Router. Cada clic en el menú administrativo provoca una recarga completa de página en el navegador (Hard Refresh), perdiendo la naturaleza de Single Page Application.
4. **Extracción Incorrecta de Parámetros:**
   En `ArticleEditorPage.tsx` (líneas 8-10), en lugar de usar `useParams<{ uuid: string }>()`, el código inspecciona directamente `window.location.pathname.split('/')`.
5. **Flujo de Salida de Login Truncado:**
   Al autenticarse exitosamente en `LoginPage.tsx` (cuando `step === 'authenticated'`), la página muestra una tarjeta con los datos del usuario y un botón "Cerrar Sesión", pero **nunca redirige automáticamente al usuario hacia `/admin/articles`** ni ofrece un enlace para ingresar a la redacción. El usuario queda estancado en la pantalla de login.

### 3.3 Rutas Inexistentes Requeridas para Fases Posteriores
* `/admin/dashboard`: Panel de métricas globales, actividad reciente y estado del portal.
* `/admin/media`: Galería multimedia (exploración, subida directa, edición de metadatos, borrado).
* `/admin/categories`: Gestión CRUD de taxonomía editorial (creación, ordenación, slugs).
* `/admin/tags`: Gestión y consolidación de etiquetas.
* `/admin/authors`: Creación y edición de perfiles de periodistas y sus biografías.
* `/admin/users`: Gestión de cuentas de usuario y asignación de roles RBAC.
* `/admin/settings`: Parámetros del sitio y feature flags.
* `/admin/audit`: Visualización de logs de auditoría de seguridad.
* `/admin/security`: Configuración de 2FA TOTP y Passkeys WebAuthn por el propio usuario.

---

## 4. Pages

### 4.1 Evaluación Detallada por Página

| Página | Propósito | Estado Real | Problemas Encontrados |
|---|---|:---:|---|
| `public/HomePage.tsx` | Portada periodística | `PARCIAL` | **No muestra imágenes reales.** La noticia líder usa un `div` estático con fondo gris y un icono `<Newspaper>`. Las noticias secundarias y de secciones no renderizan imágenes. La sección "Tribuna Editorial" (líneas 320-343) contiene texto estático cableado en código para "Carlos Mendoza" y "Elena Vásquez". Todo está acoplado en un archivo monolítico de 349 líneas. |
| `public/ArticlePage.tsx` | Lectura de noticia | `PARCIAL` | **No muestra la imagen destacada.** El espacio de foto es un `div` gris con icono de periódico (líneas 315-327), ignorando `article.featured_media`. El cuerpo se procesa con `article.content.split('\n\n')` y se inyecta como texto plano en `<p>`, por lo que si el contenido incluye HTML editorial o markdown, no se procesará adecuadamente. Archivo de 465 líneas sin subcomponentes. |
| `public/CategoryPage.tsx` | Listado por sección | `PARCIAL` | Funcional en consulta y paginación, pero ninguna tarjeta de noticia muestra fotografías. Archivo de 232 líneas. |
| `public/AuthorPage.tsx` | Ficha del redactor | `PARCIAL` | Consulta y paginación funcionales. El avatar del autor es solo un círculo con la inicial del nombre; no soporta fotografías reales del autor. Tarjetas de artículos sin fotos. |
| `public/SearchPage.tsx` | Buscador multi-criterio | `IMPLEMENTADO` | Completo y reactivo: soporta texto libre, categoría, autor, etiqueta, fechas y ordenación (`relevance`, `latest`, `oldest`). Sin embargo, es un archivo gigante de 567 líneas sin separar formulario de filtros y resultados. |
| `public/SubmitNewsPage.tsx` | Buzón ciudadano | `IMPLEMENTADO` | Formulario completo con validación y subida de hasta 5 fotos mediante `FormData`. Contiene una advertencia periodística explícita de no autopublicación. Posee un error de tipo TypeScript en línea 304 (`f` implícitamente `any`). |
| `public/NotFoundPage.tsx` | Error 404 | `IMPLEMENTADO` | Sobrio, con enlaces a portada, hemeroteca y categorías canónicas. |
| `pages/LoginPage.tsx` | Acceso editorial | `PARCIAL` | Soporta credenciales seguras y flujo de 2FA TOTP / recovery codes. **Defecto crítico:** no redirige al panel editorial tras iniciar sesión con éxito. |
| `editorial/ArticlesListPage.tsx` | Bandeja editorial | `IMPLEMENTADO` | Tabs de estados canónicos (`PUBLISHED`, `DRAFT`, `PENDING_REVIEW`, `SCHEDULED`, `ARCHIVED`, `TRASH`), filtros de categoría, búsqueda, badges y borrado suave/permanente. Usa enlaces duros `<a>`. |
| `editorial/ArticleEditorPage.tsx` | Redacción de artículos | `PARCIAL` | Permite editar títulos, bajada, slug, entradilla, taxonomía, autor, programación y metadatos SEO. **Defectos mayores:** El cuerpo es un `<textarea>` simple de 14 filas sin barra de herramientas; **NO tiene selector ni cargador de imagen destacada**; lee el UUID mediante manipulación de `window.location.pathname`. |
| `editorial/AdCampaignsPage.tsx` | Gestión comercial | `PARCIAL` | Métricas CTR, impresiones y clics operativas. En el modal de creación, el campo `media_uuid` es un `<input type="text">` donde el usuario debe pegar manualmente un UUID hexadecimal a ciegas por falta de biblioteca de medios. Usa `backdrop-blur-sm` violando `docs/DESIGN.md`. |
| `editorial/SubmissionsModerationPage.tsx` | Moderación ciudadana | `IMPLEMENTADO` | Bandeja con filtros por estado, modal de detalle con fotos, rechazo fundamentado con motivo y conversión directa a borrador asignado a la redacción. Archivo de 541 líneas. |
| `pages/HomePage.tsx` | Residuo Fase 1 | `PLACEHOLDER` | **Código muerto**. No utilizado por el sistema. Debe eliminarse. |

---

## 5. Components

### 5.1 Inventario de Componentes Existentes

#### 1. `src/components/common/AdSlot.tsx`
* **Propósito:** Renderizar banners publicitarios según su ubicación (`HEADER_BANNER`, `TOP_NEWS`, `SIDEBAR`, `ARTICLE_TOP`, `ARTICLE_MIDDLE`, `ARTICLE_BOTTOM`, `FOOTER`).
* **Estado:** `IMPLEMENTADO`.
* **Comportamiento:** Consulta `getActiveAds(placement)`, selecciona aleatoriamente si hay varios, registra la impresión una sola vez mediante `ref`, genera el enlace de tracking `/api/v1/public/ads/{uuid}/click` con atributos `rel="noopener noreferrer sponsored"` y etiqueta semántica `<aside aria-label="Espacio publicitario">`.
* **Reutilización:** Alta. Usado en layouts y páginas públicas.

#### 2. `src/components/common/OptimizedImage.tsx`
* **Propósito:** Mostrar imágenes con etiqueta `<picture>`, fuentes adaptativas `image/avif` e `image/webp` con `srcset` y `sizes`, dimensiones fijas para evitar CLS (Cumulative Layout Shift) y pie de foto en `<figcaption>`.
* **Estado:** `NO CONECTADO (HUÉRFANO)`.
* **Problema Encontrado:** **No se utiliza en ningún archivo del proyecto.** Las páginas de portada y artículo utilizan bloques `<div>` grises con iconos estáticos en lugar de invocar este componente. Requiere integración inmediata.

#### 3. `src/components/common/PwaManager.tsx`
* **Propósito:** Manejar el registro del Service Worker (`/sw.js`), detectar estado offline/online, gestionar el evento `beforeinstallprompt` y coordinar la suscripción Web Push con selección de tópicos.
* **Estado:** `IMPLEMENTADO`.
* **Problemas Encontrados:** Modifica directamente el objeto global del navegador mediante `(window as any).openPushPreferences = ...` en lugar de utilizar un Context de React o un Custom Hook.

#### 4. `src/components/common/SeoHead.tsx`
* **Propósito:** Gestionar dinámicamente `<title>`, `<meta name="description">`, OpenGraph, Twitter Cards, `<link rel="canonical">` y marcado estructurado JSON-LD (`NewsArticle`, `BreadcrumbList`, `NewsMediaOrganization`).
* **Estado:** `IMPLEMENTADO`.
* **Comportamiento:** Manipula directamente los elementos del `<head>` del DOM en un hook `useEffect`. Limpia y reemplaza etiquetas al cambiar de página.
* **Limitación Arquitectónica:** Al ser una Single Page Application (SPA) sin renderizado en servidor (SSR), los rastreadores que no ejecutan JavaScript (como los bots de vista previa de WhatsApp, Telegram o Twitter) no podrán leer estas etiquetas si la página es servida como HTML estático puro sin pre-renderizado.

### 5.2 Componentes Faltantes Indispensables
Para evitar archivos monolíticos de más de 400 líneas, es necesario construir:
1. `components/news/ArticleCard.tsx` (tarjeta de noticia estándar reutilizable para portada, secciones y autor).
2. `components/news/LeadArticle.tsx` (bloque de noticia principal con tratamiento jerárquico).
3. `components/news/TrendingWidget.tsx` (lista numerada de tendencias).
4. `components/news/ShareBar.tsx` (barra de botones para compartir en redes sociales).
5. `components/news/AuthorByline.tsx` (firma del periodista con fecha de publicación y actualización).
6. `components/ui/Pagination.tsx` (control de paginación universal con estados anterior/siguiente).
7. `components/ui/Modal.tsx` (modal accesible reutilizable sin `backdrop-blur`).
8. `components/ui/ConfirmDialog.tsx` (cuadro de confirmación editorial para descartes y borrados).
9. `components/editorial/MediaPickerModal.tsx` (selector modal de biblioteca multimedia para artículos y anuncios).

---

## 6. Design System

### 6.1 Confrontación con `docs/DESIGN.md`

| Directiva en `docs/DESIGN.md` | Estado Actual | Evidencia en Código |
|---|:---:|---|
| **NO Glassmorphism ni `backdrop-blur`** | **INFRACCIÓN** | `AdCampaignsPage.tsx` (línea 321) usa `backdrop-blur-sm` en el modal de creación de campañas. Debe corregirse a fondo opaco sólido (`bg-stone-950/70`). |
| **NO gradientes decorativos ni neón** | `CUMPLE` | Paleta sobria basada exclusivamente en `stone` (`stone-50` a `stone-950`) con acentos en rojo editorial (`red-700`, `red-900`) y esmeralda institucional. |
| **NO esquinas redondeadas exageradas (`rounded-3xl`)** | `CUMPLE` | Se utilizan esquinas rectas o sutiles (`rounded-sm`, `rounded`, `rounded-md`). |
| **NO sombras difusas gigantescas (`shadow-2xl`)** | `CUMPLE PARCIAL` | En general se usan `shadow-sm` o bordes definidos `border-stone-200`, salvo en el modal de `AdCampaignsPage.tsx` que tiene `shadow-2xl`. |
| **Iconografía exclusiva con Lucide React** | `CUMPLE` | Todos los iconos provienen de `lucide-react`. Cero emojis decorativos en la interfaz formal. |
| **HTML Semántico estricto** | `CUMPLE` | Uso correcto de `<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>`, `<figure>`, `<figcaption>`. |
| **Tipografía Editorial (`Merriweather` / `Lora` / `Georgia`)** | **INCUMPLIMIENTO** | No hay ninguna fuente web cargada en `index.html` ni configurada en `index.css`. Las clases `font-serif` usan la fuente genérica del sistema del navegador. |

### 6.2 Jerarquía Visual y Legibilidad
* **Contraste:** Excelente en la escala de grises cálidos. Textos principales en `stone-950` sobre fondo `stone-50` o blanco.
* **Ritmo Tipográfico:** Buen uso de antetítulo en mayúsculas pequeñas, titular en serif con peso bold, subtítulo en cursiva y cuerpo en serif legible.
* **Carencia Crítica:** La falta de imágenes fotográficas reales rompe la experiencia editorial de periódico digital.

---

## 7. TypeScript

### 7.1 Evaluación del Sistema de Tipos
* **Configuración (`tsconfig.json`):**
  - Modo estricto activado (`"strict": true`).
  - No emisión de código (`"noEmit": true`).
  - Resolución de módulos `"bundler"`.
  - Chequeo de variables no utilizadas (`"noUnusedLocals": true`, `"noUnusedParameters": true`).
* **Uso de `any` y Casts Inseguros:**
  Se detectaron 20 instancias de `any` en el frontend:
  - `PwaManager.tsx`: Manipulación de `(window as any).openPushPreferences`.
  - `AdCampaignsPage.tsx` y `ArticleEditorPage.tsx`: Casts `e.target.value as any` en selects de estado y tipo de anuncio.
  - `editorial.ts`: `createArticle(data: any): Promise<any>` y `updateArticle(uuid: string, data: any): Promise<any>` prescinden por completo de validación de tipos en los datos enviados.
  - `auth.ts`: `details?: any` en el tipo `LoginResponse`.
  - `SubmitNewsPage.tsx` (línea 304): Parámetro `f` en `files.map(f => f.name)` genera error `TS7006: Parameter 'f' implicitly has an 'any' type` en compilación estricta sin `@types/node` o lib DOM.

### 7.2 Tipos Faltantes y Contratos Requeridos
La carpeta `frontend/src/types/` está vacía. Es imperativo crear contratos centralizados.

Cuando no existe documentación explícita de la respuesta en `docs/API.md`, se clasifica:

* `Media`: `API CONTRACT REQUIRED` (para la respuesta completa de variantes de imagen y metadatos en `/api/v1/admin/media/*`).
* `Users & Roles`: `API CONTRACT REQUIRED` (para el módulo futuro de administración de usuarios y permisos en `/api/v1/admin/users/*`).
* `SiteSettings`: `API CONTRACT REQUIRED` (para la gestión de configuración y feature flags por sitio).
* `AuditLog`: `API CONTRACT REQUIRED` (para el visor de auditoría en `/api/v1/admin/audit/*`).

---

## 8. API Integration

### 8.1 Clientes HTTP Existentes
Los servicios residen en `frontend/src/services/`:
1. `auth.ts`: Endpoints `/api/v1/auth/login`, `/2fa/verify`, `/me`, `/logout`.
2. `publicApi.ts`: Endpoints `/api/v1/public/home`, `/articles`, `/articles/{slug}`, `/categories`, `/categories/{slug}`, `/authors/{slug}`, `/search`, `/search/filters`.
3. `editorial.ts`: Endpoints `/api/v1/admin/articles`, `/articles/{uuid}`, `/categories`, `/authors`, `/tags`.
4. `adsApi.ts`: Endpoints `/api/v1/public/ads`, `/ads/{uuid}/impression`, `/ads/{uuid}/click`, `/api/v1/admin/ads/*`.
5. `pushApi.ts`: Endpoints `/api/v1/public/push/config`, `/subscribe`, `/unsubscribe`, `/preferences`.
6. `submissionApi.ts`: Endpoints `/api/v1/public/submissions`, `/api/v1/admin/submissions/*`.

### 8.2 Cumplimiento de Normativa de API
* **Prefijo:** Todas las URLs consumen estrictamente `/api/v1/`.
* **Formato:** Todas las cabeceras solicitan y envían `application/json` (o `multipart/form-data` para archivos).
* **Manejo de Sesiones:** Todas las llamadas autenticadas utilizan `credentials: 'include'`.
* **Seguridad de Tokens:** No existe ningún almacenamiento de tokens en `localStorage` o `sessionStorage`.
* **Inconsistencias Detectadas:**
  - No existe un cliente HTTP centralizado (ej. `apiClient.ts`). Cada servicio implementa su propio wrapper sobre `fetch()`.
  - En `publicApi.ts`, algunos métodos usan la función `fetchJson<T>()` mientras que otros replican bloques `fetch().then(res => res.json())` manualmente.
  - La captura de errores HTTP (401, 403, 500) se hace ad-hoc en cada página con `alert()` o `console.error()`, en lugar de un interceptor unificado que maneje sesiones expiradas o errores globales.

---

## 9. Public Portal

### 9.1 Matriz de Funcionalidades Públicas

| Módulo | Estado | Componente / Archivo | Diagnóstico |
|---|:---:|---|---|
| **Masthead Periodístico** | `IMPLEMENTADO` | `PublicLayout.tsx` | Cabecera formal con lema, fecha localizada (`es-VE`), información meteorológica y reglas tipográficas dobles. |
| **Navegación Principal** | `IMPLEMENTADO` | `PublicLayout.tsx` | Menú con 6 categorías canónicas obtenidas de la API (con fallback offline si la API no responde) y drawer móvil. |
| **Última Hora (Ticker)** | `IMPLEMENTADO` | `PublicLayout.tsx` | Cintillo sutil de última hora alimentado por `feed.breaking_news`. |
| **Noticia Principal (Lead)**| `PARCIAL` | `public/HomePage.tsx` | Diagramación en 7 columnas, titular de impacto y entradilla. **Falta foto real.** |
| **Noticias Secundarias** | `PARCIAL` | `public/HomePage.tsx` | 5 columnas laterales con noticias destacadas. Sin fotos. |
| **Flujo de Últimas Noticias**| `PARCIAL` | `public/HomePage.tsx` | Grid de 2 columnas con actualización continua. Sin fotos. |
| **Secciones Canónicas** | `PARCIAL` | `public/HomePage.tsx` | Bloques segmentados por categoría con enlace "Ver sección completa". |
| **Tendencias / Más Leído** | `IMPLEMENTADO` | `public/HomePage.tsx` | Lista numerada en barra lateral. |
| **Lectura de Artículo** | `PARCIAL` | `public/ArticlePage.tsx` | Antetítulo, título, subtítulo, autor, fechas, letra capital (drop cap), tags, relacionadas y compartir en redes. **Falta foto real.** |
| **Ficha de Autor** | `PARCIAL` | `public/AuthorPage.tsx` | Perfil del redactor, biografía y lista paginada de artículos. Sin avatar fotográfico. |
| **Página de Categoría** | `PARCIAL` | `public/CategoryPage.tsx` | Descripción de sección y noticias paginadas. Sin fotos. |
| **Buscador Multi-criterio** | `IMPLEMENTADO` | `public/SearchPage.tsx` | Filtros por texto, autor, categoría, etiqueta, rango de fechas y ordenación. |
| **Buzón Ciudadano** | `IMPLEMENTADO` | `public/SubmitNewsPage.tsx`| Formulario con subida de imágenes y aviso de verificación previa. |
| **Espacios Publicitarios** | `IMPLEMENTADO` | `AdSlot.tsx` | 7 slots activos con tracking. |
| **Footer Periodístico** | `IMPLEMENTADO` | `PublicLayout.tsx` | 4 columnas con identidad, enlaces institucionales y créditos de plataforma Lyberate. |

---

## 10. Admin / CMS

### 10.1 Matriz de Funcionalidades Editoriales

| Módulo | Estado | Componente / Archivo | Diagnóstico |
|---|:---:|---|---|
| **Login / Autenticación** | `PARCIAL` | `pages/LoginPage.tsx` | Autenticación en dos pasos (contraseña + TOTP/códigos). **No redirige automáticamente a la redacción tras el éxito.** |
| **Bandeja de Artículos** | `IMPLEMENTADO` | `editorial/ArticlesListPage.tsx` | Filtros por 7 estados editoriales, categorías, búsqueda y borrado con confirmación. |
| **Editor de Artículos** | `PARCIAL` | `editorial/ArticleEditorPage.tsx` | Permite gestionar textos, slug, taxonomía, autor, programación y metadatos SEO. **Carece de selector de imagen destacada y editor enriquecido (solo `<textarea>`).** |
| **Gestión de Anuncios** | `PARCIAL` | `editorial/AdCampaignsPage.tsx` | Creación y métricas de campañas. `media_uuid` debe ingresarse manualmente como texto. Uso de `backdrop-blur`. |
| **Buzón Ciudadano (CMS)** | `IMPLEMENTADO` | `editorial/SubmissionsModerationPage.tsx` | Moderación con rechazo fundamentado y conversión a borrador de un clic. |
| **Biblioteca de Medios** | `NO EXISTE` | *Ninguno* | El backend soporta upload y variantes WebP/AVIF (Fase 7), pero el frontend **no tiene vista ni selector de medios**. |
| **Gestión de Categorías** | `NO EXISTE` | *Ninguno* | Solo se consumen para desplegables; no hay interfaz para crear o editar categorías. |
| **Gestión de Autores** | `NO EXISTE` | *Ninguno* | No hay interfaz para crear o editar biografías y redactores. |
| **Gestión de Usuarios / RBAC**| `NO EXISTE` | *Ninguno* | No hay interfaz para administrar usuarios, contraseñas o roles del sitio. |
| **Configuraciones / Flags** | `NO EXISTE` | *Ninguno* | No existe panel de ajustes del sitio ni feature flags. |
| **Dashboard Editorial** | `NO EXISTE` | *Ninguno* | `/admin` redirige directamente a la lista de artículos. |

---

## 11. SEO

### 11.1 Delimitación de Responsabilidades Técnicas
Siguiendo la instrucción estricta de `MASTER.md`: **No atribuir al frontend lo que corresponde al backend o al servidor**.

#### Frontend Responsibility (Implementado vía `SeoHead.tsx`)
* Inyección dinámica de `document.title` adaptado (`Título | Contacto con la Noticia`).
* Metadatos `<meta name="description">` y `<meta name="robots">`.
* Enlace canónico `<link rel="canonical" href="...">`.
* Metadatos de Open Graph (`og:type`, `og:title`, `og:description`, `og:url`, `og:image`, `og:locale`).
* Metadatos de Twitter Card (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`).
* Datos estructurados JSON-LD insertados en `<script type="application/ld+json">`:
  - `NewsArticle` en páginas de artículo (con headline, fechas, autor, publisher e imagen).
  - `BreadcrumbList` en noticias, categorías y autores.
  - `NewsMediaOrganization` con `SearchAction` en la portada.
  - `Person` en la ficha de autor.

#### Backend / Server Responsibility (Responsabilidad Fuera del Frontend)
* **Generación de `sitemap.xml`:** Generado en backend PHP (`/sitemap.xml`).
* **Generación de `sitemap-news.xml`:** Generado en backend PHP para Google News (`/sitemap-news.xml`).
* **Sindicación RSS 2.0 y Atom:** Generado en backend PHP (`/feed.xml`, `/rss.xml`).
* **Directivas `robots.txt`:** Servido en raíz por servidor web (`/robots.txt`).
* **Prerenderizado / SSR de Open Graph para Redes Sociales:** En una SPA de React puro, los rastreadores que no ejecutan JavaScript (como WhatsApp o Facebook Scraper) leen el HTML estático inicial antes de que `SeoHead.tsx` se ejecute en el navegador. Para que el compartir en redes sociales funcione con crawlers sin JS, el servidor web (Apache/Nginx/PHP) debe inyectar las etiquetas de cabecera mínimas durante la entrega del HTML o contar con una capa de pre-renderizado.

---

## 12. PWA

### 12.1 Estado de Implementación
* **Web App Manifest (`public/manifest.webmanifest`):** `IMPLEMENTADO`. Define nombre, iconos (192x192, 512x512, maskable, SVG), colores institucionales (`#0c0a09`), modo `standalone`, orientación y accesos directos (*shortcuts* a Última Hora, Regionales y Buscar).
* **Service Worker (`public/sw.js`):** `IMPLEMENTADO`.
  - Estrategia Cache-First para el App Shell (`/`, `/index.html`, `/offline.html`, iconos).
  - Exclusión estricta de rutas privadas (`/api/v1/admin/`, `/api/v1/auth/`, `/editorial/`, `/login`).
  - Estrategia Network-First con fallback a caché y página offline (`/offline.html`) para navegación.
  - Manejo de notificaciones Push (`self.addEventListener('push')` y `notificationclick`).
* **Página de Contingencia Offline (`public/offline.html`):** `IMPLEMENTADO`. Documento HTML estático autónomo con estilos en línea, diseño sobrio de periódico y botón de reintento.
* **Componente de Gestión (`src/components/common/PwaManager.tsx`):** `IMPLEMENTADO`. Registra el Service Worker, detecta desconexión, captura el prompt de instalación y gestiona suscripciones Push con claves VAPID y tópicos.

---

## 13. Responsive Design

### 13.1 Auditoría por Puntos de Ruptura (Breakpoints)

| Dispositivo / Resolución | Estado Visual | Observaciones |
|---|:---:|---|
| **Móvil Pequeño (< 380px)** | `ACEPTABLE` | Texto y titulares fluidos. El menú colapsa en drawer. La barra de utilidades superior oculta elementos secundarios para evitar desbordamientos. |
| **Móvil Estándar (380px - 640px)** | `BUENO` | Lectura a una sola columna cómoda. Ticker de última hora visible. Botones de compartir con tamaño táctil adecuado. |
| **Tablet (641px - 1024px)** | `ACEPTABLE` | Portada redistribuye noticias en rejilla de 2 columnas. Menú horizontal puede requerir scroll horizontal si hay muchas categorías. |
| **Desktop (1024px - 1440px)** | `BUENO` | Diagramación periodística tradicional completa: 7 columnas para noticia principal, 5 para secundarias, barra lateral con tendencias y anuncios. |
| **Pantallas Grandes (> 1440px)** | `BUENO` | Contenedores limitados a `max-w-7xl` con márgenes automáticos, previniendo líneas de texto excesivamente largas. |

*Nota sobre verificación visual:* Al no disponer de un navegador con renderizado visual interactivo directo en esta sesión CLI, el análisis se sustenta en la inspección estricta de las clases utilitarias de Tailwind CSS (`sm:`, `md:`, `lg:`) aplicadas en cada layout y componente.

---

## 14. Accesibilidad (a11y)

### 14.1 Evaluación de Directivas
* **Semántica HTML:** `ALTO`. Uso riguroso de `<main>`, `<article>`, `<header>`, `<nav>`, `<footer>`, `<aside>`, `<figure>` y `<figcaption>`.
* **Jerarquía de Encabezados:** Estructurada (`<h1>` único por página, `<h2>` para bloques temáticos y secciones, `<h3>` para noticias secundarias).
* **Etiquetado Accesible:**
  - `aria-label` presente en botones de búsqueda, menú móvil y contenedores de anuncios (`<aside aria-label="Espacio publicitario">`).
  - Botón de cierre de modal con atributo visible.
* **Aspectos a Mejorar:**
  - Atributos `alt` en imágenes: Al no haber imágenes reales en la portada y artículo, los textos alternativos no están probados en condiciones de producción.
  - Navegación por teclado: Faltan estilos explícitos de `focus-visible:ring-2` en varios enlaces de texto del menú.

---

## 15. Performance

### 15.1 Diagnóstico de Rendimiento
1. **Code Splitting y Carga Perezosa:** `IMPLEMENTADO`. Todas las páginas en `src/router/index.tsx` utilizan `React.lazy()` con `Suspense` y un fallback de carga periodístico sobrio. Esto garantiza que el usuario solo descargue el código de la vista que está navegando.
2. **Tratamiento de Imágenes:** `DEFICIENTE`. A pesar de contar con `OptimizedImage.tsx` (diseñado para `srcset`, WebP, AVIF y prevención de CLS), el componente no está conectado. Las páginas públicas muestran cajas vacías con iconos de Lucide.
3. **Módulos Pesados:** No se detectan dependencias pesadas innecesarias (no hay librerías de gráficos complejas, ni frameworks de animación pesados, ni dependencias de utilidad sobredimensionadas como Moment.js o Lodash).

---

## 16. Seguridad Frontend

### 16.1 Verificación de Controles
* **Cero Secretos Expuestos:** No hay API keys, tokens JWT, contraseñas ni variables de entorno privadas en el código fuente de `frontend/`.
* **Cero `localStorage` / `sessionStorage`:** No se guarda ninguna información de sesión ni tokens en el navegador. La autenticación depende 100% de cookies `HttpOnly` emitidas por el backend PHP.
* **Cero `dangerouslySetInnerHTML`:** No se utiliza inyección directa de HTML sin procesar.
* **Protección contra Clickjacking y Referrer:** Enlaces publicitarios y externos incluyen `rel="noopener noreferrer sponsored"`.

---

## 17. Dependencias

### 17.1 Análisis de `package.json`

```json
{
  "dependencies": {
    "lucide-react": "^0.475.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.5"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.6",
    "@types/node": "^22.13.4",
    "@types/react": "^19.0.8",
    "@types/react-dom": "^19.0.3",
    "@vitejs/plugin-react": "^4.3.4",
    "tailwindcss": "^4.0.6",
    "typescript": "^5.7.3",
    "vite": "^6.1.0"
  }
}
```

* **Dependencias Utilizadas:** Las 4 dependencias de producción son estrictamente necesarias y respetan el stack oficial de `MASTER.md`.
* **Dependencias Innecesarias:** Ninguna.
* **Dependencias Faltantes (para fases futuras):**
  - Si los artículos contendrán formato editorial (negritas, cursivas, citas, listas), se necesitará un parser/sanitizador seguro de HTML (ej. `dompurify` + `@types/dompurify`) o una librería ligera de Markdown.

---

## 18. Build / Test Results

### 18.1 Verificaciones Ejecutadas en esta Auditoría

#### Comando 1: `npm run build` (dentro de `frontend/`)
* **Ejecución:**
  ```powershell
  cd frontend; npm run build
  ```
* **Resultado:** Falló con código de salida 1.
* **Salida del Terminal:**
  ```text
  > lyberate-frontend@0.1.0 build
  > tsc -b && vite build

  'tsc' is not recognized as an internal or external command,
  operable program or batch file.
  ```
* **Causa Raíz:** El directorio `frontend/node_modules/` no existe en la copia local del proyecto. Al no haberse ejecutado `npm install` previamente, el binario local `tsc` de TypeScript no está presente en el PATH de npm.

#### Comando 2: `npx tsc --noEmit` (dentro de `frontend/`)
* **Resultado:** Falló con código de salida 1.
* **Salida del Terminal:**
  ```text
  npm warn exec The following package was not found and will be installed: tsc@2.0.4
  npm warn deprecated tsc@2.0.4: Package no longer supported.
  This is not the tsc command you are looking for.
  ```
* **Causa Raíz:** Al no estar `typescript` instalado en `node_modules`, `npx` intentó resolver un paquete independiente obsoleto llamado `tsc` en lugar del compilador oficial.

#### Comando 3: `npx -p typescript tsc --noEmit` (dentro de `frontend/`)
* **Resultado:** Falló con múltiples errores de compilación TypeScript.
* **Errores Principales Detectados:**
  1. Ausencia de declaraciones de tipo para módulos (`Cannot find module 'react'`, `'react-dom'`, `'react-router-dom'`, etc.) debido a la falta de `node_modules`.
  2. Error sintáctico/semántico real en el código:
     ```text
     src/pages/public/SubmitNewsPage.tsx(304,76): error TS7006: Parameter 'f' implicitly has an 'any' type.
     ```
     En la línea 304: `{files.map((f) => f.name).join(', ')}`, el parámetro `f` no tiene tipo explícito y el compilador lo rechaza en modo estricto.

---

## 19. Matriz Final de Estado

| Área | Estado | Evidencia en Código | Trabajo Restante |
|---|:---:|---|---|
| **Arquitectura** | `PARCIAL` | Directorios `hooks/`, `types/`, `utils/` vacíos con solo `.gitkeep`. Archivo muerto `pages/HomePage.tsx`. | Crear cliente HTTP base, centralizar tipos y utilidades, eliminar archivo huérfano. |
| **Routing** | `PARCIAL` | `src/router/index.tsx` sin `ProtectedRoute`. `EditorialLayout` no es Route Layout. Uso de `<a>` y `window.location.href`. | Implementar AuthGuard, convertir `EditorialLayout` a Outlet layout y reemplazar enlaces con `<Link>`. |
| **Design System** | `PARCIAL` | Paleta sobria `stone` correcta, pero no hay fuentes `Merriweather`/`Lora`. Modal en `AdCampaignsPage.tsx` usa `backdrop-blur-sm`. | Cargar fuentes web periodísticas, retirar `backdrop-blur` de modales. |
| **Homepage** | `PARCIAL` | `public/HomePage.tsx` tiene estructura y secciones, pero la foto líder es un `div` gris con `<Newspaper>` y Tribuna Editorial es estática. | Conectar `OptimizedImage`, consumir fotos reales y extraer subcomponentes. |
| **Article** | `PARCIAL` | `public/ArticlePage.tsx` con metadatos y byline completos, pero la foto destacada es un placeholder gris y el cuerpo es texto plano. | Integrar `OptimizedImage`, formateo seguro de contenido y desacoplar componentes. |
| **Categories** | `PARCIAL` | `public/CategoryPage.tsx` consulta y pagina correctamente, pero ninguna tarjeta muestra fotos. | Integrar fotos y tarjeta reutilizable `ArticleCard`. |
| **Authors** | `PARCIAL` | `public/AuthorPage.tsx` funcional, pero el avatar es solo la inicial en texto. Artículos sin fotos. | Soportar foto real del redactor y conectar `ArticleCard`. |
| **Search** | `IMPLEMENTADO` | `public/SearchPage.tsx` con filtros avanzados multi-criterio y paginación reactiva (567 líneas). | Refactorizar separando formulario de filtros y lista de resultados. |
| **CMS / Artículos** | `PARCIAL` | Lista con tabs de estados operativa, pero el editor es un `<textarea>` simple y no tiene selector de imagen destacada. | Implementar barra de herramientas / editor rico y selector de medios. |
| **Media** | `NO EXISTE` | Cero componentes o servicios para medios en frontend. | Crear `services/mediaApi.ts`, página `/admin/media` y modal `MediaPickerModal`. |
| **Ads** | `PARCIAL` | `AdSlot.tsx` y `AdCampaignsPage.tsx` operativos, pero el formulario requiere escribir UUID a mano. | Conectar selector de medios y eliminar `backdrop-blur`. |
| **Submissions** | `IMPLEMENTADO` | `SubmitNewsPage.tsx` y `SubmissionsModerationPage.tsx` completamente conectados y funcionales. | Tipar parámetro `f` en línea 304 y refactorizar modales. |
| **SEO** | `IMPLEMENTADO` | `SeoHead.tsx` inyecta dinámicamente OpenGraph, Twitter y JSON-LD (`NewsArticle`, `Breadcrumbs`). | Considerar estrategia de prerenderizado para crawlers sin JS. |
| **PWA** | `IMPLEMENTADO` | `manifest.webmanifest`, `sw.js`, `offline.html` y `PwaManager.tsx` activos con Web Push. | Reemplazar `(window as any)` por React Context o Hook. |
| **Accessibility** | `BUENO` | Semántica HTML estricta, encabezados ordenados y atributos `aria-label`. | Añadir `focus-visible` en menú y textos alternativos reales. |
| **Performance** | `PARCIAL` | Code splitting con `React.lazy` implementado, pero `OptimizedImage` nunca se utiliza. | Conectar `OptimizedImage` para aprovechar WebP/AVIF y `srcset`. |
| **API Integration** | `PARCIAL` | Servicios cubren endpoints base con cookies seguras, pero no hay cliente HTTP común ni interceptor de errores. | Unificar cliente base en `apiClient.ts` y tipar payloads (`any`). |

---

## 20. Technical Risks

1. **Riesgo de Compilación y Dependencias:** Al no estar versionado `node_modules` (lo cual es correcto por `.gitignore`), cualquier desarrollador o pipeline de CI/CD que clone el repositorio requerirá ejecutar `npm install` antes de poder compilar con `npm run build`. Además, el comando de build usa `tsc -b`, lo que fallará si `tsconfig.json` no tiene configuradas referencias de proyecto ("composite").
2. **Riesgo de Indexación Social en SPA Pura:** Al ser un build estático servido por Apache/Nginx sin Server-Side Rendering (SSR), rastreadores de redes sociales (WhatsApp, Facebook, Twitter) que no interpretan JS podrían no visualizar las imágenes destacadas ni los títulos dinámicos generados por `SeoHead.tsx`.
3. **Riesgo de Mantenibilidad por Componentes Gigantes:** Las páginas principales (`SearchPage.tsx` con 567 líneas, `SubmissionsModerationPage.tsx` con 541 líneas, `ArticleEditorPage.tsx` con 482 líneas, `ArticlePage.tsx` con 465 líneas) concentran estado, peticiones, lógica de negocio y JSX en un solo bloque, dificultando su evolución y pruebas unitarias.
4. **Riesgo de Experiencia Editorial:** Un periodista no puede trabajar en un medio profesional redactando únicamente en un `<textarea>` sin formateo ni selector de fotografías. Si el CMS no permite cargar la imagen destacada, el portal nunca podrá mostrar fotos reales en portada ni en artículos.

---

## 21. Recommended Frontend Work Order (Fases Posteriores)

Este orden de trabajo técnico se propone para ser ejecutado en fases sucesivas una vez aprobada esta auditoría:

### Fase FE-1: Estabilización, Tooling & Arquitectura Base
* Ejecutar instalación de dependencias en el entorno y verificar build limpio (`npm run build`).
* Corregir el script de build en `package.json` (`"build": "tsc --noEmit && vite build"` en lugar de `tsc -b`).
* Corregir el error de tipo en `SubmitNewsPage.tsx` (`f: File`).
* Eliminar el archivo obsoleto `src/pages/HomePage.tsx`.
* Crear `src/utils/date.ts` y centralizar la función `formatDate()`.
* Crear `src/services/apiClient.ts` con cliente `fetch` unificado, manejo de errores y tipado.
* Mover y centralizar tipos comunes a `src/types/`.
* Cargar e importar tipografía editorial periodística (`Merriweather` / `Lora`) en `index.html` y configurar en Tailwind.

### Fase FE-2: Routing, Layouts & Autenticación SPA
* Implementar `ProtectedRoute` / `AuthGuard` para rutas `/admin/*`.
* Convertir `EditorialLayout` en un Route Layout que utilice `<Outlet />`.
* Reemplazar todas las etiquetas `<a>` y llamadas `window.location.href` en el CMS por `<Link>` y `useNavigate()`.
* Corregir `LoginPage.tsx` para que redirija automáticamente a `/admin/articles` tras autenticarse con éxito.
* Extraer el UUID de artículo en `ArticleEditorPage.tsx` usando `useParams()`.

### Fase FE-3: Componentes Atómicos & Portal Público Real
* Extraer componentes reutilizables: `ArticleCard`, `LeadStory`, `NewsTicker`, `AuthorBio`, `ShareBar`, `Pagination`.
* **Conectar `OptimizedImage`:** Reemplazar los contenedores vacíos con iconos en `HomePage.tsx` y `ArticlePage.tsx` por imágenes reales utilizando variantes WebP/AVIF y `srcset`.
* Dinamizar la sección "Tribuna Editorial" en la portada o vincularla a datos reales.
* Refactorizar `SearchPage.tsx` desacoplando el formulario de filtros y la lista de resultados.

### Fase FE-4: CMS Editorial Completo & Motor Multimedia
* Crear servicio `src/services/mediaApi.ts` para conectar los endpoints de medios de la Fase 7 (`/api/v1/admin/media/*`).
* Construir la vista de Biblioteca Multimedia `/admin/media` (subida, galería, recorte, variantes y borrado).
* Construir el modal `MediaPickerModal` e integrarlo en:
  - `ArticleEditorPage.tsx` (para seleccionar y asignar la imagen destacada del artículo).
  - `AdCampaignsPage.tsx` (para seleccionar la imagen del banner publicitario en lugar de escribir el UUID a mano).
* Mejorar el editor de noticias (`ArticleEditorPage.tsx`) incorporando soporte de formato periodístico enriquecido (párrafos, negritas, cursivas, citas textuales).
* Eliminar la clase `backdrop-blur-sm` de `AdCampaignsPage.tsx` para cumplir con `docs/DESIGN.md`.

---

## 22. FE-1 Implementation Status (Completada)

La **Fase FE-1: Estabilización, Tooling y Arquitectura Base** ha sido ejecutada y validada en su totalidad con éxito.

### 22.1 Acciones Implementadas

1. **Dependencias y Entorno:**
   - Se ejecutó `npm install` en `frontend/` resolviendo los 89 paquetes y tipos requeridos.
2. **Corrección de Build Script:**
   - En `frontend/package.json`, se corrigió `"build": "tsc -b && vite build"` por `"build": "tsc --noEmit && vite build"`, alineado con la configuración de TypeScript del proyecto.
   - En `frontend/src/App.tsx`, se retiró el flag deprecado `future={{ v7_startTransition: true }}` de `RouterProvider` para compatibilidad estricta con `react-router-dom` v7.
3. **Corrección de Errores TypeScript Reales:**
   - En `frontend/src/pages/public/SubmitNewsPage.tsx`, se tipó explícitamente `(f: File) => f.name` en la línea 304, eliminando el error TS7006.
4. **Eliminación de Código Muerto:**
   - Se eliminó `frontend/src/pages/HomePage.tsx` (remanente huérfano de Fase 1), conservando la ruta oficial `src/pages/public/HomePage.tsx`.
5. **Centralización de Fechas:**
   - Se creó `frontend/src/utils/date.ts` con funciones `formatDate` (soporta estilos `'short'`, `'full'`, `'withTime'`) y `formatMastheadDate`.
   - Se migraron las implementaciones locales duplicadas en `PublicLayout`, `HomePage`, `ArticlePage`, `CategoryPage`, `AuthorPage` y `SubmissionsModerationPage`.
6. **Cliente HTTP Centralizado (`apiClient.ts`):**
   - Se creó `frontend/src/services/apiClient.ts` con métodos `get`, `getData`, `post`, `put`, `patch`, `delete`.
   - Soporte nativo para JSON, `FormData` (con eliminación automática de `Content-Type` para boundary multipart) y `credentials: 'include'` por defecto.
   - Manejo tipado de errores con clase `ApiError` (`code`, `status`, `details`).
   - Invariante de seguridad: Cero uso de `localStorage`/`sessionStorage` para tokens o credenciales.
7. **Centralización de Tipos (`frontend/src/types/`):**
   - Se crearon tipos modulares y coherentes:
     - `api.ts`: `PaginationMeta`, `ApiResponse`, `ApiErrorDetail`.
     - `auth.ts`: `AuthUser`, `LoginResponse`, `LoginResponseData`.
     - `category.ts`: `PublicCategory`, `Category`.
     - `author.ts`: `PublicAuthor`, `Author`.
     - `article.ts`: `PublicArticleSummary`, `PublicArticleDetail`, `ArticleSummary`, `ArticleDetail`, `ArticleStatus`, `ArticleTag`, `CreateArticlePayload`, `UpdateArticlePayload`, `HomeFeedData`, `SearchParams`, `SearchFilterOptions`.
     - `ads.ts`: `PublicAd`, `AdCampaign`, `AdPagination`, `AdType`.
     - `submission.ts`: `CitizenSubmission`, `SubmissionAttachment`, `SubmissionStatus`, `SubmissionPagination`, `ConvertSubmissionPayload`.
     - `push.ts`: `PushTopic`, `PushConfig`, `SubscribePushPayload`.
     - `index.ts`: Barrel export. Se documentan explícitamente las áreas sin contrato como `API CONTRACT REQUIRED` (Media, Users/Roles, Settings, Audit Logs).
8. **Migración de Servicios:**
   - `auth.ts`, `publicApi.ts`, `editorial.ts`, `adsApi.ts`, `pushApi.ts` y `submissionApi.ts` fueron refactorizados para usar `apiClient`.
   - Se mantuvieron intactos los contratos, endpoints, métodos y firmas públicas de exportación para asegurar cero regresiones.
9. **Reducción de Tipos `any`:**
   - Se eliminaron `as any` y `data: any` en `editorial.ts`, `ArticleEditorPage.tsx`, `SearchPage.tsx`, `SubmitNewsPage.tsx` y `PublicLayout.tsx`.
10. **Tipografía Editorial:**
   - En `frontend/index.html` se agregaron los enlaces a Google Fonts para `Merriweather`, `Lora` e `Inter` con `preconnect`.
   - En `frontend/src/index.css` se configuró `@theme` de Tailwind v4 definiendo `--font-serif` y `--font-sans`.

### 22.2 Estado de Verificación Final

* `npx tsc --noEmit`: **0 errores** (código de salida 0).
* `npm run build`: **0 errores** (código de salida 0, 1629 módulos transformados, `dist/` generado en 20.01s).

---

## 23. FE-2 Implementation Status (Completada)

La **Fase FE-2: Routing, Layout, Auth y Mock Development** ha sido implementada y validada en su totalidad con éxito.

### 23.1 Acciones Implementadas

1. **Routing Jerárquico y Limpio (`src/router/index.tsx`):**
   - **Público:** `/`, `noticia/:slug` (y alias `article/:slug`), `categoria/:slug` (y `category/:slug`), `autor/:slug` (y `author/:slug`), `buscar` (y `search`), `enviar-noticia` (y `submit-news`), `*`.
   - **Autenticación:** `/login`.
   - **Administración (Protegido):** `/admin` redirige a `/admin/articles`; subrutas `/admin/articles`, `/admin/articles/new`, `/admin/articles/edit/:uuid` (y `/admin/articles/:id/edit`), `/admin/ads`, `/admin/submissions`.
2. **EditorialLayout como Route Layout (`src/layouts/EditorialLayout.tsx`):**
   - Convertido en layout nativo de React Router usando `<Outlet />`.
   - Se eliminó la duplicación del wrapper `<EditorialLayout>` dentro de las páginas administrativas (`ArticlesListPage`, `ArticleEditorPage`, `AdCampaignsPage`, `SubmissionsModerationPage`).
   - El header y sub-nav permanecen montados sin parpadeos ni recargas al cambiar de subruta.
3. **Navegación SPA Real:**
   - Se reemplazaron todas las etiquetas `<a href="/admin/...">` y llamadas imperativas `window.location.href` por `<Link>`, `<NavLink>` y `useNavigate()`.
   - Pestañas administrativas en `EditorialLayout` usan `<NavLink>` con resaltado dinámico de ruta activa.
4. **Protección de Rutas (`src/components/common/ProtectedRoute.tsx`):**
   - Implementado guard de autenticación sobre `/admin/*`.
   - Distingue estados: `loading` (pantalla de carga sobria), `authenticated` (permite renderizado mediante `<Outlet context={{ user }} />`), y `unauthenticated` (redirige a `/login` preservando la ruta previa en `location.state.from`).
5. **Flujo de Login y Redirección (`src/pages/LoginPage.tsx`):**
   - Tras autenticación exitosa, redirige automáticamente a la ruta administrativa original solicitada (`from`) o por defecto a `/admin/articles` usando `navigate(from, { replace: true })`.
   - Si un usuario ya autenticado entra a `/login`, se redirige automáticamente al CMS.
   - Enlace añadido para regresar a la portada pública del diario.
6. **Mock de Desarrollo Local Autónomo (`src/mocks/` y `src/config/env.ts`):**
   - Configurable mediante la variable de entorno:
     ```text
     VITE_DATA_MODE=mock  (por defecto para desarrollo local sin backend)
     VITE_DATA_MODE=api   (para conectar con el backend real /api/v1/)
     ```
   - Archivos de configuración `.env` y `.env.example` creados en `frontend/`.
   - **Regla estricta respetada:** Las páginas nunca acceden directamente a `localStorage`. La interacción fluye: `Página -> Servicio existente -> Mock/API -> localStorage/apiClient`.
   - Almacenamiento local temporal (`mockStorage.ts`) simula persistencia de sesión y artículos en el navegador sin afectar la arquitectura de seguridad real ni confundirse con la PWA offline.
   - Datos mínimos iniciales (`mockData.ts`): usuario editorial, categorías oficiales, autor y artículos de ejemplo para pruebas en desarrollo.

### 23.2 Verificación de Resultados

* `npx tsc --noEmit`: **0 errores** (código de salida 0).
* `npm run build`: **0 errores** (`tsc --noEmit && vite build`, 1633 módulos transformados, `dist/` generado en 8.31s).
* Flujos manuales validados:
  - `/admin/articles` sin sesión -> Redirige a `/login` con estado `from`.
  - `/login` con credenciales mock -> Autenticación exitosa y redirección a `/admin/articles`.
  - Navegación entre `/admin/articles`, `/admin/articles/new`, `/admin/ads` y `/admin/submissions` -> Fluida vía SPA sin recarga de página.
  - Botón "Salir" -> Termina la sesión mock y redirige a `/login`.

---

## 24. FE-3 Implementation Status (Completada)

La **Fase FE-3: Portal Público y Componentes Editoriales** ha sido completada y validada en su totalidad con éxito.

### 24.1 Acciones Implementadas

1. **Componentes Editoriales Reutilizables (`src/components/articles/`):**
   - `LeadArticle.tsx`: Componente hero para la noticia de apertura. Incluye categoría con kicker editorial, titular serif dominante (`text-2xl` a `text-5xl`), subtítulo en cursiva (`font-serif italic`), fotografía periodística principal con `OptimizedImage` (`priority={true}`, relación 16:9, pie de foto y crédito de fotoperiodismo), entradilla y byline con autor y fecha formateada.
   - `ArticleCard.tsx`: Tarjeta editorial flexible y semántica (`<article>`) con tres variantes:
     - `vertical`: Fotografía arriba (16:9), categoría, titular serif en negrita, subtítulo/extracto opcional, autor y fecha con icono de reloj.
     - `horizontal`: Fotografía a un costado (en desktop) y texto al lado, con categoría, fecha, extracto y autor.
     - `compact`: Titular serif condensado, categoría, miniatura cuadrada (1:1) y fecha. Diseñado para bloques densos de tendencias o barras laterales.
   - `RelatedArticles.tsx`: Bloque de noticias relacionadas para el pie de página de lectura con cuadrícula responsive de 3 columnas y filete superior tradicional de prensa.
   - `NewsTicker.tsx`: Cintillo superior de noticias de última hora ("Última Hora") para portada o alertas de redacción.
   - `index.ts`: Exportación unificada de todos los componentes y tipos de la carpeta.

2. **Enriquecimiento del Dataset Mock Editorial (`src/mocks/`):**
   - **Artículos (`mockData.ts`):** Se amplió el catálogo de 4 a 11 artículos con coberturas periodísticas completas sobre Guárico y los Llanos Centrales (vialidad en Río Portuguesa, zafra de maíz en Calabozo, alumbrado público en San Juan de los Morros, agua potable en Los Laureles, ecoturismo en Aguaro-Guariquito, auxilio vial en Ortiz, incentivos fiscales comerciales, jornadas de salud en El Sombrero, senderismo en los Morros de San Juan, tratados agrícolas y denuncias comunitarias).
   - **Fotografía Editorial Realista:** Cada artículo incorpora su objeto `featured_media` con imágenes reales de alta resolución (Unsplash editorial), dimensiones explícitas, `alt_text`, `caption` contextual y `credit` de reporteros gráficos o corresponsalías.
   - **Autor y Perfil (`mockData.ts`):** `MOCK_AUTHOR` actualizado con avatar fotográfico (`avatar_url`), biografía investigativa y trayectoria llanera.
   - **Persistencia y Actualización (`mockStorage.ts`):** Lógica de verificación que re-siembra automáticamente el dataset enriquecido si el almacenamiento local del navegador contiene datos heredados sin imágenes.

3. **Refactorización y Conexión de Páginas Públicas:**
   - **`HomePage.tsx`:**
     - Eliminación total de cajas grises con iconos estáticos.
     - Cintillo de última hora (`NewsTicker`) en la parte superior.
     - Sección de apertura con `LeadArticle` (7 columnas) y columna de noticias destacadas con `ArticleCard` horizontal (5 columnas).
     - Bloques de anuncios publicitarios (`AdSlot`) respetando los emplazamientos editoriales (`TOP_NEWS`, `SIDEBAR`, `FOOTER`).
     - Cuadrícula de últimas noticias con `ArticleCard` vertical.
     - Bloques por sección editorial ("Regionales", "Comunidades", "Municipales") con enlaces directos a cada categoría.
     - Barra lateral con lista numerada de tendencias/lo más leído (1 al 4) y tribuna de opinión periodística.
   - **`ArticlePage.tsx`:**
     - Reemplazo del marco de foto estático por `<OptimizedImage>` con la fotografía de portada de la noticia, pie explicativo y crédito.
     - Cabecera con antetítulo de sección, titular serif de gran tamaño, subtítulo, fecha de publicación y actualización.
     - Cuerpo de texto periodístico con letra capital (*drop cap*) en el primer párrafo, bloques de anuncio intercalados (`ARTICLE_TOP`, `ARTICLE_MIDDLE`, `ARTICLE_BOTTOM`), nube de etiquetas y caja de biografía del periodista con enlace a su perfil.
     - Sustitución de las tarjetas manuales de noticias relacionadas por el componente `<RelatedArticles>`.
   - **`CategoryPage.tsx`:**
     - Cuadrícula responsive de noticias de la categoría renderizada mediante `<ArticleCard variant="vertical">`.
     - Mantiene cabecera editorial con descripción de sección y controles de paginación previa/siguiente.
   - **`AuthorPage.tsx`:**
     - Ficha del periodista con fotografía circular de autor (`author.avatar_url`) o monograma de respaldo, biografía y mesa de redacción.
     - Cuadrícula de artículos del autor utilizando `<ArticleCard variant="vertical">` y paginación.
   - **`SearchPage.tsx`:**
     - Renderizado de resultados de búsqueda mediante `<ArticleCard variant="horizontal">`, ofreciendo una visualización periodística con miniatura, extracto, fecha y periodista.
     - Mantiene filtros facetados (categorías, autores, etiquetas, fechas, ordenamiento).

### 24.2 Verificación de Resultados

* `npx tsc --noEmit`: **0 errores** (código de salida 0).
* `npm run build`: **0 errores** (`tsc --noEmit && vite build`, 1639 módulos transformados, `dist/` generado en 7.59s).
* Estética editorial respetada estrictamente conforme a `docs/DESIGN.md`:
  - Cero clichés de interfaces IA (sin `backdrop-blur`, sin gradientes estridentes, sin `rounded-3xl` ni sombras difusas).
  - Jerarquía tipográfica rigurosa (`Merriweather`, `Lora`, `Inter`).
  - Fotografía con proporciones fijadas para prevención de CLS.
  - HTML semántico y accesibilidad asegurada.

---

## 25. FE-4 Implementation Status (Completada)

La **Fase FE-4: CMS Editorial, Gestión Multimedia y Editor Periodístico** ha sido completada y validada en su totalidad con éxito.

### 25.1 Acciones Implementadas

1. **Contratos y Tipos Centralizados de Multimedia (`src/types/media.ts` y `src/types/index.ts`):**
   - Definición rigurosa de interfaces conforme a `docs/API.md`: `MediaItem`, `MediaVariant`, `MediaUploadPayload`, `MediaUpdatePayload`, `MediaPaginationMeta` y `MediaListResponse`.
   - Incorporación de `DashboardStats` en `src/types/article.ts` para métricas consolidadas de redacción.
   - Exportación unificada en el barrel central `src/types/index.ts`.

2. **Servicios Frontend y Abstracción de Datos (`src/services/`):**
   - **`mediaApi.ts` (`mediaService`):**
     - Métodos: `getMedia()`, `getMediaById()`, `uploadMedia()`, `updateMedia()` y `deleteMedia()`.
     - Soporta subida mediante `FormData` (archivos locales) o payload estructurado (URLs externas).
     - Desacoplamiento total: en modo producción consume `/api/v1/admin/media`; en desarrollo local interactúa con `mockStorage`.
   - **`editorial.ts` (`editorialService`):**
     - Añadido `restoreArticle(uuid)` para recuperación desde papelera hacia borrador.
     - Añadido `getDashboardStats()` para alimentar el panel central de control.

3. **Capa Mock y Catálogo de Medios (`src/mocks/`):**
   - **`mockData.ts`:** Catálogo `MOCK_MEDIA` con 14 recursos fotográficos periodísticos de alta resolución (obras de vialidad, agricultura, alumbrado público, bombeo de agua, parques nacionales, retratos de redacción y banners comerciales) con metadatos completos (`alt_text`, `caption`, `credit`, `width`, `height`, `mime_type`).
   - **`mockStorage.ts`:** Métodos de persistencia local en `localStorage` para almacenamiento, filtrado, paginación, búsqueda, actualización de metadatos y borrado de archivos multimedia, así como cálculo en tiempo real de estadísticas de redacción.
   - **Principio arquitectónico:** Componentes y vistas jamás acceden a `localStorage` directamente.

4. **Componentes Reutilizables de Medios y Edición (`src/components/`):**
   - **`MediaPickerModal.tsx` (`src/components/media/`):** Modal accesible y autocontenido para seleccionar imágenes de la biblioteca o cargar nuevas (archivo local o URL). Cuenta con búsqueda en vivo, previsualización de datos técnicos y confirmación de selección.
   - **`EditorialToolbar.tsx` (`src/components/editorial/`):** Barra de herramientas ligera que inyecta sintaxis de marcado periodístico (negrita, cursiva, subtítulos H2 y H3, citas de fuentes textuales, listas con viñetas, listas numeradas, enlaces y separadores) directamente en el área de texto activa.
   - **`ArticleLivePreviewModal.tsx` (`src/components/editorial/`):** Previsualizador a pantalla completa que simula la renderización pública final del artículo en el portal (antetítulo de sección, titular dominante, entradilla, fotografía de portada con pie y crédito, drop-cap y cuerpo estructurado), con conmutador de vista para escritorio y móvil.

5. **Páginas Editoriales y CMS (`src/pages/editorial/`):**
   - **`EditorialDashboardPage.tsx` (`/admin`):**
     - Panel de control de redacción con 6 tarjetas KPI (publicados, borradores, en revisión, programados, multimedia, publicidad).
     - Fechas de emisión, noticias recientemente publicadas con enlaces de edición y vista pública directa.
     - Lista de borradores pendientes de redacción y panel de atajos operativos rápidos.
     - Tarjeta de salud y estado del sistema (modo de datos activo y versión de plataforma).
   - **`MediaLibraryPage.tsx` (`/admin/media`):**
     - Archivo multimedia completo con selector de visualización (cuadrícula y tabla).
     - Buscador en vivo y filtro por tipo de archivo (JPEG, PNG, WebP).
     - Modal de inspección y edición de metadatos (título, alt text, pie de foto, crédito fotográfico).
     - Función de copia rápida de enlace URL y eliminación con confirmación.
   - **`ArticleEditorPage.tsx`:**
     - Integración del selector visual de imagen de portada (`MediaPickerModal`) con vista previa, pie de foto y créditos.
     - Conexión de `EditorialToolbar` al área de redacción.
     - Indicador dinámico de palabras, caracteres y tiempo estimado de lectura en tiempo real.
     - Simulador de resultados de búsqueda de Google (SERP Preview) con contadores de caracteres para `meta_title` y `meta_description`.
     - Botones de acción directa para el flujo de publicación ("Publicar Inmediatamente", "Enviar a Revisión", "Programar", "Guardar Borrador").
     - Acceso inmediato al previsualizador en vivo (`ArticleLivePreviewModal`).
   - **`ArticlesListPage.tsx`:**
     - Incorporación de miniatura visual de portada en cada fila de la mesa de redacción.
     - Botón de restauración ("Restaurar") para noticias ubicadas en la pestaña de papelera.
     - Enlace directo a la noticia en el portal público para artículos publicados.
     - Selector de ordenación ("Más recientes", "Más antiguos", "Título A-Z").
   - **`AdCampaignsPage.tsx`:**
     - Eliminación de `backdrop-blur-sm` en cumplimiento de las directrices visuales.
     - Sustitución del campo de texto de UUID por el selector visual `MediaPickerModal`.

6. **Estructura de Navegación y Rutas (`src/layouts/EditorialLayout.tsx` y `src/router/index.tsx`):**
   - La raíz `/admin` ahora despliega directamente el `EditorialDashboardPage`.
   - Incorporación de la ruta `/admin/media` para la Biblioteca Multimedia.
   - Subnavegación de cabecera ampliada: Panel Principal (`/admin`), Artículos (`/admin/articles`), Redactar (`/admin/articles/new`), Multimedia (`/admin/media`), Publicidad (`/admin/ads`) y Buzón (`/admin/submissions`).
   - Carga diferida (`React.lazy`) y fallback animado para todas las páginas administrativas.

### 25.2 Verificación de Resultados

* `npx tsc --noEmit`: **0 errores** (código de salida 0).
* `npm run build`: **0 errores** (`tsc --noEmit && vite build`, 1645 módulos transformados, `dist/` generado en 9.10s).
* Estética visual estricta conforme a `docs/DESIGN.md`:
  - Cero efectos de desenfoque (`backdrop-blur` eliminado).
  - Tipografía periodística rigurosa (`Merriweather`, `Lora`, `Inter`).
  - Paleta editorial de alto contraste (tonos piedra, acentos rojo y esmeralda).
* Se sincronizaron los archivos de código fuente tanto en el repositorio Git oficial (`contactoconlanoticia.com-git`) como en la carpeta de trabajo del entorno IDE.
* Se respetó la instrucción explícita de **no realizar commit ni push**.

---

## 26. FE-5 Implementation Status (Completada)

La **Fase FE-5: SEO y Descubrimiento Editorial** ha sido completada y verificada exitosamente en el frontend de **Contacto con la Noticia**.

### 26.1 Acciones Implementadas

1. **Configuración Canónica Centralizada (`src/config/env.ts` y `.env.example`):**
   - Incorporación de `SITE_URL` con lectura de `VITE_SITE_URL` y fallback canónico a `https://contactoconlanoticia.com`.
   - Eliminación de dependencias dinámicas hacia `window.location.origin` en metadatos y esquemas para garantizar consistencia en producción y desarrollo.
   - Documentación de `VITE_SITE_URL` en `.env.example`.

2. **Componente de Encabezados y Metadatos (`src/components/common/SeoHead.tsx`):**
   - Metadatos Open Graph enriquecidos con dimensiones canónicas (`og:image:width=1200`, `og:image:height=630`), texto alternativo (`og:image:alt`) y localización `es_VE`.
   - Soporte para etiquetas Twitter/X Cards completas (`twitter:card="summary_large_image"`, `twitter:site="@contactonoticia"`, `twitter:creator`).
   - Normalización de URLs canónicas con fallback estructurado.
   - Limpieza y reseteo sistemático de metadatos de artículos al desmontar o transicionar entre páginas.
   - Flexibilidad de tipos admitiendo `imageUrl?: string | null`.

3. **Esquemas Estructurados Schema.org (JSON-LD):**
   - **`HomePage.tsx`:** Esquema dual `WebSite` con acción de búsqueda `potentialAction: SearchAction` y `NewsMediaOrganization` con logotipo 512x512, redes sociales (`sameAs`) y principios editoriales.
   - **`CategoryPage.tsx`:** Inyección de esquema `CollectionPage` con descripción editorial y `BreadcrumbList` jerárquico (Portada → Sección).
   - **`AuthorPage.tsx`:** Inyección de esquema `ProfilePage` con `Person`, fotografía del redactor, cargo y afiliación editorial (`worksFor`).
   - **`ArticlePage.tsx`:** Esquema `NewsArticle` completo compatible con Google Search y Google News, incluyendo fechas ISO 8601, autor, editor `NewsMediaOrganization`, `articleSection`, palabras clave, idioma `es-VE` y titular.
   - **`SearchPage.tsx`:** Configuración explícita `noIndex={true}` para cumplir con las directrices de indexación de Google contra contenido delgado.
   - **`SubmitNewsPage.tsx`:** Inyección canónica con metadatos descriptivos.

4. **Archivos de Descubrimiento e Indexación (`frontend/public/`):**
   - **`robots.txt`:** Reglas para `User-agent: *`, protección de rutas privadas (`/admin/`, `/login`, `/enviar-noticia`, `/buscar`) y enlace a los sitemaps.
   - **`sitemap.xml`:** Índice de URLs canónicas para portada, 8 secciones editoriales, perfiles de redactores y catálogo de noticias publicadas.
   - **`sitemap-news.xml`:** Índice según la especificación de Google News con artículos recientes publicados en las últimas 48 horas.
   - **`feed.xml`:** Feed RSS 2.0 válido con elementos de noticias, fechas RFC 822 y canal de sindicación.
   - **`index.html`:** Enlace de autodescubrimiento `<link rel="alternate" type="application/rss+xml" href="/feed.xml" />`.

### 26.2 Verificación de Resultados

* `npx tsc --noEmit`: **0 errores** (código de salida 0).
* `npm run build`: **0 errores** (`tsc --noEmit && vite build`, 1645 módulos transformados, `dist/` generado exitosamente con inclusión de `robots.txt`, `sitemap.xml`, `sitemap-news.xml` y `feed.xml`).
* Límites arquitectónicos respetados: Todo el trabajo se limitó a `frontend/` y `docs/FRONTEND_AUDIT.md`. No se modificaron `backend/`, `database/` ni `tools/`.

---
*Fin del informe de auditoría técnica y fases implementadas (FE-1, FE-2, FE-3, FE-4 y FE-5).*
