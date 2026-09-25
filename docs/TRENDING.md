# Motor de Tendencias y Algoritmo de Decaimiento Temporal (Trending Engine)

## 1. Popularidad Histórica ("Más Leídas") vs. Velocidad Editorial ("En Tendencia")

En el periodismo digital contemporáneo, un error frecuente es confundir las noticias **más visitadas** con las noticias **en tendencia**:

* **"Más Leídas" (Popularidad Acumulada)**: Métrica estática basada en el volumen absoluto de visitas acumuladas a lo largo de días o semanas. Es útil para medir la trascendencia de una cobertura, pero tiende a monopolizar la portada con notas añejas.
* **"En Tendencia" (Velocidad y Tracción Reciente)**: Métrica dinámica que evalúa la **aceleración del tráfico** en las últimas horas, ponderando la frescura cronológica y el engagement real.

---

## 2. Fórmula Matemática del Trending Score

Para calcular el índice de tendencia sin incurrir en fórmulas opacas de caja negra ni provocar cuellos de botella computacionales, el motor de Lyberate implementa la siguiente función determinista:

$$Score = \frac{(V_{24h} \times W_{24h}) + (V_{3h} \times W_{3h}) + (S \times W_{s}) + (R \times W_{r})}{(T_{hours} + T_{offset})^\gamma}$$

### Coeficientes y Parámetros Estándar:

| Variable | Descripción | Ponderación por Defecto | Justificación Editorial |
|---|---|---|---|
| $V_{24h}$ | Visitas totales en las últimas 24 horas. | $W_{24h} = 1.0$ | Proporciona una base sólida de interés general. |
| $V_{3h}$ | Visitas concentradas en las últimas 3 horas. | $W_{3h} = 3.0$ | Premia la aceleración y tracción inmediata. |
| $S$ | Acciones de compartir registradas (`share`). | $W_{s} = 5.0$ | Señal fuerte de viralidad orgánica en redes/WhatsApp. |
| $R$ | Lecturas efectivas registradas (`article_read`). | $W_{r} = 4.0$ | Filtra el clickbait superficial asegurando lectura real. |
| $T_{hours}$ | Antigüedad del artículo en horas desde publicación. | Variable continua ($\ge 0$) | Parámetro temporal de envejecimiento. |
| $T_{offset}$ | Desplazamiento inicial de amortiguación. | $2.0$ horas | Evita divisiones por cero y volatilidad excesiva en los primeros 10 minutos. |
| $\gamma$ (Gamma) | **Exponente de decaimiento temporal**. | $1.4$ | Aplica una penalización super-lineal a noticias de más de 12 horas. |

---

## 3. Demostración Numérica Comparativa

Analicemos dos artículos en el sistema:

### Noticia A: Noticia Antigua de Gran Impacto
* **Antigüedad ($T$):** 48 horas ($T_{hours} = 48$)
* **Visitas históricas 24h ($V_{24h}$):** 25,000
* **Visitas últimas 3h ($V_{3h}$):** 30
* **Compartidos ($S$):** 2
* **Lecturas ($R$):** 15

$$Score_A = \frac{(25,000 \times 1.0) + (30 \times 3.0) + (2 \times 5.0) + (15 \times 4.0)}{(48 + 2)^{1.4}} = \frac{25,000 + 90 + 10 + 60}{50^{1.4}} = \frac{25,160}{240.2} \approx \mathbf{104.7}$$

### Noticia B: Cobertura de Última Hora en Rápido Ascenso
* **Antigüedad ($T$):** 1 hora ($T_{hours} = 1$)
* **Visitas históricas 24h ($V_{24h}$):** 3,200
* **Visitas últimas 3h ($V_{3h}$):** 2,500
* **Compartidos ($S$):** 140
* **Lecturas ($R$):** 1,800

$$Score_B = \frac{(3,200 \times 1.0) + (2,500 \times 3.0) + (140 \times 5.0) + (1,800 \times 4.0)}{(1 + 2)^{1.4}} = \frac{3,200 + 7,500 + 700 + 7,200}{3^{1.4}} = \frac{18,600}{4.65} \approx \mathbf{4,000.0}$$

### Resultado Editorial:
* En la lista de **"Más Leídas"**, la Noticia A figura por encima de la Noticia B ($25,000$ vs $3,200$).
* En el ranking de **"En Tendencia"**, la Noticia B supera ampliamente a la Noticia A ($4,000.0$ vs $104.7$).
* La Noticia B se posiciona en el bloque principal de portada y califica automáticamente como candidata para Smart Push.

---

## 4. Integración en Portada (`HomePage.tsx`)

La interfaz de usuario expone esta distinción mediante un selector segmentado estilo Apple en la barra lateral:
1. Pestaña **"🔥 En Tendencia"**: Renderiza los artículos con mayor `trend_score` calculado con decaimiento activo. Muestra el distintivo de crecimiento acelerado.
2. Pestaña **"📈 Más Leídas"**: Renderiza los artículos con mayor número acumulado de visitas en 24 horas.
