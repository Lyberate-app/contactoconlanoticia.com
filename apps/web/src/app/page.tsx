import type { Metadata } from 'next'
import { getFeaturedPosts, getPosts, getBreakingPosts, getCategories } from '@/lib/api'
import { ArticleCard } from '@/components/article/ArticleCard'
import { getSiteSettings } from '@/lib/api'

// ISR — revalidar portada cada 30 segundos
export const revalidate = 30

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings().catch(() => null)
  return {
    title: settings?.name ?? 'Portal de Noticias',
    description: settings?.seo_default_description ?? settings?.description,
  }
}

export default async function HomePage() {
  // Fetch paralelo de todos los datos necesarios
  const [featuredResult, latestResult, breakingResult, categoriesResult] =
    await Promise.allSettled([
      getFeaturedPosts(),
      getPosts({ per_page: 12, order_by: 'published_at', order: 'desc' }),
      getBreakingPosts(),
      getCategories(),
    ])

  const featured = featuredResult.status === 'fulfilled' ? featuredResult.value : []
  const latest = latestResult.status === 'fulfilled' ? latestResult.value.items : []
  const breaking = breakingResult.status === 'fulfilled' ? breakingResult.value : []
  const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : []

  const [heroPost, ...sidebarFeatured] = featured

  return (
    <div className="container-editorial py-6 md:py-10">

      {/* ── Breaking news bar ───────────────────────────── */}
      {breaking.length > 0 && (
        <section className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="badge-breaking shrink-0 mt-0.5">Última hora</span>
            <div className="flex flex-col gap-1.5">
              {breaking.slice(0, 3).map((post) => (
                <a
                  key={post.uuid}
                  href={post.category ? `/${post.category.slug}/${post.slug}` : `/${post.slug}`}
                  className="text-sm font-semibold text-red-900 hover:text-red-700 transition-colors line-clamp-1"
                >
                  {post.title}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Hero section ────────────────────────────────── */}
      {heroPost && (
        <section className="mb-8" aria-label="Noticia destacada principal">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Featured principal */}
            <div className="lg:col-span-2">
              <ArticleCard post={heroPost} variant="featured" priority />
            </div>

            {/* Destacadas secundarias */}
            {sidebarFeatured.length > 0 && (
              <div className="flex flex-col gap-4">
                {sidebarFeatured.slice(0, 3).map((post, i) => (
                  <ArticleCard
                    key={post.uuid}
                    post={post}
                    variant="horizontal"
                    priority={i === 0}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Cuerpo principal: noticias + sidebar ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Noticias recientes */}
        <section className="lg:col-span-2" aria-label="Noticias recientes">
          <SectionHeader title="Últimas noticias" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
            {latest.map((post, i) => (
              <ArticleCard
                key={post.uuid}
                post={post}
                variant="default"
                priority={i < 2}
              />
            ))}
          </div>

          {/* Cargar más */}
          {latest.length >= 12 && (
            <div className="mt-8 text-center">
              <a href="/noticias" className="btn-secondary">
                Ver todas las noticias
              </a>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-8" aria-label="Contenido adicional">

          {/* Noticias por categoría */}
          {categories.slice(0, 3).map((category) => (
            <CategorySection key={category.uuid} categorySlug={category.slug} categoryName={category.name} />
          ))}

        </aside>
      </div>

    </div>
  )
}

// ── Componentes auxiliares de la portada ──────────────────

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between border-b-2 border-brand-600 pb-2">
      <h2 className="text-lg font-serif font-bold text-gray-900">{title}</h2>
      {href && (
        <a href={href} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
          Ver todo →
        </a>
      )}
    </div>
  )
}

// Componente lazy para secciones de categoría en el sidebar
async function CategorySection({
  categorySlug,
  categoryName,
}: {
  categorySlug: string
  categoryName: string
}) {
  const { getPosts } = await import('@/lib/api')
  const result = await getPosts({
    category_slug: categorySlug,
    per_page: 4,
    order_by: 'published_at',
    order: 'desc',
  }).catch(() => ({ items: [], pagination: null as never }))

  if (result.items.length === 0) return null

  return (
    <section aria-label={`Noticias de ${categoryName}`}>
      <SectionHeader title={categoryName} href={`/categoria/${categorySlug}`} />
      <div className="mt-3 flex flex-col gap-4">
        {result.items.map((post) => (
          <ArticleCard key={post.uuid} post={post} variant="compact" />
        ))}
      </div>
    </section>
  )
}

