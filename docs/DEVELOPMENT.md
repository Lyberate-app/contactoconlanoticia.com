# LYBERATE — GUÍA DE ENTORNO DE DESARROLLO

## 1. Estado del Entorno de Desarrollo

La inspección inicial del entorno realizada en la Fase 0 arrojó los siguientes resultados:

| Herramienta | Requerido para | Estado Detectado | Notas |
|---|---|---|---|
| **Sistema Operativo** | Anfitrión | Windows | Plataforma local de trabajo. |
| **Git** | Control de versiones | `2.55.0.windows.4` | Operativo y vinculado al repositorio remoto oficial. |
| **Docker** | Contenedores | `28.5.1` | Disponible y operativo en el sistema. |
| **Docker Compose** | Orquestación local | `v2.40.3-desktop.1` | Disponible para levantar PHP, MySQL y Apache localmente. |
| **Node.js / npm** | Build-time frontend | No en PATH global | Requerido para compilar React/Vite (local o vía contenedor Docker). |
| **PHP** | Runtime backend | No en PATH global | Requerido para API REST (local vía XAMPP o vía contenedor Docker). |
| **Composer** | Dependencias PHP | No en PATH global | Gestión de dependencias PHP cuando corresponda. |
| **MySQL** | Base de datos | No en PATH global | Disponible para ejecutar vía Docker o servicio local. |
| **XAMPP** | Servidor local | No en `C:\xampp` | Alternativa opcional a Docker. |

---

## 2. Estrategia Local Oficial

Para garantizar un entorno reproducible y evitar discrepancias de versiones:

### Opción A: Docker Compose (Recomendada en este entorno)
Aprovechando que Docker y Docker Compose están instalados y verificados:
- Se puede definir un archivo `docker-compose.yml` para desarrollo que levante:
  1. Contenedor **PHP 8.2+ con Apache** y módulo PDO MySQL habilitado.
  2. Contenedor **MySQL 8.0** con volumen de datos persistente.
  3. Contenedor auxiliar de **Node.js** para instalar dependencias y ejecutar el build de Vite hacia `frontend/dist/`.

### Opción B: Entorno Nativo Local (XAMPP / Node.js en Windows)
Si se prefiere desarrollo sin contenedores:
- Instalar Node.js (v20 LTS) y agregarlo al PATH.
- Instalar XAMPP con PHP 8.2+ y MySQL.
- **Regla:** No mezclar simultáneamente servicios de XAMPP y Docker en los mismos puertos (ej. 80 o 3306).

---

## 3. Principio Inviolable: Rol de Node.js

> [!CAUTION]
> **Node.js es estrictamente para desarrollo y compilación (Build-Time Only).**
>
> - Se utiliza exclusivamente para:
>   - Instalar paquetes npm.
>   - Ejecutar el linter y compilador TypeScript (`tsc`).
>   - Ejecutar el servidor de desarrollo Vite (`npm run dev`).
>   - Generar el paquete estático final (`npm run build`).
> - **En producción, no se utiliza Node.js, PM2 ni servidores Express/Next.** Todo el frontend compilado en `frontend/dist/` es entregado directamente por el servidor web Apache o Nginx.

---

## 4. Flujo de Trabajo para Nuevas Dependencias

Antes de agregar una biblioteca a `package.json` o `composer.json`:
1. Comprobar si ya existe una solución nativa en el lenguaje o en las dependencias existentes.
2. Evaluar el impacto en el tamaño del bundle o en la complejidad del backend.
3. Instalar únicamente lo indispensable para la fase actual.
4. Queda prohibida la instalación anticipada de librerías para fases futuras.

---

## 5. Gestión de Base de Datos y Migraciones

Las migraciones DDL se encuentran en `database/migrations/` numeradas secuencialmente (`001_` a `014_`).

### Ejecución de Migraciones:
- **Mediante script CLI nativo:**
  ```bash
  php database/migrate.php
  ```
- **Poblado de Seeds Oficiales (Roles, Permisos, Sitio Inicial y Categorías):**
  ```bash
  php database/seed.php
  ```
- **Vía MySQL directo (en contenedor Docker `lyberate_db`):**
  ```bash
  docker exec -i lyberate_db mysql -u lyberate_user -plyberate_password lyberate_db < database/migrations/001_create_tenants_table.sql
  ```


