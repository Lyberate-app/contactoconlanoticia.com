'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition, Suspense } from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { searchPosts } from '@/lib/api'
import { ArticleCard } from '@/components/article/ArticleCard'
import { Pagination } from '@/components/ui/Pagination'

// ── Necesitamos Suspense porque useSearchParams requiere CSR ──

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchPageContent />
    </Suspense>
  )
}

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const query = searchParams.get('q') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1', 10)

  const [inputValue, setInputValue] = useState(query)
  const [isPending, startTransition] = useTransition()

  // Búsqueda via TanStack Query (client-side)
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', query, page],
    queryFn: () => searchPosts(query, { page, per_page: 12 }),
    enabled: query.length >= 2,
    placeholderData: (prev) => prev,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim().length < 2) return
    startTransition(() => {
      router.push(`/buscar?q=${encodeURIComponent(inputValue.trim())}`)
    })
  }

  const handleClear = () => {
    setInputValue('')
    router.push('/buscar')
  }

  const handlePageChange = (newPage: number) => {
    router.push(`/buscar?q=${encodeURIComponent(query)}&page=${newPage}`)
  }

  const isSearching = isLoading || isFetching || isPending

  return (
    <div className="container-editorial py-8">

      {/* ── Cabecera y caja de búsqueda ──────────────── */}
      <header className="mb-8">
        <h1 className="font-serif font-black text-3xl text-gray-900 mb-6">
          {query ? `Resultados para: "${query}"` : 'Buscar noticias'}
        </h1>

        <form onSubmit={handleSearch} role="search" aria-label="Buscar en el sitio">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Busca noticias, temas o categorías..."
              aria-label="Término de búsqueda"
              minLength={2}
              className="w-full pl-12 pr-12 py-4 rounded-xl border border-gray-200 
                         focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 
                         outline-none text-base shadow-sm transition-all"
              autoFocus={!query}
            />
            {/* Clear */}
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {/* Botón buscar */}
            <button
              type="submit"
              disabled={inputValue.trim().length < 2}
              className="absolute right-2 top-1/2 -translate-y-1/2 
                         btn-primary py-2 px-3 text-sm disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
          {inputValue.length === 1 && (
            <p className="text-sm text-gray-400 mt-2 ml-1">Escribe al menos 2 caracteres</p>
          )}
        </form>
      </header>

      {/* ── Resultados ────────────────────────────────── */}
      {!query && (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Escribe algo para buscar noticias</p>
        </div>
      )}

      {query && isLoading && <SearchSkeleton />}

      {query && !isLoading && data && (
        <>
          <div className={`mb-6 transition-opacity duration-200 ${isFetching ? 'opacity-60' : ''}`}>
            <p className="text-sm text-gray-500">
              {data.pagination.total === 0
                ? 'No se encontraron resultados'
                : `${data.pagination.total} resultado${data.pagination.total !== 1 ? 's' : ''} encontrado${data.pagination.total !== 1 ? 's' : ''}`}
            </p>
          </div>

          {data.items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                No encontramos resultados para "{query}"
              </h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Intenta con otras palabras o revisa si escribiste bien.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.items.map((post, i) => (
                  <ArticleCard key={post.uuid} post={post} priority={i < 3} />
                ))}
              </div>

              {data.pagination.last_page > 1 && (
                <div className="mt-10">
                  <Pagination
                    currentPage={data.pagination.current_page}
                    totalPages={data.pagination.last_page}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}

    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gray-200 aspect-video" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

