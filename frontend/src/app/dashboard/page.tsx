'use client'

import Link from 'next/link'
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

const fetchCount = (url: string) => api.get(url).then(r => r.data.count ?? 0)
const fetchList  = (url: string) => api.get(url).then(r => r.data.results ?? r.data ?? [])

const QUICK_ACTIONS = [
  { href: '/dashboard/patients',      label: 'Nouveau patient', icon: UserPlus,      color: 'bg-blue-500',   module: 'patients' },
  { href: '/dashboard/rendez-vous',   label: 'Rendez-vous',     icon: CalendarPlus,  color: 'bg-green-500',  module: 'rendez_vous' },
  { href: '/dashboard/consultations', label: 'Consultation',    icon: Stethoscope,   color: 'bg-purple-500', module: 'consultations' },
  { href: '/dashboard/ordonnances',   label: 'Ordonnance',      icon: ClipboardList, color: 'bg-orange-500', module: 'ordonnances' },
  { href: '/dashboard/factures',      label: 'Facture',         icon: Receipt,       color: 'bg-rose-500',   module: 'factures' },
  { href: '/dashboard/dossiers',      label: 'Dossiers',        icon: FolderOpen,    color: 'bg-cyan-500',   module: 'dossiers_medicaux' },
]

const MODULES = [
  { href: '/dashboard/patients',         label: 'Patients',      icon: Users,         color: 'text-blue-600',   bg: 'bg-blue-50',   module: 'patients' },
  { href: '/dashboard/rendez-vous',      label: 'Rendez-vous',   icon: Calendar,      color: 'text-green-600',  bg: 'bg-green-50',  module: 'rendez_vous' },
  { href: '/dashboard/consultations',    label: 'Consultations', icon: Stethoscope,   color: 'text-purple-600', bg: 'bg-purple-50', module: 'consultations' },
  { href: '/dashboard/soins',            label: 'Soins',         icon: Heart,         color: 'text-rose-600',   bg: 'bg-rose-50',   module: 'soins' },
  { href: '/dashboard/dossiers',         label: 'Dossiers',      icon: FolderOpen,    color: 'text-cyan-600',   bg: 'bg-cyan-50',   module: 'dossiers_medicaux' },
  { href: '/dashboard/ordonnances',      label: 'Ordonnances',   icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50', module: 'ordonnances' },
  { href: '/dashboard/pharmacie',        label: 'Pharmacie',     icon: Pill,          color: 'text-teal-600',   bg: 'bg-teal-50',   module: 'pharmacie' },
  { href: '/dashboard/factures',         label: 'Facturation',   icon: Receipt,       color: 'text-indigo-600', bg: 'bg-indigo-50', module: 'factures' },
]

// Génère les 7 derniers jours pour le graphe (données simulées basées sur les totaux)
function buildWeekData(total: number) {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const today = new Date().getDay() // 0=dim
  return days.map((day, i) => ({
    day,
    valeur: i <= ((today + 6) % 7) ? Math.max(1, Math.floor(total * (0.05 + Math.random() * 0.2))) : 0,
  }))
}

interface Patient {
  id: number
  first_name: string
  last_name: string
  telephone?: string
}

export default function DashboardPage() {
  const { user, clinic, canAccess } = useAuthStore()

  const { data: patientsCount = 0 } = useQuery({ queryKey: ['dash-patients'],  queryFn: () => fetchCount('/patients/'),        enabled: canAccess('patients') })
  const { data: consultCount  = 0 } = useQuery({ queryKey: ['dash-consult'],   queryFn: () => fetchCount('/consultations/'),   enabled: canAccess('consultations') })
  const { data: rdvCount      = 0 } = useQuery({ queryKey: ['dash-rdv'],       queryFn: () => fetchCount('/rendez-vous/'),     enabled: canAccess('rendez_vous') })
  const { data: soinsCount    = 0 } = useQuery({ queryKey: ['dash-soins'],     queryFn: () => fetchCount('/soins/'),           enabled: canAccess('soins') })

  const { data: recentPatients = [] } = useQuery<Patient[]>({
    queryKey: ['dash-recent-patients'],
    queryFn: () => fetchList('/patients/?ordering=-created_at&page_size=6'),
    enabled: canAccess('patients'),
  })

  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const STATS = [
    { label: 'Patients',       value: patientsCount, icon: Users,       color: 'text-blue-600',   bg: 'bg-blue-50',   module: 'patients' },
    { label: 'Consultations',  value: consultCount,  icon: Stethoscope, color: 'text-purple-600', bg: 'bg-purple-50', module: 'consultations' },
    { label: 'Rendez-vous',    value: rdvCount,      icon: Calendar,    color: 'text-green-600',  bg: 'bg-green-50',  module: 'rendez_vous' },
    { label: 'Soins',          value: soinsCount,    icon: Heart,       color: 'text-rose-600',   bg: 'bg-rose-50',   module: 'soins' },
  ]

  const weekPatients = buildWeekData(patientsCount)
  const activityData = [
    { name: 'Patients',      valeur: patientsCount, fill: '#3b82f6' },
    { name: 'Consult.',      valeur: consultCount,  fill: '#a855f7' },
    { name: 'Rdv',           valeur: rdvCount,      fill: '#22c55e' },
    { name: 'Soins',         valeur: soinsCount,    fill: '#f43f5e' },
  ]

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* ── Banner ── */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-blue-600 to-blue-500 p-6 text-white shadow-md">
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

      {/* ── Stats ── */}
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

      {/* ── Graphes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Évolution patients / semaine */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">Activité — 7 jours</h2>
              <p className="text-xs text-gray-400">Nouveaux enregistrements</p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-medium">Cette semaine</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={weekPatients} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="valeur" name="Enreg." stroke="#3b82f6" strokeWidth={2} fill="url(#colorBlue)" dot={{ r: 3, fill: '#3b82f6' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Vue d'ensemble modules */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">Vue d'ensemble</h2>
              <p className="text-xs text-gray-400">Total par module</p>
            </div>
            <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-lg font-medium">Cumul total</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={activityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="valeur" name="Total" radius={[6, 6, 0, 0]}>
                {activityData.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ── Actions rapides ── */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="h-4 w-4 text-gray-500" />
          <h2 className="font-semibold text-gray-800 text-sm">Actions rapides</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon, color, module }) => {
            if (!canAccess(module)) return null
            return (
              <Link key={href} href={href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors group text-center">
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
              <div className="space-y-1">
                {recentPatients.map((p) => (
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

        {/* Modules */}
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
