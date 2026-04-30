import { useQueries } from '@tanstack/react-query'
import api from '@/lib/api'
import type { LucideIcon } from 'lucide-react'

export interface StatDef {
  label: string
  endpoint: string
  params?: Record<string, unknown>
  icon: LucideIcon
  color: string       // ex: "bg-blue-50 text-blue-600"
  format?: (n: number) => string
  sub?: string
}

function fetchCount(endpoint: string, params?: Record<string, unknown>) {
  return api
    .get<{ count: number }>(endpoint, { params: { page_size: 1, ...params } })
    .then(r => r.data.count)
}

export function StatCards({ stats }: { stats: StatDef[] }) {
  const results = useQueries({
    queries: stats.map(s => ({
      queryKey: ['stat', s.endpoint, s.params],
      queryFn:  () => fetchCount(s.endpoint, s.params),
      staleTime: 30_000,
    })),
  })

  return (
    <div className={`grid gap-4 mb-2 grid-cols-2 ${stats.length >= 5 ? 'lg:grid-cols-5' : stats.length === 4 ? 'lg:grid-cols-4' : stats.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
      {stats.map((s, i) => {
        const res   = results[i]
        const val   = res.data ?? 0
        const Icon  = s.icon
        const loading = res.isLoading

        return (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              {loading ? (
                <div className="h-7 w-12 bg-gray-100 rounded animate-pulse mb-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-900 leading-none mb-0.5">
                  {s.format ? s.format(val) : val.toLocaleString('fr-FR')}
                </p>
              )}
              <p className="text-sm text-gray-500 truncate">{s.label}</p>
              {s.sub && <p className="text-xs text-gray-400">{s.sub}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
