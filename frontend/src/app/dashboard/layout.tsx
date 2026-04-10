'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import Sidebar from '@/components/layout/Sidebar'
import { Menu } from 'lucide-react'
import { Building2, ShieldAlert, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user              = useAuthStore((s) => s.user)
  const clinic            = useAuthStore((s) => s.clinic)
  const superAdminSnapshot = useAuthStore((s) => s.superAdminSnapshot)
  const exitImpersonation = useAuthStore((s) => s.exitImpersonation)
  const setUser           = useAuthStore((s) => s.setUser)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!user) { router.replace('/auth/login'); return }
    // Rafraîchit les données user (modules, permissions) depuis le serveur
    api.get('/auth/me/').then(r => setUser(r.data)).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">

      {/* Bannière impersonation */}
      {superAdminSnapshot && (
        <div className="bg-orange-500 text-white text-sm px-4 py-2 flex items-center justify-between shrink-0 z-50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>Mode impersonation — vous consultez <strong>{clinic?.name}</strong> en tant que {user.full_name}</span>
          </div>
          <button
            onClick={() => { exitImpersonation(); router.push('/superadmin') }}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors text-xs font-medium">
            <ArrowLeft className="h-3.5 w-3.5" /> Quitter
          </button>
        </div>
      )}

    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200
        lg:relative lg:translate-x-0 lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Header mobile / tablette */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <p className="font-semibold text-sm text-gray-800 truncate">{clinic?.name}</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
    </div>
  )
}
