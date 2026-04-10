'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth.store'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import {
  Users, Calendar, Heart, Stethoscope,
  FolderOpen, Receipt, ClipboardList, ArrowRight,
  Plus, UserPlus, CalendarPlus, TrendingUp,
  Activity, Building2, ShieldCheck, Pill,
} from 'lucide-react'

/* ── helpers ── */
const fetchCount = (url: string) =>
  api.get(url).then(r => r.data.count ?? 0)

const fetchList = (url: string) =>
  api.get(url).then(r => r.data.results ?? r.data ?? [])

/* ── raccourcis ── */
const QUICK_ACTIONS = [
  { href: '/dashboard/patients?new=1',    label: 'Nouveau patient',     icon: UserPlus,     color: 'bg-blue-500',    module: 'patients' },
  { href: '/dashboard/rendez-vous?new=1', label: 'Rendez-vous',         icon: CalendarPlus, color: 'bg-green-500',   module: 'rendez_vous' },
  { href: '/dashboard/consultations',     label: 'Consultation',        icon: Stethoscope,  color: 'bg-purple-500',  module: 'consultations' },
  { href: '/dashboard/ordonnances',       label: 'Ordonnance',          icon: ClipboardList,color: 'bg-orange-500',  module: 'ordonnances' },
  { href: '/dashboard/factures',          label: 'Facture',             icon: Receipt,      color: 'bg-rose-500',    module: 'factures' },
  { href: '/dashboard/dossiers',          label: 'Dossiers',            icon: FolderOpen,   color: 'bg-cyan-500',    module: 'dossiers_medicaux' },
]

/* ── navigation modules ── */
const MODULES = [
  { href: '/dashboard/patients',         label: 'Patients',       icon: Users,        color: 'text-blue-600',   bg: 'bg-blue-50',    module: 'patients' },
  { href: '/dashboard/rendez-vous',      label: 'Rendez-vous',    icon: Calendar,     color: 'text-green-600',  bg: 'bg-green-50',   module: 'rendez_vous' },
  { href: '/dashboard/consultations',    label: 'Consultations',  icon: Stethoscope,  color: 'text-purple-600', bg: 'bg-purple-50',  module: 'consultations' },
  { href: '/dashboard/soins',            label: 'Soins',          icon: Heart,        color: 'text-rose-600',   bg: 'bg-rose-50',    module: 'soins' },
  { href: '/dashboard/dossiers',         label: 'Dossiers',       icon: FolderOpen,   color: 'text-cyan-600',   bg: 'bg-cyan-50',    module: 'dossiers_medicaux' },
  { href: '/dashboard/ordonnances',      label: 'Ordonnances',    icon: ClipboardList,color: 'text-orange-600', bg: 'bg-orange-50',  module: 'ordonnances' },
  { href: '/dashboard/pharmacie',        label: 'Pharmacie',      icon: Pill,         color: 'text-teal-600',   bg: 'bg-teal-50',    module: 'pharmacie' },
  { href: '/dashboard/factures',         label: 'Facturation',    icon: Receipt,      color: 'text-indigo-600', bg: 'bg-indigo-50',  module: 'factures' },
]

export default function DashboardPage() {
  const { user, clinic, canAccess } = useAuthStore()

  const { data: patientsCount = 0 } = useQuery({
    queryKey: ['dash-patients'],
    queryFn: () => fetchCount('/patients/'),
    enabled: canAccess('patients'),
  })
  const { data: consultCount = 0 } = useQuery({
    queryKey: ['dash-consult'],
    queryFn: () => fetchCount('/consultations/'),
    enabled: canAccess('consultations'),
  })
  const { data: rdvCount = 0 } = useQuery({
    queryKey: ['dash-rdv'],
    queryFn: () => fetchCount('/rendez-vous/'),
    enabled: canAccess('rendez_vous'),
  })
  const { data: soinsCount = 0 } = useQuery({
    queryKey: ['dash-soins'],
    queryFn: () => fetchCount('/soins/'),
    enabled: canAccess('soins'),
  })
  const { data: recentPatients = [] } = useQuery({
    queryKey: ['dash-recent-patients'],
    queryFn: () => fetchList('/patients/?ordering=-created_at&page_size=5'),
    enabled: canAccess('patients'),
  })

  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const STATS = [
    { label: 'Patients total',  value: patientsCount, icon: Users,       color: 'text-blue-600',   bg: 'bg-blue-50',   module: 'patients' },
    { label: 'Consultations',   value: consultCount,  icon: Stethoscope, color: 'text-purple-600', bg: 'bg-purple-50', module: 'consultations' },
    { label: 'Rendez-vous',     value: rdvCount,      icon: Calendar,    color: 'text-green-600',  bg: 'bg-green-50',  module: 'rendez_vous' },
    { label: 'Soins',           value: soinsCount,    icon: Heart,       color: 'text-rose-600',   bg: 'bg-rose-50',   module: 'soins' },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-blue-100 text-sm font-medium capitalize">{dateLabel}</p>
            <h1 className="text-2xl font-bold mt-1">
              Bonjour, {user?.first_name} 👋
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-blue-100 text-sm">{clinic?.name}</span>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1 text-right">
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5">
              <ShieldCheck className="h-4 w-4 text-blue-200" />
              <span className="text-sm font-medium">{user?.group}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5">
              <Building2 className="h-4 w-4 text-blue-200" />
              <span className="text-sm">{clinic?.type_display}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, icon: Icon, value, color, bg, module }) => {
          if (!canAccess(module)) return null
          return (
            <div key={label} className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{label}</p>
                <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Actions rapides ── */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="h-4 w-4 text-gray-500" />
          <h2 className="font-semibold text-gray-800 text-sm">Actions rapides</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon, color, module }) => {
            if (!canAccess(module)) return null
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors group text-center"
              >
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-600 font-medium leading-tight">{label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Grille basse ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Derniers patients */}
        {canAccess('patients') && (
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-500" />
                <h2 className="font-semibold text-gray-800 text-sm">Derniers patients</h2>
              </div>
              <Link href="/dashboard/patients" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                Voir tous <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentPatients.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Aucun patient enregistré</div>
            ) : (
              <div className="space-y-2">
                {recentPatients.map((p: { id: number; nom: string; prenom: string; telephone?: string; created_at?: string }) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/dossiers?patient=${p.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                      {p.prenom?.[0]}{p.nom?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.prenom} {p.nom}</p>
                      <p className="text-xs text-gray-400 truncate">{p.telephone || '—'}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-500 shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modules disponibles */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <h2 className="font-semibold text-gray-800 text-sm">Modules</h2>
          </div>
          <div className="space-y-1">
            {MODULES.map(({ href, label, icon: Icon, color, bg, module }) => {
              if (!canAccess(module)) return null
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                  </div>
                  <span className="text-sm text-gray-600 font-medium flex-1">{label}</span>
                  <ArrowRight className="h-3 w-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
