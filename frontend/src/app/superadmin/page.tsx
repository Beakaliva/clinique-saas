'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import type { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Building2, Users, User as UserIcon, Activity, CheckCircle2, XCircle,
  Pencil, LogIn, ArrowLeft, Phone, Mail, MapPin, Search,
  ShieldAlert, Plus, CreditCard, Zap, Clock, Ban, RefreshCw, Trash2, AlertTriangle,
} from 'lucide-react'
import { mediaUrl } from '@/lib/media'

interface ClinicStat {
  id: number; name: string; type: string; type_display: string
  telephone: string; email: string; adresse: string; slug: string
  logo: string | null
  is_active: boolean; created_at: string
  users_count: number; patients_count: number
  // Trial
  trial_ends_at: string | null; is_subscribed: boolean
  subscribed_plan: string; trial_active: boolean
  trial_days_left: number; has_access: boolean
}
interface ClinicEditForm { name: string; telephone: string; email: string; adresse: string; is_active: boolean }
interface ClinicCreateForm {
  clinic_name: string; clinic_type: string
  clinic_telephone: string; clinic_email: string; clinic_adresse: string
  first_name: string; last_name: string; telephone: string; email: string
  password: string; password2: string; logo?: FileList
}

const CLINIC_TYPES = [
  { value: 'generale',      label: 'Clinique générale / Polyclinique' },
  { value: 'dentaire',      label: 'Clinique dentaire' },
  { value: 'pediatrique',   label: 'Clinique pédiatrique' },
  { value: 'ophtalmologie', label: 'Clinique ophtalmologique' },
  { value: 'maternite',     label: 'Maternité' },
  { value: 'psychiatrie',   label: 'Clinique psychiatrique' },
]

const PLANS = [
  { value: 'starter',  label: 'Starter — 150 000 GNF/mois' },
  { value: 'pro',      label: 'Pro — 350 000 GNF/mois' },
  { value: 'hopital',  label: 'Hôpital — Sur devis' },
]

const TYPE_COLORS: Record<string, string> = {
  generale:      'bg-blue-50 text-blue-700',
  dentaire:      'bg-cyan-50 text-cyan-700',
  pediatrique:   'bg-pink-50 text-pink-700',
  ophtalmologie: 'bg-violet-50 text-violet-700',
  maternite:     'bg-rose-50 text-rose-700',
  psychiatrie:   'bg-orange-50 text-orange-700',
}

function TrialBadge({ c }: { c: ClinicStat }) {
  if (c.is_subscribed) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700">
        <CreditCard className="h-3 w-3" />
        {c.subscribed_plan ? c.subscribed_plan.charAt(0).toUpperCase() + c.subscribed_plan.slice(1) : 'Abonné'}
      </span>
    )
  }
  if (c.trial_active) {
    const urgent = c.trial_days_left <= 3
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${urgent ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
        <Clock className="h-3 w-3" />
        {c.trial_days_left}j restants
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-600">
      <Ban className="h-3 w-3" /> Expiré
    </span>
  )
}

export default function SuperAdminPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const { user: me, impersonate, superAdminSnapshot, exitImpersonation } = useAuthStore()

  const [search, setSearch]           = useState('')
  const [editClinic, setEditClinic]   = useState<ClinicStat | null>(null)
  const [viewUsers, setViewUsers]     = useState<ClinicStat | null>(null)
  const [openCreate, setOpenCreate]   = useState(false)
  const [subClinic, setSubClinic]     = useState<ClinicStat | null>(null)
  const [deleteClinic, setDeleteClinic] = useState<ClinicStat | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [subAction, setSubAction]     = useState<'activate' | 'deactivate' | 'extend_trial'>('activate')
  const [subPlan, setSubPlan]         = useState('pro')
  const [extendDays, setExtendDays]   = useState(30)

  // ── Queries ──────────────────────────────────────────────────────────
  const { data: clinics = [], isLoading } = useQuery({
    queryKey: ['sa-clinics'],
    queryFn: () => api.get<ClinicStat[]>('/superadmin/clinics/').then(r => r.data),
  })

  const { data: clinicUsers = [] } = useQuery({
    queryKey: ['sa-clinic-users', viewUsers?.id],
    queryFn: () => api.get<User[]>(`/superadmin/clinics/${viewUsers!.id}/users/`).then(r => r.data),
    enabled: !!viewUsers,
  })

  // ── Mutations ─────────────────────────────────────────────────────────
  const editForm   = useForm<ClinicEditForm>()
  const createForm = useForm<ClinicCreateForm>({ defaultValues: { clinic_type: 'generale' } })

  const updateClinic = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClinicEditForm }) =>
      api.patch(`/superadmin/clinics/${id}/`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-clinics'] }); setEditClinic(null) },
  })

  const createClinic = useMutation({
    mutationFn: async (data: ClinicCreateForm) => {
      const res = await api.post('/auth/register/', {
        clinic_name: data.clinic_name, clinic_type: data.clinic_type,
        clinic_telephone: data.clinic_telephone, clinic_email: data.clinic_email,
        clinic_adresse: data.clinic_adresse,
        first_name: data.first_name, last_name: data.last_name,
        telephone: data.telephone, email: data.email,
        password: data.password, password2: data.password2,
      })
      // Si un logo est fourni, on le PATCH sur la clinique créée
      if (data.logo && data.logo.length > 0) {
        const form = new FormData()
        form.append('logo', data.logo[0])
        await api.patch(`/superadmin/clinics/${res.data.clinic.id}/`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-clinics'] })
      setOpenCreate(false)
      createForm.reset({ clinic_type: 'generale' })
    },
  })

  const impersonateMutation = useMutation({
    mutationFn: (clinic_id: number) =>
      api.post<{ access: string; refresh: string; user: User }>('/superadmin/impersonate/', { clinic_id }).then(r => r.data),
    onSuccess: (data) => {
      impersonate(data.user, data.access, data.refresh)
      router.push('/dashboard')
    },
  })

  const deleteClinicMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/superadmin/clinics/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-clinics'] })
      setDeleteClinic(null)
      setDeleteConfirm('')
    },
  })

  const subscriptionMutation = useMutation({
    mutationFn: ({ id, action, plan, days }: { id: number; action: string; plan?: string; days?: number }) =>
      api.post(`/superadmin/clinics/${id}/subscription/`, { action, plan, days }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-clinics'] })
      setSubClinic(null)
    },
  })

  const openEdit = (c: ClinicStat) => {
    setEditClinic(c)
    editForm.reset({ name: c.name, telephone: c.telephone, email: c.email, adresse: c.adresse, is_active: c.is_active })
  }

  const openSubscription = (c: ClinicStat) => {
    setSubClinic(c)
    setSubAction(c.is_subscribed ? 'extend_trial' : 'activate')
    setSubPlan(c.subscribed_plan || 'pro')
    setExtendDays(30)
  }

  const filtered = clinics.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.type_display.toLowerCase().includes(search.toLowerCase())
  )

  const totalClinics   = clinics.length
  const activeClinics  = clinics.filter(c => c.is_active).length
  const subscribedCount = clinics.filter(c => c.is_subscribed).length
  const trialCount     = clinics.filter(c => c.trial_active && !c.is_subscribed).length
  const totalUsers     = clinics.reduce((s, c) => s + c.users_count, 0)
  const totalPatients  = clinics.reduce((s, c) => s + c.patients_count, 0)

  if (me && !me.is_superuser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <ShieldAlert className="h-12 w-12 text-red-400 mx-auto" />
          <p className="text-gray-600 font-medium">Accès réservé aux superutilisateurs.</p>
          <Button onClick={() => router.push('/dashboard')}>Retour au dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Dialog créer clinique ── */}
      <Dialog open={openCreate} onOpenChange={v => { if (!v) { setOpenCreate(false); createForm.reset({ clinic_type: 'generale' }) } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Créer une nouvelle clinique</DialogTitle></DialogHeader>
          <form onSubmit={createForm.handleSubmit(d => createClinic.mutate(d))} className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Informations de la clinique</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Nom de la clinique *</Label><Input {...createForm.register('clinic_name', { required: true })} placeholder="Ex: Clinique Al Shifa" /></div>
                <div className="col-span-2">
                  <Label>Type de clinique *</Label>
                  <select {...createForm.register('clinic_type', { required: true })} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                    {CLINIC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div><Label>Téléphone</Label><Input {...createForm.register('clinic_telephone')} /></div>
                <div><Label>Email</Label><Input type="email" {...createForm.register('clinic_email')} /></div>
                <div className="col-span-2"><Label>Adresse</Label><Input {...createForm.register('clinic_adresse')} /></div>
                <div className="col-span-2">
                  <Label>Logo <span className="text-gray-400 font-normal">(optionnel)</span></Label>
                  <Input type="file" accept="image/*" {...createForm.register('logo')} className="text-sm mt-1" />
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Administrateur</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Prénom *</Label><Input {...createForm.register('first_name', { required: true })} /></div>
                <div><Label>Nom *</Label><Input {...createForm.register('last_name', { required: true })} /></div>
                <div><Label>Téléphone *</Label><Input {...createForm.register('telephone', { required: true })} /></div>
                <div><Label>Email</Label><Input type="email" {...createForm.register('email')} /></div>
                <div><Label>Mot de passe *</Label><Input type="password" {...createForm.register('password', { required: true, minLength: 8 })} /></div>
                <div><Label>Confirmer *</Label><Input type="password" {...createForm.register('password2', { required: true })} /></div>
              </div>
            </div>
            {createClinic.isError && <p className="text-xs text-red-500">Erreur lors de la création.</p>}
            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => { setOpenCreate(false); createForm.reset({ clinic_type: 'generale' }) }}>Annuler</Button>
              <Button type="submit" disabled={createClinic.isPending}>{createClinic.isPending ? 'Création...' : 'Créer la clinique'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog modifier clinique ── */}
      <Dialog open={!!editClinic} onOpenChange={v => { if (!v) setEditClinic(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Modifier — {editClinic?.name}</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit(d => updateClinic.mutate({ id: editClinic!.id, data: d }))} className="space-y-4">
            <div><Label>Nom *</Label><Input {...editForm.register('name', { required: true })} /></div>
            <div><Label>Téléphone</Label><Input {...editForm.register('telephone')} /></div>
            <div><Label>Email</Label><Input type="email" {...editForm.register('email')} /></div>
            <div><Label>Adresse</Label><Input {...editForm.register('adresse')} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="chk_active" {...editForm.register('is_active')} className="h-4 w-4" />
              <label htmlFor="chk_active" className="text-sm text-gray-700">Clinique active</label>
            </div>
            {updateClinic.isError && <p className="text-xs text-red-500">Erreur lors de la mise à jour.</p>}
            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setEditClinic(null)}>Annuler</Button>
              <Button type="submit" disabled={updateClinic.isPending}>{updateClinic.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog utilisateurs ── */}
      <Dialog open={!!viewUsers} onOpenChange={v => { if (!v) setViewUsers(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Utilisateurs — {viewUsers?.name}</DialogTitle></DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Nom', 'Téléphone', 'Groupe', 'Permission', 'Statut'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-2">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clinicUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 font-medium text-gray-800">{u.full_name}</td>
                    <td className="px-3 py-2 text-gray-600">{u.telephone}</td>
                    <td className="px-3 py-2"><span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700">{u.group}</span></td>
                    <td className="px-3 py-2"><span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">{u.permission}</span></td>
                    <td className="px-3 py-2">
                      {u.is_active
                        ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3 w-3" /> Actif</span>
                        : <span className="flex items-center gap-1 text-xs text-red-500"><XCircle className="h-3 w-3" /> Inactif</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog gestion abonnement ── */}
      <Dialog open={!!subClinic} onOpenChange={v => { if (!v) setSubClinic(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              Abonnement — {subClinic?.name}
            </DialogTitle>
          </DialogHeader>

          {subClinic && (
            <div className="space-y-4">
              {/* Statut actuel */}
              <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Statut actuel</span>
                  <TrialBadge c={subClinic} />
                </div>
                {subClinic.trial_ends_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Fin de trial</span>
                    <span className="font-medium text-gray-700">
                      {new Date(subClinic.trial_ends_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
                {subClinic.is_subscribed && subClinic.subscribed_plan && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Plan souscrit</span>
                    <span className="font-semibold text-blue-700 capitalize">{subClinic.subscribed_plan}</span>
                  </div>
                )}
              </div>

              {/* Choisir l'action */}
              <div className="space-y-2">
                <Label>Action</Label>
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${subAction === 'activate' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="subAction" value="activate" checked={subAction === 'activate'} onChange={() => setSubAction('activate')} className="sr-only" />
                    <Zap className={`h-4 w-4 ${subAction === 'activate' ? 'text-green-600' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Activer l'abonnement</p>
                      <p className="text-xs text-gray-500">Le client a payé, accès illimité</p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${subAction === 'extend_trial' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="subAction" value="extend_trial" checked={subAction === 'extend_trial'} onChange={() => setSubAction('extend_trial')} className="sr-only" />
                    <RefreshCw className={`h-4 w-4 ${subAction === 'extend_trial' ? 'text-amber-600' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Prolonger le trial</p>
                      <p className="text-xs text-gray-500">Donner plus de temps d'essai</p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${subAction === 'deactivate' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="subAction" value="deactivate" checked={subAction === 'deactivate'} onChange={() => setSubAction('deactivate')} className="sr-only" />
                    <Ban className={`h-4 w-4 ${subAction === 'deactivate' ? 'text-red-600' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Désactiver l'abonnement</p>
                      <p className="text-xs text-gray-500">Rétrograder vers trial/expiré</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Options selon l'action */}
              {subAction === 'activate' && (
                <div>
                  <Label>Plan</Label>
                  <select value={subPlan} onChange={e => setSubPlan(e.target.value)}
                    className="w-full h-9 px-3 mt-1 rounded-md border border-gray-200 bg-white text-sm">
                    {PLANS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              )}

              {subAction === 'extend_trial' && (
                <div>
                  <Label>Nombre de jours à ajouter</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {[7, 14, 30, 60].map(d => (
                      <button key={d} type="button"
                        onClick={() => setExtendDays(d)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${extendDays === d ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-gray-200 text-gray-600 hover:border-amber-300'}`}>
                        {d}j
                      </button>
                    ))}
                    <Input type="number" min={1} max={365} value={extendDays}
                      onChange={e => setExtendDays(Number(e.target.value))}
                      className="w-20 h-8 text-sm" />
                  </div>
                </div>
              )}

              {subscriptionMutation.isError && (
                <p className="text-xs text-red-500">Erreur lors de l'opération.</p>
              )}

              <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setSubClinic(null)}>Annuler</Button>
                <Button
                  disabled={subscriptionMutation.isPending}
                  onClick={() => subscriptionMutation.mutate({
                    id: subClinic.id,
                    action: subAction,
                    plan: subAction === 'activate' ? subPlan : undefined,
                    days: subAction === 'extend_trial' ? extendDays : undefined,
                  })}
                  className={subAction === 'deactivate' ? 'bg-red-600 hover:bg-red-700' : subAction === 'extend_trial' ? 'bg-amber-500 hover:bg-amber-600' : ''}>
                  {subscriptionMutation.isPending ? 'Enregistrement...' : (
                    subAction === 'activate' ? 'Activer l\'abonnement' :
                    subAction === 'extend_trial' ? `Prolonger de ${extendDays} jours` :
                    'Désactiver l\'abonnement'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog suppression clinique ── */}
      <Dialog open={!!deleteClinic} onOpenChange={v => { if (!v) { setDeleteClinic(null); setDeleteConfirm('') } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Supprimer la clinique
            </DialogTitle>
          </DialogHeader>
          {deleteClinic && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 text-sm text-red-800">
                <p className="font-semibold">Cette action est irréversible.</p>
                <p>Toutes les données associées à <strong>{deleteClinic.name}</strong> seront supprimées définitivement :</p>
                <ul className="list-disc list-inside space-y-0.5 text-red-700">
                  <li>{deleteClinic.users_count} utilisateur{deleteClinic.users_count > 1 ? 's' : ''}</li>
                  <li>{deleteClinic.patients_count} patient{deleteClinic.patients_count > 1 ? 's' : ''}</li>
                  <li>Consultations, rendez-vous, soins, factures, ordonnances...</li>
                </ul>
              </div>
              <div>
                <Label className="text-sm text-gray-700">
                  Tapez <strong className="text-red-600">{deleteClinic.name}</strong> pour confirmer
                </Label>
                <Input
                  className="mt-1"
                  placeholder={deleteClinic.name}
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                />
              </div>
              {deleteClinicMutation.isError && (
                <p className="text-xs text-red-500">Erreur lors de la suppression.</p>
              )}
              <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => { setDeleteClinic(null); setDeleteConfirm('') }}>Annuler</Button>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleteConfirm !== deleteClinic.name || deleteClinicMutation.isPending}
                  onClick={() => deleteClinicMutation.mutate(deleteClinic.id)}>
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  {deleteClinicMutation.isPending ? 'Suppression...' : 'Supprimer définitivement'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Super Admin</h1>
            <p className="text-xs text-gray-500">Gestion globale de toutes les cliniques</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {superAdminSnapshot && (
            <Button variant="outline" size="sm" onClick={() => { exitImpersonation(); router.push('/superadmin') }}
              className="flex items-center gap-1 text-orange-600 border-orange-200 hover:bg-orange-50">
              <ArrowLeft className="h-3.5 w-3.5" /> Quitter l'impersonation
            </Button>
          )}
          <Button size="sm" onClick={() => setOpenCreate(true)} className="flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" /> Nouvelle clinique
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')} className="flex items-center gap-1">
            <LogIn className="h-3.5 w-3.5" /> Mon dashboard
          </Button>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UserIcon className="h-4 w-4 text-gray-400" />
            {me?.full_name}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Stats globales */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { label: 'Cliniques',    value: totalClinics,    icon: Building2,    color: 'bg-blue-50 text-blue-600' },
            { label: 'Actives',      value: activeClinics,   icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
            { label: 'Abonnées',     value: subscribedCount, icon: CreditCard,   color: 'bg-emerald-50 text-emerald-600' },
            { label: 'En trial',     value: trialCount,      icon: Clock,        color: 'bg-amber-50 text-amber-600' },
            { label: 'Utilisateurs', value: totalUsers,      icon: Users,        color: 'bg-purple-50 text-purple-600' },
            { label: 'Patients',     value: totalPatients,   icon: Activity,     color: 'bg-rose-50 text-rose-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tableau cliniques */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-gray-800">Toutes les cliniques</h2>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-8 h-8 text-sm" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-gray-400">Chargement...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Clinique', 'Type', 'Contact', 'Utilisateurs', 'Patients', 'Abonnement', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {mediaUrl(c.logo)
                            ? <img src={mediaUrl(c.logo)!} alt={c.name} className="w-8 h-8 rounded-lg object-contain border border-gray-200 bg-white p-0.5 shrink-0" />
                            : <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0"><Building2 className="h-4 w-4 text-blue-600" /></div>
                          }
                          <div>
                            <p className="text-sm font-medium text-gray-800">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${TYPE_COLORS[c.type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {c.type_display}
                        </span>
                      </td>
                      <td className="px-4 py-3 space-y-0.5">
                        {c.telephone && <div className="flex items-center gap-1 text-xs text-gray-500"><Phone className="h-3 w-3" />{c.telephone}</div>}
                        {c.email     && <div className="flex items-center gap-1 text-xs text-gray-500"><Mail className="h-3 w-3" />{c.email}</div>}
                        {c.adresse   && <div className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3 w-3" />{c.adresse}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setViewUsers(c)} className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800">
                          <Users className="h-4 w-4" /> {c.users_count}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700">{c.patients_count}</td>
                      <td className="px-4 py-3">
                        <TrialBadge c={c} />
                      </td>
                      <td className="px-4 py-3">
                        {c.is_active
                          ? <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> Active</span>
                          : <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><XCircle className="h-3.5 w-3.5" /> Inactive</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(c)} title="Modifier infos">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-50"
                            onClick={() => openSubscription(c)} title="Gérer l'abonnement">
                            <CreditCard className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50"
                            disabled={impersonateMutation.isPending}
                            onClick={() => impersonateMutation.mutate(c.id)}
                            title="Accéder à cette clinique">
                            <LogIn className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50"
                            onClick={() => { setDeleteClinic(c); setDeleteConfirm('') }}
                            title="Supprimer la clinique">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">Aucune clinique trouvée</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
