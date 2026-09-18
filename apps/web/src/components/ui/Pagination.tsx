import Link from 'next/link'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  /** Para navegación SSR via URL */
  basePath?: string
  /** Para navegación CSR via callback */
  onPageChange?: (page: number) => void
}

export function Pagination({ currentPage, totalPages, basePath, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = buildPageList(currentPage, totalPages)

  const getHref = (page: number) =>
    basePath ? `${basePath}?page=${page}` : '#'

  const handleClick = (page: number, e: React.MouseEvent) => {
    if (onPageChange) {
      e.preventDefault()
      onPageChange(page)
    }
  }

  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-center gap-1"
    >
      {/* Anterior */}
      <PageButton
        href={getHref(currentPage - 1)}
        disabled={currentPage <= 1}
        onClick={(e) => currentPage > 1 && handleClick(currentPage - 1, e)}
        aria-label="Página anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </PageButton>

      {/* Páginas */}
      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400">
            <MoreHorizontal className="w-4 h-4" />
          </span>
        ) : (
          <PageButton
            key={page}
            href={getHref(page as number)}
            active={page === currentPage}
            onClick={(e) => handleClick(page as number, e)}
            aria-label={`Ir a la página ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </PageButton>
        )
      )}

      {/* Siguiente */}
      <PageButton
        href={getHref(currentPage + 1)}
        disabled={currentPage >= totalPages}
        onClick={(e) => currentPage < totalPages && handleClick(currentPage + 1, e)}
        aria-label="Página siguiente"
      >
        <ChevronRight className="w-4 h-4" />
      </PageButton>
    </nav>
  )
}

function PageButton({
  href,
  children,
  active = false,
  disabled = false,
  onClick,
  'aria-label': ariaLabel,
  'aria-current': ariaCurrent,
}: {
  href: string
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick?: (e: React.MouseEvent) => void
  'aria-label'?: string
  'aria-current'?: 'page' | undefined
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="w-9 h-9 flex items-center justify-center rounded-lg text-sm text-gray-300 cursor-not-allowed"
      >
        {children}
      </span>
    )
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      className={cn(
        'w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
        active
          ? 'bg-brand-600 text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      {children}
    </Link>
  )
}

// ── Generar lista de páginas con ellipsis ─────────────────
function buildPageList(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = [1]

  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')
  pages.push(total)

  return pages
}

