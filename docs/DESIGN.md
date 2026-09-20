# LYBERATE — FILOSOFÍA DE DISEÑO EDITORIAL Y UX

## 1. Misión Editorial

El diseño de **Contacto con la Noticia** y de cualquier medio creado sobre Lyberate debe transmitir la seriedad, credibilidad y claridad de un medio periodístico profesional.

La tecnología debe estar al servicio de la lectura y no ser un espectáculo visual invasivo.

---

## 2. Rechazo Explícito a Clichés de Interfaces Generadas por IA

Para asegurar una apariencia artesanal, sobria y genuinamente periodística, se establecen las siguientes restricciones estrictas:

* ❌ **NO al Glassmorphism ni efectos de desenfoque excesivos (`backdrop-blur`).**
* ❌ **NO a gradientes decorativos estridentes ni colores neón.**
* ❌ **NO a exceso de tarjetas redondeadas (`rounded-3xl` o cards repetitivas sin jerarquía).**
* ❌ **NO a sombras difusas gigantescas (`shadow-2xl`).**
* ❌ **NO a botones desproporcionados ni estética de "SaaS Landing Page".**
* ❌ **NO a animaciones constantes o efectos parallax que distraigan de la lectura.**
* ❌ **NO al uso de emojis como iconografía formal.**

---

## 3. Principios de Diseño Editorial

* **Jerarquía Tipográfica Robusta:** Claridad absoluta entre antetítulo, titular principal, subtítulo, entradilla, cuerpo de texto y pie de foto.
* **Ritmo Visual y Espacios:** Uso generoso de márgenes y respiros visuales para facilitar la lectura prolongada sin fatiga.
* **Alto Contraste:** Cumplimiento de ratios de contraste WCAG AA/AAA entre fondos y textos.
* **Iconografía con Propósito:** Uso exclusivo de **Lucide React** (`lucide-react`) de forma sutil y funcional (búsqueda, menú, compartir, flechas de navegación).
* **Tratamiento Fotográfico:** Respeto a las proporciones de las imágenes periodísticas, con créditos visibles, pies de foto explicativos y prevención de movimientos bruscos de maquetación (CLS).

---

## 4. Accesibilidad (a11y) y Responsive

* **HTML Semántico:** Uso riguroso de `<main>`, `<article>`, `<header>`, `<nav>`, `<footer>`, `<section>`, `<aside>`.
* **Navegación por Teclado:** Focos visibles e interactivos en todos los enlaces y controles (`focus-visible`).
* **Etiquetado:** Atributos `aria-label` claros y textos alternativos (`alt`) obligatorios en imágenes informativas.
* **Mobile-First Real:** La experiencia en dispositivos móviles se diseña pensando en la lectura a una mano, menús fluidos y tiempos de carga instantáneos en redes celulares.

