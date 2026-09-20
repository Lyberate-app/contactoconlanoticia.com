# LYBERATE

## Master Engineering Specification

**Proyecto inicial:** Contacto con la Noticia  
**Plataforma:** Lyberate  
**Objetivo:** reconstrucción desde cero de un portal de noticias profesional, rápido, seguro, mantenible y preparado para reutilizarse en futuros medios.

---

# 1. MISIÓN

Lyberate es una plataforma editorial reutilizable.

Contacto con la Noticia será la primera implementación real.

No construir un sitio aislado con funcionalidades específicas imposibles de reutilizar.

Construir un núcleo que pueda posteriormente alimentar:

* Contacto con la Noticia
* otros periódicos
* portales regionales
* medios digitales
* futuros clientes

Separar claramente:

* plataforma;
* sitio;
* contenido;
* usuarios;
* configuración;
* identidad visual;
* infraestructura;
* integraciones.

---

# 2. REGLA MÁS IMPORTANTE

NO construir todo el proyecto en una sola operación.

Trabajar exclusivamente mediante las fases definidas en `PHASES.md`.

Cuando se entregue un prompt de fase:

1. leer `MASTER.md`;
2. leer únicamente la documentación necesaria;
3. inspeccionar únicamente los archivos relevantes;
4. implementar exclusivamente la fase solicitada;
5. ejecutar las pruebas correspondientes;
6. detenerse.

NO adelantar fases.

NO implementar funcionalidades futuras.

NO refactorizar partes no relacionadas.

---

# 3. CONSERVACIÓN DE TOKENS Y CONTEXTO

El contexto y el razonamiento son recursos limitados.

La eficiencia es una prioridad.

Evitar:

* análisis innecesariamente extensos;
* repetir decisiones ya documentadas;
* volver a explicar toda la arquitectura;
* explorar múltiples alternativas sin necesidad;
* generar código que todavía no se necesita;
* instalar dependencias innecesarias;
* crear abstracciones prematuras;
* refactorizar por gusto;
* implementar funcionalidades "por si acaso".

Antes de modificar:

1. determinar qué necesita cambiar;
2. localizar archivos afectados;
3. seleccionar la solución mínima correcta;
4. identificar las pruebas necesarias.

Después implementar.

Para tareas pequeñas, pensar y responder de forma proporcional a la tarea.

---

# 4. BUILD LESS, BUILD RIGHT

La cantidad de código no determina la calidad.

Priorizar:

* claridad;
* seguridad;
* mantenibilidad;
* rendimiento;
* UX;
* estabilidad;
* ausencia de regresiones.

Preferir una solución pequeña y correcta sobre una arquitectura excesivamente abstracta.

---

# 5. NO CAMBIAR LA ARQUITECTURA SIN MOTIVO

La arquitectura definida aquí es la base del proyecto.

Si aparece un problema que parece requerir modificarla:

1. comprobar primero si puede resolverse dentro de la arquitectura actual;
2. si no es posible, explicar brevemente el problema;
3. proponer el cambio;
4. no ejecutarlo silenciosamente.

---

# 6. STACK

## Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* React Router
* lucide-react

## Backend

* PHP 8.x
* REST API
* PDO
* MySQL

## Infraestructura

Compatible con:

* XAMPP;
* Docker;
* Node.js.

El proyecto debe documentar exactamente qué servicio utiliza cada entorno.

No mezclar XAMPP y Docker sin una razón clara.

---

# 7. ESTRUCTURA

```text
LYBERATE/
│
├── MASTER.md
├── PHASES.md
├── ARCHITECTURE.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── router/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── public/
│   │   └── index.php
│   ├── app/
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── Middleware/
│   │   ├── Database/
│   │   ├── Validation/
│   │   └── Helpers/
│   ├── config/
│   ├── routes/
│   └── .htaccess
│
├── database/
│   ├── migrations/
│   └── seeds/
│
├── tools/
│   └── migration/
│
└── docs/
    ├── API.md
    ├── SECURITY.md
    ├── DEPLOYMENT.md
    ├── DESIGN.md
    └── MIGRATION.md
```

---

# 8. FRONTEND / BACKEND

El frontend y backend deben estar separados físicamente.

React NO debe conectarse directamente a MySQL.

React se comunica exclusivamente con la API.

El backend es responsable de:

* autenticación;
* autorización;
* validación;
* acceso a datos;
* seguridad;
* reglas de negocio.

---

# 9. API

Utilizar:

```text
/api/v1/
```

Todas las respuestas serán JSON.

Éxito:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

Utilizar códigos HTTP correctos.

---

# 10. BASE DE DATOS

MySQL.

Utilizar:

* migrations;
* foreign keys;
* índices;
* constraints;
* timestamps;
* prepared statements.

No crear tablas sin necesidad real.

---

# 11. UUID

Preparar UUID para entidades importantes:

* tenant_uuid;
* site_uuid;
* user_uuid;
* article_uuid;
* media_uuid;
* campaign_uuid.

Los UUID no sustituyen autorización.

---

# 12. AUTENTICACIÓN

Implementar:

* password hashing;
* session management;
* TOTP 2FA;
* recovery codes;
* rate limiting;
* brute-force protection;
* session revocation.

Passwords:

Nunca:

* plaintext;
* MD5;
* SHA1;
* hashes débiles.

Utilizar `password_hash()` y `password_verify()`.

---

# 13. SESIONES

No utilizar localStorage como almacén principal de autenticación.

NO almacenar en localStorage:

* passwords;
* tokens sensibles;
* TOTP secrets;
* recovery codes;
* credenciales;
* permisos;
* secretos.

Preferir cookies:

* HttpOnly;
* Secure;
* SameSite apropiado.

localStorage solamente para preferencias no sensibles.

---

# 14. PASSKEYS

Preparar WebAuthn/Passkeys.

La aplicación jamás debe:

* recibir biometría;
* almacenar huellas;
* transmitir biometría.

La biometría o PIN del dispositivo pertenece al autenticador del sistema operativo.

El backend verifica la prueba criptográfica WebAuthn.

---

# 15. RBAC

Roles:

```text
SUPER_ADMIN
SITE_ADMIN
EDITOR
JOURNALIST
AD_MANAGER
```

Permisos:

```text
articles.create
articles.edit
articles.publish
articles.delete
media.upload
media.delete
users.create
users.edit
ads.manage
settings.edit
audit.view
```

Toda autorización se valida en backend.

Nunca confiar en roles enviados por frontend.

---

# 16. TENANT ISOLATION

La arquitectura debe soportar:

```text
Tenant
└── Site
    ├── Users
    ├── Articles
    ├── Media
    ├── Categories
    └── Campaigns
```

El backend debe comprobar la pertenencia.

Nunca confiar únicamente en `tenant_id` o `site_id` proporcionados por el cliente.

---

# 17. SEGURIDAD API

Implementar:

* validation;
* prepared statements;
* PDO;
* CORS restrictivo;
* CSRF donde corresponda;
* rate limiting;
* authentication;
* authorization;
* consistent error handling.

Nunca exponer:

* stack traces;
* credentials;
* tokens;
* passwords;
* secrets.

---

# 18. WEB SECURITY

Preparar:

* HTTPS;
* CSP;
* HSTS;
* X-Content-Type-Options;
* Referrer-Policy;
* Permissions-Policy;
* Secure cookies;
* SameSite;
* XSS protection;
* upload validation.

No utilizar `Access-Control-Allow-Origin: *` para endpoints autenticados.

---

# 19. UPLOAD SECURITY

Validar:

* MIME real;
* extensión;
* tamaño;
* dimensiones;
* contenido.

Generar nombres en servidor.

Nunca permitir ejecución de scripts en uploads.

---

# 20. AUDIT

Registrar:

* login;
* login failures;
* 2FA;
* user changes;
* permission changes;
* article publication;
* deletion;
* configuration changes;
* security events;
* session revocation.

Nunca almacenar secretos dentro de logs.

---

# 21. CMS EDITORIAL

Estados:

```text
DRAFT
PENDING_REVIEW
SCHEDULED
PUBLISHED
ARCHIVED
TRASH
```

Debe permitir:

* crear;
* editar;
* revisar;
* programar;
* publicar;
* archivar;
* eliminar;
* restaurar;
* versionar.

---

# 22. EDITOR DE NOTICIAS

Campos:

* title;
* subtitle;
* featured image;
* author;
* category;
* tags;
* content;
* slug;
* SEO title;
* SEO description;
* OG image;
* publication date;
* modification date;
* status.

---

# 23. MEDIA ENGINE

Conservar originales cuando corresponda.

Generar variantes:

```text
320
640
960
1440
```

Preferir:

* AVIF;
* WebP.

Utilizar:

* srcset;
* sizes;
* lazy loading;
* decoding async;
* width;
* height.

Objetivos:

* menor transferencia;
* menor CLS;
* carga rápida;
* buena experiencia en conexiones lentas.

---

# 24. NEWS ENGINE

Cada noticia publicada debe generar automáticamente:

* URL única;
* slug;
* canonical;
* metadata;
* Open Graph;
* JSON-LD;
* sitemap entry;
* News Sitemap entry.

Structured data:

```text
NewsArticle
```

cuando corresponda.

Debe representar fielmente el contenido visible.

---

# 25. GOOGLE NEWS READINESS

Lyberate debe estar técnicamente preparado para sitios que quieran ser rastreados y considerados por Google News.

Esto NO garantiza inclusión ni posicionamiento.

Preparar:

```text
/sitemap.xml
/sitemap-news.xml
/robots.txt
```

Las noticias deben ser accesibles mediante enlaces rastreables.

El contenido principal no debe depender exclusivamente de JavaScript para existir.

Las URLs deben ser únicas y estables.

No modificar artificialmente fechas.

No crear metadata engañosa.

---

# 26. RSS

Preparar arquitectura para RSS/Atom.

Los feeds podrán contener:

* title;
* URL;
* date;
* author;
* summary;
* content cuando corresponda.

---

# 27. SEO

Cada página pública debe poder generar:

* title;
* meta description;
* canonical;
* Open Graph;
* Twitter/X metadata;
* JSON-LD.

---

# 28. PUBLIC PORTAL

Debe sentirse como un periódico digital real.

No como:

* SaaS;
* dashboard;
* app genérica;
* landing de startup.

Jerarquía:

```text
Header
Navigation
Última hora
Main story
Secondary stories
Latest news
Trending
Advertising
Footer
```

---

# 29. DISEÑO HECHO A MANO

CRÍTICO.

El producto final NO debe parecer generado automáticamente por IA.

Evitar:

* exceso de cards;
* bordes redondeados en todo;
* glassmorphism;
* gradientes decorativos;
* sombras excesivas;
* botones gigantes;
* colores innecesarios;
* animaciones constantes;
* iconos decorativos;
* layouts SaaS;
* dashboards genéricos;
* títulos absurdamente grandes;
* componentes repetitivos sin jerarquía.

Priorizar:

* lectura;
* jerarquía editorial;
* espacio;
* ritmo;
* contraste;
* accesibilidad;
* comodidad;
* velocidad.

El resultado debe sentirse diseñado específicamente para el medio.

---

# 30. IDENTIDAD

La plataforma debe permitir que cada sitio tenga su propia identidad.

Contacto con la Noticia debe conservar su personalidad editorial.

No imponer una estética tecnológica genérica.

El objetivo es:

> mismo medio, plataforma moderna.

---

# 31. RESPONSIVE

Desktop:

* jerarquía editorial;
* columnas cuando aporten valor;
* navegación completa.

Tablet:

* redistribución.

Mobile:

* lectura cómoda;
* navegación simple;
* controles táctiles;
* imágenes optimizadas.

No reducir simplemente desktop.

---

# 32. ANIMACIONES

Utilizar animación únicamente cuando tenga función.

Permitido:

* feedback;
* loading;
* navegación;
* expansión;
* pequeñas transiciones.

Evitar:

* parallax;
* animaciones constantes;
* efectos llamativos.

---

# 33. ICONOS

Utilizar lucide-react.

Los iconos deben tener propósito.

No usar emojis como iconos profesionales.

---

# 34. PUBLICIDAD

Preparar:

```text
HEADER_BANNER
TOP_NEWS
SIDEBAR
ARTICLE_TOP
ARTICLE_MIDDLE
ARTICLE_BOTTOM
FOOTER
```

Campaña:

* company;
* name;
* type;
* location;
* start;
* end;
* URL;
* image;
* active.

Preparar posteriormente métricas.

---

# 35. SEARCH

Buscar por:

* title;
* content;
* author;
* category;
* tags;
* date.

No introducir motores externos hasta que sean necesarios.

---

# 36. USER SUBMISSIONS

Preparar:

"Envíanos tu noticia".

Datos posibles:

* name;
* phone/email;
* location;
* title;
* description;
* photos;
* video;
* message.

Nunca publicar automáticamente.

Debe entrar como contenido pendiente.

---

# 37. PWA

Preparar:

* manifest;
* service worker;
* app shell;
* offline fallback;
* static cache;
* recently viewed content.

No intentar hacer todo el periódico offline.

---

# 38. PUSH NOTIFICATIONS

Preparar Web Push.

Las notificaciones deben:

* requerir consentimiento;
* ser discretas;
* ser relevantes;
* evitar spam.

Optimizar imágenes.

---

# 39. PERFORMANCE

Priorizar:

* code splitting;
* lazy routes;
* image optimization;
* caching;
* compression;
* minification;
* pagination;
* database indexes;
* evitar N+1;
* respuestas API pequeñas.

No realizar optimizaciones complejas sin medir.

---

# 40. HEALTH

Endpoint:

```text
GET /api/v1/health
```

La respuesta pública debe ser mínima.

La versión autenticada podrá posteriormente informar:

* version;
* API;
* database;
* cache;
* internal health.

Nunca secretos.

---

# 41. ENVIRONMENT

Usar `.env`.

Repositorio:

```text
.env.example
```

Nunca subir secretos reales.

---

# 42. BACKUPS

Preparar:

* database backups;
* media backups;
* restore procedures.

Un backup que nunca fue probado no debe considerarse completamente confiable.

---

# 43. MIGRATION ENGINE

La migración es un componente independiente.

Debe vivir en:

```text
tools/migration/
```

No mezclarlo con el runtime normal del CMS.

Debe poder migrar contenido histórico del sistema anterior de Contacto con la Noticia.

Migrar cuando exista:

### Articles

* title;
* subtitle;
* content;
* publication date;
* modification date;
* author;
* category;
* tags;
* slug;
* featured image;
* inline images;
* SEO metadata.

### Authors

* name;
* slug;
* biography;
* photo.

### Categories

* name;
* slug;
* description.

### Tags

* name;
* slug.

### Media

* original;
* MIME;
* dimensions;
* alt;
* caption;
* credit;
* relationships.

---

# 44. MIGRATION SAFETY

El Migration Engine debe soportar:

```text
--dry-run
--execute
```

Dry-run:

* no modifica datos;
* genera reporte;
* muestra errores;
* muestra warnings;
* detecta duplicados;
* detecta conflictos.

La migración real solo se ejecuta después de revisar el dry-run.

---

# 45. MIGRATION IDEMPOTENCY

Una migración repetida no debe duplicar contenido.

Mantener mapping:

```text
source_id
    ↓
article_uuid
```

No identificar artículos únicamente por título.

---

# 46. URL MIGRATION

Mantener:

```text
old_url
new_url
status
```

Cuando cambie una URL:

* generar 301;
* evitar cadenas;
* conservar destino correcto.

---

# 47. MEDIA MIGRATION

Proceso:

```text
source image
↓
download
↓
validate
↓
deduplicate
↓
store original
↓
generate variants
```

No dejar el nuevo portal dependiendo de las imágenes del sistema anterior cuando sea posible migrarlas.

---

# 48. CONTENT TRANSFORMATION

El HTML antiguo debe sanitizarse y transformarse.

Preservar:

* paragraphs;
* headings;
* links;
* images;
* lists;
* emphasis;
* editorial content.

Eliminar contenido ejecutable o inseguro.

No destruir contenido editorial innecesariamente.

---

# 49. MIGRATION REPORTS

Crear:

```text
tools/migration/reports/
```

Con:

```text
migration-summary.json
warnings.csv
errors.csv
redirects.csv
missing-media.csv
duplicate-content.csv
```

---

# 50. INCREMENTAL MIGRATION

La arquitectura debe permitir:

```text
Initial migration
       ↓
Development
       ↓
New content continues
       ↓
Delta migration
       ↓
Final verification
       ↓
Production
```

No depender exclusivamente de una única migración inicial.

---

# 51. MIGRATION VALIDATION

Después de migrar verificar:

* artículos;
* autores;
* categorías;
* tags;
* imágenes;
* fechas;
* slugs;
* redirects;
* HTML;
* SEO;
* canonical;
* sitemap;
* News Sitemap.

Realizar muestras manuales.

---

# 52. CRM

NO implementar inicialmente.

Futuro:

```text
EspoCRM
   ↓
Integration API
   ↓
Lyberate
```

Podrá incluir:

* site_uuid;
* version;
* status;
* last_seen;
* health;
* HMAC;
* rotatable credentials.

No desarrollar CRM hasta la fase final.

---

# 53. DEPENDENCIAS

Antes de instalar:

1. comprobar si ya existe una solución;
2. comprobar necesidad;
3. evaluar impacto;
4. instalar únicamente si aporta valor real.

No instalar librerías por moda.

---

# 54. DOCUMENTACIÓN

Mantener:

```text
MASTER.md
PHASES.md
ARCHITECTURE.md

docs/API.md
docs/SECURITY.md
docs/DEPLOYMENT.md
docs/DESIGN.md
docs/MIGRATION.md
```

Documentación breve y útil.

---

# 55. TESTING

Cada fase debe probar lo que modifica.

Prioridad:

1. funcionalidad modificada;
2. integración afectada;
3. build;
4. regresiones relevantes.

No ejecutar pruebas irrelevantes únicamente por rutina.

---

# 56. FINAL DE TAREA

El reporte debe ser breve:

```text
IMPLEMENTADO
- ...

ARCHIVOS MODIFICADOS
- ...

TESTS
- ...

PROBLEMAS
- ...

FUTURO
- ...
```

No repetir la arquitectura.

No repetir este documento.

No incluir explicaciones innecesarias.

---

# 57. PRINCIPIO FINAL

La tecnología debe permanecer detrás del producto.

El usuario debe percibir:

* una página rápida;
* cómoda;
* profesional;
* confiable;
* editorial;
* hecha específicamente para el medio.

No debe percibir una colección de componentes generados automáticamente.

La complejidad técnica existe para mejorar:

* seguridad;
* rendimiento;
* mantenimiento;
* publicación;
* SEO;
* descubrimiento;
* experiencia.

Construir menos.

Construir correctamente.

Construir para durar.
