'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { CLINIC_TYPES } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

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

export default function RegisterPage() {
  const router   = useRouter()
  const setAuth  = useAuthStore((s) => s.setAuth)
  const [step, setStep]   = useState<1 | 2>(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const selectedType = watch('clinic_type')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="text-4xl mb-2">🏥</div>
          <CardTitle className="text-2xl font-bold text-gray-800">Créer votre clinique</CardTitle>
          <CardDescription>Inscription — étape {step} / 2</CardDescription>

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`flex items-center gap-1 text-sm font-medium ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
              Votre clinique
            </div>
            <div className={`h-px w-8 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center gap-1 text-sm font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
              Votre compte
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* ── Étape 1 : Clinique ── */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Type de clinique *</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {CLINIC_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setValue('clinic_type', t.value)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          selectedType === t.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <span className="text-2xl">{t.icon}</span>
                        <span className="text-sm font-medium leading-tight">{t.label}</span>
                        {selectedType === t.value && (
                          <CheckCircle2 className="ml-auto h-4 w-4 text-blue-500 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  {errors.clinic_type && <p className="text-red-500 text-xs mt-1">{errors.clinic_type.message}</p>}
                </div>

                <div>
                  <Label htmlFor="clinic_name">Nom de la clinique *</Label>
                  <Input id="clinic_name" placeholder="Ex: Clinique du Soleil" {...register('clinic_name')} />
                  {errors.clinic_name && <p className="text-red-500 text-xs mt-1">{errors.clinic_name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="clinic_telephone">Téléphone</Label>
                    <Input id="clinic_telephone" placeholder="+224 620 000 000" {...register('clinic_telephone')} />
                  </div>
                  <div>
                    <Label htmlFor="clinic_adresse">Adresse</Label>
                    <Input id="clinic_adresse" placeholder="Conakry, Guinée" {...register('clinic_adresse')} />
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    if (!selectedType) { setError('Veuillez choisir un type de clinique.'); return }
                    setError('')
                    setStep(2)
                  }}
                >
                  Continuer →
                </Button>
              </div>
            )}

            {/* ── Étape 2 : Compte admin ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700 font-medium">
                  ✓ {CLINIC_TYPES.find(t => t.value === selectedType)?.label}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="first_name">Prénom *</Label>
                    <Input id="first_name" placeholder="Jean" {...register('first_name')} />
                    {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom *</Label>
                    <Input id="last_name" placeholder="Dupont" {...register('last_name')} />
                    {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="telephone">Téléphone (identifiant) *</Label>
                  <Input id="telephone" placeholder="+224 620 000 000" {...register('telephone')} />
                  {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone.message}</p>}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="admin@clinique.com" {...register('email')} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="password">Mot de passe *</Label>
                    <Input id="password" type="password" placeholder="Min. 8 caractères" {...register('password')} />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="password2">Confirmation *</Label>
                    <Input id="password2" type="password" placeholder="Répéter" {...register('password2')} />
                    {errors.password2 && <p className="text-red-500 text-xs mt-1">{errors.password2.message}</p>}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    ← Retour
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Création...' : 'Créer ma clinique'}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Déjà inscrit ?{' '}
            <a href="/auth/login" className="text-blue-600 hover:underline font-medium">
              Se connecter
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
