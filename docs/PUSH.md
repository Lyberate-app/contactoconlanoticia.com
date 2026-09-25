# Motor de Notificaciones Web Push Inteligentes (Smart Push Engine)

## 1. Filosofía Editorial Anti-Spam

El principio rector del sistema Smart Push en **Contacto con la Noticia / Lyberate** es categórico:

> **Publicar una noticia NO debe disparar automáticamente un Web Push a los lectores.**

El bombardeo constante de alertas satura al lector, deteriora la reputación del medio y dispara la tasa de desuscripción de la PWA. El sistema opera como un **filtro editorial inteligente** que analiza métricas de tracción orgánica antes de sugerir un envío a la mesa de redacción.

---

## 2. Detección Automática de Candidatas

El motor de Smart Push escanea continuamente el rendimiento de los artículos publicados y clasifica como **candidatas** únicamente a aquellas piezas que cumplen al menos uno de los siguientes umbrales:

1. **Aceleración de Audiencia (`growth_rate_percent` $\ge 50$%)**: El tráfico en las últimas 3 horas supera en un 50% la media habitual del portal.
2. **Alta Conversión a Lectura (`read_ratio` $\ge 60$%)**: Al menos el 60% de los visitantes que entran a la nota se quedan $\ge 15$ segundos o leen más del 50% del contenido.
3. **Alto Trending Score (`trend_score` $\ge 100$)**: La combinación de lecturas, compartidos y visitas frescas supera el corte de tracción.
4. **Alerta de Última Hora (`is_breaking === true`)**: Contenido de emergencia pública marcado expresamente por la dirección periodística.

---

## 3. Políticas de Enfriamiento (Cooldown Safeguards)

Para garantizar la armonía en la bandeja de entrada del usuario, el motor impone dos barreras estrictas de enfriamiento (`cooldown`):

### A. Cooldown Global del Medio (Mínimo 4 horas)
* Entre dos campañas de push masivas dirigidas a la base general de suscriptores debe transcurrir un lapso obligatorio de **al menos 4 horas**.
* El dashboard bloquea el botón de envío y exhibe una advertencia visible si se intenta emitir antes de cumplirse la ventana de descanso.

### B. Cooldown por Artículo (Mínimo 24 horas)
* Una misma noticia no puede ser enviada nuevamente vía Push a los mismos lectores dentro de una ventana de **24 horas**, evitando la reiteración de contenidos ya notificados.

---

## 4. Reglas de Redacción y Experiencia Móvil

Las pantallas de dispositivos móviles (Android / iOS con WebKit Web Push) truncan severamente los textos largos en el centro de notificaciones:

* **Regla de los 60 Caracteres en el Título**: El modal de despacho en redacción incluye un contador en tiempo real con límite estricto de **60 caracteres**. Los títulos concisos garantizan que el mensaje sea 100% legible sin elipsis (`...`).
* **Cuerpo de Notificación $\le 120$ Caracteres**: El resumen o bajada informativa debe condensar el hecho noticioso en menos de 120 caracteres.
* **Íconos y Badges**: Empleo de íconos cuadrados monocromáticos (`/icons/icon-192x192.png`) y badges que cumplen con las directrices de Google y Apple.

---

## 5. Modos de Despacho Editorial

| Modo | Audiencia | Prioridad | Restricciones de Cooldown |
|---|---|---|---|
| `SMART` | Suscriptores afines a la categoría del artículo o con historial activo. | Normal | Aplica Cooldown Global (4h) y Cooldown por Artículo (24h). |
| `BREAKING` | Base total de suscriptores sin segmentación por categoría. | Urgente / Alta | Puede anular el cooldown global previa confirmación de dos factores en redacción. |

---

## 6. Telemetría de Clics y Medición de CTR

El Service Worker (`public/sw.js`) intercepta el evento `notificationclick`:
1. Inyecta automáticamente los parámetros UTM en la URL de destino:
   `https://contactoconlanoticia.com/noticia/{slug}?utm_source=webpush&utm_campaign={campaign_uuid}`
2. Al cargar la página, `analyticsService` detecta el parámetro `utm_source=webpush` y emite una baliza `push_click`.
3. El panel editorial calcula el **CTR real** de cada campaña:
   $$CTR = \frac{\text{Clics Registrados}}{\text{Notificaciones Entregadas}} \times 100$$
   mostrando el impacto directo del envío en el tráfico del periódico.
