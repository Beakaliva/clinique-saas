'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import type { Soin, SoinActe, PaginatedResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import PatientSelect from '@/components/ui/patient-select'
import { Plus, Search, Heart, User, ChevronLeft, ChevronRight, Pencil, Trash2, PlusCircle, XCircle, ArrowLeft } from 'lucide-react'

const STATUTS = [
  { value: 'planifie',  label: 'Planifié',  color: 'bg-blue-50 text-blue-700' },
  { value: 'en_cours',  label: 'En cours',  color: 'bg-yellow-50 text-yellow-700' },
  { value: 'effectue',  label: 'Effectué',  color: 'bg-green-50 text-green-700' },
  { value: 'annule',    label: 'Annulé',    color: 'bg-red-50 text-red-600' },
]

function getStatutStyle(statut: string) {
  return STATUTS.find(s => s.value === statut)?.color ?? 'bg-gray-100 text-gray-600'
}

function fmt(val: string | number) {
  return Number(val).toLocaleString('fr-FR') + ' GNF'
}

interface FormData {
  type_soin: string
  date: string
  description: string
  notes: string
  statut: string
  actes: { acte: string; qte: number; prix: number }[]
}

function fetchSoins(search: string, page: number, consultationId?: number | null) {
  const params: Record<string, unknown> = { search, page }
  if (consultationId) params.consultation = consultationId
  return api.get<PaginatedResponse<Soin>>('/soins/', { params }).then(r => r.data)
}

async function fetchConsultationInfo(id: number) {
  const r = await api.get(`/consultations/${id}/`)
  return r.data as { id: number; patient_nom: string; motif: string; date: string }
}

async function saveActes(soinId: number, actes: FormData['actes'], existingActes: SoinActe[]) {
  // Supprimer les anciens actes
  await Promise.all(existingActes.map(a => api.delete(`/soins/${soinId}/actes/${a.id}/`)))
  // Créer les nouveaux
  await Promise.all(actes.map(a => api.post(`/soins/${soinId}/actes/`, a)))
}

export default function SoinsPage() {
  const qc = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const consultationParam = searchParams.get('consultation')
  const consultationId = consultationParam ? Number(consultationParam) : null

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Soin | null>(null)
  const [patientId, setPatientId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['soins', search, page, consultationId],
    queryFn: () => fetchSoins(search, page, consultationId),
  })

  const { data: consultationInfo } = useQuery({
    queryKey: ['consultation-info', consultationId],
    queryFn: () => fetchConsultationInfo(consultationId!),
    enabled: !!consultationId,
  })

  const { register, handleSubmit, reset, setValue, control, watch } = useForm<FormData>({
    defaultValues: { actes: [] }
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'actes' })

  const actes = watch('actes')
  const totalLocal = actes.reduce((s, a) => s + (Number(a.qte) || 0) * (Number(a.prix) || 0), 0)

  const save = useMutation({
    mutationFn: async (d: FormData) => {
      const payload = { type_soin: d.type_soin, date: d.date, description: d.description, notes: d.notes, statut: d.statut }
      let soin: Soin
      if (editing) {
        soin = await api.patch<Soin>(`/soins/${editing.id}/`, payload).then(r => r.data)
        await saveActes(soin.id, d.actes, editing.actes)
      } else {
        soin = await api.post<Soin>('/soins/', { ...payload, patient: patientId! }).then(r => r.data)
        await Promise.all(d.actes.map(a => api.post(`/soins/${soin.id}/actes/`, a)))
      }
      return soin
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['soins'] })
      setOpen(false); reset({ actes: [] }); setEditing(null); setPatientId(null)
    },
  })

  const remove_soin = useMutation({
    mutationFn: (id: number) => api.delete(`/soins/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['soins'] }),
  })

  const openEdit = (s: Soin) => {
    setEditing(s)
    setPatientId(s.patient)
    setValue('type_soin', s.type_soin)
    setValue('date', s.date.slice(0, 16))
    setValue('description', s.description)
    setValue('notes', s.notes)
    setValue('statut', s.statut)
    setValue('actes', s.actes.map(a => ({ acte: a.acte, qte: a.qte, prix: Number(a.prix) })))
    setOpen(true)
  }

  const openNew = () => { setEditing(null); setPatientId(null); reset({ actes: [] }); setOpen(true) }

  const totalPages = data ? Math.ceil(data.count / 25) : 1

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {consultationId && (
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/consultations')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Soins</h1>
            {consultationId && consultationInfo ? (
              <p className="text-sm text-blue-600 font-medium">
                Consultation : {consultationInfo.patient_nom} — {consultationInfo.motif || new Date(consultationInfo.date).toLocaleDateString('fr-FR')}
              </p>
            ) : (
              <p className="text-gray-500 text-sm">{data?.count ?? 0} soin(s) enregistré(s)</p>
            )}
          </div>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPatientId(null); reset({ actes: [] }); setEditing(null) } }}>
          <DialogTrigger render={<Button onClick={openNew} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Nouveau soin</Button>} />
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier le soin' : 'Nouveau soin'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
              <div>
                <Label>Patient *</Label>
                <PatientSelect value={patientId} onChange={setPatientId} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type de soin</Label>
                  <Input {...register('type_soin')} placeholder="Pansement, injection..." />
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input type="datetime-local" {...register('date', { required: true })} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <textarea {...register('description')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" placeholder="Détails..." />
              </div>
              <div>
                <Label>Statut</Label>
                <select {...register('statut')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                  {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {/* Actes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Actes réalisés</Label>
                  <button type="button" onClick={() => append({ acte: '', qte: 1, prix: 0 })}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                    <PlusCircle className="h-3.5 w-3.5" /> Ajouter un acte
                  </button>
                </div>
                {fields.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">Aucun acte — cliquez sur "Ajouter un acte"</p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_60px_90px_28px] gap-2 text-xs font-semibold text-gray-500 px-1">
                      <span>Acte</span><span>Qté</span><span>Prix unit.</span><span></span>
                    </div>
                    {fields.map((f, i) => (
                      <div key={f.id} className="grid grid-cols-[1fr_60px_90px_28px] gap-2 items-center">
                        <Input {...register(`actes.${i}.acte`)} placeholder="Pansement..." className="h-7 text-xs" />
                        <Input type="number" {...register(`actes.${i}.qte`, { valueAsNumber: true })} min={1} className="h-7 text-xs" />
                        <Input type="number" {...register(`actes.${i}.prix`, { valueAsNumber: true })} min={0} placeholder="GNF" className="h-7 text-xs" />
                        <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600">
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {totalLocal > 0 && (
                      <div className="flex justify-end pt-1">
                        <span className="text-sm font-semibold text-gray-700">Total : {fmt(totalLocal)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label>Notes</Label>
                <textarea {...register('notes')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" placeholder="Observations..." />
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
          placeholder="Rechercher par patient, type de soin..."
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
              <Heart className="h-10 w-10 mb-2 opacity-30" />
              <p>Aucun soin trouvé</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Patient</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Type de soin</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actes</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Montant</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Consultation</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.results.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-800">{s.patient_nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.type_soin || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(s.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {s.actes.length > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">
                          {s.actes.length} acte{s.actes.length > 1 ? 's' : ''}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">
                      {Number(s.montant_total) > 0 ? fmt(s.montant_total) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 italic max-w-[140px] truncate">
                      {s.consultation_ref ? s.consultation_ref.motif : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium ${getStatutStyle(s.statut)}`}>
                        {s.statut_label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => confirm('Supprimer ce soin ?') && remove_soin.mutate(s.id)}>
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
