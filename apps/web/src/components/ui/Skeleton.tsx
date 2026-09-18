import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200', className)}
      aria-hidden="true"
    />
  )
}

// ── Skeleton de card de artículo ──────────────────────────
export function ArticleCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-lg border border-gray-100 overflow-hidden', className)}>
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-2.5">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-3 w-1/3 mt-3" />
      </div>
    </div>
  )
}

// ── Skeleton de artículo completo ─────────────────────────
export function ArticlePageSkeleton() {
  return (
    <div className="container-article pt-6 animate-pulse">
      <Skeleton className="h-5 w-24 mb-6" />
      <Skeleton className="h-10 w-full mb-2" />
      <Skeleton className="h-10 w-4/5 mb-4" />
      <Skeleton className="h-5 w-full mb-1.5" />
      <Skeleton className="h-5 w-2/3 mb-6" />
      <Skeleton className="aspect-video w-full rounded-xl mb-8" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 5 === 4 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </div>
  )
}

