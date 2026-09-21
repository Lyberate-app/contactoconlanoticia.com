import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
      <div className="space-y-2">
        <span className="font-serif font-black text-6xl sm:text-8xl text-stone-300 block">
          404
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
          Página no encontrada
        </h1>
        <p className="text-stone-600 text-sm max-w-md mx-auto leading-relaxed">
          La dirección web que ha intentado visitar no corresponde a ninguna noticia o sección activa de Contacto con la Noticia. Es posible que haya sido movida, renombrada o eliminada.
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded text-xs font-semibold hover:bg-stone-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la portada</span>
        </Link>
        <Link
          to="/buscar"
          className="inline-flex items-center gap-2 border border-stone-300 text-stone-800 px-5 py-2.5 rounded text-xs font-semibold hover:bg-stone-100 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>Buscar en el archivo</span>
        </Link>
      </div>

      <div className="pt-8 border-t border-stone-200 text-xs text-stone-500">
        <p className="mb-3 font-semibold uppercase tracking-wider text-stone-600">
          O explore nuestras secciones principales:
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-stone-700">
          <Link to="/categoria/regionales" className="hover:underline hover:text-red-700">Regionales</Link>
          <span>·</span>
          <Link to="/categoria/sucesos" className="hover:underline hover:text-red-700">Sucesos</Link>
          <span>·</span>
          <Link to="/categoria/comunidades" className="hover:underline hover:text-red-700">Comunidades</Link>
          <span>·</span>
          <Link to="/categoria/municipales" className="hover:underline hover:text-red-700">Municipales</Link>
          <span>·</span>
          <Link to="/categoria/turismo" className="hover:underline hover:text-red-700">Turismo</Link>
          <span>·</span>
          <Link to="/categoria/internacionales" className="hover:underline hover:text-red-700">Internacionales</Link>
        </div>
      </div>
    </div>
  );
};
