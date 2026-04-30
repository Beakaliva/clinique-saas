'use client'

import { useState, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { useClinicAccess } from '@/hooks/use-clinic-access'
import api from '@/lib/api'
import type { ExamenRadio, PaginatedResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateTimeInput } from '@/components/ui/datetime-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import PatientSelect from '@/components/ui/patient-select'
import { Pagination } from '@/components/ui/pagination'
import { Plus, Search, Radiation, User, Pencil, Trash2, Clock, CheckCircle2, XCircle, ScanLine } from 'lucide-react'
import { StatCards, type StatDef } from '@/components/ui/stat-cards'

const RADIO_STATS: StatDef[] = [
  { label: 'Total examens', endpoint: '/radiologie/', icon: ScanLine,   color: 'bg-cyan-50 text-cyan-600' },
  { label: 'En attente',    endpoint: '/radiologie/', params: { statut: 'en_attente' }, icon: Clock,        color: 'bg-yellow-50 text-yellow-600' },
  { label: 'Réalisés',      endpoint: '/radiologie/', params: { statut: 'realise' },    icon: CheckCircle2, color: 'bg-blue-50 text-blue-600' },
  { label: 'Interprétés',   endpoint: '/radiologie/', params: { statut: 'interprete' }, icon: Radiation,    color: 'bg-green-50 text-green-600' },
]

const STATUTS = [
  { value: 'en_attente', label: 'En attente', color: 'bg-yellow-50 text-yellow-700' },
  { value: 'realise',    label: 'Réalisé',    color: 'bg-blue-50 text-blue-700' },
  { value: 'interprete', label: 'Interprété', color: 'bg-green-50 text-green-700' },
  { value: 'annule',     label: 'Annulé',     color: 'bg-red-50 text-red-600' },
]

interface FormData {
  type_examen: string
  date: string
  compte_rendu: string
  statut: string
  notes: string
}

function RadiologieContent() {
  const qc = useQueryClient()
  const { hasAccess } = useClinicAccess()
    const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ExamenRadio | null>(null)
  const [patientId, setPatientId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['examens-radio', search, page],
    queryFn: () => api.get<PaginatedResponse<ExamenRadio>>('/radiologie/', { params: { search, page } }).then(r => r.data),
  })

  const { register, handleSubmit, reset, setValue, control } = useForm<FormData>({ defaultValues: { statut: 'en_attente' } })

  const save = useMutation({
    mutationFn: (d: FormData) => editing
      ? api.patch<ExamenRadio>(`/radiologie/${editing.id}/`, d).then(r => r.data)
      : api.post<ExamenRadio>('/radiologie/', { ...d, patient: patientId! }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['examens-radio'] }); setOpen(false); reset(); setEditing(null); setPatientId(null) },
  })

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/radiologie/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['examens-radio'] }),
  })

  const openEdit = (e: ExamenRadio) => {
    setEditing(e); setPatientId(e.patient)
    setValue('type_examen', e.type_examen)
    setValue('date', e.date.slice(0, 16))
    setValue('compte_rendu', e.compte_rendu)
    setValue('statut', e.statut)
    setValue('notes', e.notes)
    setOpen(true)
  }

  const totalPages = data ? Math.ceil(data.count / 25) : 1

  return (
    <div className="space-y-5">
      <StatCards stats={RADIO_STATS} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Radiologie</h1>
          <p className="text-gray-500 text-sm">{data?.count ?? 0} examen(s)</p>
        </div>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { reset(); setEditing(null); setPatientId(null) } }}>
          <DialogTrigger render={<Button className="flex items-center gap-2"><Plus className="h-4 w-4" /> Nouvel examen</Button>} />
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Modifier l\'examen' : 'Nouvel examen radio'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-4">
              <div><Label>Patient *</Label><PatientSelect value={patientId} onChange={setPatientId} required /></div>
              <div><Label>Type d'examen *</Label><Input {...register('type_examen', { required: true })} placeholder="Radiographie, Échographie, Scanner..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date *</Label><Controller control={control} name="date" rules={{ required: true }} render={({ field }) => <DateTimeInput name={field.name} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} />} /></div>
                <div><Label>Statut</Label>
                  <select {...register('statut')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                    {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div><Label>Compte rendu</Label><textarea {...register('compte_rendu')} rows={4} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" placeholder="Interprétation radiologique..." /></div>
              <div><Label>Notes</Label><textarea {...register('notes')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" /></div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={!hasAccess || save.isPending || !patientId}>{save.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
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
                <Radiation className="h-10 w-10 mb-2 opacity-30" /><p>Aucun examen radiologique</p>
              </div>
            ) : (
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Patient', "Type d'examen", 'Date', 'Compte rendu', 'Statut', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.results.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" /><span className="text-sm font-medium">{e.patient_nom}</span></div></td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">{e.type_examen}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(e.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{e.compte_rendu || '—'}</td>
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

      <Pagination
        page={page}
        totalPages={totalPages}
        count={data?.count}
        onPageChange={setPage}
      />
    </div>
  )
}

export default function RadiologiePage() {
  return <Suspense fallback={<div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>}><RadiologieContent /></Suspense>
}
