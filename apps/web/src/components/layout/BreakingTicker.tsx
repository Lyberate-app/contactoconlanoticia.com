'use client'

import { useQuery } from '@tanstack/react-query'
import { getBreakingPosts } from '@/lib/api'
import Link from 'next/link'
import { Flame } from 'lucide-react'

export function BreakingTicker() {
  const { data: breaking = [] } = useQuery({
    queryKey: ['breaking-ticker'],
    queryFn: getBreakingPosts,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000, // Refresca cada minuto en segundo plano
  })

  if (!breaking || breaking.length === 0) return null

  return (
    <div className="bg-red-600 text-white text-xs sm:text-sm py-1.5 shadow-inner">
      <div className="container-editorial flex items-center gap-3">
        <div className="inline-flex items-center gap-1 bg-white text-red-700 font-bold uppercase tracking-wider px-2 py-0.5 rounded text-[11px] shrink-0 shadow-sm">
          <Flame className="w-3.5 h-3.5 fill-red-600 stroke-red-600" />
          <span>Última hora</span>
        </div>

        <div className="overflow-hidden flex-1 relative">
          <div className="flex items-center gap-6 animate-marquee whitespace-nowrap">
            {breaking.map((post) => {
              const url = post.category ? `/${post.category.slug}/${post.slug}` : `/${post.slug}`
              return (
                <Link
                  key={post.uuid}
                  href={url}
                  className="font-medium hover:underline inline-flex items-center gap-2"
                >
                  <span>{post.title}</span>
                  <span className="text-red-300">●</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
