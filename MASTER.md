# LYBERATE

## MASTER PROJECT DOCUMENTATION

**Proyecto:** Lyberate  
**Primer sitio:** Contacto con la Noticia  
**Dominio objetivo:** contactoconlanoticia.com  
**Tipo:** Plataforma editorial / CMS / Portal de noticias multi-tenant  
**Estado:** En desarrollo  
**Documento:** Master Architecture & Project Bible  

---

# 1. PROPÓSITO DEL PROYECTO

Lyberate es una plataforma reutilizable para crear, administrar y desplegar portales de noticias y sitios editoriales para diferentes clientes.

El primer sitio que utilizará la plataforma será:

**Contacto con la Noticia**

Lyberate no debe construirse como una aplicación exclusiva para un único periódico.

La arquitectura debe permitir que posteriormente puedan existir múltiples clientes:

```text
LYBERATE
│
├── Tenant A
│   └── Site A
│
├── Tenant B
│   ├── Site B
│   └── Site C
│
└── Tenant C
    └── Site D
```

Cada tenant/site debe mantenerse aislado mediante reglas de backend.

El proyecto debe ser:

* profesional;
* seguro;
* mantenible;
* reutilizable;
* escalable de forma razonable;
* rápido;
* accesible;
* preparado para SEO;
* preparado técnicamente para Google News;
* compatible con infraestructura convencional;
* sencillo de desplegar;
* documentado;
* libre de dependencias innecesarias.

---

# 2. REGLA FUNDAMENTAL

Este documento constituye la fuente principal de verdad arquitectónica del proyecto.

Los agentes de IA que trabajen sobre este repositorio deben:

1. leer `MASTER.md`;
2. identificar la fase actual;
3. inspeccionar el código existente;
4. implementar únicamente el alcance de esa fase;
5. verificar lo realizado;
6. actualizar la documentación;
7. detenerse.

La IA **implementa la arquitectura definida**.

La IA no debe rediseñar la arquitectura por iniciativa propia.

---

# 3. REGLAS CONTRA LA REINTERPRETACIÓN

No cambiar por iniciativa propia:

* React por otro framework;
* Vite por otro bundler;
* TypeScript por JavaScript;
* Tailwind por otro sistema CSS;
* PHP por Node.js;
* MySQL por MongoDB;
* REST por GraphQL;
* Apache/Nginx por un runtime Node obligatorio;
* arquitectura multi-tenant por una aplicación single-tenant;
* UUID por IDs numéricos como identificadores principales;
* cookies seguras por tokens sensibles en `localStorage`.

Si existe un problema real que requiera modificar una decisión:

1. identificar el problema;
2. explicar la causa;
3. documentar la decisión afectada;
4. proponer una alternativa;
5. indicar impacto;
6. esperar aprobación.

No realizar el cambio automáticamente.

---

# 4. STACK OFICIAL

## Frontend

* React 19+
* TypeScript
* Vite
* Tailwind CSS
* React Router
* lucide-react

## Backend

* PHP 8.x
* PHP nativo/modular
* REST API
* PDO
* MySQL

## Herramientas de desarrollo

* Node.js
* npm o pnpm
* Git
* Composer
* XAMPP y/o Docker según necesidad

---

# 5. DECISIÓN CRÍTICA: NODE.JS

## Node.js es DEVELOPMENT/BUILD-TIME ONLY

Node.js forma parte del entorno de desarrollo del frontend.

Se utilizará para:

* instalar dependencias;
* ejecutar Vite;
* ejecutar el servidor de desarrollo;
* ejecutar TypeScript;
* ejecutar herramientas frontend;
* ejecutar tests/lint del frontend;
* construir el frontend de producción.

Ejemplo:

```text
Node.js
   ↓
npm / pnpm
   ↓
Vite
   ↓
React + TypeScript
   ↓
frontend/dist/
```

## Node.js NO es runtime obligatorio de producción

El servidor de producción **no debe requerir un proceso Node.js permanente**.

No se debe requerir:

* `npm run dev`;
* `vite preview`;
* PM2;
* Node server;
* reverse proxy hacia un servidor Node;
* un proceso Node permanente;
* Express;
* Next.js server;
* cualquier runtime Node para servir el frontend.

React será compilado.

El resultado será contenido estático:

```text
frontend/dist/
├── index.html
├── assets/
└── ...
```

Ese contenido será servido directamente por Apache o Nginx.

---

# 6. ARQUITECTURA DE PRODUCCIÓN

La arquitectura objetivo es:

```text
                         INTERNET
                            │
                           HTTPS
                            │
                    ┌───────▼────────┐
                    │ Apache / Nginx │
                    └───────┬────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
       React Static Build             PHP 8.x
       frontend/dist/                 REST API
                                          │
                                      /api/v1/*
                                          │
                                          ▼
                                         PDO
                                          │
                                          ▼
                                        MySQL
```

El frontend y backend permanecen separados físicamente dentro del proyecto.

En producción pueden convivir bajo el mismo dominio:

```text
https://contactoconlanoticia.com/
https://contactoconlanoticia.com/api/v1/
```

---

# 7. OBJETIVO DE DESPLIEGUE UNIVERSAL

La plataforma debe poder desplegarse en infraestructura convencional.

Requisitos esperados:

```text
Apache o Nginx
PHP 8.x
MySQL
HTTPS
```

Node.js únicamente será necesario en el proceso de desarrollo/build, salvo que el build ya haya sido generado previamente.

Por lo tanto, un VPS convencional puede ejecutar el sistema sin tener Node.js instalado permanentemente.

"Universal" no significa compatible con absolutamente cualquier hosting.

El proveedor debe soportar al menos:

* PHP 8.x;
* MySQL;
* Apache/Nginx;
* rewrite rules;
* HTTPS.

La plataforma no debe depender de un proveedor específico.

---

# 8. FRONTEND

El frontend será una aplicación React con TypeScript.

Responsabilidades:

* interfaz pública;
* CMS;
* navegación;
* formularios;
* consumo de API;
* manejo de estado de interfaz;
* validaciones de experiencia de usuario;
* rendering de contenido;
* responsive design;
* accesibilidad.

El frontend nunca debe asumir que una validación visual equivale a autorización.

Toda autorización real ocurre en backend.

---

# 9. BACKEND

El backend será PHP 8.x modular.

El backend será responsable de:

* autenticación;
* autorización;
* multi-tenancy;
* validación;
* acceso a base de datos;
* lógica de negocio;
* artículos;
* usuarios;
* media;
* publicidad;
* configuración;
* auditoría;
* integraciones;
* API.

La API utilizará:

```text
/api/v1/
```

Las respuestas serán JSON.

Los códigos HTTP deben utilizarse correctamente.

---

# 10. ESTRUCTURA BASE

La estructura objetivo es:

```text
LYBERATE/
│
├── MASTER.md
├── README.md
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
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── public/
│   │   └── index.php
│   │
│   ├── app/
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── Middleware/
│   │   ├── Database/
│   │   ├── Validation/
│   │   └── Helpers/
│   │
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
```

No colocar el backend dentro de:

```text
frontend/public/
```

---

# 11. VARIABLES DE ENTORNO

Nunca almacenar secretos en Git.

Ejemplos:

```text
.env
.env.local
.env.production
```

Debe existir:

```text
.env.example
```

sin secretos reales.

Nunca almacenar:

* passwords;
* API keys;
* tokens;
* secretos de sesión;
* secretos HMAC;
* credenciales MySQL;
* credenciales EspoCRM;
* credenciales SMTP;
* certificados privados.

---

# 12. MULTI-TENANT

Modelo conceptual:

```text
Tenant
   ↓
Site
   ↓
Users
   ↓
Content
```

## Tenant

Representa una organización o cliente.

## Site

Representa un sitio concreto perteneciente a un tenant.

## User

Representa una persona que utiliza el sistema.

Entidades principales utilizarán UUID:

```text
tenant_uuid
site_uuid
user_uuid
article_uuid
media_uuid
campaign_uuid
```

El UUID no constituye autorización.

---

# 13. AISLAMIENTO MULTI-TENANT

Todo acceso a datos debe verificar:

```text
usuario
+
tenant
+
site
+
permiso
```

Nunca confiar únicamente en:

```text
tenant_uuid
site_uuid
role
permission
```

enviados por el navegador.

El backend debe determinar y verificar el contexto autorizado.

Un usuario de un tenant no debe poder consultar ni modificar datos de otro tenant.

---

# 14. ROLES

Roles iniciales:

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

El RBAC completo se implementará en la fase correspondiente.

---

# 15. AUTENTICACIÓN

Las sesiones utilizarán cookies seguras.

Configuración esperada:

```text
HttpOnly
Secure en producción
SameSite apropiado
```

No almacenar credenciales ni tokens sensibles en `localStorage`.

`localStorage` solamente podrá utilizarse para preferencias no sensibles.

Las contraseñas utilizarán:

```php
password_hash()
password_verify()
```

Preferir Argon2id cuando esté disponible.

Nunca:

```text
MD5
SHA1
texto plano
```

---

# 16. 2FA

El sistema contemplará:

* TOTP;
* códigos de recuperación;
* protección de intentos;
* recuperación segura;
* revocación cuando corresponda.

Se implementará en la fase de autenticación.

No implementar durante fases anteriores.

---

# 17. PASSKEYS / WEBAUTHN

La arquitectura contempla WebAuthn/Passkeys.

Principios:

* la aplicación nunca recibe datos biométricos;
* el dispositivo maneja huella, Face ID, PIN u otro mecanismo;
* el servidor verifica el challenge WebAuthn;
* un usuario puede registrar múltiples passkeys;
* cada passkey puede revocarse individualmente.

La implementación corresponde a la fase de autenticación.

---

# 18. SEGURIDAD DE API

Implementar progresivamente:

* autenticación;
* autorización;
* validación;
* PDO prepared statements;
* CORS restrictivo;
* CSRF cuando corresponda;
* rate limiting;
* brute-force protection;
* manejo seguro de errores;
* API versioning;
* session revocation;
* audit logging.

No devolver errores internos al cliente.

---

# 19. HEADERS

Producción debe contemplar:

```text
HTTPS
HSTS
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
```

Los valores concretos deben adaptarse a los recursos reales utilizados por el sitio.

No copiar políticas CSP arbitrarias sin comprobar que son compatibles.

---

# 20. UPLOADS

Los archivos subidos deben validarse mediante:

* MIME real;
* extensión;
* tamaño;
* dimensiones cuando sea imagen;
* nombre generado por servidor;
* ubicación segura.

Nunca permitir uploads ejecutables.

Nunca confiar solamente en la extensión enviada por el usuario.

---

# 21. AUDITORÍA

Registrar eventos relevantes:

* login exitoso;
* login fallido;
* fallos de 2FA;
* cambios de usuario;
* creación/modificación de usuarios;
* publicación;
* eliminación;
* eventos de seguridad;
* revocación de sesiones;
* cambios de configuración.

No registrar:

* passwords;
* tokens;
* secretos;
* credenciales.

---

# 22. HEALTH CHECKS

Endpoint mínimo:

```text
GET /api/v1/health
```

Debe devolver únicamente información necesaria.

Los diagnósticos detallados deben requerir autenticación.

---

# 23. CMS EDITORIAL

El CMS administrará:

* artículos;
* autores;
* categorías;
* tags;
* media;
* publicación;
* programación;
* usuarios;
* permisos;
* publicidad;
* configuración.

Estados editoriales:

```text
DRAFT
PENDING_REVIEW
SCHEDULED
PUBLISHED
ARCHIVED
TRASH
```

---

# 24. ARTÍCULOS

Campos conceptuales:

```text
article_uuid
title
subtitle
excerpt
content
slug
author
category
tags
featured_image
datePublished
dateModified
status
seo metadata
relations
created_at
updated_at
```

Es obligatorio distinguir:

```text
datePublished
dateModified
```

La fecha de modificación no debe sustituir la fecha original de publicación.

---

# 25. PORTAL PÚBLICO

Categorías iniciales:

```text
Regionales
Sucesos
Comunidades
Municipales
Turismo
Internacionales
```

La página principal debe contemplar:

* header;
* navegación;
* indicador discreto de última hora;
* noticia principal;
* noticias secundarias;
* últimas noticias;
* tendencias;
* espacios publicitarios;
* footer.

---

# 26. PÁGINA DE ARTÍCULO

Debe contemplar:

* categoría;
* título;
* subtítulo;
* fecha de publicación;
* fecha de modificación;
* autor;
* imagen principal;
* resumen;
* contenido;
* compartir;
* noticias relacionadas.

---

# 27. AUTORES

Las páginas de autor podrán contener:

```text
name
slug
bio
photo
published articles
```

Nunca inventar autores durante migraciones.

---

# 28. BÚSQUEDA

Inicialmente será búsqueda SQL.

Debe poder consultar:

* título;
* contenido;
* autor;
* categoría;
* tags;
* fecha.

La arquitectura podrá evolucionar posteriormente hacia:

```text
Meilisearch
Typesense
OpenSearch
```

No instalar motores externos antes de necesitarlos.

---

# 29. ENVIAR UNA NOTICIA

Formulario público:

```text
Nombre
Teléfono
Email
Ubicación
Título
Descripción
Fotos
Video
Mensaje
```

El contenido enviado:

* se almacena;
* queda pendiente de revisión;
* nunca se publica automáticamente.

---

# 30. PUBLICIDAD

Slots:

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

```text
company/name
type
location
start_date
end_date
URL
image
active
```

Futuras métricas:

```text
impressions
clicks
CTR
```

---

# 31. MEDIA / IMÁGENES

El sistema debe conservar el archivo original.

Generará variantes optimizadas:

```text
320px
640px
960px
1440px
```

Formatos preferidos:

```text
AVIF
WebP
```

El frontend debe utilizar cuando corresponda:

```text
srcset
sizes
```

Las imágenes deben tener:

```text
width
height
alt
caption
credit
```

Objetivos:

* reducir peso;
* mejorar carga;
* mantener calidad editorial;
* evitar CLS;
* mejorar experiencia móvil.

---

# 32. RENDIMIENTO

Implementar:

* code splitting;
* lazy routes;
* lazy loading de imágenes;
* caching;
* compresión;
* paginación;
* índices SQL;
* consultas eficientes;
* evitar N+1;
* respuestas API pequeñas;
* optimización de assets.

No implementar infraestructura distribuida prematuramente.

---

# 33. SEO

Cada página relevante debe poder definir:

* title;
* meta description;
* canonical;
* Open Graph;
* Twitter/X metadata;
* JSON-LD.

Los artículos deben utilizar datos estructurados apropiados, especialmente:

```text
NewsArticle
```

Las URLs deben ser:

* limpias;
* estables;
* legibles;
* consistentes.

---

# 34. GOOGLE NEWS READINESS

Lyberate debe quedar técnicamente preparado para facilitar el descubrimiento del contenido periodístico.

Debe contemplar:

* contenido público rastreable;
* HTML accesible;
* enlaces rastreables;
* URLs estables;
* canonical;
* `NewsArticle`;
* autor;
* publisher;
* fecha de publicación;
* fecha de modificación;
* sitemap;
* News Sitemap;
* robots.txt;
* RSS/Atom;
* metadata correcta;
* rendimiento.

Esto significa **preparación técnica**.

No constituye garantía de:

* inclusión en Google News;
* indexación;
* ranking;
* tráfico;
* visibilidad.

---

# 35. SITEMAPS

Debe existir:

```text
sitemap.xml
robots.txt
```

Y posteriormente:

```text
sitemap-news.xml
```

El News Sitemap debe contener únicamente contenido que corresponda según sus reglas.

---

# 36. RSS / ATOM

El portal deberá poder ofrecer un feed de noticias para facilitar:

* lectores RSS;
* agregadores;
* descubrimiento;
* distribución del contenido.

---

# 37. PWA

Se contempla:

* manifest;
* service worker;
* installability;
* app shell;
* fallback offline;
* cache de assets;
* contenido recientemente visitado.

No se pretende convertir todo el portal en una aplicación completamente offline.

---

# 38. WEB PUSH

Se contempla:

* consentimiento explícito;
* preferencias;
* suscripción;
* desuscripción;
* notificaciones relevantes.

Nunca enviar spam.

---

# 39. FEATURE FLAGS

Las funcionalidades opcionales podrán habilitarse por tenant/site.

Ejemplos:

```text
push
comments
newsletter
ads
dark_mode
pwa
```

No crear un sistema de feature flags innecesariamente complejo.

---

# 40. MIGRACIÓN DEL SITIO HISTÓRICO

El sitio histórico de Contacto con la Noticia debe inspeccionarse antes de implementar el migrador.

**No asumir que utiliza WordPress.**

Primero:

```text
Discovery
```

Luego determinar:

* tecnología;
* estructura;
* fuentes de contenido;
* URLs;
* media;
* autores;
* categorías;
* metadata;
* IDs.

La migración debe contemplar:

* artículos;
* autores;
* categorías;
* tags;
* media;
* SEO metadata;
* slugs;
* URLs.

---

# 41. IDENTIDAD DE REGISTROS

Debe conservarse:

```text
source_id → article_uuid
```

Nunca identificar artículos únicamente mediante:

```text
title
```

Esto evita errores con:

* títulos duplicados;
* modificaciones;
* artículos similares;
* contenido histórico.

---

# 42. SLUGS Y REDIRECCIONES

Conservar el slug histórico cuando sea posible.

Detectar:

* conflictos;
* duplicados;
* slugs inexistentes;
* cambios de URL.

Crear:

```text
old_url
new_url
status
```

Las URLs antiguas deben utilizar:

```text
301
```

Evitar cadenas de redirects.

---

# 43. MIGRACIÓN DE MEDIA

Proceso:

```text
localizar
↓
extraer
↓
validar
↓
deduplicar
↓
conservar original
↓
generar variantes
↓
actualizar referencias
↓
validar
```

Debe detectarse media rota o ausente.

---

# 44. SANITIZACIÓN DEL CONTENIDO

El HTML histórico debe ser sanitizado.

Preservar:

* párrafos;
* encabezados;
* enlaces válidos;
* imágenes;
* estructura editorial.

Eliminar o neutralizar:

* scripts;
* código ejecutable;
* atributos peligrosos;
* contenido malicioso.

---

# 45. MOTOR DE MIGRACIÓN

Estructura:

```text
tools/migration/
├── README.md
├── config/
├── extract/
├── transform/
├── load/
├── media/
├── redirects/
├── reports/
└── scripts/
```

Debe existir una estrategia de:

```text
migration --dry-run
migration --execute
```

## Dry Run

No modifica la base de datos.

Debe detectar:

* warnings;
* errors;
* duplicados;
* campos faltantes;
* media faltante;
* media rota;
* conflictos de slug.

---

# 46. IDEMPOTENCIA

Ejecutar una migración dos veces no debe duplicar contenido.

El sistema debe poder reconocer registros previamente migrados.

---

# 47. MIGRACIÓN INCREMENTAL

Proceso oficial:

```text
Discovery
↓
Backup
↓
Extract
↓
Transform
↓
Dry Run
↓
Test Migration
↓
Full Migration
↓
Delta Migration
↓
Final Validation
↓
Go Live
```

El sitio antiguo puede continuar publicando durante parte del proceso.

La migración final debe incorporar los cambios realizados después de la migración inicial.

---

# 48. REPORTES

Generar:

```text
migration-summary.json
warnings.csv
errors.csv
redirects.csv
missing-media.csv
duplicate-content.csv
```

---

# 49. VALIDACIÓN DE MIGRACIÓN

Validar:

* cantidad de artículos;
* fechas;
* autores;
* categorías;
* tags;
* imágenes;
* slugs;
* URLs;
* redirects;
* HTML;
* metadata;
* canonical;
* sitemap;
* News Sitemap.

---

# 50. ESPoCRM — FASE 16

EspoCRM queda explícitamente fuera de las primeras fases.

La integración se realizará únicamente durante:

```text
PHASE 16 — CRM INTEGRATION
```

Lyberate es la fuente de verdad para:

* tenants;
* sites;
* users;
* autenticación;
* artículos;
* contenido;
* media;
* permisos;
* configuración editorial.

EspoCRM funciona como CRM para:

* contactos;
* formularios;
* leads;
* procesos comerciales;
* información CRM.

---

# 51. LYBERATE ↔ ESPOCRM

Los UUID internos y los IDs externos de EspoCRM son diferentes.

Se utilizará conceptualmente:

```text
integration_mappings
├── id
├── tenant_uuid
├── site_uuid
├── entity_type
├── local_uuid
├── external_system
├── external_id
├── created_at
└── updated_at
```

Ejemplo:

```text
Lyberate user_uuid
       ↓
integration_mappings
       ↓
EspoCRM record_id
```

---

# 52. DIRECCIÓN DE INTEGRACIÓN

Lyberate → EspoCRM:

```text
Formulario
↓
Validación
↓
Persistencia Lyberate
↓
Integration Service
↓
EspoCRM
```

EspoCRM → Lyberate:

```text
Webhook
↓
Verificación de firma
↓
Validación del evento
↓
Validación tenant/site
↓
Procesamiento
```

---

# 53. HMAC

Distinguir:

### Lyberate → EspoCRM

Autenticación de API cuando corresponda.

### EspoCRM → Lyberate

Verificación de firma de webhook mediante HMAC.

No utilizar ambos conceptos como si fueran el mismo mecanismo.

---

# 54. WEBHOOK SECURITY

Validar:

* autenticidad;
* firma;
* payload;
* evento;
* entidad;
* tenant;
* site.

Cuando corresponda:

* replay protection;
* idempotencia;
* logging seguro.

Nunca registrar secretos.

---

# 55. ESTADO DE INTEGRACIÓN

Estados:

```text
CONNECTED
DEGRADED
DISCONNECTED
ERROR
```

También:

```text
integration_version
last_seen
```

El mecanismo exacto del heartbeat se definirá durante Fase 16.

Las credenciales permanecerán fuera del repositorio.

---

# 56. DESARROLLO LOCAL

El entorno puede utilizar:

```text
Windows
XAMPP
Docker
Node.js
PHP
MySQL
Git
```

XAMPP y Docker no deben mezclarse sin una razón clara.

Debe documentarse qué servicio está ejecutando cada componente.

Ejemplo:

```text
Frontend development
→ Node/Vite

Backend
→ PHP/Apache

Database
→ MySQL
```

Docker puede utilizarse para aislar servicios cuando sea conveniente.

---

# 57. PRODUCCIÓN

Objetivo:

```text
Apache/Nginx
PHP 8.x
MySQL
HTTPS
React static build
```

Node.js no debe ser necesario durante la operación normal.

---

# 58. BUILD

Proceso:

```text
Node.js
↓
npm/pnpm
↓
Vite
↓
npm/pnpm run build
↓
frontend/dist/
```

Después:

```text
frontend/dist/
↓
Apache/Nginx
```

El servidor no necesita ejecutar Vite.

---

# 59. REGLA ABSOLUTA DE PRODUCCIÓN

La aplicación debe funcionar aunque Node.js no esté instalado en el servidor de producción, siempre que el build del frontend haya sido generado.

No introducir dependencias críticas que requieran:

```text
node
npm
pnpm
PM2
Vite server
Node runtime
```

durante la operación normal del sitio.

Una futura excepción requiere aprobación explícita.

---

# 60. DOCKER

Docker es opcional.

Puede utilizarse para:

* desarrollo;
* staging;
* producción;
* servicios aislados.

No debe utilizarse para introducir complejidad innecesaria.

No utilizar Docker como justificación para mantener un servidor Node permanente.

---

# 61. CALIDAD DE CÓDIGO

El código debe ser:

* claro;
* tipado;
* modular;
* mantenible;
* directo;
* profesional.

Evitar:

* archivos gigantes;
* funciones gigantes;
* `any` innecesario;
* wrappers sin propósito;
* abstracciones prematuras;
* código muerto;
* configuraciones mágicas;
* duplicación;
* componentes creados únicamente para dividir archivos artificialmente.

---

# 62. APARIENCIA DE CÓDIGO

El proyecto debe evitar el patrón de "código generado indiscriminadamente por IA".

Evitar:

```text
// This function handles...
// This component renders...
```

cuando el comentario no aporta información.

Evitar nombres genéricos como:

```text
GenericManager
UniversalHandler
DataProcessorV2
SuperComponent
```

si no representan una responsabilidad real.

La estructura debe reflejar el dominio real del proyecto.

---

# 63. API DOCUMENTATION

La documentación de API debe distinguir:

```text
IMPLEMENTED
PLANNED
NOT IMPLEMENTED
```

Nunca documentar como existente un endpoint que todavía no existe.

---

# 64. VERSIONADO DE API

La versión inicial:

```text
/api/v1/
```

Los cambios incompatibles deben utilizar una nueva versión.

No romper silenciosamente contratos existentes.

---

# 65. DEFINITION OF DONE

Una fase se considera terminada únicamente cuando:

* la funcionalidad está implementada;
* el build funciona;
* las pruebas relevantes funcionan;
* los errores encontrados fueron corregidos;
* se verificó seguridad relevante;
* documentación actualizada;
* no existen cambios fuera del alcance;
* no se dejaron implementaciones falsas o incompletas presentadas como terminadas.

---

# 66. CONTROL DE ALCANCE

Si una tarea pertenece a otra fase:

**NO implementarla.**

Registrar:

```text
Future Phase
```

No crear infraestructura únicamente "por si algún día se necesita".

---

# 67. TECNOLOGÍAS QUE NO DEBEN INTRODUCIRSE PREMATURAMENTE

No añadir sin necesidad:

* microservicios;
* Kubernetes;
* colas distribuidas;
* Redis;
* RabbitMQ;
* Kafka;
* OpenSearch;
* Meilisearch;
* Typesense;
* GraphQL;
* Node.js backend;
* servidores adicionales;
* arquitecturas distribuidas.

La complejidad debe justificarse por una necesidad real.

---

# 68. REGLA DE INSPECCIÓN

Antes de modificar un archivo:

1. localizarlo;
2. leerlo;
3. comprender su responsabilidad;
4. comprobar dependencias;
5. modificar lo mínimo necesario.

Nunca sobrescribir un proyecto existente sin inspección.

---

# 69. REGLAS DEL REPOSITORIO

Si el repositorio remoto está disponible:

* verificar acceso;
* inspeccionar branch;
* inspeccionar commits;
* inspeccionar archivos;
* sincronizar cuando corresponda.

Si no existe acceso:

**NO asumir que está vacío.**

**NO inventar archivos.**

**NO inventar commits.**

**NO afirmar que se hizo push/pull.**

Si existe una copia local verificada, se puede continuar localmente, pero no afirmar sincronización remota.

Nunca solicitar ni escribir credenciales, tokens o secretos.

Si el repositorio realmente está vacío, puede inicializarse.

Si contiene código, inspeccionarlo antes de modificarlo o eliminarlo.

---

# 70. FASES OFICIALES

```text
PHASE 0  — Foundation, Architecture & Environment
PHASE 1  — Project Scaffold
PHASE 2  — Database Foundation
PHASE 3  — API Foundation
PHASE 4  — Authentication & RBAC
PHASE 5  — CMS Editorial
PHASE 6  — Public News Portal
PHASE 7  — Media Engine
PHASE 8  — SEO + News Discoverability
PHASE 9  — Advertising + Public Forms
PHASE 10 — Performance
PHASE 11 — PWA + Notifications
PHASE 12 — Migration Engine
PHASE 13 — Historical Migration
PHASE 14 — Security Audit
PHASE 15 — Production
PHASE 16 — CRM Integration
```

---

# 71. PHASE 0 — FOUNDATION

Objetivos:

* verificar repositorio;
* inspeccionar entorno;
* registrar versiones;
* definir desarrollo;
* definir build;
* definir producción;
* documentar Node.js como build-time;
* definir XAMPP/Docker;
* validar arquitectura;
* crear estructura mínima;
* preparar documentación.

Comprobar:

```text
Windows
Git
Node.js
npm
pnpm
PHP
Composer
MySQL
XAMPP
Apache
Docker
Docker Compose
```

No implementar todavía:

* CMS;
* login;
* 2FA;
* WebAuthn;
* RBAC;
* artículos;
* portal público;
* migración;
* SEO funcional;
* News Sitemap;
* PWA;
* Push;
* Ads;
* CRM.

---

# 72. PHASE 1 — PROJECT SCAFFOLD

Crear la estructura real:

```text
frontend
backend
database
docs
tools
```

Configurar:

* React;
* TypeScript;
* Vite;
* Tailwind;
* React Router;
* PHP;
* Composer cuando corresponda;
* configuración base;
* entorno.

No implementar todavía funcionalidades editoriales.

---

# 73. PHASE 2 — DATABASE FOUNDATION

Crear:

* conexión PDO;
* configuración;
* migrations;
* seeds;
* esquema base;
* tenants;
* sites;
* usuarios base;
* estructuras necesarias.

Aplicar:

* UUID;
* índices;
* foreign keys;
* timestamps;
* constraints.

No crear tablas para funcionalidades futuras que todavía no tengan diseño aprobado.

---

# 74. PHASE 3 — API FOUNDATION

Crear:

```text
/api/v1/
```

Implementar:

* routing;
* JSON;
* HTTP codes;
* error handling;
* middleware base;
* health endpoint;
* conexión DB.

No implementar todavía todo el CMS.

---

# 75. PHASE 4 — AUTHENTICATION & RBAC

Implementar:

* login;
* logout;
* sesiones;
* password hashing;
* roles;
* permisos;
* autorización;
* multi-tenant access;
* CSRF cuando corresponda;
* rate limiting;
* brute-force protection;
* TOTP;
* recovery codes;
* WebAuthn/Passkeys.

---

# 76. PHASE 5 — CMS EDITORIAL

Implementar:

* artículos;
* autores;
* categorías;
* tags;
* estados;
* editor;
* scheduling;
* publicación;
* permisos editoriales;
* administración.

---

# 77. PHASE 6 — PUBLIC NEWS PORTAL

Implementar:

* homepage;
* categorías;
* artículo;
* autores;
* relacionadas;
* búsqueda;
* navegación;
* responsive;
* formulario inicial de envío de noticias según alcance definido.

---

# 78. PHASE 7 — MEDIA ENGINE

Implementar:

* upload;
* validación;
* almacenamiento;
* originales;
* AVIF/WebP;
* variantes;
* metadata;
* `srcset`;
* `sizes`;
* optimización;
* deduplicación.

---

# 79. PHASE 8 — SEO + NEWS DISCOVERABILITY

Implementar:

* metadata;
* canonical;
* Open Graph;
* Twitter/X;
* JSON-LD;
* NewsArticle;
* sitemap;
* News Sitemap;
* robots.txt;
* RSS/Atom;
* URLs limpias;
* author/publisher metadata.

---

# 80. PHASE 9 — ADVERTISING + PUBLIC FORMS

Implementar:

* campañas;
* slots;
* administración;
* formulario Envíanos tu noticia;
* almacenamiento;
* revisión;
* protección contra abuso.

---

# 81. PHASE 10 — PERFORMANCE

Auditar y optimizar:

* frontend;
* API;
* SQL;
* imágenes;
* caching;
* payloads;
* lazy loading;
* code splitting;
* N+1;
* índices;
* compresión.

No agregar infraestructura innecesaria.

---

# 82. PHASE 11 — PWA + NOTIFICATIONS

Implementar:

* manifest;
* service worker;
* instalación;
* fallback;
* cache;
* Web Push;
* preferencias;
* desuscripción.

---

# 83. PHASE 12 — MIGRATION ENGINE

Construir el motor reusable.

Debe soportar:

* discovery;
* extract;
* transform;
* load;
* media;
* redirects;
* reports;
* dry-run;
* execute;
* idempotencia.

---

# 84. PHASE 13 — HISTORICAL MIGRATION

Migrar Contacto con la Noticia.

Proceso:

```text
Discovery
↓
Backup
↓
Extract
↓
Transform
↓
Dry Run
↓
Test Migration
↓
Full Migration
↓
Delta Migration
↓
Validation
↓
Go Live
```

No borrar el sitio histórico antes de validar.

---

# 85. PHASE 14 — SECURITY AUDIT

Auditar:

* autenticación;
* autorización;
* multi-tenant;
* sesiones;
* CSRF;
* CORS;
* uploads;
* SQL;
* XSS;
* headers;
* rate limiting;
* logs;
* secretos;
* errores;
* webhooks.

---

# 86. PHASE 15 — PRODUCTION

Preparar:

* build final;
* Apache/Nginx;
* PHP;
* MySQL;
* HTTPS;
* variables de entorno;
* backups;
* migrations;
* permisos;
* caching;
* monitoring básico;
* health check.

Confirmar explícitamente:

```text
Node.js NO es requerido como runtime.
```

---

# 87. PHASE 16 — CRM INTEGRATION

Implementar:

* integración EspoCRM;
* integration mappings;
* API authentication;
* webhooks;
* HMAC;
* validación tenant/site;
* idempotencia;
* replay protection;
* heartbeat;
* integration status;
* sincronización de entidades aprobadas.

No adelantar esta fase.

---

# 88. REGLA FINAL DE EJECUCIÓN

Cada agente debe terminar una fase con:

```text
IMPLEMENTED
VERIFIED
DOCUMENTED
STOPPED
```

Nunca:

```text
IMPLEMENTED
→ automáticamente continuar
→ siguiente fase
→ siguiente fase
→ siguiente fase
```

La fase siguiente solamente comienza mediante una instrucción explícita.

---

# 89. PRINCIPIO ARQUITECTÓNICO FINAL

La plataforma debe mantener esta separación:

```text
                    DEVELOPMENT

Node.js
   │
   ├── npm/pnpm
   ├── Vite
   ├── TypeScript
   └── React build
             │
             ▼
       frontend/dist/


                    PRODUCTION

             Internet
                 │
                HTTPS
                 │
          Apache / Nginx
             │       │
             │       └──────────────┐
             ▼                      ▼
       frontend/dist/             PHP 8.x
                                    │
                                    ▼
                                  REST API
                                    │
                                    ▼
                                   PDO
                                    │
                                    ▼
                                  MySQL
```

**Node.js pertenece al desarrollo y al proceso de build.**

**PHP + MySQL + Apache/Nginx constituyen el runtime principal de producción.**

Esta decisión es obligatoria para Lyberate y debe respetarse durante todas las fases.

