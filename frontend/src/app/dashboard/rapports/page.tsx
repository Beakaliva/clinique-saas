'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Receipt, FlaskConical, BedDouble, TrendingUp, BarChart3 } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function RapportsPage() {
  const { data: patients }  = useQuery({ queryKey: ['patients-count'],  queryFn: () => api.get('/patients/?page=1').then(r => r.data.count) })
  const { data: factures }  = useQuery({ queryKey: ['factures-count'],  queryFn: () => api.get('/factures/?page=1').then(r => r.data.count) })
  const { data: labos }     = useQuery({ queryKey: ['labos-count'],     queryFn: () => api.get('/laboratoire/?page=1').then(r => r.data.count) })
  const { data: hospi }     = useQuery({ queryKey: ['hospi-count'],     queryFn: () => api.get('/hospitalisations/?page=1').then(r => r.data.count) })
  const { data: consults }  = useQuery({ queryKey: ['consults-count'],  queryFn: () => api.get('/consultations/?page=1').then(r => r.data.count) })
  const { data: rdv }       = useQuery({ queryKey: ['rdv-count'],       queryFn: () => api.get('/rendez-vous/?page=1').then(r => r.data.count) })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Rapports & Statistiques</h1>
        <p className="text-gray-500 text-sm">Vue globale de l'activité de la clinique</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Patients enregistrés"  value={patients ?? '—'}  icon={Users}       color="bg-blue-500" />
        <StatCard label="Consultations"          value={consults ?? '—'}  icon={TrendingUp}  color="bg-indigo-500" />
        <StatCard label="Rendez-vous"            value={rdv ?? '—'}       icon={BarChart3}   color="bg-purple-500" />
        <StatCard label="Factures"               value={factures ?? '—'}  icon={Receipt}     color="bg-green-500" />
        <StatCard label="Examens laboratoire"    value={labos ?? '—'}     icon={FlaskConical} color="bg-yellow-500" />
        <StatCard label="Hospitalisations"       value={hospi ?? '—'}     icon={BedDouble}   color="bg-red-500" />
      </div>
    </div>
  )
}
