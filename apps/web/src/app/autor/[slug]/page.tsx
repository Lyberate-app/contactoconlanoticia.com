import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Globe, Twitter, Instagram } from 'lucide-react'
import { getAuthor, getAuthorPosts } from '@/lib/api'
import { ArticleCard } from '@/components/article/ArticleCard'
import { Pagination } from '@/components/ui/Pagination'
import { absoluteUrl } from '@/lib/utils'

export const revalidate = 300

interface AuthorPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params
  const author = await getAuthor(slug).catch(() => null)

  if (!author) return { title: 'Autor no encontrado' }

  return {
    title: author.display_name,
    description: author.bio ?? `Artículos escritos por ${author.display_name}`,
    openGraph: {
      type: 'profile',
      firstName: author.display_name.split(' ')[0],
      images: (author as { avatar?: { url: string } }).avatar
        ? [{ url: (author as { avatar: { url: string } }).avatar.url, width: 400, height: 400 }]
        : [],
    },
  }
}

export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))

  const [authorResult, postsResult] = await Promise.allSettled([
    getAuthor(slug),
    getAuthorPosts(slug, { page, per_page: 12 }),
  ])

  if (authorResult.status === 'rejected') notFound()

  const author = authorResult.value
  const { items: posts, pagination } =
    postsResult.status === 'fulfilled'
      ? postsResult.value
      : { items: [], pagination: null as never }

  const avatarUrl = (author as { avatar?: { conversions?: { thumbnail?: { url: string } }; url: string } }).avatar?.conversions?.thumbnail?.url
    ?? (author as { avatar?: { url: string } }).avatar?.url

  // JSON-LD para el autor
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.display_name,
    url: absoluteUrl(`/autor/${author.slug}`),
    image: avatarUrl,
    description: author.bio,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-editorial py-8">

        {/* ── Perfil del autor ─────────────────────────── */}
        <header className="mb-10">
          <nav className="text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-gray-700 transition-colors">Inicio</Link>
            <span className="mx-1.5">›</span>
            <span className="text-gray-700">Autor</span>
            <span className="mx-1.5">›</span>
            <span className="text-gray-700 font-medium">{author.display_name}</span>
          </nav>

          <div className="flex items-start gap-6 bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
            {/* Avatar */}
            <div className="shrink-0">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={author.display_name}
                  width={96}
                  height={96}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-white shadow-sm"
                  priority
                />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-brand-100 border-4 border-white shadow-sm flex items-center justify-center">
                  <span className="text-brand-700 font-black text-3xl">
                    {author.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl md:text-3xl font-serif font-black text-gray-900">
                    {author.display_name}
                  </h1>
                  <p className="text-sm text-brand-600 font-medium mt-0.5 capitalize">
                    {author.role === 'author' ? 'Periodista' : author.role}
                  </p>
                </div>
                <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                  {pagination?.total ?? posts.length} artículo{(pagination?.total ?? posts.length) !== 1 ? 's' : ''}
                </span>
              </div>

              {author.bio && (
                <p className="text-gray-600 mt-3 leading-relaxed">{author.bio}</p>
              )}

              {/* Links sociales del autor */}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {(author as { website?: string }).website && (
                  <a
                    href={(author as { website: string }).website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Sitio web
                  </a>
                )}
                {(author as { social_twitter?: string }).social_twitter && (
                  <a
                    href={(author as { social_twitter: string }).social_twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </a>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── Artículos del autor ───────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-brand-600 rounded-full" />
            <h2 className="text-xl font-serif font-bold text-gray-900">
              Artículos de {author.display_name}
            </h2>
          </div>

          {posts.length === 0 ? (
            <p className="text-gray-400 text-center py-12">Este autor no tiene artículos publicados todavía.</p>
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
                    basePath={`/autor/${slug}`}
                  />
                </div>
              )}
            </>
          )}
        </section>

      </div>
    </>
  )
}

