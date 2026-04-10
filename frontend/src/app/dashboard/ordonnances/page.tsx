'use client'

import { useState, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import api from '@/lib/api'
import type { Ordonnance, PaginatedResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import PatientSelect from '@/components/ui/patient-select'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, ClipboardList, User, ChevronLeft, ChevronRight, Pencil, Trash2, PlusCircle, XCircle } from 'lucide-react'

interface FormData {
  date: string
  notes: string
  lignes: { medicament: string; posologie: string; duree: string; quantite: number; notes: string }[]
}

function OrdonnancesContent() {
  const qc = useQueryClient()
  const searchParams = useSearchParams()
  const patientFilter = searchParams.get('patient') ? Number(searchParams.get('patient')) : null

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Ordonnance | null>(null)
  const [patientId, setPatientId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['ordonnances', search, page, patientFilter],
    queryFn: () => api.get<PaginatedResponse<Ordonnance>>('/ordonnances/', {
      params: { search, page, ...(patientFilter ? { patient: patientFilter } : {}) }
    }).then(r => r.data),
  })

  const { register, handleSubmit, reset, setValue, control } = useForm<FormData>({ defaultValues: { lignes: [] } })
  const { fields, append, remove } = useFieldArray({ control, name: 'lignes' })

  const save = useMutation({
    mutationFn: async (d: FormData) => {
      const payload = { date: d.date, notes: d.notes }
      if (editing) {
        const o = await api.patch<Ordonnance>(`/ordonnances/${editing.id}/`, payload).then(r => r.data)
        await Promise.all(editing.lignes.map(l => api.delete(`/ordonnances/${o.id}/lignes/${l.id}/`)))
        await Promise.all(d.lignes.map(l => api.post(`/ordonnances/${o.id}/lignes/`, l)))
        return o
      } else {
        const o = await api.post<Ordonnance>('/ordonnances/', { ...payload, patient: patientId! }).then(r => r.data)
        await Promise.all(d.lignes.map(l => api.post(`/ordonnances/${o.id}/lignes/`, l)))
        return o
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ordonnances'] }); setOpen(false); reset({ lignes: [] }); setEditing(null); setPatientId(null) },
  })

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/ordonnances/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ordonnances'] }),
  })

  const openEdit = (o: Ordonnance) => {
    setEditing(o); setPatientId(o.patient)
    setValue('date', o.date); setValue('notes', o.notes)
    setValue('lignes', o.lignes.map(l => ({ medicament: l.medicament, posologie: l.posologie, duree: l.duree, quantite: l.quantite, notes: l.notes })))
    setOpen(true)
  }

  const totalPages = data ? Math.ceil(data.count / 25) : 1

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ordonnances</h1>
          <p className="text-gray-500 text-sm">{data?.count ?? 0} ordonnance(s)</p>
        </div>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { reset({ lignes: [] }); setEditing(null); setPatientId(null) } }}>
          <DialogTrigger render={<Button className="flex items-center gap-2"><Plus className="h-4 w-4" /> Nouvelle ordonnance</Button>} />
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? 'Modifier l\'ordonnance' : 'Nouvelle ordonnance'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => save.mutate(d))}>
              <div className="max-h-[65vh] overflow-y-auto space-y-4 pr-1">
                <div><Label>Patient *</Label><PatientSelect value={patientId} onChange={setPatientId} required /></div>
                <div><Label>Date *</Label><Input type="date" {...register('date', { required: true })} /></div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Médicaments</Label>
                    <button type="button" onClick={() => append({ medicament: '', posologie: '', duree: '', quantite: 1, notes: '' })}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                      <PlusCircle className="h-3.5 w-3.5" /> Ajouter
                    </button>
                  </div>
                  {fields.length === 0
                    ? <p className="text-xs text-gray-400 text-center py-2">Aucun médicament</p>
                    : (
                      <div className="space-y-3">
                        {fields.map((f, i) => (
                          <div key={f.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-500">Médicament {i + 1}</span>
                              <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600"><XCircle className="h-4 w-4" /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div><Label className="text-xs">Médicament *</Label><Input {...register(`lignes.${i}.medicament`, { required: true })} placeholder="Paracétamol 500mg" className="h-7 text-xs" /></div>
                              <div><Label className="text-xs">Quantité</Label><Input type="number" min={1} {...register(`lignes.${i}.quantite`, { valueAsNumber: true })} className="h-7 text-xs" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div><Label className="text-xs">Posologie *</Label><Input {...register(`lignes.${i}.posologie`, { required: true })} placeholder="2 cp/jour" className="h-7 text-xs" /></div>
                              <div><Label className="text-xs">Durée</Label><Input {...register(`lignes.${i}.duree`)} placeholder="7 jours" className="h-7 text-xs" /></div>
                            </div>
                            <div><Label className="text-xs">Notes</Label><Input {...register(`lignes.${i}.notes`)} placeholder="Après les repas..." className="h-7 text-xs" /></div>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>
                <div><Label>Instructions générales</Label><textarea {...register('notes')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" /></div>
              </div>
              {save.isError && (
                <p className="text-xs text-red-500 mt-2">Erreur : vérifiez que tous les champs obligatoires sont remplis.</p>
              )}
              <div className="flex gap-3 justify-end pt-3 border-t border-gray-100 mt-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={save.isPending || !patientId}>{save.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Rechercher par patient..." className="pl-10" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? <div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>
            : data?.results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <ClipboardList className="h-10 w-10 mb-2 opacity-30" /><p>Aucune ordonnance</p>
              </div>
            ) : (
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Patient', 'Date', 'Médicaments', 'Médecin', 'Notes', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.results.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" /><span className="text-sm font-medium">{o.patient_nom}</span></div></td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(o.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                          {o.lignes.length} médicament{o.lignes.length > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{o.medecin_nom || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-400 italic max-w-[200px] truncate">{o.notes || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(o)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => confirm('Supprimer ?') && del.mutate(o.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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

export default function OrdonnancesPage() {
  return <Suspense fallback={<div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>}><OrdonnancesContent /></Suspense>
}
