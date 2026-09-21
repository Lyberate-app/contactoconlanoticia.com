import React, { useEffect, useState } from 'react';
import { EditorialLayout } from '../../layouts/EditorialLayout';
import { editorialService, ArticleSummary, Category } from '../../services/editorial';
import { Plus, Search, Edit3, Trash2, Calendar, User, Tag as TagIcon, Clock } from 'lucide-react';

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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
      setArticles(res.articles);
      setTotalPages(res.pagination.total_pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [selectedStatus, selectedCategory, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadArticles();
  };

  const handleDelete = async (uuid: string) => {
    const isTrash = selectedStatus === 'TRASH';
    const confirmMsg = isTrash
      ? '¿Eliminar este artículo definitivamente? Esta acción no se puede deshacer.'
      : '¿Enviar este artículo a la papelera?';

    if (!window.confirm(confirmMsg)) return;

    try {
      await editorialService.deleteArticle(uuid, isTrash);
      loadArticles();
    } catch (err) {
      alert('Error al procesar la eliminación.');
    }
  };

  const getStatusBadge = (status: ArticleSummary['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded">Publicado</span>;
      case 'DRAFT':
        return <span className="bg-stone-200 text-stone-700 text-[11px] font-semibold px-2 py-0.5 rounded">Borrador</span>;
      case 'PENDING_REVIEW':
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded">En Revisión</span>;
      case 'SCHEDULED':
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-semibold px-2 py-0.5 rounded">Programado</span>;
      case 'ARCHIVED':
        return <span className="bg-purple-100 text-purple-800 text-[11px] font-semibold px-2 py-0.5 rounded">Archivado</span>;
      case 'TRASH':
        return <span className="bg-red-100 text-red-800 text-[11px] font-semibold px-2 py-0.5 rounded">Papelera</span>;
    }
  };

  return (
    <EditorialLayout activeTab="articles">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-stone-200 gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Mesa de Redacción
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Gestión editorial de artículos y coberturas informativas de Contacto con la Noticia.
          </p>
        </div>
        <a
          href="/admin/articles/new"
          className="inline-flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium px-4 py-2.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Redactar Noticia</span>
        </a>
      </div>

      {/* Filters Bar */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1 bg-stone-200/80 p-1 rounded">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                selectedStatus === tab.value
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Category */}
        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-stone-300 bg-white px-2.5 py-1.5 text-stone-700 focus:outline-none focus:border-stone-800"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.category_uuid} value={c.category_uuid}>
                {c.name}
              </option>
            ))}
          </select>

          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Buscar título o texto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs border border-stone-300 bg-white pl-8 pr-3 py-1.5 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-800 w-48 sm:w-64"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
          </form>
        </div>
      </div>

      {/* Articles Table */}
      <div className="mt-6 bg-white border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500">Cargando mesa editorial...</div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center text-stone-500 text-xs">
            No se encontraron artículos con los filtros aplicados.
          </div>
        ) : (
          <div className="divide-y divide-stone-200">
            {articles.map((a) => (
              <article key={a.article_uuid} className="p-4 sm:p-5 hover:bg-stone-50/70 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {getStatusBadge(a.status)}
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                      <TagIcon className="w-3 h-3 text-stone-400" />
                      {a.category_name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-stone-500">
                      <User className="w-3 h-3 text-stone-400" />
                      {a.author_name}
                    </span>
                  </div>

                  <h2 className="text-base font-serif font-bold text-stone-900 leading-snug tracking-tight truncate">
                    <a href={`/admin/articles/edit/${a.article_uuid}`} className="hover:underline">
                      {a.title}
                    </a>
                  </h2>

                  {a.subtitle && (
                    <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{a.subtitle}</p>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-[11px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {a.published_at ? new Date(a.published_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No publicado'}
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

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <a
                    href={`/admin/articles/edit/${a.article_uuid}`}
                    className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
                    title="Editar noticia"
                  >
                    <Edit3 className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(a.article_uuid)}
                    className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                    title={selectedStatus === 'TRASH' ? 'Eliminar definitivamente' : 'Mover a papelera'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 bg-stone-50">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 border border-stone-300 rounded bg-white disabled:opacity-40"
            >
              &larr; Anterior
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 border border-stone-300 rounded bg-white disabled:opacity-40"
            >
              Siguiente &rarr;
            </button>
          </div>
        )}
      </div>
    </EditorialLayout>
  );
};

