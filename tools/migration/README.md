# Lyberate — Historical WordPress Integration Architecture

> **Decisión Oficial de Arquitectura:** `NO MIGRACIÓN MASIVA DE WORDPRESS`  
> **Patrón Adoptado:** `Conector Externo Desacoplado (Decoupled Historical Source)`

## 1. Principio Fundamental
El archivo histórico de la antigua instalación de WordPress de **Contacto con la Noticia** **NO es importado masivamente a la base de datos de Lyberate**.

En su lugar:
* La plataforma opera de manera desacoplada consumiendo WordPress como una **fuente histórica externa de solo lectura**.
* No se crean migradores masivos que contaminen la base de datos de producción con schemas legacy.
* No se crean secciones segregadas como "Legacy" o "Noticias Antiguas".
* Para el lector público, la experiencia es fluida e integrada bajo la identidad editorial de **Contacto con la Noticia**.

## 2. Componentes del Conector Desacoplado
El servicio `src/services/wordpressConnector.ts` implementa:
1. **Health Check & Latency Probing:** Detección en tiempo real de la disponibilidad de WordPress.
2. **Circuit Breaker:** Apertura automática del circuito ante 3 fallos consecutivos con rearme a los 60s.
3. **Timeout Estricto (5s):** Ninguna petición a WordPress puede bloquear el renderizado del portal.
4. **Caché en Dos Niveles:** Memoria + LocalStorage con TTL de 1 hora.
5. **Fallback Silencioso:** Si WordPress cae o experimenta latencia, el portal continúa operando al 100% sin degradar la experiencia de usuario.
6. **Buscador Híbrido:** Permite buscar tanto en las publicaciones de Lyberate como en el archivo histórico mediante consulta unificada.

## 3. Estado de la Integración
* **Contrato:** `src/types/wordpress.ts` (`WordPressHistoricArticle`, `WordPressArchiveQuery`, `WordPressConnectorStatus`).
* **Servicio:** `src/services/wordpressConnector.ts`.
* **Modo:** `READY_FOR_BACKEND` (Conectividad nativa al endpoint REST `/wp-json/wp/v2/posts` y fallback local resiliente en entornos de desarrollo).
