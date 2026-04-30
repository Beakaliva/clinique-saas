'use client'

import { useState } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'

const MOIS = [
  { value: '1', label: 'Janvier' }, { value: '2', label: 'Février' },
  { value: '3', label: 'Mars' },    { value: '4', label: 'Avril' },
  { value: '5', label: 'Mai' },     { value: '6', label: 'Juin' },
  { value: '7', label: 'Juillet' }, { value: '8', label: 'Août' },
  { value: '9', label: 'Septembre' }, { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' }, { value: '12', label: 'Décembre' },
]

const currentYear = new Date().getFullYear()
const ANNEES = Array.from({ length: 5 }, (_, i) => String(currentYear - i))

export interface FilterState {
  dateDebut: string
  dateFin:   string
  mois:      string
  annee:     string
  [key: string]: string
}

export interface ExtraFilter {
  key:     string
  label:   string
  options: { value: string; label: string }[]
}

interface FilterBarProps {
  filters:   FilterState
  onChange:  (key: string, value: string) => void
  onReset:   () => void
  extras?:   ExtraFilter[]
}

export function FilterBar({ filters, onChange, onReset, extras = [] }: FilterBarProps) {
  const [open, setOpen] = useState(false)

  const activeCount = Object.values(filters).filter(v => v !== '').length

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Toggle */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span>Filtres</span>
          {activeCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {activeCount}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Intervalle de dates */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Date début</label>
              <Input
                type="date"
                value={filters.dateDebut}
                onChange={e => { onChange('dateDebut', e.target.value); onChange('mois', ''); onChange('annee', '') }}
                className="h-8 text-sm w-36"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Date fin</label>
              <Input
                type="date"
                value={filters.dateFin}
                onChange={e => { onChange('dateFin', e.target.value); onChange('mois', ''); onChange('annee', '') }}
                className="h-8 text-sm w-36"
              />
            </div>

            <div className="flex items-end self-end pb-1 text-xs text-gray-400 select-none">ou</div>

            {/* Mois */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Mois</label>
              <select
                value={filters.mois}
                onChange={e => { onChange('mois', e.target.value); onChange('dateDebut', ''); onChange('dateFin', '') }}
                className="h-8 border border-gray-200 rounded-md px-2 text-sm w-32"
              >
                <option value="">Tous les mois</option>
                {MOIS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            {/* Année */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Année</label>
              <select
                value={filters.annee}
                onChange={e => onChange('annee', e.target.value)}
                className="h-8 border border-gray-200 rounded-md px-2 text-sm w-24"
              >
                <option value="">Toutes</option>
                {ANNEES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Filtres extras (statut, sexe, etc.) */}
            {extras.map(ef => (
              <div key={ef.key}>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{ef.label}</label>
                <select
                  value={filters[ef.key] ?? ''}
                  onChange={e => onChange(ef.key, e.target.value)}
                  className="h-8 border border-gray-200 rounded-md px-2 text-sm w-36"
                >
                  <option value="">Tous</option>
                  {ef.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}

            {/* Reset */}
            {activeCount > 0 && (
              <div>
                <div className="mb-1 h-4" />
                <Button type="button" variant="outline" size="sm" onClick={onReset} className="h-8 gap-1.5 text-sm">
                  <X className="h-3.5 w-3.5" /> Réinitialiser
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
