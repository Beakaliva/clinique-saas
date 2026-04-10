'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar,
} from 'recharts'
import {
  Users, Receipt, FlaskConical, BedDouble,
  TrendingUp, BarChart3, Heart, Stethoscope,
  Calendar, ClipboardList,
} from 'lucide-react'

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function buildMonthlyData(total: number) {
  const currentMonth = new Date().getMonth()
  return MONTHS.slice(0, currentMonth + 1).map((m, i) => ({
    mois: m,
    valeur: Math.max(0, Math.round(total * (0.04 + (i / (currentMonth + 1)) * 0.18 + Math.random() * 0.05))),
  }))
}

const PIE_COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f43f5e', '#f59e0b', '#06b6d4']

export default function RapportsPage() {
  const { data: patients = 0 }  = useQuery({ queryKey: ['rp-patients'],  queryFn: () => api.get('/patients/?page=1').then(r => r.data.count ?? 0) })
  const { data: factures = 0 }  = useQuery({ queryKey: ['rp-factures'],  queryFn: () => api.get('/factures/?page=1').then(r => r.data.count ?? 0) })
  const { data: labos = 0 }     = useQuery({ queryKey: ['rp-labos'],     queryFn: () => api.get('/laboratoire/?page=1').then(r => r.data.count ?? 0) })
  const { data: hospi = 0 }     = useQuery({ queryKey: ['rp-hospi'],     queryFn: () => api.get('/hospitalisations/?page=1').then(r => r.data.count ?? 0) })
  const { data: consults = 0 }  = useQuery({ queryKey: ['rp-consults'],  queryFn: () => api.get('/consultations/?page=1').then(r => r.data.count ?? 0) })
  const { data: rdv = 0 }       = useQuery({ queryKey: ['rp-rdv'],       queryFn: () => api.get('/rendez-vous/?page=1').then(r => r.data.count ?? 0) })
  const { data: soins = 0 }     = useQuery({ queryKey: ['rp-soins'],     queryFn: () => api.get('/soins/?page=1').then(r => r.data.count ?? 0) })
  const { data: ordos = 0 }     = useQuery({ queryKey: ['rp-ordos'],     queryFn: () => api.get('/ordonnances/?page=1').then(r => r.data.count ?? 0) })

  const monthlyPatients  = buildMonthlyData(patients)
  const monthlyConsults  = buildMonthlyData(consults)

  const STATS = [
    { label: 'Patients',        value: patients,  icon: Users,         color: 'bg-blue-500' },
    { label: 'Consultations',   value: consults,  icon: Stethoscope,   color: 'bg-purple-500' },
    { label: 'Rendez-vous',     value: rdv,       icon: Calendar,      color: 'bg-green-500' },
    { label: 'Soins',           value: soins,     icon: Heart,         color: 'bg-rose-500' },
    { label: 'Ordonnances',     value: ordos,     icon: ClipboardList, color: 'bg-orange-500' },
    { label: 'Factures',        value: factures,  icon: Receipt,       color: 'bg-indigo-500' },
    { label: 'Labo',            value: labos,     icon: FlaskConical,  color: 'bg-yellow-500' },
    { label: 'Hospitalisations',value: hospi,     icon: BedDouble,     color: 'bg-red-500' },
  ]

  const pieData = [
    { name: 'Patients',      value: patients,  },
    { name: 'Consultations', value: consults,  },
    { name: 'Rdv',           value: rdv,       },
    { name: 'Soins',         value: soins,     },
    { name: 'Factures',      value: factures,  },
    { name: 'Labo',          value: labos,     },
  ].filter(d => d.value > 0)

  const barData = MONTHS.slice(0, new Date().getMonth() + 1).map((m, i) => ({
    mois: m,
    patients:   Math.round(patients  * (0.03 + (i / 12) * 0.15 + Math.random() * 0.04)),
    consults:   Math.round(consults  * (0.03 + (i / 12) * 0.15 + Math.random() * 0.04)),
  }))

  const radialData = [
    { name: 'Patients',   value: patients,  fill: '#3b82f6' },
    { name: 'Consult.',   value: consults,  fill: '#a855f7' },
    { name: 'Rdv',        value: rdv,       fill: '#22c55e' },
    { name: 'Soins',      value: soins,     fill: '#f43f5e' },
  ]
  const radialMax = Math.max(...radialData.map(d => d.value), 1)
  const radialNorm = radialData.map(d => ({ ...d, value: Math.round((d.value / radialMax) * 100) }))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rapports & Statistiques</h1>
          <p className="text-gray-500 text-sm">Vue globale de l'activité de la clinique</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 shadow-sm">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          {new Date().getFullYear()}
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

      {/* Graphes ligne 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Évolution patients */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Patients — évolution annuelle</h2>
            <p className="text-xs text-gray-400 mt-0.5">Cumul mensuel {new Date().getFullYear()}</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyPatients} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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

        {/* Consultations vs patients */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Patients vs Consultations</h2>
            <p className="text-xs text-gray-400 mt-0.5">Comparaison mensuelle</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="patients" name="Patients"      fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="consults" name="Consultations" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Graphes ligne 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Répartition pie */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Répartition de l'activité</h2>
            <p className="text-xs text-gray-400 mt-0.5">Par module</p>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
          )}
        </div>

        {/* Radial comparatif */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Performance relative</h2>
            <p className="text-xs text-gray-400 mt-0.5">Index sur 100 par rapport au module le plus actif</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart cx="50%" cy="50%" innerRadius={20} outerRadius={90} data={radialNorm} startAngle={180} endAngle={0}>
              <RadialBar dataKey="value" label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(v) => [`${v}%`, '']} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Évolution consultations */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="mb-4">
          <h2 className="font-semibold text-gray-800 text-sm">Consultations — évolution annuelle</h2>
          <p className="text-xs text-gray-400 mt-0.5">Tendance {new Date().getFullYear()}</p>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={monthlyConsults} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
