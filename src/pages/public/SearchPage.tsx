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
  BookOpen,
  Archive,
  ExternalLink,
  Layers,
} from 'lucide-react';
import {
  publicApi,
  PublicArticleSummary,
  PaginationMeta,
  SearchFilterOptions,
} from '../../services/publicApi';
import { wordpressConnector } from '../../services/wordpressConnector';
import type {
  WordPressHistoricArticle,
  WordPressConnectorStatus,
  WordPressHistoricResponse,
} from '../../types/wordpress';
import { SeoHead } from '../../components/common/SeoHead';
import { ArticleCard } from '../../components/articles';
import { formatDate } from '../../utils/date';

type SearchSourceTab = 'all' | 'current' | 'archive';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params
  const qParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const authorParam = searchParams.get('author') || '';
  const tagParam = searchParams.get('tag') || '';
  const dateFromParam = searchParams.get('date_from') || '';
  const dateToParam = searchParams.get('date_to') || '';
  const sourceParam = (searchParams.get('source') as SearchSourceTab) || 'all';
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
  const [activeSource, setActiveSource] = useState<SearchSourceTab>(sourceParam);

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<SearchFilterOptions | null>(null);
  const [articles, setArticles] = useState<PublicArticleSummary[]>([]);
  const [historicArticles, setHistoricArticles] = useState<WordPressHistoricArticle[]>([]);
  const [wpStatus, setWpStatus] = useState<WordPressConnectorStatus | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // 1. Fetch available filter options and WP connector status on mount
  useEffect(() => {
    publicApi.getSearchFilters()
      .then(opts => setFilterOptions(opts))
      .catch(() => setFilterOptions(null));

    wordpressConnector.checkHealth()
      .then((st: WordPressConnectorStatus) => setWpStatus(st))
      .catch(() => {});
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
    setActiveSource(sourceParam);

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
      setHistoricArticles([]);
      setPagination(null);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    const promises: Promise<unknown>[] = [];

    // Query native portal articles if tab is 'all' or 'current'
    if (sourceParam === 'all' || sourceParam === 'current') {
      promises.push(
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
        }).then(res => {
          setArticles(res.articles);
          setPagination(res.pagination);
        }).catch(() => {
          setArticles([]);
          setPagination(null);
        })
      );
    } else {
      setArticles([]);
      setPagination(null);
    }

    // Query historical WordPress archive if tab is 'all' or 'archive'
    if (sourceParam === 'all' || sourceParam === 'archive') {
      promises.push(
        wordpressConnector.queryArchive({
          search: qParam.trim() || undefined,
          category: categoryParam || undefined,
          page: pageParam,
          per_page: 6,
        }).then((res: WordPressHistoricResponse) => {
          setHistoricArticles(res.articles);
          setWpStatus(res.status);
        }).catch(() => {
          setHistoricArticles([]);
        })
      );
    } else {
      setHistoricArticles([]);
    }

    Promise.allSettled(promises).finally(() => setLoading(false));
  }, [
    qParam,
    categoryParam,
    authorParam,
    tagParam,
    dateFromParam,
    dateToParam,
    sortParam,
    sourceParam,
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
      source: activeSource,
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

  const handleTabChange = (source: SearchSourceTab) => {
    setActiveSource(source);
    const sp = new URLSearchParams(searchParams);
    if (source === 'all') sp.delete('source');
    else sp.set('source', source);
    sp.set('page', '1');
    setSearchParams(sp);
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
    setActiveSource('all');
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
        title={qParam ? `Búsqueda: ${qParam} — Contacto con la Noticia` : 'Búsqueda en el Archivo Editorial — Contacto con la Noticia'}
        description="Consulte informaciones, reportajes y crónicas del archivo digital e histórico de Contacto con la Noticia."
        noIndex={true}
      />

      {/* SOBER EDITORIAL SEARCH HEADER */}
      <header className="bg-white border border-stone-200 p-6 sm:p-8 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-900 text-white flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-rose-900">
              Hemeroteca & Archivo Editorial
            </span>
          </div>

          {wpStatus && (
            <div className="text-[11px] text-stone-500 font-mono flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-md">
              <span
                className={`w-2 h-2 rounded-full ${
                  wpStatus === 'ONLINE' || wpStatus === 'READY_FOR_BACKEND'
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
              />
              <span>Conector Archivo Histórico: {wpStatus}</span>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-950 tracking-tight">
            Búsqueda en el Diario
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Consulte noticias actuales y registros periodísticos históricos de Guárico y Venezuela.
          </p>
        </div>

        {/* Source Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-stone-200 pt-2 text-xs">
          <button
            type="button"
            onClick={() => handleTabChange('all')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeSource === 'all'
                ? 'border-rose-900 text-rose-950'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todo el Archivo</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('current')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeSource === 'current'
                ? 'border-rose-900 text-rose-950'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Edición Digital Actual</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('archive')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeSource === 'archive'
                ? 'border-rose-900 text-rose-950'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archivo Histórico (WordPress)</span>
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Escriba términos de búsqueda (ej: Calabozo, agricultura, salud, vialidad)..."
                className="w-full bg-stone-50 border border-stone-300 rounded-lg py-2.5 pl-3.5 pr-9 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-rose-900 focus:bg-white transition"
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

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-rose-900 hover:bg-rose-950 text-white px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Buscar</span>
              </button>

              <button
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer border ${
                  filtersOpen || activeFiltersCount > 0
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
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
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-4 animate-in fade-in duration-150">
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
                    className="w-full bg-white border border-stone-300 rounded-md px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-600"
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
                    className="w-full bg-white border border-stone-300 rounded-md px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-600"
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
                    className="w-full bg-white border border-stone-300 rounded-md px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-600"
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
                    className="w-full bg-white border border-stone-300 rounded-md px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-600"
                  />
                </div>
              </div>

              {/* Sorting and action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    <ArrowUpDown className="w-3 h-3 inline-block mr-1 text-stone-400" />
                    Ordenar:
                  </span>
                  <select
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value as 'relevance' | 'latest' | 'oldest')}
                    className="bg-white border border-stone-300 rounded-md px-2.5 py-1 text-xs text-stone-800 focus:outline-none"
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
                    className="bg-stone-900 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-stone-800 transition"
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
              <span className="inline-flex items-center gap-1 bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-full text-xs font-medium text-stone-800">
                Sección: {filterOptions?.categories.find((c) => c.slug === categoryParam)?.name || categoryParam}
                <button type="button" onClick={() => handleRemoveFilter('category')} className="hover:text-rose-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {authorParam && (
              <span className="inline-flex items-center gap-1 bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-full text-xs font-medium text-stone-800">
                Autor: {filterOptions?.authors.find((a) => a.slug === authorParam)?.name || authorParam}
                <button type="button" onClick={() => handleRemoveFilter('author')} className="hover:text-rose-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {tagParam && (
              <span className="inline-flex items-center gap-1 bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-full text-xs font-medium text-stone-800">
                Etiqueta: {tagParam}
                <button type="button" onClick={() => handleRemoveFilter('tag')} className="hover:text-rose-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {dateFromParam && (
              <span className="inline-flex items-center gap-1 bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-full text-xs font-medium text-stone-800">
                Desde: {dateFromParam}
                <button type="button" onClick={() => handleRemoveFilter('date_from')} className="hover:text-rose-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {dateToParam && (
              <span className="inline-flex items-center gap-1 bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-full text-xs font-medium text-stone-800">
                Hasta: {dateToParam}
                <button type="button" onClick={() => handleRemoveFilter('date_to')} className="hover:text-rose-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-xs text-rose-800 hover:underline ml-2 font-semibold"
            >
              Limpiar todo
            </button>
          </div>
        )}
      </header>

      {/* SEARCH RESULTS SECTION */}
      {searched && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-700">
              Resultados de la Búsqueda
            </h2>
            <span className="text-xs text-stone-500 font-mono">
              {articles.length + historicArticles.length} resultados encontrados
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-6 h-6 border-2 border-rose-800 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-stone-500 font-serif italic">
                Buscando en la hemeroteca y archivo digital...
              </p>
            </div>
          ) : articles.length === 0 && historicArticles.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-3">
              <Newspaper className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="font-serif font-bold text-stone-800 text-lg">
                No se encontraron artículos
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                No hay coincidencias para los términos ingresados. Pruebe con palabras clave más generales o cambie los filtros de sección y fecha.
              </p>
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="mt-2 text-xs font-bold text-rose-800 hover:underline"
              >
                Restablecer búsqueda
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Native Portal Articles */}
              {articles.length > 0 && (
                <div className="space-y-4">
                  {(activeSource === 'all' && historicArticles.length > 0) && (
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider">
                      <BookOpen className="w-4 h-4 text-rose-800" />
                      <span>Edición Digital</span>
                    </div>
                  )}
                  <div className="space-y-4">
                    {articles.map((art) => (
                      <ArticleCard key={art.article_uuid} article={art} variant="compact" />
                    ))}
                  </div>

                  {/* Native Pagination */}
                  {pagination && pagination.total_pages > 1 && (
                    <div className="flex items-center justify-between border-t border-stone-200 pt-4">
                      <span className="text-xs text-stone-500">
                        Página {pagination.page} de {pagination.total_pages}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={pagination.page <= 1}
                          onClick={() => handlePageChange(pagination.page - 1)}
                          className="px-3 py-1.5 border border-stone-300 rounded-md text-xs font-semibold text-stone-700 disabled:opacity-40 hover:bg-stone-50"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 inline mr-1" />
                          Anterior
                        </button>
                        <button
                          type="button"
                          disabled={pagination.page >= pagination.total_pages}
                          onClick={() => handlePageChange(pagination.page + 1)}
                          className="px-3 py-1.5 border border-stone-300 rounded-md text-xs font-semibold text-stone-700 disabled:opacity-40 hover:bg-stone-50"
                        >
                          Siguiente
                          <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Historical WordPress Archive Articles */}
              {historicArticles.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-stone-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider">
                      <Archive className="w-4 h-4 text-amber-700" />
                      <span>Archivo Histórico Integrado (Colección 2018–2024)</span>
                    </div>
                    <span className="text-[11px] text-stone-500">
                      Fuente histórica externa
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {historicArticles.map((h) => (
                      <article
                        key={h.id}
                        className="bg-white border border-stone-200 rounded-xl p-4 space-y-2 hover:border-stone-400 transition"
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px]">
                          <span className="font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-200">
                            Archivo Histórico
                          </span>
                          <span className="text-stone-500 font-mono">
                            {formatDate(h.date)}
                          </span>
                        </div>

                        <h3 className="font-serif font-bold text-sm text-stone-900 leading-snug">
                          {h.title}
                        </h3>

                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {h.excerpt}
                        </p>

                        <div className="pt-2 flex items-center justify-between border-t border-stone-100 text-[11px]">
                          <span className="text-stone-500">{h.author_name}</span>
                          <a
                            href={h.original_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-rose-800 hover:text-rose-950 font-semibold"
                          >
                            <span>Consultar documento</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
