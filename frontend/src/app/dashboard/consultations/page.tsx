'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import api from '@/lib/api'
import type { Consultation, Soin, SoinActe, PaginatedResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import PatientSelect from '@/components/ui/patient-select'
import {
  Plus, Search, Stethoscope, User, ChevronLeft, ChevronRight,
  Pencil, Trash2, Heart, ArrowLeft, CheckCircle2, Clock, XCircle, HeartPulse,
  PlusCircle, XCircle as XCircleIcon,
} from 'lucide-react'

// ── Statuts ──────────────────────────────────────────────────────────────

const STATUTS_CONSULT = [
  { value: 'en_attente', label: 'En attente',  color: 'bg-yellow-50 text-yellow-700' },
  { value: 'en_cours',   label: 'En cours',    color: 'bg-blue-50 text-blue-700' },
  { value: 'terminee',   label: 'Terminée',    color: 'bg-green-50 text-green-700' },
  { value: 'annulee',    label: 'Annulée',     color: 'bg-red-50 text-red-600' },
]

const STATUTS_SOIN = [
  { value: 'planifie',  label: 'Planifié',  color: 'bg-blue-50 text-blue-700' },
  { value: 'en_cours',  label: 'En cours',  color: 'bg-yellow-50 text-yellow-700' },
  { value: 'effectue',  label: 'Effectué',  color: 'bg-green-50 text-green-700' },
  { value: 'annule',    label: 'Annulé',    color: 'bg-red-50 text-red-600' },
]

function statutStyle(val: string, list: typeof STATUTS_CONSULT) {
  return list.find(s => s.value === val)?.color ?? 'bg-gray-100 text-gray-600'
}

function statutLabel(val: string, list: typeof STATUTS_CONSULT) {
  return list.find(s => s.value === val)?.label ?? val
}

// ── Fetchers ──────────────────────────────────────────────────────────────

function fetchConsultations(search: string, page: number) {
  return api.get<PaginatedResponse<Consultation>>('/consultations/', { params: { search, page } }).then(r => r.data)
}

function fetchSoinsByConsultation(consultationId: number) {
  return api.get<PaginatedResponse<Soin>>('/soins/', { params: { consultation: consultationId, page_size: 50 } }).then(r => r.data.results)
}

// ── Types formulaire soin ─────────────────────────────────────────────────

interface SoinFormData {
  type_soin: string
  date: string
  description: string
  notes: string
  statut: string
  actes: { acte: string; qte: number; prix: number }[]
}

async function saveActes(soinId: number, actes: SoinFormData['actes'], existing: SoinActe[]) {
  await Promise.all(existing.map(a => api.delete(`/soins/${soinId}/actes/${a.id}/`)))
  await Promise.all(actes.map(a => api.post(`/soins/${soinId}/actes/`, a)))
}

function fmt(val: string | number) {
  return Number(val).toLocaleString('fr-FR') + ' GNF'
}

// ── Panel soins d'une consultation ────────────────────────────────────────

function SoinsPanel({ consultation, onBack, autoOpen = false }: { consultation: Consultation; onBack: () => void; autoOpen?: boolean }) {
  const qc = useQueryClient()
  const [openSoin, setOpenSoin] = useState(autoOpen)
  const [editingSoin, setEditingSoin] = useState<Soin | null>(null)

  const { data: soins = [], isLoading } = useQuery({
    queryKey: ['soins-consult', consultation.id],
    queryFn: () => fetchSoinsByConsultation(consultation.id),
  })

  const { register, handleSubmit, reset, setValue, control, watch } = useForm<SoinFormData>({
    defaultValues: { actes: [] }
  })
  const { fields, append, remove: removeField } = useFieldArray({ control, name: 'actes' })
  const actes = watch('actes')
  const totalLocal = actes.reduce((s, a) => s + (Number(a.qte) || 0) * (Number(a.prix) || 0), 0)

  const save = useMutation({
    mutationFn: async (d: SoinFormData) => {
      const payload = { type_soin: d.type_soin, date: d.date, description: d.description, notes: d.notes, statut: d.statut }
      let soin: Soin
      if (editingSoin) {
        soin = await api.patch<Soin>(`/soins/${editingSoin.id}/`, payload).then(r => r.data)
        await saveActes(soin.id, d.actes, editingSoin.actes)
      } else {
        soin = await api.post<Soin>('/soins/', { ...payload, patient: consultation.patient, consultation: consultation.id }).then(r => r.data)
        await Promise.all(d.actes.map(a => api.post(`/soins/${soin.id}/actes/`, a)))
      }
      return soin
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['soins-consult', consultation.id] })
      qc.invalidateQueries({ queryKey: ['soins'] })
      setOpenSoin(false)
      reset({ actes: [] })
      setEditingSoin(null)
    },
  })

  const removeSoin = useMutation({
    mutationFn: (id: number) => api.delete(`/soins/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['soins-consult', consultation.id] }),
  })

  const openEdit = (s: Soin) => {
    setEditingSoin(s)
    setValue('type_soin', s.type_soin)
    setValue('date', s.date.slice(0, 16))
    setValue('description', s.description)
    setValue('notes', s.notes)
    setValue('statut', s.statut)
    setValue('actes', s.actes.map(a => ({ acte: a.acte, qte: a.qte, prix: Number(a.prix) })))
    setOpenSoin(true)
  }

  const openNew = () => { setEditingSoin(null); reset({ actes: [] }); setOpenSoin(true) }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">Soins de la consultation</h1>
          <p className="text-sm text-gray-500">{consultation.patient_nom} — {new Date(consultation.date).toLocaleDateString('fr-FR')}</p>
        </div>
        <Dialog open={openSoin} onOpenChange={(v) => { setOpenSoin(v); if (!v) { reset({ actes: [] }); setEditingSoin(null) } }}>
          <DialogTrigger render={<Button onClick={openNew} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Ajouter un soin</Button>} />
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingSoin ? 'Modifier le soin' : 'Nouveau soin'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
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
                <textarea {...register('description')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" placeholder="Détails du soin..." />
              </div>
              <div>
                <Label>Statut</Label>
                <select {...register('statut')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                  {STATUTS_SOIN.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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
                  <p className="text-xs text-gray-400 text-center py-2 border border-dashed border-gray-200 rounded-lg">
                    Aucun acte — cliquez sur "Ajouter un acte"
                  </p>
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
                        <button type="button" onClick={() => removeField(i)} className="text-red-400 hover:text-red-600">
                          <XCircleIcon className="h-4 w-4" />
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
                <Button type="button" variant="outline" onClick={() => setOpenSoin(false)}>Annuler</Button>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info consultation */}
      <Card className="border-0 shadow-sm bg-blue-50/50">
        <CardContent className="p-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">Motif</p>
            <p className="font-medium text-gray-800">{consultation.motif || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Diagnostic</p>
            <p className="font-medium text-gray-800">{consultation.diagnostic || '—'}</p>
          </div>
          {consultation.notes && (
            <div className="col-span-2">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-gray-700">{consultation.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste soins */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-0 px-4 pt-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-500" />
            Soins ({soins.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-24 text-gray-400 text-sm">Chargement...</div>
          ) : soins.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-gray-400">
              <Heart className="h-8 w-8 mb-1 opacity-25" />
              <p className="text-sm">Aucun soin pour cette consultation</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Type de soin</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actes</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Montant</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {soins.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{s.type_soin || '—'}</td>
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
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium ${statutStyle(s.statut, STATUTS_SOIN)}`}>
                        {statutLabel(s.statut, STATUTS_SOIN)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => confirm('Supprimer ce soin ?') && removeSoin.mutate(s.id)}>
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
    </div>
  )
}

// ── Page principale consultations ─────────────────────────────────────────

export default function ConsultationsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Consultation | null>(null)
  const [viewSoins, setViewSoins] = useState<Consultation | null>(null)
  const [autoOpenSoin, setAutoOpenSoin] = useState(false)
  const [patientId, setPatientId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['consultations', search, page],
    queryFn: () => fetchConsultations(search, page),
  })

  const { register, handleSubmit, reset, setValue } = useForm<Partial<Consultation>>()

  const save = useMutation({
    mutationFn: (d: Partial<Consultation>) =>
      editing
        ? api.patch(`/consultations/${editing.id}/`, d).then(r => r.data)
        : api.post('/consultations/', { ...d, patient: patientId! }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultations'] })
      setOpen(false); reset(); setEditing(null); setPatientId(null)
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/consultations/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consultations'] }),
  })

  const openEdit = (c: Consultation) => {
    setEditing(c)
    setPatientId(c.patient)
    Object.entries(c).forEach(([k, v]) => setValue(k as keyof Consultation, v as string))
    setOpen(true)
  }

  const openNew = () => { setEditing(null); setPatientId(null); reset(); setOpen(true) }

  const totalPages = data ? Math.ceil(data.count / 25) : 1

  // Afficher le panel soins si une consultation est sélectionnée
  if (viewSoins) {
    return (
      <SoinsPanel
        consultation={viewSoins}
        autoOpen={autoOpenSoin}
        onBack={() => { setViewSoins(null); setAutoOpenSoin(false) }}
      />
    )
  }

  function StatutIcon({ statut }: { statut: string }) {
    if (statut === 'terminee') return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
    if (statut === 'annulee')  return <XCircle className="h-3.5 w-3.5 text-red-400" />
    return <Clock className="h-3.5 w-3.5 text-blue-400" />
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Consultations</h1>
          <p className="text-gray-500 text-sm">{data?.count ?? 0} consultation(s) enregistrée(s)</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPatientId(null); reset(); setEditing(null) } }}>
          <DialogTrigger render={<Button onClick={openNew} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Nouvelle consultation</Button>} />
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier la consultation' : 'Nouvelle consultation'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
              <div>
                <Label>Patient *</Label>
                <PatientSelect
                  value={patientId}
                  onChange={(id) => setPatientId(id)}
                  required
                />
              </div>
              <div>
                <Label>Date *</Label>
                <Input type="datetime-local" {...register('date', { required: true })} />
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
                  {STATUTS_CONSULT.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Notes</Label>
                <textarea {...register('notes')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" placeholder="Notes cliniques..." />
              </div>
              <div className={`flex gap-3 ${editing ? 'justify-between' : 'justify-end'}`}>
                {editing && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                    onClick={() => {
                      setOpen(false)
                      setAutoOpenSoin(true)
                      setViewSoins(editing)
                    }}
                  >
                    <HeartPulse className="h-4 w-4" />
                    Créer un soin
                  </Button>
                )}
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                  <Button type="submit" disabled={save.isPending || !patientId}>
                    {save.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
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
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => setViewSoins(c)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-800">{c.patient_nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {c.date ? new Date(c.date).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{c.motif || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.medecin_nom || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${statutStyle(c.statut, STATUTS_CONSULT)}`}>
                        <StatutIcon statut={c.statut} />
                        {statutLabel(c.statut, STATUTS_CONSULT)}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" title="Voir les soins" onClick={() => setViewSoins(c)}>
                          <Heart className="h-3.5 w-3.5 text-rose-400" />
                        </Button>
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
