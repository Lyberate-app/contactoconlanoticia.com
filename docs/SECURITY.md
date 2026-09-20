# LYBERATE — POLÍTICAS Y PRINCIPIOS DE SEGURIDAD

## 1. El Backend como Única Autoridad

En Lyberate, **ninguna validación en el frontend constituye autorización**. Toda petición que intente leer, crear, modificar o eliminar datos debe ser autenticada y autorizada estrictamente en el backend.

---

## 2. Aislamiento Multi-Tenant y Multi-Site

Cada consulta a la base de datos debe filtrar y verificar:
```text
Usuario Autenticado + Tenant UUID + Site UUID + Permiso RBAC
```
- No se confía en valores de `tenant_uuid`, `site_uuid` o roles pasados por query params o cuerpo de petición.
- El contexto de autorización se deriva de la sesión autenticada en el servidor.
- Un usuario perteneciente a un tenant no podrá acceder a datos de otro tenant bajo ninguna circunstancia.

---

## 3. Autenticación y Manejo de Sesiones

* **Cookies de Sesión:**
  - `HttpOnly`: Previene el acceso a la cookie desde JavaScript (mitigación de XSS).
  - `Secure`: Obligatorio en entornos con HTTPS.
  - `SameSite`: Configurado como `Lax` o `Strict` para mitigar ataques CSRF.
* **Prohibición en `localStorage`:**
  - Queda terminantemente prohibido almacenar contraseñas, tokens JWT de acceso sensible, o secretos en el `localStorage` o `sessionStorage` del navegador.
  - `localStorage` se reserva exclusivamente para preferencias de interfaz no sensibles (ej. tema visual, filtros colapsados).

---

## 4. Hashing de Contraseñas

* Se utilizará `password_hash()` con el algoritmo **Argon2id** cuando esté soportado por el entorno PHP, o `BCRYPT` (coste mínimo 12) como alternativa segura.
* Verificación obligatoria mediante `password_verify()`.
* Prohibido el uso de MD5, SHA-1, SHA-256 sin sal o almacenamiento en texto claro.

---

## 5. Prevención de Inyección SQL

* Todas las consultas a la base de datos deben utilizar sentencias preparadas de **PDO** con parámetros vinculados (`bindValue` / `execute([$params])`).
* Prohibida la concatenación o interpolación directa de variables en cadenas SQL.

---

## 6. Validación y Seguridad de Archivos (Uploads)

Todo archivo recibido mediante subida debe superar las siguientes validaciones en backend:
1. **MIME Type Real:** Inspección de cabeceras binarias y contenido (vía `finfo` / `mime_content_type`), nunca confiando en el nombre o extensión provisto por el usuario.
2. **Extensión Permitida:** Lista blanca estricta (ej. `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`).
3. **Tamaño Máximo:** Restricción estricta de tamaño en megabytes.
4. **Dimensiones:** Validación de ancho/alto máximo para imágenes para evitar ataques de desbordamiento de memoria (pixel flood).
5. **Nombre de Archivo:** Asignación de un nombre único generado por el servidor (UUID + extensión permitida). Nunca guardar con el nombre original del cliente.
6. **Ejecución Deshabilitada:** El directorio de uploads no debe permitir la ejecución de scripts PHP (`.htaccess` con `php_flag engine off` o Nginx sin pass a php-fpm).

---

## 7. Manejo Seguro de Errores y Registro de Auditoría

* **Respuestas al Cliente:** En caso de excepción o error de base de datos, el cliente recibirá únicamente un mensaje genérico y un código HTTP adecuado (ej. `500 Internal Server Error`). Los detalles de la traza de ejecución o esquemas SQL nunca deben exponerse en la respuesta JSON.
* **Logs de Auditoría:**
  - Registrar: fecha/hora, IP, evento (login exitoso, fallo de login, publicación, cambio de usuario, revocación de sesión).
  - **Nunca registrar:** contraseñas, tokens, credenciales de base de datos ni secretos HMAC.

