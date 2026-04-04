'use client'

import { useAuthStore } from '@/store/auth.store'
import { Users, Calendar, Heart, Stethoscope, TrendingUp, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const STATS = [
  { label: 'Patients',      icon: Users,        value: '—', color: 'text-blue-600',   bg: 'bg-blue-50',   module: 'patients' },
  { label: 'Rendez-vous',   icon: Calendar,     value: '—', color: 'text-green-600',  bg: 'bg-green-50',  module: 'rendez_vous' },
  { label: 'Soins du jour', icon: Heart,        value: '—', color: 'text-rose-600',   bg: 'bg-rose-50',   module: 'soins' },
  { label: 'Consultations', icon: Stethoscope,  value: '—', color: 'text-purple-600', bg: 'bg-purple-50', module: 'consultations' },
]

export default function DashboardPage() {
  const { user, clinic, canAccess } = useAuthStore()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Bonjour, {user?.first_name} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {clinic?.name} — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, icon: Icon, value, color, bg, module }) => {
          if (!canAccess(module)) return null
          return (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
                  </div>
                  <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Modules accessibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user?.modules.map((m) => (
                <span key={m} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium">
                  {user.clinic_modules.find(([code]) => code === m)?.[1] || m}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              Informations du compte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Rôle</span>
              <span className="font-medium text-gray-800">{user?.group}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Permission</span>
              <span className="font-medium text-gray-800">{user?.permission}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Type clinique</span>
              <span className="font-medium text-gray-800">{clinic?.type_display}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
