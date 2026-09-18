import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPosts } from '@/lib/api'
import { ArticleCard } from '@/components/article/ArticleCard'
import { Pagination } from '@/components/ui/Pagination'

export const revalidate = 60

interface TagPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params
  const decoded = decodeURIComponent(slug).replace(/-/g, ' ')
  return {
    title: `Noticias sobre #${decoded}`,
    description: `Artículos y cobertura informativa relacionada con la etiqueta ${decoded}`,
  }
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))

  const tagDisplay = decodeURIComponent(slug)

  const { items: posts, pagination } = await getPosts({
    tag_slug: slug,
    page,
    per_page: 12,
    order_by: 'published_at',
    order: 'desc',
  }).catch(() => ({ items: [], pagination: null as never }))

  return (
    <div className="container-editorial py-8">
      {/* ── Cabecera de Etiqueta ───────────────────────── */}
      <header className="mb-8">
        <nav className="text-sm text-gray-500 mb-4" aria-label="Ruta de navegación">
          <Link href="/" className="hover:text-gray-700 transition-colors">Inicio</Link>
          <span className="mx-1.5">›</span>
          <span className="text-gray-500">Etiqueta</span>
          <span className="mx-1.5">›</span>
          <span className="text-gray-900 font-medium">#{tagDisplay}</span>
        </nav>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-lg">
            #
          </div>
          <div>
            <h1 className="font-serif font-black text-3xl text-gray-900 capitalize">
              {tagDisplay.replace(/-/g, ' ')}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {pagination?.total ?? posts.length} artículo{(pagination?.total ?? posts.length) !== 1 ? 's' : ''} etiquetado{(pagination?.total ?? posts.length) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </header>

      {/* ── Listado de Noticias ────────────────────────── */}
      {posts.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-gray-500 font-medium">No se encontraron noticias con esta etiqueta.</p>
          <Link href="/" className="btn-primary inline-flex mt-4 text-xs">
            ← Volver a la portada
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post, i) => (
              <ArticleCard key={post.uuid} post={post} priority={i < 3} />
            ))}
          </div>

          {pagination && pagination.last_page > 1 && (
            <div className="mt-10">
              <Pagination
                currentPage={pagination.current_page}
                totalPages={pagination.last_page}
                basePath={`/etiqueta/${slug}`}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

