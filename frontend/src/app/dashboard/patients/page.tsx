'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { useSearchParams } from 'next/navigation'
import { useClinicAccess } from '@/hooks/use-clinic-access'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import type { Patient, PaginatedResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateInput } from '@/components/ui/date-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Suspense } from 'react'
import { FilterBar, type FilterState } from '@/components/ui/filter-bar'
import { Pagination } from '@/components/ui/pagination'
import { Plus, Search, User, Phone, Shield, Pencil, Trash2, Users, UserCheck, UserX } from 'lucide-react'
import { StatCards, type StatDef } from '@/components/ui/stat-cards'

const PATIENT_STATS: StatDef[] = [
  { label: 'Total patients', endpoint: '/patients/',                                    icon: Users,      color: 'bg-blue-50 text-blue-600' },
  { label: 'Assurés',        endpoint: '/patients/', params: { est_assure: 'true' },   icon: Shield,     color: 'bg-green-50 text-green-600' },
  { label: 'Non assurés',    endpoint: '/patients/', params: { est_assure: 'false' },  icon: UserX,      color: 'bg-orange-50 text-orange-600' },
  { label: 'Hommes',         endpoint: '/patients/', params: { sexe: 'M' },            icon: UserCheck,  color: 'bg-violet-50 text-violet-600' },
  { label: 'Femmes',         endpoint: '/patients/', params: { sexe: 'F' },            icon: UserX,      color: 'bg-pink-50 text-pink-600' },
]

const INIT_FILTERS: FilterState = { dateDebut: '', dateFin: '', mois: '', annee: '', sexe: '', est_assure: '' }

function buildParams(search: string, page: number, f: FilterState) {
  return {
    search, page,
    ...(f.dateDebut  ? { date_debut:  f.dateDebut }  : {}),
    ...(f.dateFin    ? { date_fin:    f.dateFin }    : {}),
    ...(f.mois       ? { mois:        f.mois }       : {}),
    ...(f.annee      ? { annee:       f.annee }      : {}),
    ...(f.sexe       ? { sexe:        f.sexe }       : {}),
    ...(f.est_assure ? { est_assure:  f.est_assure } : {}),
  }
}

function fetchPatients(search: string, page: number, f: FilterState) {
  return api.get<PaginatedResponse<Patient>>('/patients/', { params: buildParams(search, page, f) }).then(r => r.data)
}

export default function PatientsPage() {
  return <Suspense><PatientsContent /></Suspense>
}

function PatientsContent() {
  const qc = useQueryClient()
  const searchParams = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const canC = user?.is_superuser || (user?.permission ?? '').includes('C')
  const canU = user?.is_superuser || (user?.permission ?? '').includes('U')
  const canD = user?.is_superuser || (user?.permission ?? '').includes('D')
  const { hasAccess } = useClinicAccess()
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)
  const [open,    setOpen]    = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)
  const [filters, setFilters] = useState<FilterState>(INIT_FILTERS)

  const setFilter = (k: string, v: string) => { setFilters(f => ({ ...f, [k]: v })); setPage(1) }
  const resetFilters = () => { setFilters(INIT_FILTERS); setPage(1) }

  useEffect(() => {
    if (searchParams.get('new') === '1' && canC) { setEditing(null); reset(); setOpen(true) }
  }, [searchParams, canC]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, page, filters],
    queryFn:  () => fetchPatients(search, page, filters),
  })

  const { register, handleSubmit, reset, setValue, watch, control } = useForm<Partial<Patient>>()

  const cleanPatient = (d: Partial<Patient>) =>
    Object.fromEntries(
      Object.entries(d).map(([k, v]) => [k, (v === '' || (typeof v === 'number' && isNaN(v))) ? null : v])
    )

  const save = useMutation({
    mutationFn: (d: Partial<Patient>) => {
      const payload = cleanPatient(d)
      return editing
        ? api.patch(`/patients/${editing.id}/`, payload).then(r => r.data)
        : api.post('/patients/', payload).then(r => r.data)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patients'] }); setOpen(false); reset(); setEditing(null) },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/patients/${id}/`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['patients'] }),
  })

  const openEdit = (p: Patient) => {
    setEditing(p)
    Object.entries(p).forEach(([k, v]) => setValue(k as keyof Patient, v as string))
    setOpen(true)
  }

  const openNew = () => { setEditing(null); reset(); setOpen(true) }

  const totalPages = data ? Math.ceil(data.count / 25) : 1

  return (
    <div className="space-y-5">
      <StatCards stats={PATIENT_STATS} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
          <p className="text-gray-500 text-sm">{data?.count ?? 0} patient(s) enregistré(s)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          {canC && hasAccess && <DialogTrigger render={<Button onClick={openNew} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Nouveau patient</Button>} />}
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier le patient' : 'Nouveau patient'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Prénom *</Label>
                  <Input {...register('first_name', { required: true })} placeholder="Jean" />
                </div>
                <div>
                  <Label>Nom *</Label>
                  <Input {...register('last_name', { required: true })} placeholder="Dupont" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Sexe</Label>
                  <select {...register('sexe')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                    <option value="A">Autre</option>
                  </select>
                </div>
                <div>
                  <Label>Date de naissance</Label>
                  <Controller control={control} name="date_naissance" render={({ field }) => <DateInput name={field.name} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} />} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Téléphone</Label>
                  <Input {...register('telephone')} placeholder="+224 620 000 000" />
                </div>
                <div>
                  <Label>Profession</Label>
                  <Input {...register('profession')} placeholder="Enseignant..." />
                </div>
              </div>
              <div>
                <Label>Adresse</Label>
                <Input {...register('adresse')} placeholder="Conakry, Guinée" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="est_assure" {...register('est_assure')} className="rounded" />
                <Label htmlFor="est_assure">Patient assuré</Label>
              </div>
              {watch('est_assure') && (
                <div className="border border-blue-100 rounded-lg p-3 space-y-3 bg-blue-50/40">
                  <p className="text-xs font-semibold text-blue-700 uppercase">Informations assurance</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Compagnie d'assurance</Label>
                      <Input {...register('assurance')} placeholder="SONACOS, SAAR..." />
                    </div>
                    <div>
                      <Label>N° Police / Code</Label>
                      <Input {...register('code_assurance')} placeholder="ASS-2024-001" />
                    </div>
                  </div>
                  <div>
                    <Label>Taux de prise en charge (%)</Label>
                    <Input type="number" min={0} max={100} step={0.01} {...register('pourcentage', { valueAsNumber: true })} placeholder="80" />
                    <p className="text-xs text-gray-400 mt-1">Ex : 80 = l'assurance paie 80%, le patient paie 20%</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={!hasAccess || save.isPending}>
                  {save.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Filtres */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, prénom, téléphone..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <FilterBar
          filters={filters}
          onChange={setFilter}
          onReset={resetFilters}
          extras={[
            { key: 'sexe', label: 'Sexe', options: [{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }, { value: 'A', label: 'Autre' }] },
            { key: 'est_assure', label: 'Assurance', options: [{ value: 'true', label: 'Assuré' }, { value: 'false', label: 'Non assuré' }] },
          ]}
        />
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>
          ) : data?.results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <User className="h-10 w-10 mb-2 opacity-30" />
              <p>Aucun patient trouvé</p>
            </div>
          ) : (
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Patient</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Âge / Sexe</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Téléphone</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Assurance</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.results.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                          {p.first_name[0]}{p.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{p.last_name.toUpperCase()} {p.first_name}</p>
                          <p className="text-xs text-gray-400">{p.profession || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.age ? `${p.age} ans` : '—'} / {p.sexe_label}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        {p.telephone || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.est_assure ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium">
                          <Shield className="h-3 w-3" /> {p.assurance || 'Assuré'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Non assuré</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {canU && hasAccess && <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>}
                        {canD && hasAccess && <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => confirm('Supprimer ce patient ?') && remove.mutate(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        count={data?.count}
        onPageChange={setPage}
      />
    </div>
  )
}
