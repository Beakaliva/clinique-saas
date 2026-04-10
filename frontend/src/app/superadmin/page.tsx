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
  ShieldAlert,
} from 'lucide-react'

interface ClinicStat {
  id: number; name: string; type: string; type_display: string
  telephone: string; email: string; adresse: string; slug: string
  is_active: boolean; created_at: string
  users_count: number; patients_count: number
}
interface ClinicEditForm { name: string; telephone: string; email: string; adresse: string; is_active: boolean }

const TYPE_COLORS: Record<string, string> = {
  generale:      'bg-blue-50 text-blue-700',
  dentaire:      'bg-cyan-50 text-cyan-700',
  pediatrique:   'bg-pink-50 text-pink-700',
  ophtalmologie: 'bg-violet-50 text-violet-700',
  maternite:     'bg-rose-50 text-rose-700',
  psychiatrie:   'bg-orange-50 text-orange-700',
}

export default function SuperAdminPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const { user: me, impersonate, superAdminSnapshot, exitImpersonation } = useAuthStore()

  const [search, setSearch]       = useState('')
  const [editClinic, setEditClinic] = useState<ClinicStat | null>(null)
  const [viewUsers, setViewUsers]   = useState<ClinicStat | null>(null)

  // Guard superuser
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

  // ── Forms & Mutations ─────────────────────────────────────────────────
  const editForm = useForm<ClinicEditForm>()

  const updateClinic = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClinicEditForm }) =>
      api.patch(`/superadmin/clinics/${id}/`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-clinics'] }); setEditClinic(null) },
  })

  const impersonateMutation = useMutation({
    mutationFn: (clinic_id: number) =>
      api.post<{ access: string; refresh: string; user: User }>('/superadmin/impersonate/', { clinic_id }).then(r => r.data),
    onSuccess: (data) => {
      impersonate(data.user, data.access, data.refresh)
      router.push('/dashboard')
    },
  })

  const openEdit = (c: ClinicStat) => {
    setEditClinic(c)
    editForm.reset({ name: c.name, telephone: c.telephone, email: c.email, adresse: c.adresse, is_active: c.is_active })
  }

  // ── Filtered list ─────────────────────────────────────────────────────
  const filtered = clinics.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.type_display.toLowerCase().includes(search.toLowerCase())
  )

  // ── Stats globales ────────────────────────────────────────────────────
  const totalClinics  = clinics.length
  const activeClinics = clinics.filter(c => c.is_active).length
  const totalUsers    = clinics.reduce((s, c) => s + c.users_count, 0)
  const totalPatients = clinics.reduce((s, c) => s + c.patients_count, 0)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Dialog modifier clinique */}
      <Dialog open={!!editClinic} onOpenChange={v => { if (!v) setEditClinic(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Modifier — {editClinic?.name}</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit(d => updateClinic.mutate({ id: editClinic!.id, data: d }))} className="space-y-4">
            <div><Label>Nom *</Label><Input {...editForm.register('name', { required: true })} /></div>
            <div><Label>Téléphone</Label><Input {...editForm.register('telephone')} /></div>
            <div><Label>Email</Label><Input type="email" {...editForm.register('email')} /></div>
            <div><Label>Adresse</Label><Input {...editForm.register('adresse')} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="chk_clinic_active" {...editForm.register('is_active')} className="h-4 w-4" />
              <label htmlFor="chk_clinic_active" className="text-sm text-gray-700">Clinique active</label>
            </div>
            {updateClinic.isError && <p className="text-xs text-red-500">Erreur lors de la mise à jour.</p>}
            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setEditClinic(null)}>Annuler</Button>
              <Button type="submit" disabled={updateClinic.isPending}>{updateClinic.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog utilisateurs d'une clinique */}
      <Dialog open={!!viewUsers} onOpenChange={v => { if (!v) setViewUsers(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Utilisateurs — {viewUsers?.name}</DialogTitle></DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Nom', 'Téléphone', 'Groupe', 'Permission', 'Statut'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-2">{h}</th>
                  ))}
                </tr>
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

      {/* Header */}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Cliniques totales',  value: totalClinics,  icon: Building2,    color: 'bg-blue-50 text-blue-600' },
            { label: 'Cliniques actives',  value: activeClinics, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
            { label: 'Utilisateurs',       value: totalUsers,    icon: Users,        color: 'bg-purple-50 text-purple-600' },
            { label: 'Patients',           value: totalPatients, icon: Activity,     color: 'bg-rose-50 text-rose-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border-0 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
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
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Clinique', 'Type', 'Contact', 'Utilisateurs', 'Patients', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-blue-600" />
                          </div>
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
                        {c.is_active
                          ? <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> Active</span>
                          : <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><XCircle className="h-3.5 w-3.5" /> Inactive</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(c)} title="Modifier">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost"
                            className="text-blue-600 hover:bg-blue-50"
                            disabled={impersonateMutation.isPending}
                            onClick={() => impersonateMutation.mutate(c.id)}
                            title="Accéder à cette clinique">
                            <LogIn className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">Aucune clinique trouvée</td></tr>
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
