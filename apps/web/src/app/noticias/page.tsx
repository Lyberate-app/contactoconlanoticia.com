import type { Metadata } from 'next'
import { getPosts, getCategories } from '@/lib/api'
import { ArticleCard } from '@/components/article/ArticleCard'
import { Pagination } from '@/components/ui/Pagination'

export const revalidate = 30

interface NewsPageProps {
  searchParams: Promise<{ page?: string }>
}

export const metadata: Metadata = {
  title: 'Todas las noticias',
  description: 'Archivo completo de noticias',
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))

  const [postsResult, categoriesResult] = await Promise.allSettled([
    getPosts({ page, per_page: 15, order_by: 'published_at', order: 'desc' }),
    getCategories(),
  ])

  const { items: posts, pagination } =
    postsResult.status === 'fulfilled'
      ? postsResult.value
      : { items: [], pagination: null as never }

  const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : []

  return (
    <div className="container-editorial py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* ── Lista de noticias ─────────────────────────── */}
        <main className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-serif font-black text-2xl text-gray-900">
              Todas las noticias
            </h1>
            {pagination && (
              <p className="text-sm text-gray-400">
                Página {pagination.current_page} de {pagination.last_page}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {posts.map((post, i) => (
              <ArticleCard key={post.uuid} post={post} priority={i < 4 && page === 1} />
            ))}
          </div>

          {pagination && pagination.last_page > 1 && (
            <div className="mt-10">
              <Pagination
                currentPage={pagination.current_page}
                totalPages={pagination.last_page}
                basePath="/noticias"
              />
            </div>
          )}
        </main>

        {/* ── Sidebar de categorías ─────────────────────── */}
        <aside aria-label="Categorías">
          <div className="sticky top-20">
            <h2 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Categorías
            </h2>
            <ul className="space-y-1.5">
              {categories.map((cat) => (
                <li key={cat.uuid}>
                  <a
                    href={`/categoria/${cat.slug}`}
                    className="flex items-center justify-between py-1.5 text-sm text-gray-600 
                               hover:text-brand-600 transition-colors group"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform">
                      {cat.name}
                    </span>
                    <span className="text-xs text-gray-400">›</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

      </div>
    </div>
  )
}

