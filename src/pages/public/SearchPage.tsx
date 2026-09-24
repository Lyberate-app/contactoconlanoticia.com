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
  Sparkles,
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
    <div className="py-2 space-y-6 max-w-4xl mx-auto">
      <SeoHead
        title={qParam ? `Búsqueda: ${qParam}` : 'Búsqueda en el Archivo Digital'}
        description="Consulte informaciones, reportajes y crónicas del archivo digital de Contacto con la Noticia."
        noIndex={true}
      />

      {/* 1. iOS 27 SPOTLIGHT SEARCH HERO */}
      <header className="glass-card p-6 sm:p-8 rounded-[28px] shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
            <Search className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
            Hemeroteca & Archivo
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif font-black uppercase text-stone-950 tracking-tight">
          Búsqueda Inteligente
        </h1>

        {/* Large Floating Search Bar */}
        <form onSubmit={handleSearchSubmit} className="space-y-3 pt-1">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Escriba términos de búsqueda (ej: Guárico, agricultura, salud)..."
                className="w-full glass-pill py-3 pl-4 pr-10 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 shadow-inner"
              />
              {inputVal && (
                <button
                  type="button"
                  onClick={() => setInputVal('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
                  title="Borrar texto"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-rose-900 hover:bg-rose-950 text-white px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span>Buscar</span>
              </button>

              <button
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`inline-flex items-center gap-1.5 px-4 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 ${
                  filtersOpen || activeFiltersCount > 0
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'glass-pill text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Advanced Filters Tray */}
          {filtersOpen && (
            <div className="glass-panel rounded-2xl p-4 space-y-4 animate-in fade-in duration-200">
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
                    className="w-full glass-pill px-3 py-1.5 text-xs text-stone-800 focus:outline-none"
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
                    className="w-full glass-pill px-3 py-1.5 text-xs text-stone-800 focus:outline-none"
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
                    className="w-full glass-pill px-3 py-1.5 text-xs text-stone-800 focus:outline-none"
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
                    className="w-full glass-pill px-3 py-1.5 text-xs text-stone-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Sorting and action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200/60">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    <ArrowUpDown className="w-3 h-3 inline-block mr-1 text-stone-400" />
                    Ordenar:
                  </span>
                  <select
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value as 'relevance' | 'latest' | 'oldest')}
                    className="glass-pill px-3 py-1 text-xs text-stone-800 focus:outline-none"
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
                    className="bg-stone-900 text-white px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-stone-800"
                  >
                    Aplicar Filtros
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Active Filter Pills */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1">
              Filtros activos:
            </span>
            {categoryParam && (
              <span className="inline-flex items-center gap-1 glass-pill px-2.5 py-0.5 rounded-full text-xs font-medium text-stone-800">
                Sección: {filterOptions?.categories.find((c) => c.slug === categoryParam)?.name || categoryParam}
                <button type="button" onClick={() => handleRemoveFilter('category')} className="hover:text-rose-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {authorParam && (
              <span className="inline-flex items-center gap-1 glass-pill px-2.5 py-0.5 rounded-full text-xs font-medium text-stone-800">
                Autor: {filterOptions?.authors.find((a) => a.slug === authorParam)?.name || authorParam}
                <button type="button" onClick={() => handleRemoveFilter('author')} className="hover:text-rose-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {tagParam && (
              <span className="inline-flex items-center gap-1 glass-pill px-2.5 py-0.5 rounded-full text-xs font-medium text-stone-800">
                Etiqueta: {tagParam}
                <button type="button" onClick={() => handleRemoveFilter('tag')} className="hover:text-rose-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {dateFromParam && (
              <span className="inline-flex items-center gap-1 glass-pill px-2.5 py-0.5 rounded-full text-xs font-medium text-stone-800">
                Desde: {dateFromParam}
                <button type="button" onClick={() => handleRemoveFilter('date_from')} className="hover:text-rose-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {dateToParam && (
              <span className="inline-flex items-center gap-1 glass-pill px-2.5 py-0.5 rounded-full text-xs font-medium text-stone-800">
                Hasta: {dateToParam}
                <button type="button" onClick={() => handleRemoveFilter('date_to')} className="hover:text-rose-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-[11px] text-rose-700 hover:underline font-semibold ml-1"
            >
              Limpiar todos
            </button>
          </div>
        )}
      </header>

      {/* 2. RESULTS BODY */}
      {loading ? (
        <div className="py-8 space-y-4 animate-pulse">
          <div className="h-6 w-48 glass-pill rounded-full"></div>
          <div className="h-32 glass-card rounded-2xl"></div>
          <div className="h-32 glass-card rounded-2xl"></div>
        </div>
      ) : searched ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-600 px-1">
            <span>
              Se encontraron <strong className="text-stone-900">{pagination?.total || 0}</strong> noticias
              {qParam ? (
                <>
                  {' '}para <span className="font-serif italic font-semibold text-rose-900">"{qParam}"</span>
                </>
              ) : null}
            </span>
            {pagination && pagination.total > 0 && (
              <span className="glass-pill px-2.5 py-0.5 text-[11px]">
                Página {pagination.page} de {pagination.total_pages}
              </span>
            )}
          </div>

          {articles.length === 0 ? (
            <div className="glass-card p-10 text-center my-6 rounded-[28px] max-w-md mx-auto space-y-3 shadow-sm">
              <Newspaper className="w-10 h-10 text-stone-400 mx-auto" />
              <h2 className="text-base font-serif font-bold text-stone-800">
                No se encontraron noticias
              </h2>
              <p className="text-xs text-stone-500 leading-relaxed">
                Intente utilizar palabras clave más breves o retire algunos filtros de búsqueda.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="bg-stone-900 text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-stone-800"
                >
                  Restablecer búsqueda
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
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
            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handlePageChange(pageParam - 1)}
                disabled={pageParam <= 1}
                className="glass-pill px-4 py-2 text-xs font-semibold text-stone-800 hover:text-rose-700 disabled:opacity-30 disabled:pointer-events-none inline-flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <span className="glass-pill px-3.5 py-1 text-xs text-stone-600">
                Página <span className="font-bold text-stone-900">{pageParam}</span> de{' '}
                <span className="font-bold text-stone-900">{pagination.total_pages}</span>
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(pageParam + 1)}
                disabled={pageParam >= pagination.total_pages}
                className="glass-pill px-4 py-2 text-xs font-semibold text-stone-800 hover:text-rose-700 disabled:opacity-30 disabled:pointer-events-none inline-flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty Landing State */
        <div className="glass-card p-10 text-center rounded-[28px] space-y-4 max-w-lg mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-base font-serif font-bold text-stone-800">
            Explore el Archivo Periodístico
          </h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            Consulte informaciones por términos específicos como "cosecha", "economía", "hospital", "turismo", o utilice los filtros para buscar por periodista o fecha.
          </p>
        </div>
      )}
    </div>
  );
};
