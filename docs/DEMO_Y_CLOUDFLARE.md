# Demo del panel y publicación en Cloudflare Pages

## Preparar la demo local

Desde la raíz del proyecto:

```powershell
npm ci
npm run dev
```

Abre `http://localhost:5173/`. La portada carga una noticia ficticia de ejemplo y tres banners rotativos marcados **Demo**. La noticia puede abrirse directamente en `/noticia/ejemplo-editorial-obras-puente-regional` y muestra título SEO, negritas y una foto insertada en el cuerpo. En el modo demo, entra por **Redacción** y usa cualquier correo y contraseña no vacíos; la sesión y varios cambios de prueba se guardan solo en el navegador actual.

## Guion para mostrar las funciones

1. **Portada móvil:** reduce la ventana a móvil. El dock inferior es opaco; toca el rayo **Al Minuto** para abrir las noticias recientes. Abre **Secciones** para mostrar el acceso al buzón ciudadano, que ya no ocupa un botón del dock.
2. **Editor y formato:** entra a **Redactar Noticia**, escribe `La comunidad reportó mejoras en la vialidad`, selecciona una frase, abre **Formato** y elige **Colocar en Negrita**. El texto seleccionado se envuelve en `**...**`.
3. **Insertar y comprimir fotos:** en el cuerpo del artículo elige **Insertar Foto** y luego sube una imagen. También puedes pegarla o arrastrarla. La subida común la redimensiona a un máximo de 1200 px y la inserta junto al cursor.
4. **SEO de una noticia:** completa título, entradilla y texto alternativo de portada; abre los campos SEO del artículo y define título, descripción y URL canónica. Guarda y abre **Marketing y SEO → SEO** para ver la auditoría y las observaciones restantes.
5. **Notificaciones push:** abre **Marketing y SEO → Push**, selecciona una oportunidad, revisa título y mensaje y prueba el envío en modo demo. Consulta los clics y CTR en el mismo panel.
6. **Usuarios y autores:** abre **Usuarios y Roles → Agregar usuario**, registra un autor de prueba, asigna **Autor / Periodista** y guárdalo. Cambia el rol desde **Editar**. En modo demo solo se guarda en ese navegador.
7. **Publicidad:** la portada ya muestra tres banners ficticios, cambia con las flechas o los indicadores y rota automáticamente. Abre **Campañas Publicitarias** para ver las campañas demo o crear otra; los anuncios de muestra apuntan a `example.com` y no representan clientes reales.
8. **Configuración:** en **Configuración & Marca** prueba identidad, colores, tipografías, PWA, funciones y exportación/importación JSON. Para la demo, usa valores fáciles de reconocer y restablécelos al terminar.
9. **Estadísticas y PDF:** abre **Estadísticas**, cambia el período y revisa lecturas, dispositivos, secciones y autores. Pulsa **Exportar PDF** y elige **Guardar como PDF** en el diálogo de impresión del navegador.
10. **Redes sociales:** abre **Integraciones** para ver Facebook, Instagram, Telegram y X. En modo demo aparecen desconectadas: el panel no simula una autorización real ni publica en cuentas.
11. **SEO nativo:** las noticias usan metadatos canónicos, Open Graph, Twitter Cards y JSON-LD; el portal también incluye sitemap, sitemap de News, feed y robots.txt.

## Subir el proyecto a GitHub

Esta copia de trabajo no contiene una carpeta `.git`. Crea un repositorio vacío en GitHub y luego, en PowerShell, ejecuta desde la carpeta del proyecto. Sustituye la URL por la de tu repositorio:

```powershell
git init -b main
git add .
git status
git commit -m "Preparar demo editorial para Cloudflare Pages"
git remote add origin https://github.com/USUARIO/REPOSITORIO.git
git push -u origin main
```

Antes de confirmar, revisa `git status`. El `.gitignore` excluye `.env`, `node_modules` y `dist`; no subas contraseñas, claves privadas ni tokens.

## Publicar la demo en Cloudflare Pages

1. En Cloudflare, abre **Workers & Pages → Create application → Pages → Connect to Git** y autoriza el repositorio de GitHub.
2. Selecciona la rama `main` como rama de producción y deja vacío el directorio raíz.
3. Configura el comando de build como `npm ci && npm run build` y el directorio de salida como `dist`.
4. Añade variables de entorno de **Production** y **Preview** antes del primer despliegue:

   - `VITE_DATA_MODE` = `mock` para que tu socio pueda navegar por la demo sin el backend.
   - `VITE_SITE_URL` = la URL `https://...pages.dev` que Cloudflare asigne, para que los enlaces canónicos de la demo no apunten al dominio de producción.

5. Guarda y despliega. Comparte con tu socio la URL de producción `https://<proyecto>.pages.dev`. Las rutas como `/admin/marketing` y `/admin/analytics` pueden abrirse directamente gracias a `public/_redirects`.
6. Para cada actualización, haz `git push` a `main`; Cloudflare reconstruirá el sitio automáticamente. Los pull requests generan previews si la integración de Pages está habilitada.

## Límites de esta demo

Cloudflare Pages publica el frontend, no una API PHP ni una base de datos. El modo demo usa datos de muestra/locales por navegador; los usuarios, preferencias y campañas creados en tu navegador no se comparten automáticamente con el de tu socio.

Para producción con datos compartidos, el backend debe estar desplegado y disponible bajo `/api/v1` en el mismo origen o detrás de un proxy de Cloudflare. Configurar `VITE_DATA_MODE=api` sin esa API hará que las solicitudes fallen. La creación real de usuarios/roles y el OAuth de publicación social también requieren los endpoints de backend que están marcados `PLANNED` en `docs/API.md`.