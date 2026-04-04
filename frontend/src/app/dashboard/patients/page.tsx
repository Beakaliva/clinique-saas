'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import type { Patient, PaginatedResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, User, Phone, Shield, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

function fetchPatients(search: string, page: number) {
  return api.get<PaginatedResponse<Patient>>('/patients/', { params: { search, page } }).then(r => r.data)
}

export default function PatientsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)
  const [open,   setOpen]   = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, page],
    queryFn:  () => fetchPatients(search, page),
  })

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Partial<Patient>>()

  const save = useMutation({
    mutationFn: (d: Partial<Patient>) =>
      editing
        ? api.patch(`/patients/${editing.id}/`, d).then(r => r.data)
        : api.post('/patients/', d).then(r => r.data),
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
          <p className="text-gray-500 text-sm">{data?.count ?? 0} patient(s) enregistré(s)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openNew} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Nouveau patient</Button>} />
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
                  <Input type="date" {...register('date_naissance')} />
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
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher par nom, prénom, téléphone..."
          className="pl-10"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>
          ) : data?.results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <User className="h-10 w-10 mb-2 opacity-30" />
              <p>Aucun patient trouvé</p>
            </div>
          ) : (
            <table className="w-full">
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
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => confirm('Supprimer ce patient ?') && remove.mutate(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} / {totalPages}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
