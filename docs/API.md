# LYBERATE — ESPECIFICACIÓN DE LA API REST

## 1. Convenciones Generales

- **Prefijo Oficial:** `/api/v1/`
- **Formato de Petición y Respuesta:** `application/json` (UTF-8).
- **Códigos de Estado HTTP:**
  - `200 OK`: Operación exitosa con datos de retorno.
  - `201 Created`: Recurso creado satisfactoriamente.
  - `204 No Content`: Operación exitosa sin cuerpo de retorno (ej. borrado).
  - `400 Bad Request`: Error en validación de entrada o formato JSON inválido.
  - `401 Unauthorized`: No autenticado o sesión expirada.
  - `403 Forbidden`: Autenticado pero sin permisos sobre el recurso/tenant.
  - `404 Not Found`: Recurso no encontrado.
  - `422 Unprocessable Entity`: Error en reglas de negocio específicas.
  - `429 Too Many Requests`: Límite de peticiones alcanzado (Rate limit).
  - `500 Internal Server Error`: Error inesperado en el servidor (sin trazas sensibles expuestas).

---

## 2. Formato Estándar de Respuestas

### Respuesta Exitosa:
```json
{
  "success": true,
  "data": {
    "key": "value"
  },
  "meta": {
    "timestamp": "2026-09-20T21:00:00Z"
  }
}
```

### Respuesta de Error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Los datos proporcionados no son válidos.",
    "details": [
      {
        "field": "title",
        "issue": "El campo título es requerido."
      }
    ]
  }
}
```

---

## 3. Catálogo de Endpoints y Estado Real

> [!IMPORTANT]
> Siguiendo la regla de oro de `MASTER.md`: **La documentación no demuestra que una funcionalidad exista.**
> En esta Fase 0, todos los endpoints se encuentran en estado `PLANNED` hasta su implementación y verificación en las fases correspondientes.

### Endpoints Base del Sistema
| Método | Endpoint | Fase | Estado | Descripción |
|---|---|---|---|---|
| `GET` | `/api/v1/health` | Fase 1 | `IMPLEMENTED` | Estado mínimo de salud de la plataforma (verificado en Fase 1). |

### Autenticación y Usuarios
| Método | Endpoint | Fase | Estado | Descripción |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Fase 4 | `PLANNED` | Inicio de sesión con credenciales seguras. |
| `POST` | `/api/v1/auth/logout` | Fase 4 | `PLANNED` | Cierre de sesión y revocación de cookie. |
| `GET` | `/api/v1/auth/me` | Fase 4 | `PLANNED` | Datos y permisos del usuario activo. |
| `POST` | `/api/v1/auth/2fa/verify` | Fase 4 | `PLANNED` | Verificación de código TOTP / 2FA. |
| `POST` | `/api/v1/auth/webauthn/challenge` | Fase 4 | `PLANNED` | Solicitud de challenge para Passkey. |
| `POST` | `/api/v1/auth/webauthn/verify` | Fase 4 | `PLANNED` | Verificación de firma WebAuthn. |

### Portal Público (Lectura)
| Método | Endpoint | Fase | Estado | Descripción |
|---|---|---|---|---|
| `GET` | `/api/v1/public/articles` | Fase 6 | `PLANNED` | Listado paginado de noticias publicadas. |
| `GET` | `/api/v1/public/articles/{slug}` | Fase 6 | `PLANNED` | Noticia completa por slug con autor y taxonomía. |
| `GET` | `/api/v1/public/categories` | Fase 6 | `PLANNED` | Categorías editoriales activas. |
| `GET` | `/api/v1/public/search` | Fase 6 | `PLANNED` | Búsqueda SQL de noticias por texto y filtros. |
| `POST` | `/api/v1/public/submissions` | Fase 9 | `PLANNED` | Recepción de noticias ciudadanas ("Envíanos tu noticia"). |

### CMS Editorial (Gestión Interna)
| Método | Endpoint | Fase | Estado | Descripción |
|---|---|---|---|---|
| `GET` | `/api/v1/admin/articles` | Fase 5 | `PLANNED` | Listado administrativo con filtros de estado. |
| `POST` | `/api/v1/admin/articles` | Fase 5 | `PLANNED` | Creación de nuevo artículo/borrador. |
| `PUT` | `/api/v1/admin/articles/{uuid}` | Fase 5 | `PLANNED` | Actualización de contenido y estados. |
| `DELETE` | `/api/v1/admin/articles/{uuid}` | Fase 5 | `PLANNED` | Eliminación lógica o envío a papelera. |
| `POST` | `/api/v1/admin/media/upload` | Fase 7 | `PLANNED` | Subida y procesamiento de imágenes. |

### Integración CRM (EspoCRM)
| Método | Endpoint | Fase | Estado | Descripción |
|---|---|---|---|---|
| `POST` | `/api/v1/integrations/espocrm/webhook` | Fase 16 | `PLANNED` | Recepción de eventos con firma HMAC. |
| `GET` | `/api/v1/integrations/espocrm/heartbeat` | Fase 16 | `PLANNED` | Verificación de estado de integración. |

