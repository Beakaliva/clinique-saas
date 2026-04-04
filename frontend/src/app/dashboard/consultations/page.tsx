'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import type { Consultation, Patient, PaginatedResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Stethoscope, User, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'

const STATUTS = [
  { value: 'en_attente', label: 'En attente',  color: 'bg-yellow-50 text-yellow-700' },
  { value: 'en_cours',   label: 'En cours',    color: 'bg-blue-50 text-blue-700' },
  { value: 'termine',    label: 'Terminée',    color: 'bg-green-50 text-green-700' },
  { value: 'annule',     label: 'Annulée',     color: 'bg-red-50 text-red-600' },
]

function getStatutStyle(statut: string) {
  return STATUTS.find(s => s.value === statut)?.color ?? 'bg-gray-100 text-gray-600'
}

function fetchConsultations(search: string, page: number) {
  return api.get<PaginatedResponse<Consultation>>('/consultations/', { params: { search, page } }).then(r => r.data)
}

function fetchPatients() {
  return api.get<PaginatedResponse<Patient>>('/patients/', { params: { page_size: 200 } }).then(r => r.data.results)
}

export default function ConsultationsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Consultation | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['consultations', search, page],
    queryFn: () => fetchConsultations(search, page),
  })

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-list'],
    queryFn: fetchPatients,
  })

  const { register, handleSubmit, reset, setValue } = useForm<Partial<Consultation>>()

  const save = useMutation({
    mutationFn: (d: Partial<Consultation>) =>
      editing
        ? api.patch(`/consultations/${editing.id}/`, d).then(r => r.data)
        : api.post('/consultations/', d).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['consultations'] }); setOpen(false); reset(); setEditing(null) },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/consultations/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consultations'] }),
  })

  const openEdit = (c: Consultation) => {
    setEditing(c)
    Object.entries(c).forEach(([k, v]) => setValue(k as keyof Consultation, v as string))
    setOpen(true)
  }

  const openNew = () => { setEditing(null); reset(); setOpen(true) }

  const totalPages = data ? Math.ceil(data.count / 25) : 1

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Consultations</h1>
          <p className="text-gray-500 text-sm">{data?.count ?? 0} consultation(s) enregistrée(s)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openNew} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Nouvelle consultation</Button>} />
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier la consultation' : 'Nouvelle consultation'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
              <div>
                <Label>Patient *</Label>
                <select {...register('patient', { required: true })} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                  <option value="">— Sélectionner —</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.last_name.toUpperCase()} {p.first_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Date *</Label>
                <Input type="date" {...register('date', { required: true })} />
              </div>
              <div>
                <Label>Motif</Label>
                <Input {...register('motif')} placeholder="Raison de la consultation..." />
              </div>
              <div>
                <Label>Diagnostic</Label>
                <textarea {...register('diagnostic')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" placeholder="Diagnostic médical..." />
              </div>
              <div>
                <Label>Statut</Label>
                <select {...register('statut')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                  {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Notes</Label>
                <textarea {...register('notes')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" placeholder="Notes cliniques..." />
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
          placeholder="Rechercher par patient, motif, diagnostic..."
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
              <Stethoscope className="h-10 w-10 mb-2 opacity-30" />
              <p>Aucune consultation trouvée</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Patient</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Motif</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Médecin</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.results.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-800">{c.patient_nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {c.date ? new Date(c.date).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.motif || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.medecin_nom || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium ${getStatutStyle(c.statut)}`}>
                        {c.statut_label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => confirm('Supprimer cette consultation ?') && remove.mutate(c.id)}>
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
