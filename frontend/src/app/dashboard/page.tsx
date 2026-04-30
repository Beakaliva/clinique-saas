'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, BarChart, Bar, CartesianGrid,
} from 'recharts'
import {
  Users, Calendar, Heart, Stethoscope,
  FolderOpen, Receipt, ClipboardList, ArrowRight,
  Plus, UserPlus, CalendarPlus, TrendingUp,
  Activity, Building2, ShieldCheck, Pill,
} from 'lucide-react'

interface StatsData {
  totals: { patients: number; consultations: number; rdv: number; soins: number; factures: number; ordonnances: number }
  monthly_patients: { mois: string; valeur: number }[]
  weekly_patients:  { jour: string; valeur: number }[]
  monthly_compare:  { mois: string; patients: number; consultations: number }[]
  pie: { name: string; value: number }[]
}

interface Patient { id: number; first_name: string; last_name: string; telephone?: string }

const QUICK_ACTIONS = [
  { href: '/dashboard/patients',      label: 'Nouveau patient', icon: UserPlus,      color: 'bg-blue-500',   module: 'patients' },
  { href: '/dashboard/rendez-vous',   label: 'Rendez-vous',     icon: CalendarPlus,  color: 'bg-green-500',  module: 'rendez_vous' },
  { href: '/dashboard/consultations', label: 'Consultation',    icon: Stethoscope,   color: 'bg-purple-500', module: 'consultations' },
  { href: '/dashboard/ordonnances',   label: 'Ordonnance',      icon: ClipboardList, color: 'bg-orange-500', module: 'ordonnances' },
  { href: '/dashboard/factures',      label: 'Facture',         icon: Receipt,       color: 'bg-rose-500',   module: 'factures' },
  { href: '/dashboard/dossiers',      label: 'Dossiers',        icon: FolderOpen,    color: 'bg-cyan-500',   module: 'dossiers_medicaux' },
]

const MODULES = [
  { href: '/dashboard/patients',      label: 'Patients',      icon: Users,         color: 'text-blue-600',   bg: 'bg-blue-50',   module: 'patients' },
  { href: '/dashboard/rendez-vous',   label: 'Rendez-vous',   icon: Calendar,      color: 'text-green-600',  bg: 'bg-green-50',  module: 'rendez_vous' },
  { href: '/dashboard/consultations', label: 'Consultations', icon: Stethoscope,   color: 'text-purple-600', bg: 'bg-purple-50', module: 'consultations' },
  { href: '/dashboard/soins',         label: 'Soins',         icon: Heart,         color: 'text-rose-600',   bg: 'bg-rose-50',   module: 'soins' },
  { href: '/dashboard/dossiers',      label: 'Dossiers',      icon: FolderOpen,    color: 'text-cyan-600',   bg: 'bg-cyan-50',   module: 'dossiers_medicaux' },
  { href: '/dashboard/ordonnances',   label: 'Ordonnances',   icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50', module: 'ordonnances' },
  { href: '/dashboard/pharmacie',     label: 'Pharmacie',     icon: Pill,          color: 'text-teal-600',   bg: 'bg-teal-50',   module: 'pharmacie' },
  { href: '/dashboard/factures',      label: 'Facturation',   icon: Receipt,       color: 'text-indigo-600', bg: 'bg-indigo-50', module: 'factures' },
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)
const PERIODES = [
  { value: 7,  label: '7j' },
  { value: 14, label: '14j' },
  { value: 30, label: '30j' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, clinic, canAccess } = useAuthStore()

  const [annee,   setAnnee]   = useState(CURRENT_YEAR)
  const [periode, setPeriode] = useState(7)

  const { data: stats } = useQuery<StatsData>({
    queryKey: ['dashboard-stats', annee, periode],
    queryFn: () => api.get('/stats/', { params: { annee, periode } }).then(r => r.data),
  })

  const { data: recentPatients = [] } = useQuery<Patient[]>({
    queryKey: ['dash-recent-patients'],
    queryFn: () => api.get('/patients/?ordering=-created_at&page_size=6').then(r => r.data.results ?? []),
    enabled: canAccess('patients'),
  })

  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const t = stats?.totals
  const STATS = [
    { label: 'Patients',      value: t?.patients      ?? '—', icon: Users,       color: 'text-blue-600',   bg: 'bg-blue-50',   module: 'patients' },
    { label: 'Consultations', value: t?.consultations  ?? '—', icon: Stethoscope, color: 'text-purple-600', bg: 'bg-purple-50', module: 'consultations' },
    { label: 'Rendez-vous',   value: t?.rdv            ?? '—', icon: Calendar,    color: 'text-green-600',  bg: 'bg-green-50',  module: 'rendez_vous' },
    { label: 'Soins',         value: t?.soins          ?? '—', icon: Heart,       color: 'text-rose-600',   bg: 'bg-rose-50',   module: 'soins' },
  ]

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 p-6 text-white shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-blue-100 text-sm capitalize">{dateLabel}</p>
            <h1 className="text-2xl font-bold mt-0.5">Bonjour, {user?.first_name} 👋</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-blue-100 text-sm">{clinic?.name}</span>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-blue-200" />{user?.group}
            </div>
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5 text-sm">
              <Building2 className="h-4 w-4 text-blue-200" />{clinic?.type_display}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, icon: Icon, value, color, bg, module }) => {
          if (!canAccess(module)) return null
          return (
            <div key={label} className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Graphes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Graphe période — avec sélecteur de période */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">Patients — activité récente</h2>
              <p className="text-xs text-gray-400">Nouveaux enregistrements</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {PERIODES.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriode(p.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    periode === p.value
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={stats?.weekly_patients ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="jour" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={periode > 14 ? 3 : 0} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="valeur" name="Patients" stroke="#3b82f6" strokeWidth={2} fill="url(#colorBlue)" dot={periode <= 14 ? { r: 3, fill: '#3b82f6' } : false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Graphe annuel — avec sélecteur d'année */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">Patients vs Consultations</h2>
              <p className="text-xs text-gray-400">Par mois</p>
            </div>
            <select
              value={annee}
              onChange={e => setAnnee(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats?.monthly_compare ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois"   tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis                  tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="patients"      name="Patients"      fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="consultations" name="Consultations" fill="#a855f7" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="h-4 w-4 text-gray-500" />
          <h2 className="font-semibold text-gray-800 text-sm">Actions rapides</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon, color, module }) => {
            if (!canAccess(module)) return null
            return (
              <button key={href}
                onClick={() => router.push(`${href}?new=1`)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors group text-center">
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-600 font-medium leading-tight">{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Grille basse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
              <div className="space-y-1">
                {recentPatients.map(p => (
                  <Link key={p.id} href={`/dashboard/dossiers?patient=${p.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0 uppercase">
                      {p.first_name?.[0]}{p.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.first_name} {p.last_name}</p>
                      <p className="text-xs text-gray-400">{p.telephone || '—'}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-500 shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <h2 className="font-semibold text-gray-800 text-sm">Modules</h2>
          </div>
          <div className="space-y-0.5">
            {MODULES.map(({ href, label, icon: Icon, color, bg, module }) => {
              if (!canAccess(module)) return null
              return (
                <Link key={href} href={href}
                  className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors group">
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
