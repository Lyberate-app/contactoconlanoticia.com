import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getCategoryPosts, getCategories } from '@/lib/api'
import { ArticleCard } from '@/components/article/ArticleCard'
import { Pagination } from '@/components/ui/Pagination'

export const revalidate = 60

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const categories = await getCategories().catch(() => [])
  const category = categories.find((c) => c.slug === slug)

  if (!category) return { title: 'Categoría no encontrada' }

  return {
    title: category.name,
    description: category.description ?? `Últimas noticias de ${category.name}`,
    openGraph: {
      title: category.name,
      description: category.description ?? `Últimas noticias de ${category.name}`,
      type: 'website',
    },
  }
}

export async function generateStaticParams() {
  const categories = await getCategories().catch(() => [])
  return categories.map((c) => ({ slug: c.slug }))
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))

  // Cargar categorías y posts en paralelo
  const [categoriesResult, postsResult] = await Promise.allSettled([
    getCategories(),
    getCategoryPosts(slug, { page, per_page: 12 }),
  ])

  const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : []
  const category = categories.find((c) => c.slug === slug)

  if (!category) notFound()

  const { items: posts, pagination } =
    postsResult.status === 'fulfilled'
      ? postsResult.value
      : { items: [], pagination: null as never }

  // Subcategorías
  const children = categories.filter((c) => c.parent_id === (category as { id: number }).id)

  return (
    <div className="container-editorial py-8">

      {/* ── Cabecera de categoría ─────────────────────── */}
      <header className="mb-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-4" aria-label="Ruta de navegación">
          <Link href="/" className="hover:text-gray-700 transition-colors">Inicio</Link>
          <span className="mx-1.5">›</span>
          <span className="text-gray-700 font-medium">{category.name}</span>
        </nav>

        {/* Cover de la categoría */}
        {(category as { cover?: { url: string; alt_text?: string } }).cover && (
          <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden mb-6 bg-gray-200">
            <Image
              src={(category as { cover: { conversions?: { hero?: { url: string } }; url: string } }).cover.conversions?.hero?.url ?? (category as { cover: { url: string } }).cover.url}
              alt={(category as { cover: { alt_text?: string } }).cover.alt_text ?? category.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/40 flex items-end p-6">
              <h1 className="font-serif font-black text-white text-4xl md:text-5xl">
                {category.name}
              </h1>
            </div>
          </div>
        )}

        {/* Sin cover */}
        {!(category as { cover?: object }).cover && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-10 bg-brand-600 rounded-full" />
              <h1 className="font-serif font-black text-gray-900 text-4xl">{category.name}</h1>
            </div>
            {category.description && (
              <p className="text-gray-500 text-lg ml-4 pl-2">{category.description}</p>
            )}
          </div>
        )}

        {/* Subcategorías */}
        {children.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {children.map((child) => (
              <Link
                key={child.uuid}
                href={`/categoria/${child.slug}`}
                className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 
                           text-sm font-medium text-gray-700 transition-colors"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* ── Grid de noticias ──────────────────────────── */}
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No hay noticias en esta categoría todavía.</p>
          <Link href="/" className="btn-primary inline-flex mt-4">← Volver al inicio</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post, i) => (
              <ArticleCard
                key={post.uuid}
                post={post}
                variant={i === 0 && page === 1 ? 'featured' : 'default'}
                priority={i < 3}
                className={i === 0 && page === 1 ? 'sm:col-span-2 lg:col-span-3' : ''}
              />
            ))}
          </div>

          {/* Paginación */}
          {pagination && pagination.last_page > 1 && (
            <div className="mt-10">
              <Pagination
                currentPage={pagination.current_page}
                totalPages={pagination.last_page}
                basePath={`/categoria/${slug}`}
              />
            </div>
          )}
        </>
      )}

    </div>
  )
}

