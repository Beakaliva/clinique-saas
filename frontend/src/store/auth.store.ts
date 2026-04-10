import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Clinic } from '@/types'

interface AuthState {
  user: User | null
  clinic: Clinic | null
  accessToken: string | null
  refreshToken: string | null
  // Impersonation superadmin
  superAdminSnapshot: { user: User; clinic: Clinic; accessToken: string; refreshToken: string } | null
  setAuth: (user: User, clinic: Clinic, access: string, refresh: string) => void
  setUser: (user: User) => void
  setClinic: (clinic: Clinic) => void
  impersonate: (user: User, access: string, refresh: string) => void
  exitImpersonation: () => void
  logout: () => void
  canAccess: (module: string) => boolean
  hasPermission: (action: 'C' | 'R' | 'U' | 'D') => boolean
}

// Gardé pour compatibilité mais hasPermission utilise includes()
const PERMISSION_LEVELS = ['R', 'C', 'CR', 'CRU', 'CRUD']

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:                null,
      clinic:              null,
      accessToken:         null,
      refreshToken:        null,
      superAdminSnapshot:  null,

      setAuth: (user, clinic, access, refresh) => {
        localStorage.setItem('access_token',  access)
        localStorage.setItem('refresh_token', refresh)
        set({ user, clinic, accessToken: access, refreshToken: refresh })
      },

      setUser:   (user)   => set({ user }),
      setClinic: (clinic) => set({ clinic }),

      impersonate: (user, access, refresh) => {
        const { user: curUser, clinic: curClinic, accessToken: curAccess, refreshToken: curRefresh } = get()
        localStorage.setItem('access_token',  access)
        localStorage.setItem('refresh_token', refresh)
        set({
          superAdminSnapshot: { user: curUser!, clinic: curClinic!, accessToken: curAccess!, refreshToken: curRefresh! },
          user,
          clinic: user.clinic as unknown as import('@/types').Clinic,
          accessToken: access,
          refreshToken: refresh,
        })
      },

      exitImpersonation: () => {
        const snap = get().superAdminSnapshot
        if (!snap) return
        localStorage.setItem('access_token',  snap.accessToken)
        localStorage.setItem('refresh_token', snap.refreshToken)
        set({ user: snap.user, clinic: snap.clinic, accessToken: snap.accessToken, refreshToken: snap.refreshToken, superAdminSnapshot: null })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, clinic: null, accessToken: null, refreshToken: null, superAdminSnapshot: null })
      },

      canAccess: (module) => {
        const { user } = get()
        if (!user) return false
        if (user.is_superuser) return true
        return user.modules.includes(module)
      },

      // Vérifie si l'utilisateur possède une action : 'C'=créer, 'R'=lire, 'U'=modifier, 'D'=supprimer
      // La permission est une chaîne de lettres ex: "CR", "CRUD", "R"
      hasPermission: (action) => {
        const { user } = get()
        if (!user) return false
        if (user.is_superuser) return true
        return (user.permission ?? '').includes(action)
      },
    }),
    { name: 'auth-storage' }
  )
)
