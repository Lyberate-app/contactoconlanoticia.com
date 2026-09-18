import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad y tratamiento de datos de Contacto con la Noticia',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container-article py-12">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700">Inicio</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">Política de Privacidad</span>
      </nav>

      <h1 className="font-serif font-black text-3xl md:text-4xl text-gray-900 mb-6">
        Política de Privacidad
      </h1>

      <div className="prose-editorial text-gray-700 space-y-4">
        <p>
          En <strong>Contacto con la Noticia</strong>, la privacidad de nuestros lectores y usuarios es una prioridad fundamental. Esta política detalla los datos que recopilamos, cómo los utilizamos y las medidas que tomamos para garantizar su seguridad.
        </p>

        <h2>1. Información que Recopilamos</h2>
        <p>
          Recopilamos información de forma anónima sobre el tráfico y uso de nuestro portal web con el único propósito de mejorar el rendimiento, optimizar la experiencia de usuario y medir el alcance de nuestra cobertura informativa. No vendemos ni compartimos datos personales identificables con terceros con fines comerciales.
        </p>

        <h2>2. Cookies y Almacenamiento Local</h2>
        <p>
          Utilizamos cookies y tecnologías de almacenamiento local estrictamente necesarias para el funcionamiento del sitio, como recordar sus preferencias de navegación y gestionar sesiones seguras en áreas administrativas.
        </p>

        <h2>3. Enlaces a Sitios de Terceros</h2>
        <p>
          Nuestros artículos pueden contener enlaces a sitios externos de fuentes informativas, agencias de noticias o anunciantes. No nos hacemos responsables de las prácticas de privacidad ni del contenido de dichos sitios externos.
        </p>

        <h2>4. Contacto y Derechos</h2>
        <p>
          Si tiene dudas o inquietudes acerca de nuestra política de privacidad o desea solicitar información sobre sus datos, puede comunicarse con nosotros a través de los canales oficiales disponibles en nuestro pie de página.
        </p>

        <p className="text-xs text-gray-400 mt-8">
          Última actualización: Septiembre de 2026.
        </p>
      </div>
    </div>
  )
}

