export default function NotFound() {
  return (
    <div className="container-editorial py-20 text-center">
      <div className="max-w-md mx-auto">
        <p className="text-7xl font-serif font-black text-gray-200 mb-4">404</p>
        <h1 className="text-2xl font-serif font-bold text-gray-900 mb-3">
          Página no encontrada
        </h1>
        <p className="text-gray-500 mb-8">
          La noticia que buscas no existe, fue eliminada o cambió de dirección.
        </p>
        <div className="flex justify-center gap-3">
          <a href="/" className="btn-primary">
            Ir a inicio
          </a>
          <a href="/buscar" className="btn-secondary">
            Buscar noticias
          </a>
        </div>
      </div>
    </div>
  )
}

