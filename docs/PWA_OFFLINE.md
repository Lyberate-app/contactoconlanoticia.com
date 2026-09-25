# Motor de Lectura Offline y PWA (Offline Editorial Engine)

## 1. Visión y Arquitectura Dual de Almacenamiento

El lector de un periódico digital consume noticias en condiciones de conectividad intermitente (metro, transporte público, zonas rurales o caídas de red). La plataforma implementa una **estrategia de almacenamiento dual**:

```
                       ┌───────────────────────────────┐
                       │    Plataforma Web (PWA)       │
                       └──────────────┬────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│        Cache Storage          │               │          IndexedDB            │
│       (Browser Native)        │               │   (lyberate_editorial_db)     │
├───────────────────────────────┤               ├───────────────────────────────┤
│ • App Shell (HTML, CSS, JS)   │               │ • Artículos completos (JSON)  │
│ • Fuentes tipográficas        │               │ • Metadatos editoriales       │
│ • Íconos SVG y logotipos      │               │ • Estructuras de contenido    │
│ • Portadas e imágenes binarias│               │ • Marcas de tiempo y TTL      │
└───────────────────────────────┘               └───────────────────────────────┘
```

---

## 2. Motor IndexedDB (`offlineStorage.ts`)

Para evitar problemas de cuotas opacas en Cache Storage y permitir consultas estructuradas por categoría, estado y fecha:

* **Base de datos:** `lyberate_editorial_db` (Versión 1).
* **Object Store:** `articles`.
* **Primary Key:** `article_uuid`.
* **Índices secundarios:**
  * `slug` (búsqueda instantánea cuando el usuario visita `/noticia/:slug`).
  * `cached_at` (orden cronológico de guardado).
  * `last_accessed` (política de desalojo LRU).
  * `priority` (jerarquía de permanencia en caché).

---

## 3. Política de Capacidad y Desalojo Inteligente (LRU por Prioridades)

Para proteger la memoria de dispositivos móviles de gama media y baja, el motor impone un **tope máximo estricto de 50 artículos almacenados**:

### A. Jerarquía de Prioridades

| Nivel de Prioridad | Categoría | Valor | Criterio de Retención |
|---|---|---|---|
| 4 (Máxima) | `RECENT_READ` | 4 | Artículos que el usuario abrió y leyó recientemente en la sesión actual. Son los últimos en ser eliminados. |
| 3 (Alta) | `TRENDING` | 3 | Artículos en tendencia precheados para lectura rápida. |
| 2 (Media) | `BREAKING` | 2 | Coberturas de última hora. |
| 1 (Baja) | `GENERAL` | 1 | Noticias generales precheadas en segundo plano. |

### B. Algoritmo de Desalojo (LRU)
Cuando la base de datos alcanza los 50 artículos y se intenta guardar uno nuevo:
1. El motor localiza los artículos con la **menor prioridad** (`GENERAL`).
2. Entre ellos, selecciona aquel cuyo `last_accessed` sea el más antiguo (Least Recently Used).
3. Elimina dicho registro de IndexedDB y purga su portada correspondiente de Cache Storage.
4. Solo si no existen artículos de prioridad baja, procede a desalojar el siguiente nivel jerárquico.

### C. Limpieza Automática por Tiempo de Vida (TTL: 72 Horas)
* Las noticias con más de 72 horas en almacenamiento local son marcadas como caducadas y purgadas automáticamente en segundo plano al reconectar el dispositivo a internet, asegurando que el lector no consuma información obsoleta.

---

## 4. Experiencia de Usuario en Portada y Artículos

### A. Biblioteca Offline (`PwaManager.tsx`)
* **Botón Flotante y Drawer Lateral**: El lector puede abrir en cualquier momento su bandeja de lectura offline.
* **Contador de Capacidad**: Muestra el indicador `X / 50 artículos guardados` y el peso total consumido en kilobytes/megabytes.
* **Vaciado de Caché**: Permite al usuario liberar el espacio local con un solo clic.

### B. Banner Informativo en Artículo (`ArticlePage.tsx`)
* Si el dispositivo pierde la conexión a internet y el usuario ingresa a una noticia previamente guardada, el portal se renderiza normalmente y despliega un banner discreto:
  > *"Modo Sin Conexión: Estás leyendo una copia guardada en tu dispositivo."*
* Las interacciones de lectura se almacenan localmente y se sincronizan al recuperar la conectividad.
