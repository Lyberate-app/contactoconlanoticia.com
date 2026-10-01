# LYBERATE — ARQUITECTURA DE INTEGRACIÓN HISTÓRICA EXTERNA WORDPRESS (NO MIGRACIÓN MASIVA)

## 1. Decisión Arquitectónica Definitiva

> [!IMPORTANT]
> **DECISIÓN CERRADA:** La antigua página en WordPress **NO será importada masivamente a la base de datos moderna de Lyberate.**
> 
> No existen ni se ejecutarán scripts de migración masiva, tablas de importación masiva, ni secciones segregadas de "Artículos heredados / Legacy".
> 
> En su lugar, Lyberate implementa una **Integración Desacoplada de Solo Lectura** mediante el servicio hemerográfico `wordpressConnector`, tratando el WordPress histórico como un archivo documental remoto federado.

---

## 2. Principios de la Integración Desacoplada

```text
                               ┌──────────────────────────────────────────────────────────┐
                               │                    USUARIO / LECTOR                      │
                               └────────────────────────────┬─────────────────────────────┘
                                                            │
                                                            ▼
                               ┌──────────────────────────────────────────────────────────┐
                               │       Buscador Híbrido Unificado: /buscar?q=...          │
                               └─────────────┬──────────────────────────────┬─────────────┘
                                             │                              │
                     ┌───────────────────────┴──────┐      ┌────────────────┴───────────────────────┐
                     │ Portal Nativo Lyberate       │      │ Conector Hemeroteca WordPress          │
                     │ (Noticias Modernas MySQL)    │      │ (Archivo Histórico Externo)            │
                     └──────────────────────────────┘      └────────────────┬───────────────────────┘
                                                                            │
                                                       ┌────────────────────▼───────────────────────┐
                                                       │  Mecanismos de Resiliencia:                │
                                                       │  1. Circuit Breaker (3 fallos -> 60s OPEN) │
                                                       │  2. Timeout AbortController (5000ms máx)   │
                                                       │  3. Caché de 2 niveles (Memoria + Storage) │
                                                       │  4. Fallback Histórico Guárico             │
                                                       └────────────────────────────────────────────┘
```

1. **Aislamiento de Fallos (Fault Tolerance):**
   Si el servidor histórico de WordPress experimenta indisponibilidad, lentitud o errores 500/502, **el portal de Contacto con la Noticia continúa funcionando al 100%**, aislando la degradación a la hemeroteca y activando el fallback local.

2. **Percepción Pública Integrada:**
   En la interfaz pública (`/buscar`), los resultados históricos aparecen integrados en la hemeroteca con la insignia distintiva **"Archivo Histórico"**, manteniendo la identidad periodística unificada de *Contacto con la Noticia*.

3. **Cero Polución de Base de Datos:**
   La base de datos MySQL moderna de Lyberate permanece limpia, normalizada y optimizada para alto tráfico y redacción activa, sin miles de entradas obsoletas con HTML sucio de plugins antiguos.

---

## 3. Especificación Técnica del Conector (`wordpressConnector.ts`)

El conector reside en `src/services/wordpressConnector.ts` y expone los siguientes contratos tipados:

### A. Detección de Salud y Estado
```typescript
wordpressConnector.checkHealth(): Promise<WordPressConnectorStatus>
// Retorna: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'READY_FOR_BACKEND'
```

### B. Consulta de Hemeroteca
```typescript
wordpressConnector.queryArchive(query: WordPressHistoricQuery): Promise<WordPressHistoricResponse>
```

### C. Parámetros de Resiliencia
- **Endpoint por defecto:** `https://contactoconlanoticia.com/wp-json/wp/v2/posts`
- **Timeout estricto:** `5000ms` vía `AbortController`.
- **Caché TTL:** `15 minutos` en memoria y persistencia `sessionStorage` para consultas repetidas.
- **Circuit Breaker:**
  - `CLOSED`: Peticiones normales.
  - Al acumular 3 fallos consecutivos con error de red o timeout >5s, pasa a `OPEN`.
  - Ventana de enfriamiento: `60 segundos` antes de probar una nueva petición en `HALF_OPEN`.

---

## 4. Estructura de Datos Normalizada (`WordPressHistoricArticle`)

```typescript
export interface WordPressHistoricArticle {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  author_name: string;
  categories: string[];
  tags: string[];
  featured_image_url?: string | null;
  canonical_url: string;
  original_url?: string;
  is_external_archive: true;
  archive_source: 'wordpress_legacy';
}
```

---

## 5. Implementación en Backend PHP (Futura Fase / Producción)

Para la ejecución en producción sin depender de llamadas directas desde el navegador del cliente (evitando problemas de CORS o sobrecarga del WordPress antiguo), se ha preparado el contrato backend proxy:

```text
GET /api/v1/archive/query?search={q}&page={p}&per_page={limit}
GET /api/v1/archive/health
```

El backend PHP mantendrá una caché Redis/MySQL temporal con los resultados históricos saneados.
