import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, X, Trash2, ArrowRight, Clock } from 'lucide-react';
import { bookmarksService, BOOKMARKS_CHANGED_EVENT } from '../../services/bookmarksService';
import type { BookmarkedArticle } from '../../types/bookmarks';
import { formatDate } from '../../utils/date';

interface BookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({ isOpen, onClose }) => {
  const [bookmarks, setBookmarks] = useState<BookmarkedArticle[]>([]);

  const loadBookmarks = () => {
    setBookmarks(bookmarksService.getBookmarks());
  };

  useEffect(() => {
    loadBookmarks();

    const handleUpdate = () => {
      loadBookmarks();
    };

    window.addEventListener(BOOKMARKS_CHANGED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(BOOKMARKS_CHANGED_EVENT, handleUpdate);
    };
  }, []);

  if (!isOpen) return null;

  const handleRemove = (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    bookmarksService.removeBookmark(uuid);
    loadBookmarks();
  };

  const handleClearAll = () => {
    bookmarksService.clearAll();
    loadBookmarks();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col font-sans border-l border-stone-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-900 text-white flex items-center justify-center shadow-xs">
              <Bookmark className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-stone-900 text-base">
                Artículos Guardados
              </h2>
              <span className="text-[11px] text-stone-500">
                {bookmarks.length} {bookmarks.length === 1 ? 'artículo en tu lista' : 'artículos en tu lista'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {bookmarks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-300">
                <Bookmark className="w-7 h-7" />
              </div>
              <p className="font-serif font-bold text-stone-700 text-sm">
                No tienes noticias guardadas
              </p>
              <p className="text-xs text-stone-400 max-w-xs leading-relaxed">
                Haz clic en el icono "Guardar" de cualquier noticia para almacenarla y leerla más tarde, incluso sin conexión a internet.
              </p>
            </div>
          ) : (
            bookmarks.map((article) => (
              <div
                key={article.article_uuid}
                className="group relative p-3 rounded-2xl border border-stone-200/80 hover:border-rose-300 bg-stone-50/50 hover:bg-white transition-all shadow-2xs"
              >
                <div className="flex gap-3">
                  {article.thumbnail_url && (
                    <img
                      src={article.thumbnail_url}
                      alt={article.title}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 border border-stone-200"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block mb-1">
                      {article.category_name}
                    </span>
                    <Link
                      to={`/articulo/${article.slug}`}
                      onClick={onClose}
                      className="font-serif font-bold text-xs text-stone-900 hover:text-rose-900 line-clamp-2 leading-snug"
                    >
                      {article.title}
                    </Link>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200/60 text-[10px] text-stone-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDate(article.published_at)}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleRemove(article.article_uuid, e)}
                          className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                          title="Eliminar de guardados"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <Link
                          to={`/articulo/${article.slug}`}
                          onClick={onClose}
                          className="text-rose-800 font-semibold flex items-center gap-0.5 hover:underline"
                        >
                          <span>Leer</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {bookmarks.length > 0 && (
          <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleClearAll}
              className="text-stone-500 hover:text-red-700 font-semibold cursor-pointer transition-colors"
            >
              Vaciar lista
            </button>
            <span className="text-[11px] text-stone-400">
              Almacenado localmente en tu navegador
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
