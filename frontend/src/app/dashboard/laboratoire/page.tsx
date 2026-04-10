'use client'

import { useState, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import type { ExamenLabo, PaginatedResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import PatientSelect from '@/components/ui/patient-select'
import { Plus, Search, FlaskConical, User, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'

const STATUTS = [
  { value: 'en_attente', label: 'En attente', color: 'bg-yellow-50 text-yellow-700' },
  { value: 'en_cours',   label: 'En cours',   color: 'bg-blue-50 text-blue-700' },
  { value: 'termine',    label: 'Terminé',    color: 'bg-green-50 text-green-700' },
  { value: 'annule',     label: 'Annulé',     color: 'bg-red-50 text-red-600' },
]

interface FormData {
  type_examen: string
  resultat: string
  valeurs_normales: string
  statut: string
  date_resultat: string
  notes: string
}

function LaboContent() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ExamenLabo | null>(null)
  const [patientId, setPatientId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['examens-labo', search, page],
    queryFn: () => api.get<PaginatedResponse<ExamenLabo>>('/laboratoire/', { params: { search, page } }).then(r => r.data),
  })

  const { register, handleSubmit, reset, setValue } = useForm<FormData>({ defaultValues: { statut: 'en_attente' } })

  const save = useMutation({
    mutationFn: (d: FormData) => {
      const payload = { ...d, date_resultat: d.date_resultat || null }
      return editing
        ? api.patch<ExamenLabo>(`/laboratoire/${editing.id}/`, payload).then(r => r.data)
        : api.post<ExamenLabo>('/laboratoire/', { ...payload, patient: patientId! }).then(r => r.data)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['examens-labo'] }); setOpen(false); reset(); setEditing(null); setPatientId(null) },
  })

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/laboratoire/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['examens-labo'] }),
  })

  const openEdit = (e: ExamenLabo) => {
    setEditing(e); setPatientId(e.patient)
    setValue('type_examen', e.type_examen); setValue('resultat', e.resultat)
    setValue('valeurs_normales', e.valeurs_normales); setValue('statut', e.statut)
    setValue('date_resultat', e.date_resultat ? e.date_resultat.slice(0, 16) : '')
    setValue('notes', e.notes)
    setOpen(true)
  }

  const totalPages = data ? Math.ceil(data.count / 25) : 1

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laboratoire</h1>
          <p className="text-gray-500 text-sm">{data?.count ?? 0} examen(s)</p>
        </div>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { reset(); setEditing(null); setPatientId(null) } }}>
          <DialogTrigger render={<Button className="flex items-center gap-2"><Plus className="h-4 w-4" /> Nouvel examen</Button>} />
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Modifier l\'examen' : 'Nouvel examen labo'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-4">
              <div><Label>Patient *</Label><PatientSelect value={patientId} onChange={setPatientId} required /></div>
              <div><Label>Type d'examen *</Label><Input {...register('type_examen', { required: true })} placeholder="NFS, Glycémie, Créatinine..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Statut</Label>
                  <select {...register('statut')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                    {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div><Label>Date résultat</Label><Input type="datetime-local" {...register('date_resultat')} /></div>
              </div>
              <div><Label>Résultat</Label><textarea {...register('resultat')} rows={3} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" placeholder="Résultats de l'analyse..." /></div>
              <div><Label>Valeurs normales</Label><Input {...register('valeurs_normales')} placeholder="Ex: 4.5 - 5.5 g/dL" /></div>
              <div><Label>Notes</Label><textarea {...register('notes')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" /></div>
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
        <Input placeholder="Rechercher par patient, type d'examen..." className="pl-10" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? <div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>
            : data?.results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <FlaskConical className="h-10 w-10 mb-2 opacity-30" /><p>Aucun examen</p>
              </div>
            ) : (
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Patient', "Type d'examen", 'Demande', 'Résultat', 'Statut', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.results.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" /><span className="text-sm font-medium">{e.patient_nom}</span></div></td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">{e.type_examen}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(e.date_demande).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{e.resultat || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${STATUTS.find(s => s.value === e.statut)?.color ?? 'bg-gray-100 text-gray-600'}`}>{e.statut_label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => confirm('Supprimer ?') && del.mutate(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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

export default function LaboPage() {
  return <Suspense fallback={<div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>}><LaboContent /></Suspense>
}
