'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import type { User } from '@/types'
import { Button } from '@/components/ui/button'
import { mediaUrl } from '@/lib/media'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Building2, Phone, Mail, MapPin, Shield, User as UserIcon,
  Pencil, Plus, Trash2, CheckCircle2, XCircle, Users, KeyRound,
  Eye, EyeOff,
} from 'lucide-react'

interface ClinicForm   { name: string; telephone: string; adresse: string; email: string; logo?: FileList }
interface AccountForm  { first_name: string; last_name: string; email: string; telephone: string }
interface PasswordForm { old_password: string; new_password: string; new_password2: string }
interface UserCreateForm {
  first_name: string; last_name: string; telephone: string; email: string
  group: string; permission: string; modules: string[]; password: string; password2: string
}
interface UserEditForm { first_name: string; last_name: string; group: string; permission: string; modules: string[]; is_active: boolean }
interface ResetPwForm  { new_password: string; new_password2: string }

const PERMISSIONS = [
  { value: 'CRUD', color: 'bg-green-50 text-green-700' },
  { value: 'CRU',  color: 'bg-blue-50 text-blue-700' },
  { value: 'CR',   color: 'bg-yellow-50 text-yellow-700' },
  { value: 'C',    color: 'bg-gray-100 text-gray-600' },
]
const permColor = (p: string) => PERMISSIONS.find(x => x.value === p)?.color ?? 'bg-gray-100 text-gray-600'

export default function ParametresPage() {
  const qc = useQueryClient()
  const { user: me, clinic, setUser, setClinic } = useAuthStore()
  const isAdmin = me?.is_superuser || me?.group === 'ADMIN'

  // ── Dialog open states ────────────────────────────────────────────────
  const [openClinic,   setOpenClinic]   = useState(false)
  const [openAccount,  setOpenAccount]  = useState(false)
  const [openCreate,   setOpenCreate]   = useState(false)
  const [editingUser,  setEditingUser]  = useState<User | null>(null)
  const [resetPwUser,  setResetPwUser]  = useState<User | null>(null)

  // ── Password form inline state ────────────────────────────────────────
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)

  // ── Groups & modules from current user's clinic config ───────────────
  const groups:  [string, string][] = me?.clinic_groups  ?? []
  const modules: [string, string][] = me?.clinic_modules ?? []

  // ── Queries ───────────────────────────────────────────────────────────
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<{ results: User[] }>('/users/').then(r => r.data.results),
    enabled: isAdmin,
  })

  // ── Forms ─────────────────────────────────────────────────────────────
  const clinicForm   = useForm<ClinicForm>()
  const accountForm  = useForm<AccountForm>()
  const pwForm       = useForm<PasswordForm>()
  const createForm   = useForm<UserCreateForm>({ defaultValues: { permission: 'CR', modules: [] } })
  const editForm     = useForm<UserEditForm>({ defaultValues: { modules: [] } })
  const resetPwForm  = useForm<ResetPwForm>()

  // ── Mutations ─────────────────────────────────────────────────────────
  const saveClinic = useMutation({
    mutationFn: (d: ClinicForm) => {
      const form = new FormData()
      form.append('name', d.name)
      if (d.telephone) form.append('telephone', d.telephone)
      if (d.email)     form.append('email', d.email)
      if (d.adresse)   form.append('adresse', d.adresse)
      if (d.logo && d.logo.length > 0) form.append('logo', d.logo[0])
      return api.patch('/clinic/', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
    },
    onSuccess: (data) => { setClinic(data); setOpenClinic(false) },
  })

  const saveAccount = useMutation({
    mutationFn: (d: AccountForm) => api.patch('/auth/me/', d).then(r => r.data),
    onSuccess: (data) => { setUser(data); setOpenAccount(false) },
  })

  const savePw = useMutation({
    mutationFn: (d: PasswordForm) => api.post('/auth/change-password/', d),
    onSuccess: () => { setPwSuccess(true); pwForm.reset(); setTimeout(() => setPwSuccess(false), 3000) },
  })

  const createUser = useMutation({
    mutationFn: (d: UserCreateForm) => api.post<User>('/users/', d).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setOpenCreate(false); createForm.reset({ permission: 'CR' }) },
  })

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserEditForm }) => api.patch<User>(`/users/${id}/`, data).then(r => r.data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setEditingUser(null)
      // Si l'admin modifie son propre profil, mettre à jour le store
      if (updated.id === me?.id) {
        api.get('/auth/me/').then(r => setUser(r.data))
      }
    },
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => api.patch(`/users/${id}/`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const deleteUser = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const resetPw = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ResetPwForm }) =>
      api.post(`/users/${id}/reset-password/`, data),
    onSuccess: () => { setResetPwUser(null); resetPwForm.reset() },
  })

  // ── Handlers ──────────────────────────────────────────────────────────
  const openEditClinic = () => {
    clinicForm.reset({ name: clinic?.name ?? '', telephone: clinic?.telephone ?? '', adresse: clinic?.adresse ?? '', email: clinic?.email ?? '' })
    setOpenClinic(true)
  }
  const openEditAccount = () => {
    accountForm.reset({ first_name: me?.first_name ?? '', last_name: me?.last_name ?? '', email: me?.email ?? '', telephone: me?.telephone ?? '' })
    setOpenAccount(true)
  }
  const openEditUser = (u: User) => {
    setEditingUser(u)
    editForm.reset({ first_name: u.first_name, last_name: u.last_name, group: u.group, permission: u.permission, modules: u.modules ?? [], is_active: u.is_active })
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Dialogs (tous au niveau racine) ── */}

      <Dialog open={openClinic} onOpenChange={v => { if (!v) setOpenClinic(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Modifier la clinique</DialogTitle></DialogHeader>
          <form onSubmit={clinicForm.handleSubmit(d => saveClinic.mutate(d))} className="space-y-4">
            {/* Logo actuel + upload */}
            <div>
              <Label>Logo</Label>
              <div className="mt-1.5 flex items-center gap-4">
                {mediaUrl(clinic?.logo)
                  ? <img src={mediaUrl(clinic?.logo)!} alt="logo" className="w-14 h-14 rounded-xl object-contain border border-gray-200 bg-gray-50 p-1" />
                  : <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 text-gray-300 text-xs text-center">Aucun logo</div>
                }
                <div className="flex-1">
                  <Input type="file" accept="image/*" {...clinicForm.register('logo')} className="text-sm" />
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG ou SVG — max 2 Mo</p>
                </div>
              </div>
            </div>
            <div><Label>Nom *</Label><Input {...clinicForm.register('name', { required: true })} /></div>
            <div><Label>Téléphone</Label><Input {...clinicForm.register('telephone')} /></div>
            <div><Label>Email</Label><Input type="email" {...clinicForm.register('email')} /></div>
            <div><Label>Adresse</Label><Input {...clinicForm.register('adresse')} /></div>
            {saveClinic.isError && <p className="text-xs text-red-500">Erreur lors de l'enregistrement.</p>}
            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setOpenClinic(false)}>Annuler</Button>
              <Button type="submit" disabled={saveClinic.isPending}>{saveClinic.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openAccount} onOpenChange={v => { if (!v) setOpenAccount(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Modifier mon compte</DialogTitle></DialogHeader>
          <form onSubmit={accountForm.handleSubmit(d => saveAccount.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Prénom *</Label><Input {...accountForm.register('first_name', { required: true })} /></div>
              <div><Label>Nom *</Label><Input {...accountForm.register('last_name', { required: true })} /></div>
            </div>
            <div><Label>Téléphone</Label><Input {...accountForm.register('telephone')} /></div>
            <div><Label>Email</Label><Input type="email" {...accountForm.register('email')} /></div>
            {saveAccount.isError && <p className="text-xs text-red-500">Erreur lors de l'enregistrement.</p>}
            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setOpenAccount(false)}>Annuler</Button>
              <Button type="submit" disabled={saveAccount.isPending}>{saveAccount.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openCreate} onOpenChange={v => { if (!v) { setOpenCreate(false); createForm.reset({ permission: 'CR' }) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouvel utilisateur</DialogTitle></DialogHeader>
          <form onSubmit={createForm.handleSubmit(d => createUser.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Prénom *</Label><Input {...createForm.register('first_name', { required: true })} /></div>
              <div><Label>Nom *</Label><Input {...createForm.register('last_name', { required: true })} /></div>
            </div>
            <div><Label>Téléphone * <span className="text-gray-400 font-normal">(identifiant)</span></Label><Input {...createForm.register('telephone', { required: true })} /></div>
            <div><Label>Email</Label><Input type="email" {...createForm.register('email')} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Groupe *</Label>
                <select {...createForm.register('group', { required: true })} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                  <option value="">— Choisir —</option>
                  {groups.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <Label>Permission *</Label>
                <select {...createForm.register('permission', { required: true })} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                  {PERMISSIONS.map(p => <option key={p.value} value={p.value}>{p.value}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Modules accessibles</Label>
              <div className="grid grid-cols-2 gap-1.5 mt-1.5 max-h-36 overflow-y-auto border border-gray-100 rounded-md p-2">
                {modules.map(([v, l]) => (
                  <label key={v} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input type="checkbox" value={v}
                      {...createForm.register('modules')}
                      className="h-3.5 w-3.5 rounded" />
                    {l}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Mot de passe *</Label><Input type="password" {...createForm.register('password', { required: true, minLength: 8 })} /></div>
              <div><Label>Confirmer *</Label><Input type="password" {...createForm.register('password2', { required: true })} /></div>
            </div>
            {createUser.isError && <p className="text-xs text-red-500">Erreur — téléphone déjà utilisé ?</p>}
            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>Annuler</Button>
              <Button type="submit" disabled={createUser.isPending}>{createUser.isPending ? 'Création...' : 'Créer'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingUser} onOpenChange={v => { if (!v) setEditingUser(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Modifier — {editingUser?.full_name}</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit(d => updateUser.mutate({ id: editingUser!.id, data: d }))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Prénom</Label><Input {...editForm.register('first_name')} /></div>
              <div><Label>Nom</Label><Input {...editForm.register('last_name')} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Groupe</Label>
                <select {...editForm.register('group')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                  {groups.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <Label>Permission</Label>
                <select {...editForm.register('permission')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                  {PERMISSIONS.map(p => <option key={p.value} value={p.value}>{p.value}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Modules accessibles</Label>
              <div className="grid grid-cols-2 gap-1.5 mt-1.5 max-h-36 overflow-y-auto border border-gray-100 rounded-md p-2">
                {modules.map(([v, l]) => (
                  <label key={v} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input type="checkbox" value={v}
                      {...editForm.register('modules')}
                      className="h-3.5 w-3.5 rounded" />
                    {l}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="chk_active" {...editForm.register('is_active')} className="h-4 w-4" />
              <label htmlFor="chk_active" className="text-sm text-gray-700">Compte actif</label>
            </div>
            {updateUser.isError && <p className="text-xs text-red-500">Erreur lors de la mise à jour.</p>}
            {editingUser?.id !== me?.id && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                L'utilisateur devra se <strong>reconnecter</strong> pour voir les nouveaux droits et modules.
              </p>
            )}
            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Annuler</Button>
              <Button type="submit" disabled={updateUser.isPending}>{updateUser.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetPwUser} onOpenChange={v => { if (!v) { setResetPwUser(null); resetPwForm.reset() } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Réinitialiser le mot de passe — {resetPwUser?.full_name}</DialogTitle></DialogHeader>
          <form onSubmit={resetPwForm.handleSubmit(d => resetPw.mutate({ id: resetPwUser!.id, data: d }))} className="space-y-4">
            <div>
              <Label>Nouveau mot de passe *</Label>
              <Input type="password" {...resetPwForm.register('new_password', { required: true, minLength: 8 })} />
              {resetPwForm.formState.errors.new_password && <p className="text-xs text-red-500 mt-1">Minimum 8 caractères.</p>}
            </div>
            <div>
              <Label>Confirmer le mot de passe *</Label>
              <Input type="password" {...resetPwForm.register('new_password2', { required: true })} />
            </div>
            {resetPw.isError && <p className="text-xs text-red-500">Erreur — les mots de passe ne correspondent pas.</p>}
            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => { setResetPwUser(null); resetPwForm.reset() }}>Annuler</Button>
              <Button type="submit" disabled={resetPw.isPending}>{resetPw.isPending ? 'Réinitialisation...' : 'Réinitialiser'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Header page ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>
        <p className="text-gray-500 text-sm">Gérez votre clinique, compte et utilisateurs</p>
      </div>

      {/* ── Clinique ── */}
      {isAdmin && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="px-6 pt-5 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" /> Clinique
            </CardTitle>
            <Button size="sm" variant="outline" onClick={openEditClinic} className="flex items-center gap-1">
              <Pencil className="h-3.5 w-3.5" /> Modifier
            </Button>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            {mediaUrl(clinic?.logo) && (
              <div className="mb-4">
                <img src={mediaUrl(clinic?.logo)!} alt={clinic?.name} className="h-14 w-auto max-w-[160px] object-contain rounded-lg border border-gray-100 bg-gray-50 p-1" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Nom</p>
                <p className="text-sm font-medium text-gray-800">{clinic?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Type</p>
                <p className="text-sm text-gray-700">{clinic?.type_display}</p>
              </div>
              {clinic?.telephone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400 shrink-0" /><p className="text-sm text-gray-700">{clinic.telephone}</p></div>}
              {clinic?.email    && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400 shrink-0" /><p className="text-sm text-gray-700">{clinic.email}</p></div>}
              {clinic?.adresse  && <div className="flex items-center gap-2 col-span-2"><MapPin className="h-4 w-4 text-gray-400 shrink-0" /><p className="text-sm text-gray-700">{clinic.adresse}</p></div>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Mon compte ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="px-6 pt-5 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-blue-600" /> Mon compte
          </CardTitle>
          <Button size="sm" variant="outline" onClick={openEditAccount} className="flex items-center gap-1">
            <Pencil className="h-3.5 w-3.5" /> Modifier
          </Button>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Nom complet</p>
              <p className="text-sm font-medium text-gray-800">{me?.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Téléphone</p>
              <p className="text-sm text-gray-700">{me?.telephone}</p>
            </div>
            {me?.email && <div><p className="text-xs text-gray-400 uppercase font-semibold mb-1">Email</p><p className="text-sm text-gray-700">{me.email}</p></div>}
          </div>
        </CardContent>
      </Card>

      {/* ── Mot de passe ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="px-6 pt-5 pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-blue-600" /> Changer le mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <form onSubmit={pwForm.handleSubmit(d => savePw.mutate(d))} className="space-y-4 max-w-sm">
            <div>
              <Label>Mot de passe actuel</Label>
              <div className="relative">
                <Input type={showOld ? 'text' : 'password'} {...pwForm.register('old_password', { required: true })} />
                <button type="button" onClick={() => setShowOld(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Nouveau mot de passe</Label>
              <div className="relative">
                <Input type={showNew ? 'text' : 'password'} {...pwForm.register('new_password', { required: true, minLength: 8 })} />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Confirmer</Label>
              <Input type="password" {...pwForm.register('new_password2', { required: true })} />
            </div>
            {savePw.isError   && <p className="text-xs text-red-500">Mot de passe actuel incorrect.</p>}
            {pwSuccess        && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Modifié avec succès.</p>}
            <Button type="submit" disabled={savePw.isPending}>{savePw.isPending ? 'Modification...' : 'Modifier le mot de passe'}</Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Droits & Accès ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="px-6 pt-5 pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" /> Mes droits & accès
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Groupe</p>
              <span className="inline-flex px-2 py-1 text-xs rounded-full font-medium bg-blue-50 text-blue-700">{me?.group}</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Permission</p>
              <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${permColor(me?.permission ?? '')}`}>{me?.permission}</span>
            </div>
            {me?.is_superuser && (
              <div className="col-span-2">
                <span className="inline-flex px-2 py-1 text-xs rounded-full font-medium bg-purple-50 text-purple-700">Superutilisateur — accès total</span>
              </div>
            )}
          </div>
          {me?.modules && me.modules.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Modules accessibles</p>
              <div className="flex flex-wrap gap-1.5">
                {me.modules.map(m => <span key={m} className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">{m}</span>)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Utilisateurs ── */}
      {isAdmin && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="px-6 pt-5 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" /> Utilisateurs ({users.length})
            </CardTitle>
            <Button size="sm" onClick={() => setOpenCreate(true)} className="flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {usersLoading ? (
              <div className="flex items-center justify-center h-20 text-gray-400 text-sm">Chargement...</div>
            ) : users.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-gray-400 text-sm">Aucun utilisateur</div>
            ) : (
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Nom', 'Téléphone', 'Groupe', 'Permission', 'Statut', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-blue-700">{u.first_name[0]}{u.last_name[0]}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{u.full_name}</p>
                            {u.email && <p className="text-xs text-gray-400">{u.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{u.telephone}</td>
                      <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 font-medium">{u.group}</span></td>
                      <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${permColor(u.permission)}`}>{u.permission}</span></td>
                      <td className="px-4 py-3">
                        {u.is_active
                          ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3.5 w-3.5" /> Actif</span>
                          : <span className="flex items-center gap-1 text-xs text-red-500"><XCircle className="h-3.5 w-3.5" /> Inactif</span>}
                      </td>
                      <td className="px-4 py-3">
                        {u.id !== me?.id && (
                          <div className="flex items-center gap-1 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => openEditUser(u)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="text-blue-500 hover:bg-blue-50"
                              title="Réinitialiser le mot de passe"
                              onClick={() => { setResetPwUser(u); resetPwForm.reset() }}>
                              <KeyRound className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost"
                              className={u.is_active ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}
                              onClick={() => toggleActive.mutate({ id: u.id, is_active: !u.is_active })}>
                              {u.is_active ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50"
                              onClick={() => confirm(`Supprimer ${u.full_name} ?`) && deleteUser.mutate(u.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
