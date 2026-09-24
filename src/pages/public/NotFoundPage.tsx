import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto py-16 text-center space-y-6">
      <div className="glass-card p-8 sm:p-10 rounded-[32px] space-y-4 shadow-xl">
        <span className="font-serif font-black text-6xl sm:text-8xl bg-gradient-to-tr from-rose-900 to-rose-500 bg-clip-text text-transparent block">
          404
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
          Página no encontrada
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
          La dirección web que ha intentado visitar no corresponde a ninguna noticia o sección activa de Contacto con la Noticia.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-rose-900 text-white px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-rose-950 transition-all shadow-md active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la portada</span>
          </Link>
          <Link
            to="/buscar"
            className="inline-flex items-center gap-2 glass-pill text-stone-800 px-5 py-2.5 text-xs font-semibold hover:bg-white active:scale-95"
          >
            <Search className="w-4 h-4" />
            <span>Buscar en el archivo</span>
          </Link>
        </div>
      </div>

      <div className="glass-panel p-5 rounded-2xl text-xs text-stone-500">
        <p className="mb-3 font-semibold uppercase tracking-wider text-stone-600 text-[10px]">
          Secciones recomendadas:
        </p>
        <div className="flex flex-wrap justify-center gap-1.5 text-stone-700">
          {['Regionales', 'Sucesos', 'Comunidades', 'Municipales', 'Turismo', 'Internacionales'].map(name => (
            <Link
              key={name}
              to={`/categoria/${name.toLowerCase()}`}
              className="glass-pill px-3 py-1 rounded-full hover:text-rose-700 transition-colors"
            >
              {name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
