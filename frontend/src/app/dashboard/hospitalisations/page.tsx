'use client'

import { useState, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import type { Hospitalisation, PaginatedResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import PatientSelect from '@/components/ui/patient-select'
import { Plus, Search, BedDouble, User, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'

const STATUTS = [
  { value: 'en_cours',  label: 'En cours',       color: 'bg-blue-50 text-blue-700' },
  { value: 'sortie',    label: 'Sorti(e)',        color: 'bg-green-50 text-green-700' },
  { value: 'transfere', label: 'Transféré(e)',    color: 'bg-yellow-50 text-yellow-700' },
  { value: 'annule',    label: 'Annulé',          color: 'bg-red-50 text-red-600' },
]

interface FormData {
  chambre: string
  motif: string
  date_entree: string
  date_sortie_prevue: string
  date_sortie_reelle: string
  statut: string
  notes: string
}

function HospitalisationsContent() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Hospitalisation | null>(null)
  const [patientId, setPatientId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['hospitalisations', search, page],
    queryFn: () => api.get<PaginatedResponse<Hospitalisation>>('/hospitalisations/', { params: { search, page } }).then(r => r.data),
  })

  const { register, handleSubmit, reset, setValue } = useForm<FormData>({ defaultValues: { statut: 'en_cours' } })

  const save = useMutation({
    mutationFn: (d: FormData) => {
      const payload = {
        ...d,
        date_sortie_prevue: d.date_sortie_prevue || null,
        date_sortie_reelle: d.date_sortie_reelle || null,
      }
      return editing
        ? api.patch<Hospitalisation>(`/hospitalisations/${editing.id}/`, payload).then(r => r.data)
        : api.post<Hospitalisation>('/hospitalisations/', { ...payload, patient: patientId! }).then(r => r.data)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hospitalisations'] }); setOpen(false); reset(); setEditing(null); setPatientId(null) },
  })

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/hospitalisations/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospitalisations'] }),
  })

  const openEdit = (h: Hospitalisation) => {
    setEditing(h); setPatientId(h.patient)
    setValue('chambre', h.chambre); setValue('motif', h.motif)
    setValue('date_entree', h.date_entree.slice(0, 16))
    setValue('date_sortie_prevue', h.date_sortie_prevue || '')
    setValue('date_sortie_reelle', h.date_sortie_reelle ? h.date_sortie_reelle.slice(0, 16) : '')
    setValue('statut', h.statut); setValue('notes', h.notes)
    setOpen(true)
  }

  const totalPages = data ? Math.ceil(data.count / 25) : 1

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hospitalisations</h1>
          <p className="text-gray-500 text-sm">{data?.count ?? 0} hospitalisation(s)</p>
        </div>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { reset(); setEditing(null); setPatientId(null) } }}>
          <DialogTrigger render={<Button className="flex items-center gap-2"><Plus className="h-4 w-4" /> Nouvelle hospitalisation</Button>} />
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Modifier l\'hospitalisation' : 'Nouvelle hospitalisation'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-4">
              <div><Label>Patient *</Label><PatientSelect value={patientId} onChange={setPatientId} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Chambre / Lit</Label><Input {...register('chambre')} placeholder="Chambre 12 / Lit A" /></div>
                <div><Label>Statut</Label>
                  <select {...register('statut')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                    {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div><Label>Motif *</Label><textarea {...register('motif', { required: true })} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" placeholder="Motif d'hospitalisation..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date d'entrée *</Label><Input type="datetime-local" {...register('date_entree', { required: true })} /></div>
                <div><Label>Sortie prévue</Label><Input type="date" {...register('date_sortie_prevue')} /></div>
              </div>
              <div><Label>Date de sortie réelle</Label><Input type="datetime-local" {...register('date_sortie_reelle')} /></div>
              <div><Label>Notes / Évolution</Label><textarea {...register('notes')} rows={3} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" /></div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={save.isPending || !patientId}>{save.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Rechercher par patient, motif..." className="pl-10" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? <div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>
            : data?.results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <BedDouble className="h-10 w-10 mb-2 opacity-30" /><p>Aucune hospitalisation</p>
              </div>
            ) : (
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Patient', 'Chambre', 'Motif', 'Entrée', 'Durée', 'Statut', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.results.map(h => (
                    <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" /><span className="text-sm font-medium">{h.patient_nom}</span></div></td>
                      <td className="px-4 py-3 text-sm text-gray-600">{h.chambre || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[180px] truncate">{h.motif}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(h.date_entree).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{h.duree_jours} j</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${STATUTS.find(s => s.value === h.statut)?.color ?? 'bg-gray-100 text-gray-600'}`}>{h.statut_label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(h)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => confirm('Supprimer ?') && del.mutate(h.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} / {totalPages}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HospitalisationsPage() {
  return <Suspense fallback={<div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>}><HospitalisationsContent /></Suspense>
}
