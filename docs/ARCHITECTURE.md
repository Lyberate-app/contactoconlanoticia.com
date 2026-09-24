# LYBERATE — ARQUITECTURA DEL SISTEMA

## 1. Visión General

Lyberate es una plataforma tecnológica moderna diseñada para alimentar portales de noticias y medios editoriales profesionales. Su implementación principal es **Contacto con la Noticia** (`contactoconlanoticia.com`).

---

## 2. Enfoque Actual: Frontend Desacoplado & Repositorio LocalStorage

Para maximizar la velocidad de iteración, rediseño y desarrollo de componentes de interfaz y experiencia de usuario (UI/UX), la plataforma opera de manera **100% autónoma en el cliente**:

```text
LYBERATE/
├── frontend/    # Aplicación React 19 + TypeScript + Vite + Tailwind CSS
├── docs/        # Documentación de arquitectura, auditoría y contratos
└── tools/       # Herramientas de soporte
```

### Principio de Diseño: Patrón Repositorio (Clean Architecture)
Los componentes de la aplicación (`pages/`, `components/`) **nunca interactúan directamente con la capa de persistencia**. Toda interacción de datos se canaliza a través de servicios tipados asíncronos (`frontend/src/services/`):

1. **`editorialService`**: Ciclo de vida de artículos, categorías, autores y métricas.
2. **`publicApi`**: Portada, lectura de artículos, búsqueda avanzada y taxonomías.
3. **`mediaService`**: Biblioteca multimedia digital (almacenamiento de previsualizaciones en base64 Data URLs).
4. **`adsApi`**: Pautas publicitarias en slots canónicos, medición de impresiones y clics.
5. **`submissionApi`**: Buzón ciudadano, flujo de moderación y conversión a borrador editorial.
6. **`authService`**: Sesión editorial, credenciales y verificación.

Debajo de estos servicios opera el adaptador **`mockStorage`** implementado sobre `localStorage`, garantizando persistencia reactiva inmediata en el navegador sin dependencias de red ni bases de datos activas en el entorno local.

---

## 3. Hoja de Ruta: Transición hacia la Nueva API REST

Cuando se completen las modificaciones de frontend y diseño:

```text
                  ┌──────────────────────────────────────────────┐
                  │          React 19 Frontend (Vite)            │
                  │    Componentes & Vistas (100% Inalterados)   │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │    Capa de Servicios Tipados (/services/)    │
                  └──────────────┬────────────────────────┬──────┘
                                 │                        │
                    (Actual: Modo Mock)        (Futuro: Modo API)
                                 │                        │
                                 ▼                        ▼
                  ┌────────────────────────┐    ┌────────────────────────┐
                  │  LocalStorage Store    │    │    Nueva API REST      │
                  │  (Desarrollo Ágil)     │    │  (Backend Producción)  │
                  └────────────────────────┘    └────────────────────────┘
```

1. **Cero Refactorización en UI:** Los componentes seguirán consumiendo las mismas funciones y firmas TypeScript (`getArticles()`, `saveArticle()`, `uploadMedia()`, etc.).
2. **Conmutación por Entorno:** Mediante `VITE_DATA_MODE=api` y `VITE_API_BASE_URL`, la capa de servicios delegará las llamadas al cliente HTTP (`apiClient`) para comunicarse con la nueva API REST.
3. **Contratos Estables:** Los modelos y esquemas definidos en `frontend/src/types/` constituyen el contrato de datos formal para el nuevo backend.
