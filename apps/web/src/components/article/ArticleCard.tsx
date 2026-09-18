import Link from 'next/link'
import Image from 'next/image'
import { Clock, User } from 'lucide-react'
import type { PostSummary } from '@portal/shared-types'
import { formatDateRelative, formatReadingTime, getImageUrl } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ArticleCardProps {
  post: PostSummary
  variant?: 'default' | 'featured' | 'compact' | 'horizontal'
  className?: string
  priority?: boolean
}

export function ArticleCard({
  post,
  variant = 'default',
  className,
  priority = false,
}: ArticleCardProps) {
  const coverUrl = post.cover_url
    ? getImageUrl(
        // post.cover_url is already processed by API Resource
        undefined,
        'card',
        post.cover_url
      )
    : null

  const articleUrl = post.category
    ? `/${post.category.slug}/${post.slug}`
    : `/${post.slug}`

  if (variant === 'compact') {
    return (
      <article className={cn('flex gap-3', className)}>
        {coverUrl && (
          <Link href={articleUrl} className="shrink-0">
            <div className="relative w-24 h-16 rounded overflow-hidden bg-gray-100">
              <Image
                src={coverUrl}
                alt={post.cover_alt ?? post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="96px"
                loading="lazy"
                decoding="async"
              />
            </div>
          </Link>
        )}
        <div className="flex-1 min-w-0">
          {post.category && (
            <Link
              href={`/categoria/${post.category.slug}`}
              className="text-xs font-semibold text-brand-600 uppercase tracking-wide hover:text-brand-700 mb-1 block"
            >
              {post.category.name}
            </Link>
          )}
          <Link href={articleUrl}>
            <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 hover:text-brand-600 transition-colors font-serif">
              {post.title}
            </h3>
          </Link>
          <p className="text-xs text-gray-500 mt-1">
            {formatDateRelative(post.published_at)}
          </p>
        </div>
      </article>
    )
  }

  if (variant === 'horizontal') {
    return (
      <article className={cn('news-card !flex-row', className)}>
        {coverUrl && (
          <Link href={articleUrl} className="shrink-0 w-1/3 relative aspect-video">
            <Image
              src={coverUrl}
              alt={post.cover_alt ?? post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 33vw, 240px"
              loading="lazy"
              decoding="async"
            />
          </Link>
        )}
        <div className="flex-1 p-4">
          <CardMeta post={post} />
          <Link href={articleUrl}>
            <h3 className="font-serif font-bold text-gray-900 leading-snug mt-1 hover:text-brand-600 transition-colors line-clamp-3">
              {post.title}
            </h3>
          </Link>
        </div>
      </article>
    )
  }

  if (variant === 'featured') {
    return (
      <article className={cn('group relative overflow-hidden rounded-xl bg-gray-900', className)}>
        {coverUrl && (
          <div className="absolute inset-0">
            <Image
              src={coverUrl}
              alt={post.cover_alt ?? post.title}
              fill
              className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 60vw"
              priority={priority}
              decoding="async"
            />
          </div>
        )}
        <div className="relative p-6 md:p-8 flex flex-col justify-end min-h-[400px]">
          <div className="mt-auto">
            <CardMeta post={post} dark />
            <Link href={articleUrl}>
              <h2 className="font-serif font-black text-white text-2xl md:text-3xl leading-tight mt-2 hover:underline">
                {post.title}
              </h2>
            </Link>
            {post.subtitle && (
              <p className="text-gray-300 mt-2 text-sm md:text-base line-clamp-2">
                {post.subtitle}
              </p>
            )}
          </div>
        </div>
      </article>
    )
  }

  // Default card
  return (
    <article className={cn('news-card group', className)}>
      {coverUrl && (
        <Link href={articleUrl} className="relative aspect-video overflow-hidden bg-gray-100 block">
          <Image
            src={coverUrl}
            alt={post.cover_alt ?? post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading={priority ? 'eager' : 'lazy'}
            priority={priority}
            decoding="async"
          />
          {post.is_breaking && (
            <div className="absolute top-2 left-2">
              <span className="badge-breaking">Última hora</span>
            </div>
          )}
        </Link>
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <CardMeta post={post} />
        <Link href={articleUrl}>
          <h3 className="font-serif font-bold text-gray-900 leading-snug hover:text-brand-600 transition-colors line-clamp-3">
            {post.title}
          </h3>
        </Link>
        {post.excerpt && (
          <p className="text-sm text-gray-600 line-clamp-2 flex-1">{post.excerpt}</p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-2 border-t border-gray-100">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {post.author.display_name}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatReadingTime(post.reading_time_minutes) || formatDateRelative(post.published_at)}
          </span>
        </div>
      </div>
    </article>
  )
}

function CardMeta({ post, dark = false }: { post: PostSummary; dark?: boolean }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {post.category && (
        <Link
          href={`/categoria/${post.category.slug}`}
          className={cn(
            'badge-category text-xs',
            dark && 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
          )}
        >
          {post.category.name}
        </Link>
      )}
      <span className={cn('text-xs', dark ? 'text-gray-300' : 'text-gray-500')}>
        {formatDateRelative(post.published_at)}
      </span>
    </div>
  )
}

