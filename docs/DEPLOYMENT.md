# LYBERATE — ESPECIFICACIÓN DE DESPLIEGUE UNIVERSAL

## 1. Filosofía de Despliegue

Lyberate está diseñado con un **objetivo de despliegue universal**. Esto significa que puede ejecutarse en servidores dedicados, VPS convencionales o servicios de hosting estándar con soporte de PHP 8.x, MySQL y servidor web (Apache/Nginx).

> [!IMPORTANT]
> **Confirmación de Producción:** El servidor de producción **NO requiere tener instalado ni en ejecución Node.js**. Todo el frontend se distribuye como assets estáticos compilados previamente.

---

## 2. Requisitos Mínimos del Servidor

* **Sistema Operativo:** Linux (Ubuntu/Debian/AlmaLinux/Rocky) o Windows Server.
* **Servidor Web:** Apache 2.4+ (con `mod_rewrite` y `mod_headers`) o Nginx 1.20+.
* **PHP:** PHP 8.1+ o 8.2+ con extensiones:
  - `pdo_mysql`
  - `mbstring`
  - `openssl`
  - `json`
  - `gd` o `imagick` (para optimización de imágenes WebP/AVIF en Fase 7)
* **Base de Datos:** MySQL 8.0+ o MariaDB 10.6+.
* **Seguridad:** Certificado SSL/TLS válido (HTTPS obligatorio).

---

## 3. Disposición de Directorios en Servidor

Estructura típica en `/var/www/lyberate/`:

```text
/var/www/lyberate/
├── backend/
│   ├── app/
│   ├── config/
│   ├── routes/
│   └── public/               # DocumentRoot de la API (/api/v1/)
│       └── index.php
├── frontend/
│   └── dist/                 # DocumentRoot del portal público (archivos estáticos)
│       ├── index.html
│       └── assets/
└── .env                      # Variables de entorno de producción (fuera del DocumentRoot público)
```

---

## 4. Configuración Conceptual del Servidor Web

### Esquema Apache con VirtualHost y Alias API

```apache
<VirtualHost *:443>
    ServerName contactoconlanoticia.com
    DocumentRoot /var/www/lyberate/frontend/dist

    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/contactoconlanoticia.crt
    SSLCertificateKeyFile /etc/ssl/private/contactoconlanoticia.key

    # Enrutamiento de la API REST hacia PHP
    Alias /api/v1 /var/www/lyberate/backend/public
    <Directory /var/www/lyberate/backend/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Enrutamiento de SPA para React (HTML5 History API)
    <Directory /var/www/lyberate/frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ index.html [L]
    </Directory>
</VirtualHost>
```

---

## 5. Proceso de Actualización / Release

1. **Build en Entorno de Integración / CI / Local:**
   ```bash
   cd frontend
   npm run build
   ```
2. **Transferencia de Archivos:**
   - Copiar `frontend/dist/` al servidor.
   - Sincronizar el código de `backend/`.
3. **Migraciones:**
   - Ejecutar scripts de migración de base de datos (`database/migrations/`).
4. **Verificación:**
   - Consultar `GET https://contactoconlanoticia.com/api/v1/health`.

