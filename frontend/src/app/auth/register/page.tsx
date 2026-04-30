'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { CLINIC_TYPES } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  AlertCircle, CheckCircle2, Eye, EyeOff, Activity,
  Phone, Lock, User, Mail, Building2, MapPin, ArrowRight, ArrowLeft,
} from 'lucide-react'

const schema = z.object({
  clinic_name:      z.string().min(2, 'Nom requis'),
  clinic_type:      z.string().min(1, 'Type requis'),
  clinic_telephone: z.string().optional(),
  clinic_adresse:   z.string().optional(),
  first_name:  z.string().min(2, 'Prénom requis'),
  last_name:   z.string().min(2, 'Nom requis'),
  telephone:   z.string().min(8, 'Téléphone invalide'),
  email:       z.string().email('Email invalide').optional().or(z.literal('')),
  password:    z.string().min(8, 'Minimum 8 caractères'),
  password2:   z.string(),
}).refine((d) => d.password === d.password2, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password2'],
})

type FormData = z.infer<typeof schema>

const STEPS = [
  { n: 1, label: 'Votre clinique' },
  { n: 2, label: 'Votre compte' },
]

export default function RegisterPage() {
  const router  = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [step,    setStep]    = useState<1 | 2>(1)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)
  const [showPwd2, setShowPwd2] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const selectedType = watch('clinic_type')

  const onSubmit = async (data: FormData) => {
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/register/', data)
      const { access, refresh, user, clinic } = res.data
      setAuth(user, clinic, access, refresh)
      router.push('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } }
      const msg = Object.values(e.response?.data || {}).flat().join(' ')
      setError(msg || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const goNext = () => {
    if (!selectedType) { setError('Veuillez choisir un type de clinique.'); return }
    setError(''); setStep(2)
  }

  const selectedClinicType = CLINIC_TYPES.find(t => t.value === selectedType)

  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche — branding ── */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 relative overflow-hidden flex-col justify-between p-12">

        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute top-1/3 right-4 w-48 h-48 bg-white/5 rounded-full" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">ClinicPro</span>
          </div>
        </div>

        {/* Contenu */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white leading-tight">
              Lancez votre clinique<br />
              <span className="text-blue-200">en quelques minutes</span>
            </h1>
            <p className="text-blue-100 mt-4 text-sm leading-relaxed">
              Créez votre espace médical digital et commencez à gérer vos patients dès aujourd'hui.
            </p>
          </div>

          {/* Indicateur d'étapes dans le panneau gauche */}
          <div className="space-y-3">
            {STEPS.map(s => (
              <div key={s.n} className={`flex items-center gap-3 transition-all ${step === s.n ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                  step > s.n
                    ? 'bg-green-400 text-white'
                    : step === s.n
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white'
                }`}>
                  {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{s.label}</p>
                  {step === s.n && (
                    <p className="text-blue-200 text-xs">Étape en cours</p>
                  )}
                  {step > s.n && (
                    <p className="text-green-300 text-xs">Complété</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-blue-200 text-xs">
            © {new Date().getFullYear()} ClinicPro — Système de gestion médicale
          </p>
        </div>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-lg py-8">

          {/* Header mobile */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gray-800 text-lg">ClinicPro</span>
          </div>

          {/* Indicateur d'étapes mobile */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step > s.n ? 'bg-green-500 text-white' : step === s.n ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span className={`text-xs font-medium ${step >= s.n ? 'text-gray-700' : 'text-gray-400'}`}>{s.label}</span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px ${step > s.n ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Titre de l'étape */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 1 ? 'Votre clinique' : 'Votre compte administrateur'}
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              {step === 1
                ? 'Commencez par configurer les informations de votre établissement'
                : 'Créez votre identifiant de connexion pour accéder à la plateforme'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* ── Étape 1 : Clinique ── */}
            {step === 1 && (
              <div className="space-y-5">

                {/* Type de clinique */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Type d'établissement *</Label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {CLINIC_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => { setValue('clinic_type', t.value); setError('') }}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                          selectedType === t.value
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xl shrink-0">{t.icon}</span>
                        <span className={`text-xs font-semibold leading-tight ${
                          selectedType === t.value ? 'text-blue-700' : 'text-gray-600'
                        }`}>{t.label}</span>
                        {selectedType === t.value && (
                          <CheckCircle2 className="ml-auto h-4 w-4 text-blue-500 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  {errors.clinic_type && <p className="text-red-500 text-xs">{errors.clinic_type.message}</p>}
                </div>

                {/* Nom clinique */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Nom de la clinique *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Ex: Clinique du Soleil"
                      className="pl-10 h-11 bg-white border-gray-200"
                      {...register('clinic_name')}
                    />
                  </div>
                  {errors.clinic_name && <p className="text-red-500 text-xs">{errors.clinic_name.message}</p>}
                </div>

                {/* Téléphone + Adresse */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="+224 620 000 000" className="pl-10 h-11 bg-white border-gray-200" {...register('clinic_telephone')} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Adresse</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="Conakry, Guinée" className="pl-10 h-11 bg-white border-gray-200" {...register('clinic_adresse')} />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />{error}
                  </div>
                )}

                <Button type="button" onClick={goNext} className="w-full h-11 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium">
                  Continuer <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* ── Étape 2 : Compte admin ── */}
            {step === 2 && (
              <div className="space-y-5">

                {/* Résumé clinique */}
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <span className="text-2xl">{selectedClinicType?.icon}</span>
                  <div>
                    <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">Établissement sélectionné</p>
                    <p className="text-sm font-semibold text-blue-800">{selectedClinicType?.label}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="ml-auto text-xs text-blue-500 hover:text-blue-700 font-medium underline"
                  >
                    Modifier
                  </button>
                </div>

                {/* Prénom + Nom */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Prénom *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="Jean" className="pl-10 h-11 bg-white border-gray-200" {...register('first_name')} />
                    </div>
                    {errors.first_name && <p className="text-red-500 text-xs">{errors.first_name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Nom *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="Dupont" className="pl-10 h-11 bg-white border-gray-200" {...register('last_name')} />
                    </div>
                    {errors.last_name && <p className="text-red-500 text-xs">{errors.last_name.message}</p>}
                  </div>
                </div>

                {/* Téléphone */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Téléphone <span className="text-gray-400 font-normal">(identifiant de connexion)</span> *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="+224 620 000 000" className="pl-10 h-11 bg-white border-gray-200" {...register('telephone')} />
                  </div>
                  {errors.telephone && <p className="text-red-500 text-xs">{errors.telephone.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Email <span className="text-gray-400 font-normal">(optionnel)</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input type="email" placeholder="admin@clinique.com" className="pl-10 h-11 bg-white border-gray-200" {...register('email')} />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>

                {/* Mots de passe */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Mot de passe *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type={showPwd ? 'text' : 'password'}
                        placeholder="Min. 8 caractères"
                        className="pl-10 pr-10 h-11 bg-white border-gray-200"
                        {...register('password')}
                      />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Confirmation *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type={showPwd2 ? 'text' : 'password'}
                        placeholder="Répéter"
                        className="pl-10 pr-10 h-11 bg-white border-gray-200"
                        {...register('password2')}
                      />
                      <button type="button" onClick={() => setShowPwd2(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPwd2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password2 && <p className="text-red-500 text-xs">{errors.password2.message}</p>}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />{error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}
                    className="h-11 px-5 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Création en cours...
                      </span>
                    ) : 'Créer ma clinique'}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà inscrit ?{' '}
            <a href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
