'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Patient, PaginatedResponse } from '@/types'
import { Search, User, X } from 'lucide-react'

interface Props {
  value: number | null
  onChange: (id: number | null, patient?: Patient) => void
  required?: boolean
  placeholder?: string
}

function fetchPatientSearch(q: string) {
  return api
    .get<PaginatedResponse<Patient>>('/patients/', { params: { search: q, page_size: 20 } })
    .then(r => r.data.results)
}

export default function PatientSelect({ value, onChange, required, placeholder = 'Rechercher par nom, prénom, téléphone...' }: Props) {
  const [query, setQuery]       = useState('')
  const [open, setOpen]         = useState(false)
  const [selected, setSelected] = useState<Patient | null>(null)
  const containerRef            = useRef<HTMLDivElement>(null)

  // Fetch when query changes (debounced via staleTime)
  const { data: results = [], isFetching } = useQuery({
    queryKey: ['patient-search', query],
    queryFn: () => fetchPatientSearch(query),
    enabled: open,
    staleTime: 300,
  })

  // Load initial patient label if value is preset (edit mode)
  useEffect(() => {
    if (value && !selected) {
      api.get<Patient>(`/patients/${value}/`).then(r => {
        setSelected(r.data)
        setQuery(r.data.last_name.toUpperCase() + ' ' + r.data.first_name)
      }).catch(() => {})
    }
    if (!value) {
      setSelected(null)
      setQuery('')
    }
  }, [value])

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const select = (p: Patient) => {
    setSelected(p)
    setQuery(p.last_name.toUpperCase() + ' ' + p.first_name + (p.telephone ? ` · ${p.telephone}` : ''))
    onChange(p.id, p)
    setOpen(false)
  }

  const clear = () => {
    setSelected(null)
    setQuery('')
    onChange(null)
    setOpen(true)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          required={required && !selected}
          value={query}
          placeholder={placeholder}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="h-8 w-full rounded-lg border border-input bg-transparent pl-8 pr-7 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
        />
        {selected && (
          <button type="button" onClick={clear} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {isFetching ? (
            <div className="px-3 py-2 text-xs text-gray-400">Recherche...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-xs text-gray-400 flex items-center gap-2">
              <User className="h-4 w-4 opacity-40" />
              Aucun patient trouvé
            </div>
          ) : (
            results.map(p => (
              <button
                key={p.id}
                type="button"
                onMouseDown={() => select(p)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 text-left transition-colors"
              >
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                  {p.first_name[0]}{p.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {p.last_name.toUpperCase()} {p.first_name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {[p.telephone, p.age ? `${p.age} ans` : null, p.profession].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
