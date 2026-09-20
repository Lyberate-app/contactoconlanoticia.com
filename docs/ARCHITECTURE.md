# LYBERATE — ARQUITECTURA DEL SISTEMA

## 1. Visión General

Lyberate es una plataforma tecnológica multi-tenant diseñada para alimentar sitios editoriales y portales de noticias profesionales. Su primera implementación es **Contacto con la Noticia** (`contactoconlanoticia.com`).

---

## 2. Separación Física y Lógica

El frontend y el backend residen en directorios completamente separados:

```text
LYBERATE/
├── frontend/    # Aplicación React 19 + TypeScript + Vite + Tailwind CSS
├── backend/     # API REST modular en PHP 8.x + PDO
├── database/    # Migraciones y seeds SQL
├── docs/        # Documentación de ingeniería y procesos
└── tools/       # Herramientas de migración y soporte
```

> [!IMPORTANT]
> El backend nunca debe colocarse dentro de `frontend/public/`. Ambos entornos se compilan o ejecutan de forma independiente.

---

## 3. Arquitectura de Producción

En producción, la plataforma se ejecuta sobre infraestructura web convencional (VPS o servidor dedicado con Apache o Nginx):

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

### Reglas de Producción:
- **Node.js es Build-Time Only:** Node.js no se ejecuta en el servidor de producción. Vite compila el código a HTML/CSS/JS estáticos en `frontend/dist/`.
- **Servidor Web Nativo:** Apache o Nginx sirve directamente los archivos de `frontend/dist/` y delega las peticiones hacia `/api/v1/*` al archivo de entrada de PHP (`backend/public/index.php`).
- **Base de Datos:** MySQL conectada mediante PDO con sentencias preparadas obligatorias.

---

## 4. Modelo Multi-Tenant

La jerarquía de datos y aislamiento opera bajo el siguiente modelo conceptual:

```text
Tenant (Organización / Cliente)
  └── Site (Sitio o Portal específico, ej: Contacto con la Noticia)
        ├── Users (Usuarios con roles y permisos específicos del sitio)
        ├── Articles (Noticias y artículos editoriales)
        ├── Media (Archivos multimedia asignados)
        ├── Categories & Tags (Taxonomía local)
        └── Campaigns (Publicidad y configuración local)
```

### Aislamiento Estricto en Backend:
- La autorización **nunca** depende únicamente de valores enviados por el cliente (`tenant_uuid`, `site_uuid`, roles).
- El backend autentica al usuario mediante sesión segura y valida que dicho usuario tenga permisos explícitos sobre el tenant y sitio solicitados.
- Queda prohibido permitir que un usuario acceda a recursos de otro tenant alterando un identificador en una petición HTTP.

---

## 5. Identidad mediante UUIDs

Las entidades principales utilizan UUID v4 como identificador canónico interno:
- `tenant_uuid`
- `site_uuid`
- `user_uuid`
- `article_uuid`
- `media_uuid`
- `campaign_uuid`

> [!NOTE]
> Un UUID es un identificador interno estable, **no un secreto ni un sustituto de la autorización**. Cada petición debe verificar RBAC independientemente de la presencia del UUID.

---

## 6. Mapeo con Sistemas Externos (`integration_mappings`)

Cuando una entidad interna se vincula con un sistema externo (como EspoCRM en la Fase 16), nunca se asume que los identificadores coinciden. Se utiliza una tabla de resolución desacoplada:

```text
integration_mappings
├── id
├── tenant_uuid
├── site_uuid
├── entity_type     (ej. 'user', 'contact', 'lead')
├── local_uuid      (UUID interno de Lyberate)
├── external_system (ej. 'espocrm')
├── external_id     (ID nativo del sistema externo)
├── created_at
└── updated_at
```

