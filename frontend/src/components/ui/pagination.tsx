'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'

interface PaginationProps {
  page: number
  totalPages: number
  count?: number
  pageSize?: number
  onPageChange: (page: number) => void
}

function getPages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

export function Pagination({ page, totalPages, count, pageSize = 25, onPageChange }: PaginationProps) {
  if (totalPages <= 0) return null

  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, count ?? page * pageSize)
  const pages = getPages(page, totalPages)

  return (
    <div className="flex items-center justify-between py-2">
      {count !== undefined ? (
        <p className="text-sm text-gray-500">
          {from}–{to} sur <span className="font-medium">{count}</span> résultat{count > 1 ? 's' : ''}
        </p>
      ) : (
        <p className="text-sm text-gray-500">Page {page} / {totalPages}</p>
      )}

      <div className="flex items-center gap-1">
        <Button
          size="sm" variant="outline"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-1 text-gray-400 text-sm select-none">…</span>
          ) : (
            <Button
              key={p}
              size="sm"
              variant={p === page ? 'default' : 'outline'}
              onClick={() => onPageChange(p)}
              className="h-8 w-8 p-0 text-xs"
            >
              {p}
            </Button>
          )
        )}

        <Button
          size="sm" variant="outline"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
