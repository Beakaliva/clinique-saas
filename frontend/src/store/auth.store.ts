import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Clinic } from '@/types'

interface AuthState {
  user: User | null
  clinic: Clinic | null
  accessToken: string | null
  refreshToken: string | null
  setAuth: (user: User, clinic: Clinic, access: string, refresh: string) => void
  logout: () => void
  canAccess: (module: string) => boolean
  hasPermission: (level: 'C' | 'CR' | 'CRU' | 'CRUD') => boolean
}

const PERMISSION_LEVELS = ['C', 'CR', 'CRU', 'CRUD']

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:         null,
      clinic:       null,
      accessToken:  null,
      refreshToken: null,

      setAuth: (user, clinic, access, refresh) => {
        localStorage.setItem('access_token',  access)
        localStorage.setItem('refresh_token', refresh)
        set({ user, clinic, accessToken: access, refreshToken: refresh })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, clinic: null, accessToken: null, refreshToken: null })
      },

      canAccess: (module) => {
        const { user } = get()
        if (!user) return false
        if (user.is_superuser) return true
        return user.modules.includes(module)
      },

      hasPermission: (level) => {
        const { user } = get()
        if (!user) return false
        if (user.is_superuser) return true
        const userIdx     = PERMISSION_LEVELS.indexOf(user.permission)
        const requiredIdx = PERMISSION_LEVELS.indexOf(level)
        return userIdx >= requiredIdx
      },
    }),
    { name: 'auth-storage' }
  )
)
