# Arquitectura del Motor de Analytics Editorial (Privacy-First)

## 1. Visión General

El sistema de Analytics de **Contacto con la Noticia / Lyberate** no es un mero contador de visitas (`views++`), sino un **motor de inteligencia y retención editorial**. 

Su propósito central es alimentar el ciclo de vida del contenido:
```
Lecturas Reales → Telemetría No Bloqueante → Agregación Diaria → Detección de Tendencias → Smart Push → Lectura Offline
```

---

## 2. Tipología y Jerarquía de Eventos

Para evitar métricas artificialmente infladas y reflejar el compromiso genuino del lector, el sistema clasifica las interacciones en 5 tipos diferenciados:

| Event Type | Definición Técnica | Cuándo se Dispara | Propósito Editorial |
|---|---|---|---|
| `page_view` | Visualización genérica de una página del portal. | Al montar rutas como `/`, `/categoria/:slug`, etc. | Tráfico bruto del sitio. |
| `article_view` | Impresión inicial del artículo en el viewport. | Al montar `ArticlePage` con el artículo cargado. | Demanda inicial del titular/noticia. |
| `article_read` | **Lectura efectiva** del contenido. | Cuando el lector permanece $\ge 15$s Y/O alcanza $\ge 50$% de scroll. | Lectores reales comprometidos (retención). |
| `share` | Acción explícita de compartir la noticia. | Click en botones de compartir (WhatsApp, X, Copiar enlace). | Virabilidad y tracción orgánica. |
| `push_click` | Apertura proveniente de una notificación Web Push. | Apertura de URL con parámetro `utm_source=webpush`. | Medición de CTR y efectividad de push. |

---

## 3. Telemetría No Bloqueante (Zero-Impact on UX)

El reporte de telemetría desde el cliente hacia el backend está diseñado bajo la premisa de **cero bloqueo** del hilo principal y persistencia ante cierres de pestaña:

1. **`navigator.sendBeacon(url, data)`**: Se utiliza como transporte primario. Los navegadores encolan y envían la baliza en segundo plano incluso si el usuario cierra el navegador o navega a otra URL.
2. **`fetch(url, { keepalive: true })`**: Mecanismo de contingencia si `sendBeacon` no está disponible o el payload excede su límite.
3. **Desacoplamiento asíncrono**: Ningún hook o llamada de analítica bloquea la renderización ni la carga de assets.

---

## 4. Filosofía Privacy-First y Prevención de Inflación

### A. Anti-Inflación sin Fingerprinting Invasivo
* **Sesión Anónima Efímera**: Se genera un identificador de sesión criptográfico en memoria/sessionStorage (`crypto.randomUUID()`).
* **Rotación Diaria**: Las sesiones caducan automáticamente a los 30 minutos de inactividad o a las 24 horas.
* **Deduplicación de `article_view`**: Si una misma sesión recarga la página o pulsa F5 repetidamente dentro de una ventana de 10 minutos, no se registra como nuevo lector único.
* **Separación de Vistas vs. Lecturas**: Una visita de 3 segundos no contabiliza como `article_read`.

### B. Cumplimiento de Privacidad (GDPR / ePrivacy)
* No se almacenan direcciones IP completas (en backend se truncan o hashean con salt rotativo: `SHA256(IP + SaltDiario)`).
* No se emplean super-cookies, canvas fingerprinting ni almacenamiento persistente de rastreo entre sitios.
* No se asocia actividad a identidades de usuario sin consentimiento explícito.

---

## 5. Pipeline de Ingesta y Agregación

Para mantener la base de datos de producción con tiempos de respuesta sub-10ms en el dashboard de redacción:

```
[Cliente Navegador]
       │ (sendBeacon / fetch keepalive)
       ▼
[POST /api/v1/analytics/events]
       │
       ▼
[Tabla Cruda: article_events] ─── (Buffer de alta velocidad)
       │
       ▼ (Cron Worker / Event Loop: cada hora)
[Tabla Agregada: article_analytics_daily]
       │
       ▼
[Dashboard Editorial / Trending Engine] (Consultas instantáneas con índices limpios)
```

### Esquema Físico (Extracto MySQL/PDO)
* `article_events`: Particionada por rango de fecha, retención máxima de 30 días para auditoría.
* `article_analytics_daily`: Clave primaria compuesta `(article_id, metric_date)`. Almacena totales pre-computados: `views`, `unique_visitors`, `reads_count`, `shares_count`, `push_clicks_count`, `trend_score`.
