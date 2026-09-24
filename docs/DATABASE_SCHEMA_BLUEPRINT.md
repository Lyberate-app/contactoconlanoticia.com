# LYBERATE — BLUEPRINT Y HUELLAS DE LA BASE DE DATOS

> **Propósito:** Este documento consolida las huellas, esquemas relacionales DDL (MySQL 8.x) y contratos REST API derivados directamente de los tipos y servicios del frontend de **Contacto con la Noticia**.
> Sirve como la guía técnica definitiva para implementar, regenerar o conectar la base de datos y la API de backend cuando se pase del modo `localStorage` a producción.

---

## 1. Arquitectura de Almacenamiento Frontend (Modo LocalStorage)

Actualmente, el frontend opera de forma 100% autónoma sin requerir PHP ni MySQL activos (`VITE_DATA_MODE=mock`). Cada tabla relacional de la base de datos está emulada en `localStorage` mediante las siguientes claves canónicas:

| Clave en LocalStorage | Tabla Relacional MySQL Equivalente | Tipo TypeScript Frontend | Descripción |
|---|---|---|---|
| `lyberate_mock_auth_user` | `users` + `sessions` | `AuthUser` (`src/types/auth.ts`) | Usuario activo y permisos RBAC |
| `lyberate_mock_articles` | `articles` + `article_tags` | `ArticleDetail` (`src/types/article.ts`) | Catálogo editorial y notas públicas |
| `lyberate_mock_categories` | `categories` | `Category` (`src/types/category.ts`) | Secciones periodísticas del portal |
| `lyberate_mock_author` | `authors` | `Author` (`src/types/author.ts`) | Perfiles de periodistas y redactores |
| `lyberate_mock_tags` | `tags` | `Tag` (`src/types/article.ts`) | Etiquetas temáticas y taxonomía |
| `lyberate_mock_ads` | `ads_campaigns` | `AdCampaign` (`src/types/ads.ts`) | Banners publicitarios y métricas CTR |
| `lyberate_mock_submissions` | `citizen_submissions` | `CitizenSubmission` (`src/types/submission.ts`) | Buzón ciudadano y moderación |
| `lyberate_mock_media` | `media` + `media_variants` | `MediaItem` (`src/types/media.ts`) | Biblioteca digital y activos DAM |
| `lyberate_mock_push_config` | `push_config` | `PushConfig` (`src/types/push.ts`) | Configuración VAPID de notificaciones |
| `lyberate_mock_push_subscriptions` | `push_subscriptions` | `SubscribePushPayload` (`src/types/push.ts`) | Suscriptores y tópicos Web Push |

---

## 2. Huellas DDL Oficiales para la Base de Datos Relacional (MySQL 8.x)

A continuación se presentan las definiciones de tablas SQL con tipos exactos, claves primarias compuestas multi-tenant (`tenant_uuid`, `site_uuid`), índices de rendimiento y claves foráneas:

### 2.1 Usuarios y Autenticación (`users`)
```sql
CREATE TABLE users (
    user_uuid VARCHAR(36) NOT NULL,
    tenant_uuid VARCHAR(36) NOT NULL,
    email VARCHAR(191) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('SUPER_ADMIN', 'TENANT_ADMIN', 'EDITOR', 'JOURNALIST', 'MODERATOR') NOT NULL DEFAULT 'JOURNALIST',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_uuid),
    UNIQUE KEY uk_users_tenant_email (tenant_uuid, email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.2 Categorías Editoriales (`categories`)
```sql
CREATE TABLE categories (
    category_uuid VARCHAR(36) NOT NULL,
    tenant_uuid VARCHAR(36) NOT NULL,
    site_uuid VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    description TEXT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (category_uuid),
    UNIQUE KEY uk_categories_site_slug (tenant_uuid, site_uuid, slug),
    INDEX idx_categories_sort (sort_order ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.3 Autores y Periodistas (`authors`)
```sql
CREATE TABLE authors (
    author_uuid VARCHAR(36) NOT NULL,
    tenant_uuid VARCHAR(36) NOT NULL,
    site_uuid VARCHAR(36) NOT NULL,
    user_uuid VARCHAR(36) NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    bio TEXT NULL,
    avatar_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (author_uuid),
    UNIQUE KEY uk_authors_site_slug (tenant_uuid, site_uuid, slug),
    FOREIGN KEY (user_uuid) REFERENCES users(user_uuid) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.4 Biblioteca Multimedia DAM (`media` y `media_variants`)
```sql
CREATE TABLE media (
    media_uuid VARCHAR(36) NOT NULL,
    tenant_uuid VARCHAR(36) NOT NULL,
    site_uuid VARCHAR(36) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    filesize_bytes BIGINT NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) NULL,
    caption TEXT NULL,
    credit VARCHAR(150) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (media_uuid),
    INDEX idx_media_mime (mime_type),
    INDEX idx_media_search (title, alt_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE media_variants (
    variant_uuid VARCHAR(36) NOT NULL,
    media_uuid VARCHAR(36) NOT NULL,
    name VARCHAR(50) NOT NULL, -- 'thumbnail', 'medium', 'large'
    width INT NOT NULL,
    height INT NOT NULL,
    filesize_bytes BIGINT NOT NULL,
    url VARCHAR(500) NOT NULL,
    format VARCHAR(20) NOT NULL, -- 'webp', 'avif', 'jpeg'
    PRIMARY KEY (variant_uuid),
    FOREIGN KEY (media_uuid) REFERENCES media(media_uuid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.5 Artículos Editoriales (`articles`)
```sql
CREATE TABLE articles (
    article_uuid VARCHAR(36) NOT NULL,
    tenant_uuid VARCHAR(36) NOT NULL,
    site_uuid VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255) NULL,
    excerpt TEXT NOT NULL,
    content MEDIUMTEXT NOT NULL,
    slug VARCHAR(191) NOT NULL,
    status ENUM('DRAFT', 'PENDING_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'TRASH') NOT NULL DEFAULT 'DRAFT',
    category_uuid VARCHAR(36) NOT NULL,
    author_uuid VARCHAR(36) NOT NULL,
    featured_media_uuid VARCHAR(36) NULL,
    meta_title VARCHAR(120) NULL,
    meta_description VARCHAR(255) NULL,
    canonical_url VARCHAR(500) NULL,
    views_count BIGINT NOT NULL DEFAULT 0,
    published_at DATETIME NULL,
    scheduled_for DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (article_uuid),
    UNIQUE KEY uk_articles_site_slug (tenant_uuid, site_uuid, slug),
    INDEX idx_articles_status_pub (status, published_at DESC),
    INDEX idx_articles_category (category_uuid),
    INDEX idx_articles_author (author_uuid),
    FULLTEXT KEY ft_articles_search (title, subtitle, excerpt, content),
    FOREIGN KEY (category_uuid) REFERENCES categories(category_uuid),
    FOREIGN KEY (author_uuid) REFERENCES authors(author_uuid),
    FOREIGN KEY (featured_media_uuid) REFERENCES media(media_uuid) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.6 Etiquetas y Relación Muchos a Muchos (`tags` y `article_tags`)
```sql
CREATE TABLE tags (
    tag_uuid VARCHAR(36) NOT NULL,
    tenant_uuid VARCHAR(36) NOT NULL,
    site_uuid VARCHAR(36) NOT NULL,
    name VARCHAR(80) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tag_uuid),
    UNIQUE KEY uk_tags_site_slug (tenant_uuid, site_uuid, slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE article_tags (
    article_uuid VARCHAR(36) NOT NULL,
    tag_uuid VARCHAR(36) NOT NULL,
    PRIMARY KEY (article_uuid, tag_uuid),
    FOREIGN KEY (article_uuid) REFERENCES articles(article_uuid) ON DELETE CASCADE,
    FOREIGN KEY (tag_uuid) REFERENCES tags(tag_uuid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.7 Campañas Publicitarias (`ads_campaigns`)
```sql
CREATE TABLE ads_campaigns (
    campaign_uuid VARCHAR(36) NOT NULL,
    tenant_uuid VARCHAR(36) NOT NULL,
    site_uuid VARCHAR(36) NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    campaign_name VARCHAR(150) NOT NULL,
    ad_type ENUM('BANNER', 'SPONSORED', 'POPUP') NOT NULL DEFAULT 'BANNER',
    location VARCHAR(50) NOT NULL, -- 'HEADER_BANNER', 'SIDEBAR_1', 'IN_ARTICLE', etc.
    start_at DATETIME NULL,
    end_at DATETIME NULL,
    target_url VARCHAR(500) NOT NULL,
    media_uuid VARCHAR(36) NULL,
    media_url VARCHAR(500) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    impressions_count BIGINT NOT NULL DEFAULT 0,
    clicks_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (campaign_uuid),
    INDEX idx_ads_location_active (location, active),
    FOREIGN KEY (media_uuid) REFERENCES media(media_uuid) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.8 Reportes y Periodismo Ciudadano (`citizen_submissions`)
```sql
CREATE TABLE citizen_submissions (
    submission_uuid VARCHAR(36) NOT NULL,
    tenant_uuid VARCHAR(36) NOT NULL,
    site_uuid VARCHAR(36) NOT NULL,
    submitter_name VARCHAR(150) NOT NULL,
    contact_email VARCHAR(191) NULL,
    contact_phone VARCHAR(50) NULL,
    location VARCHAR(150) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    message TEXT NULL,
    video_url VARCHAR(500) NULL,
    status ENUM('PENDING_REVIEW', 'ACCEPTED', 'REJECTED', 'CONVERTED') NOT NULL DEFAULT 'PENDING_REVIEW',
    rejection_reason TEXT NULL,
    reviewed_by_user_uuid VARCHAR(36) NULL,
    reviewed_at DATETIME NULL,
    converted_article_uuid VARCHAR(36) NULL,
    assigned_author_uuid VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (submission_uuid),
    INDEX idx_submissions_status (status),
    FOREIGN KEY (reviewed_by_user_uuid) REFERENCES users(user_uuid) ON DELETE SET NULL,
    FOREIGN KEY (converted_article_uuid) REFERENCES articles(article_uuid) ON DELETE SET NULL,
    FOREIGN KEY (assigned_author_uuid) REFERENCES authors(author_uuid) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.9 Suscripciones Web Push (`push_subscriptions`)
```sql
CREATE TABLE push_subscriptions (
    subscription_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_uuid VARCHAR(36) NOT NULL,
    site_uuid VARCHAR(36) NOT NULL,
    endpoint VARCHAR(500) NOT NULL UNIQUE,
    key_p256dh VARCHAR(255) NOT NULL,
    key_auth VARCHAR(255) NOT NULL,
    topics JSON NULL, -- Array de IDs de tópicos suscritos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_push_tenant_site (tenant_uuid, site_uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. Contratos REST API del Backend (`/api/v1/`)

Cuando el backend se active (`VITE_DATA_MODE=api`), responderá a los siguientes contratos consumidos por `src/services/`:

| Servicio Frontend | Endpoint REST | Método | Descripción |
|---|---|---|---|
| `authService` | `/api/v1/auth/login` | `POST` | Autenticación con cookies HttpOnly |
| `authService` | `/api/v1/auth/me` | `GET` | Obtener usuario de sesión y permisos |
| `authService` | `/api/v1/auth/logout` | `POST` | Destruir sesión y limpiar cookies |
| `publicApi` | `/api/v1/public/articles` | `GET` | Portada y noticias con paginación |
| `publicApi` | `/api/v1/public/articles/:slug` | `GET` | Detalle de noticia con relacionadas |
| `publicApi` | `/api/v1/public/categories/:slug` | `GET` | Noticias por sección editorial |
| `publicApi` | `/api/v1/public/authors/:slug` | `GET` | Perfil del redactor y sus artículos |
| `publicApi` | `/api/v1/public/search` | `GET` | Búsqueda SQL multi-criterio |
| `editorialService` | `/api/v1/admin/dashboard/stats`| `GET` | KPIs del panel de redacción |
| `editorialService` | `/api/v1/admin/articles` | `GET/POST` | Listar / Crear artículo |
| `editorialService` | `/api/v1/admin/articles/:uuid` | `GET/PUT/DELETE` | Gestionar artículo |
| `mediaService` | `/api/v1/admin/media` | `GET` | Catálogo de activos multimedia |
| `mediaService` | `/api/v1/admin/media/upload` | `POST` | Subir archivo fotográfico |
| `adsApi` | `/api/v1/public/ads` | `GET` | Banners públicos por ubicación |
| `adsApi` | `/api/v1/admin/ads` | `GET/POST/PUT` | Gestión de campañas publicitarias |
| `submissionApi` | `/api/v1/public/submissions` | `POST` | Envío de reporte ciudadano |
| `submissionApi` | `/api/v1/admin/submissions` | `GET` | Moderación de reportes |
| `pushApi` | `/api/v1/public/push/config` | `GET` | Clave VAPID pública y tópicos |
| `pushApi` | `/api/v1/public/push/subscribe` | `POST` | Registrar token del Service Worker |

---

## 4. Herramientas de Desarrollo y Testing en Consola

Para facilitar las pruebas directas en el navegador sin backend, se ha expuesto en la ventana del navegador el objeto global `__LYBERATE_MOCK__`:

```javascript
// Ver estadísticas actuales del almacenamiento local
window.__LYBERATE_MOCK__.getStats();

// Exportar todos los datos locales en formato JSON
window.__LYBERATE_MOCK__.dump();

// Reiniciar el almacenamiento a los datos de fábrica de demostración
window.__LYBERATE_MOCK__.reset();
```

