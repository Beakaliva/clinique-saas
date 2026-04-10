'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import Sidebar from '@/components/layout/Sidebar'
import { Menu, X } from 'lucide-react'
import { Building2 } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user   = useAuthStore((s) => s.user)
  const clinic = useAuthStore((s) => s.clinic)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!user) router.replace('/auth/login')
  }, [user, router])

  if (!user) return null

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

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
  )
}
