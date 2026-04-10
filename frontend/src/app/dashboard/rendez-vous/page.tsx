'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import type { RendezVous, PaginatedResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import PatientSelect from '@/components/ui/patient-select'
import { Plus, Search, Calendar, Clock, User, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'

const STATUTS = [
  { value: 'planifie',  label: 'Planifié',  color: 'bg-blue-50 text-blue-700' },
  { value: 'confirme',  label: 'Confirmé',  color: 'bg-green-50 text-green-700' },
  { value: 'en_cours',  label: 'En cours',  color: 'bg-yellow-50 text-yellow-700' },
  { value: 'termine',   label: 'Terminé',   color: 'bg-gray-100 text-gray-600' },
  { value: 'annule',    label: 'Annulé',    color: 'bg-red-50 text-red-600' },
]

function getStatutStyle(statut: string) {
  return STATUTS.find(s => s.value === statut)?.color ?? 'bg-gray-100 text-gray-600'
}

function fetchRdv(search: string, page: number) {
  return api.get<PaginatedResponse<RendezVous>>('/rendez-vous/', { params: { search, page } }).then(r => r.data)
}

export default function RendezVousPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<RendezVous | null>(null)
  const [patientId, setPatientId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['rendez-vous', search, page],
    queryFn: () => fetchRdv(search, page),
  })

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Partial<RendezVous>>()

  const save = useMutation({
    mutationFn: (d: Partial<RendezVous>) =>
      editing
        ? api.patch(`/rendez-vous/${editing.id}/`, d).then(r => r.data)
        : api.post('/rendez-vous/', d).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rendez-vous'] })
      setOpen(false); reset(); setEditing(null); setPatientId(null)
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/rendez-vous/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rendez-vous'] }),
  })

  const openEdit = (r: RendezVous) => {
    setEditing(r)
    setPatientId(r.patient)
    Object.entries(r).forEach(([k, v]) => setValue(k as keyof RendezVous, v as string))
    setOpen(true)
  }

  const openNew = () => { setEditing(null); setPatientId(null); reset(); setOpen(true) }

  const totalPages = data ? Math.ceil(data.count / 25) : 1

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rendez-vous</h1>
          <p className="text-gray-500 text-sm">{data?.count ?? 0} rendez-vous enregistré(s)</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPatientId(null); reset(); setEditing(null) } }}>
          <DialogTrigger render={<Button onClick={openNew} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Nouveau RDV</Button>} />
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit((d) => save.mutate({ ...d, patient: patientId! }))} className="space-y-4">
              <div>
                <Label>Patient *</Label>
                <PatientSelect
                  value={patientId}
                  onChange={(id) => setPatientId(id)}
                  required
                />
                {!patientId && errors.patient && <p className="text-xs text-red-500 mt-1">Champ requis</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date et heure *</Label>
                  <Input type="datetime-local" {...register('date_heure', { required: true })} />
                </div>
                <div>
                  <Label>Durée (minutes)</Label>
                  <Input type="number" {...register('duree_minutes')} defaultValue={30} min={5} max={240} />
                </div>
              </div>
              <div>
                <Label>Motif</Label>
                <Input {...register('motif')} placeholder="Consultation, suivi..." />
              </div>
              <div>
                <Label>Statut</Label>
                <select {...register('statut')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                  {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Notes</Label>
                <textarea {...register('notes')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" placeholder="Notes internes..." />
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={save.isPending || !patientId}>
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
          placeholder="Rechercher par patient, motif..."
          className="pl-10"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>
          ) : data?.results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Calendar className="h-10 w-10 mb-2 opacity-30" />
              <p>Aucun rendez-vous trouvé</p>
            </div>
          ) : (
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Patient</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Date / Heure</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Motif</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.results.map((r) => {
                  const dt = new Date(r.date_heure)
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-800">{r.patient_nom}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {dt.toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {r.duree_minutes ? ` · ${r.duree_minutes} min` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.motif || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium ${getStatutStyle(r.statut)}`}>
                          {r.statut_label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => confirm('Supprimer ce rendez-vous ?') && remove.mutate(r.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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
