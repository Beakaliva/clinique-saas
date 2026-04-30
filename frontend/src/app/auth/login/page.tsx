'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AlertCircle, Eye, EyeOff, Phone, Lock, Activity, Shield, Users, BarChart3 } from 'lucide-react'

interface FormData { telephone: string; password: string }

const FEATURES = [
  { icon: Users,     text: 'Gestion complète des patients' },
  { icon: Activity,  text: 'Consultations & soins en temps réel' },
  { icon: BarChart3, text: 'Statistiques & rapports détaillés' },
  { icon: Shield,    text: 'Données sécurisées & confidentielles' },
]

export default function LoginPage() {
  const router  = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const { register, handleSubmit } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/login/', data)
      const { access, refresh, user } = res.data
      setAuth(user, user.clinic, access, refresh)
      router.push('/dashboard')
    } catch {
      setError('Téléphone ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche — branding ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 relative overflow-hidden flex-col justify-between p-12">

        {/* Cercles décoratifs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 right-8 w-48 h-48 bg-white/5 rounded-full" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">ClinicPro</span>
          </div>
        </div>

        {/* Contenu central */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Gérez votre clinique<br />
              <span className="text-blue-200">avec efficacité</span>
            </h1>
            <p className="text-blue-100 mt-4 text-base leading-relaxed">
              Une plateforme complète pour digitaliser votre établissement médical et améliorer la qualité des soins.
            </p>
          </div>

          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-blue-50 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-blue-200 text-xs">
            © {new Date().getFullYear()} ClinicPro — Système de gestion médicale
          </p>
        </div>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">

          {/* Header mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gray-800 text-lg">ClinicPro</span>
          </div>

          {/* Titre */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Bon retour 👋</h2>
            <p className="text-gray-500 mt-1 text-sm">Connectez-vous à votre espace clinique</p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <div className="space-y-1.5">
              <Label htmlFor="telephone" className="text-sm font-medium text-gray-700">
                Téléphone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="telephone"
                  placeholder="+224 620 000 000"
                  className="pl-10 h-11 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  {...register('telephone', { required: true })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  {...register('password', { required: true })}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion en cours...
                </span>
              ) : 'Se connecter'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <p className="text-center text-sm text-gray-500">
            Pas encore de compte ?{' '}
            <a href="/auth/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Créer ma clinique
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
