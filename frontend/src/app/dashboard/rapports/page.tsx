'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar,
} from 'recharts'
import {
  Users, Receipt, FlaskConical, BedDouble,
  Heart, Stethoscope, Calendar, ClipboardList, BarChart3,
} from 'lucide-react'

const PIE_COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f43f5e', '#f59e0b', '#06b6d4']

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)

function YearSelect({ value, onChange }: { value: number; onChange: (y: number) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
    >
      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
    </select>
  )
}
const PERIODES = [
  { value: 7,  label: '7 jours' },
  { value: 14, label: '14 jours' },
  { value: 30, label: '30 jours' },
]

interface StatsData {
  totals: { patients: number; consultations: number; rdv: number; soins: number; factures: number; ordonnances: number }
  monthly_patients: { mois: string; valeur: number }[]
  monthly_consults:  { mois: string; valeur: number }[]
  monthly_compare:   { mois: string; patients: number; consultations: number }[]
  weekly_patients:   { jour: string; valeur: number }[]
  pie: { name: string; value: number }[]
}

export default function RapportsPage() {
  const [annee,   setAnnee]   = useState(CURRENT_YEAR)
  const [periode, setPeriode] = useState(7)

  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ['rapports-stats', annee, periode],
    queryFn: () => api.get('/stats/', { params: { annee, periode } }).then(r => r.data),
  })

  const { data: labos = 0 } = useQuery({ queryKey: ['rp-labos'], queryFn: () => api.get('/laboratoire/?page=1').then(r => r.data.count ?? 0) })
  const { data: hospi = 0 } = useQuery({ queryKey: ['rp-hospi'], queryFn: () => api.get('/hospitalisations/?page=1').then(r => r.data.count ?? 0) })

  const t = stats?.totals

  const STATS = [
    { label: 'Patients',         value: t?.patients      ?? '—', icon: Users,         color: 'bg-blue-500' },
    { label: 'Consultations',    value: t?.consultations  ?? '—', icon: Stethoscope,   color: 'bg-purple-500' },
    { label: 'Rendez-vous',      value: t?.rdv            ?? '—', icon: Calendar,      color: 'bg-green-500' },
    { label: 'Soins',            value: t?.soins          ?? '—', icon: Heart,         color: 'bg-rose-500' },
    { label: 'Ordonnances',      value: t?.ordonnances    ?? '—', icon: ClipboardList, color: 'bg-orange-500' },
    { label: 'Factures',         value: t?.factures       ?? '—', icon: Receipt,       color: 'bg-indigo-500' },
    { label: 'Labo',             value: labos,                    icon: FlaskConical,  color: 'bg-yellow-500' },
    { label: 'Hospitalisations', value: hospi,                    icon: BedDouble,     color: 'bg-red-500' },
  ]

  const pieData = (stats?.pie ?? []).filter(d => d.value > 0)

  const radialData = [
    { name: 'Patients',   value: t?.patients      ?? 0, fill: '#3b82f6' },
    { name: 'Consult.',   value: t?.consultations  ?? 0, fill: '#a855f7' },
    { name: 'Rdv',        value: t?.rdv            ?? 0, fill: '#22c55e' },
    { name: 'Soins',      value: t?.soins          ?? 0, fill: '#f43f5e' },
  ]
  const radialMax  = Math.max(...radialData.map(d => d.value), 1)
  const radialNorm = radialData.map(d => ({ ...d, value: Math.round((d.value / radialMax) * 100) }))

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Chargement des statistiques...</div>
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header + Filtres */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rapports & Statistiques</h1>
          <p className="text-gray-500 text-sm">Vue globale de l'activité de la clinique</p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2 py-1 shadow-sm">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          <span className="text-xs text-gray-500">Année :</span>
          <YearSelect value={annee} onChange={setAnnee} />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-2 text-center">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Graphes ligne 1 — mensuels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">Patients — évolution annuelle</h2>
              <p className="text-xs text-gray-400 mt-0.5">Nouveaux patients par mois — {annee}</p>
            </div>
            <YearSelect value={annee} onChange={setAnnee} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats?.monthly_patients ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="valeur" name="Patients" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gPatients)" dot={{ r: 3, fill: '#3b82f6' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">Patients vs Consultations</h2>
              <p className="text-xs text-gray-400 mt-0.5">Comparaison mensuelle — {annee}</p>
            </div>
            <YearSelect value={annee} onChange={setAnnee} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats?.monthly_compare ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="patients"      name="Patients"      fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="consultations" name="Consultations" fill="#a855f7" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphe activité récente */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">Activité récente — patients</h2>
            <p className="text-xs text-gray-400 mt-0.5">Derniers {periode} jours</p>
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
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={stats?.weekly_patients ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gRecent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="jour" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={periode > 14 ? 3 : 0} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Area type="monotone" dataKey="valeur" name="Patients" stroke="#22c55e" strokeWidth={2.5} fill="url(#gRecent)" dot={periode <= 14 ? { r: 3, fill: '#22c55e' } : false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Graphes ligne 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Répartition de l'activité</h2>
            <p className="text-xs text-gray-400 mt-0.5">Par module — total cumulé</p>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Performance relative</h2>
            <p className="text-xs text-gray-400 mt-0.5">Index sur 100 par rapport au module le plus actif</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart cx="50%" cy="55%" innerRadius={25} outerRadius={95} data={radialNorm} startAngle={180} endAngle={0}>
              <RadialBar dataKey="value" label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(v) => [`${v}%`, '']} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Évolution consultations */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">Consultations — évolution annuelle</h2>
            <p className="text-xs text-gray-400 mt-0.5">Nouvelles consultations par mois — {annee}</p>
          </div>
          <YearSelect value={annee} onChange={setAnnee} />
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={stats?.monthly_consults ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gConsults" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Area type="monotone" dataKey="valeur" name="Consultations" stroke="#a855f7" strokeWidth={2.5} fill="url(#gConsults)" dot={{ r: 3, fill: '#a855f7' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
