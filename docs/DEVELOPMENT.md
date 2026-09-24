# LYBERATE — GUÍA DE ENTORNO DE DESARROLLO

## 1. Entorno de Desarrollo Rápido (Frontend Autónomo)

Para acelerar las modificaciones del portal y la mesa de redacción editorial con máxima agilidad, el proyecto opera como una aplicación React 19 + TypeScript con persistencia en **LocalStorage** a través del patrón repositorio.

| Herramienta | Requerido para | Notas |
|---|---|---|
| **Node.js** | Entorno de desarrollo | Node.js v18+ o v20+ con `npm`. |
| **Vite** | Bundler y HMR ultrarrápido | Servidor local con Hot Module Replacement en puerto 5173. |
| **LocalStorage** | Persistencia reactiva local | Simula el comportamiento del backend y base de datos sin dependencias de red. |

---

## 2. Puesta en Marcha

```bash
cd frontend
npm install
npm run dev
```

El portal abre en `http://localhost:5173`:
- **Portal Público:** `http://localhost:5173/`
- **Panel Administrativo (CMS):** `http://localhost:5173/admin/articles`
- **Login Editorial:** `http://localhost:5173/login` (Cualquier usuario y contraseña)

---

## 3. Arquitectura de Servicios y Preparación para API REST

Toda la comunicación de datos se realiza a través de la carpeta `frontend/src/services/`:
- `editorial.ts`
- `publicApi.ts`
- `mediaApi.ts`
- `adsApi.ts`
- `submissionApi.ts`
- `auth.ts`
- `pushApi.ts`

Los servicios retornan promesas estándar (`Promise<T>`) con las mismas interfaces TypeScript que demandará la futura API REST. Cuando la nueva API esté desarrollada, únicamente se conectará el cliente HTTP en la capa de servicios sin modificar la interfaz de usuario.
