import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Newspaper,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Calendar,
  User,
  Folder,
  ArrowUpDown,
} from 'lucide-react';
import {
  publicApi,
  PublicArticleSummary,
  PaginationMeta,
  SearchFilterOptions,
} from '../../services/publicApi';
import { SeoHead } from '../../components/common/SeoHead';
import { ArticleCard } from '../../components/articles';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params
  const qParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const authorParam = searchParams.get('author') || '';
  const tagParam = searchParams.get('tag') || '';
  const dateFromParam = searchParams.get('date_from') || '';
  const dateToParam = searchParams.get('date_to') || '';
  const sortParam = (searchParams.get('sort') as 'relevance' | 'latest' | 'oldest') || (qParam ? 'relevance' : 'latest');
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Local state for search form inputs
  const [inputVal, setInputVal] = useState(qParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedAuthor, setSelectedAuthor] = useState(authorParam);
  const [selectedTag, setSelectedTag] = useState(tagParam);
  const [selectedDateFrom, setSelectedDateFrom] = useState(dateFromParam);
  const [selectedDateTo, setSelectedDateTo] = useState(dateToParam);
  const [selectedSort, setSelectedSort] = useState<'relevance' | 'latest' | 'oldest'>(sortParam);

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<SearchFilterOptions | null>(null);
  const [articles, setArticles] = useState<PublicArticleSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // 1. Fetch available filter options on mount
  useEffect(() => {
    publicApi.getSearchFilters()
      .then(opts => setFilterOptions(opts))
      .catch(() => setFilterOptions(null));
  }, []);

  // 2. Sync state when URL params change
  useEffect(() => {
    setInputVal(qParam);
    setSelectedCategory(categoryParam);
    setSelectedAuthor(authorParam);
    setSelectedTag(tagParam);
    setSelectedDateFrom(dateFromParam);
    setSelectedDateTo(dateToParam);
    setSelectedSort(sortParam);

    const hasAnyFilter = Boolean(
      qParam.trim() ||
      categoryParam ||
      authorParam ||
      tagParam ||
      dateFromParam ||
      dateToParam
    );

    if (!hasAnyFilter) {
      setArticles([]);
      setPagination(null);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    publicApi.searchArticles({
      q: qParam.trim() || undefined,
      category: categoryParam || undefined,
      author: authorParam || undefined,
      tag: tagParam || undefined,
      date_from: dateFromParam || undefined,
      date_to: dateToParam || undefined,
      sort: sortParam,
      page: pageParam,
      limit: 10,
    })
      .then(res => {
        setArticles(res.articles);
        setPagination(res.pagination);
      })
      .catch(() => {
        setArticles([]);
        setPagination(null);
      })
      .finally(() => setLoading(false));
  }, [
    qParam,
    categoryParam,
    authorParam,
    tagParam,
    dateFromParam,
    dateToParam,
    sortParam,
    pageParam,
  ]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyParams({
      q: inputVal.trim(),
      category: selectedCategory,
      author: selectedAuthor,
      tag: selectedTag,
      date_from: selectedDateFrom,
      date_to: selectedDateTo,
      sort: selectedSort,
      page: '1',
    });
  };

  const applyParams = (newParams: Record<string, string>) => {
    const sp = new URLSearchParams();
    Object.entries(newParams).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    setSearchParams(sp);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageChange = (newPage: number) => {
    const sp = new URLSearchParams(searchParams);
    sp.set('page', String(newPage));
    setSearchParams(sp);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAllFilters = () => {
    setInputVal('');
    setSelectedCategory('');
    setSelectedAuthor('');
    setSelectedTag('');
    setSelectedDateFrom('');
    setSelectedDateTo('');
    setSelectedSort('latest');
    setSearchParams(new URLSearchParams());
  };

  const handleRemoveFilter = (key: string) => {
    const sp = new URLSearchParams(searchParams);
    sp.delete(key);
    sp.set('page', '1');
    setSearchParams(sp);
  };

  const activeFiltersCount = [
    categoryParam,
    authorParam,
    tagParam,
    dateFromParam,
    dateToParam,
  ].filter(Boolean).length;

  return (
    <div className="py-4 space-y-8 max-w-4xl mx-auto">
      {/* SEO: Internal search pages must be noindex to prevent thin content indexing */}
      <SeoHead
        title={qParam ? `Búsqueda: ${qParam}` : 'Búsqueda en el Archivo Digital'}
        description="Consulte informaciones, reportajes y crónicas del archivo digital de Contacto con la Noticia."
        noIndex={true}
      />

      {/* 1. SEARCH HEADER & MAIN BAR */}
      <header className="border-b-2 border-stone-900 pb-6 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-red-700 block">
          Hemeroteca & Archivo
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-black uppercase text-stone-950 tracking-tight">
          Búsqueda de Noticias
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 font-serif italic max-w-2xl">
          Consulte informaciones, crónicas y reportajes publicados en Contacto con la Noticia mediante palabras clave, redactores, secciones o rango de fechas.
        </p>

        {/* Search input form */}
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Escriba términos de búsqueda (ej: Guárico, agricultura, salud, vialidad)..."
                className="w-full bg-white border border-stone-300 rounded px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-700 focus:border-stone-700"
              />
              {inputVal && (
                <button
                  type="button"
                  onClick={() => setInputVal('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
                  title="Borrar texto"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Buscar</span>
            </button>

            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`inline-flex items-center gap-1.5 border px-3.5 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${
                filtersOpen || activeFiltersCount > 0
                  ? 'border-stone-900 bg-stone-100 text-stone-950'
                  : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-700 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Collapsible advanced filters tray */}
          {filtersOpen && (
            <div className="bg-stone-50 border border-stone-200 rounded p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Category selector */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    <Folder className="w-3 h-3 inline-block mr-1 text-stone-400" />
                    Sección
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-700"
                  >
                    <option value="">Todas las secciones</option>
                    {filterOptions?.categories.map((c) => (
                      <option key={c.category_uuid} value={c.slug}>
                        {c.name} ({c.articles_count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Author selector */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    <User className="w-3 h-3 inline-block mr-1 text-stone-400" />
                    Periodista / Autor
                  </label>
                  <select
                    value={selectedAuthor}
                    onChange={(e) => setSelectedAuthor(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-700"
                  >
                    <option value="">Todos los autores</option>
                    {filterOptions?.authors.map((a) => (
                      <option key={a.author_uuid} value={a.slug}>
                        {a.name} ({a.articles_count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date range From */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    <Calendar className="w-3 h-3 inline-block mr-1 text-stone-400" />
                    Desde
                  </label>
                  <input
                    type="date"
                    value={selectedDateFrom}
                    onChange={(e) => setSelectedDateFrom(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-700"
                  />
                </div>

                {/* Date range To */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    <Calendar className="w-3 h-3 inline-block mr-1 text-stone-400" />
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={selectedDateTo}
                    onChange={(e) => setSelectedDateTo(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-700"
                  />
                </div>
              </div>

              {/* Sorting and action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    <ArrowUpDown className="w-3 h-3 inline-block mr-1 text-stone-400" />
                    Ordenar:
                  </span>
                  <select
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value as 'relevance' | 'latest' | 'oldest')}
                    className="bg-white border border-stone-300 rounded px-2.5 py-1 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-700"
                  >
                    <option value="latest">Más recientes</option>
                    <option value="relevance">Mayor relevancia</option>
                    <option value="oldest">Más antiguos</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="text-xs text-stone-500 hover:text-stone-900 underline px-2 py-1"
                  >
                    Restablecer
                  </button>
                  <button
                    type="submit"
                    className="bg-stone-900 text-white px-4 py-1.5 rounded text-xs font-semibold hover:bg-stone-800"
                  >
                    Aplicar Filtros
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Active filter tags/pills */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mr-1">
              Filtros activos:
            </span>
            {categoryParam && (
              <span className="inline-flex items-center gap-1 bg-stone-200 text-stone-800 px-2 py-0.5 rounded text-xs font-medium">
                Sección: {filterOptions?.categories.find((c) => c.slug === categoryParam)?.name || categoryParam}
                <button type="button" onClick={() => handleRemoveFilter('category')} className="hover:text-red-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {authorParam && (
              <span className="inline-flex items-center gap-1 bg-stone-200 text-stone-800 px-2 py-0.5 rounded text-xs font-medium">
                Autor: {filterOptions?.authors.find((a) => a.slug === authorParam)?.name || authorParam}
                <button type="button" onClick={() => handleRemoveFilter('author')} className="hover:text-red-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {tagParam && (
              <span className="inline-flex items-center gap-1 bg-stone-200 text-stone-800 px-2 py-0.5 rounded text-xs font-medium">
                Etiqueta: {tagParam}
                <button type="button" onClick={() => handleRemoveFilter('tag')} className="hover:text-red-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {dateFromParam && (
              <span className="inline-flex items-center gap-1 bg-stone-200 text-stone-800 px-2 py-0.5 rounded text-xs font-medium">
                Desde: {dateFromParam}
                <button type="button" onClick={() => handleRemoveFilter('date_from')} className="hover:text-red-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {dateToParam && (
              <span className="inline-flex items-center gap-1 bg-stone-200 text-stone-800 px-2 py-0.5 rounded text-xs font-medium">
                Hasta: {dateToParam}
                <button type="button" onClick={() => handleRemoveFilter('date_to')} className="hover:text-red-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-[11px] text-red-700 hover:underline font-semibold ml-2"
            >
              Limpiar todos
            </button>
          </div>
        )}
      </header>

      {/* 2. RESULTS BODY */}
      {loading ? (
        <div className="py-8 space-y-4 animate-pulse">
          <div className="h-4 w-48 bg-stone-200 rounded"></div>
          <div className="h-28 bg-stone-200 rounded"></div>
          <div className="h-28 bg-stone-200 rounded"></div>
          <div className="h-28 bg-stone-200 rounded"></div>
        </div>
      ) : searched ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-stone-600 border-b border-stone-200 pb-2">
            <span>
              Se encontraron{' '}
              <strong className="text-stone-900">{pagination?.total || 0}</strong> noticias
              {qParam ? (
                <>
                  {' '}para <span className="font-serif italic font-semibold text-stone-900">"{qParam}"</span>
                </>
              ) : null}
            </span>
            {pagination && pagination.total > 0 && (
              <span>
                Página {pagination.page} de {pagination.total_pages}
              </span>
            )}
          </div>

          {articles.length === 0 ? (
            <div className="bg-white border border-stone-200 p-10 text-center my-6 rounded space-y-3">
              <Newspaper className="w-10 h-10 text-stone-400 mx-auto" />
              <h2 className="text-lg font-serif font-bold text-stone-800">
                No se encontraron noticias con los criterios indicados
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
                Intente utilizar palabras clave más amplias, reduzca los filtros de fechas o seleccione otra sección editorial.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="inline-flex items-center gap-1.5 bg-stone-900 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-stone-800"
                >
                  Restablecer búsqueda
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-stone-200">
              {articles.map((art) => (
                <ArticleCard
                  key={art.article_uuid}
                  article={art}
                  variant="horizontal"
                  showExcerpt={true}
                  showAuthor={true}
                />
              ))}
            </div>
          )}

          {/* 3. PAGINATION */}
          {pagination && pagination.total_pages > 1 && (
            <div className="pt-6 border-t border-stone-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handlePageChange(pageParam - 1)}
                disabled={pageParam <= 1}
                className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-stone-950 disabled:opacity-30 disabled:pointer-events-none px-3.5 py-2 border border-stone-300 rounded bg-white shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Página Anterior</span>
              </button>

              <span className="text-xs text-stone-600">
                Página <span className="font-semibold text-stone-900">{pageParam}</span> de{' '}
                <span className="font-semibold text-stone-900">{pagination.total_pages}</span>
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(pageParam + 1)}
                disabled={pageParam >= pagination.total_pages}
                className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-stone-950 disabled:opacity-30 disabled:pointer-events-none px-3.5 py-2 border border-stone-300 rounded bg-white shadow-sm"
              >
                <span>Página Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty landing state */
        <div className="bg-stone-50 border border-stone-200 p-10 text-center rounded space-y-3">
          <Search className="w-10 h-10 text-stone-400 mx-auto" />
          <h2 className="text-base font-serif font-bold text-stone-800">
            Explore el Archivo Periodístico
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
            Consulte informaciones por términos específicos como "cosecha", "economía", "hospital", "turismo", o utilice los filtros para buscar por periodista o fecha.
          </p>
        </div>
      )}
    </div>
  );
};
