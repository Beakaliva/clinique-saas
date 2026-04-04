'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import {
  LayoutDashboard, Users, Calendar, Stethoscope,
  Heart, LogOut, Building2, ChevronRight, FolderOpen,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',               label: 'Tableau de bord',  icon: LayoutDashboard, module: null },
  { href: '/dashboard/patients',      label: 'Patients',          icon: Users,           module: 'patients' },
  { href: '/dashboard/dossiers',      label: 'Dossiers',          icon: FolderOpen,      module: 'dossiers' },
  { href: '/dashboard/rendez-vous',   label: 'Rendez-vous',       icon: Calendar,        module: 'rendez_vous' },
  { href: '/dashboard/consultations', label: 'Consultations',     icon: Stethoscope,     module: 'consultations' },
  { href: '/dashboard/soins',         label: 'Soins',             icon: Heart,           module: 'soins' },
]

export default function Sidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const { user, clinic, logout, canAccess } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-sm text-gray-800 truncate">{clinic?.name}</p>
            <p className="text-xs text-gray-400 truncate">{clinic?.type_display}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, module }) => {
          if (module && !canAccess(module)) return null
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-3 w-3 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 mb-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.group}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
