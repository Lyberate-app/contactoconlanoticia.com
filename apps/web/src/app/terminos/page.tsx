import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Términos y Condiciones de Uso',
  description: 'Términos y condiciones para el uso y acceso a Contacto con la Noticia',
}

export default function TermsPage() {
  return (
    <div className="container-article py-12">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700">Inicio</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">Términos y Condiciones</span>
      </nav>

      <h1 className="font-serif font-black text-3xl md:text-4xl text-gray-900 mb-6">
        Términos y Condiciones de Uso
      </h1>

      <div className="prose-editorial text-gray-700 space-y-4">
        <p>
          El acceso y uso de los servicios informativos prestados por <strong>Contacto con la Noticia</strong> atribuye la condición de usuario e implica la aceptación plena de los presentes términos.
        </p>

        <h2>1. Propiedad Intelectual</h2>
        <p>
          Todos los contenidos publicados, incluyendo textos periodísticos, reportajes, fotografías originales, logotipos, gráficos e interfaces son propiedad de Contacto con la Noticia o de sus respectivos autores bajo licencia, encontrándose protegidos por las leyes internacionales de propiedad intelectual.
        </p>

        <h2>2. Uso Permitido</h2>
        <p>
          El usuario está autorizado a leer, compartir y citar fragmentos de las notas informativas, siempre y cuando se otorgue el crédito explícito con un enlace directo y visible al artículo original publicado en nuestro sitio web.
        </p>

        <h2>3. Responsabilidad Editorial</h2>
        <p>
          Contacto con la Noticia se compromete con la veracidad, rigor y contrastación de la información. No obstante, las opiniones emitidas por columnistas o redactores invitados en artículos de opinión pertenecen exclusivamente a sus autores y no reflejan necesariamente la línea institucional del medio.
        </p>

        <h2>4. Modificaciones</h2>
        <p>
          Nos reservamos el derecho de actualizar estos términos en cualquier momento para adaptarnos a cambios legislativos o mejoras operativas en la plataforma.
        </p>

        <p className="text-xs text-gray-400 mt-8">
          Última actualización: Septiembre de 2026.
        </p>
      </div>
    </div>
  )
}

