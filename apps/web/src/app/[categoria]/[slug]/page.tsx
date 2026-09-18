import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Calendar, User, Tag, ChevronRight } from 'lucide-react'
import { getPost, getPosts } from '@/lib/api'
import { absoluteUrl, formatDate, formatDateRelative, formatReadingTime } from '@/lib/utils'
import type { Post } from '@portal/shared-types'
import { ArticleCard } from '@/components/article/ArticleCard'

// ISR — artículos se revalidan cada 60 segundos
export const revalidate = 60

interface ArticlePageProps {
  params: Promise<{
    categoria: string
    slug: string
  }>
}

// ── Metadata dinámica con SSR ─────────────────────────────
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  
  const post = await getPost(slug).catch(() => null)
  if (!post) return { title: 'Noticia no encontrada' }

  const title = post.seo_title ?? post.title
  const description = post.seo_description ?? post.excerpt ?? ''
  const canonical = post.seo_canonical ?? absoluteUrl(
    post.category ? `/${post.category.slug}/${post.slug}` : `/${post.slug}`
  )
  const ogImageUrl = post.og_image?.conversions?.og?.url ?? post.cover?.conversions?.og?.url

  return {
    title,
    description,
    robots: post.seo_no_index ? { index: false, follow: false } : undefined,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title: post.og_title ?? title,
      description: post.og_description ?? description,
      url: canonical,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: [post.author.display_name],
      section: (post.category as { name: string } | null)?.name,
      tags: post.tags.map((t) => t.name),
      images: ogImageUrl
        ? [{ url: ogImageUrl, width: 1200, height: 630, alt: title }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.og_title ?? title,
      description: post.og_description ?? description,
      images: ogImageUrl ? [ogImageUrl] : [],
    },
  }
}

// ── Generación estática de rutas populares ────────────────
export async function generateStaticParams() {
  try {
    const { getAllPostSlugs } = await import('@/lib/api')
    const slugs = await getAllPostSlugs()
    return slugs.slice(0, 100).map((s) => ({
      categoria: s.category_slug,
      slug: s.slug,
    }))
  } catch {
    return []
  }
}

// ── Página ────────────────────────────────────────────────
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params

  const post = await getPost(slug).catch(() => null)
  if (!post || post.status !== 'published') {
    notFound()
  }

  // Fetch paralelo: artículos relacionados (misma categoría)
  const relatedResult = post.category
    ? await getPosts({
        category_slug: (post.category as { slug: string }).slug,
        per_page: 3,
        order_by: 'published_at',
        order: 'desc',
      }).catch(() => ({ items: [] }))
    : { items: [] }

  const related = relatedResult.items.filter((p) => p.uuid !== post.uuid).slice(0, 3)

  const articleUrl = post.category
    ? absoluteUrl(`/${(post.category as { slug: string }).slug}/${post.slug}`)
    : absoluteUrl(`/${post.slug}`)

  // ── JSON-LD Schema.org ─────────────────────────────────
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': post.schema_type ?? 'NewsArticle',
    headline: post.title,
    description: post.seo_description ?? post.excerpt,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.author.display_name,
      url: absoluteUrl(`/autor/${post.author.slug ?? ''}`),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Contacto con la Noticia',
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/icons/logo.png'),
      },
    },
    image: post.cover?.url
      ? [
          post.cover.conversions?.hero?.url ?? post.cover.url,
          post.cover.conversions?.og?.url ?? post.cover.url,
        ]
      : [],
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    articleSection: (post.category as { name: string } | null)?.name,
    keywords: post.tags.map((t) => t.name).join(', '),
    url: articleUrl,
  }

  return (
    <>
      {/* JSON-LD — Schema.org estructurado */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        {/* ── Breadcrumbs ──────────────────────────────── */}
        <div className="container-editorial pt-4">
          <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700 transition-colors">Inicio</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            {post.category && (
              <>
                <Link
                  href={`/categoria/${(post.category as { slug: string }).slug}`}
                  className="hover:text-gray-700 transition-colors capitalize"
                >
                  {(post.category as { name: string }).name}
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
            <span className="text-gray-400 line-clamp-1">{post.title}</span>
          </nav>
        </div>

        {/* ── Cabecera del artículo ─────────────────────── */}
        <header className="container-article pt-6 pb-4">
          {/* Categoría */}
          {post.category && (
            <Link
              href={`/categoria/${(post.category as { slug: string }).slug}`}
              className="badge-category mb-4 inline-block"
            >
              {(post.category as { name: string }).name}
            </Link>
          )}

          {/* Título */}
          <h1 className="font-serif font-black text-gray-900 text-3xl md:text-4xl lg:text-5xl leading-tight mb-3">
            {post.title}
          </h1>

          {/* Subtítulo */}
          {post.subtitle && (
            <p className="text-xl text-gray-600 leading-relaxed mb-4 font-light">
              {post.subtitle}
            </p>
          )}

          {/* Metadata del artículo */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 border-y border-gray-200 py-3 my-4">
            {/* Autor */}
            <Link
              href={`/autor/${post.author.slug ?? ''}`}
              className="flex items-center gap-2 hover:text-gray-700 transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="font-medium">{post.author.display_name}</span>
            </Link>

            {/* Fecha */}
            {post.published_at && (
              <time
                dateTime={post.published_at}
                className="flex items-center gap-1.5"
                title={formatDate(post.published_at)}
              >
                <Calendar className="w-4 h-4" />
                {formatDateRelative(post.published_at)}
              </time>
            )}

            {/* Tiempo de lectura */}
            {post.reading_time_minutes && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatReadingTime(post.reading_time_minutes)}
              </span>
            )}
          </div>
        </header>

        {/* ── Imagen destacada ─────────────────────────── */}
        {post.cover && (
          <div className="container-editorial mb-6">
            <figure>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={post.cover.conversions?.hero?.url ?? post.cover.url}
                  alt={post.cover.alt_text ?? post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                  priority
                  decoding="sync"
                />
              </div>
              {(post.cover.caption || post.cover.photographer) && (
                <figcaption className="text-sm text-gray-500 text-center mt-2">
                  {post.cover.caption}
                  {post.cover.photographer && (
                    <span className="ml-2 text-gray-400">
                      📷 {post.cover.photographer}
                    </span>
                  )}
                </figcaption>
              )}
            </figure>
          </div>
        )}

        {/* ── Cuerpo del artículo ───────────────────────── */}
        <div className="container-article">
          {/* Extracto destacado */}
          {post.excerpt && (
            <p className="text-xl font-serif text-gray-700 leading-relaxed mb-8 border-l-4 border-brand-500 pl-4 italic">
              {post.excerpt}
            </p>
          )}

          {/* Contenido principal */}
          <div
            className="prose-editorial"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-gray-200">
              <div className="flex items-center flex-wrap gap-2">
                <Tag className="w-4 h-4 text-gray-400 shrink-0" />
                {post.tags.map((tag) => (
                  <Link
                    key={tag.uuid}
                    href={`/etiqueta/${tag.slug}`}
                    className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 
                               text-gray-700 rounded-full transition-colors"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Bloque del autor */}
          <AuthorCard author={post.author} />
        </div>

        {/* ── Artículos relacionados ────────────────────── */}
        {related.length > 0 && (
          <section className="container-editorial mt-14" aria-label="Artículos relacionados">
            <div className="border-b-2 border-brand-600 pb-2 mb-6">
              <h2 className="text-lg font-serif font-bold text-gray-900">
                También te puede interesar
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map((relatedPost) => (
                <ArticleCard key={relatedPost.uuid} post={relatedPost} />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  )
}

// ── Componente del bloque de autor ────────────────────────
function AuthorCard({ author }: { author: Post['author'] }) {
  if (!author.slug) return null

  return (
    <div className="mt-10 p-5 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-4">
      {/* Avatar */}
      <Link href={`/autor/${author.slug}`} className="shrink-0">
        {(author as { avatar?: { conversions?: { thumbnail?: { url: string } }; url: string } }).avatar ? (
          <Image
            src={
              (author as { avatar: { conversions?: { thumbnail?: { url: string } }; url: string } }).avatar.conversions?.thumbnail?.url ??
              (author as { avatar: { url: string } }).avatar.url
            }
            alt={author.display_name}
            width={56}
            height={56}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-brand-700 font-bold text-lg">
              {author.display_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
          Escrito por
        </p>
        <Link
          href={`/autor/${author.slug}`}
          className="font-semibold text-gray-900 hover:text-brand-600 transition-colors"
        >
          {author.display_name}
        </Link>
        {(author as { bio?: string | null }).bio && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {(author as { bio: string }).bio}
          </p>
        )}
      </div>
    </div>
  )
}

