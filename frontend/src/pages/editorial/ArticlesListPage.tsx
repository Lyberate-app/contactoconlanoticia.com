import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { editorialService, ArticleSummary, Category } from '../../services/editorial';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Calendar,
  User,
  Tag as TagIcon,
  Clock,
  ExternalLink,
  RotateCcw,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

const STATUS_TABS = [
  { label: 'Todos', value: '' },
  { label: 'Publicados', value: 'PUBLISHED' },
  { label: 'Borradores', value: 'DRAFT' },
  { label: 'En Revisión', value: 'PENDING_REVIEW' },
  { label: 'Programados', value: 'SCHEDULED' },
  { label: 'Archivados', value: 'ARCHIVED' },
  { label: 'Papelera', value: 'TRASH' },
];

export const ArticlesListPage: React.FC = () => {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'title'>('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    editorialService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: '15',
      };
      if (selectedStatus) params.status = selectedStatus;
      if (selectedCategory) params.category_uuid = selectedCategory;
      if (searchTerm) params.search = searchTerm;
      if (selectedStatus === 'TRASH') params.include_trash = 'true';

      const res = await editorialService.getArticles(params);
      let list = [...res.articles];

      // Client-side sort if needed
      if (sortBy === 'oldest') {
        list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      } else if (sortBy === 'title') {
        list.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        // latest
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      setArticles(list);
      setTotalPages(res.pagination.total_pages || 1);
      setTotalCount(res.pagination.total || list.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [selectedStatus, selectedCategory, page, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadArticles();
  };

  const handleDelete = async (uuid: string) => {
    const isTrash = selectedStatus === 'TRASH';
    const confirmMsg = isTrash
      ? '¿Eliminar este artículo definitivamente? Esta acción no se puede deshacer.'
      : '¿Enviar este artículo a la papelera? Podrá restaurarlo después.';

    if (!window.confirm(confirmMsg)) return;

    try {
      await editorialService.deleteArticle(uuid, isTrash);
      loadArticles();
    } catch {
      alert('Error al procesar la eliminación.');
    }
  };

  const handleRestore = async (uuid: string) => {
    try {
      await editorialService.restoreArticle(uuid);
      loadArticles();
    } catch {
      alert('Error al restaurar el artículo.');
    }
  };

  const getStatusBadge = (status: ArticleSummary['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Publicado
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 bg-stone-500/10 text-stone-700 dark:text-stone-300 border border-stone-500/20 text-[11px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-md">
            Borrador
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[11px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-md">
            En Revisión
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-[11px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-md">
            Programado
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-[11px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-md">
            Archivado
          </span>
        );
      case 'TRASH':
        return (
          <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 text-[11px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-md">
            Papelera
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Glass Card */}
      <div className="glass-card rounded-[28px] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-white/60 dark:border-white/10 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 mb-2">
            <Sparkles className="w-3 h-3 text-rose-600" />
            <span>Redacción Editorial &bull; {totalCount} Coberturas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-white tracking-tight">
            Mesa de Redacción
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Gestión editorial integral de noticias, reportajes de investigación y coberturas en tiempo real.
          </p>
        </div>
        <Link
          to="/admin/articles/new"
          className="inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-5 py-3 rounded-full shadow-lg shadow-black/10 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Redactar Noticia</span>
        </Link>
      </div>

      {/* Filters & Segmented Control */}
      <div className="space-y-3">
        {/* iOS Segmented Status Tabs */}
        <div className="glass-panel p-1.5 rounded-full flex gap-1 overflow-x-auto no-scrollbar border border-white/60 dark:border-white/10">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(1);
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-full whitespace-nowrap transition-all active:scale-95 ${
                selectedStatus === tab.value
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm ring-1 ring-black/5 font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search, Category & Sorting */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px] max-w-md">
              <input
                type="text"
                placeholder="Buscar por titular, autor o contenido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs border border-white/60 dark:border-white/10 bg-white/70 dark:bg-stone-800/70 backdrop-blur-md rounded-full pl-9 pr-4 py-2.5 text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 shadow-xs"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </form>

            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-white/60 dark:border-white/10 bg-white/70 dark:bg-stone-800/70 backdrop-blur-md px-3.5 py-2.5 rounded-full text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-800 shadow-xs cursor-pointer"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.category_uuid} value={c.category_uuid}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'oldest' | 'title')}
              className="text-xs border border-white/60 dark:border-white/10 bg-white/70 dark:bg-stone-800/70 backdrop-blur-md px-3.5 py-2.5 rounded-full text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-800 shadow-xs cursor-pointer"
            >
              <option value="latest">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="title">Título (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Articles Grouped Card Container */}
      <div className="glass-card rounded-[28px] overflow-hidden border border-white/60 dark:border-white/10 shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-xs text-stone-500 font-mono animate-pulse">
            Sincronizando mesa de redacción en tiempo real...
          </div>
        ) : articles.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto text-stone-400">
              <Search className="w-6 h-6" />
            </div>
            <p className="font-serif text-base font-bold text-stone-800 dark:text-stone-200">
              No se encontraron artículos
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Pruebe a ajustar los filtros o el término de búsqueda ingresado.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
            {articles.map((a) => (
              <article
                key={a.article_uuid}
                className="p-4 sm:p-5 hover:bg-white/40 dark:hover:bg-white/5 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                {/* Left Area: Squircle Thumbnail + Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Thumbnail with Squircle corners */}
                  <div className="w-18 h-14 sm:w-22 sm:h-16 rounded-[16px] bg-stone-100 dark:bg-stone-800 border border-black/5 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
                    {a.featured_media?.url ? (
                      <img
                        src={a.featured_media.url}
                        alt={a.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-stone-300 dark:text-stone-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {getStatusBadge(a.status)}
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 dark:text-stone-300 bg-stone-100/70 dark:bg-stone-800/70 px-2.5 py-0.5 rounded-full">
                        <TagIcon className="w-3 h-3 text-stone-400" />
                        {a.category_name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
                        <User className="w-3 h-3 text-stone-400" />
                        {a.author_name}
                      </span>
                    </div>

                    <h2 className="text-base font-serif font-bold text-stone-900 dark:text-white leading-snug tracking-tight truncate">
                      <Link to={`/admin/articles/edit/${a.article_uuid}`} className="hover:text-rose-700 dark:hover:text-rose-400 transition-colors">
                        {a.title}
                      </Link>
                    </h2>

                    {a.subtitle && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">{a.subtitle}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3.5 mt-2 text-[11px] text-stone-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {a.published_at
                          ? new Date(a.published_at).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'No publicado'}
                      </span>
                      {a.modified_at && (
                        <span className="flex items-center gap-1 text-stone-400">
                          <Clock className="w-3 h-3" />
                          Modificado: {new Date(a.modified_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                      <span className="font-mono text-stone-400 text-[10px] truncate max-w-xs">
                        /{a.slug}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Area: iOS Squircle Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  {/* View Live Article Link */}
                  {a.status === 'PUBLISHED' && (
                    <a
                      href={`/noticia/${a.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-stone-100/70 dark:bg-stone-800/70 hover:bg-white dark:hover:bg-stone-700 text-stone-500 hover:text-stone-900 dark:hover:text-white shadow-xs active:scale-90 transition-all"
                      title="Ver en portal público"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {/* Restore Button (when in TRASH) */}
                  {selectedStatus === 'TRASH' ? (
                    <button
                      onClick={() => handleRestore(a.article_uuid)}
                      className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold"
                      title="Restaurar artículo a borrador"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar</span>
                    </button>
                  ) : (
                    <Link
                      to={`/admin/articles/edit/${a.article_uuid}`}
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-stone-100/70 dark:bg-stone-800/70 hover:bg-white dark:hover:bg-stone-700 text-stone-700 hover:text-stone-900 dark:hover:text-white shadow-xs active:scale-90 transition-all"
                      title="Editar noticia"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(a.article_uuid)}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-red-500/10 text-red-600 hover:bg-red-500/20 active:scale-90 transition-all"
                    title={selectedStatus === 'TRASH' ? 'Eliminar definitivamente' : 'Mover a papelera'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination Glass Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-black/[0.04] dark:divide-white/[0.06] flex items-center justify-between text-xs text-stone-600 dark:text-stone-300 bg-white/30 dark:bg-stone-900/30">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 rounded-full border border-stone-200/80 bg-white/70 dark:bg-stone-800/70 disabled:opacity-40 hover:bg-white active:scale-95 transition-all font-semibold shadow-xs"
            >
              &larr; Anterior
            </button>
            <span className="font-medium">
              Página {page} de {totalPages} ({totalCount} artículos)
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 rounded-full border border-stone-200/80 bg-white/70 dark:bg-stone-800/70 disabled:opacity-40 hover:bg-white active:scale-95 transition-all font-semibold shadow-xs"
            >
              Siguiente &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
